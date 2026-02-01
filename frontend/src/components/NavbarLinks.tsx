import { Link } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

export function NavbarLinks() {
  const { isAuthenticated, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <>
        <Link
          to="/dashboard"
          className="text-gray-700 hover:text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
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
