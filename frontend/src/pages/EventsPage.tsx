import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventSearch } from '../hooks/useEventSearch';
import { useAuth } from '../utils/useAuth';
import { SearchBar } from '../components/events/SearchBar';
import { AdvancedFilters } from '../components/events/AdvancedFilters';
import { SortOptions } from '../components/events/SortOptions';
import EventList from '../components/events/EventList';
import { FilterChips } from '../components/events/FilterChips';

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" aria-hidden="true" />
            Billetterie nouvelle génération
          </div>

          <h1 className="hero-title">
            Découvrez des événements
            <span className="hero-title-accent">
              inoubliables
            </span>
          </h1>

          <p className="hero-subtitle">
            Concerts, festivals, conférences et événements communautaires — réservez en quelques clics.
          </p>

          {/* Search bar integrated into hero */}
          <div className="max-w-xl mx-auto mb-10">
            <SearchBar
              value={(filters.query as string) || ''}
              onChange={(value) => updateFilter('q', value)}
            />
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Événements</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">10K+</div>
              <div className="hero-stat-label">Participants</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">4.9★</div>
              <div className="hero-stat-label">Note moyenne</div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 hero-wave-wrap" aria-hidden="true">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
            <path
              className="hero-wave-fill"
              d="M0,32L80,37.3C160,43,320,53,480,48C640,43,800,21,960,16C1120,11,1280,21,1360,26.7L1440,32L1440,60L1360,60C1280,60,1120,60,960,60C800,60,640,60,480,60C320,60,160,60,80,60L0,60Z"
            />
          </svg>
        </div>
      </section>

      {/* ── Content ───────────────────────────────── */}
      <div className="container mx-auto px-4 py-8">
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

        <section aria-label="Résultats">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <p className="text-neutral-600 dark:text-neutral-300 font-medium">
              <span className="text-primary-600 dark:text-primary-400 font-bold">{pagination?.total ?? 0}</span>{' '}
              événement{(pagination?.total ?? 0) !== 1 ? 's' : ''} trouvé
              {(pagination?.total ?? 0) !== 1 ? 's' : ''}
            </p>
            <SortOptions
              value={(filters.sortBy as string) || 'DATE_ASC'}
              onChange={(value) => updateFilter('sortBy', value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-16" role="status" aria-live="polite">
              <div
                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 mb-4"
                aria-hidden="true"
              />
              <p className="text-neutral-500 dark:text-neutral-400">Recherche en cours...</p>
            </div>
          ) : (
            <EventList events={events} loading={false} error={null} currentUserId={user?.id} />
          )}
        </section>
      </div>
    </div>
  );
};

export default EventsPage;
