import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import participantReviewService from '../../services/participantReviewService';
import type { ParticipantForReview } from '../../services/participantReviewService';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { StarRating } from '../reviews/StarRating';

interface EventParticipantReviewsSectionProps {
  eventId: string;
  hideTitle?: boolean;
}

export function EventParticipantReviewsSection({ eventId, hideTitle = false }: EventParticipantReviewsSectionProps) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  const [participants, setParticipants] = useState<ParticipantForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingParticipant, setReviewingParticipant] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, [eventId, token]);

  const fetchParticipants = async () => {
    if (!eventId || !token) return;
    try {
      setLoading(true);
      const data = await participantReviewService.getParticipantsForEvent(token, eventId);
      setParticipants(data);
    } catch {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (participantId: string) => {
    if (!token || !eventId) return;
    try {
      setSubmitting(true);
      await participantReviewService.createReview(token, {
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
      const msg = err && typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      alert(msg || "Erreur lors de la soumission de l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = (p: ParticipantForReview) =>
    p.username ? p.username : p.email.split('@')[0];

  return (
    <div className={hideTitle === true ? 'mb-0' : 'border-t border-neutral-200 dark:border-neutral-700 pt-6 mb-6'}>
      {hideTitle !== true && (
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Participants
        </h2>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent mx-auto" />
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">Chargement des participants...</p>
        </div>
      ) : participants.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Aucun participant accepté pour le moment. Les avis pourront être laissés une fois des participants inscrits.
        </p>
      ) : (
        <ul className="space-y-4">
          {participants.map((participant) => (
            <li key={participant.id}>
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Link
                    to={`/user/${participant.id}/profile`}
                    className="flex-shrink-0"
                  >
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={displayName(participant)}
                        className="w-12 h-12 rounded-full object-cover hover:opacity-80"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                          {displayName(participant).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    {/* Ligne : nom à côté du bouton avec espace */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/user/${participant.id}/profile`}
                        className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 hover:underline underline-offset-2 cursor-pointer"
                      >
                        {displayName(participant)}
                      </Link>
                      {participant.hasReview && participant.review ? null : reviewingParticipant !== participant.id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewingParticipant(participant.id)}
                          className="shrink-0"
                        >
                          Laisser une note et un avis
                        </Button>
                      ) : null}
                    </div>

                    {participant.hasReview && participant.review ? (
                      <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StarRating value={participant.review.rating} readonly size="sm" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {participant.review.rating}/5
                          </span>
                        </div>
                        {participant.review.comment && (
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                            {participant.review.comment}
                          </p>
                        )}
                      </div>
                    ) : reviewingParticipant === participant.id ? (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Note
                          </label>
                          <div className="flex items-center gap-2">
                            <StarRating value={rating} onChange={setRating} size="lg" />
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                              {rating}/5
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Avis (optionnel)
                          </label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Votre avis sur ce participant..."
                            rows={2}
                            maxLength={1000}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReview(participant.id)}
                            disabled={submitting}
                          >
                            {submitting ? 'Envoi...' : 'Publier'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingParticipant(null);
                              setRating(5);
                              setComment('');
                            }}
                            disabled={submitting}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
