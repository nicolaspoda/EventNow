import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { StatCard } from '../components/dashboard/StatCard';
import { EventsTable } from '../components/dashboard/EventsTable';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { SalesChart } from '../components/dashboard/SalesChart';
import { formatPrice } from '../utils/price';
import type {
  OrganizerOverview,
  DashboardEvent,
} from '../types/dashboard.types';

export const OrganizerDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<OrganizerOverview | null>(null);
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
        dashboardService.getOrganizerOverview(),
        dashboardService.getOrganizerEvents(),
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
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            role="status"
            aria-label="Chargement en cours"
          >
            <span className="sr-only">Chargement...</span>
          </div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
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
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord organisateur
          </h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble de vos événements et performances
          </p>
        </div>
        <Link
          to="/dashboard/organizer/refund-requests"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Demandes de remboursement →
        </Link>
      </header>

      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        aria-label="Statistiques clés"
      >
        <StatCard
          title="Événements totaux"
          value={overview.totalEvents}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="À venir"
          value={overview.upcomingEvents}
          icon="📅"
          color="green"
        />
        <StatCard
          title="Chiffre d'affaires"
          value={`${formatPrice(overview.totalRevenue)} €`}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="Billets vendus"
          value={overview.totalTicketsSold}
          icon="🎫"
          color="purple"
        />
      </section>

      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        aria-label="Graphiques analytiques"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Évolution des ventes</h2>
          <RevenueChart events={events} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ventes par catégorie</h2>
          <SalesChart events={events} />
        </div>
      </section>

      <section className="bg-white rounded-lg shadow" aria-labelledby="events-heading">
        <div className="px-6 py-4 border-b">
          <h2 id="events-heading" className="text-xl font-semibold">
            Mes événements
          </h2>
        </div>
        <EventsTable
          events={events}
          onRefresh={fetchDashboardData}
          type="professional"
        />
      </section>
    </div>
  );
};
