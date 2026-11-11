# -*- coding: utf-8 -*-
"""
WPS Office & Microsoft Word Safe Markdown-to-DOCX Engine (python-docx)
Eliminates all WPS Office layout bugs:
  1. Uses genuine Word default.docx template via python-docx.
  2. Never uses 1-cell layout tables with percentage widths (which collapse to 100 twips = 1.76mm in WPS Office).
  3. Uses native OOXML Paragraph Shading (<w:shd>) and Paragraph Borders (<w:pBdr>) for banners, callouts, code blocks, and sign-off boxes.
  4. Uses strict integer DXA twips (<w:tblW w:type="dxa">, <w:tblLayout w:type="fixed">, <w:gridCol>, <w:tcW w:type="dxa">) for all data tables.
  5. Avoids hanging-indent tab jumps in WPS Office and converts continuous backtick dots (`......`) into wrap-safe dotted lines.
"""

import os
import re
import sys
import argparse

sys.stdout.reconfigure(encoding="utf-8")

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Twips
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# Page Geometry Constants (A4: 21.0cm x 29.7cm = 11906 x 16838 twips)
PAGE_WIDTH_DXA = 11906
PAGE_HEIGHT_DXA = 16838
MARGIN_DXA = 1020  # 1.8 cm
CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - (MARGIN_DXA * 2)  # 9866 twips (~17.4 cm)

FONT_SANS = "Segoe UI"
FONT_MONO = "Consolas"

# Brand Palette
HEX_NAVY = "0F3D62"
HEX_BLUE = "1D4ED8"
HEX_SKY = "0284C7"
HEX_TEAL = "0F766E"
HEX_EMERALD = "059669"
HEX_AMBER = "D97706"
HEX_RED = "DC2626"
HEX_PURPLE = "7C3AED"
HEX_DARK = "1E293B"
HEX_BODY = "334155"
HEX_MUTED = "64748B"
HEX_BG_LIGHT = "F8FAFC"
HEX_BG_CODE = "F1F5F9"
HEX_BG_INFO = "EFF6FF"
HEX_BG_TIP = "ECFDF5"
HEX_BG_WARN = "FFFBEB"
HEX_BG_DANGER = "FEF2F2"
HEX_BORDER = "CBD5E1"
HEX_BORDER_LIGHT = "E2E8F0"
HEX_WHITE = "FFFFFF"


def hex_to_rgb(hex_str):
    h = hex_str.lstrip("#")
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# ---------------------------------------------------------------------------
# Low-Level OOXML Helpers (100% WPS Office Safe)
# ---------------------------------------------------------------------------
def set_paragraph_shading(paragraph, fill_hex):
    pPr = paragraph._p.get_or_add_pPr()
    for existing in pPr.findall(qn("w:shd")):
        pPr.remove(existing)
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>')
    pPr.append(shd)


def set_paragraph_borders(paragraph, top=None, bottom=None, left=None, right=None):
    """
    Each border arg is a dict: {"val": "single"|"dashed", "sz": 12, "space": 6, "color": "0F3D62"}
    """
    pPr = paragraph._p.get_or_add_pPr()
    for existing in pPr.findall(qn("w:pBdr")):
        pPr.remove(existing)

    parts = []
    for side, cfg in [("top", top), ("left", left), ("bottom", bottom), ("right", right)]:
        if cfg:
            val = cfg.get("val", "single")
            sz = cfg.get("sz", 6)
            space = cfg.get("space", 4)
            color = cfg.get("color", HEX_BORDER)
            parts.append(
                f'<w:{side} w:val="{val}" w:sz="{sz}" w:space="{space}" w:color="{color}"/>'
            )
    if parts:
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}>{"".join(parts)}</w:pBdr>')
        pPr.append(pBdr)


