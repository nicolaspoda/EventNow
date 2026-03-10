import { useState, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export function FormField({
  label,
  id,
  error,
  required,
  type = 'text',
  className = '',
  ...props
}: InputFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword && showPassword ? 'text' : type;
  const inputPaddingClass = isPassword ? 'pr-11' : '';

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required && (
          <span aria-label="requis" className="text-red-500 ml-1">*</span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          className={`${inputClassName} ${className} ${inputPaddingClass}`}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 rounded"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
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
