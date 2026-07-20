import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventActions } from '../components/events/EventActions';
import { eventService } from '../services/eventService';
import type { DashboardEvent } from '../types/dashboard.types';

vi.mock('../services/eventService', () => ({
  eventService: {
    deleteEvent: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const event: DashboardEvent = {
  id: 'e1',
  title: 'Concert',
  location: 'Paris',
  eventDate: '2026-01-01T00:00:00.000Z',
  organizerId: 'org1',
  type: 'PROFESSIONAL',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ticketCategories: [],
  stats: {} as DashboardEvent['stats'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderActions(props: Partial<React.ComponentProps<typeof EventActions>> = {}) {
  const onRefresh = vi.fn();
  const utils = render(
    <MemoryRouter>
      <EventActions event={event} onRefresh={onRefresh} {...props} />
    </MemoryRouter>,
  );
  return { ...utils, onRefresh };
}

describe('EventActions', () => {
  it('shows the stats button for professional events and navigates on click', () => {
    renderActions({ type: 'professional' });

    fireEvent.click(screen.getByRole('button', { name: "Voir les statistiques de l'événement" }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/events/e1/stats');
    expect(
      screen.queryByRole('button', { name: "Voir les participants de l'événement" }),
    ).not.toBeInTheDocument();
  });

  it('shows the participants button for community events and navigates on click', () => {
    renderActions({ type: 'community' });

    fireEvent.click(screen.getByRole('button', { name: "Voir les participants de l'événement" }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/events/e1/participants');
  });

  it('navigates to the edit page when the edit button is clicked', () => {
    renderActions();

    fireEvent.click(screen.getByRole('button', { name: "Modifier l'événement" }));

    expect(mockNavigate).toHaveBeenCalledWith('/events/e1/edit');
  });

  it('does nothing when delete is cancelled by the confirm dialog', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { onRefresh } = renderActions();

    fireEvent.click(screen.getByRole('button', { name: "Supprimer l'événement" }));

    expect(eventService.deleteEvent).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('deletes the event and calls onRefresh when delete is confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(eventService.deleteEvent).mockResolvedValue(undefined);
    const { onRefresh } = renderActions();

    fireEvent.click(screen.getByRole('button', { name: "Supprimer l'événement" }));

    await waitFor(() => expect(eventService.deleteEvent).toHaveBeenCalledWith('e1'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows an alert and does not call onRefresh when deletion fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(eventService.deleteEvent).mockRejectedValue(new Error('boom'));
    const { onRefresh } = renderActions();

    fireEvent.click(screen.getByRole('button', { name: "Supprimer l'événement" }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Erreur lors de la suppression'));
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
