import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBar } from '../components/events/SearchBar';
import { eventService } from '../services/eventService';

vi.mock('../services/eventService', () => ({
  eventService: {
    getSuggestions: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SearchBar', () => {
  it('calls onChange as the user types', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'J' } });

    expect(onChange).toHaveBeenCalledWith('J');
  });

  it('does not fetch suggestions for a query shorter than 2 characters', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'J' } });

    expect(eventService.getSuggestions).not.toHaveBeenCalled();
  });

  it('fetches and displays suggestions once the query reaches 2 characters', async () => {
    vi.mocked(eventService.getSuggestions).mockResolvedValue([
      { id: '1', label: 'Jazz Festival', sublabel: 'Paris' },
    ]);
    render(<SearchBar value="" onChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ja' } });

    expect(await screen.findByText('Jazz Festival')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(eventService.getSuggestions).toHaveBeenCalledWith('Ja');
  });

  it('selects a suggestion, updating the value and hiding the list', async () => {
    vi.mocked(eventService.getSuggestions).mockResolvedValue([
      { id: '1', label: 'Jazz Festival', sublabel: 'Paris' },
    ]);
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ja' } });
    const suggestion = await screen.findByText('Jazz Festival');
    fireEvent.click(suggestion);

    expect(onChange).toHaveBeenLastCalledWith('Jazz Festival');
    await waitFor(() => expect(screen.queryByText('Jazz Festival')).not.toBeInTheDocument());
  });

  it('clears suggestions when the query drops back below 2 characters', async () => {
    vi.mocked(eventService.getSuggestions).mockResolvedValue([
      { id: '1', label: 'Jazz Festival', sublabel: 'Paris' },
    ]);
    render(<SearchBar value="" onChange={vi.fn()} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Ja' } });
    await screen.findByText('Jazz Festival');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'J' } });

    expect(screen.queryByText('Jazz Festival')).not.toBeInTheDocument();
  });
});
