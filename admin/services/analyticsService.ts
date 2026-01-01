
import { StatsTool } from '../types';

export interface TrafficData {
  pv: number;
  uv: number;
  bounceRate: string;
  avgDuration: string;
}

export interface DailyPoint {
  date: string;
  views: number;
  visitors: number;
}

export interface ReferrerSource {
  source: string;
  count: number;
  percentage: number;
}

const delay = (ms: number = 300) => new Promise(res => setTimeout(res, ms));

type StatsConfig = {
  endpoint: string | null;
  tool: StatsTool | null;
};

const FALLBACK_OVERVIEW: TrafficData = {
  pv: 124580,
  uv: 42300,
  bounceRate: '32.4%',
  avgDuration: '04:12',
};

const FALLBACK_REFERRERS: ReferrerSource[] = [
  { source: '直接访问', count: 4500, percentage: 45 },
  { source: '搜索引擎', count: 2500, percentage: 25 },
  { source: 'GitHub 引用', count: 1800, percentage: 18 },
  { source: 'X 引流', count: 700, percentage: 7 },
  { source: '其他', count: 500, percentage: 5 },
];

const getStatsConfig = (): StatsConfig => {
  if (typeof window === 'undefined') return { endpoint: null, tool: null };
  try {
    const raw = localStorage.getItem('system_bios_config');
    if (!raw) return { endpoint: null, tool: null };
    const parsed = JSON.parse(raw);
    const endpoint = String(parsed?.admin?.statsApiEndpoint ?? '').trim();
    const tool = (parsed?.admin?.statsTool as StatsTool | undefined) ?? null;
    return { endpoint: endpoint || null, tool };
  } catch (err) {
    return { endpoint: null, tool: null };
  }
};

const unwrapEnvelope = <T,>(payload: any): T => {
  if (!payload || typeof payload !== 'object') return payload as T;
  if ('success' in payload) {
    if (payload.success) return payload.data as T;
    const message = payload?.error?.message ?? 'STATS_API_ERROR';
    throw new Error(message);
  }
  return payload as T;
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`STATS_HTTP_${response.status}`);
  }
  const payload = await response.json();
  return unwrapEnvelope<T>(payload);
};

const fetchFromEndpoint = async <T,>(resource: 'overview' | 'trends' | 'referrers'): Promise<T | null> => {
  const { endpoint } = getStatsConfig();
  if (!endpoint) return null;
  const base = endpoint.replace(/\/$/, '');
  const directUrl = base.includes('{{resource}}') ? base.replace('{{resource}}', resource) : `${base}/${resource}`;
  try {
    return await fetchJson<T>(directUrl);
  } catch (err) {
    const fallbackUrl = `${base}?type=${resource}`;
    try {
      return await fetchJson<T>(fallbackUrl);
    } catch (fallbackErr) {
      return null;
    }
  }
};

const toNumber = (value: unknown, fallback: number) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toPercent = (value: unknown, fallback: string) => {
  if (typeof value === 'string' && value.trim()) return value;
  const num = Number(value);
  if (Number.isFinite(num)) return `${num.toFixed(1)}%`;
  return fallback;
};

const toDuration = (value: unknown, fallback: string) => {
  if (typeof value === 'string' && value.trim()) return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const minutes = Math.floor(num / 60);
  const seconds = Math.floor(num % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const normalizeOverview = (input: any): TrafficData => ({
  pv: toNumber(input?.pv, FALLBACK_OVERVIEW.pv),
  uv: toNumber(input?.uv, FALLBACK_OVERVIEW.uv),
  bounceRate: toPercent(input?.bounceRate, FALLBACK_OVERVIEW.bounceRate),
  avgDuration: toDuration(input?.avgDuration, FALLBACK_OVERVIEW.avgDuration),
});

const normalizeTrends = (input: any, days: number): DailyPoint[] => {
  if (!Array.isArray(input) || input.length === 0) return [];
  return input
    .slice(-days)
    .map((item: any, index: number) => ({
      date: String(item?.date ?? item?.day ?? '').trim() || `${index + 1}`,
      views: toNumber(item?.views, 0),
      visitors: toNumber(item?.visitors, 0),
    }));
};

const normalizeReferrers = (input: any): ReferrerSource[] => {
  if (!Array.isArray(input) || input.length === 0) return [];
  return input.map(item => ({
    source: String(item?.source ?? item?.name ?? '').trim() || 'Unknown',
    count: toNumber(item?.count, 0),
    percentage: toNumber(item?.percentage, 0),
  }));
};

export const AnalyticsService = {
  // 获取核心概览数据
  getOverview: async (): Promise<TrafficData> => {
    const remote = await fetchFromEndpoint<TrafficData>('overview');
    if (remote) return normalizeOverview(remote);
    await delay();
    return FALLBACK_OVERVIEW;
  },

  // 获取过去 14 天的每日流量
  getDailyTrends: async (days: number = 14): Promise<DailyPoint[]> => {
    const remote = await fetchFromEndpoint<DailyPoint[]>('trends');
    if (remote) {
      const normalized = normalizeTrends(remote, days);
      if (normalized.length > 0) return normalized;
    }
    await delay();
    const data: DailyPoint[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      data.push({
        date: d.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 5000) + 2000,
        visitors: Math.floor(Math.random() * 2000) + 500,
      });
    }
    return data;
  },

  // 获取访问来源统计
  getReferrers: async (): Promise<ReferrerSource[]> => {
    const remote = await fetchFromEndpoint<ReferrerSource[]>('referrers');
    if (remote) {
      const normalized = normalizeReferrers(remote);
      if (normalized.length > 0) return normalized;
    }
    await delay();
    return FALLBACK_REFERRERS;
  },
};
