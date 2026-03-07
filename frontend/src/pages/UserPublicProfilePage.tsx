import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile.service';
import type { PublicUserProfile } from '../services/profile.service';
import { Card } from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import { StarRating } from '../components/reviews/StarRating';
import Button from '../components/ui/Button';

export default function UserPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const data = await profileService.getUserPublicProfile(userId);
        setProfile(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!profile) return <ErrorState message="Profil introuvable" />;

  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.email.split('@')[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            aria-label="Retour à la page précédente"
          >
            ← Retour
          </Button>
        </div>

        {/* En-tête du profil */}
        <Card className="mb-8 p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {displayName}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.participatedEventsCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Événements participés
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.stats.averageRating?.toFixed(1) || 'N/A'}
                    </div>
                    {profile.stats.averageRating && (
                      <StarRating value={profile.stats.averageRating} readonly size="sm" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Note moyenne
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.stats.totalReviews}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avis reçus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Avis reçus */}
        {profile.participantReviews.length > 0 && (
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Avis reçus ({profile.participantReviews.length})
            </h2>
            
            <div className="space-y-4">
              {profile.participantReviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating value={review.rating} readonly size="sm" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Par {review.reviewerName}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  
                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300 mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Événements participés */}
        {profile.participatedEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Événements participés ({profile.participatedEvents.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.participatedEvents.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    {event.imageUrl && (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {event.location}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(event.eventDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {profile.participatedEvents.length === 0 && profile.participantReviews.length === 0 && (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Aucune activité pour le moment
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
