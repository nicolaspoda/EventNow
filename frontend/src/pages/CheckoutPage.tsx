import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { orderService } from '../services/orderService';
import { stripeService } from '../services/stripeService';
import { promoCodesService } from '../services/promoCodesService';
import type { ValidatePromoCodeResponse } from '../services/promoCodesService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import Button from '../components/ui/Button';
import { useTheme } from '../contexts/ThemeContext';

const CheckoutPage: React.FC = () => {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [initiating, setInitiating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [originalAmount, setOriginalAmount] = useState<number | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoResult, setPromoResult] = useState<ValidatePromoCodeResponse | null>(null);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);

  const bookingId = searchParams.get('bookingId');
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (!bookingId) {
          setError('Paramètres de paiement manquants');
          setInitiating(false);
          return;
        }

        setInitiating(true);
        setError(null);

        const publishableKey = await stripeService.getPublishableKey();
        if (!stripePromiseRef.current) {
          stripePromiseRef.current = loadStripe(publishableKey);
          setStripePromise(stripePromiseRef.current);
        }

        const data = await orderService.initiatePayment(bookingId);

        if (data.free && data.orderId) {
          navigate(`/orders/${data.orderId}/success`);
          return;
        }

        setPaymentId(data.paymentId ?? null);
        setClientSecret(data.clientSecret ?? null);
        setOriginalAmount(data.originalAmount ?? data.amount);
        setEventId(data.eventId ?? null);
      } catch (err) {
        setError(getApiErrorMessage(err, "Impossible d'initialiser le paiement"));
      } finally {
        setInitiating(false);
      }
    };

    init();
  }, [bookingId]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !eventId || originalAmount === null) return;

    setPromoValidating(true);
    setPromoError(null);
    setPromoResult(null);
    setPromoCodeId(null);

    try {
      const result = await promoCodesService.validatePromoCode(
        promoInput.trim().toUpperCase(),
        eventId,
        originalAmount,
      );
      setPromoResult(result);
      setPromoCodeId(result.promoCode.id);

      // Re-initiate payment with discounted amount
      const data = await orderService.initiatePayment(bookingId!, result.promoCode.id);

      if (data.free && data.orderId) {
        navigate(`/orders/${data.orderId}/success`);
        return;
      }

      setPaymentId(data.paymentId ?? null);
      setClientSecret(data.clientSecret ?? null);
    } catch (err) {
      setPromoError(getApiErrorMessage(err, 'Code promo invalide'));
    } finally {
      setPromoValidating(false);
    }
  };

  const handleRemovePromo = async () => {
    setPromoResult(null);
    setPromoCodeId(null);
    setPromoInput('');
    setPromoError(null);

    // Re-initiate payment without promo code
    try {
      const data = await orderService.initiatePayment(bookingId!);
      setPaymentId(data.paymentId ?? null);
      setClientSecret(data.clientSecret ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de réinitialiser le paiement"));
    }
  };

  const handlePaymentSuccess = async () => {
    if (!bookingId || !paymentId) {
      setError('Paramètres de paiement manquants');
      return;
    }

    try {
      const { order } = await orderService.confirmPayment(
        bookingId,
        paymentId,
        promoCodeId ?? undefined,
      );
      navigate(`/orders/${order.id}/success`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la confirmation de commande'));
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleCancel = () => {
    navigate('/events');
  };

  const appearance = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: isDark ? '#111827' : '#ffffff',
        colorText: isDark ? '#f3f4f6' : '#1f2937',
        colorDanger: '#ef4444',
        colorTextSecondary: isDark ? '#9ca3af' : '#6b7280',
        colorIcon: isDark ? '#9ca3af' : '#6b7280',
        colorBorder: isDark ? '#374151' : '#d1d5db',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    };
  }, [theme]);

  const elementsOptions = useMemo(
    () => (clientSecret ? { clientSecret, appearance } : null),
    [clientSecret, appearance],
  );

  if (error && !bookingId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Erreur</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/events')}>Retour aux événements</Button>
        </div>
      </main>
    );
  }

  if (initiating) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Préparation du paiement...</p>
        </div>
      </main>
    );
  }

  if (error && !clientSecret) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Erreur</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/events')}>Retour aux événements</Button>
        </div>
      </main>
    );
  }

  const displayAmount = promoResult ? promoResult.finalAmount : (originalAmount ?? 0);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Paiement sécurisé</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Entrez vos informations de paiement</p>
        </div>

        {/* Amount display */}
        {originalAmount !== null && (
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
            {promoResult ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-neutral-500 dark:text-neutral-400">
                  <span>Montant original</span>
                  <span>{originalAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
                  <span>Code {promoResult.promoCode.code} appliqué</span>
                  <span>-{promoResult.discountAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Total</span>
                  <span>{displayAmount.toFixed(2)} €</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between font-medium text-neutral-900 dark:text-neutral-100">
                <span>Total</span>
                <span>{displayAmount.toFixed(2)} €</span>
              </div>
            )}
          </div>
        )}

        {/* Promo code section */}
        {eventId && originalAmount !== null && (
          <div className="mb-6">
            {promoResult ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    Code <strong>{promoResult.promoCode.code}</strong> appliqué — -{promoResult.discountAmount.toFixed(2)} € → Total : {promoResult.finalAmount.toFixed(2)} €
                  </span>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="ml-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  aria-label="Supprimer le code promo"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="promo-code-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Code promo (optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    placeholder="EX: SUMMER20"
                    className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={promoValidating}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    disabled={!promoInput.trim() || promoValidating}
                  >
                    {promoValidating ? '...' : 'Appliquer'}
                  </Button>
                </div>
                {promoError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{promoError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {clientSecret && stripePromise && elementsOptions && (
          <Elements key={`${clientSecret}-${theme}`} stripe={stripePromise} options={elementsOptions}>
            <StripePaymentForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handleCancel}
              bookingId={bookingId || undefined}
            />
          </Elements>
        )}
      </div>
    </main>
  );
};

export default CheckoutPage;
