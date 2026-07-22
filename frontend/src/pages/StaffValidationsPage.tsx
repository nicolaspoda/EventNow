import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validationService } from '../services/validationService';
import type { ValidationItem } from '../services/validationService';
import { ValidationsList } from '../components/staff/ValidationsList';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import Button from '../components/ui/Button';

export const StaffValidationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [staffEvents, setStaffEvents] = useState<{ id: string; title: string; eventDate: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [validations, setValidations] = useState<ValidationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validationService.getStaffEvents().then(setStaffEvents).catch(() => setStaffEvents([]));
  }, []);

  useEffect(() => {
    fetchValidations();
  }, [selectedEventId]);

  const fetchValidations = async () => {
    try {
      setError(null);
      const data = await validationService.getValidations(
        selectedEventId || undefined,
      );
      setValidations(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les validations'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-100">
                Historique des validations
              </h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-2">
                {validations.length} billet
                {validations.length !== 1 ? 's' : ''} validé
                {validations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {staffEvents.length > 1 && (
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value);
                    setLoading(true);
                  }}
                  className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                  aria-label="Filtrer par événement"
                >
                  <option value="">Tous les événements</option>
                  {staffEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              )}
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => navigate('/staff/scan')}
              >
                Retour au scan
              </Button>
            </div>
          </div>
        </header>

        {error && (
          <div
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded"
            role="alert"
          >
            {error}
            <button
              type="button"
              onClick={fetchValidations}
              className="ml-4 underline font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div
              className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
              aria-hidden="true"
            />
            <p className="mt-4 text-gray-600 dark:text-neutral-400">Chargement...</p>
          </div>
        ) : (
          <ValidationsList validations={validations} />
        )}
      </div>
    </div>
  );
};
