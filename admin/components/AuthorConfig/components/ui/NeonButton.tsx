import React from 'react';
import { Button } from '../../../ui/Button';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  loading = false,
  className = '',
  ...props 
}) => {
  const mappedVariant =
    variant === 'danger'
      ? 'danger'
      : variant === 'ghost'
        ? 'ghost'
        : variant === 'secondary'
          ? 'secondary'
          : 'primary';

  const semanticClassName =
    variant === 'success'
      ? 'bg-success/12 text-success border border-success/25 hover:bg-success/18'
      : variant === 'warning'
        ? 'bg-warning/12 text-warning border border-warning/25 hover:bg-warning/18'
        : '';

  return (
    <Button
      variant={mappedVariant}
      loading={loading}
      leftIcon={icon ? <span className="w-4 h-4">{icon}</span> : undefined}
      className={`${semanticClassName} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
};
