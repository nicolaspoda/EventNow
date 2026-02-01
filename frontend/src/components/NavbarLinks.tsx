import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

export function NavbarLinks() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthenticated) {
    return (
      <>
        <Link
          to="/bookings"
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Mes réservations
        </Link>
        <Link
          to="/dashboard"
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Dashboard
        </Link>
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
