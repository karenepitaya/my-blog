import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "执行操作",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-[var(--mt-shadow-3)] overflow-hidden">
        <div className="p-7 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-danger/10 border border-danger/20 grid place-items-center text-danger shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-fg">{title}</h3>
              {message ? (
                <p className="text-sm text-muted mt-2 leading-relaxed">{message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-fg/10">
            <Button variant="secondary" onClick={onCancel} className="flex-1">
              放弃请求
            </Button>
            <Button variant="danger" onClick={onConfirm} className="flex-1">
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
