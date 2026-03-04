import React from 'react';
import type { EventTypeCreate } from '../../types/event.types';

interface EventTypeBadgeProps {
  type: EventTypeCreate;
}

const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({ type }) => {
  if (type === 'COMMUNITY') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 dark:bg-success-700 text-success-800 dark:text-white ring-1 ring-inset ring-success-500/20 dark:ring-success-400/50">
        Communautaire
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-600 text-primary-800 dark:text-white ring-1 ring-inset ring-primary-600/20 dark:ring-primary-500/50">
      Professionnel
    </span>
  );
};

export default EventTypeBadge;
