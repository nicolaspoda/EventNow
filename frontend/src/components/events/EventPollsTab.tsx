import React, { useState, useEffect, useCallback } from 'react';
import { pollsService, type Poll } from '../../services/pollsService';
import { socketService } from '../../services/socketService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';
import PollCard from './PollCard';
import CreatePollModal from './CreatePollModal';

interface Props {
  eventId: string;
  currentUserId: string;
  isOrganizer: boolean;
}

const EventPollsTab: React.FC<Props> = ({ eventId, currentUserId, isOrganizer }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadPolls = useCallback(async () => {
    try {
      setError(null);
      const data = await pollsService.getEventPolls(eventId);
      setPolls(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des sondages'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socketService.isConnected()) return;

    socketService.joinEventRoom(eventId).catch(() => {});

    const handlePollCreated = (poll: Poll) => {
      setPolls((prev) => {
        if (prev.some((p) => p.id === poll.id)) return prev;
        return [poll, ...prev];
      });
    };

    const handlePollUpdated = (poll: Poll) => {
      setPolls((prev) =>
        prev.map((p) =>
          p.id === poll.id
            ? { ...poll, hasVoted: p.hasVoted, myVotes: p.myVotes, isCreatedByMe: p.isCreatedByMe }
            : p,
        ),
      );
    };

    const handlePollDeleted = (data: { pollId: string }) => {
      setPolls((prev) => prev.filter((p) => p.id !== data.pollId));
    };

    socketService.on('pollCreated', handlePollCreated);
    socketService.on('pollUpdated', handlePollUpdated);
    socketService.on('pollDeleted', handlePollDeleted);

    return () => {
      socketService.off('pollCreated', handlePollCreated);
      socketService.off('pollUpdated', handlePollUpdated);
      socketService.off('pollDeleted', handlePollDeleted);
      socketService.leaveEventRoom(eventId);
    };
  }, [eventId]);

  const handlePollCreated = (poll: Poll) => {
    setPolls((prev) => {
      if (prev.some((p) => p.id === poll.id)) return prev;
      return [poll, ...prev];
    });
  };

  const handlePollUpdated = (poll: Poll) => {
    setPolls((prev) => prev.map((p) => (p.id === poll.id ? poll : p)));
  };

  const handlePollDeleted = (pollId: string) => {
    setPolls((prev) => prev.filter((p) => p.id !== pollId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
          aria-label="Chargement..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error-600 dark:text-error-400" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          Sondages
          {polls.filter((p) => !p.isClosed).length > 0 && (
            <span className="text-sm font-normal bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2.5 py-0.5 rounded-full">
              {polls.filter((p) => !p.isClosed).length} ouvert{polls.filter((p) => !p.isClosed).length > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
          Créer un sondage
        </Button>
      </div>

      {/* Empty state */}
      {polls.length === 0 && (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          <svg
            className="mx-auto h-12 w-12 mb-3 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm">Aucun sondage pour l'instant.</p>
          <p className="text-sm">Créez un sondage pour organiser l'événement !</p>
        </div>
      )}

      {/* Polls list */}
      {polls.length > 0 && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={currentUserId}
              eventId={eventId}
              isOrganizer={isOrganizer}
              onUpdate={handlePollUpdated}
              onDelete={handlePollDeleted}
            />
          ))}
        </div>
      )}

      {createModalOpen && (
        <CreatePollModal
          eventId={eventId}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handlePollCreated}
        />
      )}
    </div>
  );
};

export default EventPollsTab;
