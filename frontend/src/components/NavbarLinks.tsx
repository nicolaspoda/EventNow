import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { DarkModeToggle } from './DarkModeToggle';
import { NotificationBell } from './NotificationBell';
import { MessageBell } from './MessageBell';
import { UserSearchAutocomplete } from './user/UserSearchAutocomplete';
import { useIsStaff } from '../hooks/useIsStaff';

const navLinkClass =
  'px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1';

interface NavbarLinksProps {
  mobile?: boolean;
}

export function NavbarLinks({ mobile = false }: NavbarLinksProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { isStaff } = useIsStaff(user?.id);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);
  const [purchasesMenuOpen, setPurchasesMenuOpen] = useState(false);
  const [organizerMenuOpen, setOrganizerMenuOpen] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) {
        setEventsMenuOpen(false);
        setPurchasesMenuOpen(false);
        setOrganizerMenuOpen(false);
        setStaffMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  };

  const isEventsPage = location.pathname === '/my-upcoming-events' || location.pathname === '/my-participated-events' || location.pathname === '/my-calendar';
  const isPurchasesPage = location.pathname === '/my-tickets' || location.pathname === '/my-orders' || location.pathname === '/bookings';
  const isOrganizerPage = location.pathname.startsWith('/dashboard/organizer');
  const isStaffPage = location.pathname.startsWith('/staff');
  const isAdminPage = location.pathname.startsWith('/admin');

  const dropdownPanelClass = mobile
    ? 'static mt-1 py-1 w-full bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-lg'
    : 'absolute top-full left-0 mt-1 py-1 min-w-[200px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50';
  const dropdownItemClass =
    'block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-primary-50 dark:hover:bg-primary-900/30';
  const menuButtonClass = mobile ? `${navLinkClass} flex items-center justify-between w-full` : `${navLinkClass} flex items-center gap-1`;

  if (isAuthenticated) {
    return (
      <div className={mobile ? 'flex flex-col items-stretch gap-2 w-full' : 'flex items-center flex-nowrap gap-2'}>
        <div className={mobile ? 'flex items-center gap-2' : 'contents'}>
          <DarkModeToggle />
          <div className={mobile ? 'block w-full' : 'hidden sm:block w-48 lg:w-56 flex-shrink-0'}>
            <UserSearchAutocomplete
              placeholder="Rechercher un utilisateur..."
              navigateOnSelect
              inputClassName="py-1.5 text-sm"
            />
          </div>
          <MessageBell />
          <NotificationBell />
        </div>
        <div className={mobile ? 'flex flex-col items-stretch gap-1 w-full' : 'flex flex-nowrap items-center gap-1 flex-shrink-0'} ref={menusRef}>
          <div className={mobile ? 'relative w-full' : 'relative'}>
            <button
              type="button"
              onClick={() => {
                setPurchasesMenuOpen(false);
                setOrganizerMenuOpen(false);
                setStaffMenuOpen(false);
                setEventsMenuOpen((o) => !o);
              }}
              className={`${menuButtonClass} ${
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
              <div className={dropdownPanelClass} role="menu">
                <Link to="/my-calendar" className={`${dropdownItemClass} rounded-t-lg`} role="menuitem" onClick={() => setEventsMenuOpen(false)}>
                  Calendrier
                </Link>
                <Link to="/my-upcoming-events" className={dropdownItemClass} role="menuitem" onClick={() => setEventsMenuOpen(false)}>
                  À venir
                </Link>
                <Link to="/my-participated-events" className={`${dropdownItemClass} rounded-b-lg`} role="menuitem" onClick={() => setEventsMenuOpen(false)}>
                  Mes participations
                </Link>
              </div>
            )}
          </div>

          {/* Mes achats */}
          <div className={mobile ? 'relative w-full' : 'relative'}>
            <button
              type="button"
              onClick={() => {
                setEventsMenuOpen(false);
                setOrganizerMenuOpen(false);
                setStaffMenuOpen(false);
                setPurchasesMenuOpen((o) => !o);
              }}
              className={`${menuButtonClass} ${
                isPurchasesPage ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''
              }`}
              aria-expanded={purchasesMenuOpen}
              aria-haspopup="true"
              aria-label="Menu achats et réservations"
            >
              Mes achats
              <svg
                className={`w-4 h-4 transition-transform ${purchasesMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {purchasesMenuOpen && (
              <div className={dropdownPanelClass} role="menu">
                <Link to="/my-tickets" className={`${dropdownItemClass} rounded-t-lg`} role="menuitem" onClick={() => setPurchasesMenuOpen(false)}>
                  Mes billets
                </Link>
                <Link to="/my-orders" className={dropdownItemClass} role="menuitem" onClick={() => setPurchasesMenuOpen(false)}>
                  Mes commandes
                </Link>
                <Link to="/bookings" className={`${dropdownItemClass} rounded-b-lg`} role="menuitem" onClick={() => setPurchasesMenuOpen(false)}>
                  Réservations
                </Link>
              </div>
            )}
          </div>

          {user?.role === 'ORGANIZER' && (
            <div className={mobile ? 'relative w-full' : 'relative'}>
              <button
                type="button"
                onClick={() => {
                  setEventsMenuOpen(false);
                  setPurchasesMenuOpen(false);
                  setStaffMenuOpen(false);
                  setOrganizerMenuOpen((o) => !o);
                }}
                className={`${menuButtonClass} ${isOrganizerPage ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''}`}
                aria-expanded={organizerMenuOpen}
                aria-haspopup="true"
                aria-label="Espace organisateur"
              >
                Espace pro
                <svg className={`w-4 h-4 transition-transform ${organizerMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {organizerMenuOpen && (
                <div className={dropdownPanelClass} role="menu">
                  <Link to="/dashboard/organizer" className={`${dropdownItemClass} rounded-t-lg`} role="menuitem" onClick={() => setOrganizerMenuOpen(false)}>Dashboard Pro</Link>
                  <Link to="/dashboard/organizer/staff-invitations" className={dropdownItemClass} role="menuitem" onClick={() => setOrganizerMenuOpen(false)}>Inviter du staff</Link>
                  <Link to="/dashboard/organizer/refund-requests" className={`${dropdownItemClass} rounded-b-lg`} role="menuitem" onClick={() => setOrganizerMenuOpen(false)}>Remboursements</Link>
                </div>
              )}
            </div>
          )}

          {isStaff && (
            <div className={mobile ? 'relative w-full' : 'relative'}>
              <button
                type="button"
                onClick={() => {
                  setEventsMenuOpen(false);
                  setPurchasesMenuOpen(false);
                  setOrganizerMenuOpen(false);
                  setStaffMenuOpen((o) => !o);
                }}
                className={`${menuButtonClass} ${isStaffPage ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''}`}
                aria-expanded={staffMenuOpen}
                aria-haspopup="true"
                aria-label="Espace staff"
              >
                Staff
                <svg className={`w-4 h-4 transition-transform ${staffMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {staffMenuOpen && (
                <div className={dropdownPanelClass} role="menu">
                  <Link to="/staff/scan" className={`${dropdownItemClass} rounded-t-lg`} role="menuitem" onClick={() => setStaffMenuOpen(false)}>Validation billets</Link>
                  <Link to="/staff/validations" className={`${dropdownItemClass} rounded-b-lg`} role="menuitem" onClick={() => setStaffMenuOpen(false)}>Historique</Link>
                </div>
              )}
            </div>
          )}
        </div>

        {user?.role === 'USER' && (
          <Link to="/dashboard/user" className={`${navLinkClass} flex-shrink-0 flex items-center`}>
            Mon tableau de bord
          </Link>
        )}

        {user?.role === 'ADMIN' && (
          <Link
            to="/admin/reports"
            className={`${navLinkClass} flex-shrink-0 flex items-center ${
              isAdminPage ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : ''
            }`}
          >
            Admin
          </Link>
        )}

        {(user?.role === 'ORGANIZER' || user?.role === 'USER') && (
          <Link
            to="/events/create"
            className="flex-shrink-0 flex items-center px-3 py-2 rounded-lg text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 hover:text-accent-700 dark:hover:text-accent-300 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-1"
          >
            + Créer
          </Link>
        )}

        {/* Avatar + Profile + logout */}
        <div
          className={
            mobile
              ? 'flex items-center gap-2 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 w-full'
              : 'flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200 dark:border-neutral-700 flex-shrink-0'
          }
        >
          <Link
            to="/profile"
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-90 transition-opacity"
            title={user?.username ? `@${user.username}` : 'Mon profil'}
            aria-label={user?.username ? `@${user.username}` : 'Mon profil'}
          >
            <span className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 dark:hover:ring-offset-neutral-900">
              {user?.username?.charAt(0)?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-800"
          >
            Déconnexion
          </button>
        </div>

        {showLogoutConfirm &&
          createPortal(
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-[100]"
              style={{ top: 0, left: 0, right: 0, bottom: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <div
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-neutral-200 dark:border-neutral-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="logout-dialog-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Déconnexion
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-5">
                  Êtes-vous sûr de vouloir vous déconnecter ?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition-colors"
                  >
                    Oui
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
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
