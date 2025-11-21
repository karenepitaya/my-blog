// 将中文、英文、数字转换为 URL 友好的 slug
export function createSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")                 // 空格 -> -
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")  // 去掉特殊字符，只保留中英文数字
    .replace(/-+/g, "-");                 // 多个 '-' 合并
}

