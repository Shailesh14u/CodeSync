import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-background-panel border border-border-subtle rounded-xl p-5 shadow-panel transition-all duration-200',
          hoverEffect && 'hover:border-border-light hover:bg-background-panel/90 hover:translate-y-[-2px]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
