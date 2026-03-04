import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import type { OrderWithUser } from '../types/order.types';
import { formatPrice } from '../utils/price';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { safeFormat } from '../utils/date';

export const RefundRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getRefundRequests();
      setOrders(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les demandes de remboursement'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    try {
      setActionOrderId(orderId);
      await orderService.approveRefund(orderId);
      await fetchRequests();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de l\'approbation du remboursement'));
    } finally {
      setActionOrderId(null);
    }
  };

  const handleReject = async (orderId: string) => {
    if (!window.confirm('Refuser cette demande de remboursement ? La commande restera payée.')) {
      return;
    }
    try {
      setActionOrderId(orderId);
      await orderService.rejectRefund(orderId);
      await fetchRequests();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors du refus'));
    } finally {
      setActionOrderId(null);
    }
  };

  const getEventTitle = (order: OrderWithUser): string => {
    const event = order.tickets?.[0]?.ticketCategory?.event;
    return (event as { title?: string } | undefined)?.title ?? '—';
  };

  const getUserLabel = (order: OrderWithUser): string => {
    const u = order.user;
    if (!u) return order.userId.slice(0, 8);
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return name.trim() || u.email;
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Demandes de remboursement</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Chargement...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">Demandes de remboursement</h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
          <button
            type="button"
            onClick={() => fetchRequests()}
            className="mt-4 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Demandes de remboursement</h1>
          <button
            type="button"
            onClick={() => navigate('/dashboard/organizer')}
            className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
          >
            ← Retour au tableau de bord
          </button>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Commandes pour lesquelles un client a demandé un remboursement. Vous pouvez approuver (remboursement effectif) ou refuser.
        </p>

        {orders.length === 0 ? (
          <div className="glass-card p-8 text-center text-neutral-500 dark:text-neutral-400">
            Aucune demande de remboursement en attente.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="glass-card p-6 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Commande #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Événement : {getEventTitle(order)}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Client : {getUserLabel(order)}
                    {order.user?.email && (
                      <span className="text-neutral-500 dark:text-neutral-500"> — {order.user.email}</span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Date : {safeFormat(order.createdAt, "d MMM yyyy 'à' HH'h'mm")} — Total : {formatPrice(order.totalAmount)} €
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(order.id)}
                    disabled={actionOrderId !== null}
                    className="px-4 py-2 bg-green-600 dark:bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionOrderId === order.id ? 'Traitement...' : 'Approuver le remboursement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(order.id)}
                    disabled={actionOrderId !== null}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-500 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
