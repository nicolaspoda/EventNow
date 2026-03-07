import { Link, useNavigate } from 'react-router-dom';
import type { PublicUserProfile } from '../../services/profile.service';
import Button from '../ui/Button';
import { StarRating } from '../reviews/StarRating';

const roleLabels: Record<string, string> = {
  CLIENT: 'Client',
  ORGANIZER: 'Organisateur',
  STAFF: 'Staff',
};

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
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

export function ProfileViewMode({ profile }: { profile: PublicUserProfile }) {
  const navigate = useNavigate();
  const displayName = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : profile.email.split('@')[0];
  const initials = profile.firstName && profile.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : displayName.charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>← Retour</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5">
            <div className="flex flex-col items-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <span className="text-3xl font-semibold text-primary-600 dark:text-primary-400">{initials}</span>
                </div>
              )}
              <h2 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{displayName}</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-2">{profile.email}</p>
              {profile.role && (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[profile.role] || ''}`}>
                  {roleLabels[profile.role] || profile.role}
                </span>
              )}
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 w-full text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Membre depuis</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Statistiques</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Événements participés</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{profile.stats.participatedEventsCount}</span>
              </div>
              {profile.stats.totalReviews > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Note reçue (participant)</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {profile.stats.averageRating != null ? `${profile.stats.averageRating}/5` : '—'} ({profile.stats.totalReviews} avis)
                  </span>
                </div>
              )}
              {(profile.stats.totalReviewsOnMyEvents ?? 0) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Note sur ses événements</span>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {profile.stats.averageRatingOnMyEvents != null ? `${profile.stats.averageRatingOnMyEvents}/5` : '—'} ({profile.stats.totalReviewsOnMyEvents} avis)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Informations</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Prénom</label>
                <p className="text-neutral-900 dark:text-neutral-100">{profile.firstName || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Nom</label>
                <p className="text-neutral-900 dark:text-neutral-100">{profile.lastName || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
                <p className="text-neutral-900 dark:text-neutral-100 text-sm truncate">{profile.email}</p>
              </div>
              {profile.role && (
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rôle</label>
                  <p className="text-neutral-900 dark:text-neutral-100">{roleLabels[profile.role] || profile.role}</p>
                </div>
              )}
            </div>
          </div>
          {profile.participantReviews.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Avis reçus ({profile.participantReviews.length})</h3>
              <div className="space-y-4">
                {profile.participantReviews.map((review) => (
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
          {profile.participatedEvents.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Événements participés</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.participatedEvents.map((event) => (
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
    </div>
  );
}
