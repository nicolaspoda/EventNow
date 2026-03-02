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
  if (totalReviews === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Aucun avis pour le moment
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <StarRating value={Math.round(average)} readonly size={size} />
      <div className="text-sm text-gray-600">
        <span className="font-semibold text-lg">{average.toFixed(1)}</span>
        <span className="ml-1">({totalReviews} avis)</span>
      </div>
    </div>
  );
};
