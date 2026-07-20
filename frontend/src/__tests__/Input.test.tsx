import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Input } from '../components/ui/Input';

describe('Input', () => {
  it('renders the label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows a required marker only when required is true', () => {
    const { rerender } = render(<Input label="Email" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();

    rerender(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows the hint text when there is no error', () => {
    render(<Input label="Email" hint="Utilisez votre email pro" />);
    expect(screen.getByText('Utilisez votre email pro')).toBeInTheDocument();
  });

  it('shows the error message instead of the hint, with an alert role', () => {
    render(<Input label="Email" hint="Astuce" error="Email invalide" id="email" />);

    expect(screen.queryByText('Astuce')).not.toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Email invalide');
  });

  it('marks the input as invalid and links it to the error message via aria-describedby', () => {
    render(<Input label="Email" error="Email invalide" id="email" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('links the input to the hint via aria-describedby when there is no error', () => {
    render(<Input label="Email" hint="Astuce" id="email" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'email-hint');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('renders left and right icons when provided', () => {
    render(
      <Input
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
      />,
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('calls onChange with the typed value', () => {
    const onChange = vi.fn();
    render(<Input label="Nom" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alice' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as React.ChangeEvent<HTMLInputElement>).target.value).toBe(
      'Alice',
    );
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} label="Nom" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Input label="Nom" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
