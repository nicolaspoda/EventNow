import React from 'react';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'default';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-primary-100 dark:bg-primary-600 text-primary-800 dark:text-white ring-primary-600/20 dark:ring-primary-500/50',
    success: 'bg-success-50 dark:bg-success-700 text-success-800 dark:text-white ring-success-500/20 dark:ring-success-400/50',
    warning: 'bg-warning-50 dark:bg-warning-700 text-warning-800 dark:text-neutral-900 ring-warning-500/20 dark:ring-warning-400/50',
    error:   'bg-error-50 dark:bg-error-700 text-error-800 dark:text-white ring-error-500/20 dark:ring-error-400/50',
    info:    'bg-primary-100 dark:bg-primary-600 text-primary-800 dark:text-white ring-primary-600/20 dark:ring-primary-500/50',
    neutral: 'bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-white ring-neutral-600/20 dark:ring-neutral-500/50',
    default: 'bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-white ring-neutral-600/20 dark:ring-neutral-500/50',
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ring-1 ring-inset ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
