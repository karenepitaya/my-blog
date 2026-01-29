import React from 'react';
import { cn } from './cn';

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-fg/12 bg-fg/6 shadow-sm',
        padded ? 'p-6 md:p-8' : '',
        className,
      )}
    >
      {children}
    </div>
  );
}

