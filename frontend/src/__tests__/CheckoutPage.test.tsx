import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CheckoutPage from '../pages/CheckoutPage';
import { orderService } from '../services/orderService';
import { stripeService } from '../services/stripeService';
import { promoCodesService } from '../services/promoCodesService';
import { useTheme } from '../contexts/ThemeContext';

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

vi.mock('../services/orderService', () => ({
  orderService: {
    initiatePayment: vi.fn(),
    confirmPayment: vi.fn(),
  },
}));

vi.mock('../services/stripeService', () => ({
  stripeService: {
    getPublishableKey: vi.fn(),
  },
}));

vi.mock('../services/promoCodesService', () => ({
  promoCodesService: {
    validatePromoCode: vi.fn(),
  },
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
}));

vi.mock('../components/payment/StripePaymentForm', () => ({
  default: ({
    onSuccess,
    onError,
    onCancel,
  }: {
    onSuccess: () => void;
    onError: (message: string) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="stripe-payment-form">
      <button onClick={onSuccess}>Simuler succès paiement</button>
      <button onClick={() => onError('Carte refusée')}>Simuler échec paiement</button>
      <button onClick={onCancel}>Simuler annulation</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams = new URLSearchParams({ bookingId: 'booking-1' });
  vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
  vi.mocked(stripeService.getPublishableKey).mockResolvedValue('pk_test_123');
});

function renderPage() {
  return render(
    <MemoryRouter>
      <CheckoutPage />
    </MemoryRouter>,
  );
}

describe('CheckoutPage - missing booking id', () => {
  it('shows an error and does not call any service when bookingId is missing', async () => {
    mockSearchParams = new URLSearchParams();

    renderPage();

    expect(await screen.findByText('Paramètres de paiement manquants')).toBeInTheDocument();
    expect(stripeService.getPublishableKey).not.toHaveBeenCalled();
    expect(orderService.initiatePayment).not.toHaveBeenCalled();
  });

  it('navigates to /events from the error screen', async () => {
    mockSearchParams = new URLSearchParams();
    renderPage();
    await screen.findByText('Paramètres de paiement manquants');

    fireEvent.click(screen.getByRole('button', { name: 'Retour aux événements' }));

    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});

describe('CheckoutPage - initialization', () => {
  it('shows a loading state while initializing', () => {
    vi.mocked(orderService.initiatePayment).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Préparation du paiement...')).toBeInTheDocument();
  });

  it('redirects immediately to the order success page for a free order', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValue({
      bookingId: 'booking-1',
      amount: 0,
      originalAmount: 0,
      eventId: 'e1',
      free: true,
      orderId: 'order-1',
    });

    renderPage();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/orders/order-1/success'));
  });

  it('shows an error screen when initialization fails', async () => {
    vi.mocked(orderService.initiatePayment).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText("Impossible d'initialiser le paiement")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retour aux événements' })).toBeInTheDocument();
  });

  it('shows the amount and mounts the Stripe payment form for a paid order', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValue({
      bookingId: 'booking-1',
      paymentId: 'pay-1',
      clientSecret: 'secret_123',
      amount: 45,
      originalAmount: 45,
      eventId: 'e1',
    });

    renderPage();

    expect(await screen.findByTestId('stripe-payment-form')).toBeInTheDocument();
    expect(screen.getByText('45.00 €')).toBeInTheDocument();
  });
});

describe('CheckoutPage - promo codes', () => {
  const initialPayment = {
    bookingId: 'booking-1',
    paymentId: 'pay-1',
    clientSecret: 'secret_123',
    amount: 100,
    originalAmount: 100,
    eventId: 'e1',
  };

  it('applies a valid promo code and shows the discount breakdown', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce(initialPayment);
    vi.mocked(promoCodesService.validatePromoCode).mockResolvedValue({
      promoCode: {
        id: 'promo-1',
        code: 'SUMMER20',
        eventId: 'e1',
        discountType: 'PERCENTAGE' as never,
        discountValue: 20,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      discountAmount: 20,
      finalAmount: 80,
    });
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce({
      ...initialPayment,
      clientSecret: 'secret_456',
    });

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.change(screen.getByLabelText('Code promo (optionnel)'), {
      target: { value: 'summer20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

    await waitFor(() =>
      expect(promoCodesService.validatePromoCode).toHaveBeenCalledWith('SUMMER20', 'e1', 100),
    );
    expect(await screen.findByText(/Code SUMMER20 appliqué/)).toBeInTheDocument();
    expect(orderService.initiatePayment).toHaveBeenLastCalledWith('booking-1', 'promo-1');
    expect(screen.getByText('80.00 €')).toBeInTheDocument();
  });

  it('redirects to success when applying a promo code makes the order free', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce(initialPayment);
    vi.mocked(promoCodesService.validatePromoCode).mockResolvedValue({
      promoCode: {
        id: 'promo-free',
        code: 'FREE100',
        eventId: 'e1',
        discountType: 'PERCENTAGE' as never,
        discountValue: 100,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      discountAmount: 100,
      finalAmount: 0,
    });
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce({
      ...initialPayment,
      free: true,
      orderId: 'order-free',
    });

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.change(screen.getByLabelText('Code promo (optionnel)'), {
      target: { value: 'FREE100' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/orders/order-free/success'),
    );
  });

  it('shows an error for an invalid promo code without touching the existing payment', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce(initialPayment);
    vi.mocked(promoCodesService.validatePromoCode).mockRejectedValue({
      response: { data: { message: 'Code promo invalide ou expiré' } },
    });

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.change(screen.getByLabelText('Code promo (optionnel)'), {
      target: { value: 'BADCODE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

    expect(await screen.findByText('Code promo invalide ou expiré')).toBeInTheDocument();
    expect(screen.getByTestId('stripe-payment-form')).toBeInTheDocument();
  });

  it('removes an applied promo code and re-initiates payment without it', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce(initialPayment);
    vi.mocked(promoCodesService.validatePromoCode).mockResolvedValue({
      promoCode: {
        id: 'promo-1',
        code: 'SUMMER20',
        eventId: 'e1',
        discountType: 'PERCENTAGE' as never,
        discountValue: 20,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      discountAmount: 20,
      finalAmount: 80,
    });
    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce({
      ...initialPayment,
      clientSecret: 'secret_456',
    });

    renderPage();
    await screen.findByTestId('stripe-payment-form');
    fireEvent.change(screen.getByLabelText('Code promo (optionnel)'), {
      target: { value: 'SUMMER20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
    await screen.findByText(/Code SUMMER20 appliqué/);

    vi.mocked(orderService.initiatePayment).mockResolvedValueOnce({
      ...initialPayment,
      clientSecret: 'secret_789',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le code promo' }));

    await waitFor(() => expect(orderService.initiatePayment).toHaveBeenLastCalledWith('booking-1'));
    expect(screen.getByLabelText('Code promo (optionnel)')).toHaveValue('');
  });
});

describe('CheckoutPage - payment outcome', () => {
  const initialPayment = {
    bookingId: 'booking-1',
    paymentId: 'pay-1',
    clientSecret: 'secret_123',
    amount: 45,
    originalAmount: 45,
    eventId: 'e1',
  };

  it('confirms the order and navigates to the success page on payment success', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValue(initialPayment);
    vi.mocked(orderService.confirmPayment).mockResolvedValue({
      order: { id: 'order-1' } as never,
      tickets: [],
    });

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.click(screen.getByText('Simuler succès paiement'));

    await waitFor(() =>
      expect(orderService.confirmPayment).toHaveBeenCalledWith('booking-1', 'pay-1', undefined),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/orders/order-1/success');
  });

  it('shows an error when order confirmation fails after payment', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValue(initialPayment);
    vi.mocked(orderService.confirmPayment).mockRejectedValue(new Error('boom'));

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.click(screen.getByText('Simuler succès paiement'));

    expect(
      await screen.findByText('Erreur lors de la confirmation de commande'),
    ).toBeInTheDocument();
  });

  it('shows the Stripe error message when the payment itself fails', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValue(initialPayment);

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.click(screen.getByText('Simuler échec paiement'));

    expect(await screen.findByText('Carte refusée')).toBeInTheDocument();
  });

  it('navigates to /events when the payment form is cancelled', async () => {
    vi.mocked(orderService.initiatePayment).mockResolvedValue(initialPayment);

    renderPage();
    await screen.findByTestId('stripe-payment-form');

    fireEvent.click(screen.getByText('Simuler annulation'));

    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});
