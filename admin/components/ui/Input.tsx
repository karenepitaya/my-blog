import React from 'react';
import { cn } from './cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-surface border text-fg rounded-xl px-4 py-3 shadow-inner',
          'placeholder:text-muted/90',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          invalid && 'border-danger/40 focus:border-danger/60 focus:ring-danger/20',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

