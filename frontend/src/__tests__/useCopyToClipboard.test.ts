import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

describe('useCopyToClipboard', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('copies text and sets copied to true on success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);

    await act(async () => {
      const success = await result.current.copy('https://example.com/events/1');
      expect(success).toBe(true);
    });

    expect(result.current.copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.com/events/1');
  });

  it('resets copied to false after 2000ms', async () => {
    vi.useFakeTimers();

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('https://example.com');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('falls back to execCommand when navigator.clipboard is undefined', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy('fallback text');
      expect(success).toBe(true);
    });

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
  });
});
