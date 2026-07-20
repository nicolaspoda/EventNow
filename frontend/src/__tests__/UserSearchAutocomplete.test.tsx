import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserSearchAutocomplete } from '../components/user/UserSearchAutocomplete';
import { authService } from '../services/auth.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    searchUsersByUsername: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function typeAndDebounce(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
}

describe('UserSearchAutocomplete', () => {
  it('does not search for an empty query', async () => {
    render(<UserSearchAutocomplete />);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(authService.searchUsersByUsername).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('searches and shows matching suggestions after the debounce delay', async () => {
    vi.mocked(authService.searchUsersByUsername).mockResolvedValue([
      { id: 'u1', username: 'bob', email: 'bob@example.com' },
    ]);

    render(<UserSearchAutocomplete />);
    await typeAndDebounce(screen.getByRole('combobox'), 'bo');

    expect(authService.searchUsersByUsername).toHaveBeenCalledWith('bo', 15);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
  });

  it('excludes the given user ids from the suggestions', async () => {
    vi.mocked(authService.searchUsersByUsername).mockResolvedValue([
      { id: 'u1', username: 'bob', email: 'bob@example.com' },
      { id: 'u2', username: 'carol', email: 'carol@example.com' },
    ]);

    render(<UserSearchAutocomplete excludeIds={['u1']} />);
    await typeAndDebounce(screen.getByRole('combobox'), 'bo');

    expect(screen.getByText('@carol')).toBeInTheDocument();
    expect(screen.queryByText('@bob')).not.toBeInTheDocument();
  });

  it('shows no listbox when the search returns no results', async () => {
    vi.mocked(authService.searchUsersByUsername).mockResolvedValue([]);

    render(<UserSearchAutocomplete />);
    await typeAndDebounce(screen.getByRole('combobox'), 'zzz');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears suggestions when the search fails', async () => {
    vi.mocked(authService.searchUsersByUsername).mockRejectedValue(new Error('boom'));

    render(<UserSearchAutocomplete />);
    await typeAndDebounce(screen.getByRole('combobox'), 'bo');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects a user, calls onSelect and navigates to their profile by default', async () => {
    vi.mocked(authService.searchUsersByUsername).mockResolvedValue([
      { id: 'u1', username: 'bob', email: 'bob@example.com' },
    ]);
    const onSelect = vi.fn();

    render(<UserSearchAutocomplete onSelect={onSelect} />);
    await typeAndDebounce(screen.getByRole('combobox'), 'bo');
    fireEvent.click(screen.getByText('@bob'));

    expect(onSelect).toHaveBeenCalledWith({ id: 'u1', username: 'bob', email: 'bob@example.com' });
    expect(mockNavigate).toHaveBeenCalledWith('/user/u1/profile');
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('does not navigate when navigateOnSelect is false', async () => {
    vi.mocked(authService.searchUsersByUsername).mockResolvedValue([
      { id: 'u1', username: 'bob', email: 'bob@example.com' },
    ]);

    render(<UserSearchAutocomplete navigateOnSelect={false} onSelect={vi.fn()} />);
    await typeAndDebounce(screen.getByRole('combobox'), 'bo');
    fireEvent.click(screen.getByText('@bob'));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('closes the suggestion list when clicking outside', async () => {
    vi.mocked(authService.searchUsersByUsername).mockResolvedValue([
      { id: 'u1', username: 'bob', email: 'bob@example.com' },
    ]);

    render(
      <div>
        <UserSearchAutocomplete />
        <button>Ailleurs</button>
      </div>,
    );
    await typeAndDebounce(screen.getByRole('combobox'), 'bo');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText('Ailleurs'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a loading spinner while the search is in flight', async () => {
    let resolveSearch: (value: unknown) => void = () => {};
    vi.mocked(authService.searchUsersByUsername).mockReturnValue(
      new Promise((resolve) => { resolveSearch = resolve; }),
    );

    const { container } = render(<UserSearchAutocomplete />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bo' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();

    await act(async () => {
      resolveSearch([]);
    });
  });
});
