import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import OrderSummary from '../components/orders/OrderSummary';

const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('ID de commande manquant');
        setLoading(false);
        return;
      }

      try {
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Impossible de récupérer les détails de la commande'));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </main>
    );
  }

  if (error || !order) {
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
      <div className="max-w-2xl w-full glass-card p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
            <svg
              className="h-10 w-10 text-green-600 dark:text-green-400"
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Paiement réussi !</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Votre commande a été confirmée et vos billets sont prêts
          </p>
        </div>

        <OrderSummary order={order} className="mb-6" />

        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg
              className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h2 className="text-sm font-medium text-primary-900 dark:text-primary-200 mb-1">Prochaines étapes</h2>
              <p className="text-sm text-primary-800 dark:text-primary-300">
                Vos billets avec QR codes sont maintenant disponibles dans votre espace "Mes billets".
                Présentez-les à l'entrée de l'événement pour validation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/my-tickets')}
            className="flex-1"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
            Voir mes billets
          </Button>
          <Button variant="ghost" onClick={() => navigate('/events')} className="flex-1">
            Retour aux événements
          </Button>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-6">
          Un email de confirmation a été envoyé à votre adresse
        </p>
      </div>
    </main>
  );
};

export default OrderSuccessPage;
