import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { socketService } from '../services/socketService';

vi.mock('../services/socketService', () => ({
  socketService: {
    disconnect: vi.fn(),
    connect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(false),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  window.history.pushState({}, '', '/');
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

describe('App', () => {
  it('renders the landing page at the root route for an unauthenticated visitor', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Découvrez et réservez avec/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Connexion' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: "S'inscrire" })).toHaveAttribute('href', '/register');
    expect(socketService.disconnect).toHaveBeenCalled();
  });
});
