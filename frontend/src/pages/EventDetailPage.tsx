import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Event } from '../types/event.types';
import { eventService } from '../services/eventService';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../utils/useAuth';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import EventDetail from '../components/events/EventDetail';
import Button from '../components/ui/Button';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Événement introuvable');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleBooking = async (categoryId: string, quantity: number) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      await bookingService.createBooking({ ticketCategoryId: categoryId, quantity });
      alert('Réservation créée avec succès ! Vous avez 10 minutes pour finaliser le paiement.');
      navigate('/bookings');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la réservation'));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600">Chargement de l'événement...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-6" aria-label="Fil d'Ariane">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <Link to="/events" className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  Événements
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-900">Erreur</li>
            </ol>
          </nav>

          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
            role="alert"
          >
            <svg 
              className="mx-auto h-12 w-12 text-red-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Événement introuvable
            </h1>
            <p className="text-red-700 mb-6">
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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6" aria-label="Fil d'Ariane">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link 
                to="/events" 
                className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Événements
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-900 truncate max-w-xs">{event.title}</li>
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

        <EventDetail event={event} onBooking={handleBooking} />
      </div>
    </main>
  );
};

export default EventDetailPage;
