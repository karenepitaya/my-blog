import type { MiddlewareHandler } from 'astro'
import siteConfig from '~/site.config'

type SiteStatus = {
  siteMode: 'normal' | 'maintenance'
  maintenance: { startAt: string; endAt: string; reason: string } | null
}

const allowExact = new Set([
  '/maintenance',
  '/robots.txt',
  '/rss.xml',
])

const allowPrefixes = [
  '/_astro/',
  '/pagefind/',
  '/social-cards/',
  '/giscus/',
  '/favicon',
  '/sitemap',
  '/api/',
]

let cachedStatus: { value: SiteStatus; loadedAt: number } | null = null
const STATUS_TTL_MS = 3000

function resolveApiBase(fallbackOrigin: string): string {
  const raw = import.meta.env?.PUBLIC_API_BASE_URL as string | undefined
  if (raw?.trim()) return raw.trim().replace(/\/$/, '')
  try {
    const url = new URL(fallbackOrigin)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return 'http://localhost:3000/api'
  } catch {
  }
  return `${fallbackOrigin}/api`
}

async function getLiveStatus(origin: string): Promise<SiteStatus | null> {
  const now = Date.now()
  if (cachedStatus && now - cachedStatus.loadedAt < STATUS_TTL_MS) return cachedStatus.value

  try {
    const apiBase = resolveApiBase(origin)
    const fetchOnce = async (base: string) => {
      const res = await fetch(`${base}/public/site-status`, {
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return null
      const json = (await res.json()) as { success: boolean; data?: SiteStatus }
      if (!json?.success || !json.data) return null
      return json.data
    }

    const first = await fetchOnce(apiBase)
    if (first) {
      cachedStatus = { value: first, loadedAt: now }
      return first
    }

    if (apiBase.includes('://localhost')) {
      const ipv4Base = apiBase.replace('://localhost', '://127.0.0.1')
      const second = await fetchOnce(ipv4Base)
      if (second) {
        cachedStatus = { value: second, loadedAt: now }
        return second
      }
    }

    return null
  } catch {
    return null
  }
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const localMode = siteConfig.siteMode
  const liveMode = (await getLiveStatus(context.url.origin))?.siteMode
  const mode = liveMode ?? localMode ?? 'normal'
  if (mode !== 'maintenance') {
    const res = await next()
    res.headers.set('x-site-mode', mode)
    return res
  }

  const pathname = context.url.pathname
  if (allowExact.has(pathname) || allowPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    const res = await next()
    res.headers.set('x-site-mode', 'maintenance-allow')
    return res
  }

  const res = context.redirect('/maintenance', 302)
  res.headers.set('x-site-mode', 'maintenance')
  return res
}
