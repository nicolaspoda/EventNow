import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { eventService } from '../services/eventService';
import { participantReviewService, isEventDatePastForParticipantReviews } from '../services/participantReviewService';
import type { ParticipantForReview } from '../services/participantReviewService';
import { Card } from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import Button from '../components/ui/Button';
import { StarRating } from '../components/reviews/StarRating';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export default function EventParticipantReviewsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<ParticipantForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingParticipant, setReviewingParticipant] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eventDate, setEventDate] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const ev = await eventService.getEventById(eventId);
        setEventDate(ev.eventDate);
        if (!isEventDatePastForParticipantReviews(ev.eventDate)) {
          setParticipants([]);
          return;
        }
        const data = await participantReviewService.getParticipantsForEvent(eventId);
        setParticipants(data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Erreur lors du chargement des participants'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, user]);

  const fetchParticipants = async () => {
    if (!eventId) return;
    if (!isEventDatePastForParticipantReviews(eventDate)) {
      setParticipants([]);
      return;
    }
    try {
      setLoading(true);
      const data = await participantReviewService.getParticipantsForEvent(eventId);
      setParticipants(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des participants'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (participantId: string) => {
    if (!eventId) return;

    try {
      setSubmitting(true);
      await participantReviewService.createReview({
        eventId,
        participantId,
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewingParticipant(null);
      setRating(5);
      setComment('');
      await fetchParticipants();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Erreur lors de la soumission de l'avis"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Évaluer les participants
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Laissez un avis sur les participants de votre événement
          </p>
        </div>

        {!isEventDatePastForParticipantReviews(eventDate) ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                La liste des participants et les avis seront disponibles après la date de l&apos;événement.
              </p>
            </div>
          </Card>
        ) : participants.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Aucun participant à évaluer pour le moment
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {participants.map((participant) => (
              <Card key={participant.id} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Link to={`/user/${participant.id}/profile`}>
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.username ?? participant.email ?? 'Participant'}
                        className="w-16 h-16 rounded-full object-cover hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {(participant.username ?? participant.email ?? 'U').charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="flex-1">
                    <Link
                      to={`/user/${participant.id}/profile`}
                      className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {participant.username ?? participant.email}
                    </Link>

                    {participant.hasReview && participant.review ? (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Avis déjà laissé
                          </span>
                          <StarRating value={participant.review.rating} readonly size="sm" />
                        </div>
                        {participant.review.comment && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {participant.review.comment}
                          </p>
                        )}
                      </div>
                    ) : reviewingParticipant === participant.id ? (
                      <div className="mt-4">
                        <div className="mb-4">
                          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Note
                          </p>
                          <div className="flex items-center gap-4">
                            <StarRating
                              value={rating}
                              onChange={setRating}
                              size="lg"
                            />
                            <span className="text-lg font-medium text-gray-900 dark:text-white">
                              {rating}/5
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Commentaire (optionnel)
                          </p>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Partagez votre expérience avec ce participant..."
                            rows={3}
                            maxLength={1000}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSubmitReview(participant.id)}
                            disabled={submitting}
                          >
                            {submitting ? 'Envoi...' : 'Soumettre l\'avis'}
                          </Button>
                          <Button
                            onClick={() => {
                              setReviewingParticipant(null);
                              setRating(5);
                              setComment('');
                            }}
                            variant="outline"
                            disabled={submitting}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setReviewingParticipant(participant.id)}
                        className="mt-3"
                        variant="outline"
                      >
                        Laisser un avis
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
