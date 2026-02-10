import React from 'react';

type LabelSize = 'base' | 'lg' | 'responsive';

interface IconLabelProps {
  icon: React.ReactNode;
  label?: React.ReactNode | null;
  labelSize?: LabelSize;
  hoverScale?: boolean;
  iconOffsetPx?: number;
  labelOffsetPx?: number;
  iconBoxClassName?: string;
  labelClassName?: string;
}

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}

const labelSizeClassName: Record<LabelSize, string> = {
  base: 'text-base leading-5',
  lg: 'text-lg leading-6',
  responsive: 'text-base leading-5 lg:text-lg lg:leading-6',
};

export const IconLabel: React.FC<IconLabelProps> = ({
  icon,
  label,
  labelSize = 'lg',
  hoverScale = true,
  iconOffsetPx = 0,
  labelOffsetPx = 0,
  iconBoxClassName,
  labelClassName,
}) => {
  return (
    <>
      
      <div
        className={cn(
          'w-5 h-5 shrink-0 grid place-items-center transition-transform duration-300',
          hoverScale && 'group-hover:scale-110',
          iconBoxClassName,
        )}
      >
        
        <span
          style={
            typeof iconOffsetPx === 'number' && iconOffsetPx !== 0
              ? { transform: `translateY(${iconOffsetPx}px)` }
              : undefined}
          className={cn(
            'w-full h-full grid place-items-center',
            '[&>svg]:block [&>svg]:w-full [&>svg]:h-full [&>span>svg]:block [&>span>svg]:w-full [&>span>svg]:h-full',
          )}
        >
          {icon}
        </span>
      </div>

      {label != null && (
        <span
          className={cn(
            'flex-1 min-w-0 flex items-center text-left font-semibold tracking-wide whitespace-nowrap',
            labelSizeClassName[labelSize],
            labelClassName,
          )}
        >
          <span
            style={
              typeof labelOffsetPx === 'number' && labelOffsetPx !== 0
                ? { transform: `translateY(${labelOffsetPx}px)` }
                : undefined}
            className="inline-block"
          >
            {label}
          </span>
        </span>
      )}
    </>
  );
};

