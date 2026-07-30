import React from 'react';

interface EventStatusBadgeProps {
  status: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({
  status,
}) => {
  const statusConfig: Record<
    string,
    { label: string; color: string; ariaLabel: string }
  > = {
    ON_SALE: {
      label: 'En vente',
      color: 'bg-blue-100 text-blue-800',
      ariaLabel: 'Statut: En vente',
    },
    UPCOMING: {
      label: 'Bientôt',
      color: 'bg-yellow-100 text-yellow-800',
      ariaLabel: 'Statut: Bientôt',
    },
    ALMOST_FULL: {
      label: 'Presque complet',
      color: 'bg-orange-100 text-orange-800',
      ariaLabel: 'Statut: Presque complet',
    },
    ONGOING: {
      label: 'En cours',
      color: 'bg-green-100 text-green-800',
      ariaLabel: 'Statut: En cours',
    },
    SOLD_OUT: {
      label: 'Complet',
      color: 'bg-red-100 text-red-800',
      ariaLabel: 'Statut: Complet',
    },
    COMPLETED: {
      label: 'Terminé',
      color: 'bg-gray-100 text-gray-800',
      ariaLabel: 'Statut: Terminé',
    },
    CANCELLED: {
      label: 'ANNULÉ',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
      ariaLabel: 'Statut: Annulé',
    },
  };

  const config = statusConfig[status] || statusConfig.ON_SALE;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      {config.label}
    </span>
  );
};
