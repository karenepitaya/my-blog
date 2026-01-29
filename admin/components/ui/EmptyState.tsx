import React from 'react';
import { cn } from './cn';

export function EmptyState({
  title = '暂无数据',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-fg/12 bg-fg/4 p-8 text-center',
        className,
      )}
    >
      <div className="text-base font-semibold text-fg">{title}</div>
      {description ? (
        <div className="mt-2 text-sm text-muted">{description}</div>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

