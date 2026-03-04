import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Event } from '../types/event.types';
import { eventService } from '../services/eventService';
import { bookingService } from '../services/bookingService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../utils/useAuth';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import EventDetail from '../components/events/EventDetail';
import Button from '../components/ui/Button';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { ReviewsList } from '../components/reviews/ReviewsList';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('ID d\'événement manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await eventService.getEventById(id);
        setEvent(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Événement introuvable'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    const checkIfCanReview = async () => {
      if (!id || !isAuthenticated) {
        setCanReview(false);
        return;
      }

      try {
        const result = await reviewService.canUserReview(id);
        setCanReview(result.canReview);
      } catch (error) {
        setCanReview(false);
      }
    };

    checkIfCanReview();
  }, [id, isAuthenticated]);

  const handleBooking = async (categoryId: string, quantity: number) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      const booking = await bookingService.createBooking({
        ticketCategoryId: categoryId,
        quantity,
      });

      navigate(`/checkout?bookingId=${booking.id}`);
    } catch (err: unknown) {
      const status = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      if (status === 401) {
        navigate('/login', { state: { from: `/events/${id}`, message: 'Session expirée, veuillez vous reconnecter.' } });
        return;
      }
      alert(getApiErrorMessage(err, 'Erreur lors de la création de la réservation'));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 mx-auto mb-4" aria-hidden="true" />
          <p className="text-neutral-600 dark:text-neutral-300">Chargement de l'événement...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-6" aria-label="Fil d'Ariane">
            <ol className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link to="/events" className="hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
                  Événements
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-neutral-900 dark:text-neutral-100">Erreur</li>
            </ol>
          </nav>

          <div
            className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 text-center"
            role="alert"
          >
            <svg
              className="mx-auto h-12 w-12 text-error-500 dark:text-error-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-error-900 dark:text-error-100 mb-2">
              Événement introuvable
            </h1>
            <p className="text-error-700 dark:text-error-300 mb-6">
              {error || 'L\'événement que vous recherchez n\'existe pas ou a été supprimé.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/events')}>
              Retour aux événements
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6" aria-label="Fil d'Ariane">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <Link
                to="/events"
                className="hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              >
                Événements
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-900 dark:text-neutral-100 truncate max-w-xs">{event.title}</li>
          </ol>
        </nav>

        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            aria-label="Retour à la liste des événements"
          >
            ← Retour
          </Button>
        </div>

        <EventDetail
          event={event}
          onBooking={handleBooking}
          onLoginRequired={() => navigate('/login', { state: { from: `/events/${id}` } })}
          isAuthenticated={isAuthenticated}
        />

        <section className="mt-12">
          {canReview && (
            <div className="mb-8">
              <ReviewForm
                eventId={id!}
                onSuccess={() => {
                  setCanReview(false);
                }}
              />
            </div>
          )}

          <ReviewsList eventId={id!} />
        </section>
      </div>
    </main>
  );
};

export default EventDetailPage;
