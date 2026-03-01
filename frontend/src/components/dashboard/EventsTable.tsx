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
        <p className="text-gray-500 mb-4">Aucun événement créé</p>
        <button
          onClick={() => navigate('/events/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <thead className="bg-gray-50 border-b">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Événement
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Statut
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Taux remplissage
            </th>
            {isProfessional && (
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Revenus
              </th>
            )}
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr
              key={event.id}
              className="hover:bg-gray-50 cursor-pointer focus-within:bg-gray-50"
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
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-500">{event.location}</div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
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
                    className="w-32 bg-gray-200 rounded-full h-2 mr-2"
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
                            : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(event.stats.fillRate, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {event.stats.fillRate.toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {participantsCount(event)} / {event.stats.totalCapacity}
                </div>
              </td>
              {isProfessional && (
                <td className="px-6 py-4 text-right font-medium text-gray-900">
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
