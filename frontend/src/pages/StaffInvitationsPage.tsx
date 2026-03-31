import type { FormEvent } from 'react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffInvitationsService } from '../services/staffInvitationsService';
import type { StaffInvitation, StaffInvitationStatus } from '../services/staffInvitationsService';
import { dashboardService } from '../services/dashboardService';
import type { DashboardEvent } from '../types/dashboard.types';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { safeFormat } from '../utils/date';

const STATUS_LABELS: Record<StaffInvitationStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  DECLINED: 'Refusée',
  EXPIRED: 'Expirée',
};

export const StaffInvitationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [eventId, setEventId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdInvitation, setCreatedInvitation] = useState<StaffInvitation | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setError(null);
      const data = await staffInvitationsService.getMyInvitations();
      setInvitations(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les invitations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [eventsData, invData] = await Promise.all([
          dashboardService.getOrganizerEvents(),
          staffInvitationsService.getMyInvitations(),
        ]);
        if (cancelled) return;
        setEvents(eventsData);
        setInvitations(invData);
        if (eventsData.length > 0) setEventId(eventsData[0].id);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Impossible de charger les données'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !eventId) return;
    setSubmitError(null);
    setCreatedInvitation(null);
    setSubmitLoading(true);
    try {
      const inv = await staffInvitationsService.create(trimmed, eventId);
      setCreatedInvitation(inv);
      setEmail('');
      await fetchInvitations();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Impossible d\'envoyer l\'invitation'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Annuler cette invitation ? La personne ne pourra plus l\'accepter.')) return;
    setCancellingId(id);
    try {
      await staffInvitationsService.cancel(id);
      await fetchInvitations();
      if (createdInvitation?.id === id) setCreatedInvitation(null);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Impossible d\'annuler l\'invitation'));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Inviter du staff
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Inviter du staff
          </h1>
          <button
            type="button"
            onClick={() => navigate('/dashboard/organizer')}
            className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium"
          >
            ← Retour au tableau de bord
          </button>
        </div>

        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Envoyez une invitation par email. La personne recevra une <strong>notification</strong> et pourra accepter ou refuser depuis sa cloche de notifications.
          <strong className="block mt-2">L'adresse email doit correspondre à un compte déjà inscrit sur la plateforme.</strong>
        </p>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-800 dark:text-error-200"
            role="alert"
          >
            {error}
            <button
              type="button"
              onClick={() => fetchInvitations()}
              className="ml-4 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card p-6 mb-8">
          <h2 id="invite-heading" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Nouvelle invitation
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            La personne pourra valider les billets uniquement pour l’événement choisi.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <label htmlFor="staff-invite-event" className="sr-only">
              Événement concerné
            </label>
            <select
              id="staff-invite-event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="min-w-[220px] px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitLoading || events.length === 0}
            >
              {events.length === 0 && <option value="">Aucun événement</option>}
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} — {safeFormat(ev.eventDate, 'd MMM yyyy')}
                </option>
              ))}
            </select>
            <label htmlFor="staff-invite-email" className="sr-only">
              Adresse email de la personne à inviter
            </label>
            <input
              id="staff-invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.fr"
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={submitLoading}
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={submitLoading || events.length === 0}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 font-medium"
            >
              {submitLoading ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
          {submitError && (
            <p className="mt-2 text-sm text-error-600 dark:text-error-400" role="alert">
              {submitError}
            </p>
          )}
          {createdInvitation && (
            <div className="mt-4 p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                Invitation envoyée. La personne recevra une notification et pourra accepter ou refuser depuis sa cloche de notifications.
              </p>
            </div>
          )}
        </form>

        <section aria-labelledby="list-heading">
          <h2 id="list-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Invitations envoyées
          </h2>
          {invitations.length === 0 ? (
            <div className="glass-card p-8 text-center text-neutral-500 dark:text-neutral-400">
              Aucune invitation pour le moment.
            </div>
          ) : (
            <ul className="space-y-3">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="glass-card p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{inv.email}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {inv.event && (
                        <>Événement : {inv.event.title} — {safeFormat(inv.event.eventDate, 'd MMM yyyy')}. </>
                      )}
                      {STATUS_LABELS[inv.status]}
                      {' · '}
                      {safeFormat(inv.createdAt, "d MMM yyyy 'à' HH'h'mm")}
                      {inv.status === 'PENDING' && (
                        <> · Expire le {safeFormat(inv.expiresAt, 'd MMM yyyy')}</>
                      )}
                      {inv.acceptedBy && (
                        <> · Acceptée par {inv.acceptedBy.username || inv.acceptedBy.email}</>
                      )}
                    </p>
                  </div>
                  {inv.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(inv.id)}
                      disabled={cancellingId !== null}
                      className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-error-600 dark:hover:text-error-400 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-error-400 disabled:opacity-50"
                    >
                      {cancellingId === inv.id ? 'Annulation...' : 'Annuler l\'invitation'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};
