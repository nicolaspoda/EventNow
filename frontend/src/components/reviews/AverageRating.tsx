import React from 'react';
import { StarRating } from './StarRating';

interface AverageRatingProps {
  average: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
}

export const AverageRating: React.FC<AverageRatingProps> = ({
  average,
  totalReviews,
  size = 'md',
}) => {
  const safeAverage = Number.isFinite(average) ? average : 0;
  const safeTotal = Number.isFinite(totalReviews) ? Math.max(0, Math.floor(totalReviews)) : 0;

  if (safeTotal === 0) {
    return (
      <div className="text-neutral-500 dark:text-neutral-400 text-sm">
        Aucun avis pour le moment
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <StarRating value={Math.round(safeAverage)} readonly size={size} />
      <div className="text-sm text-neutral-600 dark:text-neutral-300">
        <span className="font-semibold text-lg">{safeAverage.toFixed(1)}</span>
        <span className="ml-1">({safeTotal} avis)</span>
      </div>
    </div>
  );
};
