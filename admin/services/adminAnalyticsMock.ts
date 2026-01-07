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

const ranges: Record<AdminInsightsRange, number> = {
  '1h': 12,
  '24h': 24,
  '7d': 7,
};

const pseudoRand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const buildTrend = (points: number, base: number, labelPrefix: string) =>
  Array.from({ length: points }, (_, i) => ({
    name: `${labelPrefix}${points - i}`,
    read: Math.floor(base * (0.6 + pseudoRand(i + base) * 0.6)),
    create: Math.floor(base * 0.02 + pseudoRand(i + base * 2) * 8),
    update: Math.floor(base * 0.05 + pseudoRand(i + base * 3) * 12),
    delete: Math.floor(base * 0.008 + pseudoRand(i + base * 4) * 3),
  }));

export const getMockAdminInsights = (range: AdminInsightsRange): AdminInsights => {
  const points = ranges[range];
  const labelPrefix = range === '7d' ? 'D-' : range === '24h' ? 'H-' : 'M-';

  const resources: AdminResourceInsights = {
    processes: [
      { pid: 1024, name: 'Frontend (SSR)', type: 'Node.js', cpu: 12.5, mem: 145, status: 'online' },
      { pid: 1025, name: 'Backend (API)', type: 'Node.js', cpu: 8.2, mem: 210, status: 'online' },
      { pid: 8922, name: 'MongoDB', type: 'Database', cpu: 4.1, mem: 480, status: 'online' },
      { pid: 0, name: 'System Kernel', type: 'OS', cpu: 2.5, mem: 820, status: 'online' },
    ],
    memoryTrend: Array.from({ length: points }, (_, i) => ({
      name: `${labelPrefix}${points - i}`,
      frontend: 140 + pseudoRand(i) * 30,
      backend: 200 + pseudoRand(i + 2) * 35,
      db: 480 + pseudoRand(i + 4) * 20,
    })),
    httpStatus: [
      { name: '200 OK', value: 8540, color: '#50fa7b' },
      { name: '304 Cached', value: 3200, color: '#8be9fd' },
      { name: '4xx Error', value: 120, color: '#ffb86c' },
      { name: '5xx Error', value: 15, color: '#ff5555' },
    ],
  };

  const database: AdminDatabaseInsights = {
    crudTrend: buildTrend(points, range === '7d' ? 1800 : 1400, labelPrefix),
    collections: [
      { name: '文章', count: 142, sizeMB: 45.2, color: '#bd93f9' },
      { name: '用户', count: 8, sizeMB: 0.5, color: '#50fa7b' },
      { name: '资源', count: 520, sizeMB: 1240.0, color: '#8be9fd' },
      { name: '日志', count: 15400, sizeMB: 85.0, color: '#6272a4' },
    ],
  };

  return { resources, database };
};

