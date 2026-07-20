import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { NavbarLinks } from '../components/NavbarLinks';
import { useAuth } from '../utils/useAuth';
import { useIsStaff } from '../hooks/useIsStaff';
import type { User } from '../types/auth';

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useIsStaff', () => ({
  useIsStaff: vi.fn(),
}));

vi.mock('../components/DarkModeToggle', () => ({
  DarkModeToggle: () => <div data-testid="dark-mode-toggle" />,
}));

vi.mock('../components/MessageBell', () => ({
  MessageBell: () => <div data-testid="message-bell" />,
}));

vi.mock('../components/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('../components/user/UserSearchAutocomplete', () => ({
  UserSearchAutocomplete: () => <div data-testid="user-search" />,
}));

function mockAuth(user: User | null) {
  vi.mocked(useAuth).mockReturnValue({
    user,
    isAuthenticated: !!user,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  });
}

function renderLinks() {
  return render(
    <MemoryRouter>
      <NavbarLinks />
    </MemoryRouter>,
  );
}

describe('NavbarLinks - unauthenticated', () => {
  it('shows login and register links but no authenticated content', () => {
    mockAuth(null);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    expect(screen.getByRole('link', { name: 'Connexion' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: "S'inscrire" })).toHaveAttribute('href', '/register');
    expect(screen.queryByTestId('message-bell')).not.toBeInTheDocument();
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument();
  });
});

describe('NavbarLinks - authenticated USER', () => {
  const user: User = { id: 'u1', username: 'alice', email: 'alice@example.com', role: 'USER' };

  it('shows the user menus and dashboard link, but no organizer or admin links', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    expect(screen.getByTestId('message-bell')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mon tableau de bord' })).toHaveAttribute(
      'href',
      '/dashboard/user',
    );
    expect(screen.getByRole('link', { name: '+ Créer' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Espace organisateur' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('opens the "Mes événements" dropdown, navigates and closes it on click', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    const menuButton = screen.getByRole('button', { name: 'Menu mes événements' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const calendarLink = screen.getByRole('menuitem', { name: 'Calendrier' });
    expect(calendarLink).toHaveAttribute('href', '/my-calendar');

    fireEvent.click(calendarLink);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the "Mes achats" dropdown and closes it when a link is clicked', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    const menuButton = screen.getByRole('button', { name: 'Menu achats et réservations' });
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const ticketsLink = screen.getByRole('menuitem', { name: 'Mes billets' });
    expect(ticketsLink).toHaveAttribute('href', '/my-tickets');

    fireEvent.click(ticketsLink);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes open menus when clicking outside of them', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    const menuButton = screen.getByRole('button', { name: 'Menu mes événements' });
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseDown(document.body);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the logout dialog when the backdrop is clicked', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    fireEvent.click(screen.getByRole('dialog', { name: 'Déconnexion' }));

    expect(screen.queryByRole('dialog', { name: 'Déconnexion' })).not.toBeInTheDocument();
  });

  it('shows a logout confirmation dialog and calls logout when confirmed', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout,
    });
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(screen.getByRole('dialog', { name: 'Déconnexion' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Oui' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('dismisses the logout confirmation dialog on cancel', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByRole('dialog', { name: 'Déconnexion' })).not.toBeInTheDocument();
  });
});

describe('NavbarLinks - authenticated ORGANIZER', () => {
  const organizer: User = {
    id: 'u2',
    username: 'orga',
    email: 'orga@example.com',
    role: 'ORGANIZER',
  };

  it('shows the organizer space menu and no user dashboard link', () => {
    mockAuth(organizer);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    expect(screen.getByRole('button', { name: 'Espace organisateur' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mon tableau de bord' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+ Créer' })).toBeInTheDocument();
  });

  it('opens the organizer dropdown and closes it when a link is clicked', () => {
    mockAuth(organizer);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    const menuButton = screen.getByRole('button', { name: 'Espace organisateur' });
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const dashboardLink = screen.getByRole('menuitem', { name: 'Dashboard Pro' });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard/organizer');

    fireEvent.click(dashboardLink);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('NavbarLinks - authenticated ADMIN', () => {
  const admin: User = { id: 'u3', username: 'root', email: 'root@example.com', role: 'ADMIN' };

  it('shows the admin link and no "+ Créer" link', () => {
    mockAuth(admin);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/reports');
    expect(screen.queryByRole('link', { name: '+ Créer' })).not.toBeInTheDocument();
  });
});

describe('NavbarLinks - staff menu', () => {
  const user: User = { id: 'u1', username: 'alice', email: 'alice@example.com', role: 'USER' };

  it('shows the staff menu only when useIsStaff reports the user is staff', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: true, loading: false });

    renderLinks();

    expect(screen.getByRole('button', { name: 'Espace staff' })).toBeInTheDocument();
  });

  it('opens the staff dropdown and closes it when a link is clicked', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: true, loading: false });

    renderLinks();

    const menuButton = screen.getByRole('button', { name: 'Espace staff' });
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const scanLink = screen.getByRole('menuitem', { name: 'Validation billets' });
    expect(scanLink).toHaveAttribute('href', '/staff/scan');

    fireEvent.click(scanLink);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('hides the staff menu when the user is not staff', () => {
    mockAuth(user);
    vi.mocked(useIsStaff).mockReturnValue({ isStaff: false, loading: false });

    renderLinks();

    expect(screen.queryByRole('button', { name: 'Espace staff' })).not.toBeInTheDocument();
  });
});
