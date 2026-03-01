import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import type { DashboardEvent } from '../../types/dashboard.types';

interface EventActionsProps {
  event: DashboardEvent;
  onRefresh: () => void;
  type?: 'professional' | 'community';
}

const iconClass = 'w-5 h-5';

export const EventActions: React.FC<EventActionsProps> = ({
  event,
  onRefresh,
  type = 'professional',
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    navigate(`/events/${event.id}/edit`);
  };

  const handleViewStats = () => {
    navigate(`/dashboard/events/${event.id}/stats`);
  };

  const handleViewParticipants = () => {
    navigate(`/dashboard/events/${event.id}/participants`);
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }
    setLoading(true);
    try {
      await eventService.deleteEvent(event.id);
      onRefresh();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const btnBase =
    'p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50';

  return (
    <div className="flex items-center justify-center gap-1" role="group" aria-label="Actions">
      {type === 'professional' ? (
        <button
          type="button"
          onClick={handleViewStats}
          className={`${btnBase} text-gray-600 hover:bg-blue-50 hover:text-blue-600`}
          title="Voir statistiques"
          aria-label="Voir les statistiques de l'événement"
        >
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleViewParticipants}
          className={`${btnBase} text-gray-600 hover:bg-blue-50 hover:text-blue-600`}
          title="Voir participants"
          aria-label="Voir les participants de l'événement"
        >
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={handleEdit}
        className={`${btnBase} text-gray-600 hover:bg-amber-50 hover:text-amber-700`}
        title="Modifier"
        aria-label="Modifier l'événement"
      >
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`${btnBase} text-gray-500 hover:bg-red-50 hover:text-red-600`}
        title="Supprimer"
        aria-label="Supprimer l'événement"
        aria-busy={loading}
      >
        {loading ? (
          <svg className={`${iconClass} animate-spin`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
};
