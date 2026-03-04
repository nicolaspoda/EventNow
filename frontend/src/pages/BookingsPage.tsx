import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Booking } from '../types/booking.types';
import { bookingService } from '../services/bookingService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import BookingCard from '../components/bookings/BookingCard';
import Button from '../components/ui/Button';

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getUserBookings();
      setBookings(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des réservations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirm = async (bookingId: string) => {
    try {
      await bookingService.confirmBooking(bookingId);
      await fetchBookings();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la confirmation'));
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      await fetchBookings();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de l\'annulation'));
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'pending') return booking.status === 'PENDING';
    if (filter === 'confirmed') return booking.status === 'CONFIRMED';
    return true;
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Chargement de vos réservations...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Mes réservations
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Gérez vos réservations de billets
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/events')}
            >
              ← Retour au catalogue
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600'
              }`}
            >
              Toutes ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600'
              }`}
            >
              En attente ({bookings.filter(b => b.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'confirmed'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600'
              }`}
            >
              Confirmées ({bookings.filter(b => b.status === 'CONFIRMED').length})
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg
              className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {filter === 'all' ? 'Aucune réservation' : `Aucune réservation ${filter === 'pending' ? 'en attente' : 'confirmée'}`}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {filter === 'all' 
                ? 'Vous n\'avez pas encore réservé de billets.'
                : `Vous n'avez pas de réservation ${filter === 'pending' ? 'en attente' : 'confirmée'}.`
              }
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/events')}
            >
              Découvrir les événements
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="list" aria-label="Liste des réservations">
            {filteredBookings.map((booking) => (
              <div key={booking.id} role="listitem">
                <BookingCard
                  booking={booking}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default BookingsPage;
