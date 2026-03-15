import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

/**
 * Redirige vers le tableau de bord adapté au rôle de l'utilisateur.
 * Évite une page "Tableau de bord" générique inutile.
 */
export function DashboardRedirectPage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/events" replace />;
  }

  switch (user.role) {
    case 'ORGANIZER':
      return <Navigate to="/dashboard/organizer" replace />;
    case 'CLIENT':
      return <Navigate to="/dashboard/client" replace />;
    default:
      return <Navigate to="/events" replace />;
  }
}
