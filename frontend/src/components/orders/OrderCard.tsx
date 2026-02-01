import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Order } from '../../types/order.types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface OrderCardProps {
  order: Order;
  onViewTickets?: (orderId: string) => void;
  onRequestRefund?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewTickets, onRequestRefund }) => {
  const category = order.ticketCategory ?? order.tickets?.[0]?.ticketCategory;
  const quantity = order.quantity ?? order.tickets?.length ?? 0;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Payée</Badge>;
      case 'PENDING':
        return <Badge variant="warning">En attente</Badge>;
      case 'REFUNDED':
        return <Badge variant="error">Remboursée</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const canRequestRefund = order.status === 'PAID' && category;
  const hasTickets = order.status === 'PAID';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Commande #{order.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-600">
            {format(new Date(order.createdAt), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {category && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {category.name}
          </p>
          {category.description && (
            <p className="text-sm text-gray-600">{category.description}</p>
          )}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quantité</span>
          <span className="font-medium text-gray-900">{quantity} billet{quantity > 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Prix unitaire</span>
          <span className="font-medium text-gray-900">
            {category ? Number(category.price).toFixed(2) : (quantity ? (Number(order.totalAmount) / quantity).toFixed(2) : '0.00')} €
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-blue-600">{Number(order.totalAmount).toFixed(2)} €</span>
        </div>
      </div>

      {(hasTickets || canRequestRefund) && (
        <div className="flex gap-2">
          {hasTickets && onViewTickets && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onViewTickets(order.id)}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Voir mes billets
            </Button>
          )}
          {canRequestRefund && onRequestRefund && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestRefund(order.id)}
              className="flex-1"
            >
              Demander un remboursement
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
