export interface Article {
  id: string;
  title: string;
  excerpt: string;
  readTime: number;
  date: string;
  slug?: string;
  authorUsername?: string;
  url?: string;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
  creator: string;
  createdAt: string;
  articleCount: number;
  description?: string;
  effect?: 'glow' | 'pulse' | 'none';
  articles: Article[];
}

export type TagCreateInput = {
  label: string;
  color?: string;
  description?: string;
  effect?: 'glow' | 'pulse' | 'none';
};

export type TagUpdateInput = Partial<TagCreateInput>;

export interface CloudConfig {
  radius: number;
  maxSpeed: number;
  initSpeed: number;
  direction: 1 | -1;
  depthAlpha: boolean;
}

export type ViewState = 'CLOUD' | 'TAG_DETAIL' | 'ARTICLE_LIST';

export interface TagCloudProps {
  data: Tag[];
  onRefresh?: () => void | Promise<void>;
  onCreate?: (input: TagCreateInput) => void | Promise<Tag | null>;
  onUpdate?: (id: string, updates: TagUpdateInput) => void | Promise<Tag | null>;
  onDelete?: (id: string) => void | Promise<void>;
  onNavigateToArticles?: (tag: Tag) => void;
  initialConfig?: Partial<CloudConfig>;
  readOnly?: boolean;
}

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
