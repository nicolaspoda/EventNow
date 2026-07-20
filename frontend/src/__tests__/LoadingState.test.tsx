import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingState from '../components/ui/LoadingState';

describe('LoadingState', () => {
  it('shows the default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('shows a custom message when provided', () => {
    render(<LoadingState message="Chargement des événements..." />);
    expect(screen.getByText('Chargement des événements...')).toBeInTheDocument();
    expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
  });

  it('exposes a polite status role for screen readers', () => {
    render(<LoadingState message="Patientez" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Patientez');
  });
});
