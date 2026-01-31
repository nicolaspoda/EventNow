import { type ReactNode } from 'react';
import { Logo } from './Logo';

interface AppNavbarProps {
  rightContent?: ReactNode;
}

export function AppNavbar({ rightContent }: AppNavbarProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo variant="nav" />
          {rightContent && (
            <div className="flex items-center space-x-4">{rightContent}</div>
          )}
        </div>
      </div>
    </nav>
  );
}
