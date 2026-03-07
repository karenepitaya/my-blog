/**
 * Analytics 类型定义
 * 与 Admin 端的类型保持一致，但独立定义避免跨目录引用
 */

// Admin Insights 类型
export type AdminInsightsRange = '1h' | '24h' | '7d';

export type TrendPoint = {
  name: string;
  [key: string]: number | string;
};

export type DistributionPoint = {
  name: string;
  value: number;
  color: string;
};

export type ResourceProcess = {
  pid: number;
  name: string;
  type: string;
  cpu: number;
  mem: number;
  status: 'online' | 'offline' | 'error';
};

export type AdminResourceInsights = {
  processes: ResourceProcess[];
  memoryTrend: TrendPoint[];
  httpStatus: DistributionPoint[];
};

export type AdminDatabaseInsights = {
  crudTrend: TrendPoint[];
  collections: {
    name: string;
    count: number;
    sizeMB: number;
    color: string;
  }[];
};

export type AdminInsights = {
  resources: AdminResourceInsights;
  database: AdminDatabaseInsights;
};

// Author Insights 类型
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
