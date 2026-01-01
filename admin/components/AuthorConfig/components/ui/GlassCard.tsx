import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  noPadding = false
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl
        bg-[#44475a]/40 backdrop-blur-md
        border border-white/[0.08]
        transition-all duration-300 ease-out
        shadow-sm
        ${hoverEffect ? 'hover:bg-[#44475a]/60 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5' : ''}
        ${noPadding ? '' : 'p-6'}
        ${className}
      `}
    >
      {/* Subtle top sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      
      {children}
    </div>
  );
};