def set_run_font(run, font_name=FONT_SANS, size_pt=10.5, bold=False, italic=False, color_hex=HEX_DARK, shade_hex=None, strike=False):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = italic
    run.font.strike = strike
    run.font.color.rgb = hex_to_rgb(color_hex)

    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), font_name)
    rFonts.set(qn("w:hAnsi"), font_name)
    rFonts.set(qn("w:eastAsia"), font_name)
    rFonts.set(qn("w:cs"), font_name)

    if shade_hex:
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{shade_hex}"/>')
        rPr.append(shd)


def set_cell_shading(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for existing in tcPr.findall(qn("w:shd")):
        tcPr.remove(existing)
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{fill_hex}"/>')
    tcPr.append(shd)


def set_cell_margins(cell, top=90, bottom=90, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    for existing in tcPr.findall(qn("w:tcMar")):
        tcPr.remove(existing)
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f"</w:tcMar>"
    )
    tcPr.append(tcMar)


def set_cell_width_dxa(cell, width_dxa):
    tcPr = cell._tc.get_or_add_tcPr()
    for existing in tcPr.findall(qn("w:tcW")):
        tcPr.remove(existing)
    tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{int(width_dxa)}" w:type="dxa"/>')
    tcPr.insert(0, tcW)


def configure_table_fixed_dxa(table, col_widths_dxa):
    """
    Forces strict DXA column grid and fixed layout so WPS Office never collapses columns.
    """
    total_dxa = sum(col_widths_dxa)
    tblPr = table._tbl.tblPr

    for tag in ("w:tblW", "w:tblLayout", "w:tblBorders"):
        for existing in tblPr.findall(qn(tag)):
            tblPr.remove(existing)

    tblPr.append(parse_xml(f'<w:tblW {nsdecls("w")} w:w="{int(total_dxa)}" w:type="dxa"/>'))
    tblPr.append(parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>'))
    tblPr.append(
        parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:left w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="{HEX_NAVY}"/>'
            f'<w:right w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER_LIGHT}"/>'
            f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER_LIGHT}"/>'
            f"</w:tblBorders>"
        )
    )

    # Rebuild <w:tblGrid> with exact DXA widths
    for existing_grid in table._tbl.findall(qn("w:tblGrid")):
        table._tbl.remove(existing_grid)
    grid_cols_xml = "".join(f'<w:gridCol w:w="{int(w)}"/>' for w in col_widths_dxa)
    tblGrid = parse_xml(f'<w:tblGrid {nsdecls("w")}>{grid_cols_xml}</w:tblGrid>')
    tblPr.addnext(tblGrid)


# ---------------------------------------------------------------------------
# Text Cleaning & Inline Run Parser
# ---------------------------------------------------------------------------
def clean_inline_text(text):
    if not text:
        return ""
    s = text
    s = s.replace("\\$", "$")
    s = re.sub(r"\$([A-Za-z0-9_+\-*/=]+)\$", r"\1", s)
    s = re.sub(r"<br\s*/?>", " — ", s, flags=re.IGNORECASE)
    s = s.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    # Convert backticked fill-in-the-blank dots `.........` into wrap-friendly spaced dots
    s = re.sub(
        r"`\.{6,}`",
        ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .",
        s,
    )
    s = re.sub(
        r"\.{12,}",
        ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .",
        s,
    )
    return s


TOKEN_PATTERN = re.compile(
    r"(\[([^\]]+)\]\(([^)]+)\)"
    r"|`([^`]+)`"
    r"|\*\*\*([^*]+)\*\*\*"
    r"|\*\*([^*]+)\*\*"
    r"|\*([^*\n]+)\*"
    r"|~~([^~]+)~~)"
)


