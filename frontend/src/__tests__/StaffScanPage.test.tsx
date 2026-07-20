import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffScanPage } from '../pages/StaffScanPage';
import { validationService } from '../services/validationService';
import type { ValidationResponse } from '../services/validationService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/validationService', () => ({
  validationService: {
    validateTicket: vi.fn(),
  },
}));

let capturedOnScan: ((qrCode: string) => void) | undefined;
let capturedOnError: ((error: string) => void) | undefined;
vi.mock('../components/staff/QRScanner', () => ({
  QRScanner: ({ onScan, onError }: { onScan: (qr: string) => void; onError: (e: string) => void }) => {
    capturedOnScan = onScan;
    capturedOnError = onError;
    return <div data-testid="qr-scanner" />;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnScan = undefined;
  capturedOnError = undefined;
});

function renderPage() {
  return render(
    <MemoryRouter>
      <StaffScanPage />
    </MemoryRouter>,
  );
}

describe('StaffScanPage - initial state', () => {
  it('shows the activation buttons before scanning starts', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Activer la caméra' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saisie manuelle' })).toBeInTheDocument();
    expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
  });

  it('navigates to the validations history page', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));

    expect(mockNavigate).toHaveBeenCalledWith('/staff/validations');
  });

  it('starts the camera scanner when requested', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));

    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('cancels the active scan and returns to the initial buttons', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activer la caméra' })).toBeInTheDocument();
  });

  it('shows a camera error and dismisses it', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));
    act(() => {
      capturedOnError?.('Permission refusée');
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Permission refusée');

    fireEvent.click(screen.getByText('Fermer'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('StaffScanPage - manual input', () => {
  it('validates a manually entered code', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('MANUAL-CODE');
    const result: ValidationResponse = {
      valid: true,
      reason: '',
      message: 'Billet validé',
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    vi.mocked(validationService.validateTicket).mockResolvedValue(result);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Saisie manuelle' }));

    await waitFor(() => expect(validationService.validateTicket).toHaveBeenCalledWith('MANUAL-CODE'));
    expect(await screen.findByText('Billet validé')).toBeInTheDocument();
  });

  it('does not validate when the prompt is cancelled or empty', () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Saisie manuelle' }));

    expect(validationService.validateTicket).not.toHaveBeenCalled();
  });
});

describe('StaffScanPage - scan result', () => {
  it('shows a valid result after a successful scan', async () => {
    const result: ValidationResponse = {
      valid: true,
      reason: '',
      message: 'Billet validé avec succès',
      ticket: { event: 'Concert', category: 'Standard', validated_at: '2026-01-01T00:00:00.000Z' },
      timestamp: '2026-01-01T00:00:00.000Z',
    };
    vi.mocked(validationService.validateTicket).mockResolvedValue(result);

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));
    capturedOnScan?.('QR-123');

    expect(await screen.findByText('Billet validé avec succès')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scanner un autre billet' })).toBeInTheDocument();
  });

  it('shows a technical-error result when the validation call rejects', async () => {
    vi.mocked(validationService.validateTicket).mockRejectedValue(new Error('network down'));

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));
    capturedOnScan?.('QR-123');

    expect(await screen.findByText('Erreur de connexion au serveur')).toBeInTheDocument();
  });

  it('does nothing for a blank scanned code', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));
    capturedOnScan?.('   ');

    expect(validationService.validateTicket).not.toHaveBeenCalled();
  });

  it('returns to scanning mode after clicking "Scanner un autre billet"', async () => {
    vi.mocked(validationService.validateTicket).mockResolvedValue({
      valid: true,
      reason: '',
      message: 'Billet validé',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Activer la caméra' }));
    capturedOnScan?.('QR-123');
    await screen.findByText('Billet validé');

    fireEvent.click(screen.getByRole('button', { name: 'Scanner un autre billet' }));

    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
  });
});
