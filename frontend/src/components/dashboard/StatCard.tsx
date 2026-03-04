import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
}) => {
  return (
    <article className="bg-white dark:bg-neutral-800/50 rounded-lg shadow p-6 border border-neutral-200 dark:border-neutral-700">
      {trend && (
        <div className="flex items-center justify-end mb-4">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
            aria-label={`Tendance ${trend.isPositive ? 'positive' : 'négative'} de ${Math.abs(trend.value)} pourcent`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        </div>
      )}
      <h3 className="text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
    </article>
  );
};
