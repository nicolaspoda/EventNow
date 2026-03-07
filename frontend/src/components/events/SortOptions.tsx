import React from 'react';

interface SortOptionsProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortOptions: React.FC<SortOptionsProps> = ({ value, onChange }) => {
  const options = [
    { value: 'DATE_ASC', label: 'Date (croissant)' },
    { value: 'DATE_DESC', label: 'Date (décroissant)' },
    { value: 'PRICE_ASC', label: 'Prix (croissant)' },
    { value: 'PRICE_DESC', label: 'Prix (décroissant)' },
    { value: 'POPULARITY', label: 'Popularité' },
    { value: 'DISTANCE_ASC', label: 'Distance (près de moi)' },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-neutral-600 dark:text-neutral-400 shrink-0">
        Trier par :
      </label>
      <div className="relative inline-flex items-center">
        <select
          id="sort-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pl-4 pr-10 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium cursor-pointer min-w-[180px]"
          aria-label="Ordre de tri"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 text-neutral-500 dark:text-neutral-400"
          aria-hidden="true"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  );
};
