const DEFAULT_FONT_CSS_ZH =
  'https://karenepitaya.xyz/fonts/current/noto-sans-sc/fonts.css'

const DEFAULT_FONT_CSS_EN =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap'

export const FONT_CSS_ZH =
  (import.meta.env.VITE_FONT_CSS_ZH || '').trim() || DEFAULT_FONT_CSS_ZH

export const FONT_CSS_EN =
  (import.meta.env.VITE_FONT_CSS_EN || '').trim() || DEFAULT_FONT_CSS_EN

const DEFAULT_FONT_ORIGIN = 'https://karenepitaya.xyz'
export const FONT_ORIGIN =
  (import.meta.env.VITE_FONT_ORIGIN || '').trim() || DEFAULT_FONT_ORIGIN

export const resolveFontOrigin = (): string => {
  const raw = FONT_ORIGIN.trim()
  if (!raw) return DEFAULT_FONT_ORIGIN
  try {
    return new URL(raw).origin
  } catch {
    return DEFAULT_FONT_ORIGIN
  }
}

/**
 * This is a "CJK-only" wrapper family name injected at runtime.
 *
 * We generate @font-face rules from the remote CSS and keep only ranges that
 * intersect common CJK Unified Ideographs. This ensures:
 * - Chinese characters use this family (Noto Sans SC from your service)
 * - Latin characters do NOT use this family (unicode-range narrowed)
 * - English can keep its own stack (e.g. JetBrains Mono)
 */
export const ZH_FONT_FAMILY = 'Noto Sans SC ZH'

type UnicodeRange = { start: number; end: number }

const CJK_RANGES: UnicodeRange[] = [
  // CJK Unified Ideographs
  { start: 0x4e00, end: 0x9fff },
  // CJK Unified Ideographs Extension A
  { start: 0x3400, end: 0x4dbf },
  // CJK Unified Ideographs Extension B.. (covers a lot, but safe)
  { start: 0x20000, end: 0x3134f },
  // CJK Symbols and Punctuation
  { start: 0x3000, end: 0x303f },
  // Halfwidth and Fullwidth Forms (Chinese punctuation, fullwidth letters/numbers)
  { start: 0xff00, end: 0xffef },
]

const intersects = (a: UnicodeRange, b: UnicodeRange) =>
  a.start <= b.end && b.start <= a.end

const intersect = (a: UnicodeRange, b: UnicodeRange): UnicodeRange | null => {
  if (!intersects(a, b)) return null
  return { start: Math.max(a.start, b.start), end: Math.min(a.end, b.end) }
}

const parseUnicodeRanges = (value: string): UnicodeRange[] => {
  // Example: "U+4E00-9FFF,U+3400-4DBF,U+3001"
  const parts = value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  const ranges: UnicodeRange[] = []
  for (const part of parts) {
    const m = /^U\+([0-9A-Fa-f]{1,6})(?:-([0-9A-Fa-f]{1,6}))?$/.exec(part)
    if (!m) continue
    const start = parseInt(m[1], 16)
    const end = parseInt(m[2] || m[1], 16)
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    ranges.push({ start: Math.min(start, end), end: Math.max(start, end) })
  }
  return ranges
}

const isCjkFontFace = (unicodeRangeValue: string): boolean => {
  const ranges = parseUnicodeRanges(unicodeRangeValue)
  if (ranges.length === 0) return false
  return ranges.some((r) => CJK_RANGES.some((cjk) => intersects(r, cjk)))
}

const toUnicodeRangeCss = (ranges: UnicodeRange[]): string => {
  const parts = ranges.map((r) => {
    const s = r.start.toString(16).toUpperCase()
    const e = r.end.toString(16).toUpperCase()
    return r.start === r.end ? `U+${s}` : `U+${s}-${e}`
  })
  return parts.join(', ')
}

const narrowToCjkRanges = (unicodeRangeValue: string): string | null => {
  const ranges = parseUnicodeRanges(unicodeRangeValue)
  if (ranges.length === 0) return null

  const narrowed: UnicodeRange[] = []
  for (const r of ranges) {
    for (const cjk of CJK_RANGES) {
      const x = intersect(r, cjk)
      if (x) narrowed.push(x)
    }
  }
  if (narrowed.length === 0) return null
  return toUnicodeRangeCss(narrowed)
}

const extractFontFaceBlocks = (cssText: string): string[] => {
  const matches = cssText.match(/@font-face\s*{[\s\S]*?}\s*/g)
  return matches ? matches.map((x) => x.trim()).filter(Boolean) : []
}

const rewriteUrl = (
  raw: string,
  cssUrl: string,
  fontOrigin: string,
): string => {
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('data:')) {
    return trimmed
  }
  // Root-relative => resolve against fontOrigin, not localhost.
  if (trimmed.startsWith('/')) {
    return new URL(trimmed, fontOrigin).toString()
  }
  // ./files/... or files/... => resolve against CSS URL.
  return new URL(trimmed, cssUrl).toString()
}

