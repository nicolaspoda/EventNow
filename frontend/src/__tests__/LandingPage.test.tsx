import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import LandingPage from '../pages/LandingPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('shows the hero title and both hero call-to-action links', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: /Découvrez et réservez avec/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Explorer et réserver des événements/ }),
    ).toHaveAttribute('href', '/events');
    expect(
      screen.getByRole('link', { name: /Rejoindre la communauté/ }),
    ).toHaveAttribute('href', '/register');
  });

  it('shows the three feature cards', () => {
    renderPage();

    expect(screen.getByText('Suivez vos amis')).toBeInTheDocument();
    expect(screen.getByText('Billetterie simplifiée')).toBeInTheDocument();
    expect(screen.getByText('Découverte et recommandations')).toBeInTheDocument();
  });

  it('shows the bottom CTA banner links', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Créer mon compte' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: 'Voir les événements' })).toHaveAttribute(
      'href',
      '/events',
    );
  });
});
