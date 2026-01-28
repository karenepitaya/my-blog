import React from 'react';

type CyberSelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type CyberInputBaseProps = {
  label: string;
  wrapperClassName?: string;
  className?: string;
};

type CyberInputProps = CyberInputBaseProps &
  React.InputHTMLAttributes<HTMLInputElement> &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    as?: 'input' | 'select';
    options?: CyberSelectOption[];
  };

export const CyberInput: React.FC<CyberInputProps> = ({ 
  label, 
  wrapperClassName = '', 
  className = '',
  ...props 
}) => {
  const sharedClassName = `
            w-full bg-[#0F111A] text-slate-200 text-base
            border border-white/[0.08] rounded-xl px-4 py-3.5
            focus:outline-none focus:border-primary/50 focus:bg-[#131620]
            focus:shadow-[0_0_0_1px_rgba(168,85,247,0.2)]
            transition-all duration-200 placeholder-slate-600
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/[0.02]
            ${className}
          `;

  return (
    <div className={`group ${wrapperClassName}`}>
      <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative">
        {props.as === 'select' || (Array.isArray((props as any).options) && (props as any).options.length > 0) ? (() => {
          const { options, as: _as, type: _type, ...selectProps } = props as any;
          const safeOptions: CyberSelectOption[] = Array.isArray(options) ? options : [];
          return (
            <select className={sharedClassName} {...selectProps}>
              {safeOptions.map((option) => (
                <option key={String(option.value)} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        })() : (
          <input className={sharedClassName} {...(props as any)} />
        )}
      </div>
    </div>
  );
};
