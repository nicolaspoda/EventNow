import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SortOptions } from '../components/events/SortOptions';

describe('SortOptions', () => {
  it('renders all sort options', () => {
    render(<SortOptions value="DATE_ASC" onChange={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'Date (croissant)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Popularité' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Distance (près de moi)' })).toBeInTheDocument();
  });

  it('reflects the current value', () => {
    render(<SortOptions value="PRICE_DESC" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Ordre de tri' })).toHaveValue('PRICE_DESC');
  });

  it('calls onChange with the newly selected value', () => {
    const onChange = vi.fn();
    render(<SortOptions value="DATE_ASC" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Ordre de tri' }), {
      target: { value: 'POPULARITY' },
    });

    expect(onChange).toHaveBeenCalledWith('POPULARITY');
  });
});
