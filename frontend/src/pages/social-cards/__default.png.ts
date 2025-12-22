import type { APIRoute } from 'astro'
import siteConfig from '~/site.config'
import { renderSocialCardPng } from '~/lib/socialCards'

export const prerender = false

export const GET: APIRoute = async () => {
  const png = await renderSocialCardPng({
    title: siteConfig.title,
    author: siteConfig.author,
  })

  return new Response(png, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Type': 'image/png',
    },
  })
}

