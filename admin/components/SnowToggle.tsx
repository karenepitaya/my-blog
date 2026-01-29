
import React from 'react';

interface SnowToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  collapsed?: boolean;
}

const SnowToggle: React.FC<SnowToggleProps> = ({ enabled, onToggle, collapsed = false }) => {
  return (
    <div className={`flex items-center transition-all duration-300 ${collapsed ? 'justify-center' : 'px-4 w-full'}`}>
      <button
        onClick={() => onToggle(!enabled)}
        title={enabled ? "关闭环境特效" : "开启环境特效"}
        className={`
          flex items-center gap-3 rounded-lg border font-mono text-[11px] font-black uppercase tracking-widest transition-colors active:scale-[0.98]
          focus-visible:ring-2 focus-visible:ring-ring
          ${enabled
            ? 'bg-success/10 border-success/25 text-success'
            : 'bg-surface/60 border-border text-muted hover:text-fg hover:border-primary/30 hover:bg-surface2/60'}
          ${collapsed ? 'w-10 h-10 justify-center' : 'px-4 py-2 w-full'}
        `}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ring-1 ring-border/60 ${enabled ? 'bg-success' : 'bg-muted'}`} />
        {!collapsed && <span className="truncate">特效控制: {enabled ? '已开启' : '已禁用'}</span>}
      </button>
    </div>
  );
};

export default SnowToggle;
