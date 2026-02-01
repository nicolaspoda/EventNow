import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Booking } from '../../types/booking.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface BookingCardProps {
  booking: Booking;
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onConfirm, onCancel }) => {
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'CONFIRMED':
        return <Badge variant="success">Confirmée</Badge>;
      case 'EXPIRED':
        return <Badge variant="error">Expirée</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Annulée</Badge>;
      default:
        return null;
    }
  };

  const expiresAt = new Date(booking.expiresAt);
  const isExpiringSoon = booking.status === 'PENDING' && expiresAt.getTime() - Date.now() < 300000;
  const totalPrice = Number(booking.ticketCategory?.price || 0) * booking.quantity;

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {booking.ticketCategory?.event && (
              <Link
                to={`/events/${booking.ticketCategory.event.id}`}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {booking.ticketCategory.event.title}
              </Link>
            )}
            <p className="text-gray-600 mt-1">
              Catégorie : <span className="font-semibold">{booking.ticketCategory?.name}</span>
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-gray-700">
            <span className="font-medium">Quantité :</span> {booking.quantity} billet{booking.quantity > 1 ? 's' : ''}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Prix total :</span> {totalPrice.toFixed(2)} €
          </p>
          {booking.ticketCategory?.event && (
            <p className="text-gray-700">
              <span className="font-medium">Date de l'événement :</span>{' '}
              <time dateTime={booking.ticketCategory.event.eventDate}>
                {format(new Date(booking.ticketCategory.event.eventDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </time>
            </p>
          )}
          <p className="text-gray-600 text-sm">
            Réservé le {format(new Date(booking.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </p>
        </div>

        {booking.status === 'PENDING' && (
          <div className={`p-3 rounded-lg mb-4 ${isExpiringSoon ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <p className={`text-sm ${isExpiringSoon ? 'text-red-800' : 'text-yellow-800'}`}>
              {isExpiringSoon ? '⚠️ ' : '⏱️ '}
              Expire le {format(expiresAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </p>
          </div>
        )}

        {booking.status === 'PENDING' && onConfirm && onCancel && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking.id)}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConfirm(booking.id)}
              fullWidth
            >
              Payer maintenant
            </Button>
          </div>
        )}

        {booking.status === 'CONFIRMED' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ Réservation confirmée. Vous recevrez vos billets par email.
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default BookingCard;
