import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffInvitationsPage } from '../pages/StaffInvitationsPage';
import { staffInvitationsService } from '../services/staffInvitationsService';
import { dashboardService } from '../services/dashboardService';
import type { StaffInvitation } from '../services/staffInvitationsService';
import type { DashboardEvent } from '../types/dashboard.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/staffInvitationsService', () => ({
  staffInvitationsService: {
    getMyInvitations: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getOrganizerEvents: vi.fn(),
  },
}));

function makeEvent(overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return {
    id: 'e1',
    title: 'Concert de jazz',
    location: 'Paris',
    eventDate: '2026-06-15T20:00:00.000Z',
    organizerId: 'org1',
    type: 'PROFESSIONAL',
    createdAt: '',
    updatedAt: '',
    ticketCategories: [],
    stats: {} as DashboardEvent['stats'],
    ...overrides,
  };
}

function makeInvitation(overrides: Partial<StaffInvitation> = {}): StaffInvitation {
  return {
    id: 'inv1',
    email: 'staff@example.com',
    token: 'tok',
    status: 'PENDING' as never,
    expiresAt: '2026-12-31T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    event: { id: 'e1', title: 'Concert de jazz', eventDate: '2026-06-15T20:00:00.000Z' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <StaffInvitationsPage />
    </MemoryRouter>,
  );
}

describe('StaffInvitationsPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockReturnValue(new Promise(() => {}));
    vi.mocked(staffInvitationsService.getMyInvitations).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('shows an error banner with a retry action when loading fails', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockRejectedValue(new Error('boom'));
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Impossible de charger les données')).toBeInTheDocument();
  });
});

describe('StaffInvitationsPage - form', () => {
  it('shows an empty-invitations message and disables the form without organizer events', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune invitation pour le moment.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inviter' })).toBeDisabled();
  });

  it('pre-selects the first organizer event and submits a new invitation', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([makeEvent()]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([]);
    vi.mocked(staffInvitationsService.create).mockResolvedValue(makeInvitation());

    renderPage();
    await screen.findByLabelText('Événement concerné');

    expect(screen.getByLabelText('Événement concerné')).toHaveValue('e1');

    fireEvent.change(screen.getByLabelText('Adresse email de la personne à inviter'), {
      target: { value: 'staff@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inviter' }));

    await waitFor(() =>
      expect(staffInvitationsService.create).toHaveBeenCalledWith('staff@example.com', 'e1'),
    );
    expect(
      await screen.findByText('Invitation envoyée. La personne recevra une notification et pourra accepter ou refuser depuis sa cloche de notifications.'),
    ).toBeInTheDocument();
  });

  it('shows an error when sending the invitation fails', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([makeEvent()]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([]);
    vi.mocked(staffInvitationsService.create).mockRejectedValue({
      response: { data: { message: 'Utilisateur introuvable' } },
    });

    renderPage();
    await screen.findByLabelText('Événement concerné');
    fireEvent.change(screen.getByLabelText('Adresse email de la personne à inviter'), {
      target: { value: 'nobody@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Inviter' }));

    expect(await screen.findByText('Utilisateur introuvable')).toBeInTheDocument();
  });
});

describe('StaffInvitationsPage - invitation list', () => {
  it('lists sent invitations with their status and event', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([makeEvent()]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([makeInvitation()]);

    renderPage();

    expect(await screen.findByText('staff@example.com')).toBeInTheDocument();
    expect(screen.getByText(/En attente/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Annuler l'invitation" })).toBeInTheDocument();
  });

  it('shows who accepted an accepted invitation, without a cancel button', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([makeEvent()]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([
      makeInvitation({
        status: 'ACCEPTED' as never,
        acceptedBy: { id: 'u2', email: 'bob@example.com', username: 'bob' } as never,
      }),
    ]);

    renderPage();

    expect(await screen.findByText(/Acceptée par bob/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Annuler l'invitation" })).not.toBeInTheDocument();
  });

  it('cancels a pending invitation after confirmation', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([makeEvent()]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([makeInvitation()]);
    vi.mocked(staffInvitationsService.cancel).mockResolvedValue({ message: 'ok' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Annuler l'invitation" }));

    await waitFor(() => expect(staffInvitationsService.cancel).toHaveBeenCalledWith('inv1'));
  });

  it('does not cancel when the confirmation dialog is dismissed', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([makeEvent()]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([makeInvitation()]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Annuler l'invitation" }));

    expect(staffInvitationsService.cancel).not.toHaveBeenCalled();
  });

  it('navigates back to the organizer dashboard', async () => {
    vi.mocked(dashboardService.getOrganizerEvents).mockResolvedValue([]);
    vi.mocked(staffInvitationsService.getMyInvitations).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: '← Retour au tableau de bord' }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/organizer');
  });
});
