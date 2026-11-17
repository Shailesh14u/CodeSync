import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-content-secondary">
          {label}
        </label>
      )}
      <div className="relative rounded-lg">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={twMerge(
            clsx(
              'w-full rounded-lg bg-background-secondary border text-content-main placeholder:text-content-muted text-sm px-3.5 py-2 transition-all duration-150 focus:outline-none focus:ring-1',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              error
                ? 'border-status-error focus:border-status-error focus:ring-status-error'
                : 'border-border-subtle focus:border-accent-primary focus:ring-accent-primary hover:border-border-light',
              disabled ? 'opacity-50 cursor-not-allowed bg-background-main' : '',
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-status-error">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-content-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
