const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reject header-injection / malformed recipients. */
export function sanitizeEmailAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value || value.length > 254) return null;
  if (/[\r\n\0]/.test(value)) return null;
  if (!EMAIL_RE.test(value)) return null;
  return value.toLowerCase();
}

export function sanitizeEmailList(
  input: string | string[] | null | undefined,
): string[] {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const out: string[] = [];
  for (const item of list) {
    const email = sanitizeEmailAddress(item);
    if (email && !out.includes(email)) out.push(email);
  }
  return out;
}

export function sanitizeHeaderValue(raw: string, max = 200) {
  return String(raw || "")
    .replace(/[\r\n\0]+/g, " ")
    .trim()
    .slice(0, max);
}
