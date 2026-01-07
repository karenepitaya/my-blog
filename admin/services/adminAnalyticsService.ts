import { request } from './http';
import { AdminInsightsRange, AdminInsights, getMockAdminInsights } from './adminAnalyticsMock';

export type AdminAnalyticsSession = {
  token: string;
};

export type AdminInsightsParams = {
  range?: AdminInsightsRange;
  force?: boolean;
};

const normalizeRange = (range?: string): AdminInsightsRange => {
  if (range === '24h' || range === '7d') return range;
  return '1h';
};

const shouldUseMock = () => import.meta.env.VITE_ANALYTICS_MOCK === 'true';

const buildQuery = (range: AdminInsightsRange, force?: boolean) => {
  const params = new URLSearchParams({ range });
  if (force) params.set('force', '1');
  return params.toString();
};

export const AdminAnalyticsService = {
  async getInsights(
    session: AdminAnalyticsSession | null,
    params: AdminInsightsParams = {}
  ): Promise<AdminInsights> {
    const range = normalizeRange(params.range);

    if (shouldUseMock() || !session?.token) {
      return getMockAdminInsights(range);
    }

    try {
      const query = buildQuery(range, params.force);
      return await request<AdminInsights>(`/admin/analytics/insights?${query}`, {
        token: session.token,
      });
    } catch (err) {
      console.warn('Admin analytics API failed, falling back to mock data.', err);
      return getMockAdminInsights(range);
    }
  },
};

