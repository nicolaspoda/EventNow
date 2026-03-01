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
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Aucune validation enregistrée.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <caption className="sr-only">
            Liste des billets validés
          </caption>
          <thead className="bg-gray-50 border-b">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Événement
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Catégorie
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Titulaire
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Validé le
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {validations.map((v) => (
              <tr key={v.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {v.event}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {v.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {v.holder_email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
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
