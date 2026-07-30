import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreatePollModal from '../components/events/CreatePollModal';
import { pollsService } from '../services/pollsService';
import type { Poll } from '../services/pollsService';

vi.mock('../services/pollsService', () => ({
  pollsService: {
    createPoll: vi.fn(),
  },
}));

const poll: Poll = {
  id: 'p1',
  eventId: 'e1',
  createdById: 'u1',
  question: 'Quel plat ?',
  description: null,
  status: 'OPEN',
  multipleChoice: false,
  closesAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  options: [],
  hasVoted: false,
  myVotes: [],
  totalVotes: 0,
  isCreatedByMe: true,
  isClosed: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

function fillTwoOptions(a: string, b: string) {
  fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: a } });
  fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: b } });
}

describe('CreatePollModal', () => {
  it('starts with 2 empty options and the submit button disabled', () => {
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer le sondage' })).toBeDisabled();
  });

  it('enables submit once the question reaches 5 characters', () => {
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: 'Quel' } });
    expect(screen.getByRole('button', { name: 'Créer le sondage' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: 'Quel plat ?' } });
    expect(screen.getByRole('button', { name: 'Créer le sondage' })).not.toBeDisabled();
  });

  it('adds and removes options, respecting the 2-option minimum and 10-option maximum', () => {
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(
      screen.getAllByLabelText(/Supprimer l'option/).every((btn) => (btn as HTMLButtonElement).disabled),
    ).toBe(true);

    fireEvent.click(screen.getByText('+ Ajouter une option'));
    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Supprimer l'option 3"));
    expect(screen.queryByPlaceholderText('Option 3')).not.toBeInTheDocument();
  });

  it('reorders an option with the move-down control', () => {
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    fillTwoOptions('Pizza', 'Sushi');
    fireEvent.click(screen.getAllByLabelText('Déplacer vers le bas')[0]);

    expect(screen.getByPlaceholderText('Option 1')).toHaveValue('Sushi');
    expect(screen.getByPlaceholderText('Option 2')).toHaveValue('Pizza');
  });

  it('shows an error and does not submit when fewer than 2 non-empty options are provided', () => {
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: 'Quel plat ?' } });
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Pizza' } });
    const form = screen.getByRole('button', { name: 'Créer le sondage' }).closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('Veuillez saisir au moins 2 options.')).toBeInTheDocument();
    expect(pollsService.createPoll).not.toHaveBeenCalled();
  });

  it('submits the trimmed question, description and options, then calls onCreate and onClose', async () => {
    vi.mocked(pollsService.createPoll).mockResolvedValue(poll);
    const onCreate = vi.fn();
    const onClose = vi.fn();
    render(<CreatePollModal eventId="e1" onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: '  Quel plat ?  ' } });
    fillTwoOptions('  Pizza  ', 'Sushi');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le sondage' }));

    await waitFor(() =>
      expect(pollsService.createPoll).toHaveBeenCalledWith('e1', {
        question: 'Quel plat ?',
        description: undefined,
        options: ['Pizza', 'Sushi'],
        multipleChoice: false,
        closesAt: undefined,
      }),
    );
    expect(onCreate).toHaveBeenCalledWith(poll);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles multiple choice and includes it in the submitted payload', async () => {
    vi.mocked(pollsService.createPoll).mockResolvedValue(poll);
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: 'Quel plat ?' } });
    fillTwoOptions('Pizza', 'Sushi');
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Créer le sondage' }));

    await waitFor(() =>
      expect(pollsService.createPoll).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({ multipleChoice: true }),
      ),
    );
  });

  it('shows an error message when creation fails', async () => {
    vi.mocked(pollsService.createPoll).mockRejectedValue(new Error('boom'));
    render(<CreatePollModal eventId="e1" onClose={vi.fn()} onCreate={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Question/), { target: { value: 'Quel plat ?' } });
    fillTwoOptions('Pizza', 'Sushi');
    fireEvent.click(screen.getByRole('button', { name: 'Créer le sondage' }));

    expect(await screen.findByText('Erreur lors de la création du sondage')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<CreatePollModal eventId="e1" onClose={onClose} onCreate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
