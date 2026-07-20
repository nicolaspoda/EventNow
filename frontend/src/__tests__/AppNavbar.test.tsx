import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppNavbar } from '../components/AppNavbar';

describe('AppNavbar', () => {
  it('renders the logo and the desktop right content', () => {
    render(
      <MemoryRouter>
        <AppNavbar rightContent={<button>Connexion</button>} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('EventNow — Accueil')).toBeInTheDocument();
    expect(screen.getAllByText('Connexion')).toHaveLength(1);
  });

  it('hides the mobile panel by default', () => {
    render(
      <MemoryRouter>
        <AppNavbar rightContent={<button>Connexion</button>} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('navigation')).toHaveAttribute('aria-label', 'Navigation principale');
    expect(document.getElementById('mobile-nav-panel')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the mobile panel and shows a duplicated right content when the toggle is clicked', () => {
    render(
      <MemoryRouter>
        <AppNavbar rightContent={<button>Connexion</button>} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));

    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(document.getElementById('mobile-nav-panel')).toBeInTheDocument();
    expect(screen.getAllByText('Connexion')).toHaveLength(2);
  });

  it('closes the mobile panel when the toggle is clicked again', () => {
    render(
      <MemoryRouter>
        <AppNavbar rightContent={<button>Connexion</button>} />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }));

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(document.getElementById('mobile-nav-panel')).not.toBeInTheDocument();
  });

  it('renders right content that is not a valid React element as-is', () => {
    render(
      <MemoryRouter>
        <AppNavbar rightContent="Texte brut" />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Texte brut')).toHaveLength(1);
  });

  it('closes the mobile panel when the route changes while it is open', () => {
    render(
      <MemoryRouter initialEntries={['/a']}>
        <AppNavbar rightContent={<Link to="/b">Aller à b</Link>} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    expect(document.getElementById('mobile-nav-panel')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: 'Aller à b' })[0]);

    expect(document.getElementById('mobile-nav-panel')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
