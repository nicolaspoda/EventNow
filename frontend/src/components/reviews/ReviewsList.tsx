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
  refreshTrigger?: number;
  onReviewsLoaded?: (stats: { averageRating: number | null; totalReviews: number }) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ eventId, refreshTrigger, onReviewsLoaded }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number | null;
    totalReviews: number;
  }>({ averageRating: null, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const toSortBy = (value: string): 'recent' | 'highest' | 'lowest' =>
    value === 'highest' || value === 'lowest' ? value : 'recent';

  useEffect(() => {
    fetchReviews();
  }, [eventId, sortBy, refreshTrigger]);

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
      console.error('Erreur chargement avis:', getApiErrorMessage(error, 'Impossible de charger les avis'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 mx-auto mb-4" />
        <p className="text-neutral-600 dark:text-neutral-300">Chargement des avis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Avis des participants</h3>
        <AverageRating
          average={stats.averageRating || 0}
          totalReviews={stats.totalReviews}
          size="lg"
        />
      </div>

      {stats.totalReviews > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-neutral-600 dark:text-neutral-300">{stats.totalReviews} avis</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(toSortBy(e.target.value))}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
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
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          Aucun avis pour le moment. Soyez le premier à donner votre avis !
        </div>
      )}
    </div>
  );
};
