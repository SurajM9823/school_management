import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
      case 'secondary':
        return 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 text-white';
      case 'outline':
        return 'bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 text-gray-700';
      case 'icon':
        return 'p-1.5 rounded-md hover:bg-gray-100 focus:ring-gray-300 text-gray-600 focus:ring-2 focus:ring-offset-1'; // Minimal styling for icon buttons
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return variant === 'icon' ? 'p-1 text-xs' : 'py-1.5 px-3 text-xs';
      case 'lg':
        return variant === 'icon' ? 'p-2 text-base' : 'py-3 px-6 text-base';
      default: // md
        return variant === 'icon' ? 'p-1.5 text-sm' : 'py-2 px-4 text-sm';
    }
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-md shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      
      {icon && !isLoading && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;