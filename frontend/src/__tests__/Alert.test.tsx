import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert } from '../components/Alert';

describe('Alert message rendering', () => {
  it('renders a plain string message as-is', () => {
    render(<Alert message="Simple error text" variant="error" />);
    expect(screen.getByText('Simple error text')).toBeInTheDocument();
  });

  it('extracts and renders the "message" property of an object', () => {
    const errorLike = { message: 'Erreur X' } as unknown as string;
    render(<Alert message={errorLike} variant="error" />);
    expect(screen.getByText('Erreur X')).toBeInTheDocument();
  });

  it('renders the fallback text for an object without a "message" property', () => {
    const errorLike = { code: 500 } as unknown as string;
    render(<Alert message={errorLike} variant="error" />);
    expect(screen.getByText("Une erreur s'est produite")).toBeInTheDocument();
  });

  it('renders the fallback text for an empty object', () => {
    const errorLike = {} as unknown as string;
    render(<Alert message={errorLike} variant="error" />);
    expect(screen.getByText("Une erreur s'est produite")).toBeInTheDocument();
  });

  it('stringifies a non-string, non-object message', () => {
    render(<Alert message={42} variant="error" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});

describe('Alert title', () => {
  it('renders an <h3> with the title when provided', () => {
    render(<Alert message="Something went wrong" title="Attention" variant="error" />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Attention' });
    expect(heading).toBeInTheDocument();
  });

  it('renders no heading when the title is absent', () => {
    render(<Alert message="Something went wrong" variant="error" />);
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });
});

describe('Alert dismiss button', () => {
  it('renders a close button and calls onDismiss when clicked', () => {
    const onDismiss = vi.fn();
    render(<Alert message="Dismissible" variant="info" onDismiss={onDismiss} />);

    const button = screen.getByRole('button', { name: 'Fermer le message' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders no close button when onDismiss is absent', () => {
    render(<Alert message="Not dismissible" variant="info" />);
    expect(screen.queryByRole('button', { name: 'Fermer le message' })).not.toBeInTheDocument();
  });
});

describe('Alert variant role and aria-live', () => {
  it.each([
    ['error', 'alert', 'assertive'],
    ['warning', 'alert', 'assertive'],
    ['success', 'status', 'polite'],
    ['info', 'status', 'polite'],
  ] as const)('variant="%s" uses role="%s" and aria-live="%s"', (variant, role, ariaLive) => {
    render(<Alert message="Variant test" variant={variant} />);
    const alertEl = screen.getByRole(role);
    expect(alertEl).toHaveAttribute('aria-live', ariaLive);
    expect(alertEl).toHaveAttribute('aria-atomic', 'true');
  });
});
