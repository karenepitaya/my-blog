import React from 'react';
import { Input } from '../../../ui/Input';

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
      <label className="block text-sm font-semibold text-fg mb-2 ml-1 transition-colors group-focus-within:text-fg">
        {label}
      </label>
      <div className="relative">
        <Input className={className} {...props} />
      </div>
    </div>
  );
};
