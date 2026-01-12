export type LogScope = 'FRONTEND' | 'BACKEND' | 'SERVER';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

export interface LogEntry {
  id: number;
  timestamp: string;
  scope: LogScope;
  level: LogLevel;
  source: string;
  message: string;
  traceId: string;
}

