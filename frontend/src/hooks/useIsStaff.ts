import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { validationService } from '../services/validationService';

/** Événement émis quand le statut staff peut avoir changé (ex. après acceptation d’une invitation). */
export const STAFF_STATUS_CHANGED_EVENT = 'staff-status-changed';

export function useIsStaff(userId: string | undefined) {
  const [hasStaffEvents, setHasStaffEvents] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isStaffPage = location.pathname.startsWith('/staff');
  /** Menu staff visible uniquement si l'utilisateur a au moins un événement staff à venir (pas terminé). */
  const isStaff = hasStaffEvents;

  useEffect(() => {
    let mounted = true;

    const checkStaffStatus = async () => {
      if (!sessionStorage.getItem('accessToken')) {
        if (mounted) {
          setHasStaffEvents(false);
          setLoading(false);
        }
        return;
      }
      try {
        const events = await validationService.getStaffEvents();
        if (mounted) {
          setHasStaffEvents(events.length > 0);
        }
      } catch {
        if (mounted) {
          setHasStaffEvents(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkStaffStatus();

    const onStaffStatusChanged = () => {
      if (mounted) setLoading(true);
      checkStaffStatus();
    };

    window.addEventListener(STAFF_STATUS_CHANGED_EVENT, onStaffStatusChanged);
    return () => {
      mounted = false;
      window.removeEventListener(STAFF_STATUS_CHANGED_EVENT, onStaffStatusChanged);
    };
  }, [userId]);

  // Re-vérifier en arrivant sur une page staff (ex. après redirection post-acceptation)
  useEffect(() => {
    if (!userId || !isStaffPage) return;
    validationService.getStaffEvents().then((events) => setHasStaffEvents(events.length > 0)).catch(() => setHasStaffEvents(false));
  }, [userId, isStaffPage]);

  // Rafraîchir périodiquement quand on est sur une page staff pour que le menu disparaisse après la fin d'un événement
  useEffect(() => {
    if (!userId || !isStaffPage || !hasStaffEvents) return;
    const interval = setInterval(() => {
      validationService.getStaffEvents().then((events) => setHasStaffEvents(events.length > 0)).catch(() => setHasStaffEvents(false));
    }, 30_000);
    return () => clearInterval(interval);
  }, [userId, isStaffPage, hasStaffEvents]);

  return { isStaff, loading };
}
