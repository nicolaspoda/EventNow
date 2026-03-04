import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { safeFormat } from '../../utils/date';
import { parsePrice, formatPrice } from '../../utils/price';
import type { Booking } from '../../types/booking.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface BookingCardProps {
  booking: Booking;
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onConfirm, onCancel }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

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
  const isExpiringSoon =
    booking.status === 'PENDING' &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt.getTime() - now < 300000;
  const totalPrice = parsePrice(booking.ticketCategory?.price) * booking.quantity;

  return (
    <article className="glass-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {booking.ticketCategory?.event && (
              <Link
                to={`/events/${booking.ticketCategory.event.id}`}
                className="text-xl font-bold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              >
                {booking.ticketCategory.event.title}
              </Link>
            )}
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Catégorie : <span className="font-semibold">{booking.ticketCategory?.name}</span>
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-neutral-700 dark:text-neutral-300">
            <span className="font-medium">Quantité :</span> {booking.quantity} billet{booking.quantity > 1 ? 's' : ''}
          </p>
          <p className="text-neutral-700 dark:text-neutral-300">
            <span className="font-medium">Prix total :</span> {formatPrice(totalPrice)} €
          </p>
          {booking.ticketCategory?.event && (
            <p className="text-neutral-700 dark:text-neutral-300">
              <span className="font-medium">Date de l'événement :</span>{' '}
              <time dateTime={booking.ticketCategory.event.eventDate}>
                {safeFormat(booking.ticketCategory.event.eventDate, 'dd MMMM yyyy à HH:mm')}
              </time>
            </p>
          )}
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Réservé le {safeFormat(booking.createdAt, 'dd/MM/yyyy à HH:mm')}
          </p>
        </div>

        {booking.status === 'PENDING' && (
          <div className={`p-3 rounded-lg mb-4 ${isExpiringSoon ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
            <p className={`text-sm ${isExpiringSoon ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'}`}>
              Expire le {safeFormat(booking.expiresAt, 'dd/MM/yyyy à HH:mm')}
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
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-300">
              ✓ Réservation confirmée. Vous recevrez vos billets par email.
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

export default BookingCard;
