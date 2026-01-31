interface AlertProps {
  message: string;
  variant?: 'error' | 'success';
}

export function Alert({ message, variant = 'error' }: AlertProps) {
  const styles =
    variant === 'error'
      ? 'bg-red-50 border border-red-200 text-red-700'
      : 'bg-green-50 border border-green-200 text-green-700';

  return (
    <div className={`px-4 py-3 rounded-xl ${styles}`} role="alert">
      {message}
    </div>
  );
}
