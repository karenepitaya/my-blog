import React from 'react';

export type InlineSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
};

export const InlineSwitch: React.FC<InlineSwitchProps> = ({ checked, onChange, disabled, title, className }) => (
  <button
    type="button"
    disabled={disabled}
    title={title}
    onClick={() => {
      if (disabled) return;
      onChange(!checked);
    }}
    className={[
      'relative inline-flex items-center justify-start shrink-0',
      'w-10 h-6 rounded-full border transition-colors',
      checked ? 'bg-primary border-primary/60' : 'bg-white/5 border-white/10',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/20',
      className ?? '',
    ].join(' ')}
  >
    <span
      className={[
        'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
        checked ? 'translate-x-4' : 'translate-x-0',
      ].join(' ')}
    />
  </button>
);

