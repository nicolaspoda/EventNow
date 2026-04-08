import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type { Event } from '../../types/event.types';
import { safeFormat } from '../../utils/date';

export const FriendsActivitySection: React.FC = () => {
  const [friendsEvents, setFriendsEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendsEvents = async () => {
      try {
        const response = await eventService.searchEvents({
          friendsOnly: true,
          sortBy: 'DATE_ASC',
          limit: 4,
        });
        setFriendsEvents(response.events || []);
      } catch (error) {
        console.error('Erreur chargement événements amis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsEvents();
  }, []);

  if (loading) {
    return (
      <section className="glass-card p-6" aria-label="Activité de vos amis">
        <div className="flex items-center justify-center py-8">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
            aria-hidden="true"
          />
        </div>
      </section>
    );
  }

  if (friendsEvents.length === 0) {
    return null;
  }

  return (
    <section className="glass-card p-6 mb-8" aria-label="Activité de vos amis">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Vos amis sortent bientôt
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Événements organisés par votre réseau
            </p>
          </div>
        </div>
        <Link
          to="/events?friendsOnly=true"
          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
        >
          Voir tout
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {friendsEvents.map((event) => {
          const eventDate = new Date(event.eventDate);
          const isValidDate = !Number.isNaN(eventDate.getTime());

          return (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="group p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-accent-400 dark:hover:border-accent-500 hover:shadow-lg transition-all bg-white dark:bg-neutral-800/50"
            >
              <div className="flex gap-3">
                {isValidDate && (
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex flex-col items-center justify-center text-white">
                    <div className="text-xl font-bold leading-none">{eventDate.getDate()}</div>
                    <div className="text-xs uppercase mt-0.5">
                      {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate">
                      {event.organizer?.username || event.organizer?.email?.split('@')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">
                      {safeFormat(event.eventDate, "d MMM 'à' HH'h'mm")}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
