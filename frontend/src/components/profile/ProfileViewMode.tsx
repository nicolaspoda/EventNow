import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PublicUserProfile } from '../../services/profile.service';
import { followService } from '../../services/followService';
import { useAuth } from '../../utils/useAuth';
import Button from '../ui/Button';
import { ProfileStatsRow } from './ProfileStatsRow';
import { StarRating } from '../reviews/StarRating';
import ReportModal from '../ReportModal';

const roleLabels: Record<string, string> = {
  USER: 'Utilisateur',
  ORGANIZER: 'Organisateur',
  STAFF: 'Staff',
};

const roleColors: Record<string, string> = {
  USER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ORGANIZER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  STAFF: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

function formatDate(dateValue?: string | null) {
  if (!dateValue) return 'N/A';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return 'N/A';
  }
}

export function ProfileViewMode({ profile, userId, onProfileUpdate }: { profile: PublicUserProfile; userId: string; onProfileUpdate?: () => Promise<void> }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [followLoading, setFollowLoading] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(
    () => localStorage.getItem(`reported:user:${userId}`) === 'true',
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isOwnProfile = currentUser && userId === currentUser.id;
  const showFollowButton = !isOwnProfile && currentUser && localProfile.isFollowing !== undefined;
  const notificationsOn = localProfile.notificationsEnabled !== false;
  const isFriend = localProfile.isFriend === true;

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 5000);
    return () => clearTimeout(t);
  }, [successToast]);

  const handleFollow = async () => {
    if (!currentUser || followLoading || localProfile.isFollowing === undefined) return;
    setFollowLoading(true);
    try {
      await followService.follow(userId);
      if (onProfileUpdate) await onProfileUpdate();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollowClick = () => {
    setConfirmUnfollow(true);
  };

  const handleConfirmUnfollow = async () => {
    if (!currentUser || followLoading) return;
    setFollowLoading(true);
    try {
      await followService.unfollow(userId);
      setConfirmUnfollow(false);
      if (onProfileUpdate) await onProfileUpdate();
    } finally {
      setFollowLoading(false);
    }
  };

  const displayName = localProfile.username?.trim() || localProfile.email.split('@')[0];
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="sr-only">Profil de {displayName}</h1>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>← Retour</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5">
            <div className="flex flex-col items-center">
              {localProfile.avatarUrl ? (
                <img src={localProfile.avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-primary-600 dark:text-primary-400">{initials}</span>
                </div>
              )}
              <h2 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{displayName}</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-2">{localProfile.email}</p>
              {localProfile.role && (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[localProfile.role] || ''}`}>
                  {roleLabels[localProfile.role] || localProfile.role}
                </span>
              )}
              {(typeof localProfile.followersCount === 'number' || typeof localProfile.followingCount === 'number' || typeof localProfile.friendsCount === 'number') && (
                <ProfileStatsRow
                  profileUserId={userId}
                  currentUserId={currentUser?.id}
                  followersCount={localProfile.followersCount ?? 0}
                  followingCount={localProfile.followingCount ?? 0}
                  friendsCount={localProfile.friendsCount ?? 0}
                  onUpdate={onProfileUpdate}
                />
              )}
              {showFollowButton && (
                <div className="mt-3 space-y-2">
                  {localProfile.isFollowing ? (
                    <>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                          {isFriend ? 'Amis' : 'Suivi(e)'}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser || followLoading) return;
                            setFollowLoading(true);
                            try {
                              const next = !notificationsOn;
                              await followService.setNotifications(userId, next);
                              setLocalProfile((p) => ({ ...p, notificationsEnabled: next }));
                            } catch {
                              await onProfileUpdate?.();
                            } finally {
                              setFollowLoading(false);
                            }
                          }}
                          disabled={followLoading}
                          title={notificationsOn ? 'Désactiver les notifications d\'événements' : 'Activer les notifications d\'événements'}
                          aria-label={notificationsOn ? 'Désactiver les notifications' : 'Activer les notifications'}
                          className={`p-2 rounded-full transition-colors disabled:opacity-50 ${
                            notificationsOn
                              ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {notificationsOn ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUnfollowClick}
                        disabled={followLoading}
                        className="w-full text-neutral-600 dark:text-neutral-400 hover:text-error-600 dark:hover:text-error-400"
                        aria-label={isFriend ? 'Ne plus suivre (vous ne serez plus amis)' : 'Ne plus suivre'}
                      >
                        Ne plus suivre
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
                      size="sm"
                      onClick={handleFollow}
                      disabled={followLoading}
                      aria-label="Suivre"
                    >
                      {followLoading ? 'Chargement...' : 'Suivre'}
                    </Button>
                  )}
                </div>
              )}
              {!isOwnProfile && currentUser && (
                <div className="mt-3 w-full flex justify-center">
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

              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 w-full text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Membre depuis</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">{formatDate(localProfile.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Événements participés</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{localProfile.stats.participatedEventsCount}</span>
              </div>
              {localProfile.stats.totalReviews > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Note reçue (participant)</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {localProfile.stats.averageRating != null ? `${localProfile.stats.averageRating}/5` : '—'} ({localProfile.stats.totalReviews} avis)
                  </span>
                </div>
              )}
              {(localProfile.stats.totalReviewsOnMyEvents ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Note sur ses événements</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {localProfile.stats.averageRatingOnMyEvents != null ? `${localProfile.stats.averageRatingOnMyEvents}/5` : '—'} ({localProfile.stats.totalReviewsOnMyEvents} avis)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Informations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Nom d'utilisateur</p>
                <p className="text-neutral-900 dark:text-neutral-100">{localProfile.username || '—'}</p>
              </div>
              <div>
                <p className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Email</p>
                <p className="text-neutral-900 dark:text-neutral-100 text-sm truncate">{localProfile.email}</p>
              </div>
              {localProfile.role && (
                <div>
                  <p className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rôle</p>
                  <p className="text-neutral-900 dark:text-neutral-100">{roleLabels[localProfile.role] || localProfile.role}</p>
                </div>
              )}
            </div>
          </div>
          {localProfile.participantReviews.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Avis reçus ({localProfile.participantReviews.length})</h3>
              <div className="space-y-4">
                {localProfile.participantReviews.map((review) => (
                  <div key={review.id} className="border-b border-neutral-200 dark:border-neutral-700 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={review.rating} readonly size="sm" />
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{review.rating}/5</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Par {review.reviewerName}</p>
                    {review.comment && <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-2">{review.comment}</p>}
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{formatDate(review.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {localProfile.participatedEvents.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Événements participés</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {localProfile.participatedEvents.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`} className="block p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{event.title}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatDate(event.eventDate)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          type="USER"
          targetId={userId}
          targetName={localProfile.username?.trim() || localProfile.email.split('@')[0]}
          onSuccess={(msg) => {
            localStorage.setItem(`reported:user:${userId}`, 'true');
            setAlreadyReported(true);
            setSuccessToast(msg);
          }}
          onAlreadyReported={() => {
            localStorage.setItem(`reported:user:${userId}`, 'true');
            setAlreadyReported(true);
          }}
        />
      )}

      {successToast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-success-500 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
          role="status"
          aria-live="polite"
        >
          {successToast}
        </div>
      )}
    </div>
  );
}
