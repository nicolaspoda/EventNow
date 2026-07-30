import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventStatusBadge } from '../components/events/EventStatusBadge';

describe('EventStatusBadge', () => {
  it('renders the ONGOING status', () => {
    render(<EventStatusBadge status="ONGOING" />);
    expect(screen.getByRole('status', { name: 'Statut: En cours' })).toBeInTheDocument();
  });

  it('renders the CANCELLED status', () => {
    render(<EventStatusBadge status="CANCELLED" />);
    expect(screen.getByRole('status', { name: 'Statut: Annulé' })).toBeInTheDocument();
  });

  it('falls back to ON_SALE for an unknown status', () => {
    render(<EventStatusBadge status="NOT_A_REAL_STATUS" />);
    expect(screen.getByRole('status', { name: 'Statut: En vente' })).toBeInTheDocument();
  });
});
