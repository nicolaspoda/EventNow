import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IconButton from '../components/ui/IconButton';

describe('IconButton', () => {
  it('renders the icon and uses ariaLabel as its accessible name', () => {
    render(<IconButton icon={<span data-testid="icon" />} ariaLabel="Fermer" />);

    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<IconButton icon={<span />} ariaLabel="Supprimer" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies a custom className alongside the default styles', () => {
    render(<IconButton icon={<span />} ariaLabel="Options" className="custom-class" />);

    expect(screen.getByRole('button', { name: 'Options' })).toHaveClass('custom-class');
  });

  it('forwards native button props such as disabled', () => {
    render(<IconButton icon={<span />} ariaLabel="Envoyer" disabled />);

    expect(screen.getByRole('button', { name: 'Envoyer' })).toBeDisabled();
  });

  it('hides the icon wrapper from assistive technology', () => {
    render(<IconButton icon={<span>★</span>} ariaLabel="Favori" />);

    const button = screen.getByRole('button', { name: 'Favori' });
    expect(button.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
  });
});
