import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { stripeService } from '../services/stripeService';
import { orderService } from '../services/orderService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import LoadingState from '../components/ui/LoadingState';
import Button from '../components/ui/Button';

const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      const clientSecret = searchParams.get('payment_intent_client_secret');
      const bookingId = searchParams.get('bookingId');

      if (!clientSecret) {
        setError('Paramètres de paiement manquants');
        setLoading(false);
        return;
      }

      try {
        const publishableKey = await stripeService.getPublishableKey();
        const stripe = await loadStripe(publishableKey);

        if (!stripe) {
          setError('Impossible de charger Stripe');
          setLoading(false);
          return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (!paymentIntent) {
          setError('Impossible de récupérer les informations de paiement');
          setLoading(false);
          return;
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            if (bookingId) {
              try {
                const { order } = await orderService.confirmPayment(bookingId, paymentIntent.id);
                navigate(`/orders/${order.id}/success`, { replace: true });
                return;
              } catch (err) {
                console.error('Error confirming payment:', err);
                setError(getApiErrorMessage(err, 'Erreur lors de la confirmation de commande'));
              }
            } else {
              setSuccess(true);
            }
            break;

          case 'processing':
            setError('Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.');
            break;

          case 'requires_payment_method':
            setError('Le paiement a échoué. Veuillez réessayer avec un autre moyen de paiement.');
            break;

          case 'requires_action':
            setError('Une action supplémentaire est requise pour compléter votre paiement.');
            break;

          default:
            setError('Statut de paiement inattendu. Veuillez contacter le support.');
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Erreur lors de la vérification du paiement'));
      } finally {
        setLoading(false);
      }
    };

    handlePaymentReturn();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <LoadingState />
          <p className="text-neutral-600 dark:text-neutral-400 mt-4">
            Vérification de votre paiement...
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Paiement réussi !
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Votre paiement a été confirmé avec succès
          </p>
          <Button variant="primary" onClick={() => navigate('/my-tickets')}>
            Voir mes billets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Problème de paiement
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" onClick={() => navigate('/events')}>
            Retour aux événements
          </Button>
          <Button variant="ghost" onClick={() => navigate('/my-tickets')}>
            Voir mes billets
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturnPage;
