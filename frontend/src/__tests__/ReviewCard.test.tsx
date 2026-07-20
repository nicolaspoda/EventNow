import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReviewCard } from '../components/reviews/ReviewCard';

const review = {
  id: 'r1',
  rating: 4,
  comment: 'Super événement !',
  createdAt: '2026-03-15T00:00:00.000Z',
  user: { email: 'alice@example.com' },
};

describe('ReviewCard', () => {
  it('renders the reviewer email, formatted date and comment', () => {
    render(<ReviewCard review={review} />);

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('15 mars 2026')).toBeInTheDocument();
    expect(screen.getByText('Super événement !')).toBeInTheDocument();
  });

  it('renders no comment paragraph when the comment is null', () => {
    render(<ReviewCard review={{ ...review, comment: null }} />);

    expect(screen.queryByText('Super événement !')).not.toBeInTheDocument();
  });

  it('renders the rating as readonly stars', () => {
    render(<ReviewCard review={review} />);

    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('does not render edit or delete actions when isOwner is false', () => {
    render(<ReviewCard review={review} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.queryByText('Modifier')).not.toBeInTheDocument();
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
  });

  it('renders edit and delete actions when isOwner is true and calls the handlers', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ReviewCard review={review} isOwner onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Modifier'));
    fireEvent.click(screen.getByText('Supprimer'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders only the actions whose handler was provided', () => {
    render(<ReviewCard review={review} isOwner onEdit={vi.fn()} />);

    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
  });
});
