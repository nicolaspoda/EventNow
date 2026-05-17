import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types/event.types';
import Badge from '../ui/Badge';
import EventTypeBadge from './EventTypeBadge';
import { safeFormat } from '../../utils/date';
import { parsePrice, formatPrice } from '../../utils/price';
import { getCloudinarySrcSet } from '../../utils/cloudinary';
import { AverageRating } from '../reviews/AverageRating';

interface EventCardProps {
  event: Event;
  currentUserId?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, currentUserId }) => {
  const eventWithMeta = event as Event & {
    averageRating?: number;
    totalReviews?: number;
    distance?: number;
  };
  const totalStock = event.ticketCategories.reduce((sum, cat) => sum + cat.currentStock, 0);
  const prices = event.ticketCategories.map((cat) => parsePrice(cat.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const dateValue = event.eventDate ?? (event as { event_date?: string }).event_date;
  const cloudinarySrc = event.imageUrl ? getCloudinarySrcSet(event.imageUrl) : null;

  const eventDateRaw = dateValue ? new Date(dateValue) : null;
  const eventDate =
    eventDateRaw && !Number.isNaN(eventDateRaw.getTime()) ? eventDateRaw : null;
  const isPast = eventDate ? eventDate < new Date() : false;

  const stockLevel =
    totalStock === 0
      ? 'empty'
      : totalStock < 50
      ? 'low'
      : 'available';

  const stockBarColor =
    totalStock === 0
      ? 'bg-error-500'
      : totalStock < 50
      ? 'bg-warning-500'
      : 'bg-success-500';

  const isCommunity = event.type === 'COMMUNITY';
  const isCancelled = !!event.cancelledAt;

  return (
    <article
      className="event-card-modern group focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
    >
      {/* ── Image section ─────────────────────────── */}
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

        {/* Floating badges ── top-left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {currentUserId && event.organizerId === currentUserId && (
            <Badge variant="primary" size="sm">
              Mon événement
            </Badge>
          )}
          {isCancelled ? (
            <Badge variant="error" size="sm">
              ANNULÉ
            </Badge>
          ) : (
            <>
              {event.type && <EventTypeBadge type={event.type} />}
              {isPast && (
                <Badge variant="neutral" size="sm">
                  Terminé
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Floating date ── bottom-right */}
        {eventDate && (
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

      {/* ── Content ───────────────────────────────── */}
      <div className="event-card-body">
        {/* Title */}
        <h3
          id={`event-title-${event.id}`}
          className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
        >
          {event.title}
        </h3>

        {/* Reviews */}
        {eventWithMeta.averageRating !== undefined && (eventWithMeta.totalReviews ?? 0) > 0 && (
          <div className="mb-3">
            <AverageRating
              average={eventWithMeta.averageRating}
              totalReviews={eventWithMeta.totalReviews ?? 0}
              size="sm"
            />
          </div>
        )}

        {/* Social signal - Friends attending */}
        {event.friendsAttendingCount != null && event.friendsAttendingCount > 0 && (
          <div className="mb-3 p-2.5 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {event.friendsAttending?.slice(0, 3).map((friend) => (
                  <div
                    key={friend.id}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 border-2 border-white dark:border-neutral-800 flex items-center justify-center text-white text-xs font-semibold"
                    title={friend.username || 'Ami'}
                  >
                    {friend.username?.[0]?.toUpperCase() || '?'}
                  </div>
                ))}
              </div>
              <span className="text-sm font-semibold text-accent-700 dark:text-accent-300">
                {event.friendsAttendingCount === 1
                  ? '1 ami participe'
                  : `${event.friendsAttendingCount} amis participent`}
              </span>
            </div>
          </div>
        )}

        {/* Meta info */}
        <div
          className="space-y-1.5 mb-4 text-neutral-600 dark:text-neutral-300"
          aria-describedby={`event-title-${event.id}`}
        >
          {eventWithMeta.distance != null && (
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                À {eventWithMeta.distance} km
              </span>
            </div>
          )}
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
            <time
              dateTime={typeof dateValue === 'string' ? dateValue : ''}
              className="text-sm"
            >
              {safeFormat(dateValue, "d MMMM yyyy 'à' HH'h'mm")}
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
              <Link
                to={`/user/${event.organizerId}/profile`}
                className="text-sm truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {event.organizer.username || event.organizer.email?.split('@')[0]}
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="event-card-footer">
          {isCancelled ? (
            <p className="text-sm text-error-600 dark:text-error-400 mb-3">
              Cet événement a été annulé.
              {event.cancelReason && (
                <span className="block text-xs mt-1 text-neutral-500 dark:text-neutral-400">
                  {event.cancelReason}
                </span>
              )}
            </p>
          ) : (
            <div
              className={`flex items-center mb-3 ${
                isCommunity ? 'justify-end' : 'justify-between'
              }`}
            >
              {!isCommunity &&
                (minPrice === 0 ? (
                  <span className="text-lg font-bold text-success-500 dark:text-success-400">Gratuit</span>
                ) : (
                  <div>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 block">À partir de</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {formatPrice(minPrice)} €
                    </span>
                  </div>
                ))}

              {/* Stock indicator */}
              <div className="text-right">
                {stockLevel === 'empty' ? (
                  <Badge variant="error" size="sm">Complet</Badge>
                ) : stockLevel === 'low' ? (
                  <div>
                    <Badge variant="warning" size="sm">
                      {totalStock} places
                    </Badge>
                    <div className="mt-1 w-16 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden ml-auto">
                      <div className={`h-full ${stockBarColor} rounded-full w-1/4`} />
                    </div>
                  </div>
                ) : (
                  <Badge variant="success" size="sm">
                    {totalStock} places
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Link
            to={`/events/${event.id}`}
            aria-label={`Voir les détails de ${event.title}`}
            className="btn-modern btn-primary w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Voir les détails
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

export default EventCard;
