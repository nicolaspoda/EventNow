import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { validationService } from '../services/validationService';

/** Événement émis quand le statut staff peut avoir changé (ex. après acceptation d’une invitation). */
export const STAFF_STATUS_CHANGED_EVENT = 'staff-status-changed';

export function useIsStaff(userId: string | undefined) {
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkStaffStatus = async () => {
      if (!sessionStorage.getItem('accessToken')) {
        if (mounted) {
          setIsStaff(false);
          setLoading(false);
        }
        return;
      }
      try {
        const events = await validationService.getStaffEvents();
        if (mounted) {
          setIsStaff(events.length > 0);
        }
      } catch {
        if (mounted) {
          setIsStaff(false);
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
    if (!userId || !location.pathname.startsWith('/staff')) return;
    validationService.getStaffEvents().then((events) => setIsStaff(events.length > 0)).catch(() => setIsStaff(false));
  }, [userId, location.pathname]);

  return { isStaff, loading };
}
