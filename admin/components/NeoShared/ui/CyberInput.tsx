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
            w-full bg-surface text-fg text-base
            border border-border rounded-xl px-4 py-3.5
            focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20
            transition-colors duration-200 placeholder:text-muted/90
            disabled:opacity-60 disabled:cursor-not-allowed
            ${className}
          `;

  return (
    <div className={`group ${wrapperClassName}`}>
      <label className="block text-sm font-semibold text-fg mb-2 ml-1 transition-colors group-focus-within:text-fg">
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
