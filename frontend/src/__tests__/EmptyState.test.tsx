import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from '../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders the title and message', () => {
    render(<EmptyState title="Aucun événement" message="Revenez plus tard" />);

    expect(screen.getByText('Aucun événement')).toBeInTheDocument();
    expect(screen.getByText('Revenez plus tard')).toBeInTheDocument();
  });

  it('renders the default icon when none is provided', () => {
    const { container } = render(<EmptyState title="Vide" message="Rien ici" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a custom icon instead of the default one', () => {
    const { container } = render(
      <EmptyState
        title="Vide"
        message="Rien ici"
        icon={<span data-testid="custom-icon" />}
      />,
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('does not render an action button when actionLabel or onAction is missing', () => {
    render(<EmptyState title="Vide" message="Rien ici" actionLabel="Créer" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an action button that calls onAction when clicked', () => {
    const onAction = vi.fn();
    render(
      <EmptyState title="Vide" message="Rien ici" actionLabel="Créer un événement" onAction={onAction} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Créer un événement' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
