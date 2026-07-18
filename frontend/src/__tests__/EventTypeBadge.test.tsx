import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventTypeBadge from '../components/events/EventTypeBadge';

describe('EventTypeBadge', () => {
  it('renders "Communautaire" for a COMMUNITY event', () => {
    render(<EventTypeBadge type="COMMUNITY" />);
    expect(screen.getByText('Communautaire')).toBeInTheDocument();
  });

  it('renders "Professionnel" for a non-COMMUNITY event', () => {
    render(<EventTypeBadge type="PROFESSIONAL" />);
    expect(screen.getByText('Professionnel')).toBeInTheDocument();
  });
});
