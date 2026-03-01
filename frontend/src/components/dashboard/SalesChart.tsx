import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { analyticsService } from '../../services/analyticsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

import type { DashboardEvent } from '../../types/dashboard.types';

interface SalesChartProps {
  events: DashboardEvent[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ events }) => {
  const chartData = useMemo(() => {
    const salesData = analyticsService.calculateSalesByCategory(events);

    const labels = salesData.map((d) => d.name);
    const data = salesData.map((d) => d.sold);

    return {
      labels,
      datasets: [
        {
          label: 'Billets vendus',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
      ],
    };
  }, [events]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} billets`,
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
    <div className="h-64" role="img" aria-label="Graphique des ventes par catégorie">
      <Bar data={chartData} options={options} />
    </div>
  );
};
