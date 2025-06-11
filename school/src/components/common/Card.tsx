import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode; // Changed from string to React.ReactNode
  className?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, title, className, footer }) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow-sm overflow-hidden', className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;