// API调用工具

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 作者类型
export interface Author {
  _id: string;
  username: string;
  email?: string;
}

// 分类类型
export interface Category {
  _id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

// 文章列表项类型
export interface ArticleListItem {
  _id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  slug: string;
  tags?: string[];
  status?: string;
  author?: Author;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

// 文章详情类型
export interface ArticleDetail {
  _id: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  slug: string;
  category?: Category | null;
  author?: Author;
  status?: string;
  contentHTML?: string;
  toc?: { id: string; text: string; level: number }[];
  createdAt?: string;
  updatedAt?: string;
}

// 评论类型
export interface Comment {
  _id: string;
  content: string;
  author: Author;
  article: string;
  createdAt?: string;
  updatedAt?: string;
  parent?: string | null;
  replies?: Comment[];
}

// 通用fetch函数
export const fetchApi = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${BASE_URL}${path}`;
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    // 使用no-store避免缓存问题，确保每次请求都是最新的
    cache: 'no-store',
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred while fetching data',
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error('API fetch error:', error);
    // 在开发环境中提供更友好的错误信息
    if (process.env.NODE_ENV === 'development') {
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('fetch failed')) {
        console.error('可能的原因：服务器未启动或BASE_URL配置错误');
        console.error('当前BASE_URL:', BASE_URL);
      }
    }
    throw error;
  }
};

// 文章相关API
export const articleApi = {
  // 获取文章列表
  getList: async (params?: { keyword?: string; categoryId?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    
    const endpoint = params?.keyword ? '/articles/search' : '/articles/list';
    return fetchApi<{ articles: ArticleListItem[]; page: number; pageSize: number; count: number }>(`${endpoint}?${query.toString()}`);
  },

  // 通过ID获取文章
  getById: async (id: string) => {
    return fetchApi<ArticleDetail>(`/articles/${id}`);
  },

  // 通过Slug获取文章
  getBySlug: async (slug: string) => {
    return fetchApi<ArticleDetail>(`/articles/slug/${slug}`);
  },
};

// 分类相关API
export const categoryApi = {
  // 获取分类列表
  getList: async () => {
    return fetchApi<Category[]>('/categories/list');
  },
};

// 评论相关API
export const commentApi = {
  // 获取文章评论
  getByArticleId: async (articleId: string) => {
    return fetchApi<Comment[]>(`/comments/article/${articleId}`);
  },
};
