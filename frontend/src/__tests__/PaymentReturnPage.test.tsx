import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaymentReturnPage from '../pages/PaymentReturnPage';
import { loadStripe } from '@stripe/stripe-js';
import { stripeService } from '../services/stripeService';
import { orderService } from '../services/orderService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}));

vi.mock('../services/stripeService', () => ({
  stripeService: {
    getPublishableKey: vi.fn(),
  },
}));

vi.mock('../services/orderService', () => ({
  orderService: {
    confirmPayment: vi.fn(),
  },
}));

function mockStripe(retrievePaymentIntent: ReturnType<typeof vi.fn>) {
  vi.mocked(stripeService.getPublishableKey).mockResolvedValue('pk_test_123');
  vi.mocked(loadStripe).mockResolvedValue({
    retrievePaymentIntent,
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/payment/return${search}`]}>
      <PaymentReturnPage />
    </MemoryRouter>,
  );
}

describe('PaymentReturnPage', () => {
  it('shows an error when payment parameters are missing', async () => {
    renderPage('');

    expect(await screen.findByText('Paramètres de paiement manquants')).toBeInTheDocument();
    expect(screen.getByText('Problème de paiement')).toBeInTheDocument();
  });

  it('shows an error when Stripe fails to load', async () => {
    vi.mocked(stripeService.getPublishableKey).mockResolvedValue('pk_test_123');
    vi.mocked(loadStripe).mockResolvedValue(null);

    renderPage('?payment_intent_client_secret=secret_1');

    expect(await screen.findByText('Impossible de charger Stripe')).toBeInTheDocument();
  });

  it('confirms the payment and redirects to the order-success page when a bookingId is present', async () => {
    mockStripe(
      vi.fn().mockResolvedValue({
        paymentIntent: { id: 'pi_1', status: 'succeeded' },
      }),
    );
    vi.mocked(orderService.confirmPayment).mockResolvedValue({
      order: { id: 'order-1' },
    } as never);

    renderPage('?payment_intent_client_secret=secret_1&bookingId=booking-1');

    await waitFor(() =>
      expect(orderService.confirmPayment).toHaveBeenCalledWith('booking-1', 'pi_1'),
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/orders/order-1/success', { replace: true }),
    );
  });

  it('shows the success screen when there is no bookingId to confirm', async () => {
    mockStripe(
      vi.fn().mockResolvedValue({
        paymentIntent: { id: 'pi_1', status: 'succeeded' },
      }),
    );

    renderPage('?payment_intent_client_secret=secret_1');

    expect(await screen.findByText('Paiement réussi !')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voir mes billets' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-tickets');
  });

  it('shows the backend error message when confirming the payment fails', async () => {
    mockStripe(
      vi.fn().mockResolvedValue({
        paymentIntent: { id: 'pi_1', status: 'succeeded' },
      }),
    );
    vi.mocked(orderService.confirmPayment).mockRejectedValue({
      response: { data: { message: 'Commande introuvable' } },
    });

    renderPage('?payment_intent_client_secret=secret_1&bookingId=booking-1');

    expect(await screen.findByText('Commande introuvable')).toBeInTheDocument();
  });

  it('shows a processing message', async () => {
    mockStripe(
      vi.fn().mockResolvedValue({
        paymentIntent: { id: 'pi_1', status: 'processing' },
      }),
    );

    renderPage('?payment_intent_client_secret=secret_1');

    expect(
      await screen.findByText(
        'Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a payment-failed message and lets the user go back to events', async () => {
    mockStripe(
      vi.fn().mockResolvedValue({
        paymentIntent: { id: 'pi_1', status: 'requires_payment_method' },
      }),
    );

    renderPage('?payment_intent_client_secret=secret_1');

    expect(
      await screen.findByText(
        'Le paiement a échoué. Veuillez réessayer avec un autre moyen de paiement.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retour aux événements' }));
    expect(mockNavigate).toHaveBeenCalledWith('/events');
  });
});
