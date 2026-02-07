import React from 'react';

type DevBadgeProps = {
  label?: string;
};

export const DevBadge: React.FC<DevBadgeProps> = ({ label = '开发中' }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 text-warning text-[10px] font-semibold px-2 py-0.5">
    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
    {label}
  </span>
);
