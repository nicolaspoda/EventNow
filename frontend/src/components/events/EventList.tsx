import React from 'react';
import type { Event } from '../../types/event.types';
import EventCard from './EventCard';

interface EventListProps {
  events: Event[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
}

const EventList: React.FC<EventListProps> = ({ events, loading, error, currentUserId }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
          aria-hidden="true"
        />
        <span className="sr-only">Chargement des événements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-error-50 dark:bg-error-900/20 border border-error-500/30 text-error-700 dark:text-error-300 px-4 py-3 rounded-xl"
        role="alert"
        aria-live="assertive"
      >
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20" role="status" aria-live="polite">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-700 mb-4">
          <svg
            className="h-8 w-8 text-neutral-400 dark:text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Aucun événement trouvé</h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Essayez de modifier vos critères de recherche</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      role="list"
      aria-label="Liste des événements"
    >
      {events.map((event) => (
        <div key={event.id} role="listitem">
          <EventCard event={event} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
};

export default EventList;
