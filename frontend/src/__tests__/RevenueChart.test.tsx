import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { analyticsService } from '../services/analyticsService';
import type { DashboardEvent } from '../types/dashboard.types';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    calculateRevenueByMonth: vi.fn(),
  },
}));

vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: { data: { labels: string[]; datasets: { data: number[] }[] } }) => (
    <div data-testid="line-chart">
      <span data-testid="labels">{data.labels.join(',')}</span>
      <span data-testid="values">{data.datasets[0].data.join(',')}</span>
    </div>
  ),
}));

describe('RevenueChart', () => {
  it('exposes an accessible image role with a descriptive label', () => {
    vi.mocked(analyticsService.calculateRevenueByMonth).mockReturnValue([]);

    render(<RevenueChart events={[]} />);

    expect(
      screen.getByRole('img', { name: "Graphique d'évolution des revenus" }),
    ).toBeInTheDocument();
  });

  it('builds chart labels and revenue data from the analytics service output', () => {
    vi.mocked(analyticsService.calculateRevenueByMonth).mockReturnValue([
      { month: '2026-03', revenue: 150.5 },
      { month: '2026-04', revenue: 320 },
    ]);

    render(<RevenueChart events={[] as DashboardEvent[]} />);

    expect(screen.getByTestId('labels')).toHaveTextContent('mars 2026,avr. 2026');
    expect(screen.getByTestId('values')).toHaveTextContent('150.5,320');
  });

  it('passes the events prop through to the analytics service', () => {
    vi.mocked(analyticsService.calculateRevenueByMonth).mockReturnValue([]);
    const events = [{ id: 'e1' }] as unknown as DashboardEvent[];

    render(<RevenueChart events={events} />);

    expect(analyticsService.calculateRevenueByMonth).toHaveBeenCalledWith(events);
  });
});
