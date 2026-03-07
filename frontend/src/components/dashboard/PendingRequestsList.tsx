import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { participationService } from '../../services/participationService';
import type { ParticipationRequest } from '../../types/participation.types';
import { safeFormat } from '../../utils/date';

interface PendingRequestsListProps {
  requests: ParticipationRequest[];
  onRefresh: () => void;
}

function requesterLabel(req: ParticipationRequest): string {
  const u = req.user;
  if (!u) return 'Un utilisateur';
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  return u.email;
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({
  requests,
  onRefresh,
}) => {
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleRespond = async (requestId: string, action: 'ACCEPT' | 'REFUSE') => {
    setRespondingId(requestId);
    try {
      await participationService.respond(requestId, action);
      onRefresh();
    } catch (err) {
      alert(
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur'
          : 'Erreur',
      );
    } finally {
      setRespondingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <section
      className="glass-card overflow-hidden mb-8"
      aria-labelledby="pending-requests-heading"
    >
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 id="pending-requests-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Demandes de participation en attente
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Acceptez ou refusez les demandes pour vos événements communautaires
        </p>
      </div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {requests.map((req) => (
          <li
            key={req.id}
            className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {req.user?.id ? (
                  <Link
                    to={`/user/${req.user.id}/profile`}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {requesterLabel(req)}
                  </Link>
                ) : (
                  requesterLabel(req)
                )}{' '}
                souhaite participer à{' '}
                {req.event ? (
                  <Link
                    to={`/events/${req.event.id}`}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {req.event.title}
                  </Link>
                ) : (
                  'votre événement'
                )}
              </p>
              {req.message && (
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 italic">
                  "{req.message}"
                </p>
              )}
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Demandé le {safeFormat(req.createdAt, 'd MMMM yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={respondingId === req.id}
                onClick={() => handleRespond(req.id, 'ACCEPT')}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {respondingId === req.id ? '...' : 'Accepter'}
              </button>
              <button
                type="button"
                disabled={respondingId === req.id}
                onClick={() => handleRespond(req.id, 'REFUSE')}
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-sm rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-500 disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
