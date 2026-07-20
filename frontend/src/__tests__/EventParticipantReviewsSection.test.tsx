import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventParticipantReviewsSection } from '../components/events/EventParticipantReviewsSection';
import { participantReviewService } from '../services/participantReviewService';
import type { ParticipantForReview } from '../services/participantReviewService';

vi.mock('../services/participantReviewService', async () => {
  const actual = await vi.importActual<typeof import('../services/participantReviewService')>(
    '../services/participantReviewService',
  );
  return {
    ...actual,
    participantReviewService: {
      getParticipantsForEvent: vi.fn(),
      createReview: vi.fn(),
    },
  };
});

const pastEventDate = '2020-01-01T00:00:00.000Z';
const futureEventDate = '2999-01-01T00:00:00.000Z';

function makeParticipant(overrides: Partial<ParticipantForReview> = {}): ParticipantForReview {
  return {
    id: 'p1',
    email: 'bob@example.com',
    username: 'bob',
    hasReview: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderSection(props: Partial<React.ComponentProps<typeof EventParticipantReviewsSection>> = {}) {
  return render(
    <MemoryRouter>
      <EventParticipantReviewsSection eventId="e1" eventDate={pastEventDate} {...props} />
    </MemoryRouter>,
  );
}

describe('EventParticipantReviewsSection', () => {
  it('shows the section title by default', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([]);

    renderSection();

    expect(screen.getByRole('heading', { name: 'Participants' })).toBeInTheDocument();
  });

  it('hides the title when hideTitle is true', () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([]);

    renderSection({ hideTitle: true });

    expect(screen.queryByRole('heading', { name: 'Participants' })).not.toBeInTheDocument();
  });

  it('shows an empty-state message when there are no participants', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([]);

    renderSection();

    expect(
      await screen.findByText('Aucun participant accepté pour le moment.'),
    ).toBeInTheDocument();
  });

  it('falls back to no participants when the request fails', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockRejectedValue(new Error('boom'));

    renderSection();

    expect(
      await screen.findByText('Aucun participant accepté pour le moment.'),
    ).toBeInTheDocument();
  });

  it('displays the username, falling back to the email prefix when absent', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant({ id: 'p1', username: 'bob' }),
      makeParticipant({ id: 'p2', username: null, email: 'carol@example.com' }),
    ]);

    renderSection();

    expect(await screen.findByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
  });

  it('shows an existing review instead of a "leave a review" button', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant({
        hasReview: true,
        review: { id: 'r1', rating: 4, comment: 'Sympa !' } as ParticipantForReview['review'],
      }),
    ]);

    renderSection();

    expect(await screen.findByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Sympa !')).toBeInTheDocument();
    expect(screen.queryByText('Laisser une note et un avis')).not.toBeInTheDocument();
  });

  it('does not offer to leave a review before the event date', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);

    renderSection({ eventDate: futureEventDate });

    await screen.findByText('bob');
    expect(screen.queryByText('Laisser une note et un avis')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Les avis entre participants seront disponibles après la date de l'événement.",
      ),
    ).toBeInTheDocument();
  });

  it('opens the review form and submits a rating and comment', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);
    vi.mocked(participantReviewService.createReview).mockResolvedValue({} as never);

    renderSection();
    await screen.findByText('bob');

    fireEvent.click(screen.getByText('Laisser une note et un avis'));
    fireEvent.change(screen.getByPlaceholderText('Votre avis sur ce participant...'), {
      target: { value: 'Très sympa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    await waitFor(() =>
      expect(participantReviewService.createReview).toHaveBeenCalledWith({
        eventId: 'e1',
        participantId: 'p1',
        rating: 5,
        comment: 'Très sympa',
      }),
    );
  });

  it('shows an alert with the backend message when submitting a review fails', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);
    vi.mocked(participantReviewService.createReview).mockRejectedValue({
      response: { data: { message: 'Vous avez déjà noté ce participant' } },
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderSection();
    await screen.findByText('bob');

    fireEvent.click(screen.getByText('Laisser une note et un avis'));
    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Vous avez déjà noté ce participant'),
    );
  });

  it('cancels the review form without submitting', async () => {
    vi.mocked(participantReviewService.getParticipantsForEvent).mockResolvedValue([
      makeParticipant(),
    ]);

    renderSection();
    await screen.findByText('bob');

    fireEvent.click(screen.getByText('Laisser une note et un avis'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(participantReviewService.createReview).not.toHaveBeenCalled();
    expect(screen.getByText('Laisser une note et un avis')).toBeInTheDocument();
  });
});
