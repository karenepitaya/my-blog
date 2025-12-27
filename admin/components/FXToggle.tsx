
import React from 'react';

interface FXToggleProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

const FXToggle: React.FC<FXToggleProps> = ({ enabled, onToggle }) => {
  return (
    <div className="fixed top-0 right-0 p-3 md:p-5 z-[110] pointer-events-auto select-none">
      <button
        onClick={() => onToggle(!enabled)}
        className={`
          group relative flex items-center gap-2 px-2 md:px-3 py-1.5 font-mono transition-all duration-300
          border rounded md:rounded-lg outline-none overflow-hidden
          ${enabled 
            ? 'bg-[#50fa7b]/5 border-[#50fa7b]/30 text-[#50fa7b] shadow-[0_0_10px_rgba(80,250,123,0.1)] hover:shadow-[0_0_20px_rgba(80,250,123,0.3)] hover:border-[#50fa7b]/60' 
            : 'bg-[#21222c]/60 backdrop-blur-md border-[#44475a] text-[#6272a4] hover:border-[#bd93f9]/70 hover:text-[#bd93f9] hover:shadow-[0_0_20px_rgba(189,147,249,0.2)]'}
          active:scale-90 active:brightness-125
        `}
      >
        {/* Glow Sweep Effect */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
        
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
        
        {/* Status Led */}
        <div className="relative shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-[#50fa7b] animate-pulse shadow-[0_0_5px_#50fa7b]' : 'bg-[#44475a]'}`} />
        </div>

        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">
            FX_ENG
          </span>
          <span className={`hidden md:block text-[7px] font-bold opacity-60 ${enabled ? 'text-[#50fa7b]' : 'text-[#6272a4]'}`}>
            {enabled ? 'ON_LINE' : 'OFF_LINE'}
          </span>
        </div>

        {/* Decorative corner brackets - only on desktop */}
        <div className="hidden md:block absolute top-0 left-0 w-1 h-1 border-t border-l border-inherit opacity-30" />
        <div className="hidden md:block absolute bottom-0 right-0 w-1 h-1 border-b border-r border-inherit opacity-30" />
      </button>
    </div>
  );
};

export default FXToggle;
