import { type ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export function PrimaryButton({
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled ?? loading}
      className={`w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