def append_inline_runs(paragraph, raw_text, base_size=10.5, base_color=HEX_DARK, base_bold=False, base_italic=False, base_font=FONT_SANS):
    text = clean_inline_text(raw_text)
    last_idx = 0

    for m in TOKEN_PATTERN.finditer(text):
        if m.start() > last_idx:
            plain = text[last_idx : m.start()]
            r = paragraph.add_run(plain)
            set_run_font(r, font_name=base_font, size_pt=base_size, bold=base_bold, italic=base_italic, color_hex=base_color)

        if m.group(2) is not None and m.group(3) is not None:
            # Link [label](url)
            label = m.group(2)
            r = paragraph.add_run(label)
            set_run_font(r, font_name=base_font, size_pt=base_size, bold=True, italic=base_italic, color_hex=HEX_BLUE)
        elif m.group(4) is not None:
            # Inline code `code` or checkbox `[x]` / `[ ]`
            code_str = m.group(4).strip()
            if code_str in ("[x]", "[X]"):
                r = paragraph.add_run("☑ ")
                set_run_font(r, font_name=FONT_SANS, size_pt=base_size + 1.5, bold=True, color_hex=HEX_EMERALD)
            elif code_str == "[ ]":
                r = paragraph.add_run("☐ ")
                set_run_font(r, font_name=FONT_SANS, size_pt=base_size + 1.5, bold=True, color_hex=HEX_NAVY)
            else:
                r = paragraph.add_run(m.group(4))
                # Do not apply gray background shading inside dark Navy banners
                shade = None if base_color == HEX_WHITE else HEX_BG_CODE
                code_color = HEX_WHITE if base_color == HEX_WHITE else HEX_NAVY
                set_run_font(
                    r,
                    font_name=FONT_MONO,
                    size_pt=max(8.5, base_size - 0.5),
                    bold=base_bold,
                    color_hex=code_color,
                    shade_hex=shade,
                )
        elif m.group(5) is not None:
            # ***bold italic***
            r = paragraph.add_run(m.group(5))
            set_run_font(r, font_name=base_font, size_pt=base_size, bold=True, italic=True, color_hex=base_color)
        elif m.group(6) is not None:
            # **bold** (may contain nested `code`)
            inner = m.group(6)
            if "`" in inner:
                append_inline_runs(
                    paragraph,
                    inner,
                    base_size=base_size,
                    base_color=base_color,
                    base_bold=True,
                    base_italic=base_italic,
                    base_font=base_font,
                )
            else:
                r = paragraph.add_run(inner)
                set_run_font(r, font_name=base_font, size_pt=base_size, bold=True, italic=base_italic, color_hex=base_color)
        elif m.group(7) is not None:
            # *italic*
            r = paragraph.add_run(m.group(7))
            set_run_font(r, font_name=base_font, size_pt=base_size, bold=base_bold, italic=True, color_hex=base_color)
        elif m.group(8) is not None:
            # ~~strike~~
            r = paragraph.add_run(m.group(8))
            set_run_font(r, font_name=base_font, size_pt=base_size, color_hex=HEX_MUTED, strike=True)

        last_idx = m.end()

    if last_idx < len(text):
        r = paragraph.add_run(text[last_idx:])
        set_run_font(r, font_name=base_font, size_pt=base_size, bold=base_bold, italic=base_italic, color_hex=base_color)


