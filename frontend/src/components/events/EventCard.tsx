import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types/event.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { safeFormat } from '../../utils/date';
import { parsePrice, formatPrice } from '../../utils/price';
import { getCloudinarySrcSet } from '../../utils/cloudinary';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const totalStock = event.ticketCategories.reduce((sum, cat) => sum + cat.currentStock, 0);
  const prices = event.ticketCategories.map((cat) => parsePrice(cat.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const dateValue = event.eventDate ?? (event as { event_date?: string }).event_date;
  const dateFormatted = safeFormat(dateValue, "d MMMM yyyy 'à' HH'h'mm");
  const cloudinarySrc = event.imageUrl ? getCloudinarySrcSet(event.imageUrl) : null;
  
  const getStockBadge = () => {
    if (totalStock === 0) {
      return <Badge variant="error">Complet</Badge>;
    }
    if (totalStock < 50) {
      return <Badge variant="warning">Plus que {totalStock} places</Badge>;
    }
    return <Badge variant="success">{totalStock} places disponibles</Badge>;
  };

  return (
    <article 
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col h-full focus-within:ring-2 focus-within:ring-blue-500 border border-gray-100"
    >
      {event.imageUrl ? (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img
            src={cloudinarySrc?.src ?? event.imageUrl}
            srcSet={cloudinarySrc?.srcSet}
            sizes={cloudinarySrc?.sizes}
            alt={`Affiche de l'événement ${event.title} qui se déroulera le ${dateFormatted} à ${event.location}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400"
          role="img"
          aria-label="Aucune image disponible pour cet événement"
        >
          <svg
            className="w-14 h-14 mb-2 opacity-60"
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
          <span className="text-sm font-medium">Affiche non fournie</span>
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 id={`event-title-${event.id}`} className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4 text-gray-600" aria-describedby={`event-title-${event.id}`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={typeof dateValue === 'string' ? dateValue : ''} className="text-sm">
              {dateFormatted}
            </time>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-gray-900">
              À partir de {formatPrice(minPrice)} €
            </span>
          </div>

          <div className="mb-4">
            {getStockBadge()}
          </div>

          <Link to={`/events/${event.id}`} aria-label={`Voir les détails de ${event.title}`}>
            <Button variant="primary" fullWidth>
              Voir les détails
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
