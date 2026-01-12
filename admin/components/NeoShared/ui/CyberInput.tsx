import React from 'react';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
}

export const CyberInput: React.FC<CyberInputProps> = ({ 
  label, 
  wrapperClassName = '', 
  className = '',
  ...props 
}) => {
  return (
    <div className={`group ${wrapperClassName}`}>
      <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative">
        <input 
          className={`
            w-full bg-[#0F111A] text-slate-200 text-base
            border border-white/[0.08] rounded-xl px-4 py-3.5
            focus:outline-none focus:border-primary/50 focus:bg-[#131620]
            focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)]
            transition-all duration-200 placeholder-slate-600
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/[0.02]
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};
