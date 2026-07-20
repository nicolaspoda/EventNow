import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddressAutocomplete } from '../components/location/AddressAutocomplete';
import { geocodingService } from '../services/geocodingService';
import type { AddressSuggestion } from '../services/geocodingService';

vi.mock('../services/geocodingService', () => ({
  geocodingService: {
    searchAddress: vi.fn(),
  },
}));

const suggestion: AddressSuggestion = {
  label: '10 Rue de Rivoli 75001 Paris',
  name: '10 Rue de Rivoli',
  city: 'Paris',
  postcode: '75001',
  context: 'Paris, Île-de-France',
  coordinates: { lat: 48.856, lon: 2.352 },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderAutocomplete(props: Partial<React.ComponentProps<typeof AddressAutocomplete>> = {}) {
  const onChange = vi.fn();
  const onAddressSelect = vi.fn();
  const utils = render(
    <AddressAutocomplete value="" onChange={onChange} onAddressSelect={onAddressSelect} {...props} />,
  );
  return { ...utils, onChange, onAddressSelect };
}

async function debounce() {
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
}

describe('AddressAutocomplete', () => {
  it('renders the label, marking it required when asked', () => {
    renderAutocomplete({ label: 'Lieu', required: true });

    expect(screen.getByText('Lieu')).toBeInTheDocument();
    expect(screen.getByLabelText(/Lieu/)).toBeRequired();
  });

  it('does not search below the minimum query length', async () => {
    renderAutocomplete({ value: 'Pa' });
    await debounce();

    expect(geocodingService.searchAddress).not.toHaveBeenCalled();
  });

  it('calls onChange as the user types', () => {
    const { onChange } = renderAutocomplete({ value: '' });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Par' } });

    expect(onChange).toHaveBeenCalledWith('Par');
  });

  it('searches and shows suggestions once the query reaches the minimum length', async () => {
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([suggestion]);

    const { rerender, onChange } = renderAutocomplete({ value: '' });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rivoli' } });
    rerender(
      <AddressAutocomplete value="Rivoli" onChange={onChange} onAddressSelect={vi.fn()} />,
    );
    await debounce();

    expect(geocodingService.searchAddress).toHaveBeenCalledWith('Rivoli');
    expect(screen.getByText('10 Rue de Rivoli')).toBeInTheDocument();
    expect(screen.getByText('Paris 75001')).toBeInTheDocument();
  });

  it('shows no suggestions when the search returns nothing', async () => {
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([]);

    renderAutocomplete({ value: 'Nowhere street' });
    await debounce();

    expect(screen.queryByText('Nowhere street')).not.toBeInTheDocument();
  });

  it('clears suggestions when the search fails, without ever hitting a real network call', async () => {
    vi.mocked(geocodingService.searchAddress).mockRejectedValue(new Error('network down'));

    renderAutocomplete({ value: 'Rivoli' });
    await debounce();

    expect(geocodingService.searchAddress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('selects a suggestion, calling onChange and onAddressSelect', async () => {
    vi.mocked(geocodingService.searchAddress).mockResolvedValue([suggestion]);
    const { onChange, onAddressSelect } = renderAutocomplete({ value: 'Rivoli' });
    await debounce();

    fireEvent.click(screen.getByText('10 Rue de Rivoli'));

    expect(onChange).toHaveBeenCalledWith(suggestion.label);
    expect(onAddressSelect).toHaveBeenCalledWith(suggestion);
  });

  it('shows the error message when provided', () => {
    renderAutocomplete({ error: 'Adresse invalide' });

    expect(screen.getByText('Adresse invalide')).toBeInTheDocument();
  });
});
