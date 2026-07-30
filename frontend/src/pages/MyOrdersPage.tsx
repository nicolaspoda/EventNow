import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import type { Order } from '../types/order.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import OrderCard from '../components/orders/OrderCard';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger vos commandes'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewTickets = (orderId: string) => {
    void orderId;
    navigate('/my-tickets');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Mes commandes</h1>
          <LoadingState message="Chargement de vos commandes..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Mes commandes</h1>
          <ErrorState message={error} onRetry={fetchOrders} />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Mes commandes</h1>
          <EmptyState
            icon={
              <svg
                className="mx-auto h-16 w-16 text-neutral-400 dark:text-neutral-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            }
            title="Aucune commande"
            message="Vous n'avez pas encore effectué de commande. Découvrez nos événements !"
            actionLabel="Découvrir les événements"
            onAction={() => navigate('/events')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Mes commandes</h1>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/my-tickets')}>
              Voir mes billets
            </Button>
            <Button variant="ghost" onClick={() => navigate('/events')}>
              ← Retour aux événements
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewTickets={handleViewTickets}
              onCancelSuccess={fetchOrders}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
