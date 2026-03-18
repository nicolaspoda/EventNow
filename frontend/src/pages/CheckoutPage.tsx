import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { orderService } from '../services/orderService';
import { stripeService } from '../services/stripeService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import Button from '../components/ui/Button';

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [initiating, setInitiating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);

  const bookingId = searchParams.get('bookingId');

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
        const stripeInstance = await loadStripe(publishableKey);
        setStripePromise(stripeInstance);

        const data = await orderService.initiatePayment(bookingId);
        setPaymentId(data.paymentId);
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Impossible d\'initialiser le paiement'));
      } finally {
        setInitiating(false);
      }
    };

    init();
  }, [bookingId]);

  const handlePaymentSuccess = async () => {
    if (!bookingId || !paymentId) {
      setError('Paramètres de paiement manquants');
      return;
    }

    try {
      const { order } = await orderService.confirmPayment(bookingId, paymentId);
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

  const appearance = useMemo(
    () => ({
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    }),
    []
  );

  const elementsOptions = useMemo(
    () => (clientSecret ? { clientSecret, appearance } : null),
    [clientSecret, appearance]
  );

  if (error && !bookingId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Erreur</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/events')}>
            Retour aux événements
          </Button>
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
          <svg
            className="mx-auto h-12 w-12 text-red-400 dark:text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Erreur</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Button variant="primary" onClick={() => navigate('/events')}>
            Retour aux événements
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Paiement sécurisé</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Entrez vos informations de paiement</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {clientSecret && stripePromise && elementsOptions && (
          <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
            <StripePaymentForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handleCancel}
            />
          </Elements>
        )}
      </div>
    </main>
  );
};

export default CheckoutPage;
