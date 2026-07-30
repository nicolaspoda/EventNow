import React from 'react';
import { Link } from 'react-router-dom';
import type { UpcomingEvent } from '../../types/dashboard.types';
import Badge from '../ui/Badge';
import EventTypeBadge from '../events/EventTypeBadge';
import { safeFormat } from '../../utils/date';
import { getCloudinarySrcSet } from '../../utils/cloudinary';

interface UpcomingEventCardProps {
  event: UpcomingEvent | (UpcomingEvent & { isPast?: boolean });
}

const UpcomingEventCard: React.FC<UpcomingEventCardProps> = ({ event }) => {
  const cloudinarySrc = event.imageUrl ? getCloudinarySrcSet(event.imageUrl) : null;
  
  const parseEventDate = (): Date | null => {
    const dateValue = event.eventDate ?? (event as { event_date?: string }).event_date;
    if (!dateValue) return null;
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  
  const eventDate = parseEventDate();
  const isValidDate = eventDate !== null;
  
  const now = new Date();
  const diffTime = isValidDate ? eventDate.getTime() - now.getTime() : 0;
  const diffDays = isValidDate ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  const isPastEvent = (event as { isPast?: boolean }).isPast ?? (isValidDate && diffDays < 0);
  const getCountdownText = () => {
    if (!isValidDate) return 'Date non renseignée';
    if (isPastEvent) return 'Terminé';
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays < 7) return `Dans ${diffDays} jours`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    const months = Math.floor(diffDays / 30);
    return `Dans ${months} mois`;
  };

  const getCountdownColor = () => {
    if (!isValidDate) return 'text-neutral-500 dark:text-neutral-400';
    if (isPastEvent) return 'text-neutral-500 dark:text-neutral-400';
    if (diffDays <= 1) return 'text-error-500 dark:text-error-400';
    if (diffDays <= 7) return 'text-warning-500 dark:text-warning-400';
    return 'text-success-500 dark:text-success-400';
  };

  return (
    <article className="event-card-modern group focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
      <div className="event-card-image">
        {event.imageUrl ? (
          <>
            <img
              src={cloudinarySrc?.src ?? event.imageUrl}
              srcSet={cloudinarySrc?.srcSet}
              sizes={cloudinarySrc?.sizes}
              alt={`Affiche de l'événement ${event.title}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </>
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-primary-400 via-primary-500 to-accent-400 flex flex-col items-center justify-center"
            role="img"
            aria-label="Aucune image disponible pour cet événement"
          >
            <svg
              className="w-14 h-14 text-white/60 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium text-white/70">Affiche non fournie</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {event.type && <EventTypeBadge type={event.type} />}
          {event.participationType === 'TICKET' ? (
            <Badge variant="primary" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              {event.ticketCount} billet{event.ticketCount > 1 ? 's' : ''}
            </Badge>
          ) : event.participationType === 'ORGANIZER' ? (
            <Badge variant="info" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Organisateur
            </Badge>
          ) : event.participationType === 'STAFF' ? (
            <Badge variant="warning" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Staff
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Inscrit
            </Badge>
          )}
        </div>

        {isValidDate && (
          <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg text-center min-w-[3rem]">
            <div className="text-xl font-bold text-primary-600 dark:text-primary-400 leading-none">
              {eventDate.getDate()}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
              {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
            </div>
          </div>
        )}
      </div>

      <div className="event-card-body">
        <h3
          id={`upcoming-event-title-${event.id}`}
          className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
        >
          {event.title}
        </h3>

        <div className="mb-3">
          <span className={`text-sm font-semibold ${getCountdownColor()}`}>
            {getCountdownText()}
          </span>
        </div>

        <div
          className="space-y-1.5 mb-4 text-neutral-600 dark:text-neutral-300"
          aria-describedby={`upcoming-event-title-${event.id}`}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <time dateTime={event.eventDate ?? (event as { event_date?: string }).event_date ?? ''} className="text-sm">
              {safeFormat(event.eventDate ?? (event as { event_date?: string }).event_date, "EEEE d MMMM yyyy 'à' HH'h'mm")}
            </time>
          </div>

          {event.organizer && (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm truncate">
                {event.organizer.username || event.organizer.email?.split('@')[0]}
              </span>
            </div>
          )}
        </div>

        <div className="event-card-footer">
          <div className="flex items-center justify-between mb-3">
            {event.participationType === 'TICKET' && (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Catégorie : <span className="font-medium text-neutral-700 dark:text-neutral-300">{event.categoryName}</span>
              </div>
            )}
            {event.participationType === 'PARTICIPATION' && (
              <div className="text-sm text-success-600 dark:text-success-400 font-medium">
                Participation confirmée
              </div>
            )}
            {event.participationType === 'ORGANIZER' && (
              <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                Vous organisez cet événement
              </div>
            )}
            {event.participationType === 'STAFF' && (
              <div className="text-sm text-warning-600 dark:text-warning-400 font-medium">
                Vous êtes staff sur cet événement
              </div>
            )}
          </div>

          <Link
            to={`/events/${event.id}`}
            aria-label={`Voir les détails de ${event.title}`}
            className="btn-modern btn-primary w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Voir l'événement
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default UpcomingEventCard;
