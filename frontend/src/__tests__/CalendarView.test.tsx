import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '../components/calendar/CalendarView';
import type { ParticipatedEvent } from '../types/dashboard.types';

function makeEvent(overrides: Partial<ParticipatedEvent> = {}): ParticipatedEvent {
  const today = new Date();
  const todayIso = new Date(today.getFullYear(), today.getMonth(), 15, 20, 0).toISOString();
  return {
    id: 'e1',
    title: 'Concert de jazz',
    eventDate: todayIso,
    location: 'Paris',
    type: 'PROFESSIONAL',
    category: 'CONCERT' as never,
    participationType: 'TICKET',
    ticketCount: 1,
    categoryName: 'Standard',
    isPast: false,
    ...overrides,
  } as ParticipatedEvent;
}

describe('CalendarView', () => {
  it('renders the calendar legend', () => {
    render(<CalendarView events={[]} />);

    expect(screen.getByText('Avec billets')).toBeInTheDocument();
    expect(screen.getByText('Communautaires')).toBeInTheDocument();
    expect(screen.getByText('Organisés')).toBeInTheDocument();
    expect(screen.getByText('Passés')).toBeInTheDocument();
  });

  it('renders the event title on the calendar', () => {
    render(<CalendarView events={[makeEvent()]} />);

    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
  });

  it('shows the French "no events" message when there are none in view', () => {
    render(<CalendarView events={[]} />);

    expect(screen.getAllByText("Aujourd'hui").length).toBeGreaterThan(0);
  });

  it('calls onSelectEvent with the underlying event when an event is clicked', () => {
    const onSelectEvent = vi.fn();
    render(<CalendarView events={[makeEvent()]} onSelectEvent={onSelectEvent} />);

    fireEvent.click(screen.getByText('Concert de jazz'));

    expect(onSelectEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });

  function eventBackgroundColor(title: string): string {
    const el = screen.getByText(title).closest('.rbc-event') as HTMLElement;
    return el.style.backgroundColor;
  }

  it('styles a past event in grey regardless of participation type', () => {
    render(<CalendarView events={[makeEvent({ isPast: true, participationType: 'TICKET' })]} />);

    expect(eventBackgroundColor('Concert de jazz')).toBe('rgb(156, 163, 175)');
  });

  it('styles an organizer event in indigo', () => {
    render(
      <CalendarView
        events={[makeEvent({ isPast: false, participationType: 'ORGANIZER' })]}
      />,
    );

    expect(eventBackgroundColor('Concert de jazz')).toBe('rgb(99, 102, 241)');
  });

  it('styles a community participation event in amber', () => {
    render(
      <CalendarView
        events={[makeEvent({ isPast: false, participationType: 'PARTICIPATION' })]}
      />,
    );

    expect(eventBackgroundColor('Concert de jazz')).toBe('rgb(245, 158, 11)');
  });
});
