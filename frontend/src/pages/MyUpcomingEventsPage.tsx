import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { UpcomingEvent } from '../types/dashboard.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import UpcomingEventCard from '../components/upcoming/UpcomingEventCard';
import { FriendsActivitySection } from '../components/dashboard/FriendsActivitySection';

const MyUpcomingEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ticket' | 'participation' | 'organizer' | 'staff'>('all');

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMyUpcomingEvents();
      setEvents(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger vos événements à venir'));
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    if (filter === 'ticket') return event.participationType === 'TICKET';
    if (filter === 'participation') return event.participationType === 'PARTICIPATION';
    if (filter === 'organizer') return event.participationType === 'ORGANIZER';
    if (filter === 'staff') return event.participationType === 'STAFF';
    return true;
  });

  const ticketCount = events.filter((e) => e.participationType === 'TICKET').length;
  const participationCount = events.filter((e) => e.participationType === 'PARTICIPATION').length;
  const organizerCount = events.filter((e) => e.participationType === 'ORGANIZER').length;
  const staffCount = events.filter((e) => e.participationType === 'STAFF').length;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mes prochaines sorties
          </h1>
          <LoadingState message="Chargement de vos sorties..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mes prochaines sorties
          </h1>
          <ErrorState message={error} onRetry={fetchUpcomingEvents} />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mes prochaines sorties
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
            title="Aucune sortie prévue"
            message="Rejoignez vos amis sur leurs événements ou découvrez de nouvelles sorties ensemble !"
            actionLabel="Voir les sorties de mes amis"
            onAction={() => navigate('/events?friendsOnly=true')}
          />
          <p className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/my-participated-events')}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Voir mes participations (passés et à venir)
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Mes prochaines sorties
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {events.length} sortie{events.length > 1 ? 's' : ''} programmée{events.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/my-participated-events')}>
              Mes participations
            </Button>
            <Button variant="primary" onClick={() => navigate('/events?friendsOnly=true')}>
              Sorties de mes amis
            </Button>
          </div>
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
            onClick={() => setFilter('ticket')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'ticket'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Avec billets ({ticketCount})
            </span>
          </button>
          <button
            onClick={() => setFilter('participation')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'participation'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Communautaires ({participationCount})
            </span>
          </button>
          <button
            onClick={() => setFilter('organizer')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'organizer'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Organisés ({organizerCount})
            </span>
          </button>
          <button
            onClick={() => setFilter('staff')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'staff'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Staff ({staffCount})
            </span>
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

        <div className="mt-12">
          <FriendsActivitySection />
        </div>
      </div>
    </div>
  );
};

export default MyUpcomingEventsPage;
