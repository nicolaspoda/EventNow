import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Event } from '../../types/event.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const totalStock = event.ticketCategories.reduce((sum, cat) => sum + cat.currentStock, 0);
  const minPrice = Math.min(...event.ticketCategories.map(cat => Number(cat.price)));
  const eventDate = new Date(event.eventDate);
  
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
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full"
      aria-label={`Événement: ${event.title}`}
    >
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={`Image de ${event.title}`}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 mb-4 text-gray-600">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{event.location}</span>
          </div>
          
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={event.eventDate} className="text-sm">
              {format(eventDate, "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
            </time>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-900">
              À partir de {minPrice.toFixed(2)} €
            </span>
          </div>

          <div className="mb-4">
            {getStockBadge()}
          </div>

          <Link to={`/events/${event.id}`} aria-label={`Voir les détails de ${event.title}`}>
            <Button variant="primary" fullWidth>
              Voir les détails →
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
