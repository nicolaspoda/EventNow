import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { reviewService } from '../services/reviewService';

vi.mock('../services/reviewService', () => ({
  reviewService: {
    createReview: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReviewForm', () => {
  it('disables the submit button until a rating is selected', () => {
    render(<ReviewForm eventId="e1" onSuccess={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Publier mon avis' })).toBeDisabled();
  });

  it('shows an error and does not submit when no rating is selected', () => {
    render(<ReviewForm eventId="e1" onSuccess={vi.fn()} />);

    const form = screen.getByRole('button', { name: 'Publier mon avis' }).closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('Veuillez sélectionner une note')).toBeInTheDocument();
    expect(reviewService.createReview).not.toHaveBeenCalled();
  });

  it('submits the selected rating and comment, then calls onSuccess and resets the form', async () => {
    vi.mocked(reviewService.createReview).mockResolvedValue({} as never);
    const onSuccess = vi.fn();
    render(<ReviewForm eventId="e1" onSuccess={onSuccess} />);

    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[3]);
    fireEvent.change(screen.getByLabelText('Votre avis (optionnel)'), {
      target: { value: 'Très bon événement' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publier mon avis' }));

    await waitFor(() => expect(reviewService.createReview).toHaveBeenCalledWith('e1', {
      rating: 4,
      comment: 'Très bon événement',
    }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the submission fails', async () => {
    vi.mocked(reviewService.createReview).mockRejectedValue(new Error('network error'));
    render(<ReviewForm eventId="e1" onSuccess={vi.fn()} />);

    const stars = screen.getAllByRole('button').slice(0, 5);
    fireEvent.click(stars[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Publier mon avis' }));

    expect(await screen.findByText("Erreur lors de la création de l'avis")).toBeInTheDocument();
  });

  it('updates the remaining character counter as the comment changes', () => {
    render(<ReviewForm eventId="e1" onSuccess={vi.fn()} />);

    expect(screen.getByText('0/1000 caractères')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Votre avis (optionnel)'), {
      target: { value: 'abcde' },
    });

    expect(screen.getByText('5/1000 caractères')).toBeInTheDocument();
  });
});
