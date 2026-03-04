import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EventStatusBadge } from '../events/EventStatusBadge';
import { EventActions } from '../events/EventActions';
import { safeFormat } from '../../utils/date';
import type { DashboardEvent } from '../../types/dashboard.types';

interface EventsTableProps {
  events: DashboardEvent[];
  onRefresh: () => void;
  type?: 'professional' | 'community';
}

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  onRefresh,
  type = 'professional',
}) => {
  const navigate = useNavigate();

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">Aucun événement créé</p>
        <button
          onClick={() => navigate('/events/create')}
          className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Créer mon premier événement
        </button>
      </div>
    );
  }

  const isProfessional = type === 'professional';
  const participantsCount = (event: DashboardEvent) =>
    isProfessional ? event.stats.totalSold || 0 : event.stats.totalParticipants || 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="table">
        <caption className="sr-only">
          Liste des événements {isProfessional ? 'professionnels' : 'communautaires'}
        </caption>
        <thead className="bg-neutral-100 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
            >
              Événement
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
            >
              Statut
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
            >
              Taux remplissage
            </th>
            {isProfessional && (
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
              >
                Revenus
              </th>
            )}
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent divide-y divide-neutral-200 dark:divide-neutral-700">
          {events.map((event) => (
            <tr
              key={event.id}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer focus-within:bg-neutral-50 dark:focus-within:bg-neutral-700/50"
              onClick={() => navigate(`/events/${event.id}`)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/events/${event.id}`);
                }
              }}
            >
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{event.title}</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">{event.location}</div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100">
                <time dateTime={typeof event.eventDate === 'string' ? event.eventDate : (event as { event_date?: string }).event_date ?? ''}>
                  {safeFormat(
                    (event as { eventDate?: string; event_date?: string }).eventDate ??
                      (event as { event_date?: string }).event_date,
                    'd MMMM yyyy'
                  )}
                </time>
              </td>
              <td className="px-6 py-4">
                <EventStatusBadge status={event.stats.status} />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end">
                  <div
                    className="w-32 bg-neutral-200 dark:bg-neutral-600 rounded-full h-2 mr-2"
                    role="progressbar"
                    aria-valuenow={Math.round(event.stats.fillRate)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Taux de remplissage: ${event.stats.fillRate.toFixed(0)} pourcent`}
                  >
                    <div
                      className={`h-2 rounded-full ${
                        event.stats.fillRate >= 80
                          ? 'bg-green-500'
                          : event.stats.fillRate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-primary-500'
                      }`}
                      style={{
                        width: `${Math.min(event.stats.fillRate, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {event.stats.fillRate.toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
                  {participantsCount(event)} / {event.stats.totalCapacity}
                </div>
              </td>
              {isProfessional && (
                <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                  {(event.stats.revenue || 0).toFixed(2)} €
                </td>
              )}
              <td
                className="px-6 py-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <EventActions
                  event={event}
                  onRefresh={onRefresh}
                  type={type}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
