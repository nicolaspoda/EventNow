import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventPollsTab from '../components/events/EventPollsTab';
import { pollsService } from '../services/pollsService';
import { socketService } from '../services/socketService';
import type { Poll } from '../services/pollsService';

vi.mock('../services/pollsService', () => ({
  pollsService: {
    getEventPolls: vi.fn(),
    createPoll: vi.fn(),
    vote: vi.fn(),
    changeVote: vi.fn(),
    closePoll: vi.fn(),
    deletePoll: vi.fn(),
  },
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    isConnected: vi.fn(),
    connect: vi.fn(),
    joinEventRoom: vi.fn(),
    leaveEventRoom: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

function makePoll(overrides: Partial<Poll> = {}): Poll {
  return {
    id: 'p1',
    eventId: 'e1',
    createdById: 'organizer-1',
    question: 'Quel plat préférez-vous ?',
    description: null,
    status: 'OPEN',
    multipleChoice: false,
    closesAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    options: [
      { id: 'o1', text: 'Pizza', order: 0, voteCount: 0 },
      { id: 'o2', text: 'Sushi', order: 1, voteCount: 0 },
    ],
    hasVoted: false,
    myVotes: [],
    totalVotes: 0,
    isCreatedByMe: false,
    isClosed: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(socketService.isConnected).mockReturnValue(true);
  vi.mocked(socketService.joinEventRoom).mockResolvedValue(undefined);
});

function renderTab(props: Partial<React.ComponentProps<typeof EventPollsTab>> = {}) {
  return render(
    <EventPollsTab eventId="e1" currentUserId="user-1" isOrganizer={false} {...props} />,
  );
}

describe('EventPollsTab', () => {
  it('shows a loading state before the polls arrive', () => {
    vi.mocked(pollsService.getEventPolls).mockReturnValue(new Promise(() => {}));

    renderTab();

    expect(screen.getByLabelText('Chargement...')).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    vi.mocked(pollsService.getEventPolls).mockRejectedValue(new Error('boom'));

    renderTab();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erreur lors du chargement des sondages',
    );
  });

  it('shows an empty state when there are no polls', async () => {
    vi.mocked(pollsService.getEventPolls).mockResolvedValue([]);

    renderTab();

    expect(await screen.findByText("Aucun sondage pour l'instant.")).toBeInTheDocument();
  });

  it('renders the poll list and the count of open polls', async () => {
    vi.mocked(pollsService.getEventPolls).mockResolvedValue([
      makePoll({ id: 'p1', isClosed: false }),
      makePoll({ id: 'p2', isClosed: true }),
    ]);

    renderTab();

    expect(await screen.findAllByText('Quel plat préférez-vous ?')).toHaveLength(2);
    expect(screen.getByText('1 ouvert')).toBeInTheDocument();
  });

  it('opens the create-poll modal, submits it, and shows the new poll without duplicating it', async () => {
    vi.mocked(pollsService.getEventPolls).mockResolvedValue([]);
    const created = makePoll({ id: 'p-new', question: 'Nouveau sondage ?' });
    vi.mocked(pollsService.createPoll).mockResolvedValue(created);

    renderTab();
    await screen.findByText("Aucun sondage pour l'instant.");

    fireEvent.click(screen.getByRole('button', { name: 'Créer un sondage' }));
    fireEvent.change(screen.getByLabelText(/Question/), {
      target: { value: 'Nouveau sondage ?' },
    });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le sondage' }));

    await waitFor(() => expect(pollsService.createPoll).toHaveBeenCalled());
    expect(await screen.findByText('Nouveau sondage ?')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates a poll in place when it is voted on', async () => {
    vi.mocked(pollsService.getEventPolls).mockResolvedValue([makePoll()]);
    vi.mocked(pollsService.vote).mockResolvedValue(
      makePoll({ hasVoted: true, myVotes: ['o1'], totalVotes: 1, options: [
        { id: 'o1', text: 'Pizza', order: 0, voteCount: 1 },
        { id: 'o2', text: 'Sushi', order: 1, voteCount: 0 },
      ] }),
    );

    renderTab();
    await screen.findByText('Quel plat préférez-vous ?');

    fireEvent.click(screen.getByText('Pizza'));
    fireEvent.click(screen.getByRole('button', { name: 'Voter' }));

    await waitFor(() => expect(screen.getByText('1 · 100%')).toBeInTheDocument());
  });

  it('removes a poll from the list when it is deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(pollsService.getEventPolls).mockResolvedValue([
      makePoll({ isCreatedByMe: true }),
    ]);
    vi.mocked(pollsService.deletePoll).mockResolvedValue(undefined);

    renderTab();
    await screen.findByText('Quel plat préférez-vous ?');

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le sondage' }));

    await waitFor(() =>
      expect(screen.queryByText('Quel plat préférez-vous ?')).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Aucun sondage pour l'instant.")).toBeInTheDocument();
  });

  it('joins the socket event room on mount and leaves it on unmount', async () => {
    vi.mocked(pollsService.getEventPolls).mockResolvedValue([]);

    const { unmount } = renderTab();
    await waitFor(() => expect(socketService.joinEventRoom).toHaveBeenCalledWith('e1'));

    unmount();

    expect(socketService.leaveEventRoom).toHaveBeenCalledWith('e1');
    expect(socketService.off).toHaveBeenCalledWith('pollCreated', expect.any(Function));
  });
});
