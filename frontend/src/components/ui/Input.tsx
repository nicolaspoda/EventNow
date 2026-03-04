import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {label}
            {props.required && (
              <span className="text-error-500 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={[
              'w-full px-4 py-3 rounded-xl',
              'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600',
              'text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:bg-neutral-100 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed',
              error ? 'border-error-500 focus:ring-error-500' : '',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error
                ? `${String(props.id ?? '')}-error`
                : hint
                ? `${String(props.id ?? '')}-hint`
                : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {hint && !error && (
          <p
            id={props.id ? `${props.id}-hint` : undefined}
            className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400"
          >
            {hint}
          </p>
        )}

        {error && (
          <p
            id={props.id ? `${props.id}-error` : undefined}
            className="mt-1.5 text-sm text-error-500 flex items-center gap-1"
            role="alert"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
