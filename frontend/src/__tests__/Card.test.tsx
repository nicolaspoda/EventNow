import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Contenu</Card>);
    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Cliquable</Card>);

    fireEvent.click(screen.getByText('Cliquable'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the hover classes only when hover is true', () => {
    const { rerender } = render(<Card>Contenu</Card>);
    expect(screen.getByText('Contenu')).not.toHaveClass('hover:-translate-y-1');

    rerender(<Card hover>Contenu</Card>);
    expect(screen.getByText('Contenu')).toHaveClass('hover:-translate-y-1');
  });

  it('applies the gradient background only when gradient is true', () => {
    const { rerender } = render(<Card>Contenu</Card>);
    expect(screen.getByText('Contenu')).not.toHaveClass('bg-gradient-to-br');

    rerender(<Card gradient>Contenu</Card>);
    expect(screen.getByText('Contenu')).toHaveClass('bg-gradient-to-br');
  });

  it('applies a custom className', () => {
    render(<Card className="custom-class">Contenu</Card>);
    expect(screen.getByText('Contenu')).toHaveClass('custom-class');
  });
});

describe('CardHeader / CardBody / CardFooter', () => {
  it('render their children with the expected custom class applied', () => {
    render(
      <>
        <CardHeader className="header-class">En-tête</CardHeader>
        <CardBody className="body-class">Corps</CardBody>
        <CardFooter className="footer-class">Pied</CardFooter>
      </>,
    );

    expect(screen.getByText('En-tête')).toHaveClass('header-class');
    expect(screen.getByText('Corps')).toHaveClass('body-class');
    expect(screen.getByText('Pied')).toHaveClass('footer-class');
  });
});
