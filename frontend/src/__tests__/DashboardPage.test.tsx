import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardPage } from '../pages/DashboardPage';

vi.mock('../pages/DashboardRedirectPage', () => ({
  DashboardRedirectPage: () => <div data-testid="dashboard-redirect" />,
}));

describe('DashboardPage', () => {
  it('renders DashboardRedirectPage', () => {
    render(<DashboardPage />);

    expect(screen.getByTestId('dashboard-redirect')).toBeInTheDocument();
  });
});
