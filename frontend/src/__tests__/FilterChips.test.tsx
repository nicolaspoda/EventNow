import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterChips } from '../components/events/FilterChips';

describe('FilterChips', () => {
  it('renders nothing when there are no active filters', () => {
    const { container } = render(
      <FilterChips filters={{}} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('ignores sortBy, empty values and empty arrays', () => {
    const { container } = render(
      <FilterChips
        filters={{ sortBy: 'DATE_ASC', query: undefined, location: '', categories: [] }}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a labeled chip per active filter', () => {
    render(
      <FilterChips
        filters={{ query: 'jazz', type: 'PROFESSIONAL', availableOnly: true }}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    expect(screen.getByText('Recherche: jazz')).toBeInTheDocument();
    expect(screen.getByText('Type: Professionnel')).toBeInTheDocument();
    expect(screen.getByText('Places disponibles')).toBeInTheDocument();
  });

  it('only shows radiusKm as a chip when it is a positive number', () => {
    const { rerender } = render(
      <FilterChips filters={{ radiusKm: 0 }} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );
    expect(screen.queryByText(/Près de moi/)).not.toBeInTheDocument();

    rerender(<FilterChips filters={{ radiusKm: 25 }} onRemove={vi.fn()} onClearAll={vi.fn()} />);
    expect(screen.getByText('Près de moi (25 km)')).toBeInTheDocument();
  });

  it('calls onRemove with the filter key when its chip is clicked', () => {
    const onRemove = vi.fn();
    render(
      <FilterChips filters={{ location: 'Paris' }} onRemove={onRemove} onClearAll={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('Lieu: Paris'));

    expect(onRemove).toHaveBeenCalledWith('location');
  });

  it('calls onClearAll when "Tout effacer" is clicked', () => {
    const onClearAll = vi.fn();
    render(
      <FilterChips filters={{ location: 'Paris' }} onRemove={vi.fn()} onClearAll={onClearAll} />,
    );

    fireEvent.click(screen.getByText('Tout effacer'));

    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
