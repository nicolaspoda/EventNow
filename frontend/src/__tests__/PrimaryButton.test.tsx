import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrimaryButton } from '../components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders its children as a submit button', () => {
    render(<PrimaryButton>Valider</PrimaryButton>);

    const button = screen.getByRole('button', { name: 'Valider' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).not.toBeDisabled();
  });

  it('is disabled and shows the disabled state when loading is true', () => {
    render(<PrimaryButton loading>Envoi...</PrimaryButton>);

    expect(screen.getByRole('button', { name: 'Envoi...' })).toBeDisabled();
  });

  it('is disabled when the disabled prop is set, independently of loading', () => {
    render(<PrimaryButton disabled>Valider</PrimaryButton>);

    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('responds to clicks when enabled', () => {
    const onClick = vi.fn();
    render(<PrimaryButton onClick={onClick}>Valider</PrimaryButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <PrimaryButton onClick={onClick} disabled>
        Valider
      </PrimaryButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
