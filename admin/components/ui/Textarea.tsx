import React from 'react';
import { cn } from './cn';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid = false, ...props }, ref) => {
    return (
      <textarea
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
Textarea.displayName = 'Textarea';

