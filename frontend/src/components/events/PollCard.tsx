import React, { useState } from 'react';
import type { Poll } from '../../services/pollsService';
import { pollsService } from '../../services/pollsService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';

interface Props {
  poll: Poll;
  currentUserId: string;
  eventId: string;
  isOrganizer: boolean;
  onUpdate: (poll: Poll) => void;
  onDelete: (pollId: string) => void;
}

const PollCard: React.FC<Props> = ({
  poll,
  currentUserId,
  eventId,
  isOrganizer,
  onUpdate,
  onDelete,
}) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [changingVote, setChangingVote] = useState(false);
  const [pendingChangedIds, setPendingChangedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = poll.isCreatedByMe || isOrganizer;
  const showResults = poll.hasVoted || poll.isClosed;

  const toggleOption = (optionId: string) => {
    if (poll.multipleChoice) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const toggleChangeOption = (optionId: string) => {
    if (poll.multipleChoice) {
      setPendingChangedIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setPendingChangedIds([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptionIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await pollsService.vote(eventId, poll.id, {
        optionIds: selectedOptionIds,
      });
      onUpdate(updated);
      setSelectedOptionIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du vote'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeVote = async () => {
    if (pendingChangedIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await pollsService.changeVote(eventId, poll.id, {
        optionIds: pendingChangedIds,
      });
      onUpdate(updated);
      setChangingVote(false);
      setPendingChangedIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la modification du vote'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await pollsService.closePoll(eventId, poll.id);
      onUpdate(updated);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la fermeture'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce sondage ?')) return;
    setLoading(true);
    setError(null);
    try {
      await pollsService.deletePoll(eventId, poll.id);
      onDelete(poll.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la suppression'));
      setLoading(false);
    }
  };

  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 0);

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {poll.isClosed && (
              <span className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Fermé
              </span>
            )}
            {poll.multipleChoice && !poll.isClosed && (
              <span className="text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">
                Choix multiple
              </span>
            )}
            {poll.closesAt && !poll.isClosed && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Ferme le {new Date(poll.closesAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          <p className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
            {poll.question}
          </p>
          {poll.description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              {poll.description}
            </p>
          )}
        </div>

        {/* Manage actions */}
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            {!poll.isClosed && (
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="text-xs border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
              >
                Fermer
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              aria-label="Supprimer le sondage"
              className="text-neutral-400 hover:text-error-600 dark:hover:text-error-400 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-error-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Vote count */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
        {poll.totalVotes} {poll.totalVotes === 1 ? 'participant a voté' : 'participants ont voté'}
      </p>

      {/* Options — voting mode */}
      {!showResults && !changingVote && (
        <div className="space-y-2 mb-4">
          {poll.options.map((option) => {
            const selected = selectedOptionIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleOption(option.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  selected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  {poll.multipleChoice ? (
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary-500 bg-primary-500' : 'border-neutral-400'}`}>
                      {selected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary-500' : 'border-neutral-400'}`}>
                      {selected && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                    </span>
                  )}
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Options — results mode (voted or closed) */}
      {(showResults && !changingVote) && (
        <div className="space-y-3 mb-4">
          {poll.options.map((option) => {
            const pct = poll.totalVotes === 0 ? 0 : Math.round((option.voteCount / poll.totalVotes) * 100);
            const isMyVote = poll.myVotes.includes(option.id);
            const isWinner = poll.isClosed && option.voteCount === maxVotes && maxVotes > 0;
            return (
              <div key={option.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={`flex items-center gap-1.5 font-medium ${isWinner ? 'text-success-700 dark:text-success-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {isMyVote && (
                      <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {option.text}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                    {option.voteCount} · {pct}%
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWinner
                        ? 'bg-success-500'
                        : isMyVote
                          ? 'bg-primary-500'
                          : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Options — change vote mode */}
      {changingVote && (
        <div className="space-y-2 mb-4">
          {poll.options.map((option) => {
            const selected = pendingChangedIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleChangeOption(option.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  selected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-primary-400'
                }`}
              >
                {option.text}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-sm text-error-600 dark:text-error-400 mb-3 p-2 bg-error-50 dark:bg-error-900/20 rounded-lg" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!showResults && !changingVote && (
          <Button
            variant="primary"
            onClick={handleVote}
            disabled={selectedOptionIds.length === 0 || loading}
          >
            {loading ? 'Vote en cours...' : 'Voter'}
          </Button>
        )}

        {showResults && !poll.isClosed && poll.hasVoted && !changingVote && (
          <button
            type="button"
            onClick={() => {
              setChangingVote(true);
              setPendingChangedIds([...poll.myVotes]);
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            Modifier mon vote
          </button>
        )}

        {changingVote && (
          <>
            <Button
              variant="primary"
              onClick={handleChangeVote}
              disabled={pendingChangedIds.length === 0 || loading}
            >
              {loading ? 'Modification...' : 'Confirmer'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setChangingVote(false);
                setPendingChangedIds([]);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PollCard;
