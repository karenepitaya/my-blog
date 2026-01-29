
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = false,
  noPadding = false,
  ...props
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-2xl
        bg-fg/6 backdrop-blur-sm
        border border-fg/12
        transition-colors duration-200 ease-out
        shadow-sm
        ${hoverEffect ? 'hover:bg-fg/8 hover:border-primary/25' : ''}
        ${noPadding ? '' : 'p-6 md:p-8'}
        ${className}
      `}
      {...props}
    >
      {/* Subtle top sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fg/10 to-transparent opacity-60" />
      
      {children}
    </div>
  );
};
