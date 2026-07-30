import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QRScanner } from '../components/staff/QRScanner';
import { Html5Qrcode } from 'html5-qrcode';

vi.mock('html5-qrcode', () => {
  const Html5Qrcode = vi.fn(function (this: unknown) {
    return { start: vi.fn(), stop: vi.fn(), isScanning: true };
  });
  return { Html5Qrcode };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function getInstance() {
  return vi.mocked(Html5Qrcode).mock.results[0].value as {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    isScanning: boolean;
  };
}

describe('QRScanner', () => {
  it('renders the scanner container and instructions', () => {
    vi.mocked(Html5Qrcode).mockImplementation(function () {
      return { start: vi.fn(() => new Promise(() => {})), stop: vi.fn(), isScanning: false } as never;
    });

    render(<QRScanner onScan={vi.fn()} onError={vi.fn()} />);

    expect(screen.getByText('Positionnez le QR code dans le cadre')).toBeInTheDocument();
    expect(document.getElementById('qr-reader')).toBeInTheDocument();
  });

  it('starts the scanner with the back camera on mount', () => {
    vi.mocked(Html5Qrcode).mockImplementation(function () {
      return { start: vi.fn(() => new Promise(() => {})), stop: vi.fn(), isScanning: false } as never;
    });

    render(<QRScanner onScan={vi.fn()} onError={vi.fn()} />);

    const instance = getInstance();
    expect(instance.start).toHaveBeenCalledWith(
      { facingMode: 'environment' },
      expect.objectContaining({ fps: 10 }),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('calls onScan once with the decoded text and stops the scanner', async () => {
    let decodedCallback: (text: string) => void = () => {};
    vi.mocked(Html5Qrcode).mockImplementation(function () {
      return {
        start: vi.fn((_config: unknown, _settings: unknown, onSuccess: (text: string) => void) => {
          decodedCallback = onSuccess;
          return Promise.resolve();
        }),
        stop: vi.fn().mockResolvedValue(undefined),
        isScanning: true,
      } as never;
    });
    const onScan = vi.fn();

    render(<QRScanner onScan={onScan} onError={vi.fn()} />);
    await waitFor(() => expect(getInstance().start).toHaveBeenCalled());

    act(() => {
      decodedCallback('QR-CODE-123');
      decodedCallback('QR-CODE-123');
    });

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('QR-CODE-123');
  });

  it('calls onError when the camera fails to start', async () => {
    vi.mocked(Html5Qrcode).mockImplementation(function () {
      return {
        start: vi.fn().mockRejectedValue(new Error('Permission refusée')),
        stop: vi.fn(),
        isScanning: false,
      } as never;
    });
    const onError = vi.fn();

    render(<QRScanner onScan={vi.fn()} onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Permission refusée'));
  });

  it('stops the scanner on unmount if it is running', async () => {
    const stop = vi.fn().mockResolvedValue(undefined);
    vi.mocked(Html5Qrcode).mockImplementation(function () {
      return { start: vi.fn().mockResolvedValue(undefined), stop, isScanning: true } as never;
    });

    const { unmount } = render(<QRScanner onScan={vi.fn()} onError={vi.fn()} />);
    await waitFor(() => expect(getInstance().start).toHaveBeenCalled());

    unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
