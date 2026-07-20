import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ParticipantsChart } from '../components/dashboard/ParticipantsChart';
import { analyticsService } from '../services/analyticsService';
import type { DashboardEvent } from '../types/dashboard.types';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    calculateParticipantsByMonth: vi.fn(),
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

describe('ParticipantsChart', () => {
  it('exposes an accessible image role with a descriptive label', () => {
    vi.mocked(analyticsService.calculateParticipantsByMonth).mockReturnValue([]);

    render(<ParticipantsChart events={[]} />);

    expect(
      screen.getByRole('img', { name: "Graphique d'évolution des participants" }),
    ).toBeInTheDocument();
  });

  it('builds chart labels and data from the analytics service output', () => {
    vi.mocked(analyticsService.calculateParticipantsByMonth).mockReturnValue([
      { month: '2026-01', participants: 5 },
      { month: '2026-02', participants: 12 },
    ]);

    render(<ParticipantsChart events={[] as DashboardEvent[]} />);

    expect(screen.getByTestId('labels')).toHaveTextContent('janv. 2026,févr. 2026');
    expect(screen.getByTestId('values')).toHaveTextContent('5,12');
  });

  it('passes the events prop through to the analytics service', () => {
    vi.mocked(analyticsService.calculateParticipantsByMonth).mockReturnValue([]);
    const events = [{ id: 'e1' }] as unknown as DashboardEvent[];

    render(<ParticipantsChart events={events} />);

    expect(analyticsService.calculateParticipantsByMonth).toHaveBeenCalledWith(events);
  });
});
