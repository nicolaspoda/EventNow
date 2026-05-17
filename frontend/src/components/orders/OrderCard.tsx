import React from 'react';
import { safeFormat } from '../../utils/date';
import { parsePrice, formatPrice } from '../../utils/price';
import type { Order } from '../../types/order.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import CancelOrderButton from './CancelOrderButton';

interface OrderCardProps {
  order: Order;
  onViewTickets?: (orderId: string) => void;
  onCancelSuccess?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewTickets, onCancelSuccess }) => {
  const category = order.ticketCategory ?? order.tickets?.[0]?.ticketCategory;
  const quantity = order.quantity ?? order.tickets?.length ?? 0;
  const eventDate = order.tickets?.[0]?.ticketCategory?.event?.eventDate;
  const isEventCancelled = !!(order.tickets?.[0]?.ticketCategory?.event as ({ cancelledAt?: string | null } | undefined))?.cancelledAt;

  const categoryPrice = parsePrice(category?.price);
  const totalAmount = parsePrice(order.totalAmount);

  const getStatusBadge = (status: Order['status']) => {
    if (isEventCancelled) {
      return <Badge variant="error">ANNULÉ</Badge>;
    }
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Payée</Badge>;
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'REFUNDED':
        return <Badge variant="info">Remboursée</Badge>;
      case 'REFUND_REQUESTED':
        return <Badge variant="warning">Remboursement demandé</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const hasTickets = order.status === 'PAID' && !isEventCancelled;
  const canCancel = order.status === 'PAID' && !isEventCancelled;

  return (
    <div className="glass-card p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            Commande #{order.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {safeFormat(order.createdAt, "d MMMM yyyy 'à' HH'h'mm")}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {category && (
        <div className="mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">{category.name}</p>
          {category.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{category.description}</p>
          )}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">Quantité</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {quantity} billet{quantity > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">Prix unitaire</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {category
              ? formatPrice(categoryPrice)
              : quantity
                ? formatPrice(totalAmount / quantity)
                : '0.00'}{' '}
            €
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <span className="text-neutral-900 dark:text-neutral-100">Total</span>
          <span className="text-primary-600 dark:text-primary-400">{formatPrice(totalAmount)} €</span>
        </div>
      </div>

      {isEventCancelled && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <p className="text-sm font-semibold text-error-800 dark:text-error-200 mb-1">Événement annulé</p>
          <p className="text-sm text-error-700 dark:text-error-300">
            {order.status === 'REFUNDED'
              ? `Remboursement de ${formatPrice(totalAmount)} € initié. Comptez 5 à 10 jours ouvrés.`
              : 'Le remboursement sera traité automatiquement sous 5 à 10 jours ouvrés.'}
          </p>
        </div>
      )}

      {!isEventCancelled && order.status === 'REFUNDED' && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
          <p className="text-sm font-semibold text-primary-900 dark:text-primary-200 mb-1">Commande remboursée</p>
          <p className="text-sm text-primary-800 dark:text-primary-300">
            Le montant de{' '}
            <strong>{formatPrice(totalAmount)} €</strong> sera recrédité sur
            votre compte sous 5 à 10 jours ouvrés.
          </p>
        </div>
      )}

      {(hasTickets || canCancel) && (
        <div className="flex gap-2">
          {hasTickets && onViewTickets && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onViewTickets(order.id)}
              className="flex-1"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              Voir mes billets
            </Button>
          )}
          {canCancel && onCancelSuccess && (
            <CancelOrderButton
              orderId={order.id}
              eventDate={eventDate!}
              onSuccess={onCancelSuccess}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
