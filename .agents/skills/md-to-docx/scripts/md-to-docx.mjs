#!/usr/bin/env node
/**
 * Markdown (.md) to Word (.docx / .doc) Converter for Spider Express Logistics TMS
 *
 * Priority 1 (.docx - Default):
 *   Uses Python `python-docx` engine (`md_to_docx_engine.py`) which builds from a genuine
 *   Microsoft Word `default.docx` template, uses native OOXML Paragraph Shading (<w:shd>)
 *   and Paragraph Borders (<w:pBdr>) instead of 1-cell percentage tables, and enforces strict
 *   integer DXA twips (<w:tblW w:type="dxa">, <w:gridCol>, <w:tcW w:type="dxa">) so layout
 *   is 100% intact in both WPS Office and Microsoft Word.
 *
 * Priority 2 (.doc - Fallback):
 *   Generates WPS/Word-compatible MSO HTML (.doc) when `--format doc` or `.doc` output is specified.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Hard timeout guard (RULE-ANTI-HANG-EXEC-01)
setTimeout(() => {
  console.error('[md-to-docx] Execution timed out after 15s.');
  process.exit(1);
}, 15000).unref();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PY_ENGINE = path.join(__dirname, 'md_to_docx_engine.py');

function parseArgs(argv) {
  const args = argv.slice(2);
  const positional = [];
  const options = {
    format: null, // 'docx' (default), 'doc', or 'both'
    title: null,
    subtitle: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--format' && args[i + 1]) {
      options.format = args[++i].toLowerCase();
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1].toLowerCase();
    } else if (arg === '--title' && args[i + 1]) {
      options.title = args[++i];
    } else if (arg.startsWith('--title=')) {
      options.title = arg.split('=')[1];
    } else if (arg === '--subtitle' && args[i + 1]) {
      options.subtitle = args[++i];
    } else if (arg.startsWith('--subtitle=')) {
      options.subtitle = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  return { positional, options };
}

function cleanTextForHtml(raw) {
  return (raw || '')
    .replace(/\\\$/g, '$')
    .replace(/\$([A-Za-z0-9_+\-*/=]+)\$/g, '$1')
    .replace(/<br\s*\/?>/gi, ' — ')
    .replace(/`\.{6,}`/g, '.....................................................................................................................');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInlineHtml(raw) {
  return escapeHtml(cleanTextForHtml(raw))
    .replace(/`\[x\]`/gi, '<span style="font-size:13pt;color:#0F3D62;font-weight:bold;">☑</span>')
    .replace(/`\[ \]`/g, '<span style="font-size:13pt;color:#1E293B;font-weight:bold;">☐</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(
      /`([^`]+)`/g,
      '<span style="font-family:Consolas,monospace;background:#F1F5F9;padding:1px 4px;color:#0F3D62;">$1</span>'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:#1D4ED8;text-decoration:underline;">$1</a>'
    );
}

function generateWpsCompatibleDocHtml(mdContent, customTitle) {
  const lines = mdContent.replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks = [];
  let docTitle = customTitle || 'Tài Liệu Nghiệp Vụ — Spider Express TMS';
  let titleConsumed = false;
  let i = 0;

  if (lines[0]?.trim() === '---') {
    let endYaml = 1;
    while (endYaml < lines.length && lines[endYaml].trim() !== '---') endYaml++;
    if (endYaml < lines.length) i = endYaml + 1;
  }

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim().toLowerCase();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      if (lang === 'mermaid') continue;
      htmlBlocks.push(
        `<pre style="background:#F1F5F9;border-left:4px solid #0F3D62;padding:8px 12px;font-family:Consolas,monospace;font-size:9.5pt;">${escapeHtml(codeLines.join('\n'))}</pre>`
      );
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tLines.push(lines[i]);
        i++;
      }
      const rows = tLines
        .map((l) =>
          l
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim())
        )
        .filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ''));
      if (rows.length > 0) {
        let tbl = '<table>';
        rows.forEach((r, rIdx) => {
          tbl += '<tr>';
          r.forEach((c) => {
            tbl +=
              rIdx === 0
                ? `<th>${formatInlineHtml(c)}</th>`
                : `<td style="background:${rIdx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'};">${formatInlineHtml(c)}</td>`;
          });
          tbl += '</tr>';
        });
        tbl += '</table>';
        htmlBlocks.push(tbl);
      }
      continue;
    }

    if (trimmed.startsWith('>')) {
      const qLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const cleanQ = lines[i].trim().replace(/^>\s?/, '').replace(/^\[![A-Z]+\]\s*/i, '');
        if (cleanQ) qLines.push(formatInlineHtml(cleanQ));
        i++;
      }
      if (qLines.length > 0) {
        htmlBlocks.push(
          `<div style="background:#EFF6FF;border-left:4px solid #1D4ED8;padding:8px 12px;margin:8px 0;">${qLines.join('<br/>')}</div>`
        );
      }
      continue;
    }

    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      const lvl = hMatch[1].length;
      const hTxt = formatInlineHtml(hMatch[2]);
      if (lvl === 1 && !titleConsumed) {
        docTitle = customTitle || hMatch[2].trim();
        titleConsumed = true;
        htmlBlocks.push(
          `<h1 style="text-align:center;color:#0F3D62;font-size:16pt;border-bottom:2px solid #0F3D62;padding-bottom:8px;margin-bottom:10px;">${hTxt}</h1>`
        );
      } else if (lvl <= 2) {
        htmlBlocks.push(
          `<h2 style="background:#0F3D62;color:#ffffff;padding:8px 12px;font-size:12.5pt;margin-top:20px;margin-bottom:10px;">${hTxt}</h2>`
        );
      } else if (lvl === 3) {
        htmlBlocks.push(
          `<h3 style="color:#0F3D62;font-size:11.5pt;border-left:4px solid #0284C7;padding-left:8px;margin-bottom:6px;margin-top:14px;">${hTxt}</h3>`
        );
      } else {
        htmlBlocks.push(
          `<h4 style="color:#1D4ED8;font-size:11pt;margin-top:10px;margin-bottom:4px;">${hTxt}</h4>`
        );
      }
      i++;
      continue;
    }

    if (/^(\s*)([-*+]|\d+\.)\s+/.test(rawLine)) {
      const content = trimmed.replace(/^([-*+]|\d+\.)\s+/, '');
      if (content.includes('👉') || content.includes('Chốt của Vận hành')) {
        htmlBlocks.push(
          `<p style="margin:6px 0 10px 12px;background:#F8FAFC;padding:6px 10px;border:1px dashed #CBD5E1;">${formatInlineHtml(content)}</p>`
        );
      } else if (/^`?\[([ xX])\]`?\s+/.test(content)) {
        htmlBlocks.push(
          `<p style="margin:4px 0 4px 24px;">${formatInlineHtml(content)}</p>`
        );
      } else {
        htmlBlocks.push(
          `<p style="margin:4px 0 4px 12px;">• ${formatInlineHtml(content)}</p>`
        );
      }
      i++;
      continue;
    }

    if (trimmed.includes('👉') || trimmed.includes('Chốt của Vận hành')) {
      htmlBlocks.push(
        `<p style="margin:6px 0 10px 12px;background:#F8FAFC;padding:6px 10px;border:1px dashed #CBD5E1;">${formatInlineHtml(trimmed)}</p>`
      );
      i++;
      continue;
    }

    htmlBlocks.push(`<p style="margin:4px 0 6px 0;">${formatInlineHtml(trimmed)}</p>`);
    i++;
  }

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>${escapeHtml(docTitle)}</title>
<style>
  @page { size: 21cm 29.7cm; margin: 1.8cm; }
  body { font-family: "Segoe UI", "Times New Roman", sans-serif; font-size: 11pt; line-height: 1.45; color: #1E293B; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th { background: #0F3D62; color: #FFFFFF; padding: 7px 10px; border: 1px solid #CBD5E1; text-align: left; font-size: 10pt; }
  td { padding: 7px 10px; border: 1px solid #CBD5E1; font-size: 10pt; vertical-align: top; }
</style>
</head>
<body>
${htmlBlocks.join('\n')}
</body>
</html>`;
}

