import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// 确保marked是同步的
marked.setOptions({
  async: false
});

// 使用JSDOM创建一个完整的DOM环境
const { window } = new JSDOM("<!DOCTYPE html>");

// 初始化DOMPurify
const purify = DOMPurify(window);

// Markdown 转 HTML
export function markdownToHtml(md: string): string {
  const rawHtml = marked(md);
  // 过滤危险 HTML，防止 XSS
  const cleanHtml = purify.sanitize(rawHtml as string);
  return cleanHtml;
}

