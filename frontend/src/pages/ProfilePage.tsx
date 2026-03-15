import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { profileService } from '../services/profile.service';
import type { PublicUserProfile } from '../services/profile.service';
import Button from '../components/ui/Button';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import { ProfileViewMode } from '../components/profile/ProfileViewMode';
import { ProfileStatsRow } from '../components/profile/ProfileStatsRow';
import type { UserProfile } from '../types/auth';

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

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId: userIdFromRoute } = useParams<{ userId?: string }>();
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicUserProfile | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isOwnProfile = !userIdFromRoute || (user && userIdFromRoute === user.id);

  useEffect(() => {
    if (userIdFromRoute && user && userIdFromRoute !== user.id) {
      const fetchPublic = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await profileService.getUserPublicProfile(userIdFromRoute);
          setPublicProfile(data);
          setIsViewMode(true);
        } catch (err) {
          console.error('Erreur lors du chargement du profil:', err);
          setError('Profil introuvable');
        } finally {
          setLoading(false);
        }
      };
      fetchPublic();
    } else if (!userIdFromRoute) {
      setIsViewMode(false);
      setPublicProfile(null);
      fetchProfile();
    } else if (userIdFromRoute && user && userIdFromRoute === user.id) {
      navigate('/profile', { replace: true });
    }
  }, [userIdFromRoute, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    try {
      await profileService.updateProfile({ avatarUrl: url });
      setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
      setSuccess('Photo de profil mise à jour');
      
      if (user) {
        setUser({ ...user, avatarUrl: url });
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          sessionStorage.setItem('user', JSON.stringify({ ...parsed, avatarUrl: url }));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', err);
      setError('Erreur lors de la mise à jour de la photo');
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await profileService.updateProfile({ avatarUrl: '' });
      setProfile((prev) => prev ? { ...prev, avatarUrl: null } : prev);
      setSuccess('Photo de profil supprimée');
      
      if (user) {
        setUser({ ...user, avatarUrl: null });
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          sessionStorage.setItem('user', JSON.stringify({ ...parsed, avatarUrl: null }));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'avatar:', err);
      setError('Erreur lors de la suppression de la photo');
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login');
  };

  const formatDate = (dateValue?: string | Date | null) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getInitials = () => {
    const name = profile?.username || profile?.email;
    if (name) return name[0].toUpperCase();
    return '?';
  };

  const getDisplayName = () => {
    return profile?.username || profile?.email?.split('@')[0] || 'Utilisateur';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
            role="status"
          />
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!profile && !isViewMode) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-error-50 dark:bg-neutral-800 border border-error-200 dark:border-red-800 text-error-800 dark:text-red-200 px-4 py-3 rounded-xl">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error || 'Profil non trouvé'}</p>
        </div>
      </div>
    );
  }

  if (isViewMode && !publicProfile && !loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-error-50 dark:bg-neutral-800 border border-error-200 dark:border-red-800 text-error-800 dark:text-red-200 px-4 py-3 rounded-xl">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error || 'Profil introuvable'}</p>
        </div>
      </div>
    );
  }

  if (isViewMode && publicProfile) {
    return (
      <ProfileViewMode
        profile={publicProfile}
        userId={userIdFromRoute!}
        onProfileUpdate={async () => {
          if (!userIdFromRoute) return;
          const data = await profileService.getUserPublicProfile(userIdFromRoute);
          setPublicProfile(data);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne gauche - Profil */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5">
            <div className="flex flex-col items-center">
              <AvatarUpload
                currentImage={profile.avatarUrl}
                initials={getInitials()}
                onUploadSuccess={(url) => handleAvatarUpload(url)}
                onDelete={handleAvatarDelete}
                size="lg"
              />

              <h2 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {getDisplayName()}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-2">
                {profile.email}
              </p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[profile.role]}`}>
                {roleLabels[profile.role] || profile.role}
              </span>

              {(typeof profile.followersCount === 'number' || typeof profile.followingCount === 'number' || typeof profile.friendsCount === 'number') && (
                <ProfileStatsRow
                  profileUserId={user?.id ?? ''}
                  currentUserId={user?.id}
                  followersCount={profile.followersCount ?? 0}
                  followingCount={profile.followingCount ?? 0}
                  friendsCount={profile.friendsCount ?? 0}
                  onUpdate={fetchProfile}
                />
              )}

              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 w-full text-center">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Membre depuis</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Commandes</span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {profile.stats.ordersCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Avis donnés</span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {profile.stats.reviewsCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">Événements organisés</span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {profile.stats.eventsOrganized}
                </span>
              </div>

              {(profile.stats.totalReviewsAsParticipant != null && profile.stats.totalReviewsAsParticipant > 0) && (
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">Note reçue (participant)</span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {profile.stats.averageRatingAsParticipant != null
                      ? `${profile.stats.averageRatingAsParticipant}/5`
                      : '—'}
                    {profile.stats.totalReviewsAsParticipant != null && profile.stats.totalReviewsAsParticipant > 0 && (
                      <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-1">
                        ({profile.stats.totalReviewsAsParticipant} avis)
                      </span>
                    )}
                  </span>
                </div>
              )}

              {(profile.stats.totalReviewsOnMyEvents != null && profile.stats.totalReviewsOnMyEvents > 0) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">Note sur mes événements</span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {profile.stats.averageRatingOnMyEvents != null
                      ? `${profile.stats.averageRatingOnMyEvents}/5`
                      : '—'}
                    {profile.stats.totalReviewsOnMyEvents != null && profile.stats.totalReviewsOnMyEvents > 0 && (
                      <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-1">
                        ({profile.stats.totalReviewsOnMyEvents} avis)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-8 space-y-4">
          {/* Informations personnelles */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Informations personnelles
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Nom d'utilisateur</label>
                <p className="text-neutral-900 dark:text-neutral-100">{profile.username || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
                <p className="text-neutral-900 dark:text-neutral-100 text-sm truncate">{profile.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Rôle</label>
                <p className="text-neutral-900 dark:text-neutral-100">{roleLabels[profile.role]}</p>
              </div>
            </div>
          </div>

          {/* Liens rapides */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Accès rapide
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => navigate('/my-tickets')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Mes billets</span>
              </button>

              <button
                onClick={() => navigate('/my-orders')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Commandes</span>
              </button>

              <button
                onClick={() => navigate('/my-upcoming-events')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">À venir</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Dashboard</span>
              </button>
            </div>
          </div>

          {/* Déconnexion */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Déconnexion</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Se déconnecter de votre compte</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Se déconnecter
              </Button>
            </div>
          </div>

          {showLogoutConfirm &&
            createPortal(
              <div
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-[100]"
                style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-logout-dialog-title"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <div
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 border border-neutral-200 dark:border-neutral-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 id="profile-logout-dialog-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Déconnexion
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-5">
                    Êtes-vous sûr de vouloir vous déconnecter ?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleLogout()}
                      className="flex-1"
                    >
                      Oui
                    </Button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
