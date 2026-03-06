import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { profileService } from '../services/profile.service';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { AvatarUpload } from '../components/upload/AvatarUpload';
import type { UserProfile, UpdateProfileData } from '../types/auth';

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
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
  });

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
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
      });
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updatedUser = await profileService.updateProfile(formData);
      setProfile((prev) => prev ? {
        ...prev,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      } : prev);
      setIsEditing(false);
      setSuccess('Profil mis à jour avec succès');

      if (user) {
        setUser({
          ...user,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
        });
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          sessionStorage.setItem('user', JSON.stringify({
            ...parsed,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
          }));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError('Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
    });
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
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
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.firstName) {
      return profile.firstName[0].toUpperCase();
    }
    if (profile?.email) {
      return profile.email[0].toUpperCase();
    }
    return '?';
  };

  const getDisplayName = () => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return profile?.email?.split('@')[0] || 'Utilisateur';
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

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-800 dark:text-error-200 px-4 py-3 rounded-xl">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error || 'Profil non trouvé'}</p>
        </div>
      </div>
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

              {profile.role === 'ORGANIZER' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">Événements</span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {profile.stats.eventsOrganized}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Informations personnelles
              </h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  }
                >
                  Modifier
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Votre prénom"
                  />
                  <Input
                    label="Nom"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Votre nom"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" loading={saving} size="sm">
                    Enregistrer
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving} size="sm">
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Prénom</label>
                  <p className="text-neutral-900 dark:text-neutral-100">
                    {profile.firstName || <span className="text-neutral-400 italic text-sm">Non renseigné</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Nom</label>
                  <p className="text-neutral-900 dark:text-neutral-100">
                    {profile.lastName || <span className="text-neutral-400 italic text-sm">Non renseigné</span>}
                  </p>
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
            )}
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
                onClick={handleLogout}
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
