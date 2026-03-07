import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { ParticipatedEvent } from '../types/dashboard.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import UpcomingEventCard from '../components/upcoming/UpcomingEventCard';

const MyParticipatedEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ParticipatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMyParticipatedEvents();
      setEvents(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger vos participations'));
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter((e) => !e.isPast);
  const pastEvents = events.filter((e) => e.isPast);

  const filteredEvents =
    filter === 'all' ? events : filter === 'upcoming' ? upcomingEvents : pastEvents;

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mes participations
          </h1>
          <LoadingState message="Chargement de vos événements..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mes participations
          </h1>
          <ErrorState message={error} onRetry={fetchEvents} />
        </div>
      </main>
    );
  }

  if (events.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mes participations
          </h1>
          <EmptyState
            icon={
              <svg
                className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            title="Aucune participation"
            message="Les événements auxquels vous participez (billets achetés ou demandes acceptées) apparaîtront ici."
            actionLabel="Découvrir les événements"
            onAction={() => navigate('/events')}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Mes participations
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {events.length} événement{events.length > 1 ? 's' : ''} au total
              {upcomingEvents.length > 0 && ` · ${upcomingEvents.length} à venir`}
              {pastEvents.length > 0 && ` · ${pastEvents.length} passé${pastEvents.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/events')}>
            Découvrir plus d'événements
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Tous ({events.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            À venir ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Passés ({pastEvents.length})
          </button>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">
              Aucun événement ne correspond à ce filtre.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <UpcomingEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyParticipatedEventsPage;