const rewriteFontFaceBlock = (
  block: string,
  cssUrl: string,
  fontOrigin: string,
): string => {
  let out = block

  // Remap the font-family name to our wrapper family.
  out = out.replace(
    /font-family:\s*(['"])Noto Sans SC Variable\1\s*;/g,
    `font-family: '${ZH_FONT_FAMILY}';`,
  )

  // Narrow unicode-range to CJK-only ranges so Latin glyphs never use this family.
  out = out.replace(/unicode-range:\s*([^;]+);/gi, (_m, value) => {
    const narrowed = narrowToCjkRanges(String(value || '').trim())
    if (!narrowed) return 'unicode-range: U+4E00-9FFF;'
    return `unicode-range: ${narrowed};`
  })

  // Rewrite all url(...) to absolute URLs.
  out = out.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_m, q, url) => {
    const abs = rewriteUrl(String(url || ''), cssUrl, fontOrigin)
    return `url(${q || ''}${abs}${q || ''})`
  })

  return out
}

const buildCjkOnlyCss = (cssText: string, cssUrl: string, fontOrigin: string): string => {
  const blocks = extractFontFaceBlocks(cssText)
  const kept: string[] = []

  for (const block of blocks) {
    const unicodeMatch = /unicode-range:\s*([^;]+);/i.exec(block)
    if (!unicodeMatch) continue
    if (!isCjkFontFace(unicodeMatch[1].trim())) continue
    kept.push(rewriteFontFaceBlock(block, cssUrl, fontOrigin))
  }

  return kept.join('\n\n')
}

const ensureLinkOnce = (selector: string, create: () => HTMLLinkElement) => {
  const existing = document.querySelector<HTMLLinkElement>(selector)
  if (existing) return existing
  const link = create()
  document.head.appendChild(link)
  return link
}

const normalizeOrigin = (raw: string): string | null => {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed).origin
  } catch {
    return null
  }
}

/**
 * Injects:
 * - preconnect/preload/stylesheet for FONT_CSS_ZH (one time)
 * - a generated <style> containing CJK-only @font-face rules (one time)
 */
export async function applyFontLinkOnce(): Promise<void> {
  if (typeof document === 'undefined') return

  const styleId = 'mt-fontfaces-zh-cjk-only'
  if (document.getElementById(styleId)) return

  const cssUrl = FONT_CSS_ZH
  const fontOrigin = resolveFontOrigin()

  ensureLinkOnce('link[data-mt-font-preconnect="zh"]', () => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = fontOrigin
    link.crossOrigin = 'anonymous'
    link.setAttribute('data-mt-font-preconnect', 'zh')
    return link
  })

  ensureLinkOnce('link[data-mt-font-preload="zh"]', () => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = cssUrl
    link.crossOrigin = 'anonymous'
    link.setAttribute('data-mt-font-preload', 'zh')
    return link
  })

  ensureLinkOnce('link[data-mt-font-stylesheet="zh"]', () => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssUrl
    link.crossOrigin = 'anonymous'
    link.setAttribute('data-mt-font-stylesheet', 'zh')
    return link
  })

  // English mono font (JetBrains Mono) - injected once globally.
  const enCssUrl = FONT_CSS_EN
  const enCssOrigin = normalizeOrigin(enCssUrl)
  if (enCssOrigin) {
    ensureLinkOnce('link[data-mt-font-preconnect="en-css"]', () => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = enCssOrigin
      link.crossOrigin = 'anonymous'
      link.setAttribute('data-mt-font-preconnect', 'en-css')
      return link
    })
  }

  // Google Fonts serves the CSS from googleapis, fonts from gstatic.
  // Preconnect gstatic improves reliability of font file fetching.
  ensureLinkOnce('link[data-mt-font-preconnect="en-fonts"]', () => {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = 'https://fonts.gstatic.com'
    link.crossOrigin = 'anonymous'
    link.setAttribute('data-mt-font-preconnect', 'en-fonts')
    return link
  })

  ensureLinkOnce('link[data-mt-font-preload="en"]', () => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = enCssUrl
    link.crossOrigin = 'anonymous'
    link.setAttribute('data-mt-font-preload', 'en')
    return link
  })

  ensureLinkOnce('link[data-mt-font-stylesheet="en"]', () => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = enCssUrl
    link.crossOrigin = 'anonymous'
    link.setAttribute('data-mt-font-stylesheet', 'en')
    return link
  })

  const resp = await fetch(cssUrl, { mode: 'cors', credentials: 'omit' })
  if (!resp.ok) {
    // Leave the stylesheet link in place so the user can still debug network/CORS.
    // Without the generated CJK-only family, the page will keep the original fonts.
    return
  }
  const remoteCss = await resp.text()
  const cjkCss = buildCjkOnlyCss(remoteCss, cssUrl, fontOrigin)
  if (!cjkCss.trim()) return

  const style = document.createElement('style')
  style.id = styleId
  style.setAttribute('data-mt-fontfaces', 'zh-cjk-only')
  style.textContent = cjkCss
  document.head.appendChild(style)
}
