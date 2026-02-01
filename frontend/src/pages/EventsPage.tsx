import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { EventFilters as EventFiltersType } from '../types/event.types';
import EventFilters from '../components/events/EventFilters';
import EventList from '../components/events/EventList';
import { useEvents } from '../hooks/useEvents';

const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<EventFiltersType>({
    search: searchParams.get('search') || undefined,
    location: searchParams.get('location') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  });

  const { events, loading, error } = useEvents(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.location) params.set('location', filters.location);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (newFilters: EventFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Catalogue des événements
          </h1>
          <p className="text-gray-600">
            Découvrez tous les événements à venir
          </p>
        </header>

        <EventFilters onFilterChange={handleFilterChange} initialFilters={filters} />

        <div aria-live="polite" aria-atomic="true">
          <EventList events={events} loading={loading} error={error} />
        </div>
      </div>
    </main>
  );
};

export default EventsPage;
