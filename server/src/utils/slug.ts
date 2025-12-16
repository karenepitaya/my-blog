/**
 * 生成 URL 友好的 slug
 */
import pinyin from 'pinyin';

const normalizeSlugText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除非字母数字、空格和短横线的字符
    .replace(/[\s_-]+/g, '-') // 将空格和下划线转换为短横线
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的短横线
};

export function createSlug(text: string): string {
  const normalized = normalizeSlugText(text);
  if (normalized) return normalized;

  // 对中文等非拉丁字符尝试转拼音，再生成 slug
  const pinyinWords = pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false });
  const pinyinText = pinyinWords.flat().join(' ');
  return normalizeSlugText(pinyinText);
}

/**
 * 验证 slug 格式
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
