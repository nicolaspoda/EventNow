import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  gradient?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  gradient = false,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={[
        'bg-white rounded-2xl shadow-md overflow-hidden',
        hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : '',
        gradient ? 'bg-gradient-to-br from-white to-primary-50' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-6 py-5 border-b border-neutral-100 ${className}`}>{children}</div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-6 py-5 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`px-6 py-4 bg-neutral-50 border-t border-neutral-100 ${className}`}>
    {children}
  </div>
);
