import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { DarkModeToggle } from './DarkModeToggle';

const navLinkClass =
  'px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1';

export function NavbarLinks() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEventsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setEventsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isEventsPage = location.pathname === '/my-upcoming-events' || location.pathname === '/my-participated-events' || location.pathname === '/my-calendar';

  if (isAuthenticated) {
    return (
      <>
        <DarkModeToggle />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setEventsMenuOpen((o) => !o)}
            className={`${navLinkClass} flex items-center gap-1 ${
              isEventsPage ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''
            }`}
            aria-expanded={eventsMenuOpen}
            aria-haspopup="true"
            aria-label="Menu mes événements"
          >
            Mes événements
            <svg
              className={`w-4 h-4 transition-transform ${eventsMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {eventsMenuOpen && (
            <div
              className="absolute top-full left-0 mt-1 py-1 min-w-[200px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50"
              role="menu"
            >
              <Link
                to="/my-calendar"
                className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-t-lg"
                role="menuitem"
                onClick={() => setEventsMenuOpen(false)}
              >
                Calendrier
              </Link>
              <Link
                to="/my-upcoming-events"
                className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                role="menuitem"
                onClick={() => setEventsMenuOpen(false)}
              >
                À venir
              </Link>
              <Link
                to="/my-participated-events"
                className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-b-lg"
                role="menuitem"
                onClick={() => setEventsMenuOpen(false)}
              >
                Mes participations
              </Link>
            </div>
          )}
        </div>
        <Link to="/my-tickets" className={navLinkClass}>
          Mes billets
        </Link>
        <Link to="/my-orders" className={navLinkClass}>
          Mes commandes
        </Link>
        <Link to="/bookings" className={navLinkClass}>
          Réservations
        </Link>

        {user?.role === 'ORGANIZER' && (
          <>
            <Link to="/dashboard/organizer" className={navLinkClass}>
              Dashboard Pro
            </Link>
            <Link to="/dashboard/organizer/refund-requests" className={navLinkClass}>
              Remboursements
            </Link>
          </>
        )}

        {user?.role === 'CLIENT' && (
          <Link to="/dashboard/client" className={navLinkClass}>
            Mon tableau de bord
          </Link>
        )}

        {user?.role === 'STAFF' && (
          <>
            <Link to="/staff/scan" className={navLinkClass}>
              Validation billets
            </Link>
            <Link to="/staff/validations" className={navLinkClass}>
              Historique
            </Link>
          </>
        )}

        {(user?.role === 'ORGANIZER' || user?.role === 'CLIENT') && (
          <Link
            to="/events/create"
            className="px-3 py-2 rounded-lg text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 hover:text-accent-700 dark:hover:text-accent-300 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
          >
            + Créer
          </Link>
        )}

        {/* Avatar + Profile + logout */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200 dark:border-neutral-700">
          <Link
            to="/profile"
            className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 dark:hover:ring-offset-neutral-900 transition-all"
            title="Mon profil"
          >
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-800"
          >
            Déconnexion
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <DarkModeToggle />
      <Link to="/login" className={navLinkClass}>
        Connexion
      </Link>
      <Link
        to="/register"
        className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        S'inscrire
      </Link>
    </>
  );
}
