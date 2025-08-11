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
