import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { useIsStaff, STAFF_STATUS_CHANGED_EVENT } from '../hooks/useIsStaff';
import { validationService } from '../services/validationService';

vi.mock('../services/validationService', () => ({
  validationService: {
    getStaffEvents: vi.fn(),
  },
}));

const staffEvent = { id: 'e1', title: 'Concert', eventDate: '2026-01-01T00:00:00.000Z' };

function wrapperFor(path: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useIsStaff', () => {
  it('is not staff and stops loading immediately when there is no access token', async () => {
    const { result } = renderHook(() => useIsStaff('u1'), { wrapper: wrapperFor('/events') });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isStaff).toBe(false);
    expect(validationService.getStaffEvents).not.toHaveBeenCalled();
  });

  it('is staff when the user has at least one upcoming staff event', async () => {
    sessionStorage.setItem('accessToken', 'token');
    vi.mocked(validationService.getStaffEvents).mockResolvedValue([staffEvent]);

    const { result } = renderHook(() => useIsStaff('u1'), { wrapper: wrapperFor('/events') });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isStaff).toBe(true);
  });

  it('is not staff when the staff events list is empty', async () => {
    sessionStorage.setItem('accessToken', 'token');
    vi.mocked(validationService.getStaffEvents).mockResolvedValue([]);

    const { result } = renderHook(() => useIsStaff('u1'), { wrapper: wrapperFor('/events') });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isStaff).toBe(false);
  });

  it('falls back to not staff when the request fails', async () => {
    sessionStorage.setItem('accessToken', 'token');
    vi.mocked(validationService.getStaffEvents).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useIsStaff('u1'), { wrapper: wrapperFor('/events') });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isStaff).toBe(false);
  });

  it('re-checks staff status when the staff-status-changed event fires', async () => {
    sessionStorage.setItem('accessToken', 'token');
    vi.mocked(validationService.getStaffEvents).mockResolvedValue([]);

    const { result } = renderHook(() => useIsStaff('u1'), { wrapper: wrapperFor('/events') });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isStaff).toBe(false);

    vi.mocked(validationService.getStaffEvents).mockResolvedValue([staffEvent]);
    act(() => {
      window.dispatchEvent(new Event(STAFF_STATUS_CHANGED_EVENT));
    });

    await waitFor(() => expect(result.current.isStaff).toBe(true));
  });

  it('re-checks staff status on mount when landing directly on a /staff page', async () => {
    sessionStorage.setItem('accessToken', 'token');
    vi.mocked(validationService.getStaffEvents).mockResolvedValue([staffEvent]);

    renderHook(() => useIsStaff('u1'), { wrapper: wrapperFor('/staff/dashboard') });

    await waitFor(() => expect(validationService.getStaffEvents).toHaveBeenCalled());
  });
});
