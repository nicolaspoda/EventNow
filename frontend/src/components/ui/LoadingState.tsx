import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Chargement...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"
          aria-hidden="true"
        ></div>
        <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
