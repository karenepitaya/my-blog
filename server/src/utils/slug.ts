/**
 * 生成 URL 友好的 slug
 */
import pinyin from 'pinyin';

const HAS_HAN_REGEX = /[\u4e00-\u9fff]/;

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

  // 如果包含中文等汉字，优先走“中英混排”策略：把汉字转拼音，同时保留原始英文/数字部分。
  // 这样能避免 “Vue 入门 / Vue 进阶” 都被规整成同一个 slug（例如都变成 vue）。
  if (!HAS_HAN_REGEX.test(text)) return normalized;

  const pinyinWords = pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false });
  const pinyinText = pinyinWords.flat().join(' ');

  const mixed = normalizeSlugText(pinyinText);
  return mixed || normalized;
}

/**
 * 验证 slug 格式
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
