import { type ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ subtitle, children }: AuthLayoutProps) {
  return (
    <>
      <div className="animated-bg" />
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo variant="auth" />
            <p className="text-neutral-600 dark:text-neutral-300 mt-2 font-medium">{subtitle}</p>
          </div>

          <div className="glass-card p-8">{children}</div>
        </div>
      </div>
    </>
  );
}
