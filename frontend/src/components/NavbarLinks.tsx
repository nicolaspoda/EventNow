import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

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
        <Link
          to="/my-tickets"
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Mes billets
        </Link>
        <Link
          to="/my-orders"
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Mes commandes
        </Link>
        <Link
          to="/bookings"
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Mes réservations
        </Link>
        {user?.role === 'ORGANIZER' && (
          <>
            <Link
              to="/dashboard/organizer"
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Dashboard Pro
            </Link>
            <Link
              to="/dashboard/organizer/refund-requests"
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Demandes de remboursement
            </Link>
          </>
        )}
        {user?.role === 'CLIENT' && (
          <Link
            to="/dashboard/client"
            className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            Mes événements
          </Link>
        )}
        {user?.role === 'STAFF' && (
          <>
            <Link
              to="/staff/scan"
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Validation billets
            </Link>
            <Link
              to="/staff/validations"
              className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Historique validations
            </Link>
          </>
        )}
        {(user?.role === 'ORGANIZER' || user?.role === 'CLIENT') && (
          <Link
            to="/events/create"
            className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            Créer un événement
          </Link>
        )}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Déconnexion
        </button>
      </>
    );
  }

  return (
    <>
      <Link
        to="/login"
        className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
      >
        Connexion
      </Link>
      <Link
        to="/register"
        className="bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Inscription
      </Link>
    </>
  );
}