function main() {
  const { positional, options } = parseArgs(process.argv);

  if (positional.length === 0) {
    console.error(
      'Usage: node .agents/skills/md-to-docx/scripts/md-to-docx.mjs <input.md> [output.docx|.doc] [--format docx|doc|both] [--title "Title"]'
    );
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), positional[0]);
  if (!fs.existsSync(inputPath)) {
    console.error(`[md-to-docx] Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const mdDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const explicitOut = positional[1] ? path.resolve(process.cwd(), positional[1]) : null;

  let format = options.format;
  if (!format) {
    if (explicitOut && explicitOut.toLowerCase().endsWith('.doc')) {
      format = 'doc';
    } else {
      format = 'docx';
    }
  }

  if (format === 'docx' || format === 'both') {
    const docxOutPath =
      explicitOut && explicitOut.toLowerCase().endsWith('.docx')
        ? explicitOut
        : explicitOut && format === 'both'
          ? explicitOut.replace(/\.doc$/i, '.docx')
          : path.join(mdDir, `${baseName}.docx`);

    const pyArgs = ['-X', 'utf8', PY_ENGINE, inputPath, docxOutPath];
    if (options.title) pyArgs.push('--title', options.title);
    if (options.subtitle) pyArgs.push('--subtitle', options.subtitle);

    const res = spawnSync('python', pyArgs, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });

    if (res.status !== 0) {
      console.error('[md-to-docx] Python DOCX engine failed.');
      process.exit(res.status || 1);
    }
  }

  if (format === 'doc' || format === 'both') {
    const docOutPath =
      explicitOut && explicitOut.toLowerCase().endsWith('.doc')
        ? explicitOut
        : explicitOut && format === 'both'
          ? explicitOut.replace(/\.docx$/i, '.doc')
          : path.join(mdDir, `${baseName}.doc`);

    const mdContent = fs.readFileSync(inputPath, 'utf8');
    const htmlDoc = generateWpsCompatibleDocHtml(mdContent, options.title);
    fs.mkdirSync(path.dirname(docOutPath), { recursive: true });
    fs.writeFileSync(docOutPath, htmlDoc, 'utf8');
    const sizeKB = (Buffer.byteLength(htmlDoc, 'utf8') / 1024).toFixed(1);
    console.log(`✅ [DOC (WPS HTML)] Generated: ${docOutPath} (${sizeKB} KB)`);
  }
}

main();
