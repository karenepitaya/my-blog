import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm transform transition-all scale-100">
        <div className="
          relative bg-[#1a1c2e] border border-red-500/30 rounded-2xl p-6 text-center
          shadow-[0_0_40px_rgba(239,68,68,0.2)]
          overflow-hidden
        ">
          {/* Animated Glow Border Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
              <AlertTriangle size={32} />
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 tracking-wide italic">
            TERMINATE SESSION
          </h3>
          
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Are you sure you want to disconnect from the mainframe? All unsaved local data buffers will be purged.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Abort
            </button>
            <button
              onClick={onConfirm}
              className="
                px-6 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold
                bg-gradient-to-r from-red-600 to-red-500 text-white
                shadow-[0_0_20px_rgba(239,68,68,0.4)]
                hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]
                hover:scale-105 transition-all duration-200
              "
            >
              Confirm Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};