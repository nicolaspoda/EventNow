import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QRCodeModal from '../components/tickets/QRCodeModal';
import { generateQRCodeDataUrl } from '../utils/qrCode';
import type { Ticket } from '../types/order.types';

vi.mock('../utils/qrCode', () => ({
  generateQRCodeDataUrl: vi.fn(),
}));

const ticket: Ticket = {
  id: 'ticket-12345678',
  orderId: 'order-1',
  qrCode: 'qr-code-value',
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    writable: true,
    configurable: true,
  });
});

describe('QRCodeModal', () => {
  it('shows a loading state before the QR code is generated', () => {
    vi.mocked(generateQRCodeDataUrl).mockReturnValue(new Promise(() => {}));

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={vi.fn()} />);

    expect(screen.getByText('Génération du QR code...')).toBeInTheDocument();
  });

  it('shows the generated QR code image once ready', async () => {
    vi.mocked(generateQRCodeDataUrl).mockResolvedValue('data:image/png;base64,abc');

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={vi.fn()} />);

    const img = await screen.findByAltText('QR Code du billet');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc');
  });

  it('shows an error message when generation fails', async () => {
    vi.mocked(generateQRCodeDataUrl).mockRejectedValue(new Error('boom'));

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de générer le QR code',
    );
  });

  it('shows the raw QR code value for manual entry', async () => {
    vi.mocked(generateQRCodeDataUrl).mockResolvedValue('data:image/png;base64,abc');

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={vi.fn()} />);

    expect(screen.getByText('qr-code-value')).toBeInTheDocument();
  });

  it('copies the raw QR code value to the clipboard', async () => {
    vi.mocked(generateQRCodeDataUrl).mockResolvedValue('data:image/png;base64,abc');

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={vi.fn()} />);
    await screen.findByText('qr-code-value');

    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('qr-code-value');
  });

  it('disables the download button until the QR code is ready', () => {
    vi.mocked(generateQRCodeDataUrl).mockReturnValue(new Promise(() => {}));

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Télécharger' })).toBeDisabled();
  });

  it('triggers a direct download once the QR code is ready, without calling onDownload', async () => {
    vi.mocked(generateQRCodeDataUrl).mockResolvedValue('data:image/png;base64,abc');
    const onDownload = vi.fn();
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });

    render(<QRCodeModal ticket={ticket} onClose={vi.fn()} onDownload={onDownload} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Télécharger' })).not.toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();

    vi.mocked(document.createElement).mockRestore();
  });

  it('calls onClose when the close button or backdrop is clicked, without propagating from the panel', () => {
    vi.mocked(generateQRCodeDataUrl).mockReturnValue(new Promise(() => {}));
    const onClose = vi.fn();
    const { container } = render(
      <QRCodeModal ticket={ticket} onClose={onClose} onDownload={vi.fn()} />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' })[0]);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Votre billet'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('[role="dialog"]')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
