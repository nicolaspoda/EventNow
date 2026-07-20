import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AboutButton } from '../components/AboutButton';

describe('AboutButton', () => {
  it('is closed by default', () => {
    render(<AboutButton />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the about panel with the version number when clicked', () => {
    render(<AboutButton />);

    fireEvent.click(screen.getByRole('button', { name: "À propos d'EventNow" }));

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('v1.1')).toBeInTheDocument();
  });

  it('closes the panel when the toggle button is clicked again', () => {
    render(<AboutButton />);

    const button = screen.getByRole('button', { name: "À propos d'EventNow" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the panel when clicking outside of it', () => {
    render(
      <div>
        <AboutButton />
        <button>Ailleurs</button>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: "À propos d'EventNow" }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('Ailleurs'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
