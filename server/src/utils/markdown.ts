import { marked } from "marked";
import DOMPurify from "dompurify";

// 确保marked是同步的
marked.setOptions({
  async: false
});

// 为DOMPurify创建一个简单的window对象
const window: any = {
  document: {
    createElement: () => ({}),
    createTextNode: () => ({})
  },
  Node: {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3
  }
};

// 初始化DOMPurify
const purify = DOMPurify(window);

// Markdown 转 HTML
export function markdownToHtml(md: string): string {
  const rawHtml = marked(md);
  // 过滤危险 HTML，防止 XSS
  const cleanHtml = purify.sanitize(rawHtml as string);
  return cleanHtml;
}

