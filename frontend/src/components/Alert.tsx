import React from 'react';

interface AlertProps {
  message: string | React.ReactNode;
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  onDismiss?: () => void;
}

export function Alert({ message, variant = 'error', title, onDismiss }: AlertProps) {
  const safeMessage =
    typeof message === 'string'
      ? message
      : typeof message === 'object' && message !== null && 'message' in (message as object)
        ? String((message as { message?: unknown }).message)
        : typeof message === 'object' && message !== null
          ? "Une erreur s'est produite"
          : String(message);

  const styleMap = {
    error: 'bg-red-50 border-l-4 border-red-500 text-red-700',
    success: 'bg-green-50 border-l-4 border-green-500 text-green-700',
    warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700',
    info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-700',
  };

  const roleMap = {
    error: 'alert' as const,
    warning: 'alert' as const,
    success: 'status' as const,
    info: 'status' as const,
  };

  const ariaLiveMap = {
    error: 'assertive' as const,
    warning: 'assertive' as const,
    success: 'polite' as const,
    info: 'polite' as const,
  };

  return (
    <div
      className={`px-4 py-3 rounded ${styleMap[variant]}`}
      role={roleMap[variant]}
      aria-live={ariaLiveMap[variant]}
      aria-atomic="true"
    >
      <div className="flex justify-between items-start">
        <div>
          {title && <h3 className="font-bold mb-1">{title}</h3>}
          <p>{safeMessage}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Fermer le message"
            className="ml-4 text-current hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current rounded"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </div>
  );
}
