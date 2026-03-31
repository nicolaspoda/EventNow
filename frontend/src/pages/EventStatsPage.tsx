import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { safeFormat } from '../utils/date';
import { formatPrice } from '../utils/price';
import type { EventStatsDetail } from '../types/dashboard.types';

export function EventStatsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EventStatsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    dashboardService
      .getEventStats(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message || 'Erreur lors du chargement des statistiques';
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-400"
            role="status"
            aria-label="Chargement"
          />
          <span className="sr-only">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded"
          role="alert"
        >
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error || 'Données introuvables'}</p>
        </div>
        <Link
          to="/dashboard/organizer"
          className="mt-4 inline-block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const { event, categoriesStats, salesByDay, totalRevenue, totalSold } = data;
  const salesByDayEntries = Object.entries(salesByDay).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-6" aria-label="Fil d'Ariane">
        <Link
          to="/dashboard/organizer"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Tableau de bord
        </Link>
        <span className="mx-2 text-neutral-400" aria-hidden="true">
          /
        </span>
        <span className="text-neutral-600 dark:text-neutral-400">Statistiques</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100" id="stats-title">
          {event.title}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          <time dateTime={event.eventDate}>
            {safeFormat(event.eventDate, "d MMMM yyyy 'à' HH'h'mm")}
          </time>
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Chiffre d'affaires total
          </h2>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatPrice(totalRevenue)} €
          </p>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Billets vendus
          </h2>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalSold}</p>
        </div>
      </section>

      <section className="glass-card overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Par catégorie
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <caption className="sr-only">
              Statistiques par catégorie de billets
            </caption>
            <thead className="bg-neutral-100 dark:bg-neutral-800/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                >
                  Catégorie
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                >
                  Prix
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                >
                  Vendus
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                >
                  Taux
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                >
                  Revenus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {categoriesStats.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-700 dark:text-neutral-300">
                    {formatPrice(cat.price)} €
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-700 dark:text-neutral-300">
                    {cat.sold} / {cat.initialStock}
                  </td>
                  <td className="px-6 py-4 text-right text-neutral-700 dark:text-neutral-300">
                    {cat.fillRate.toFixed(1)} %
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                    {formatPrice(cat.revenue)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {salesByDayEntries.length > 0 && (
        <section className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Ventes par jour (30 derniers jours)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <caption className="sr-only">
                Nombre de billets vendus par jour
              </caption>
              <thead className="bg-neutral-100 dark:bg-neutral-800/80">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Billets
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {salesByDayEntries.map(([date, count]) => (
                  <tr key={date}>
                    <td className="px-6 py-4 text-neutral-900 dark:text-neutral-100">
                      <time dateTime={date}>
                        {safeFormat(date, 'd MMMM yyyy')}
                      </time>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-8">
        <Link
          to={`/events/${id}`}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
        >
          Voir la fiche de l'événement
        </Link>
      </div>
    </div>
  );
}
