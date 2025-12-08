// 用户相关类型
export interface User {
  _id: string
  username: string
  email: string
  role: 'admin'
  createdAt: string
  updatedAt: string
}

// 认证相关类型
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: User
}

export interface GetMeResponse {
  user: User
}

// 文章相关类型
export interface Article {
  _id: string
  title: string
  content: string
  slug: string
  summary?: string  // server端字段名
  coverUrl?: string  // server端字段名
  category: string | Category | null  // 服务器可能返回字符串ID或完整对象，或null
  author: string | User  // 服务器返回作者信息
  tags: string[]
  status: 'draft' | 'published'
  views: number
  createdAt: string
  updatedAt: string
  // SEO字段已在server端模型中移除，使用slug进行SEO优化
}

// 用于表单的文章类型
export interface ArticleFormData {
  title: string
  excerpt: string  // 表单中的摘要字段，保存时映射到server端summary
  content: string
  status: 'draft' | 'published'
  category: string  // 表单中始终使用字符串ID
  tags: string[]
  coverImage?: string  // 表单中的封面字段，保存时映射到server端coverUrl
  seoDescription?: string  // 保留表单字段，虽然server端不使用
  seoKeywords?: string     // 保留表单字段，虽然server端不使用
}

// 分类相关类型
export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  articleCount: number
  createdAt: string
  updatedAt: string
}

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

// 分页相关类型
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  category?: string
  status?: 'draft' | 'published'
}

export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}