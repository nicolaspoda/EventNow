import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Event } from '../../types/event.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface EventDetailProps {
  event: Event;
  onBooking?: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onBooking }) => {
  const eventDate = new Date(event.eventDate);
  const totalStock = event.ticketCategories.reduce((sum, cat) => sum + cat.currentStock, 0);
  const isSoldOut = totalStock === 0;

  const getStockIndicator = (currentStock: number, initialStock: number) => {
    const percentage = (currentStock / initialStock) * 100;
    
    if (currentStock === 0) {
      return <Badge variant="error">Épuisé</Badge>;
    }
    if (percentage < 20) {
      return <Badge variant="warning">Plus que {currentStock} places</Badge>;
    }
    return <Badge variant="success">{currentStock} places disponibles</Badge>;
  };

  return (
    <article className="bg-white rounded-lg shadow-lg overflow-hidden">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={`Image de ${event.title}`}
          className="w-full h-64 md:h-96 object-cover"
        />
      )}

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time dateTime={event.eventDate}>
                {format(eventDate, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
              </time>
            </div>

            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          </div>

          {event.description && (
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Catégories de billets</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponibilité
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {event.ticketCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-gray-500">{category.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {category.price.toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockIndicator(category.currentStock, category.initialStock)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {event.organizer && (
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Organisateur</h2>
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                {event.organizer.firstName && event.organizer.lastName ? (
                  <p className="text-sm font-medium text-gray-900">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                ) : null}
                <p className="text-sm text-gray-600">{event.organizer.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            size="lg"
            disabled={isSoldOut}
            onClick={onBooking}
            fullWidth
            aria-label={isSoldOut ? 'Réservation impossible, événement complet' : 'Réserver des billets'}
          >
            {isSoldOut ? 'Complet' : 'Réserver'}
          </Button>
        </div>

        {isSoldOut && (
          <p className="mt-4 text-center text-sm text-red-600" role="alert">
            Toutes les places pour cet événement sont épuisées
          </p>
        )}
      </div>
    </article>
  );
};

export default EventDetail;
