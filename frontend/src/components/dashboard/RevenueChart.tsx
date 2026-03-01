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

interface RevenueChartProps {
  events: DashboardEvent[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ events }) => {
  const chartData = useMemo(() => {
    const revenueData = analyticsService.calculateRevenueByMonth(events);

    const labels = revenueData.map((d) => {
      const [year, month] = d.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: 'numeric',
      });
    });

    const data = revenueData.map((d) => d.revenue);

    return {
      labels,
      datasets: [
        {
          label: 'Revenus (€)',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
          label: (context) => `${context.parsed.y?.toFixed(2) ?? '0.00'} €`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value} €`,
        },
      },
    },
  };

  return (
    <div className="h-64" role="img" aria-label="Graphique d'évolution des revenus">
      <Line data={chartData} options={options} />
    </div>
  );
};
