import type { APIRoute } from 'astro'
import siteConfig from '~/site.config'
import { dateString } from '~/utils'
import { getPublicArticleByAuthorSlug } from '~/lib/publicApi'
import { renderSocialCardPng } from '~/lib/socialCards'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const author = String(params.author ?? '').trim()
  const slug = String(params.slug ?? '').trim()
  if (!author || !slug) {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const article = await getPublicArticleByAuthorSlug({ authorUsername: author, slug })
    const pubDate = article.publishedAt ? dateString(new Date(article.publishedAt)) : undefined
    const authorName = article.author?.username ?? siteConfig.author

    const png = await renderSocialCardPng({
      title: article.title,
      pubDate,
      author: authorName,
    })

    return new Response(png, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Type': 'image/png',
      },
    })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}

