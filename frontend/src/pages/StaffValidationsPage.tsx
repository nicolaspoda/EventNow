import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validationService } from '../services/validationService';
import type { ValidationItem } from '../services/validationService';
import { ValidationsList } from '../components/staff/ValidationsList';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import Button from '../components/ui/Button';

export const StaffValidationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [validations, setValidations] = useState<ValidationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchValidations();
  }, []);

  const fetchValidations = async () => {
    try {
      setError(null);
      const data = await validationService.getValidations();
      setValidations(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les validations'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
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
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => navigate('/staff/scan')}
            >
              Retour au scan
            </Button>
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
    </main>
  );
};
