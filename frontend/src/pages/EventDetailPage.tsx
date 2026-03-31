import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Event } from '../types/event.types';
import type { ParticipationRequest } from '../types/participation.types';
import { eventService } from '../services/eventService';
import { bookingService } from '../services/bookingService';
import { participationService } from '../services/participationService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../utils/useAuth';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import EventDetail from '../components/events/EventDetail';
import { EventParticipantReviewsSection } from '../components/events/EventParticipantReviewsSection';
import Button from '../components/ui/Button';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { ReviewsList } from '../components/reviews/ReviewsList';
import messageService from '../services/messageService';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [myParticipationRequest, setMyParticipationRequest] = useState<ParticipationRequest | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'participants' | 'reviews'>('details');

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
        const rawDate: unknown =
          data.eventDate ?? (data as { event_date?: unknown }).event_date;
        let eventDateStr: string | undefined;
        if (rawDate instanceof Date) {
          eventDateStr = Number.isNaN(rawDate.getTime()) ? undefined : rawDate.toISOString();
        } else if (typeof rawDate === 'string' && rawDate.trim()) {
          const d = new Date(rawDate);
          eventDateStr = Number.isNaN(d.getTime()) ? undefined : rawDate.trim();
        }
        setEvent({
          ...data,
          eventDate: eventDateStr ?? (data.eventDate as string) ?? (data as { event_date?: string }).event_date,
        });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Événement introuvable'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    const fetchMyRequest = async () => {
      if (!id || !isAuthenticated) {
        setMyParticipationRequest(undefined);
        return;
      }
      try {
        const req = await participationService.getMyRequestForEvent(id);
        setMyParticipationRequest(req ?? null);
      } catch {
        setMyParticipationRequest(null);
      }
    };
    fetchMyRequest();
  }, [id, isAuthenticated]);

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

  const handleParticipationRequestSuccess = async () => {
    if (!id) return;
    try {
      const req = await participationService.getMyRequestForEvent(id);
      setMyParticipationRequest(req ?? null);
    } catch {
      setMyParticipationRequest(null);
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
            className="bg-error-50 dark:bg-neutral-800 border border-error-200 dark:border-neutral-700 rounded-xl p-6 text-center"
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
            <h1 className="text-2xl font-bold text-error-800 dark:text-neutral-100 mb-2">
              Événement introuvable
            </h1>
            <p className="text-error-700 dark:text-neutral-300 mb-6">
              {error && error !== 'Événement introuvable'
                ? error
                : "L'événement que vous recherchez n'existe pas ou a été supprimé."}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {(() => {
          const showParticipantsTab = event.type === 'COMMUNITY' && isAuthenticated && user != null && event.organizerId === user.id;
          const tabs: { id: 'details' | 'participants' | 'reviews'; label: string }[] = [
            { id: 'details', label: 'Détails' },
            ...(showParticipantsTab ? [{ id: 'participants' as const, label: 'Participants' }] : []),
            { id: 'reviews', label: 'Avis' },
          ];
          return (
            <>
              <div className="mb-6">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Contenu
                </p>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sections de la page">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`panel-${tab.id}`}
                      id={`tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-100 dark:focus:ring-offset-neutral-900 ${
                        activeTab === tab.id
                          ? 'bg-primary-600 text-white dark:bg-primary-500'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {event.type === 'COMMUNITY' && isAuthenticated && (myParticipationRequest?.status === 'ACCEPTED' || event.organizerId === user?.id) && (
                <div className="mb-6">
                  <Button
                    variant="accent"
                    onClick={async () => {
                      try {
                        const conversation = await messageService.getEventConversation(event.id);
                        navigate(`/messages/${conversation.id}`);
                      } catch (err) {
                        console.error('Erreur:', err);
                      }
                    }}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    }
                  >
                    Accéder à la messagerie de groupe
                  </Button>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 p-8 md:p-10 lg:p-12">
                {activeTab === 'details' && (
                  <div id="panel-details" role="tabpanel" aria-labelledby="tab-details">
                    <EventDetail
                      event={event}
                      onBooking={event.type === 'COMMUNITY' ? undefined : handleBooking}
                      onParticipationRequestSuccess={event.type === 'COMMUNITY' ? handleParticipationRequestSuccess : undefined}
                      myParticipationRequest={event.type === 'COMMUNITY' ? myParticipationRequest : undefined}
                      onLoginRequired={() => navigate('/login', { state: { from: `/events/${id}` } })}
                      isAuthenticated={isAuthenticated}
                      isOrganizer={isAuthenticated && user != null && event.organizerId === user.id}
                    />
                  </div>
                )}

                {activeTab === 'participants' && showParticipantsTab && (
                  <div id="panel-participants" role="tabpanel" aria-labelledby="tab-participants">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                      Participants
                    </h2>
                    <EventParticipantReviewsSection eventId={event.id} hideTitle={true} />
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                      Avis sur l'événement
                    </h2>
                    {canReview && (
                      <div className="mb-6">
                        <ReviewForm
                          eventId={id!}
                          onSuccess={() => {
                            setCanReview(false);
                            setReviewsVersion((v) => v + 1);
                          }}
                        />
                      </div>
                    )}
                    <ReviewsList eventId={id!} refreshTrigger={reviewsVersion} />
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </main>
  );
};

export default EventDetailPage;
