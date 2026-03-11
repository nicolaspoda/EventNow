import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { staffInvitationsService } from '../services/staffInvitationsService';
import type { StaffInvitation } from '../services/staffInvitationsService';
import { useAuth } from '../utils/useAuth';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

export const AcceptStaffInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [invitation, setInvitation] = useState<StaffInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Lien d\'invitation invalide');
      setLoading(false);
      return;
    }
    staffInvitationsService
      .getByToken(token)
      .then(setInvitation)
      .catch((err) => setError(getApiErrorMessage(err, 'Invitation introuvable ou expirée')))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token || !invitation) return;
    setActionLoading('accept');
    try {
      await staffInvitationsService.accept(token);
      navigate('/dashboard', { replace: true });
      window.location.reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible d\'accepter l\'invitation'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!token || !invitation) return;
    if (!window.confirm('Refuser cette invitation ? Vous ne pourrez plus l\'accepter plus tard.')) return;
    setActionLoading('decline');
    try {
      await staffInvitationsService.decline(token);
      setInvitation(null);
      setError('Invitation refusée.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de refuser l\'invitation'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400"
            role="status"
            aria-label="Chargement"
          />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Chargement de l'invitation...</p>
        </div>
      </main>
    );
  }

  if (error && !invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Invitation staff
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error}</p>
          <Link
            to="/"
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  if (!invitation) return null;

  const inviterName = invitation.invitedBy?.username || invitation.invitedBy?.email || 'Un organisateur';
  const eventTitle = invitation.event?.title;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Invitation staff
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          <strong>{inviterName}</strong> vous invite à rejoindre le staff EventNow pour valider les billets
          {eventTitle ? <> de l’événement <strong>{eventTitle}</strong></> : ' sur les événements'}.
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
          Invitation envoyée à : <strong>{invitation.email}</strong>
        </p>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              Connectez-vous avec l'adresse <strong>{invitation.email}</strong> pour accepter cette invitation.
            </p>
            <Link
              to="/login"
              state={{ from: `/invite/staff/${token}` }}
              className="block w-full py-3 px-4 text-center rounded-xl font-medium bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="block w-full py-3 px-4 text-center rounded-xl font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              Créer un compte
            </Link>
          </div>
        ) : user?.email !== invitation.email ? (
          <div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Vous êtes connecté avec <strong>{user?.email}</strong>. Cette invitation est destinée à <strong>{invitation.email}</strong>. Déconnectez-vous et connectez-vous avec cette adresse pour accepter.
            </p>
            <Link
              to="/"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {error && (
              <p className="text-sm text-error-600 dark:text-error-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleAccept}
              disabled={actionLoading !== null}
              className="w-full py-3 px-4 rounded-xl font-medium bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50"
            >
              {actionLoading === 'accept' ? 'Acceptation...' : 'Accepter l\'invitation'}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={actionLoading !== null}
              className="w-full py-3 px-4 rounded-xl font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
            >
              {actionLoading === 'decline' ? 'Refus...' : 'Refuser'}
            </button>
          </div>
        )}

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-neutral-500 dark:text-neutral-500 hover:underline">
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </main>
  );
};
