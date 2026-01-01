export interface Article {
  id: string;
  title: string;
  excerpt: string;
  readTime: number; // minutes
  date: string;
}

export interface Tag {
  id: string;
  label: string;
  color: string; // Hex code from Dracula theme
  creator: string;
  createdAt: string;
  articleCount: number;
  description?: string;
  effect?: 'glow' | 'pulse' | 'none';
  articles: Article[];
}

export interface CloudConfig {
  radius: number;
  maxSpeed: number;
  initSpeed: number;
  direction: 1 | -1;
  depthAlpha: boolean; // Fade tags in back
}

export type ViewState = 'CLOUD' | 'TAG_DETAIL' | 'ARTICLE_LIST';

// 组件接口定义
export interface TagCloudProps {
  /** 初始标签数据列表 */
  data: Tag[];
  /** 当标签列表发生变更（如乱序排列、批量更新）时触发 */
  onDataChange?: (newTags: Tag[]) => void;
  /** 重新同步标签数据（用于刷新） */
  onRefresh?: () => void | Promise<void>;
  /** 创建新标签的回调 */
  onCreate?: (tag: Tag) => void | Promise<Tag | null>;
  /** 更新标签的回调 */
  onUpdate?: (id: string, updates: Partial<Tag>) => void | Promise<Tag | null>;
  /** 删除标签的回调 */
  onDelete?: (id: string) => void | Promise<void>;
  /** 点击标签进入文章列表时的回调 (可选，用于路由跳转) */
  onNavigateToArticles?: (tag: Tag) => void;
  /** 初始配置参数 (可选) */
  initialConfig?: Partial<CloudConfig>;
  /** 是否为只读模式 */
  readOnly?: boolean;
}

// Dracula Theme Colors
export const DRACULA = {
  bg: '#282a36',
  currentLine: '#44475a',
  fg: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
};

export const DRACULA_PALETTE = [
  DRACULA.cyan,
  DRACULA.green,
  DRACULA.orange,
  DRACULA.pink,
  DRACULA.purple,
  DRACULA.red,
  DRACULA.yellow,
];
