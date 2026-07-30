import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PollCard from '../components/events/PollCard';
import { pollsService } from '../services/pollsService';
import type { Poll } from '../services/pollsService';

vi.mock('../services/pollsService', () => ({
  pollsService: {
    vote: vi.fn(),
    changeVote: vi.fn(),
    closePoll: vi.fn(),
    deletePoll: vi.fn(),
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
      { id: 'o1', text: 'Pizza', order: 0, voteCount: 2 },
      { id: 'o2', text: 'Sushi', order: 1, voteCount: 1 },
    ],
    hasVoted: false,
    myVotes: [],
    totalVotes: 3,
    isCreatedByMe: false,
    isClosed: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderCard(props: Partial<React.ComponentProps<typeof PollCard>> = {}) {
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const utils = render(
    <PollCard
      poll={makePoll()}
      currentUserId="user-1"
      eventId="e1"
      isOrganizer={false}
      onUpdate={onUpdate}
      onDelete={onDelete}
      {...props}
    />,
  );
  return { ...utils, onUpdate, onDelete };
}

describe('PollCard - voting', () => {
  it('shows the poll question and options when the user has not voted', () => {
    renderCard();

    expect(screen.getByText('Quel plat préférez-vous ?')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Sushi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voter' })).toBeDisabled();
  });

  it('selects an option then submits the vote', async () => {
    const updatedPoll = makePoll({ hasVoted: true, myVotes: ['o1'] });
    vi.mocked(pollsService.vote).mockResolvedValue(updatedPoll);
    const { onUpdate } = renderCard();

    fireEvent.click(screen.getByText('Pizza'));
    expect(screen.getByRole('button', { name: 'Voter' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Voter' }));

    await waitFor(() =>
      expect(pollsService.vote).toHaveBeenCalledWith('e1', 'p1', { optionIds: ['o1'] }),
    );
    expect(onUpdate).toHaveBeenCalledWith(updatedPoll);
  });

  it('shows an error message when voting fails', async () => {
    vi.mocked(pollsService.vote).mockRejectedValue(new Error('boom'));
    renderCard();

    fireEvent.click(screen.getByText('Pizza'));
    fireEvent.click(screen.getByRole('button', { name: 'Voter' }));

    expect(await screen.findByText('Erreur lors du vote')).toBeInTheDocument();
  });

  it('allows selecting multiple options for a multiple-choice poll', () => {
    renderCard({ poll: makePoll({ multipleChoice: true }) });

    fireEvent.click(screen.getByText('Pizza'));
    fireEvent.click(screen.getByText('Sushi'));

    expect(screen.getByRole('button', { name: 'Voter' })).not.toBeDisabled();
  });
});

describe('PollCard - results', () => {
  it('shows results with percentages once the user has voted', () => {
    renderCard({ poll: makePoll({ hasVoted: true, myVotes: ['o1'] }) });

    expect(screen.getByText('2 · 67%')).toBeInTheDocument();
    expect(screen.getByText('1 · 33%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voter' })).not.toBeInTheDocument();
  });

  it('lets a voter change their vote', async () => {
    const updated = makePoll({ hasVoted: true, myVotes: ['o2'] });
    vi.mocked(pollsService.changeVote).mockResolvedValue(updated);
    const { onUpdate } = renderCard({ poll: makePoll({ hasVoted: true, myVotes: ['o1'] }) });

    fireEvent.click(screen.getByText('Modifier mon vote'));
    fireEvent.click(screen.getByText('Sushi'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    await waitFor(() =>
      expect(pollsService.changeVote).toHaveBeenCalledWith('e1', 'p1', { optionIds: ['o2'] }),
    );
    expect(onUpdate).toHaveBeenCalledWith(updated);
  });

  it('cancels the vote-change flow without calling the service', () => {
    renderCard({ poll: makePoll({ hasVoted: true, myVotes: ['o1'] }) });

    fireEvent.click(screen.getByText('Modifier mon vote'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(pollsService.changeVote).not.toHaveBeenCalled();
    expect(screen.getByText('Modifier mon vote')).toBeInTheDocument();
  });
});

describe('PollCard - management', () => {
  it('does not show manage actions for a non-owner, non-organizer', () => {
    renderCard({ poll: makePoll({ isCreatedByMe: false }), isOrganizer: false });

    expect(screen.queryByRole('button', { name: 'Fermer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer le sondage' })).not.toBeInTheDocument();
  });

  it('shows manage actions for the poll creator and closes the poll', async () => {
    const closed = makePoll({ isCreatedByMe: true, isClosed: true });
    vi.mocked(pollsService.closePoll).mockResolvedValue(closed);
    const { onUpdate } = renderCard({ poll: makePoll({ isCreatedByMe: true }) });

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    await waitFor(() => expect(pollsService.closePoll).toHaveBeenCalledWith('e1', 'p1'));
    expect(onUpdate).toHaveBeenCalledWith(closed);
  });

  it('shows manage actions for the organizer and deletes the poll after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(pollsService.deletePoll).mockResolvedValue(undefined);
    const { onDelete } = renderCard({ isOrganizer: true });

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le sondage' }));

    await waitFor(() => expect(pollsService.deletePoll).toHaveBeenCalledWith('e1', 'p1'));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('does not delete when the confirmation dialog is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { onDelete } = renderCard({ isOrganizer: true });

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le sondage' }));

    expect(pollsService.deletePoll).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('does not show a close button for an already-closed poll', () => {
    renderCard({ poll: makePoll({ isCreatedByMe: true, isClosed: true, hasVoted: true }) });

    expect(screen.queryByRole('button', { name: 'Fermer' })).not.toBeInTheDocument();
    expect(screen.getByText('Fermé')).toBeInTheDocument();
  });
});
