import React from 'react';
import type { Order } from '../../types/order.types';
import { parsePrice, formatPrice } from '../../utils/price';

interface OrderSummaryProps {
  order: Order;
  className?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order, className = '' }) => {
  const category = order.ticketCategory ?? order.tickets?.[0]?.ticketCategory;
  const quantity = order.quantity ?? order.tickets?.length ?? 0;
  const totalAmount = parsePrice(order.totalAmount);

  return (
    <div className={`bg-neutral-100 dark:bg-neutral-700/50 rounded-lg p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Détails de la commande</h2>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Numéro de commande</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">#{order.id.slice(0, 8)}</span>
        </div>

        {category && (
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Catégorie</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{category.name}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Quantité</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {quantity} billet{quantity > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex justify-between pt-3 border-t border-neutral-200 dark:border-neutral-600">
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Total payé</span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatPrice(totalAmount)} €
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
