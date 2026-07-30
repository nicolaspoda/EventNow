import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ShareModal from '../components/events/ShareModal';

describe('ShareModal', () => {
  beforeEach(() => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ShareModal isOpen={false} onClose={vi.fn()} eventId="e1" eventTitle="Concert" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the shareable event link', () => {
    render(<ShareModal isOpen onClose={vi.fn()} eventId="e1" eventTitle="Concert" />);

    expect(screen.getByLabelText("Lien de l'événement")).toHaveValue(
      `${window.location.origin}/events/e1`,
    );
  });

  it('copies the link to the clipboard and shows confirmation feedback', async () => {
    render(<ShareModal isOpen onClose={vi.fn()} eventId="e1" eventTitle="Concert" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copier le lien' }));
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/events/e1`,
    );
    expect(screen.getByText('✓ Copié !')).toBeInTheDocument();
  });

  it('builds share links pointing to email, WhatsApp and Twitter', () => {
    render(<ShareModal isOpen onClose={vi.fn()} eventId="e1" eventTitle="Concert" />);

    expect(screen.getByRole('link', { name: 'Partager par email' })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:?subject='),
    );
    expect(screen.getByRole('link', { name: 'Partager sur WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/?text='),
    );
    expect(screen.getByRole('link', { name: 'Partager sur Twitter/X' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://twitter.com/intent/tweet?'),
    );
  });

  it('calls onClose when the close button, the backdrop or the Escape key is used', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ShareModal isOpen onClose={onClose} eventId="e1" eventTitle="Concert" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.absolute.inset-0')!);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('focuses the close button when opened', () => {
    render(<ShareModal isOpen onClose={vi.fn()} eventId="e1" eventTitle="Concert" />);

    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus();
  });
});
