import request from '@/api/request'
import type { Article, PaginationParams } from '@/types'

// 获取文章列表 - 修正代理路径
export const getArticles = async (params: PaginationParams) => {
  const response = await request.get('/articles/list', { params })
  // 服务器返回格式：{ page, pageSize, count, articles }
  return {
    data: response.articles || [],
    articles: response.articles || [],
    page: response.page || params.page,
    pageSize: response.pageSize || params.limit,
    count: response.count || 0
  }
}

// 获取单个文章详情 - server端直接返回文章对象
export const getArticle = async (id: string): Promise<Article> => {
  const response = await request.get<Article>(`/api/articles/${id}`)
  return response
}

// 创建文章 - server端返回 { message, article }
export const createArticle = async (data: Partial<Article>): Promise<Article> => {
  const response = await request.post('/api/articles/create', data)
  return response.article
}

// 更新文章 - server端返回 { message, article }
export const updateArticle = async (id: string, data: Partial<Article>): Promise<Article> => {
  const response = await request.put(`/api/articles/${id}`, data)
  return response.article
}

// 删除文章 - server端返回 { message, deletedArticleId }
export const deleteArticle = async (id: string): Promise<any> => {
  const response = await request.delete(`/api/articles/${id}`)
  return response
}

// 发布文章 - server端返回 { message, article }
export const publishArticle = async (id: string): Promise<Article> => {
  const response = await request.post(`/api/articles/${id}/publish`)
  return response.article
}

// 取消发布文章 - server端返回 { message, article }
export const unpublishArticle = async (id: string): Promise<Article> => {
  const response = await request.post(`/api/articles/${id}/unpublish`)
  return response.article
}

// 搜索文章 - server端返回分页结构
export const searchArticles = async (query: string) => {
  const response = await request.get('/api/articles/search', {
    params: { keyword: query }
  })
  // 服务器返回格式：{ page, pageSize, count, articles }
  return {
    data: response.articles || [],
    pagination: {
      page: response.page || 1,
      limit: response.pageSize || 10,
      total: response.count || 0,
      totalPages: Math.ceil((response.count || 0) / (response.pageSize || 10))
    }
  }
}