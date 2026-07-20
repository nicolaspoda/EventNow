import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../components/ui/Button';

describe('Button', () => {
  it('renders its children and responds to clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Valider</Button>);

    const button = screen.getByRole('button', { name: 'Valider' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the full-width class when fullWidth is true', () => {
    render(<Button fullWidth>Large bouton</Button>);
    expect(screen.getByRole('button', { name: 'Large bouton' })).toHaveClass('w-full');
  });

  it('does not apply the full-width class by default', () => {
    render(<Button>Bouton normal</Button>);
    expect(screen.getByRole('button', { name: 'Bouton normal' })).not.toHaveClass('w-full');
  });

  it('shows a loading spinner and hides its children while loading', () => {
    render(<Button loading>Envoyer</Button>);

    expect(screen.getByText('Chargement en cours')).toBeInTheDocument();
    expect(screen.queryByText('Envoyer')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders its children instead of the spinner when not loading', () => {
    render(<Button>Envoyer</Button>);
    expect(screen.getByText('Envoyer')).toBeInTheDocument();
    expect(screen.queryByText('Chargement en cours')).not.toBeInTheDocument();
  });

  it('renders a left icon when provided', () => {
    render(<Button leftIcon={<span data-testid="left-icon" />}>Suivant</Button>);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders a right icon when provided', () => {
    render(<Button rightIcon={<span data-testid="right-icon" />}>Suivant</Button>);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders no icons when none are provided', () => {
    render(<Button>Suivant</Button>);
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
  });

  it('uses the custom ariaLabel when provided', () => {
    render(<Button ariaLabel="Fermer la fenêtre">×</Button>);
    expect(screen.getByRole('button', { name: 'Fermer la fenêtre' })).toBeInTheDocument();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Indisponible</Button>);
    expect(screen.getByRole('button', { name: 'Indisponible' })).toBeDisabled();
  });
});
