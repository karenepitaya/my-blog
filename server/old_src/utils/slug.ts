// 将中文、英文、数字转换为 URL 友好的 slug
import pinyin from 'pinyin';

export function createSlug(title: string): string {
  // 先将中文转换为拼音
  const pinyinResult = pinyin(title, {
    style: 'normal', // 普通风格，不带声调
    heteronym: false, // 不处理多音字
  });
  
  // 将二维数组扁平化为一维数组并连接
  const pinyinTitle = pinyinResult.map(char => char[0]).join('');
  
  return pinyinTitle
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")                 // 空格 -> -
    .replace(/[^\w-]/g, "")  // 去掉特殊字符，只保留英文数字和-
    .replace(/-+/g, "-");                 // 多个 '-' 合并
}

