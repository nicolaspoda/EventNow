import React from 'react';

interface FilterChipsProps {
  filters: Record<string, unknown>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemove,
  onClearAll,
}) => {
  const getFilterLabel = (key: string, value: unknown): string => {
    if (key === 'query') return `Recherche: ${value}`;
    if (key === 'type') {
      if (value === 'PROFESSIONAL') return 'Type: Professionnel';
      if (value === 'COMMUNITY') return 'Type: Communautaire';
    }
    if (key === 'categories') {
      const cats = value as string[];
      return `Catégories: ${cats.join(', ')}`;
    }
    if (key === 'location') return `Lieu: ${value}`;
    if (key === 'dateFrom') return `Du: ${value}`;
    if (key === 'dateTo') return `Au: ${value}`;
    if (key === 'priceRanges') {
      const ranges = value as string[];
      return `Prix: ${ranges.join(', ')}`;
    }
    if (key === 'availableOnly') return 'Places disponibles';
    if (key === 'myEvents') return 'Mes événements';
    if (key === 'radiusKm') return `Près de moi (${value} km)`;
    return `${key}: ${value}`;
  };

  const activeFilters = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== false &&
      key !== 'sortBy' &&
      !(Array.isArray(value) && value.length === 0) &&
      (key !== 'radiusKm' || (typeof value === 'number' && value > 0))
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">Filtres actifs:</span>
      {activeFilters.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => onRemove(key)}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {getFilterLabel(key, value)}
          <span className="ml-2" aria-hidden="true">
            ×
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
      >
        Tout effacer
      </button>
    </div>
  );
};
