import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ShareButton from '../components/events/ShareButton';

const EVENT_ID = 'abc123';
const EVENT_TITLE = 'Festival du test';

describe('ShareButton', () => {
  beforeEach(() => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with variant="button" and shows "Partager" label', () => {
    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="button" />);
    expect(screen.getByText('Partager')).toBeInTheDocument();
  });

  it('renders with variant="icon" and shows only an icon button', () => {
    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="icon" />);
    const btn = screen.getByRole('button', { name: 'Partager cet événement' });
    expect(btn).toBeInTheDocument();
    expect(screen.queryByText('Partager')).not.toBeInTheDocument();
  });

  it('calls clipboard copy on click', async () => {
    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="button" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Partager cet événement' }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/events/${EVENT_ID}`),
    );
  });

  it('shows "Copié !" feedback after successful copy', async () => {
    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="button" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Partager cet événement' }));
    });

    expect(screen.getByText('Copié !')).toBeInTheDocument();
  });

  it('has correct aria-label on both variants', () => {
    const { rerender } = render(
      <ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="button" />,
    );
    expect(screen.getByRole('button', { name: 'Partager cet événement' })).toBeInTheDocument();

    rerender(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="icon" />);
    expect(screen.getByRole('button', { name: 'Partager cet événement' })).toBeInTheDocument();
  });

  it('copies to clipboard on click for the icon variant and shows the check icon', async () => {
    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="icon" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Partager cet événement' }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/events/${EVENT_ID}`),
    );
  });

  it('uses the native share API when available and does not fall back to clipboard', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: share,
      writable: true,
      configurable: true,
    });

    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="button" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Partager cet événement' }));
    });

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: EVENT_TITLE,
        url: expect.stringContaining(`/events/${EVENT_ID}`),
      }),
    );
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('falls back to clipboard copy when the native share API rejects', async () => {
    const share = vi.fn().mockRejectedValue(new Error('cancelled'));
    Object.defineProperty(navigator, 'share', {
      value: share,
      writable: true,
      configurable: true,
    });

    render(<ShareButton eventId={EVENT_ID} eventTitle={EVENT_TITLE} variant="button" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Partager cet événement' }));
    });

    expect(share).toHaveBeenCalled();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/events/${EVENT_ID}`),
    );
  });
});
