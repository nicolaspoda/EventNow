import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ParticipationRequest } from '../../types/participation.types';
import { participationService } from '../../services/participationService';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { UserRatingBadge } from './UserRatingBadge';

interface ParticipationRequestCardProps {
  request: ParticipationRequest;
  onRespond?: () => void;
}

export function ParticipationRequestCard({ request, onRespond }: ParticipationRequestCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRespond = async (action: 'ACCEPT' | 'REFUSE') => {
    try {
      setLoading(true);
      setError(null);
      await participationService.respond(request.id, action);
      onRespond?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réponse');
    } finally {
      setLoading(false);
    }
  };

  const displayName = request.user?.firstName && request.user?.lastName
    ? `${request.user.firstName} ${request.user.lastName}`
    : request.user?.email || 'Utilisateur';

  return (
    <Card className="hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link to={`/user/${request.userId}/profile`}>
          {request.user?.avatarUrl ? (
            <img
              src={request.user.avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center hover:opacity-80 transition-opacity">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        <div className="flex-1">
          {/* Informations utilisateur */}
          <div className="mb-3">
            <Link 
              to={`/user/${request.userId}/profile`}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {displayName}
            </Link>
            <div className="flex items-center gap-3 mt-1">
              <UserRatingBadge userId={request.userId} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Demande envoyée le {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Message de la demande */}
          {request.message && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message :
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {request.message}
              </p>
            </div>
          )}

          {/* Statut */}
          {request.status === 'PENDING' ? (
            <div className="flex gap-2">
              <Button
                onClick={() => handleRespond('ACCEPT')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Traitement...' : 'Accepter'}
              </Button>
              <Button
                onClick={() => handleRespond('REFUSE')}
                disabled={loading}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Refuser
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  request.status === 'ACCEPTED'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {request.status === 'ACCEPTED' ? 'Acceptée' : 'Refusée'}
              </span>
              {request.respondedAt && (
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  le {new Date(request.respondedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
