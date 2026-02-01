import React, { useState } from 'react';
import type { EventFilters as EventFiltersType } from '../../types/event.types';
import Button from '../ui/Button';

interface EventFiltersProps {
  onFilterChange: (filters: EventFiltersType) => void;
  initialFilters?: EventFiltersType;
}

const EventFilters: React.FC<EventFiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState<EventFiltersType>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof EventFiltersType, value: string) => {
    const newFilters = { ...filters, [field]: value || undefined };
    setFilters(newFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleReset = () => {
    const emptyFilters: EventFiltersType = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-expanded={isExpanded}
          aria-controls="filters-content"
        >
          {isExpanded ? 'Masquer' : 'Afficher'}
        </button>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className={`${isExpanded ? 'block' : 'hidden'} md:block`}
        id="filters-content"
        role="search"
        aria-label="Filtrer les événements"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Titre de l'événement"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Rechercher par titre"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Lieu
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={filters.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ville ou lieu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filtrer par lieu"
            />
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom || ''}
              onChange={(e) => handleInputChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Date de début"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo || ''}
              onChange={(e) => handleInputChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Date de fin"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" variant="primary">
            Appliquer les filtres
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventFilters;
