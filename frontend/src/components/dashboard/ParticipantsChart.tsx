import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { analyticsService } from '../../services/analyticsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

import type { DashboardEvent } from '../../types/dashboard.types';

interface ParticipantsChartProps {
  events: DashboardEvent[];
}

export const ParticipantsChart: React.FC<ParticipantsChartProps> = ({
  events,
}) => {
  const chartData = useMemo(() => {
    const participantsData =
      analyticsService.calculateParticipantsByMonth(events);

    const labels = participantsData.map((d) => {
      const [year, month] = d.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric',
      });
    });

    const data = participantsData.map((d) => d.participants);

    return {
      labels,
      datasets: [
        {
          label: 'Participants',
          data,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }, [events]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} participants`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="h-64" role="img" aria-label="Graphique d'évolution des participants">
      <Line data={chartData} options={options} />
    </div>
  );
};
