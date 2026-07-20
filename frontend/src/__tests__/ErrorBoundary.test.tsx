import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

function Bomb(): never {
  throw new Error('Boom explosion');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Contenu normal</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Contenu normal')).toBeInTheDocument();
  });

  it('catches an error thrown by a child and shows the default fallback with the error message', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Une erreur s'est produite")).toBeInTheDocument();
    expect(screen.getByText('Boom explosion')).toBeInTheDocument();
    expect(screen.queryByText('Contenu normal')).not.toBeInTheDocument();
  });

  it('renders a custom fallback instead of the default one when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Oups, un problème</div>}>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Oups, un problème')).toBeInTheDocument();
    expect(screen.queryByText("Une erreur s'est produite")).not.toBeInTheDocument();
  });

  it('logs the caught error to the console instead of letting it crash the app', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary a capturé une erreur:',
      expect.any(Error),
      expect.anything(),
    );
  });
});
