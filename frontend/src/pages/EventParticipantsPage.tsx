import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { safeFormat } from '../utils/date';
import type { EventParticipantsResponse } from '../types/dashboard.types';

export function EventParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EventParticipantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardService
      .getEventParticipants(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            'Erreur lors du chargement des participants';
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
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
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
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
          role="alert"
        >
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error || 'Données introuvables'}</p>
        </div>
        <Link
          to="/dashboard/client"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const { event, participants, totalParticipants } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-6" aria-label="Fil d'Ariane">
        <Link
          to="/dashboard/client"
          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Mes événements
        </Link>
        <span className="mx-2 text-gray-400" aria-hidden="true">
          /
        </span>
        <span className="text-gray-700">Participants</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" id="participants-title">
          Participants – {event.title}
        </h1>
        <p className="text-gray-600 mt-1">
          <time dateTime={event.eventDate}>
            {safeFormat(event.eventDate, "d MMMM yyyy 'à' HH'h'mm")}
          </time>
        </p>
        <p className="text-gray-600 mt-2">
          <strong>{totalParticipants}</strong> participant
          {totalParticipants !== 1 ? 's' : ''} inscrit
          {totalParticipants !== 1 ? 's' : ''}
        </p>
      </header>

      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Liste des participants
          </h2>
        </div>
        {participants.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            Aucun participant inscrit pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <caption className="sr-only">
                Liste des participants à l'événement
              </caption>
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Participant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase"
                  >
                    Places
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Date d'inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {participants.map((p, index) => (
                  <tr key={`${p.userId}-${index}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {p.firstName || p.lastName
                        ? [p.firstName, p.lastName].filter(Boolean).join(' ')
                        : '–'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{p.email}</td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {p.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : p.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {p.status === 'CONFIRMED'
                          ? 'Confirmé'
                          : p.status === 'PENDING'
                            ? 'En attente'
                            : p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <time dateTime={p.bookedAt}>
                        {safeFormat(p.bookedAt, 'd MMM yyyy HH:mm')}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link
          to={`/events/${id}`}
          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Voir la fiche de l'événement
        </Link>
      </div>
    </div>
  );
}
