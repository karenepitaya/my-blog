
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
          group relative flex items-center gap-2 px-2.5 md:px-3 py-1.5 font-mono transition-colors
          border rounded-lg outline-none
          focus-visible:ring-2 focus-visible:ring-ring
          ${enabled
            ? 'bg-success/10 border-success/25 text-success hover:bg-success/15'
            : 'bg-surface/70 backdrop-blur-sm border-border text-muted hover:border-primary/30 hover:text-fg hover:bg-surface2/60'}
          active:scale-[0.98]
        `}
      >
        {/* Status Led */}
        <div className="relative shrink-0">
          <div
            className={`w-1.5 h-1.5 rounded-full ring-1 ring-border/60 ${
              enabled ? 'bg-success' : 'bg-border'
            }`}
          />
        </div>

        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider">
            FX_ENG
          </span>
          <span
            className={`hidden md:block text-[7px] font-bold opacity-60 ${
              enabled ? 'text-success' : 'text-muted'
            }`}
          >
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
