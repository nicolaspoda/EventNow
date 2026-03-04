import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { StatCard } from '../components/dashboard/StatCard';
import { EventsTable } from '../components/dashboard/EventsTable';
import { ParticipantsChart } from '../components/dashboard/ParticipantsChart';
import type {
  ClientOverview,
  DashboardEvent,
} from '../types/dashboard.types';

export const ClientDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ClientOverview | null>(null);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [overviewData, eventsData] = await Promise.all([
        dashboardService.getClientOverview(),
        dashboardService.getClientEvents(),
      ]);
      setOverview(overviewData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(errorMessage || 'Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
            role="status"
            aria-label="Chargement en cours"
          />
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-800 dark:text-error-200 px-4 py-3 rounded-xl"
          role="alert"
        >
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-neutral-500 dark:text-neutral-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Mes événements communautaires
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 mt-2">
          Gérez vos soirées, barbecues et meetups
        </p>
      </header>

      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        aria-label="Statistiques clés"
      >
        <StatCard title="Événements créés" value={overview.totalEvents} />
        <StatCard title="À venir" value={overview.upcomingEvents} />
        <StatCard title="Participants totaux" value={overview.totalParticipants} />
        <StatCard title="Moyenne / événement" value={overview.averageParticipants} />
      </section>

      {events.length > 0 && (
        <section
          className="glass-card p-6 mb-8"
          aria-label="Graphique des participants"
        >
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Évolution des participants
          </h2>
          <ParticipantsChart events={events} />
        </section>
      )}

      <section className="glass-card overflow-hidden" aria-labelledby="events-heading">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <h2 id="events-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Mes événements
          </h2>
          <button
            onClick={() => navigate('/events/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Créer un événement
          </button>
        </div>
        <EventsTable
          events={events}
          onRefresh={fetchDashboardData}
          type="community"
        />
      </section>
    </div>
  );
};
