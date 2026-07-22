import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { ParticipatedEvent } from '../types/dashboard.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import CalendarView from '../components/calendar/CalendarView';

const MyCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ParticipatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getMyCalendarEvents();
      setEvents(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger vos événements'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: ParticipatedEvent) => {
    navigate(`/events/${event.id}`);
  };

  const upcomingEvents = events.filter((e) => !e.isPast);
  const pastEvents = events.filter((e) => e.isPast);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mon calendrier
          </h1>
          <LoadingState message="Chargement de votre calendrier..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mon calendrier
          </h1>
          <ErrorState message={error} onRetry={fetchEvents} />
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Mon calendrier
          </h1>
          <EmptyState
            icon={
              <svg
                className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            title="Aucun événement"
            message="Vous n'avez pas encore d'événements dans votre calendrier. Y figurent les événements que vous organisez, ceux pour lesquels vous avez des billets et les participations communautaires acceptées."
            actionLabel="Découvrir les événements"
            onAction={() => navigate('/events')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Mon calendrier
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {events.length} événement{events.length > 1 ? 's' : ''} au total
              {upcomingEvents.length > 0 && ` · ${upcomingEvents.length} à venir`}
              {pastEvents.length > 0 && ` · ${pastEvents.length} passé${pastEvents.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/my-upcoming-events')}>
              Vue liste
            </Button>
            <Button variant="ghost" onClick={() => navigate('/events')}>
              Découvrir plus
            </Button>
          </div>
        </div>

        <CalendarView events={events} onSelectEvent={handleSelectEvent} />
      </div>
    </div>
  );
};

export default MyCalendarPage;
