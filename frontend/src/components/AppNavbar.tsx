import { type ReactNode } from 'react';
import { Logo } from './Logo';
import { AboutButton } from './AboutButton';

interface AppNavbarProps {
  rightContent?: ReactNode;
}

export function AppNavbar({ rightContent }: AppNavbarProps) {
  return (
    <header role="banner" className="sticky top-0 z-50">
      <nav
        className="header-modern"
        aria-label="Navigation principale"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo variant="nav" />
            <div className="flex items-center flex-nowrap gap-2 min-h-10">
              <AboutButton />
              {rightContent}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
