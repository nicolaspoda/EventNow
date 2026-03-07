import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventSearch } from '../hooks/useEventSearch';
import { useAuth } from '../utils/useAuth';
import { SearchBar } from '../components/events/SearchBar';
import { AdvancedFilters } from '../components/events/AdvancedFilters';
import { SortOptions } from '../components/events/SortOptions';
import EventList from '../components/events/EventList';
import { FilterChips } from '../components/events/FilterChips';
import { EventsMap } from '../components/map/EventsMap';

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
    userPosition,
    positionLoading,
    positionError,
    requestUserPosition,
    clearUserPosition,
    clearNearMeFilter,
  } = useEventSearch();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // En vue carte : demander la position une fois pour afficher le point bleu (sans changer le tri)
  useEffect(() => {
    if (viewMode === 'map' && !userPosition && !positionLoading && navigator.geolocation) {
      requestUserPosition({ forDisplayOnly: true });
    }
  }, [viewMode]);

  const handleSortChange = (value: string) => {
    if (value === 'DISTANCE_ASC') {
      if (userPosition) {
        updateFilter('sortBy', 'DISTANCE_ASC');
      } else {
        requestUserPosition({ sortOnly: true });
      }
    } else {
      updateFilter('sortBy', value);
    }
  };

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
              filters={filters as Record<string, unknown>}
              onRemove={(key) => updateFilter(key, null)}
              onClearAll={clearFilters}
            />
          </div>
        )}

        <div className="mb-6">
          <AdvancedFilters
            filters={filters as Record<string, unknown>}
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
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {viewMode === 'list' && (
                  <>
                    {filters.radiusKm != null && filters.radiusKm > 0 ? (
                      <button
                        type="button"
                        onClick={clearNearMeFilter}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/60 transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" aria-hidden="true" />
                        Près de moi ({filters.radiusKm} km)
                        <span aria-hidden="true">×</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestUserPosition()}
                        disabled={positionLoading}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                      >
                        {positionLoading ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" aria-hidden="true" />
                            Position...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Événements près de moi
                          </>
                        )}
                      </button>
                    )}
                    {positionError && (
                      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                        {positionError}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                  aria-label="Vue liste"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                  aria-label="Vue carte"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
              </div>

              {viewMode === 'list' && (
                <SortOptions
                  value={(filters.sortBy as string) || 'DATE_ASC'}
                  onChange={handleSortChange}
                />
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16" role="status" aria-live="polite">
              <div
                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 mb-4"
                aria-hidden="true"
              />
              <p className="text-neutral-500 dark:text-neutral-400">Recherche en cours...</p>
            </div>
          ) : viewMode === 'list' ? (
            <EventList events={events} loading={false} error={null} currentUserId={user?.id} />
          ) : (
            <EventsMap
              events={events}
              userPosition={userPosition}
              onEventClick={(eventId) => navigate(`/events/${eventId}`)}
              className="h-[600px]"
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default EventsPage;
