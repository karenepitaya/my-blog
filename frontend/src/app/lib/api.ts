export type Author = {
  _id: string;
  username: string;
  email?: string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
};

export type ArticleListItem = {
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
};

export type ArticleDetail = {
  id: string;
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
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api";

export const fetchArticles = async (params: {
  keyword?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) => {
  const baseUrl = getBaseUrl();
  const query = new URLSearchParams();

  if (params.keyword) query.set("keyword", params.keyword);
  if (params.categoryId) query.set("categoryId", params.categoryId);

  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 12));

  const endpoint = params.keyword ? "articles/search" : "articles/list";
  const res = await fetch(`${baseUrl}/${endpoint}?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load articles: ${res.statusText}`);
  }

  return res.json() as Promise<{ articles: ArticleListItem[]; page: number; pageSize: number; count: number }>;
};

export const fetchCategories = async () => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/categories/list`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to load categories: ${res.statusText}`);
  }

  return res.json() as Promise<Category[]>;
};

export const fetchArticleBySlug = async (slug: string) => {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/articles/slug/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to load article: ${res.statusText}`);
  }

  return res.json() as Promise<ArticleDetail>;
};
