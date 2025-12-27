
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
          flex items-center gap-3 rounded-lg border font-mono text-[11px] font-black uppercase tracking-widest transition-all active:scale-95
          ${enabled 
            ? 'bg-[#50fa7b]/5 border-[#50fa7b]/40 text-[#50fa7b]' 
            : 'bg-[#44475a]/10 border-[#44475a] text-[#6272a4] hover:border-[#6272a4] hover:text-[#f8f8f2]'}
          ${collapsed ? 'w-10 h-10 justify-center' : 'px-4 py-2 w-full'}
        `}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${enabled ? 'bg-[#50fa7b] animate-pulse shadow-[0_0_8px_#50fa7b]' : 'bg-[#6272a4]'}`} />
        {!collapsed && <span className="truncate">特效控制: {enabled ? '已开启' : '已禁用'}</span>}
      </button>
    </div>
  );
};

export default SnowToggle;
