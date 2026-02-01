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
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);

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

  const handleViewTickets = (_orderId: string) => {
    navigate('/my-tickets');
  };

  const handleRequestRefund = async (orderId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir demander un remboursement pour cette commande ?')) {
      return;
    }

    try {
      setRefundingOrderId(orderId);
      await orderService.requestRefund(orderId);
      alert('Demande de remboursement effectuée avec succès');
      fetchOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la demande de remboursement'));
    } finally {
      setRefundingOrderId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes commandes</h1>
          <LoadingState message="Chargement de vos commandes..." />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes commandes</h1>
          <ErrorState message={error} onRetry={fetchOrders} />
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes commandes</h1>
          <EmptyState
            icon={
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes commandes</h1>
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
              onRequestRefund={refundingOrderId === order.id ? undefined : handleRequestRefund}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default MyOrdersPage;
