import React from 'react';
import { cn } from './cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const variantClass: Record<AlertVariant, string> = {
  info: 'border-secondary/25 bg-secondary/10 text-fg',
  success: 'border-success/25 bg-success/10 text-fg',
  warning: 'border-warning/25 bg-warning/10 text-fg',
  danger: 'border-danger/25 bg-danger/10 text-fg',
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  role = 'status',
}: {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}) {
  return (
    <div
      role={role}
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        variantClass[variant],
        className,
      )}
    >
      {title ? <div className="font-semibold mb-1">{title}</div> : null}
      <div className="text-fg/90">{children}</div>
    </div>
  );
}

