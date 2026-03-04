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
  ];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="sort-select" className="text-sm text-neutral-600 dark:text-neutral-400">
        Trier par :
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
