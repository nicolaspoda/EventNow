import { describe, it, expect } from 'vitest';
import { analyticsService } from '../services/analyticsService';
import type { DashboardEvent } from '../types/dashboard.types';

function makeEvent(overrides: Partial<DashboardEvent> = {}): DashboardEvent {
  return {
    id: '1',
    title: 'Event',
    location: 'Paris',
    eventDate: '2026-03-15T00:00:00Z',
    organizerId: 'org-1',
    type: 'COMMUNITY',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ticketCategories: [],
    stats: {
      totalCapacity: 100,
      fillRate: 0,
      status: 'PUBLISHED',
    },
    ...overrides,
  };
}

describe('analyticsService.calculateRevenueByMonth', () => {
  it('returns an empty array for no events', () => {
    expect(analyticsService.calculateRevenueByMonth([])).toEqual([]);
  });

  it('groups revenue by year-month and sorts ascending', () => {
    const events = [
      makeEvent({ eventDate: '2026-03-15T00:00:00Z', stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED', revenue: 100 } }),
      makeEvent({ eventDate: '2026-01-05T00:00:00Z', stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED', revenue: 50 } }),
      makeEvent({ eventDate: '2026-01-20T00:00:00Z', stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED', revenue: 25 } }),
    ];
    expect(analyticsService.calculateRevenueByMonth(events)).toEqual([
      { month: '2026-01', revenue: 75 },
      { month: '2026-03', revenue: 100 },
    ]);
  });

  it('treats a missing revenue as 0', () => {
    const events = [makeEvent({ stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED' } })];
    expect(analyticsService.calculateRevenueByMonth(events)).toEqual([
      { month: '2026-03', revenue: 0 },
    ]);
  });
});

describe('analyticsService.calculateSalesByCategory', () => {
  it('returns an empty array when there are no ticket categories', () => {
    expect(analyticsService.calculateSalesByCategory([makeEvent()])).toEqual([]);
  });

  it('aggregates sold count and revenue per category name across events', () => {
    const events = [
      makeEvent({
        ticketCategories: [
          { id: 'a', name: 'Standard', price: 10, initialStock: 100, currentStock: 60 },
        ],
      }),
      makeEvent({
        ticketCategories: [
          { id: 'b', name: 'Standard', price: 10, initialStock: 50, currentStock: 40 },
        ],
      }),
    ];
    expect(analyticsService.calculateSalesByCategory(events)).toEqual([
      { name: 'Standard', sold: 50, revenue: 500 },
    ]);
  });
});

describe('analyticsService.calculateParticipantsByMonth', () => {
  it('prefers totalSold over totalParticipants', () => {
    const events = [
      makeEvent({ stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED', totalSold: 5, totalParticipants: 20 } }),
    ];
    expect(analyticsService.calculateParticipantsByMonth(events)).toEqual([
      { month: '2026-03', participants: 5 },
    ]);
  });

  it('falls back to totalParticipants when totalSold is missing', () => {
    const events = [
      makeEvent({ stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED', totalParticipants: 20 } }),
    ];
    expect(analyticsService.calculateParticipantsByMonth(events)).toEqual([
      { month: '2026-03', participants: 20 },
    ]);
  });

  it('defaults to 0 when both are missing', () => {
    const events = [makeEvent({ stats: { totalCapacity: 100, fillRate: 0, status: 'PUBLISHED' } })];
    expect(analyticsService.calculateParticipantsByMonth(events)).toEqual([
      { month: '2026-03', participants: 0 },
    ]);
  });
});

describe('analyticsService.calculateFillRateDistribution', () => {
  it('buckets events into fill-rate ranges', () => {
    const events = [
      makeEvent({ stats: { totalCapacity: 100, fillRate: 10, status: 'PUBLISHED' } }),
      makeEvent({ stats: { totalCapacity: 100, fillRate: 30, status: 'PUBLISHED' } }),
      makeEvent({ stats: { totalCapacity: 100, fillRate: 60, status: 'PUBLISHED' } }),
      makeEvent({ stats: { totalCapacity: 100, fillRate: 80, status: 'PUBLISHED' } }),
      makeEvent({ stats: { totalCapacity: 100, fillRate: 100, status: 'PUBLISHED' } }),
    ];
    expect(analyticsService.calculateFillRateDistribution(events)).toEqual([
      { range: '0-25%', count: 1 },
      { range: '25-50%', count: 1 },
      { range: '50-75%', count: 1 },
      { range: '75-100%', count: 1 },
      { range: 'Complet', count: 1 },
    ]);
  });

  it('returns all-zero ranges for no events', () => {
    expect(analyticsService.calculateFillRateDistribution([])).toEqual([
      { range: '0-25%', count: 0 },
      { range: '25-50%', count: 0 },
      { range: '50-75%', count: 0 },
      { range: '75-100%', count: 0 },
      { range: 'Complet', count: 0 },
    ]);
  });
});
