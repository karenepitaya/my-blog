export type AuthorInsightsRange = '7d' | '30d' | '90d' | 'year';

export type SparklinePoint = {
  i: number;
  v: number;
};

export type TrendDataPoint = {
  name: string;
  [key: string]: string | number;
};

export type DistributionDataPoint = {
  name: string;
  value: number;
  color?: string;
};

export type TopArticle = {
  id: string;
  title: string;
  views: number;
  reads: number;
  date: string;
};

export type AuthorInsights = {
  overview: {
    totalReads: number;
    avgDurationSec: number;
    totalLikes: number;
  };
  sparklines: {
    reads: SparklinePoint[];
    duration: SparklinePoint[];
    likes: SparklinePoint[];
  };
  readTrend: TrendDataPoint[];
  funnel: DistributionDataPoint[];
  topArticles: TopArticle[];
};

const rangeScale: Record<AuthorInsightsRange, number> = {
  '7d': 1,
  '30d': 4,
  '90d': 8,
  year: 16,
};

const timeLabels: Record<AuthorInsightsRange, string[]> = {
  '7d': ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  '30d': Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
  '90d': Array.from({ length: 12 }, (_, i) => `${i + 1}周`),
  year: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

const pseudoRand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const generateSparklineData = (base: number, count: number): SparklinePoint[] =>
  Array.from({ length: count }, (_, i) => {
    const jitter = pseudoRand(base + i * 3.13) - 0.5;
    const value = Math.max(0, Math.round(base + jitter * base * 0.6));
    return { i, v: value };
  });

const buildReadTrend = (range: AuthorInsightsRange, base: number): TrendDataPoint[] => {
  const labels = timeLabels[range];
  return labels.map((name, index) => {
    const pulse = 0.7 + Math.sin(index * 0.8) * 0.25 + pseudoRand(index + base) * 0.3;
    const pv = Math.max(120, Math.round(base * 1.6 * pulse));
    const reads = Math.max(80, Math.round(base * pulse));
    return { name, pv, reads };
  });
};

const buildFunnel = (totalReads: number): DistributionDataPoint[] => {
  const pv = Math.round(totalReads * 1.6);
  const reads = totalReads;
  const likes = Math.round(totalReads * 0.12);
  return [
    { name: '浏览 (PV)', value: pv, color: '#64748b' },
    { name: '阅读 (Read)', value: reads, color: '#bd93f9' },
    { name: '点赞 (Like)', value: likes, color: '#ff79c6' },
  ];
};

const mockArticles: TopArticle[] = [
  { id: '1', title: 'Understanding Next.js 14 Server Actions', views: 4230, reads: 3100, date: '2024-03-10' },
  { id: '2', title: 'My Journey into Rust Programming', views: 3500, reads: 2800, date: '2024-03-08' },
  { id: '3', title: 'CSS Grid vs Flexbox', views: 2800, reads: 1400, date: '2024-02-28' },
  { id: '4', title: 'Designing for the Dark Mode', views: 1200, reads: 900, date: '2024-03-05' },
];

export const getMockAuthorInsights = (range: AuthorInsightsRange): AuthorInsights => {
  const scale = rangeScale[range];
  const baseReads = 7800 * scale;
  const overview = {
    totalReads: Math.round(baseReads + 260 * scale),
    avgDurationSec: 252,
    totalLikes: Math.round(840 * scale),
  };

  return {
    overview,
    sparklines: {
      reads: generateSparklineData(500 * scale, 7),
      duration: generateSparklineData(40, 7),
      likes: generateSparklineData(15 * scale, 7),
    },
    readTrend: buildReadTrend(range, 900 * scale),
    funnel: buildFunnel(overview.totalReads),
    topArticles: mockArticles,
  };
};

