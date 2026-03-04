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
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-primary-600/20 dark:ring-primary-400/30',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300 ring-success-500/20 dark:ring-success-400/30',
    warning: 'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 ring-warning-500/20 dark:ring-warning-400/30',
    error:   'bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-300 ring-error-500/20 dark:ring-error-400/30',
    info:    'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-primary-600/20 dark:ring-primary-400/30',
    neutral: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 ring-neutral-600/20 dark:ring-neutral-500/30',
    default: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 ring-neutral-600/20 dark:ring-neutral-500/30',
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
