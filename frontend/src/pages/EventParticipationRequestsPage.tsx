import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { participationService } from '../services/participationService';
import type { ParticipationRequest } from '../types/participation.types';
import { ParticipationRequestCard } from '../components/participation/ParticipationRequestCard';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function EventParticipationRequestsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'refused'>('all');

  useEffect(() => {
    fetchRequests();
  }, [eventId]);

  const fetchRequests = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const data = await participationService.getByEvent(eventId);
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status.toLowerCase() === filter;
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const acceptedCount = requests.filter((r) => r.status === 'ACCEPTED').length;
  const refusedCount = requests.filter((r) => r.status === 'REFUSED').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Bouton retour dans la zone à gauche (pleine largeur, aligné à gauche) */}
      <div className="w-full flex justify-start pl-4 sm:pl-6 lg:pl-8 mb-6">
        <Link
          to={`/events/${eventId}`}
          className="inline-flex items-center justify-center font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 focus:ring-primary-500 px-4 py-2.5 text-base rounded-xl no-underline"
        >
          Retour à l'événement
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Demandes de participation
            </h1>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {requests.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">En attente</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {acceptedCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Acceptées</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {refusedCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Refusées</div>
            </Card>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'primary' : 'outline'}
            >
              Toutes ({requests.length})
            </Button>
            <Button
              onClick={() => setFilter('pending')}
              variant={filter === 'pending' ? 'primary' : 'outline'}
            >
              En attente ({pendingCount})
            </Button>
            <Button
              onClick={() => setFilter('accepted')}
              variant={filter === 'accepted' ? 'primary' : 'outline'}
            >
              Acceptées ({acceptedCount})
            </Button>
            <Button
              onClick={() => setFilter('refused')}
              variant={filter === 'refused' ? 'primary' : 'outline'}
            >
              Refusées ({refusedCount})
            </Button>
          </div>
        </div>

        {/* Liste des demandes */}
        {filteredRequests.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Aucune demande {filter !== 'all' && `${filter === 'pending' ? 'en attente' : filter === 'accepted' ? 'acceptée' : 'refusée'}`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <ParticipationRequestCard
                key={request.id}
                request={request}
                onRespond={fetchRequests}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
