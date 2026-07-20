import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdvancedFilters } from '../components/events/AdvancedFilters';

describe('AdvancedFilters - basic filters', () => {
  it('hides the expandable section by default', () => {
    render(<AdvancedFilters filters={{}} onFilterChange={vi.fn()} onClear={vi.fn()} />);

    expect(screen.queryByText('Catégories')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Afficher plus de filtres/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('expands to show categories, price ranges and date range', () => {
    render(<AdvancedFilters filters={{}} onFilterChange={vi.fn()} onClear={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Afficher plus de filtres/ }));

    expect(screen.getByText('Catégories')).toBeInTheDocument();
    expect(screen.getByText('Gamme de prix')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Réduire les filtres avancés/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('toggles friendsOnly on click', () => {
    const onFilterChange = vi.fn();
    render(<AdvancedFilters filters={{}} onFilterChange={onFilterChange} onClear={vi.fn()} />);

    fireEvent.click(screen.getByText('Événements de mes amis'));

    expect(onFilterChange).toHaveBeenCalledWith('friendsOnly', true);
  });

  it('selects an event type', () => {
    const onFilterChange = vi.fn();
    render(<AdvancedFilters filters={{}} onFilterChange={onFilterChange} onClear={vi.fn()} />);

    fireEvent.click(screen.getByText('Professionnel'));
    expect(onFilterChange).toHaveBeenCalledWith('type', 'PROFESSIONAL');

    fireEvent.click(screen.getByText('Communautaire'));
    expect(onFilterChange).toHaveBeenCalledWith('type', 'COMMUNITY');

    fireEvent.click(screen.getByText('Tous'));
    expect(onFilterChange).toHaveBeenCalledWith('type', null);
  });

  it('reflects the currently active type in the button styling', () => {
    render(
      <AdvancedFilters filters={{ type: 'PROFESSIONAL' }} onFilterChange={vi.fn()} onClear={vi.fn()} />,
    );

    expect(screen.getByText('Professionnel')).toHaveClass('bg-primary-600');
    expect(screen.getByText('Communautaire')).not.toHaveClass('bg-primary-600');
  });

  it('toggles the availableOnly, myEvents and followedOnly checkboxes', () => {
    const onFilterChange = vi.fn();
    render(<AdvancedFilters filters={{}} onFilterChange={onFilterChange} onClear={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Uniquement événements avec places disponibles'));
    expect(onFilterChange).toHaveBeenCalledWith('availableOnly', true);

    fireEvent.click(screen.getByLabelText('Mes événements uniquement'));
    expect(onFilterChange).toHaveBeenCalledWith('myEvents', true);

    fireEvent.click(screen.getByLabelText('Organisateurs que je suis'));
    expect(onFilterChange).toHaveBeenCalledWith('followedOnly', true);
  });
});

describe('AdvancedFilters - expanded filters', () => {
  it('adds a category when toggled on and none is active yet', () => {
    const onFilterChange = vi.fn();
    render(<AdvancedFilters filters={{}} onFilterChange={onFilterChange} onClear={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Afficher plus de filtres/ }));

    fireEvent.click(screen.getByText('Concert'));

    expect(onFilterChange).toHaveBeenCalledWith('categories', ['CONCERT']);
  });

  it('removes a category when toggled off', () => {
    const onFilterChange = vi.fn();
    render(
      <AdvancedFilters
        filters={{ categories: ['CONCERT', 'SPORT'] }}
        onFilterChange={onFilterChange}
        onClear={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Afficher plus de filtres/ }));

    fireEvent.click(screen.getByText('Concert'));

    expect(onFilterChange).toHaveBeenCalledWith('categories', ['SPORT']);
  });

  it('adds and removes a price range', () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(
      <AdvancedFilters filters={{}} onFilterChange={onFilterChange} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Afficher plus de filtres/ }));

    fireEvent.click(screen.getByLabelText('Gratuit'));
    expect(onFilterChange).toHaveBeenCalledWith('priceRanges', ['FREE']);

    rerender(
      <AdvancedFilters
        filters={{ priceRanges: ['FREE'] }}
        onFilterChange={onFilterChange}
        onClear={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText('Gratuit'));
    expect(onFilterChange).toHaveBeenCalledWith('priceRanges', []);
  });

  it('updates the date range', () => {
    const onFilterChange = vi.fn();
    render(<AdvancedFilters filters={{}} onFilterChange={onFilterChange} onClear={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Afficher plus de filtres/ }));

    fireEvent.change(screen.getByLabelText('Du'), { target: { value: '2026-01-01' } });
    expect(onFilterChange).toHaveBeenCalledWith('dateFrom', '2026-01-01');

    fireEvent.change(screen.getByLabelText('Au'), { target: { value: '2026-02-01' } });
    expect(onFilterChange).toHaveBeenCalledWith('dateTo', '2026-02-01');
  });

  it('applies the bar wrapper class when variant="bar"', () => {
    const { container } = render(
      <AdvancedFilters filters={{}} onFilterChange={vi.fn()} onClear={vi.fn()} variant="bar" />,
    );

    expect(container.firstChild).toHaveClass('border-b');
  });
});
