import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';

export type FloatingTextEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const FloatingTextEditorModal: React.FC<FloatingTextEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <GlassCard className="max-w-2xl w-full relative overflow-hidden" noPadding>
        <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-200">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 transition-colors"
            title="关闭"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <textarea
            ref={inputRef}
            disabled={disabled}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-surface text-fg border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 focus:bg-surface2/40 transition-colors placeholder:text-muted font-mono text-sm leading-relaxed resize-y disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <div className="flex justify-end">
            <NeonButton variant="ghost" onClick={onClose}>
              完成
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
