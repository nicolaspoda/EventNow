import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { DarkModeToggle } from './DarkModeToggle';

const navLinkClass =
  'px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1';

export function NavbarLinks() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthenticated) {
    return (
      <>
        <DarkModeToggle />
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
            Mes événements
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

        {/* Avatar + logout */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200 dark:border-neutral-700">
          <div
            className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            aria-hidden="true"
          >
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1"
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
