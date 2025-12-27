
import { Article, User } from '../types';

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

export const AnalyticsService = {
  // 获取核心概览数据
  getOverview: async (): Promise<TrafficData> => {
    await delay();
    return {
      pv: 124580,
      uv: 42300,
      bounceRate: "32.4%",
      avgDuration: "04:12"
    };
  },

  // 获取过去 14 天的每日流量
  getDailyTrends: async (days: number = 14): Promise<DailyPoint[]> => {
    await delay();
    const data: DailyPoint[] = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      data.push({
        date: d.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 5000) + 2000,
        visitors: Math.floor(Math.random() * 2000) + 500
      });
    }
    return data;
  },

  // 获取访问来源统计
  getReferrers: async (): Promise<ReferrerSource[]> => {
    await delay();
    return [
      { source: 'Direct/Bookmark', count: 4500, percentage: 45 },
      { source: 'Google Search', count: 2500, percentage: 25 },
      { source: 'GitHub Referral', count: 1800, percentage: 18 },
      { source: 'Twitter/X', count: 700, percentage: 7 },
      { source: 'Others', count: 500, percentage: 5 },
    ];
  }
};
