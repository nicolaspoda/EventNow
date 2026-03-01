import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validationService } from '../services/validationService';
import type { ValidationItem } from '../services/validationService';
import { ValidationsList } from '../components/staff/ValidationsList';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

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
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Historique des validations
              </h1>
              <p className="text-gray-600 mt-2">
                {validations.length} billet
                {validations.length !== 1 ? 's' : ''} validé
                {validations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/staff/scan')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Retour au scan
            </button>
          </div>
        </header>

        {error && (
          <div
            className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
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
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <ValidationsList validations={validations} />
        )}
      </div>
    </main>
  );
};
