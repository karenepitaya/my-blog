export interface TocItem {
  level: number;   // 1 ~ 6
  text: string;
  id: string;      // 用于锚点跳转
}

// 将中文、字母、数字等转换为可用的 HTML 锚点
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")            // 空格 → -
    .replace(/[^\w\u4e00-\u9fa5-]/g, "") // 去除特殊字符，只保留中英文数字下划线
    .replace(/-+/g, "-");
}

// 解析 Markdown，提取 h1-h6 标题
export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split("\n");

  const toc: TocItem[] = [];

  const headingRegex = /^(#{1,6})\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      const level = match[1].length; // # 的数量
      const text = match[2].trim();
      const id = slugify(text);

      toc.push({ level, text, id });
    }
  }

  return toc;
}

