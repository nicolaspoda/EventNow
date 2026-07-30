import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AppLayout } from '../components/AppLayout';

vi.mock('../components/AppNavbar', () => ({
  AppNavbar: ({ rightContent }: { rightContent?: React.ReactNode }) => (
    <div data-testid="app-navbar">{rightContent}</div>
  ),
}));

vi.mock('../components/NavbarLinks', () => ({
  NavbarLinks: () => <div data-testid="navbar-links" />,
}));

describe('AppLayout', () => {
  it('renders the navbar with NavbarLinks as its right content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Page enfant</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('app-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-links')).toBeInTheDocument();
  });

  it('renders the matched child route inside the main landmark', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Page enfant</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Page enfant')).toBeInTheDocument();
  });

  it('renders a skip link pointing at the main content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div>Page enfant</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Aller au contenu principal')).toHaveAttribute(
      'href',
      '#main-content',
    );
  });
});
