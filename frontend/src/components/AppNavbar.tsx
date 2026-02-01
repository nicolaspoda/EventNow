import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

interface AppNavbarProps {
  rightContent?: ReactNode;
}

export function AppNavbar({ rightContent }: AppNavbarProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Logo variant="nav" />
            <Link
              to="/events"
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Catalogue
            </Link>
          </div>
          {rightContent && (
            <div className="flex items-center space-x-4">{rightContent}</div>
          )}
        </div>
      </div>
    </nav>
  );
}
