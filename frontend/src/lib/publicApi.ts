export type ApiEnvelope<T> = {
  success: boolean
  data: T
  error: unknown
}

export type PublicAuthor = {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
  articleCount: number
  createdAt: string
  updatedAt: string
}

export type PublicCategory = {
  id: string
  ownerId: string
  ownerUsername: string | null
  name: string
  slug: string
  description: string | null
  articleCount: number
  createdAt: string
  updatedAt: string
}

export type PublicTag = {
  id: string
  name: string
  slug: string
  articleCount: number
  createdAt: string
  updatedAt: string
}

export type PublicTagDetail = {
  slug: string
  name: string
}

export type PublicArticleAuthor = {
  id: string
  username: string
  avatarUrl: string | null
  bio: string | null
}

export type PublicArticleCategory = {
  id: string
  name: string
  slug: string
}

export type PublicArticleListItem = {
  id: string
  authorId: string
  author: PublicArticleAuthor | null
  title: string
  slug: string
  summary: string | null
  coverImageUrl: string | null
  tags: string[]
  tagDetails: PublicTagDetail[]
  categoryId: string | null
  category: PublicArticleCategory | null
  firstPublishedAt: string | null
  publishedAt: string | null
  views: number
}

export type PublicArticleTocItem = {
  level: number
  text: string
  id: string
}

export type PublicArticleDetail = PublicArticleListItem & {
  content: {
    html: string | null
    toc: PublicArticleTocItem[]
    renderedAt: string | null
  }
}

export type PagedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function resolveApiBase(): string {
  const raw = import.meta.env.PUBLIC_API_BASE_URL
  const base = raw?.trim() ? raw.trim().replace(/\/$/, '') : 'http://localhost:3000/api'
  return base
}

async function apiGet<T>(path: string): Promise<T> {
  const apiBase = resolveApiBase()
  const url = path.startsWith('http') ? path : `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const json = (await res.json()) as ApiEnvelope<T>
  if (!json?.success) throw new Error('API_ERROR')
  return json.data
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export async function listPublicArticles(input: {
  page: number
  pageSize: number
  authorId?: string
  categoryId?: string
  tag?: string
  q?: string
}): Promise<PagedResult<PublicArticleListItem>> {
  return apiGet(`/public/articles${buildQuery(input)}`)
}

export async function getPublicArticleByAuthorSlug(input: {
  authorUsername: string
  slug: string
}): Promise<PublicArticleDetail> {
  const authorUsername = encodeURIComponent(input.authorUsername)
  const slug = encodeURIComponent(input.slug)
  return apiGet(`/public/articles/by-author/${authorUsername}/${slug}`)
}

export async function getPublicArticleById(id: string): Promise<PublicArticleDetail> {
  const targetId = String(id ?? '').trim()
  if (!targetId) {
    throw new Error('ARTICLE_ID_REQUIRED')
  }
  return apiGet(`/public/articles/${encodeURIComponent(targetId)}`)
}

export async function listPublicAuthors(input: {
  page: number
  pageSize: number
  q?: string
}): Promise<PagedResult<PublicAuthor>> {
  return apiGet(`/public/authors${buildQuery(input)}`)
}

export async function getPublicAuthorByUsername(username: string): Promise<PublicAuthor> {
  return apiGet(`/public/authors/username/${encodeURIComponent(username)}`)
}

export async function listPublicCategories(input: {
  page: number
  pageSize: number
  authorId?: string
}): Promise<PagedResult<PublicCategory>> {
  return apiGet(`/public/categories${buildQuery(input)}`)
}

export async function getPublicCategoryByAuthorSlug(input: {
  authorUsername: string
  slug: string
}): Promise<PublicCategory> {
  const authorUsername = encodeURIComponent(input.authorUsername)
  const slug = encodeURIComponent(input.slug)
  return apiGet(`/public/categories/by-author/${authorUsername}/${slug}`)
}

export async function getPublicCategoryByOwnerIdSlug(input: {
  authorId: string
  slug: string
}): Promise<PublicCategory> {
  const authorId = encodeURIComponent(input.authorId)
  const slug = encodeURIComponent(input.slug)
  return apiGet(`/public/categories/slug/${authorId}/${slug}`)
}

export async function listPublicTags(input: {
  page: number
  pageSize: number
  q?: string
}): Promise<PagedResult<PublicTag>> {
  return apiGet(`/public/tags${buildQuery(input)}`)
}

export async function getPublicTagBySlug(slug: string): Promise<PublicTag> {
  return apiGet(`/public/tags/${encodeURIComponent(slug)}`)
}
