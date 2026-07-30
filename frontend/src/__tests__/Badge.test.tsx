import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Badge from '../components/ui/Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders a dot indicator when dot is true', () => {
    const { container } = render(<Badge dot>Actif</Badge>);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders no dot indicator by default', () => {
    const { container } = render(<Badge>Actif</Badge>);
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('applies a custom className', () => {
    render(<Badge className="custom-class">Tag</Badge>);
    expect(screen.getByText('Tag')).toHaveClass('custom-class');
  });
});
