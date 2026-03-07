import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { safeFormat } from '../../utils/date';
import { formatPrice } from '../../utils/price';
import { getCloudinarySrcSet } from '../../utils/cloudinary';
import type { Event, TicketCategory } from '../../types/event.types';
import type { ParticipationRequest } from '../../types/participation.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import BookingModal from '../bookings/BookingModal';
import { ParticipationRequestModal } from '../participation/ParticipationRequestModal';

interface EventDetailProps {
  event: Event;
  onBooking?: (categoryId: string, quantity: number) => Promise<void>;
  onParticipationRequestSuccess?: () => void;
  myParticipationRequest?: ParticipationRequest | null;
  onLoginRequired?: () => void;
  isAuthenticated?: boolean;
  isOrganizer?: boolean;
}

const EventDetail: React.FC<EventDetailProps> = ({
  event,
  onBooking,
  onParticipationRequestSuccess,
  myParticipationRequest,
  onLoginRequired,
  isAuthenticated = false,
  isOrganizer = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [showParticipationModal, setShowParticipationModal] = useState(false);
  const isCommunity = event.type === 'COMMUNITY';
  const participationCategory = isCommunity && event.ticketCategories?.length
    ? event.ticketCategories.find((c) => c.name === 'Participation') ?? event.ticketCategories[0]
    : null;
  const participationPlacesAvailable = participationCategory?.currentStock ?? 0;
  const isParticipationFull = participationPlacesAvailable <= 0;
  const totalStock = event.ticketCategories.reduce((sum, cat) => sum + cat.currentStock, 0);
  const isSoldOut = !isCommunity && totalStock === 0;
  const cloudinarySrc = event.imageUrl ? getCloudinarySrcSet(event.imageUrl) : null;

  const handleCategorySelect = (category: TicketCategory) => {
    if (isOrganizer) return;
    if (category.currentStock === 0) return;
    if (!isAuthenticated && onLoginRequired) {
      onLoginRequired();
      return;
    }
    setSelectedCategory(category);
  };

  const handleConfirmBooking = async (quantity: number) => {
    if (selectedCategory && onBooking) {
      await onBooking(selectedCategory.id, quantity);
      setSelectedCategory(null);
    }
  };

  const handleParticipationRequest = () => {
    if (!isAuthenticated) {
      if (onLoginRequired) onLoginRequired();
      return;
    }
    setShowParticipationModal(true);
  };

  const handleParticipationSuccess = () => {
    onParticipationRequestSuccess?.();
  };

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
    <article className="glass-card overflow-hidden">
      {event.imageUrl && (
        <div className="w-full h-64 md:h-96 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
          <img
            src={cloudinarySrc?.src ?? event.imageUrl}
            srcSet={cloudinarySrc?.srcSet}
            sizes={cloudinarySrc?.sizes ?? '100vw'}
            alt={`Image de ${event.title}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-neutral-600 dark:text-neutral-300 mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-500 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time dateTime={event.eventDate ?? (event as { event_date?: string }).event_date ?? ''}>
                {safeFormat(event.eventDate ?? (event as { event_date?: string }).event_date, "EEEE d MMMM yyyy 'à' HH'h'mm")}
              </time>
            </div>

            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-500 dark:text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          </div>

          {event.description && (
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Description</h2>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        {isCommunity ? (
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Participation
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant={isParticipationFull ? 'error' : 'success'}>
                {isParticipationFull
                  ? 'Complet'
                  : `${participationPlacesAvailable} place${participationPlacesAvailable > 1 ? 's' : ''} disponible${participationPlacesAvailable > 1 ? 's' : ''}`}
              </Badge>
              {!isOrganizer && (
                myParticipationRequest ? (
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {myParticipationRequest.status === 'PENDING' && 'Demande en attente'}
                    {myParticipationRequest.status === 'ACCEPTED' && 'Votre demande a été acceptée'}
                    {myParticipationRequest.status === 'REFUSED' && 'Votre demande a été refusée'}
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    disabled={isParticipationFull}
                    onClick={handleParticipationRequest}
                  >
                    {!isAuthenticated
                      ? 'Se connecter pour demander à participer'
                      : 'Demander à participer'}
                  </Button>
                )
              )}
            </div>
          </div>
        ) : (
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Catégories de billets</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Prix
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Disponibilité
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {event.ticketCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{category.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatPrice(category.price)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockIndicator(category.currentStock, category.initialStock)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isOrganizer ? (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">—</span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={category.currentStock === 0}
                          onClick={() => handleCategorySelect(category)}
                        >
                          {category.currentStock === 0 ? 'Épuisé' : 'Réserver'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {event.organizer && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Organisateur</h2>
            <Link
              to={`/user/${event.organizerId}/profile`}
              className="flex items-center gap-4 rounded-lg p-2 -m-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            >
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                {event.organizer.firstName && event.organizer.lastName ? (
                  <p className="text-sm font-medium">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                ) : null}
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{event.organizer.email}</p>
              </div>
            </Link>
          </div>
        )}

        {!isCommunity && isSoldOut && (
          <p className="mt-4 text-center text-sm text-error-600 dark:text-error-400" role="alert">
            Toutes les places pour cet événement sont épuisées
          </p>
        )}
      </div>

      {selectedCategory && (
        <BookingModal
          category={selectedCategory}
          eventTitle={event.title}
          onClose={() => setSelectedCategory(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

      <ParticipationRequestModal
        eventId={event.id}
        eventTitle={event.title}
        isOpen={showParticipationModal}
        onClose={() => setShowParticipationModal(false)}
        onSuccess={handleParticipationSuccess}
      />
    </article>
  );
};

export default EventDetail;
