import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticipationRequestCard } from '../components/participation/ParticipationRequestCard';
import { participationService } from '../services/participationService';
import type { ParticipationRequest } from '../types/participation.types';

vi.mock('../services/participationService', () => ({
  participationService: {
    respond: vi.fn(),
  },
}));

vi.mock('../components/participation/UserRatingBadge', () => ({
  UserRatingBadge: () => <div data-testid="user-rating-badge" />,
}));

function makeRequest(overrides: Partial<ParticipationRequest> = {}): ParticipationRequest {
  return {
    id: 'r1',
    eventId: 'e1',
    userId: 'u1',
    status: 'PENDING',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    user: { id: 'u1', email: 'bob@example.com', username: 'bob' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderCard(props: Partial<React.ComponentProps<typeof ParticipationRequestCard>> = {}) {
  return render(
    <MemoryRouter>
      <ParticipationRequestCard request={makeRequest()} {...props} />
    </MemoryRouter>,
  );
}

describe('ParticipationRequestCard', () => {
  it('shows the requester name, formatted date and message', () => {
    renderCard({ request: makeRequest({ message: 'Hâte d’y être !' }) });

    expect(screen.getByRole('link', { name: 'bob' })).toHaveAttribute('href', '/user/u1/profile');
    expect(screen.getByText(/1 janvier 2026/)).toBeInTheDocument();
    expect(screen.getByText('Hâte d’y être !')).toBeInTheDocument();
  });

  it('falls back to the email when there is no username', () => {
    renderCard({ request: makeRequest({ user: { id: 'u1', email: 'carol@example.com' } }) });

    expect(screen.getByRole('link', { name: 'carol@example.com' })).toBeInTheDocument();
  });

  it('shows accept/refuse actions for a pending request', async () => {
    vi.mocked(participationService.respond).mockResolvedValue({} as never);
    const onRespond = vi.fn();
    renderCard({ onRespond });

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    await waitFor(() => expect(participationService.respond).toHaveBeenCalledWith('r1', 'ACCEPT'));
    expect(onRespond).toHaveBeenCalledTimes(1);
  });

  it('refuses a request', async () => {
    vi.mocked(participationService.respond).mockResolvedValue({} as never);
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    await waitFor(() => expect(participationService.respond).toHaveBeenCalledWith('r1', 'REFUSE'));
  });

  it('shows an error message when responding fails', async () => {
    vi.mocked(participationService.respond).mockRejectedValue(new Error('boom'));
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(await screen.findByText('Erreur lors de la réponse')).toBeInTheDocument();
  });

  it('shows the accepted status with the response date instead of action buttons', () => {
    renderCard({
      request: makeRequest({ status: 'ACCEPTED', respondedAt: '2026-01-02T00:00:00.000Z' }),
    });

    expect(screen.getByText('Acceptée')).toBeInTheDocument();
    expect(screen.getByText(/2 janvier 2026/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
  });

  it('shows the refused status', () => {
    renderCard({ request: makeRequest({ status: 'REFUSED' }) });

    expect(screen.getByText('Refusée')).toBeInTheDocument();
  });
});
