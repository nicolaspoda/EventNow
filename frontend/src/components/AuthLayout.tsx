import { type ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="auth" />
          <p className="text-purple-200 mt-2">{subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  );
}
