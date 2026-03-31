import { useEffect, useState } from 'react';
import { useAuth } from '../../utils/useAuth';
import { authService } from '../../services/auth.service';
import participantReviewService from '../../services/participantReviewService';
import { StarRating } from '../reviews/StarRating';

interface UserRatingBadgeProps {
  userId: string;
}

export function UserRatingBadge({ userId }: UserRatingBadgeProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    averageRating: number | null;
    totalReviews: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      const token = authService.getAccessToken();
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        const data = await participantReviewService.getReviewsByParticipant(token, userId);
        setStats(data.stats);
      } catch (err) {
        console.error('Erreur lors du chargement de la note:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRating();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
        —
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
        Aucun avis
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-1">
        <StarRating value={stats.averageRating || 0} readonly size="sm" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {stats.averageRating?.toFixed(1)}
        </span>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-500">
        ({stats.totalReviews} {stats.totalReviews === 1 ? 'avis' : 'avis'})
      </span>
    </div>
  );
}
