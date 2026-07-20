import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Logo } from '../components/Logo';

describe('Logo', () => {
  it('renders as a heading with the EventNow title in the auth variant', () => {
    render(<Logo variant="auth" />);
    expect(screen.getByRole('heading', { name: 'EventNow' })).toBeInTheDocument();
  });

  it('renders as a link to /events with an accessible name in the nav variant', () => {
    render(
      <MemoryRouter>
        <Logo variant="nav" />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /EventNow/ });
    expect(link).toHaveAttribute('href', '/events');
    expect(screen.getByText('EventNow')).toBeInTheDocument();
  });

  it('hides the text when showText is false', () => {
    render(
      <MemoryRouter>
        <Logo variant="nav" showText={false} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('EventNow')).not.toBeInTheDocument();
    expect(screen.getByLabelText('EventNow — Accueil')).toBeInTheDocument();
  });
});
