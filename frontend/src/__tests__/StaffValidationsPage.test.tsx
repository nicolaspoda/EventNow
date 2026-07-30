import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffValidationsPage } from '../pages/StaffValidationsPage';
import { validationService } from '../services/validationService';
import type { ValidationItem } from '../services/validationService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/validationService', () => ({
  validationService: {
    getStaffEvents: vi.fn(),
    getValidations: vi.fn(),
  },
}));

function makeValidation(overrides: Partial<ValidationItem> = {}): ValidationItem {
  return {
    id: 'v1',
    qrCode: 'qr-1',
    validatedAt: '2026-01-01T10:00:00.000Z',
    ticketCategory: { id: 'cat1', name: 'Standard' },
    ...overrides,
  } as ValidationItem;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(validationService.getStaffEvents).mockResolvedValue([]);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <StaffValidationsPage />
    </MemoryRouter>,
  );
}

describe('StaffValidationsPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(validationService.getValidations).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('shows an empty state when there are no validations', async () => {
    vi.mocked(validationService.getValidations).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune validation enregistrée.')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === '0 billets validés'),
    ).toBeInTheDocument();
  });

  it('shows an error message and retries', async () => {
    vi.mocked(validationService.getValidations)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([makeValidation()]);

    renderPage();

    expect(
      await screen.findByText('Impossible de charger les validations'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(validationService.getValidations).toHaveBeenCalledTimes(2));
  });

  it('shows the validation count and navigates back to the scanner', async () => {
    vi.mocked(validationService.getValidations).mockResolvedValue([
      makeValidation({ id: 'v1' }),
      makeValidation({ id: 'v2' }),
    ]);

    renderPage();

    expect(
      await screen.findByText((_, el) => el?.textContent === '2 billets validés'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour au scan' }));
    expect(mockNavigate).toHaveBeenCalledWith('/staff/scan');
  });

  it('filters by event when the staff member has several events', async () => {
    vi.mocked(validationService.getStaffEvents).mockResolvedValue([
      { id: 'e1', title: 'Concert', eventDate: '2026-05-01T00:00:00.000Z' },
      { id: 'e2', title: 'Festival', eventDate: '2026-06-01T00:00:00.000Z' },
    ]);
    vi.mocked(validationService.getValidations).mockResolvedValue([]);

    renderPage();

    const select = await screen.findByLabelText('Filtrer par événement');
    fireEvent.change(select, { target: { value: 'e2' } });

    await waitFor(() =>
      expect(validationService.getValidations).toHaveBeenLastCalledWith('e2'),
    );
  });

  it('does not show the event filter select for a single staff event', async () => {
    vi.mocked(validationService.getStaffEvents).mockResolvedValue([
      { id: 'e1', title: 'Concert', eventDate: '2026-05-01T00:00:00.000Z' },
    ]);
    vi.mocked(validationService.getValidations).mockResolvedValue([]);

    renderPage();

    await screen.findByText('Aucune validation enregistrée.');
    expect(screen.queryByLabelText('Filtrer par événement')).not.toBeInTheDocument();
  });
});
