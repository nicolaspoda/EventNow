import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { DashboardRedirectPage } from '../pages/DashboardRedirectPage';
import { useAuth } from '../utils/useAuth';
import type { Role } from '../types/auth';

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

function mockAuthUser(role: Role | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: role ? { id: 'u1', username: 'me', email: 'me@example.com', role } : null,
    isAuthenticated: !!role,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardRedirectPage />} />
        <Route path="/events" element={<div>Page Événements</div>} />
        <Route path="/dashboard/organizer" element={<div>Dashboard Organisateur</div>} />
        <Route path="/dashboard/user" element={<div>Dashboard Utilisateur</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardRedirectPage', () => {
  it('redirects to /events when not authenticated', () => {
    mockAuthUser(null);

    renderPage();

    expect(screen.getByText('Page Événements')).toBeInTheDocument();
  });

  it('redirects organizers to the organizer dashboard', () => {
    mockAuthUser('ORGANIZER');

    renderPage();

    expect(screen.getByText('Dashboard Organisateur')).toBeInTheDocument();
  });

  it('redirects regular users to the user dashboard', () => {
    mockAuthUser('USER');

    renderPage();

    expect(screen.getByText('Dashboard Utilisateur')).toBeInTheDocument();
  });

  it('redirects other roles to /events', () => {
    mockAuthUser('ADMIN');

    renderPage();

    expect(screen.getByText('Page Événements')).toBeInTheDocument();
  });
});
