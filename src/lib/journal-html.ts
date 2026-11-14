import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "span",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "class",
];

/** Sanitize TipTap / pasted HTML before save or public render. */
export function sanitizeJournalHtml(html: string): string {
  if (!html?.trim()) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

/** True if content looks like HTML rather than plain paragraphs. */
export function isJournalHtml(body: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(body || "");
}

/**
 * Convert simple markdown-ish article drafts to HTML.
 * Supports ## / ### headings, paragraphs, and [label](url) links.
 */
export function markdownLiteToHtml(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").trim().split("\n");
  const blocks: string[] = [];
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ").trim();
    if (text) blocks.push(`<p>${inline(text)}</p>`);
    para = [];
  };

  const inline = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_m, label, href) =>
          `<a href="${String(href).replace(/"/g, "")}">${label}</a>`,
      )
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara();
      blocks.push(`<h3>${inline(line.slice(4).trim())}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara();
      blocks.push(`<h2>${inline(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      flushPara();
      // Skip H1 in body — page already has title
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  return sanitizeJournalHtml(blocks.join("\n"));
}
