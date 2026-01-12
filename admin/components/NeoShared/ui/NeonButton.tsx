import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '',
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0C15] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary/10 text-primary border border-primary/50 hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] focus:ring-primary",
    secondary: "bg-secondary/10 text-secondary border border-secondary/50 hover:bg-secondary/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] focus:ring-secondary",
    danger: "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(248,113,113,0.4)] focus:ring-red-500",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] focus:ring-emerald-500",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/50 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] focus:ring-amber-500",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};
