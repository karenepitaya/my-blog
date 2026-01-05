import React from 'react';
import { Pencil } from 'lucide-react';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
  editable?: boolean;
  onEditClick?: () => void;
}

export const CyberInput: React.FC<CyberInputProps> = ({ 
  label, 
  wrapperClassName = '', 
  editable = false,
  onEditClick,
  className = '',
  ...props 
}) => {
  return (
    <div className={wrapperClassName}>
      <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative">
        <input 
          className={`
            w-full bg-[#0F111A] text-slate-200 
            border border-white/[0.08] rounded-xl px-4 py-3
            focus:outline-none focus:border-primary/50 focus:bg-[#131620]
            focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)]
            transition-all duration-200 placeholder-slate-600
            ${className}
          `}
          {...props}
        />
        {editable && (
          <button 
            type="button"
            onClick={onEditClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
