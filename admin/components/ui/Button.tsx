import React from 'react';
import { cn } from './cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-base rounded-xl',
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-canvas hover:bg-primary/90 active:bg-primary/85 border border-primary/20 shadow-sm',
  secondary:
    'bg-surface text-fg hover:bg-surface2/70 active:bg-surface2/60 border border-border',
  ghost:
    'bg-transparent text-fg hover:bg-fg/5 active:bg-fg/8 border border-transparent',
  danger:
    'bg-danger/15 text-danger hover:bg-danger/20 active:bg-danger/25 border border-danger/25',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled || loading);
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          sizeClass[size],
          variantClass[variant],
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size={16} className="border-current/35" /> : leftIcon}
        <span className="truncate">{children}</span>
        {rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

