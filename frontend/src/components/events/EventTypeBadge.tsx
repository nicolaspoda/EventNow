import React from 'react';
import type { EventTypeCreate } from '../../types/event.types';

interface EventTypeBadgeProps {
  type: EventTypeCreate;
}

const EventTypeBadge: React.FC<EventTypeBadgeProps> = ({ type }) => {
  if (type === 'COMMUNITY') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Communautaire
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
      Professionnel
    </span>
  );
};

export default EventTypeBadge;
