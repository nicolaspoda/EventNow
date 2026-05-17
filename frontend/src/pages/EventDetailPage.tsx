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

interface CancelModalState {
  open: boolean;
  reason: string;
  loading: boolean;
  error: string | null;
}

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
  const [cancelModal, setCancelModal] = useState<CancelModalState>({ open: false, reason: '', loading: false, error: null });
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
      } catch {
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

  const handleCancelConfirm = async () => {
    if (!id) return;
    setCancelModal((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await eventService.cancelEvent(id, cancelModal.reason || undefined);
      setCancelModal({ open: false, reason: '', loading: false, error: null });
      const toastMsg = event.type === 'COMMUNITY'
        ? 'Événement annulé. Les participants ont été notifiés.'
        : 'Événement annulé. Les remboursements ont été initiés.';
      setSuccessToast(toastMsg);
      setTimeout(() => navigate('/events'), 2000);
    } catch (err) {
      setCancelModal((prev) => ({
        ...prev,
        loading: false,
        error: getApiErrorMessage(err, "Erreur lors de l'annulation"),
      }));
    }
  };

  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(t);
  }, [successToast]);

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

        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/events')}
            aria-label="Retour à la liste des événements"
          >
            ← Retour
          </Button>

          {isAuthenticated && user != null && event.organizerId === user.id && !event.cancelledAt && event.eventDate > new Date().toISOString() && (
            <Button
              variant="danger"
              onClick={() => setCancelModal((prev) => ({ ...prev, open: true }))}
            >
              Annuler l'événement
            </Button>
          )}
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
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

                  {event.type === 'COMMUNITY' && isAuthenticated && (myParticipationRequest?.status === 'ACCEPTED' || event.organizerId === user?.id) && (
                    <Button
                      variant="secondary"
                      className="w-full md:w-auto border border-neutral-300 dark:border-neutral-600"
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
                  )}
                </div>
              </div>

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
                    <EventParticipantReviewsSection
                      eventId={event.id}
                      hideTitle={true}
                      eventDate={event.eventDate}
                    />
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

      {/* Success toast */}
      {successToast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-success-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          {successToast}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !cancelModal.loading && setCancelModal((prev) => ({ ...prev, open: false }))} />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 id="cancel-modal-title" className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              Annuler l'événement
            </h2>
            <p className="text-sm text-error-700 dark:text-error-300 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 mb-4">
              {event.type === 'COMMUNITY'
                ? 'Cette action est irréversible. Tous les participants seront notifiés de l\'annulation.'
                : 'Cette action est irréversible. Tous les participants seront remboursés automatiquement.'}
            </p>

            <div className="mb-4">
              <label htmlFor="cancel-reason" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Raison de l'annulation (optionnel)
              </label>
              <textarea
                id="cancel-reason"
                rows={3}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Expliquez la raison de l'annulation..."
                value={cancelModal.reason}
                onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                disabled={cancelModal.loading}
              />
            </div>

            {cancelModal.error && (
              <p className="text-sm text-error-600 dark:text-error-400 mb-4" role="alert">
                {cancelModal.error}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setCancelModal({ open: false, reason: '', loading: false, error: null })}
                disabled={cancelModal.loading}
              >
                Retour
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelConfirm}
                disabled={cancelModal.loading}
              >
                {cancelModal.loading ? 'Annulation...' : 'Confirmer l\'annulation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default EventDetailPage;