# ---------------------------------------------------------------------------
# Block Builders (100% Native Paragraphs & Fixed-DXA Tables)
# ---------------------------------------------------------------------------
def add_document_title(doc, title_text, subtitle_text=None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(6 if not subtitle_text else 3)
    p.paragraph_format.line_spacing = 1.2
    p.paragraph_format.keep_with_next = True

    if not subtitle_text:
        set_paragraph_borders(
            p,
            bottom={"val": "single", "sz": 16, "space": 8, "color": HEX_NAVY},
        )

    append_inline_runs(p, title_text, base_size=15.5, base_color=HEX_NAVY, base_bold=True)

    if subtitle_text:
        p_sub = doc.add_paragraph()
        p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_sub.paragraph_format.space_before = Pt(0)
        p_sub.paragraph_format.space_after = Pt(10)
        set_paragraph_borders(
            p_sub,
            bottom={"val": "single", "sz": 14, "space": 8, "color": HEX_NAVY},
        )
        append_inline_runs(p_sub, subtitle_text, base_size=10.5, base_color=HEX_BODY, base_italic=True)


def add_heading_block(doc, level, text):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.line_spacing = 1.2

    if level <= 2:
        # Full-width Navy background banner paragraph (Zero table -> 100% WPS safe!)
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        set_paragraph_shading(p, HEX_NAVY)
        set_paragraph_borders(
            p,
            top={"val": "single", "sz": 12, "space": 5, "color": HEX_NAVY},
            bottom={"val": "single", "sz": 12, "space": 5, "color": HEX_NAVY},
            left={"val": "single", "sz": 18, "space": 8, "color": HEX_NAVY},
            right={"val": "single", "sz": 18, "space": 8, "color": HEX_NAVY},
        )
        append_inline_runs(p, text, base_size=11.5, base_color=HEX_WHITE, base_bold=True)
    elif level == 3:
        # Left sky-blue accent border + subtle bottom border
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after = Pt(4)
        set_paragraph_borders(
            p,
            left={"val": "single", "sz": 24, "space": 7, "color": HEX_SKY},
            bottom={"val": "single", "sz": 4, "space": 3, "color": HEX_BORDER_LIGHT},
        )
        append_inline_runs(p, text, base_size=11.0, base_color=HEX_NAVY, base_bold=True)
    else:
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        append_inline_runs(p, text, base_size=10.5, base_color=HEX_BLUE, base_bold=True)


def add_callout_block(doc, quote_lines):
    cleaned = list(quote_lines)
    alert_type = "INFO"
    if cleaned:
        m = re.match(r"^\[!(NOTE|INFO|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$", cleaned[0].strip(), re.IGNORECASE)
        if m:
            alert_type = m.group(1).upper()
            if m.group(2):
                cleaned[0] = m.group(2)
            else:
                cleaned.pop(0)

    theme_map = {
        "INFO": (HEX_BLUE, HEX_BG_INFO, None),
        "NOTE": (HEX_BLUE, HEX_BG_INFO, "📌 GHI CHÚ: "),
        "IMPORTANT": (HEX_PURPLE, "F5F3FF", "⚡ QUAN TRỌNG: "),
        "TIP": (HEX_EMERALD, HEX_BG_TIP, "💡 MẸO VẬN HÀNH: "),
        "WARNING": (HEX_AMBER, HEX_BG_WARN, "⚠️ LƯU Ý: "),
        "CAUTION": (HEX_RED, HEX_BG_DANGER, "🚨 CẢNH BÁO: "),
    }
    border_hex, bg_hex, badge_prefix = theme_map.get(alert_type, theme_map["INFO"])

    non_empty = [ln.strip() for ln in cleaned if ln.strip()]
    if not non_empty:
        return

    for idx, line in enumerate(non_empty):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Pt(6)
        p.paragraph_format.right_indent = Pt(6)
        p.paragraph_format.space_before = Pt(6 if idx == 0 else 2)
        p.paragraph_format.space_after = Pt(6 if idx == len(non_empty) - 1 else 2)
        p.paragraph_format.line_spacing = 1.25

        set_paragraph_shading(p, bg_hex)
        set_paragraph_borders(
            p,
            left={"val": "single", "sz": 24, "space": 8, "color": border_hex},
            top={"val": "single", "sz": 6, "space": 4, "color": bg_hex},
            bottom={"val": "single", "sz": 6, "space": 4, "color": bg_hex},
            right={"val": "single", "sz": 6, "space": 6, "color": bg_hex},
        )

        if idx == 0 and badge_prefix:
            r_badge = p.add_run(badge_prefix)
            set_run_font(r_badge, size_pt=10.0, bold=True, color_hex=border_hex)

        if line.startswith("- ") or line.startswith("* "):
            r_bul = p.add_run("  • ")
            set_run_font(r_bul, size_pt=10.0, bold=True, color_hex=border_hex)
            append_inline_runs(p, line[2:].strip(), base_size=10.0, base_color=HEX_DARK)
        else:
            append_inline_runs(p, line, base_size=10.0, base_color=HEX_DARK)


def add_code_or_mermaid_block(doc, lang, code_lines):
    norm_lang = (lang or "").strip().lower()

    if norm_lang == "mermaid":
        labels = []
        for ln in code_lines:
            for m in re.finditer(r'\["([^"]+)"\]|\[([^\]]+)\]', ln):
                lbl = (m.group(1) or m.group(2) or "").replace("<br/>", " — ").replace("<br>", " — ").strip()
                if lbl and lbl not in labels:
                    labels.append(lbl)
        if labels:
            p_hdr = doc.add_paragraph()
            p_hdr.paragraph_format.space_before = Pt(6)
            p_hdr.paragraph_format.space_after = Pt(2)
            p_hdr.paragraph_format.keep_with_next = True
            set_paragraph_shading(p_hdr, HEX_BG_LIGHT)
            set_paragraph_borders(
                p_hdr,
                left={"val": "single", "sz": 20, "space": 8, "color": HEX_NAVY},
                top={"val": "single", "sz": 4, "space": 4, "color": HEX_BORDER},
                right={"val": "single", "sz": 4, "space": 6, "color": HEX_BORDER},
            )
            r = p_hdr.add_run("🗺️ SƠ ĐỒ CẤU TRÚC / CÂY QUYẾT ĐỊNH NGHIỆP VỤ:")
            set_run_font(r, size_pt=10.0, bold=True, color_hex=HEX_NAVY)

            for idx, lbl in enumerate(labels):
                p_node = doc.add_paragraph()
                p_node.paragraph_format.space_before = Pt(1)
                p_node.paragraph_format.space_after = Pt(6 if idx == len(labels) - 1 else 1)
                set_paragraph_shading(p_node, HEX_BG_LIGHT)
                set_paragraph_borders(
                    p_node,
                    left={"val": "single", "sz": 20, "space": 8, "color": HEX_NAVY},
                    bottom={"val": "single", "sz": 4, "space": 4, "color": HEX_BORDER} if idx == len(labels) - 1 else None,
                    right={"val": "single", "sz": 4, "space": 6, "color": HEX_BORDER},
                )
                prefix = "   🔷 " if idx == 0 else "      ├─▸ "
                r_pre = p_node.add_run(prefix)
                set_run_font(r_pre, size_pt=9.5, bold=True, color_hex=HEX_NAVY if idx == 0 else HEX_BLUE)
                r_txt = p_node.add_run(lbl)
                set_run_font(r_txt, size_pt=9.5, bold=(idx == 0), color_hex=HEX_DARK)
            return

    # Standard code block using native shaded paragraphs (never overflows or collapses in WPS)
    if not code_lines:
        return
    for idx, ln in enumerate(code_lines):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Pt(6)
        p.paragraph_format.right_indent = Pt(6)
        p.paragraph_format.space_before = Pt(4 if idx == 0 else 0)
        p.paragraph_format.space_after = Pt(4 if idx == len(code_lines) - 1 else 0)
        p.paragraph_format.line_spacing = 1.15
        set_paragraph_shading(p, HEX_BG_CODE)
        set_paragraph_borders(
            p,
            left={"val": "single", "sz": 16, "space": 6, "color": HEX_MUTED},
            top={"val": "single", "sz": 4, "space": 3, "color": HEX_BORDER} if idx == 0 else None,
            bottom={"val": "single", "sz": 4, "space": 3, "color": HEX_BORDER} if idx == len(code_lines) - 1 else None,
            right={"val": "single", "sz": 4, "space": 6, "color": HEX_BORDER},
        )
        r = p.add_run(ln if ln else " ")
        set_run_font(r, font_name=FONT_MONO, size_pt=8.5, color_hex=HEX_DARK)


def add_signoff_paragraph(doc, content_text):
    """
    Renders a dashed fillable box for '👉 Chốt của Vận hành: ...' lines.
    """
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Pt(8)
    p.paragraph_format.right_indent = Pt(4)
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.line_spacing = 1.3

    set_paragraph_shading(p, HEX_BG_LIGHT)
    set_paragraph_borders(
        p,
        top={"val": "dashed", "sz": 6, "space": 5, "color": HEX_BORDER},
        bottom={"val": "dashed", "sz": 6, "space": 5, "color": HEX_BORDER},
        left={"val": "single", "sz": 18, "space": 7, "color": HEX_NAVY},
        right={"val": "dashed", "sz": 6, "space": 5, "color": HEX_BORDER},
    )
    append_inline_runs(p, content_text, base_size=10.0, base_color=HEX_NAVY)


def add_list_item_paragraph(doc, raw_line):
    indent_spaces = len(raw_line) - len(raw_line.lstrip(" "))
    level = min(3, indent_spaces // 2)
    trimmed = raw_line.strip()

    ul_match = re.match(r"^[-*+]\s+(.*)$", trimmed)
    ol_match = re.match(r"^(\d+)\.\s+(.*)$", trimmed)

    content = trimmed
    prefix_text = "• "
    prefix_color = HEX_NAVY

    if ul_match:
        content = ul_match.group(1).strip()
        prefix_text = "• " if level == 0 else ("▪ " if level == 1 else "▫ ")
    elif ol_match:
        prefix_text = f"{ol_match.group(1)}. "
        content = ol_match.group(2).strip()

    # Check if this is a sign-off / fill-in line ("👉 Chốt...")
    if "👉" in content or "Chốt của Vận hành" in content or "Ý kiến chốt" in content:
        add_signoff_paragraph(doc, content)
        return

    # Check if this is a checkbox item: `[x]` / `[ ]` / [x] / [ ]
    cb_match = re.match(r"^(?:`?\[([ xX])\]`?)\s+(.*)$", content)
    if cb_match:
        is_checked = cb_match.group(1).lower() == "x"
        body_text = cb_match.group(2).strip()

        p = doc.add_paragraph()
        # Use clean left_indent ONLY (no hanging indent so WPS never inserts tab jumps)
        p.paragraph_format.left_indent = Pt(14 + level * 6)
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.25

        box_char = "☑  " if is_checked else "☐  "
        box_color = HEX_NAVY if is_checked else HEX_DARK
        r_box = p.add_run(box_char)
        set_run_font(r_box, size_pt=12.0, bold=True, color_hex=box_color)

        append_inline_runs(
            p,
            body_text,
            base_size=10.5,
            base_color=HEX_NAVY if is_checked else HEX_DARK,
        )
        return

    # Regular bullet or numbered item
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Pt(10 + level * 12)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.25

    r_pre = p.add_run(prefix_text)
    set_run_font(r_pre, size_pt=10.5, bold=True, color_hex=prefix_color)
    append_inline_runs(p, content, base_size=10.5, base_color=HEX_DARK)


def add_markdown_table(doc, table_lines):
    parsed_rows = []
    for line in table_lines:
        s = line.strip()
        if s.startswith("|"):
            s = s[1:]
        if s.endswith("|"):
            s = s[:-1]
        cells = [c.strip() for c in s.split("|")]
        if cells:
            parsed_rows.append(cells)

    if not parsed_rows:
        return

    # Filter out markdown separator row |---|---|
    data_rows = [
        r for r in parsed_rows if not all(re.match(r"^:?-{2,}:?$", c) or c == "" for c in r)
    ]
    if not data_rows:
        return

    col_count = max(len(r) for r in data_rows)
    if col_count == 0:
        return

    # Calculate smart proportional column widths in DXA (summing to CONTENT_WIDTH_DXA = 9866)
    col_weights = []
    for c_idx in range(col_count):
        lengths = []
        for r_idx, row in enumerate(data_rows):
            val = row[c_idx] if c_idx < len(row) else ""
            clean_val = re.sub(r"[*`~]", "", val)
            lengths.append(len(clean_val) * (1.3 if r_idx == 0 else 1.0))
        max_len = max(lengths) if lengths else 10
        # Clamp weight between 8 and 65 so narrow columns stay compact and wide columns get room
        col_weights.append(max(8.0, min(65.0, float(max_len))))

    total_weight = sum(col_weights)
    col_widths_dxa = [int(round((w / total_weight) * CONTENT_WIDTH_DXA)) for w in col_weights]
    # Adjust last column so sum is exact CONTENT_WIDTH_DXA
    diff = CONTENT_WIDTH_DXA - sum(col_widths_dxa)
    col_widths_dxa[-1] += diff

    tbl = doc.add_table(rows=len(data_rows), cols=col_count)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    configure_table_fixed_dxa(tbl, col_widths_dxa)

    for r_idx, row_cells in enumerate(data_rows):
        is_header = r_idx == 0
        bg_hex = HEX_NAVY if is_header else (HEX_BG_LIGHT if r_idx % 2 == 0 else HEX_WHITE)
        tr = tbl.rows[r_idx]._tr
        trPr = tr.get_or_add_trPr()
        if is_header:
            trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

        for c_idx in range(col_count):
            cell_text = row_cells[c_idx] if c_idx < len(row_cells) else ""
            cell = tbl.cell(r_idx, c_idx)
            set_cell_width_dxa(cell, col_widths_dxa[c_idx])
            set_cell_shading(cell, bg_hex)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER if is_header else WD_ALIGN_VERTICAL.TOP

            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            p.paragraph_format.line_spacing = 1.15
            append_inline_runs(
                p,
                cell_text,
                base_size=9.5,
                base_color=HEX_WHITE if is_header else HEX_DARK,
                base_bold=is_header,
            )

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(0)
    p_spacer.paragraph_format.space_after = Pt(4)


def add_image_block(doc, alt_text, raw_path, md_dir, root_dir):
    cleaned = re.sub(r"^file:///?", "", raw_path, flags=re.IGNORECASE).strip()
    candidates = [
        os.path.abspath(os.path.join(md_dir, cleaned)),
        os.path.abspath(os.path.join(root_dir, cleaned)),
        cleaned,
    ]
    img_path = next((c for c in candidates if os.path.isfile(c)), None)
    if not img_path:
        p = doc.add_paragraph()
        r = p.add_run(f"[Hình minh họa: {alt_text or raw_path}]")
        set_run_font(r, size_pt=9.5, italic=True, color_hex=HEX_MUTED)
        return

    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(6)
    p_img.paragraph_format.space_after = Pt(2)
    p_img.paragraph_format.keep_with_next = True
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(5.8))

    if alt_text:
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run(f"Hình: {alt_text}")
        set_run_font(r_cap, size_pt=9.0, italic=True, color_hex=HEX_MUTED)


# ---------------------------------------------------------------------------
# Full Markdown Document Builder
# ---------------------------------------------------------------------------
def convert_markdown_to_docx(input_md_path, output_docx_path, custom_title=None, custom_subtitle=None):
    with open(input_md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    md_dir = os.path.dirname(os.path.abspath(input_md_path))
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))

    doc = Document()

    # Configure A4 page & margins
    for section in doc.sections:
        section.page_width = Twips(PAGE_WIDTH_DXA)
        section.page_height = Twips(PAGE_HEIGHT_DXA)
        section.top_margin = Twips(MARGIN_DXA)
        section.bottom_margin = Twips(MARGIN_DXA)
        section.left_margin = Twips(MARGIN_DXA)
        section.right_margin = Twips(MARGIN_DXA)

    # Set Normal style defaults
    normal_style = doc.styles["Normal"]
    normal_style.font.name = FONT_SANS
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = hex_to_rgb(HEX_DARK)

    lines = md_content.replace("\r\n", "\n").split("\n")
    i = 0

    # Strip YAML frontmatter if present
    if lines and lines[0].strip() == "---":
        end_yaml = 1
        while end_yaml < len(lines) and lines[end_yaml].strip() != "---":
            end_yaml += 1
        if end_yaml < len(lines):
            i = end_yaml + 1

    title_consumed = False
    doc_title = custom_title

    while i < len(lines):
        raw_line = lines[i]
        trimmed = raw_line.strip()

        # 1. Blank line
        if not trimmed:
            i += 1
            continue

        # 2. Horizontal rule (---, ***, ___) — skip redundant HRs because H2/H3 already have visual borders
        if re.match(r"^(-{3,}|\*{3,}|_{3,})$", trimmed):
            i += 1
            continue

        # 3. Fenced Code / Mermaid Block
        if trimmed.startswith("```"):
            lang = trimmed[3:].strip()
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            if i < len(lines):
                i += 1
            add_code_or_mermaid_block(doc, lang, code_lines)
            continue

        # 4. Markdown Table (| ... |)
        if trimmed.startswith("|") and trimmed.endswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                table_lines.append(lines[i])
                i += 1
            add_markdown_table(doc, table_lines)
            continue

        # 5. Blockquote (> ...)
        if trimmed.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(re.sub(r"^>\s?", "", lines[i].strip()))
                i += 1
            add_callout_block(doc, quote_lines)
            continue

        # 6. Headings (# to ######)
        h_match = re.match(r"^(#{1,6})\s+(.*)$", trimmed)
        if h_match:
            level = len(h_match.group(1))
            h_text = h_match.group(2).strip()
            if level == 1 and not title_consumed:
                doc_title = doc_title or h_text
                title_consumed = True
                add_document_title(doc, doc_title, custom_subtitle)
            else:
                add_heading_block(doc, level, h_text)
            i += 1
            continue

        # 7. Standalone Image ![alt](path)
        img_match = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", trimmed)
        if img_match:
            add_image_block(doc, img_match.group(1), img_match.group(2), md_dir, root_dir)
            i += 1
            continue

        # 8. List item (-, *, +, 1.)
        if re.match(r"^(\s*)([-*+]|\d+\.)\s+", raw_line):
            add_list_item_paragraph(doc, raw_line)
            i += 1
            continue

        # 9. Sign-off / Fill-in line outside list
        if "👉" in trimmed or "Chốt của Vận hành" in trimmed or "Ý kiến chốt" in trimmed:
            add_signoff_paragraph(doc, trimmed)
            i += 1
            continue

        # 10. Regular Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.25
        append_inline_runs(p, trimmed, base_size=10.5, base_color=HEX_DARK)
        i += 1

    # Configure subtle Header & Footer
    final_title = (doc_title or "Tài Liệu Nghiệp Vụ — Spider Express TMS")[:70]
    for section in doc.sections:
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r_hdr = hp.add_run(f"SPIDER EXPRESS TMS  |  {final_title}")
        set_run_font(r_hdr, size_pt=8.5, italic=True, color_hex=HEX_MUTED)

    os.makedirs(os.path.dirname(os.path.abspath(output_docx_path)), exist_ok=True)
    doc.save(output_docx_path)
    size_kb = os.path.getsize(output_docx_path) / 1024.0
    print(f"✅ [DOCX (WPS & MS Word Safe)] Generated: {output_docx_path} ({size_kb:.1f} KB)")


def main():
    parser = argparse.ArgumentParser(description="Convert Markdown to WPS/Word-safe DOCX")
    parser.add_argument("input", help="Input .md file path")
    parser.add_argument("output", nargs="?", help="Output .docx file path")
    parser.add_argument("--title", help="Custom document title", default=None)
    parser.add_argument("--subtitle", help="Custom document subtitle", default=None)
    args = parser.parse_args()

    input_path = os.path.abspath(args.input)
    if not os.path.isfile(input_path):
        print(f"[md-to-docx] Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.output:
        output_path = os.path.abspath(args.output)
    else:
        base, _ = os.path.splitext(input_path)
        output_path = base + ".docx"

    convert_markdown_to_docx(input_path, output_path, args.title, args.subtitle)


if __name__ == "__main__":
    main()
