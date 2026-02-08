
import { LogEntry, LogLevel, LogScope } from '../types';

const MOCK_SOURCES_BY_SCOPE: Record<LogScope, string[]> = {
    FRONTEND: ['Visitor-Client', 'React-SSR', 'Asset-Loader', 'Web-Vitals', 'Router-Transition'],
    BACKEND: ['Admin-API', 'Auth-Guard', 'Content-Service', 'Media-Upload', 'Audit-Logger'],
    SERVER: ['Nginx-Proxy', 'Database-Pool', 'Redis-Cache', 'System-Kernel', 'Docker-Swarm']
};

const MOCK_MESSAGES_BY_LEVEL: Record<LogLevel, string[]> = {
    INFO: ['Request received', 'Health check passed', 'Cache refreshed', 'User session started', 'Component mounted', 'Data fetched'],
    WARN: ['High latency detected', 'Memory usage > 80%', 'Rate limit approaching', 'Deprecated API usage', 'Slow render detected'],
    ERROR: ['Connection refused', 'Timeout awaiting response', 'NullPointer Exception', 'Database transaction failed', 'Hydration Mismatch'],
    SUCCESS: ['Job completed successfully', 'Deployment finished', 'Backup verified', 'Data synced', 'Page loaded']
};

type Listener = (logs: LogEntry[]) => void;

class LogService {
    private logs: LogEntry[] = [];
    private listeners: Listener[] = [];
    private currentId = 1;
    private autoGenInterval: ReturnType<typeof setInterval> | null = null;
    private maxLogs = 500;

    constructor() {
        this.addBatch(20);
    }

    public subscribe(listener: Listener): () => void {
        this.listeners.push(listener);
        listener(this.logs);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.logs));
    }

    
    public getLogs() {
        return this.logs;
    }

    public clearLogs() {
        this.logs = [];
        this.notify();
    }

    public addLog(entry: Partial<LogEntry> & { scope?: LogScope, level?: LogLevel }) {
        const fullEntry: LogEntry = {
            id: this.currentId++,
            timestamp: new Date().toISOString(),
            scope: entry.scope || 'SERVER',
            level: entry.level || 'INFO',
            source: entry.source || 'Manual-Trigger',
            message: entry.message || 'Manual log entry',
            traceId: entry.traceId || Math.random().toString(36).substring(2, 10).toUpperCase()
        };

        this.logs = [...this.logs, fullEntry];
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(this.logs.length - this.maxLogs);
        }
        this.notify();
    }

    public addBatch(count: number) {
        const newLogs = Array.from({ length: count }, () => this.generateRandomEntry(this.currentId++));
        this.logs = [...this.logs, ...newLogs];
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(this.logs.length - this.maxLogs);
        }
        this.notify();
    }


    public startAutoGeneration(intervalMs: number = 1500) {
        if (this.autoGenInterval) return;
        this.autoGenInterval = setInterval(() => {
            this.addLog(this.generateRandomEntry(this.currentId++));
        }, intervalMs);
    }

    public stopAutoGeneration() {
        if (this.autoGenInterval) {
            clearInterval(this.autoGenInterval);
            this.autoGenInterval = null;
        }
    }

    public isRunning() {
        return !!this.autoGenInterval;
    }

    
    private generateRandomEntry(id: number): LogEntry {
        const levels: LogLevel[] = ['INFO', 'INFO', 'INFO', 'WARN', 'SUCCESS', 'ERROR'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        
        const scopes: LogScope[] = ['FRONTEND', 'BACKEND', 'SERVER'];
        const scope = scopes[Math.floor(Math.random() * scopes.length)];
        
        const sources = MOCK_SOURCES_BY_SCOPE[scope];
        const source = sources[Math.floor(Math.random() * sources.length)];
        
        const msgs = MOCK_MESSAGES_BY_LEVEL[level];
        const baseMsg = msgs[Math.floor(Math.random() * msgs.length)];
        const message = level === 'ERROR' 
            ? `${baseMsg} [Code: ${Math.floor(Math.random() * 500)}]` 
            : baseMsg;
        
        return {
            id,
            timestamp: new Date().toISOString(),
            scope,
            level,
            source,
            message,
            traceId: Math.random().toString(36).substring(2, 10).toUpperCase()
        };
    }
}

export const LogMockService = new LogService();
