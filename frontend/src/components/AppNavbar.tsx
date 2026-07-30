import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { AboutButton } from './AboutButton';

interface AppNavbarProps {
  rightContent?: ReactNode;
}

export function AppNavbar({ rightContent }: AppNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [lastPathname, setLastPathname] = useState(location.pathname);

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    setMobileOpen(false);
  }

  const mobileRightContent = isValidElement(rightContent)
    ? cloneElement(rightContent as ReactElement<{ mobile?: boolean }>, { mobile: true })
    : rightContent;

  return (
    <header role="banner" className="sticky top-0 z-50">
      <nav
        className="header-modern"
        aria-label="Navigation principale"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo variant="nav" />
            <div className="hidden md:flex items-center flex-nowrap gap-2 min-h-10">
              <AboutButton />
              {rightContent}
            </div>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div
            id="mobile-nav-panel"
            className="md:hidden border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="flex flex-col items-stretch gap-2">
              <AboutButton />
              {mobileRightContent}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
