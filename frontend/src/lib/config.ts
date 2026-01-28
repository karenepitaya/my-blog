export const DEFAULT_PAGE_SIZE = 6
export const PAGE_SIZE_MIN = 1
export const PAGE_SIZE_MAX = 19

export const DEFAULT_RECOMMENDATION_COUNT = 6
export const RECOMMENDATION_COUNT_MIN = 1
export const RECOMMENDATION_COUNT_MAX = 19

export const normalizePageSize = (value: unknown, fallback = DEFAULT_PAGE_SIZE) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const v = Math.floor(n)
  if (v < PAGE_SIZE_MIN) return PAGE_SIZE_MIN
  if (v > PAGE_SIZE_MAX) return PAGE_SIZE_MAX
  return v
}

export const normalizeRecommendationCount = (
  value: unknown,
  fallback = DEFAULT_RECOMMENDATION_COUNT,
) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const v = Math.floor(n)
  if (v < RECOMMENDATION_COUNT_MIN) return RECOMMENDATION_COUNT_MIN
  if (v > RECOMMENDATION_COUNT_MAX) return RECOMMENDATION_COUNT_MAX
  return v
}

