import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { GlassCard } from './GlassCard';

export type NeoToastType = 'success' | 'error' | 'warning' | 'info';

export type NeoToastItem = {
  id: string;
  type: NeoToastType;
  title?: string;
  message: React.ReactNode;
  durationMs?: number;
};

type NeoToastApi = {
  show: (input: Omit<NeoToastItem, 'id'> & { id?: string }) => string;
  success: (message: React.ReactNode, options?: { title?: string; durationMs?: number }) => string;
  error: (message: React.ReactNode, options?: { title?: string; durationMs?: number }) => string;
  warning: (message: React.ReactNode, options?: { title?: string; durationMs?: number }) => string;
  info: (message: React.ReactNode, options?: { title?: string; durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const NeoToastContext = createContext<NeoToastApi | null>(null);

function createToastId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cryptoAny = crypto as any;
    if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const NeoToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<NeoToastItem[]>([]);
  const timersRef = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
    for (const timer of timersRef.current.values()) window.clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  const show = useCallback(
    (input: Omit<NeoToastItem, 'id'> & { id?: string }) => {
      const id = input.id ?? createToastId();
      const durationMs = input.durationMs ?? 2800;
      const item: NeoToastItem = { ...input, id, durationMs };

      setToasts(prev => [item, ...prev].slice(0, 6));

      if (durationMs > 0) {
        const timer = window.setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo<NeoToastApi>(
    () => ({
      show,
      success: (message, options) =>
        show({ type: 'success', title: options?.title, message, durationMs: options?.durationMs }),
      error: (message, options) =>
        show({ type: 'error', title: options?.title ?? '操作失败', message, durationMs: options?.durationMs ?? 3600 }),
      warning: (message, options) =>
        show({ type: 'warning', title: options?.title ?? '提示', message, durationMs: options?.durationMs ?? 3600 }),
      info: (message, options) =>
        show({ type: 'info', title: options?.title, message, durationMs: options?.durationMs }),
      dismiss,
      clear,
    }),
    [dismiss, show, clear]
  );

  const styleByType: Record<
    NeoToastType,
    { icon: React.ComponentType<any>; accent: string; border: string; glow: string; text: string }
  > = {
    success: {
      icon: CheckCircle2,
      accent: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.22)]',
      text: 'text-emerald-300',
    },
    error: {
      icon: AlertTriangle,
      accent: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.22)]',
      text: 'text-red-300',
    },
    warning: {
      icon: ShieldAlert,
      accent: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.22)]',
      text: 'text-amber-300',
    },
    info: {
      icon: Info,
      accent: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.22)]',
      text: 'text-cyan-300',
    },
  };

  return (
    <NeoToastContext.Provider value={api}>
      {children}
      <div className="fixed top-5 right-5 z-[150] w-[360px] max-w-[calc(100vw-2.5rem)] space-y-3">
        {toasts.map(t => {
          const s = styleByType[t.type];
          const Icon = s.icon;
          return (
            <GlassCard
              key={t.id}
              className={`overflow-hidden border ${s.border} ${s.glow} backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200`}
              noPadding
            >
              <div className={`px-4 py-3 ${s.accent} flex items-start gap-3`}>
                <div className={`mt-0.5 ${s.text}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  {t.title && <div className={`text-sm font-black ${s.text}`}>{t.title}</div>}
                  <div className="text-xs text-slate-200/90 mt-0.5 break-words">{t.message}</div>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="关闭提示"
                >
                  <X size={14} />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </NeoToastContext.Provider>
  );
};

export const useNeoToast = (): NeoToastApi => {
  const ctx = useContext(NeoToastContext);
  if (!ctx) throw new Error('NeoToastProvider is missing');
  return ctx;
};
