import { useAuth } from '../utils/useAuth';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '../components/AppNavbar';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar
        rightContent={
          <>
            <span className="text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Déconnexion
            </button>
          </>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Tableau de bord
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Profil</h3>
              <p className="text-purple-100">Email: {user?.email}</p>
              <p className="text-purple-100">Rôle: {user?.role}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Statut</h3>
              <p className="text-pink-100">Connecté</p>
              <p className="text-pink-100">ID: {user?.id.slice(0, 8)}...</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Accès</h3>
              <p className="text-indigo-100">
                {user?.role === 'CLIENT' && 'Achat de billets'}
                {user?.role === 'ORGANIZER' && 'Gestion événements'}
                {user?.role === 'STAFF' && 'Validation billets'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bienvenue sur EventNow
            </h2>
            <p className="text-gray-600 mb-4">
              Vous êtes maintenant connecté avec le rôle{' '}
              <span className="font-semibold text-purple-600">
                {user?.role}
              </span>
              .
            </p>
            <p className="text-gray-600">
              Cette page de tableau de bord sera enrichie avec les
              fonctionnalités spécifiques à votre rôle.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
