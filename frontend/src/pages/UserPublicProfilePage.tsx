import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile.service';
import { followService } from '../services/followService';
import { socketService } from '../services/socketService';
import type { PublicUserProfile } from '../services/profile.service';
import { useAuth } from '../utils/useAuth';
import { Card } from '../components/ui/Card';
import { ProfileStatsRow } from '../components/profile/ProfileStatsRow';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import { StarRating } from '../components/reviews/StarRating';
import Button from '../components/ui/Button';
import ReportModal from '../components/ReportModal';

export default function UserPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);

  const isOwnProfile = currentUser && userId === currentUser.id;
  const isFriend = profile?.isFriend === true;
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(() =>
    userId ? localStorage.getItem(`reported:user:${userId}`) === 'true' : false,
  );
  const [reportSuccessToast, setReportSuccessToast] = useState<string | null>(null);

  const refreshProfile = async () => {
    if (!userId) return;
    try {
      const data = await profileService.getUserPublicProfile(userId);
      setProfile(data);
    } catch {
      // keep previous state
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const data = await profileService.getUserPublicProfile(userId);
        setProfile(data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg || 'Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    // Rafraîchit les compteurs en direct si ce profil est le mien et que quelqu'un
    // vient de me suivre/ne plus me suivre (event émis uniquement vers ma propre room).
    if (!isOwnProfile) return;
    const handleFollowsChanged = () => refreshProfile();
    socketService.on('followsChanged', handleFollowsChanged);
    return () => {
      socketService.off('followsChanged', handleFollowsChanged);
    };
  }, [isOwnProfile]);

  const handleFollow = async () => {
    if (!userId || !currentUser || followLoading || profile?.isFollowing === undefined) return;
    setFollowLoading(true);
    try {
      await followService.follow(userId);
      await refreshProfile();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollowClick = () => {
    setConfirmUnfollow(true);
  };

  const handleConfirmUnfollow = async () => {
    if (!userId || !currentUser || followLoading) return;
    setFollowLoading(true);
    try {
      await followService.unfollow(userId);
      setConfirmUnfollow(false);
      await refreshProfile();
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (!reportSuccessToast) return;
    const t = setTimeout(() => setReportSuccessToast(null), 5000);
    return () => clearTimeout(t);
  }, [reportSuccessToast]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!profile) return <ErrorState message="Profil introuvable" />;

  const displayName = profile.username?.trim() || profile.email.split('@')[0];

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
              
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              {(typeof profile.followersCount === 'number' || typeof profile.followingCount === 'number' || typeof profile.friendsCount === 'number') && (
                <div className="mb-4">
                  <ProfileStatsRow
                    profileUserId={userId!}
                    currentUserId={currentUser?.id}
                    followersCount={profile.followersCount ?? 0}
                    followingCount={profile.followingCount ?? 0}
                    friendsCount={profile.friendsCount ?? 0}
                    onUpdate={refreshProfile}
                  />
                </div>
              )}
              {!isOwnProfile && currentUser && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {profile.isFollowing !== undefined && (
                    <>
                      {profile.isFollowing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleUnfollowClick}
                            disabled={followLoading}
                            aria-label={isFriend ? 'Ne plus suivre (vous ne serez plus amis)' : 'Ne plus suivre'}
                          >
                            {followLoading ? 'Chargement...' : isFriend ? 'Amis' : 'Abonné'}
                          </Button>
                          {confirmUnfollow && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                              <div
                                className="fixed inset-0 bg-black/50"
                                onClick={() => setConfirmUnfollow(false)}
                                aria-hidden="true"
                              />
                              <div className="relative z-10 bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
                                <p className="text-neutral-700 dark:text-neutral-200 mb-4">
                                  {isFriend
                                    ? 'Se désabonner ? Vous ne serez plus amis.'
                                    : 'Se désabonner ? Vous ne verrez plus les publications de cette personne.'}
                                </p>
                                <div className="flex gap-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => setConfirmUnfollow(false)}
                                    disabled={followLoading}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="primary"
                                    onClick={handleConfirmUnfollow}
                                    disabled={followLoading}
                                    className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                                  >
                                    {followLoading ? 'Chargement...' : 'Se désabonner'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={handleFollow}
                          disabled={followLoading}
                          aria-label="Suivre"
                        >
                          {followLoading ? 'Chargement...' : 'Suivre'}
                        </Button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    disabled={alreadyReported}
                    className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18M3 6l9-3 9 3v9l-9-3-9 3V6z" />
                    </svg>
                    {alreadyReported ? 'Signalé' : 'Signaler'}
                  </button>
                </div>
              )}

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

      {reportModalOpen && userId && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          type="USER"
          targetId={userId}
          targetName={displayName}
          onSuccess={(msg) => {
            localStorage.setItem(`reported:user:${userId}`, 'true');
            setAlreadyReported(true);
            setReportSuccessToast(msg);
          }}
          onAlreadyReported={() => {
            localStorage.setItem(`reported:user:${userId}`, 'true');
            setAlreadyReported(true);
          }}
        />
      )}

      {reportSuccessToast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-success-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          {reportSuccessToast}
        </div>
      )}
    </div>
  );
}
