import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  className = '',
  ...props
}) => {
  return (
    <button
      aria-label={ariaLabel}
      className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
};

export default IconButton;
