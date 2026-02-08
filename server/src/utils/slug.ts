import pinyin from 'pinyin';

const HAS_HAN_REGEX = /[\u4e00-\u9fff]/;

const normalizeSlugText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export function createSlug(text: string): string {
  const normalized = normalizeSlugText(text);

  // WHY: For mixed CJK/Latin titles, use pinyin to avoid slug collisions.
  if (!HAS_HAN_REGEX.test(text)) return normalized;

  const pinyinWords = pinyin(text, { style: pinyin.STYLE_NORMAL, heteronym: false });
  const pinyinText = pinyinWords.flat().join(' ');

  const mixed = normalizeSlugText(pinyinText);
  return mixed || normalized;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
