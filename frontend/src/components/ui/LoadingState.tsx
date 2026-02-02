import React from 'react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Chargement...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
          aria-hidden="true"
        ></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
