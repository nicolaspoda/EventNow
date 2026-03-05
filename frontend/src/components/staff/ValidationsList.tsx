import React from 'react';
import type { ValidationItem } from '../../services/validationService';
import { safeFormat } from '../../utils/date';

interface ValidationsListProps {
  validations: ValidationItem[];
}

export const ValidationsList: React.FC<ValidationsListProps> = ({
  validations,
}) => {
  if (validations.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-neutral-400">
        Aucune validation enregistrée.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <caption className="sr-only">
            Liste des billets validés
          </caption>
          <thead className="bg-gray-50 dark:bg-neutral-700/50 border-b border-gray-200 dark:border-neutral-600">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase"
              >
                Événement
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase"
              >
                Catégorie
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase"
              >
                Titulaire
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase"
              >
                Validé le
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-600">
            {validations.map((v) => (
              <tr key={v.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {v.event}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-300">
                  {v.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-300">
                  {v.holder_email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-neutral-300">
                  {safeFormat(v.validated_at, "d MMM yyyy 'à' HH'h'mm")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
