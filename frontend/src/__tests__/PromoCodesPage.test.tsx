import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromoCodesPage } from '../pages/PromoCodesPage';
import { promoCodesService } from '../services/promoCodesService';
import type { PromoCode } from '../services/promoCodesService';

vi.mock('../services/promoCodesService', () => ({
  promoCodesService: {
    getEventPromoCodes: vi.fn(),
    createPromoCode: vi.fn(),
    deletePromoCode: vi.fn(),
  },
}));

function makePromoCode(overrides: Partial<PromoCode> = {}): PromoCode {
  return {
    id: 'p1',
    code: 'SUMMER20',
    eventId: 'e1',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxUses: 100,
    currentUses: 10,
    expiresAt: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard/events/e1/promo-codes']}>
      <Routes>
        <Route path="/dashboard/events/:id/promo-codes" element={<PromoCodesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PromoCodesPage - loading and empty state', () => {
  it('shows a loading state initially', () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an empty state with a create button', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucun code promo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer un code promo' })).toBeInTheDocument();
  });

  it('shows an error message when loading fails', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(
      await screen.findByText('Erreur lors du chargement des codes promo'),
    ).toBeInTheDocument();
  });
});

describe('PromoCodesPage - listing', () => {
  it('lists promo codes with their type, value and usage', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([makePromoCode()]);

    renderPage();

    expect(await screen.findByText('SUMMER20')).toBeInTheDocument();
    expect(screen.getByText('Pourcentage')).toBeInTheDocument();
    expect(screen.getByText('20 %')).toBeInTheDocument();
    expect(screen.getByText('10 / 100')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it('shows a fixed-amount discount formatted as currency', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([
      makePromoCode({ discountType: 'FIXED_AMOUNT', discountValue: 5 }),
    ]);

    renderPage();

    expect(await screen.findByText('Montant fixe')).toBeInTheDocument();
    expect(screen.getByText('5.00 €')).toBeInTheDocument();
  });

  it('shows "Inactif" and no deactivate button for an inactive code', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([
      makePromoCode({ isActive: false }),
    ]);

    renderPage();

    expect(await screen.findByText('Inactif')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Désactiver' })).not.toBeInTheDocument();
  });

  it('deactivates a promo code after confirmation', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([makePromoCode()]);
    vi.mocked(promoCodesService.deletePromoCode).mockResolvedValue(makePromoCode({ isActive: false }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Désactiver' }));

    await waitFor(() => expect(promoCodesService.deletePromoCode).toHaveBeenCalledWith('p1'));
  });

  it('does not deactivate when the confirmation dialog is cancelled', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([makePromoCode()]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Désactiver' }));

    expect(promoCodesService.deletePromoCode).not.toHaveBeenCalled();
  });
});

describe('PromoCodesPage - create form', () => {
  it('opens and closes the create-code modal', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Créer un code promo' }));
    expect(screen.getByText('Nouveau code promo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByText('Nouveau code promo')).not.toBeInTheDocument();
  });

  it('submits a new promo code with uppercased code and numeric fields', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([]);
    vi.mocked(promoCodesService.createPromoCode).mockResolvedValue(makePromoCode());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Créer un code promo' }));

    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'summer20' } });
    fireEvent.change(screen.getByLabelText(/Valeur/), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/Nombre max d'utilisations/), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() =>
      expect(promoCodesService.createPromoCode).toHaveBeenCalledWith({
        code: 'SUMMER20',
        eventId: 'e1',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxUses: 50,
      }),
    );
    await waitFor(() => expect(screen.queryByText('Nouveau code promo')).not.toBeInTheDocument());
  });

  it('shows an error message when creation fails', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([]);
    vi.mocked(promoCodesService.createPromoCode).mockRejectedValue({
      response: { data: { message: 'Ce code existe déjà' } },
    });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Créer un code promo' }));
    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'DUP' } });
    fireEvent.change(screen.getByLabelText(/Valeur/), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Ce code existe déjà')).toBeInTheDocument();
  });

  it('switches to a fixed-amount discount type', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Créer un code promo' }));

    fireEvent.change(screen.getByLabelText(/Type de réduction/), {
      target: { value: 'FIXED_AMOUNT' },
    });

    expect(screen.getByText(/\(montant en €\)/)).toBeInTheDocument();
  });

  it('links back to the event stats page', async () => {
    vi.mocked(promoCodesService.getEventPromoCodes).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByRole('link', { name: '← Retour aux statistiques' }),
    ).toHaveAttribute('href', '/dashboard/events/e1/stats');
  });
});
