import React from 'react';
import { cn } from './cn';

export function Spinner({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-fg/30 border-t-transparent',
        className,
      )}
      style={{ width: size, height: size }}
    />
  );
}

