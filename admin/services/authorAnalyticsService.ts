import { request } from './http';
import {
  AuthorInsights,
  AuthorInsightsRange,
  getMockAuthorInsights,
} from './authorAnalyticsMock';

export type AuthorAnalyticsSession = {
  token: string;
};

export type AuthorInsightsParams = {
  range?: AuthorInsightsRange;
  force?: boolean;
};

const normalizeRange = (range?: string): AuthorInsightsRange => {
  if (range === '30d' || range === '90d' || range === 'year') return range;
  return '7d';
};

const shouldUseMock = () => import.meta.env.VITE_ANALYTICS_MOCK === 'true';

const buildQuery = (range: AuthorInsightsRange, force?: boolean) => {
  const params = new URLSearchParams({ range });
  if (force) params.set('force', '1');
  return params.toString();
};

export const AuthorAnalyticsService = {
  async getInsights(
    session: AuthorAnalyticsSession | null,
    params: AuthorInsightsParams = {}
  ): Promise<AuthorInsights> {
    const range = normalizeRange(params.range);

    if (shouldUseMock() || !session?.token) {
      return getMockAuthorInsights(range);
    }

    try {
      const query = buildQuery(range, params.force);
      return await request<AuthorInsights>(`/profile/analytics/insights?${query}`, {
        token: session.token,
      });
    } catch (err) {
      console.warn('作者洞察接口失败，已回退至 Mock 数据。', err);
      return getMockAuthorInsights(range);
    }
  },
};

