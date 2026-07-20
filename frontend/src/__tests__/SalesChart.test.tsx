import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SalesChart } from '../components/dashboard/SalesChart';
import { analyticsService } from '../services/analyticsService';
import type { DashboardEvent } from '../types/dashboard.types';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    calculateSalesByCategory: vi.fn(),
  },
}));

vi.mock('react-chartjs-2', () => ({
  Bar: ({ data }: { data: { labels: string[]; datasets: { data: number[] }[] } }) => (
    <div data-testid="bar-chart">
      <span data-testid="labels">{data.labels.join(',')}</span>
      <span data-testid="values">{data.datasets[0].data.join(',')}</span>
    </div>
  ),
}));

describe('SalesChart', () => {
  it('exposes an accessible image role with a descriptive label', () => {
    vi.mocked(analyticsService.calculateSalesByCategory).mockReturnValue([]);

    render(<SalesChart events={[]} />);

    expect(
      screen.getByRole('img', { name: 'Graphique des ventes par catégorie' }),
    ).toBeInTheDocument();
  });

  it('builds chart labels and sold-ticket counts from the analytics service output', () => {
    vi.mocked(analyticsService.calculateSalesByCategory).mockReturnValue([
      { name: 'Standard', sold: 40, revenue: 400 },
      { name: 'VIP', sold: 10, revenue: 500 },
    ]);

    render(<SalesChart events={[] as DashboardEvent[]} />);

    expect(screen.getByTestId('labels')).toHaveTextContent('Standard,VIP');
    expect(screen.getByTestId('values')).toHaveTextContent('40,10');
  });

  it('passes the events prop through to the analytics service', () => {
    vi.mocked(analyticsService.calculateSalesByCategory).mockReturnValue([]);
    const events = [{ id: 'e1' }] as unknown as DashboardEvent[];

    render(<SalesChart events={events} />);

    expect(analyticsService.calculateSalesByCategory).toHaveBeenCalledWith(events);
  });
});
