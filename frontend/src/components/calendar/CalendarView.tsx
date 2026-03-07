import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ParticipatedEvent } from '../../types/dashboard.types';
import './calendar.css';

type CalendarViewType = 'month' | 'week' | 'work_week' | 'day' | 'agenda';

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ParticipatedEvent;
}

interface CalendarViewProps {
  events: ParticipatedEvent[];
  onSelectEvent?: (event: ParticipatedEvent) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onSelectEvent }) => {
  const [view, setView] = React.useState<CalendarViewType>('month');
  const [date, setDate] = React.useState(new Date());

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => {
      const eventDate = new Date(event.eventDate);
      return {
        id: event.id,
        title: event.title,
        start: eventDate,
        end: eventDate,
        resource: event,
      };
    });
  }, [events]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const isPast = event.resource.isPast;
    const isTicket = event.resource.participationType === 'TICKET';

    let backgroundColor = '#6366f1';
    let borderColor = '#4f46e5';

    if (isPast) {
      backgroundColor = '#9ca3af';
      borderColor = '#6b7280';
    } else if (isTicket) {
      backgroundColor = '#10b981';
      borderColor = '#059669';
    } else {
      backgroundColor = '#f59e0b';
      borderColor = '#d97706';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '6px',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: '500',
        padding: '2px 6px',
      },
    };
  };

  const messages = {
    allDay: 'Toute la journée',
    previous: 'Précédent',
    next: 'Suivant',
    today: "Aujourd'hui",
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Heure',
    event: 'Événement',
    noEventsInRange: 'Aucun événement dans cette période.',
    showMore: (total: number) => `+ ${total} événement(s) supplémentaire(s)`,
  };

  return (
    <div className="calendar-container bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#10b981] border-2 border-[#059669]"></div>
            <span className="text-neutral-700 dark:text-neutral-300">Avec billets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#f59e0b] border-2 border-[#d97706]"></div>
            <span className="text-neutral-700 dark:text-neutral-300">Communautaires</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#9ca3af] border-2 border-[#6b7280]"></div>
            <span className="text-neutral-700 dark:text-neutral-300">Passés</span>
          </div>
        </div>
      </div>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        messages={messages}
        culture="fr"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          if (onSelectEvent) {
            onSelectEvent(event.resource);
          }
        }}
      />
    </div>
  );
};

export default CalendarView;
