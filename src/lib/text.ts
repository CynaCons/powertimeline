export function truncateMono(source: string, width: number, fontSize: number, pad = 0.6) {
  const charW = 0.6 * fontSize;
  const maxChars = Math.max(4, Math.floor((width - pad * 2) / charW));
  return source.length > maxChars ? source.slice(0, Math.max(0, maxChars - 1)) + '…' : source;
}

export function truncateBody(source: string, width: number, fontSize: number, pad = 0.6) {
  const charW = 0.55 * fontSize;
  const maxChars = Math.max(6, Math.floor((width - pad * 2) / charW));
  return source.length > maxChars ? source.slice(0, Math.max(0, maxChars - 1)) + '…' : source;
}

// New: multi-line wrapping & clamping (approximate char metrics, whitespace word wrapping)
function wrapGeneric(
  source: string,
  width: number,
  pad: number,
  charW: number,
  maxLines: number
): { lines: string[]; truncated: boolean } {
  const maxCharsPerLine = Math.max(2, Math.floor((width - pad * 2) / charW));
  if (maxCharsPerLine <= 2) return { lines: [truncate(source, maxCharsPerLine)], truncated: source.length > maxCharsPerLine };
  const words = source.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  function pushCurrent() {
    if (current) { lines.push(current); current = ''; }
  }
  for (const w of words) {
    if (w.length > maxCharsPerLine) {
      // Break long word
      let remaining = w;
      while (remaining.length > 0) {
        const slice = remaining.slice(0, maxCharsPerLine);
        if (current) pushCurrent();
        lines.push(slice);
        remaining = remaining.slice(maxCharsPerLine);
        if (lines.length >= maxLines) break;
      }
    } else {
      const tentative = current ? current + ' ' + w : w;
      if (tentative.length <= maxCharsPerLine) {
        current = tentative;
      } else {
        pushCurrent();
        current = w;
      }
    }
    if (lines.length >= maxLines) break;
  }
  pushCurrent();
  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines.length = maxLines;
  }
  if (words.join(' ').length > lines.join(' ').length) truncated = true;
  if (truncated) {
    const last = lines[lines.length - 1] || '';
    if (!last.endsWith('…')) {
      const clipped = last.length >= maxCharsPerLine ? last.slice(0, Math.max(0, maxCharsPerLine - 1)) + '…' : last + '…';
      lines[lines.length - 1] = clipped;
    }
  }
  return { lines, truncated };
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, Math.max(0, max - 1)) + '…' : s;
}

export function wrapMonoClamp(source: string, width: number, fontSize: number, pad = 0.6, maxLines = 2) {
  return wrapGeneric(source, width, pad, 0.6 * fontSize, maxLines);
}

export function wrapBodyClamp(source: string, width: number, fontSize: number, pad = 0.6, maxLines = 3) {
  return wrapGeneric(source, width, pad, 0.55 * fontSize, maxLines);
}
