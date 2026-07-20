import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatCard } from '../components/dashboard/StatCard';

describe('StatCard', () => {
  it('renders the title and value', () => {
    render(<StatCard title="Billets vendus" value={128} />);

    expect(screen.getByText('Billets vendus')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });

  it('renders no trend indicator when trend is not provided', () => {
    render(<StatCard title="Billets vendus" value={128} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('shows a positive trend with an up arrow and green styling', () => {
    render(<StatCard title="Revenus" value="1200 €" trend={{ value: 12, isPositive: true }} />);

    const trend = screen.getByLabelText('Tendance positive de 12 pourcent');
    expect(trend).toHaveTextContent('↑ 12%');
    expect(trend).toHaveClass('text-green-600');
  });

  it('shows a negative trend with a down arrow, absolute value and red styling', () => {
    render(<StatCard title="Revenus" value="900 €" trend={{ value: -8, isPositive: false }} />);

    const trend = screen.getByLabelText('Tendance négative de 8 pourcent');
    expect(trend).toHaveTextContent('↓ 8%');
    expect(trend).toHaveClass('text-red-600');
  });
});
