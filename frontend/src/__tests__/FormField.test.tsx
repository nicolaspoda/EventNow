import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormField, FormSelect } from '../components/FormField';

describe('FormField', () => {
  it('links the label to the input and renders no required marker by default', () => {
    const { container } = render(<FormField label="Email" id="email" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="requis"]')).not.toBeInTheDocument();
  });

  it('shows a required marker when required is true', () => {
    const { container } = render(<FormField label="Email" id="email" required />);

    expect(container.querySelector('[aria-label="requis"]')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-required', 'true');
  });

  it('shows the error message with alert role and marks the input invalid', () => {
    render(<FormField label="Email" id="email" error="Email invalide" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Email invalide');
  });

  it('calls onChange when the input value changes', () => {
    const onChange = vi.fn();
    render(<FormField label="Nom" id="name" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alice' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility for password fields', () => {
    render(<FormField label="Mot de passe" id="password" type="password" />);

    const input = screen.getByLabelText('Mot de passe');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Masquer le mot de passe' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not render a visibility toggle for non-password fields', () => {
    render(<FormField label="Email" id="email" type="email" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('FormSelect', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders the label and all options', () => {
    render(<FormSelect label="Catégorie" id="category" options={options} />);

    expect(screen.getByLabelText('Catégorie')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
  });

  it('calls onChange with the selected value', () => {
    const onChange = vi.fn();
    render(<FormSelect label="Catégorie" id="category" options={options} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'b' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('shows the error message and marks the select invalid', () => {
    render(
      <FormSelect label="Catégorie" id="category" options={options} error="Champ requis" />,
    );

    const select = screen.getByLabelText('Catégorie');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Champ requis');
  });
});
