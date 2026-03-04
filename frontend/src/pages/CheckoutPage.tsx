import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import Button from '../components/ui/Button';

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [initiating, setInitiating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (!bookingId) {
      setError('Paramètres de paiement manquants');
      setInitiating(false);
      return;
    }

    const init = async () => {
      try {
        setInitiating(true);
        setError(null);
        const data = await orderService.initiatePayment(bookingId);
        setPaymentId(data.paymentId);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Impossible d\'initialiser le paiement'));
      } finally {
        setInitiating(false);
      }
    };

    init();
  }, [bookingId]);

  const handleConfirmPayment = async () => {
    if (!bookingId || !paymentId) {
      setError('Paramètres de paiement manquants');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simuler un délai de traitement du paiement
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { order } = await orderService.confirmPayment(bookingId, paymentId);

      // Rediriger vers la page de succès avec l'ID de la commande créée
      navigate(`/orders/${order.id}/success`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du paiement'));
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

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

  if (error && !paymentId) {
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
          <p className="text-neutral-600 dark:text-neutral-400">Confirmez votre paiement pour finaliser votre commande</p>
        </div>

        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-primary-800 dark:text-primary-300">
            <strong>Note :</strong> Ceci est un environnement de test. Aucun paiement réel ne sera effectué.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={handleConfirmPayment}
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Traitement du paiement...
              </span>
            ) : (
              'Confirmer le paiement'
            )}
          </Button>

          <Button variant="ghost" onClick={handleCancel} disabled={processing} className="w-full">
            Annuler
          </Button>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
          Vos informations de paiement sont sécurisées et cryptées
        </p>
      </div>
    </main>
  );
};

export default CheckoutPage;
