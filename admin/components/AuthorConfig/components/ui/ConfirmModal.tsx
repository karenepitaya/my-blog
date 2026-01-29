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
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'primary',
  confirmText = '确认',
  cancelText = '取消'
}) => {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: AlertTriangle,
      colorClass: 'text-danger',
      bgClass: 'bg-danger/10',
      borderClass: 'border-danger/25',
      shadowClass: 'shadow-[var(--mt-shadow-2)]',
      btnVariant: 'danger' as const
    },
    warning: {
      icon: ShieldAlert,
      colorClass: 'text-warning',
      bgClass: 'bg-warning/10',
      borderClass: 'border-warning/25',
      shadowClass: 'shadow-[var(--mt-shadow-2)]',
      btnVariant: 'warning' as const
    },
    success: {
      icon: CheckCircle2,
      colorClass: 'text-success',
      bgClass: 'bg-success/10',
      borderClass: 'border-success/25',
      shadowClass: 'shadow-[var(--mt-shadow-2)]',
      btnVariant: 'success' as const
    },
    info: {
      icon: Info,
      colorClass: 'text-secondary',
      bgClass: 'bg-secondary/10',
      borderClass: 'border-secondary/25',
      shadowClass: 'shadow-[var(--mt-shadow-2)]',
      btnVariant: 'secondary' as const
    },
    primary: {
      icon: HelpCircle,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10',
      borderClass: 'border-primary/25',
      shadowClass: 'shadow-[var(--mt-shadow-2)]',
      btnVariant: 'primary' as const
    }
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
       {/* Click outside to close */}
       <div className="absolute inset-0" onClick={onClose} />
       
       <GlassCard className={`max-w-md w-full ${style.borderClass} ${style.shadowClass} relative overflow-hidden`} noPadding>
          {/* Top accent line */}
          <div className={`h-1 w-full ${style.bgClass.replace('/10', '')} opacity-50`} />
          
          <div className="p-6">
            <div className="flex items-start gap-5">
                <div className={`p-3 rounded-xl ${style.bgClass} ${style.colorClass} shrink-0 border border-fg/10`}>
                    <Icon size={24} />
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${style.colorClass} flex items-center justify-between`}>
                      {title}
                    </h3>
                    <div className="text-fg/85 text-sm leading-relaxed mb-6">
                      {message}
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <NeonButton variant="ghost" onClick={onClose} className="px-4">
                          {cancelText}
                      </NeonButton>
                      <NeonButton variant={style.btnVariant} onClick={onConfirm} className="px-6">
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
