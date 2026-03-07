import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { safeFormat } from '../utils/date';
import type { EventParticipantsResponse } from '../types/dashboard.types';
import Button from '../components/ui/Button';

export function EventParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"
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
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-xl"
          role="alert"
        >
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error || 'Données introuvables'}</p>
        </div>
        <Link
          to="/dashboard/client"
          className="mt-4 inline-block text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const { event, participants, totalParticipants } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          aria-label="Retour à la page précédente"
        >
          ← Retour
        </Button>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100" id="participants-title">
          Participants – {event.title}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
          <time dateTime={event.eventDate}>
            {safeFormat(event.eventDate, "d MMMM yyyy 'à' HH'h'mm")}
          </time>
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          <strong className="text-neutral-900 dark:text-neutral-100">{totalParticipants}</strong> participant
          {totalParticipants !== 1 ? 's' : ''} inscrit
          {totalParticipants !== 1 ? 's' : ''}
        </p>
      </header>

      <section className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Liste des participants
          </h2>
        </div>
        {participants.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
            Aucun participant inscrit pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <caption className="sr-only">
                Liste des participants à l'événement
              </caption>
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Participant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Places
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase"
                  >
                    Date d'inscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {participants.map((p, index) => (
                  <tr key={`${p.userId}-${index}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 font-medium">
                      <Link
                        to={`/user/${p.userId}/profile`}
                        className="text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {p.firstName || p.lastName
                          ? [p.firstName, p.lastName].filter(Boolean).join(' ')
                          : p.email.split('@')[0]}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">{p.email}</td>
                    <td className="px-6 py-4 text-right text-neutral-700 dark:text-neutral-300">
                      {p.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'CONFIRMED'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : p.status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {p.status === 'CONFIRMED'
                          ? 'Confirmé'
                          : p.status === 'PENDING'
                            ? 'En attente'
                            : p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
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

      <div className="mt-6">
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Voir la fiche de l'événement
        </Link>
      </div>
    </div>
  );
}
