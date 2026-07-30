import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StarRating } from '../components/reviews/StarRating';

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders with the given value filled', () => {
    render(<StarRating value={3} readonly />);
    const buttons = screen.getAllByRole('button');
    const filled = buttons.filter((btn) =>
      btn.querySelector('span')?.className.includes('text-yellow-400'),
    );
    expect(filled).toHaveLength(3);
  });

  it('calls onChange with the clicked star value', () => {
    const onChange = vi.fn();
    render(<StarRating onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange when readonly', () => {
    const onChange = vi.fn();
    render(<StarRating onChange={onChange} readonly />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when no handler is provided', () => {
    render(<StarRating />);
    const buttons = screen.getAllByRole('button');
    expect(() => fireEvent.click(buttons[0])).not.toThrow();
  });

  it('disables all buttons when readonly', () => {
    render(<StarRating readonly />);
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('updates the displayed rating on hover and resets on mouse leave', () => {
    render(<StarRating value={1} />);
    const buttons = screen.getAllByRole('button');

    fireEvent.mouseEnter(buttons[4]);
    let filled = buttons.filter((btn) =>
      btn.querySelector('span')?.className.includes('text-yellow-400'),
    );
    expect(filled).toHaveLength(5);

    fireEvent.mouseLeave(buttons[4]);
    filled = buttons.filter((btn) =>
      btn.querySelector('span')?.className.includes('text-yellow-400'),
    );
    expect(filled).toHaveLength(1);
  });

  it('ignores hover when readonly', () => {
    render(<StarRating value={1} readonly />);
    const buttons = screen.getAllByRole('button');

    fireEvent.mouseEnter(buttons[4]);
    const filled = buttons.filter((btn) =>
      btn.querySelector('span')?.className.includes('text-yellow-400'),
    );
    expect(filled).toHaveLength(1);
  });

  it.each(['sm', 'md', 'lg'] as const)('applies the %s size class', (size) => {
    render(<StarRating size={size} />);
    const sizeClass = { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' }[size];
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn.className).toContain(sizeClass);
    });
  });
});
