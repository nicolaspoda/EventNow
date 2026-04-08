import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../ui/Button';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  bookingId?: string;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onError,
  onCancel,
  bookingId,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const returnUrl = bookingId 
        ? `${window.location.origin}/payment/success?bookingId=${bookingId}`
        : `${window.location.origin}/payment/success`;

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'always',
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          onError(error.message || 'Erreur de validation de la carte');
        } else if (error.type === 'authentication_error') {
          onError('Échec de l\'authentification bancaire. Veuillez réessayer.');
        } else {
          onError(error.message || 'Erreur lors du paiement');
        }
        setProcessing(false);
      } else {
        // En mode "always", Stripe redirige vers return_url pour finaliser l'etat du paiement.
        // Le traitement du resultat se fait sur la page de retour.
      }
    } catch {
      onError('Une erreur est survenue lors du paiement');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          wallets: {
            applePay: 'never',
            googlePay: 'never',
          },
          terms: {
            card: 'auto',
          },
        }}
      />

      <div className="space-y-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || processing}
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

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={processing}
          className="w-full"
        >
          Annuler
        </Button>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Vos informations de paiement sont sécurisées et cryptées par Stripe
      </p>
    </form>
  );
};

export default StripePaymentForm;
