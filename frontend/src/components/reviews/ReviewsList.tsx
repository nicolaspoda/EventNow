import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/reviewService';
import { ReviewCard } from './ReviewCard';
import { AverageRating } from './AverageRating';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    email: string;
  };
}

interface ReviewsListProps {
  eventId: string;
  onReviewsLoaded?: (stats: { averageRating: number | null; totalReviews: number }) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ eventId, onReviewsLoaded }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');

  useEffect(() => {
    fetchReviews();
  }, [eventId, sortBy]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewService.getEventReviews(eventId, 1, 10, sortBy);
      setReviews(data.reviews);
      setStats(data.stats);
      if (onReviewsLoaded) {
        onReviewsLoaded(data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement avis:', getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des avis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Avis des participants</h3>
        <AverageRating
          average={stats.averageRating || 0}
          totalReviews={stats.totalReviews}
          size="lg"
        />
      </div>

      {stats.totalReviews > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-600">{stats.totalReviews} avis</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="recent">Plus récents</option>
            <option value="highest">Mieux notés</option>
            <option value="lowest">Moins bien notés</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {stats.totalReviews === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun avis pour le moment. Soyez le premier à donner votre avis !
        </div>
      )}
    </div>
  );
};
