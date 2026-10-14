/**
 * Utility chia nhỏ nội dung HTML an toàn cho Telegram Bot API
 * Đảm bảo:
 * 1. Mỗi chunk không vượt quá maxLen ký tự (mặc định 3800, trần Telegram là 4096).
 * 2. Ưu tiên ngắt tại ranh giới đoạn văn (\n\n, \n) hoặc dấu cách.
 * 3. Không bao giờ ngắt ở giữa thẻ HTML (<...>).
 * 4. Tự động đóng các thẻ HTML chưa đóng ở cuối chunk và mở lại ở đầu chunk tiếp theo.
 * 5. Tuỳ chọn gắn nhãn [Phần X/Y] để người dùng tiện theo dõi luồng tin nhắn.
 */

// Danh sách các thẻ hợp lệ của Telegram Bot API
const SUPPORTED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 
  'span', 'tg-spoiler', 'a', 'code', 'pre', 'blockquote'
]);

export function splitTelegramHtml(text, maxLen = 3800, options = {}) {
  if (!text || typeof text !== 'string') return [];
  const { withPartPrefix = false } = options;

  if (text.length <= maxLen) return [text];

  const rawChunks = [];
  let remaining = text;

  // Trừ hao một ít ký tự nếu có part prefix (khoảng 30 ký tự)
  const effectiveMaxLen = withPartPrefix ? Math.max(500, maxLen - 30) : maxLen;

  while (remaining.length > 0) {
    if (remaining.length <= effectiveMaxLen) {
      rawChunks.push(remaining);
      break;
    }

    // 1. Tìm vị trí cắt tiềm năng
    let targetIdx = effectiveMaxLen;

    // Tìm ranh giới đoạn văn tự nhiên
    let splitIdx = remaining.lastIndexOf('\n\n', targetIdx);
    if (splitIdx === -1 || splitIdx < 1000) {
      splitIdx = remaining.lastIndexOf('\n', targetIdx);
    }
    if (splitIdx === -1 || splitIdx < 1000) {
      splitIdx = remaining.lastIndexOf(' ', targetIdx);
    }
    if (splitIdx === -1 || splitIdx < 500) {
      splitIdx = targetIdx;
    }

    // 2. Đảm bảo không cắt ở giữa một thẻ HTML (ví dụ: <a href="... hoặc <pre>)
    const openAngle = remaining.lastIndexOf('<', splitIdx);
    const closeAngle = remaining.lastIndexOf('>', splitIdx);
    if (openAngle !== -1 && (closeAngle === -1 || closeAngle < openAngle)) {
      if (openAngle > 0) {
        splitIdx = openAngle;
      } else {
        const nextClose = remaining.indexOf('>', splitIdx);
        if (nextClose !== -1) splitIdx = nextClose + 1;
      }
    }

    let chunk = remaining.slice(0, splitIdx);
    let rest = remaining.slice(splitIdx);

    // 3. Phân tích các thẻ HTML đang mở trong chunk
    const tagRegex = /<(\/)?([a-z0-9-]+)(?:\s+[^>]*)?>/gi;
    const openTagStack = [];
    let match;

    while ((match = tagRegex.exec(chunk)) !== null) {
      const isClosing = match[1] === '/';
      const tagName = match[2].toLowerCase();

      if (!SUPPORTED_TAGS.has(tagName)) continue;

      if (!isClosing) {
        openTagStack.push({
          name: tagName,
          fullTag: match[0]
        });
      } else {
        for (let i = openTagStack.length - 1; i >= 0; i--) {
          if (openTagStack[i].name === tagName) {
            openTagStack.splice(i, 1);
            break;
          }
        }
      }
    }

    // 4. Nếu có thẻ chưa đóng, tự động đóng ở cuối chunk hiện tại
    if (openTagStack.length > 0) {
      const closingTags = openTagStack
        .slice()
        .reverse()
        .map(t => `</${t.name}>`)
        .join('');
      chunk += closingTags;

      // Và mở lại ở đầu chunk tiếp theo
      const openingTags = openTagStack
        .map(t => t.fullTag)
        .join('');
      rest = openingTags + rest;
    }

    rawChunks.push(chunk.trim());
    remaining = rest.trim();
  }

  if (!withPartPrefix || rawChunks.length <= 1) {
    return rawChunks;
  }

  // Thêm nhãn [Phần X/Y] cho người dùng
  const total = rawChunks.length;
  return rawChunks.map((c, idx) => {
    return `📄 <i>[Phần ${idx + 1}/${total}]</i>\n${c}`;
  });
}
