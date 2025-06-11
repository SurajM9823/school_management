import React from 'react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'teal';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  color = 'blue',
}) => {
  const getIconBgColor = () => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'teal':
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const getTrendColor = () => {
    if (!change) return '';
    
    switch (change.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          
          {change && (
            <div className="mt-1 flex items-center">
              <span className={clsx('text-sm', getTrendColor())}>
                {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'} {change.value}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={clsx('p-3 rounded-full', getIconBgColor())}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;