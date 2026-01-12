import React from 'react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { AlertTriangle, Info, CheckCircle2, ShieldAlert, HelpCircle, X } from 'lucide-react';

export type ConfirmModalType = 'danger' | 'warning' | 'success' | 'info' | 'primary';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  type?: ConfirmModalType;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  closeDisabled?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'primary',
  confirmText = '确认',
  cancelText = '取消',
  confirmDisabled = false,
  cancelDisabled = false,
  closeDisabled = false,
}) => {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: AlertTriangle,
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-500/30',
      shadowClass: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]',
      btnVariant: 'danger' as const
    },
    warning: {
      icon: ShieldAlert,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
      shadowClass: 'shadow-[0_0_40px_rgba(245,158,11,0.3)]',
      btnVariant: 'warning' as const
    },
    success: {
      icon: CheckCircle2,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      shadowClass: 'shadow-[0_0_40px_rgba(16,185,129,0.3)]',
      btnVariant: 'success' as const
    },
    info: {
      icon: Info,
      colorClass: 'text-cyan-400',
      bgClass: 'bg-cyan-500/10',
      borderClass: 'border-cyan-500/30',
      shadowClass: 'shadow-[0_0_40px_rgba(6,182,212,0.3)]',
      btnVariant: 'secondary' as const
    },
    primary: {
      icon: HelpCircle,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      borderClass: 'border-primary/30',
      shadowClass: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]',
      btnVariant: 'primary' as const
    }
  };

  const style = config[type];
  const Icon = style.icon;

  return (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={closeDisabled ? undefined : onClose} />
        
        <GlassCard className={`max-w-md w-full ${style.borderClass} ${style.shadowClass} relative overflow-hidden`} noPadding>
          {/* Top accent line */}
          <div className={`h-1 w-full ${style.bgClass.replace('/10', '')} opacity-50`} />
          
          <div className="p-6">
            <div className="flex items-start gap-5">
                <div className={`p-3 rounded-xl ${style.bgClass} ${style.colorClass} shrink-0 border border-white/5`}>
                    <Icon size={24} />
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-bold mb-2 ${style.colorClass} flex items-center justify-between`}>
                      {title}
                    </h3>
                    <div className="text-slate-300 text-sm leading-relaxed mb-6 opacity-90">
                      {message}
                    </div>
                    
                     <div className="flex justify-end gap-3">
                      <NeonButton
                        variant="ghost"
                        onClick={onClose}
                        disabled={cancelDisabled || closeDisabled}
                        className="px-4"
                      >
                          {cancelText}
                      </NeonButton>
                      <NeonButton variant={style.btnVariant} onClick={onConfirm} disabled={confirmDisabled} className="px-6">
                          {confirmText}
                      </NeonButton>
                    </div>
                </div>
            </div>
          </div>
       </GlassCard>
    </div>
  );
};
