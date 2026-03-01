import React from 'react';
import { useEventSearch } from '../hooks/useEventSearch';
import { SearchBar } from '../components/events/SearchBar';
import { AdvancedFilters } from '../components/events/AdvancedFilters';
import { SortOptions } from '../components/events/SortOptions';
import EventList from '../components/events/EventList';
import { FilterChips } from '../components/events/FilterChips';

const EventsPage: React.FC = () => {
  const {
    events,
    loading,
    pagination,
    filters,
    updateFilter,
    clearFilters,
    activeFiltersCount,
  } = useEventSearch();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Découvrez les événements
          </h1>

          <SearchBar
            value={(filters.query as string) || ''}
            onChange={(value) => updateFilter('q', value)}
          />
        </header>

        {activeFiltersCount > 0 && (
          <div className="mb-4">
            <FilterChips
              filters={filters}
              onRemove={(key) => updateFilter(key, null)}
              onClearAll={clearFilters}
            />
          </div>
        )}

        <div className="mb-6">
          <AdvancedFilters
            filters={filters}
            onFilterChange={updateFilter}
            onClear={clearFilters}
            variant="bar"
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <p className="text-gray-600">
                {pagination?.total || 0} événement
                {(pagination?.total || 0) !== 1 ? 's' : ''} trouvé
                {(pagination?.total || 0) !== 1 ? 's' : ''}
              </p>
              <SortOptions
                value={(filters.sortBy as string) || 'DATE_ASC'}
                onChange={(value) => updateFilter('sortBy', value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div
                  className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
                  aria-hidden="true"
                />
                <p className="text-gray-600">Recherche en cours...</p>
              </div>
            ) : (
              <EventList events={events} loading={false} error={null} />
            )}
        </section>
      </div>
    </main>
  );
};

export default EventsPage;
