import { type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

interface FormFieldBaseProps {
  label: string;
  id: string;
  error?: string;
}

interface InputFieldProps
  extends FormFieldBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {}

interface SelectFieldProps
  extends FormFieldBaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  options: { value: string; label: string }[];
}

const inputClassName =
  'w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition';
const labelClassName = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2';

export function FormField({
  label,
  id,
  error,
  required,
  className = '',
  ...props
}: InputFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && (
          <span aria-label="requis" className="text-red-500 ml-1">*</span>
        )}
      </label>
      <input
        id={id}
        className={`${inputClassName} ${className}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSelect({
  label,
  id,
  options,
  error,
  required,
  className = '',
  ...props
}: SelectFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && (
          <span aria-label="requis" className="text-red-500 ml-1">*</span>
        )}
      </label>
      <select
        id={id}
        className={`${inputClassName} ${className}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
