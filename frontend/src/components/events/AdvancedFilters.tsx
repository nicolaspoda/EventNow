import React, { useState } from 'react';

interface AdvancedFiltersProps {
  filters: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
  onClear: () => void;
  /** 'bar' = bandeau au-dessus du contenu, sans carte */
  variant?: 'card' | 'bar';
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  variant = 'card',
}) => {
  const [expanded, setExpanded] = useState(false);

  const wrapperClass =
    variant === 'bar'
      ? 'py-4 border-b border-neutral-200 dark:border-neutral-700'
      : 'glass-card p-4';

  const categories = [
    { value: 'CONCERT', label: 'Concert' },
    { value: 'CONFERENCE', label: 'Conférence' },
    { value: 'FESTIVAL', label: 'Festival' },
    { value: 'SPORT', label: 'Sport' },
    { value: 'THEATER', label: 'Théâtre' },
    { value: 'EXHIBITION', label: 'Exposition' },
    { value: 'OTHER', label: 'Autre' },
  ];

  const priceRanges = [
    { value: 'FREE', label: 'Gratuit' },
    { value: 'LOW', label: '0-20€' },
    { value: 'MEDIUM', label: '20-50€' },
    { value: 'HIGH', label: '50-100€' },
    { value: 'PREMIUM', label: '100€+' },
  ];

  const toggleCategory = (category: string) => {
    const current = (filters.categories as string[]) || [];
    const newCategories = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onFilterChange('categories', newCategories);
  };

  const togglePriceRange = (range: string) => {
    const current = (filters.priceRanges as string[]) || [];
    const newRanges = current.includes(range)
      ? current.filter((r) => r !== range)
      : [...current, range];
    onFilterChange('priceRanges', newRanges);
  };

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-4 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 rounded-lg"
        aria-expanded={expanded}
        aria-label={expanded ? 'Réduire les filtres avancés' : 'Afficher plus de filtres (catégories, prix, période)'}
      >
        <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Filtres</h3>
        <span className="flex items-center gap-2 shrink-0 ml-2 py-1.5 px-2 rounded-md bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
          <span className="text-sm font-medium">
            {expanded ? 'Moins de filtres' : 'Plus de filtres'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div className="space-y-4">
        <div>
          <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Type d'événement
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFilterChange('type', 'PROFESSIONAL')}
              className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                filters.type === 'PROFESSIONAL'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-transparent dark:border-neutral-600'
              }`}
            >
              Professionnel
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('type', 'COMMUNITY')}
              className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                filters.type === 'COMMUNITY'
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-transparent dark:border-neutral-600'
              }`}
            >
              Communautaire
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('type', null)}
              className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                !filters.type
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 border border-transparent dark:border-neutral-600'
              }`}
            >
              Tous
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={(filters.availableOnly as boolean) || false}
              onChange={(e) => onFilterChange('availableOnly', e.target.checked)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Uniquement événements avec places disponibles
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={(filters.myEvents as boolean) || false}
              onChange={(e) => onFilterChange('myEvents', e.target.checked)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Mes événements uniquement
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={(filters.followedOnly as boolean) || false}
              onChange={(e) => onFilterChange('followedOnly', e.target.checked)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Uniquement les organisateurs que je suis
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={(filters.friendsOnly as boolean) || false}
              onChange={(e) => onFilterChange('friendsOnly', e.target.checked)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">
              Uniquement mes amis (organisateurs)
            </span>
          </label>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div>
            <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Catégories
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    (filters.categories as string[])?.includes(cat.value)
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 border-2 border-primary-600 dark:border-primary-500'
                      : 'bg-neutral-50 dark:bg-neutral-700/50 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Gamme de prix
            </p>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <label key={range.value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      (filters.priceRanges as string[])?.includes(range.value) || false
                    }
                    onChange={() => togglePriceRange(range.value)}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Période
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="dateFrom" className="text-xs text-neutral-600 dark:text-neutral-400">
                  Du
                </label>
                <input
                  id="dateFrom"
                  type="date"
                  value={(filters.dateFrom as string) || ''}
                  onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="text-xs text-neutral-600 dark:text-neutral-400">
                  Au
                </label>
                <input
                  id="dateTo"
                  type="date"
                  value={(filters.dateTo as string) || ''}
                  onChange={(e) => onFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
