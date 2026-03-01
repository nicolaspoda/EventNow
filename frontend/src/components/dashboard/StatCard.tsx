import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <article className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl`}
          role="img"
          aria-label={icon}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
            aria-label={`Tendance ${trend.isPositive ? 'positive' : 'négative'} de ${Math.abs(trend.value)} pourcent`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </article>
  );
};
