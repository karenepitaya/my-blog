
import React from 'react';

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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-[#21222c] border border-[#ff5545]/30 rounded-2xl shadow-[0_20px_50px_rgba(255,85,69,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#ff5545]/10 flex items-center justify-center text-[#ff5545] border border-[#ff5545]/20 animate-pulse">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-[#f8f8f2] uppercase tracking-tighter italic">{title}</h3>
              {message && (
                <p className="text-xs text-[#6272a4] mt-2 leading-relaxed">{message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#44475a]">
            <button 
              onClick={onCancel} 
              className="flex-1 py-3 text-sm font-black text-[#6272a4] hover:text-[#f8f8f2] uppercase tracking-widest transition-colors"
            >
              放弃请求
            </button>
            <button 
              onClick={onConfirm} 
              className="flex-1 py-3 bg-[#ff5545] hover:bg-[#ff79c6] text-[#282a36] font-black text-sm rounded-xl transition-all shadow-lg uppercase tracking-widest active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
