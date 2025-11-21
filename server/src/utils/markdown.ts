import { marked } from "marked";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

// 在 JSDOM 中初始化 DOMPurify
const window = new JSDOM("").window as unknown as Window;
const purify = DOMPurify(window);

// Markdown 转 HTML
export function markdownToHtml(md: string): string {
  const rawHtml = marked(md);
  // 过滤危险 HTML，防止 XSS
  const cleanHtml = purify.sanitize(rawHtml);
  return cleanHtml;
}

