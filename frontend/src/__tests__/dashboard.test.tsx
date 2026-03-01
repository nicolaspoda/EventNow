import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StatCard } from '../components/dashboard/StatCard';
import { EventStatusBadge } from '../components/events/EventStatusBadge';

expect.extend(toHaveNoViolations);

describe('Dashboard Components - Accessibility', () => {
  describe('StatCard', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <StatCard
          title="Événements totaux"
          value={42}
          icon="📊"
          color="blue"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should render with trend', async () => {
      const { container } = render(
        <StatCard
          title="Revenus"
          value="1234.56 €"
          icon="💰"
          color="yellow"
          trend={{ value: 15, isPositive: true }}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels for icon', () => {
      render(
        <StatCard
          title="Participants"
          value={100}
          icon="👥"
          color="purple"
        />,
      );
      const icon = screen.getByRole('img', { name: '👥' });
      expect(icon).toBeInTheDocument();
    });
  });

  describe('EventStatusBadge', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<EventStatusBadge status="ON_SALE" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA role and label', () => {
      render(<EventStatusBadge status="SOLD_OUT" />);
      const badge = screen.getByRole('status', { name: /Statut: Complet/i });
      expect(badge).toBeInTheDocument();
    });

    it('should render all status types', () => {
      const statuses = [
        'ON_SALE',
        'UPCOMING',
        'ALMOST_FULL',
        'SOLD_OUT',
        'COMPLETED',
      ];

      statuses.forEach((status) => {
        const { container } = render(<EventStatusBadge status={status} />);
        const badge = container.querySelector('[role="status"]');
        expect(badge).toBeInTheDocument();
      });
    });
  });
});
