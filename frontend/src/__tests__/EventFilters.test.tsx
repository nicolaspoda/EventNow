import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EventFilters from '../components/events/EventFilters';

describe('EventFilters', () => {
  it('calls onFilterChange with the entered values on submit', () => {
    const onFilterChange = vi.fn();
    render(<EventFilters onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByLabelText('Rechercher par titre'), {
      target: { value: 'Concert' },
    });
    fireEvent.change(screen.getByLabelText('Filtrer par lieu'), {
      target: { value: 'Paris' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer les filtres' }));

    expect(onFilterChange).toHaveBeenCalledWith({ search: 'Concert', location: 'Paris' });
  });

  it('pre-fills the fields from initialFilters', () => {
    render(
      <EventFilters onFilterChange={vi.fn()} initialFilters={{ search: 'Jazz', location: 'Lyon' }} />,
    );

    expect(screen.getByLabelText('Rechercher par titre')).toHaveValue('Jazz');
    expect(screen.getByLabelText('Filtrer par lieu')).toHaveValue('Lyon');
  });

  it('resets the fields and calls onFilterChange with empty filters', () => {
    const onFilterChange = vi.fn();
    render(
      <EventFilters onFilterChange={onFilterChange} initialFilters={{ search: 'Jazz' }} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));

    expect(screen.getByLabelText('Rechercher par titre')).toHaveValue('');
    expect(onFilterChange).toHaveBeenCalledWith({});
  });

  it('toggles the mobile filter panel visibility', () => {
    render(<EventFilters onFilterChange={vi.fn()} />);

    const toggle = screen.getByRole('button', { name: 'Afficher' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('search')).toHaveClass('hidden');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Masquer' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('search')).not.toHaveClass('hidden');
  });
});
