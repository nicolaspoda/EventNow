import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PendingRequestsList } from '../components/dashboard/PendingRequestsList';
import { participationService } from '../services/participationService';
import type { ParticipationRequest } from '../types/participation.types';

vi.mock('../services/participationService', () => ({
  participationService: {
    respond: vi.fn(),
  },
}));

function makeRequest(overrides: Partial<ParticipationRequest> = {}): ParticipationRequest {
  return {
    id: 'r1',
    eventId: 'e1',
    userId: 'u1',
    status: 'PENDING',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    event: { id: 'e1', title: 'Concert de jazz' },
    user: { id: 'u1', email: 'bob@example.com', username: 'bob' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderList(requests: ParticipationRequest[], onRefresh = vi.fn()) {
  return render(
    <MemoryRouter>
      <PendingRequestsList requests={requests} onRefresh={onRefresh} />
    </MemoryRouter>,
  );
}

describe('PendingRequestsList', () => {
  it('renders nothing when there are no requests', () => {
    const { container } = renderList([]);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the requester name, event title and message', () => {
    renderList([makeRequest({ message: 'Hâte d’y être !' })]);

    expect(screen.getByText('bob', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
    expect(screen.getByText('"Hâte d’y être !"')).toBeInTheDocument();
  });

  it('falls back to the email when the user has no username', () => {
    renderList([makeRequest({ user: { id: 'u1', email: 'carol@example.com' } })]);

    expect(screen.getByText('carol@example.com', { exact: false })).toBeInTheDocument();
  });

  it('falls back to "Un utilisateur" and "votre événement" when data is missing', () => {
    renderList([makeRequest({ user: undefined, event: undefined })]);

    expect(screen.getByText(/Un utilisateur/)).toBeInTheDocument();
    expect(screen.getByText(/votre événement/)).toBeInTheDocument();
  });

  it('links to the requester profile and the event page when ids are present', () => {
    renderList([makeRequest()]);

    expect(screen.getByRole('link', { name: 'bob' })).toHaveAttribute(
      'href',
      '/user/u1/profile',
    );
    expect(screen.getByRole('link', { name: 'Concert de jazz' })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('accepts a request and calls onRefresh', async () => {
    vi.mocked(participationService.respond).mockResolvedValue(undefined as never);
    const onRefresh = vi.fn();
    renderList([makeRequest()], onRefresh);

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    await waitFor(() => expect(participationService.respond).toHaveBeenCalledWith('r1', 'ACCEPT'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('refuses a request and calls onRefresh', async () => {
    vi.mocked(participationService.respond).mockResolvedValue(undefined as never);
    const onRefresh = vi.fn();
    renderList([makeRequest()], onRefresh);

    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    await waitFor(() => expect(participationService.respond).toHaveBeenCalledWith('r1', 'REFUSE'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows an alert with the backend message when responding fails', async () => {
    vi.mocked(participationService.respond).mockRejectedValue({
      response: { data: { message: 'Demande déjà traitée' } },
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderList([makeRequest()]);

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Demande déjà traitée'));
  });
});
