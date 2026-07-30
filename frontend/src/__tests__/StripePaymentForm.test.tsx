import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import { useStripe, useElements } from '@stripe/react-stripe-js';

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: vi.fn(),
  useElements: vi.fn(),
  PaymentElement: () => <div data-testid="payment-element" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useElements).mockReturnValue({} as never);
});

function renderForm(props: Partial<React.ComponentProps<typeof StripePaymentForm>> = {}) {
  const onSuccess = vi.fn();
  const onError = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <StripePaymentForm onSuccess={onSuccess} onError={onError} onCancel={onCancel} {...props} />,
  );
  return { ...utils, onSuccess, onError, onCancel };
}

describe('StripePaymentForm', () => {
  it('renders the Stripe payment element and disables submit while Stripe is not ready', () => {
    vi.mocked(useStripe).mockReturnValue(null);

    renderForm();

    expect(screen.getByTestId('payment-element')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer le paiement' })).toBeDisabled();
  });

  it('does nothing on submit when Stripe is not ready', () => {
    vi.mocked(useStripe).mockReturnValue(null);
    const { onError } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    expect(onError).not.toHaveBeenCalled();
  });

  it('calls stripe.confirmPayment with a return URL including the booking id', async () => {
    const confirmPayment = vi.fn().mockResolvedValue({});
    vi.mocked(useStripe).mockReturnValue({ confirmPayment } as never);

    renderForm({ bookingId: 'b1' });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    await waitFor(() =>
      expect(confirmPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmParams: expect.objectContaining({
            return_url: expect.stringContaining('/payment/success?bookingId=b1'),
          }),
          redirect: 'always',
        }),
      ),
    );
  });

  it('shows a processing state while the payment confirmation is pending', async () => {
    let resolveConfirm: (value: unknown) => void = () => {};
    const confirmPayment = vi.fn(
      () => new Promise((resolve) => { resolveConfirm = resolve; }),
    );
    vi.mocked(useStripe).mockReturnValue({ confirmPayment } as never);

    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    expect(await screen.findByText('Traitement du paiement...')).toBeInTheDocument();

    resolveConfirm({});
  });

  it('calls onError with the card error message for a card_error', async () => {
    const confirmPayment = vi.fn().mockResolvedValue({
      error: { type: 'card_error', message: 'Carte refusée' },
    });
    vi.mocked(useStripe).mockReturnValue({ confirmPayment } as never);
    const { onError } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Carte refusée'));
  });

  it('calls onError with a generic authentication message for an authentication_error', async () => {
    const confirmPayment = vi.fn().mockResolvedValue({
      error: { type: 'authentication_error', message: 'ignored' },
    });
    vi.mocked(useStripe).mockReturnValue({ confirmPayment } as never);
    const { onError } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Échec de l'authentification bancaire. Veuillez réessayer.",
      ),
    );
  });

  it('calls onError for other error types using the message or a fallback', async () => {
    const confirmPayment = vi.fn().mockResolvedValue({
      error: { type: 'api_error' },
    });
    vi.mocked(useStripe).mockReturnValue({ confirmPayment } as never);
    const { onError } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Erreur lors du paiement'));
  });

  it('calls onError when confirmPayment throws', async () => {
    const confirmPayment = vi.fn().mockRejectedValue(new Error('network down'));
    vi.mocked(useStripe).mockReturnValue({ confirmPayment } as never);
    const { onError } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Une erreur est survenue lors du paiement'),
    );
  });

  it('calls onCancel when the cancel button is clicked', () => {
    vi.mocked(useStripe).mockReturnValue({ confirmPayment: vi.fn() } as never);
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
