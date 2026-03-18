import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../ui/Button';

interface StripePaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  onSuccess,
  onError,
  onCancel,
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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment/success',
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Erreur lors du paiement');
        setProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err) {
      onError('Une erreur est survenue lors du paiement');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-primary-800 dark:text-primary-300">
          <strong>Mode test :</strong> Utilisez la carte 4242 4242 4242 4242 avec n'importe quelle date future et CVC.
        </p>
      </div>

      <PaymentElement />

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
