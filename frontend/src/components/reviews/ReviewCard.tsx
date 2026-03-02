import React from 'react';
import { StarRating } from './StarRating';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    email: string;
  };
}

interface ReviewCardProps {
  review: Review;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              {review.user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{review.user.email}</p>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <StarRating value={review.rating} readonly size="sm" />
        </div>

        {isOwner && (
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>

      {review.comment && (
        <p className="text-gray-700 mt-3 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
};
