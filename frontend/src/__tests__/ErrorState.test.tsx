import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorState from '../components/ui/ErrorState';

describe('ErrorState', () => {
  it('renders the default title with the given message', () => {
    render(<ErrorState message="Impossible de charger les données" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText('Impossible de charger les données')).toBeInTheDocument();
  });

  it('renders a custom title when provided', () => {
    render(<ErrorState title="Panne réseau" message="Réessayez plus tard" />);

    expect(screen.getByText('Panne réseau')).toBeInTheDocument();
  });

  it('does not render a retry button when onRetry is not provided', () => {
    render(<ErrorState message="Erreur" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a retry button that calls onRetry when clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Erreur" onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: 'Réessayer' });
    fireEvent.click(button);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses a custom retry label when provided', () => {
    render(<ErrorState message="Erreur" onRetry={vi.fn()} retryLabel="Recharger" />);

    expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument();
  });
});
