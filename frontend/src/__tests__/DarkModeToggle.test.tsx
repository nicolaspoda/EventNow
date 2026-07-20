import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { useTheme } from '../contexts/ThemeContext';

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

describe('DarkModeToggle', () => {
  it('offers to enable dark mode when the current theme is light', () => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });

    render(<DarkModeToggle />);

    expect(screen.getByRole('button', { name: 'Activer le mode sombre' })).toBeInTheDocument();
  });

  it('offers to enable light mode when the current theme is dark', () => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });

    render(<DarkModeToggle />);

    expect(screen.getByRole('button', { name: 'Activer le mode clair' })).toBeInTheDocument();
  });

  it('calls toggleTheme when clicked', () => {
    const toggleTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme });

    render(<DarkModeToggle />);
    fireEvent.click(screen.getByRole('button'));

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
