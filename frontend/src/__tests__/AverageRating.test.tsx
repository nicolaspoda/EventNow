import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AverageRating } from '../components/reviews/AverageRating';

describe('AverageRating', () => {
  it('shows a placeholder message when there are no reviews', () => {
    render(<AverageRating average={0} totalReviews={0} />);
    expect(screen.getByText('Aucun avis pour le moment')).toBeInTheDocument();
  });

  it('renders the average rating and total review count', () => {
    render(<AverageRating average={4.2} totalReviews={12} />);
    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText('(12 avis)')).toBeInTheDocument();
  });

  it('treats a non-finite average as 0', () => {
    render(<AverageRating average={NaN} totalReviews={5} />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('floors and clamps a non-finite or negative totalReviews to 0', () => {
    render(<AverageRating average={3} totalReviews={NaN} />);
    expect(screen.getByText('Aucun avis pour le moment')).toBeInTheDocument();
  });

  it('floors a fractional totalReviews', () => {
    render(<AverageRating average={3} totalReviews={4.9} />);
    expect(screen.getByText('(4 avis)')).toBeInTheDocument();
  });

  it('clamps a negative totalReviews to 0', () => {
    render(<AverageRating average={3} totalReviews={-2} />);
    expect(screen.getByText('Aucun avis pour le moment')).toBeInTheDocument();
  });

  it('rounds the average when passed down to StarRating', () => {
    const { container } = render(<AverageRating average={3.6} totalReviews={1} />);
    const filled = Array.from(container.querySelectorAll('button')).filter((btn) =>
      btn.querySelector('span')?.className.includes('text-yellow-400'),
    );
    expect(filled).toHaveLength(4);
  });
});
