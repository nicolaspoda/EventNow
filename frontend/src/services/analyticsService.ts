import type { DashboardEvent } from '../types/dashboard.types';

export const analyticsService = {
  calculateRevenueByMonth: (events: DashboardEvent[]) => {
    const revenueByMonth: Record<string, number> = {};

    events.forEach((event) => {
      const date = new Date(event.eventDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!revenueByMonth[monthKey]) {
        revenueByMonth[monthKey] = 0;
      }

      revenueByMonth[monthKey] += event.stats.revenue || 0;
    });

    return Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month,
        revenue,
      }));
  },

  calculateSalesByCategory: (events: DashboardEvent[]) => {
    const salesByCategory: Record<string, { sold: number; revenue: number }> =
      {};

    events.forEach((event) => {
      event.ticketCategories?.forEach((cat) => {
        if (!salesByCategory[cat.name]) {
          salesByCategory[cat.name] = { sold: 0, revenue: 0 };
        }

        const sold = cat.initialStock - cat.currentStock;
        salesByCategory[cat.name].sold += sold;
        salesByCategory[cat.name].revenue += sold * cat.price;
      });
    });

    return Object.entries(salesByCategory).map(([name, data]) => ({
      name,
      sold: data.sold,
      revenue: data.revenue,
    }));
  },

  calculateParticipantsByMonth: (events: DashboardEvent[]) => {
    const participantsByMonth: Record<string, number> = {};

    events.forEach((event) => {
      const date = new Date(event.eventDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!participantsByMonth[monthKey]) {
        participantsByMonth[monthKey] = 0;
      }

      participantsByMonth[monthKey] +=
        event.stats.totalSold || event.stats.totalParticipants || 0;
    });

    return Object.entries(participantsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, participants]) => ({
        month,
        participants,
      }));
  },

  calculateFillRateDistribution: (events: DashboardEvent[]) => {
    const ranges = {
      '0-25%': 0,
      '25-50%': 0,
      '50-75%': 0,
      '75-100%': 0,
      'Complet': 0,
    };

    events.forEach((event) => {
      const fillRate = event.stats.fillRate;

      if (fillRate >= 100) {
        ranges['Complet']++;
      } else if (fillRate >= 75) {
        ranges['75-100%']++;
      } else if (fillRate >= 50) {
        ranges['50-75%']++;
      } else if (fillRate >= 25) {
        ranges['25-50%']++;
      } else {
        ranges['0-25%']++;
      }
    });

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
    }));
  },
};
