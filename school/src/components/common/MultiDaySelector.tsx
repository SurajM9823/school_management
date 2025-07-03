import React from 'react';

interface Day {
  value: string;
  label: string;
}

interface MultiDaySelectorProps {
  days: Day[];
  selectedDays: string[];
  onChange: (days: string[]) => void;
}

const MultiDaySelector: React.FC<MultiDaySelectorProps> = ({ days, selectedDays, onChange }) => {
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {days.map(day => (
        <div 
          key={day.value}
          onClick={() => toggleDay(day.value)}
          className={`
            cursor-pointer px-3 py-1 rounded-full text-sm font-medium
            ${selectedDays.includes(day.value) 
              ? 'bg-blue-100 text-blue-800 border-blue-300' 
              : 'bg-gray-100 text-gray-600 border-gray-200'}
            border hover:bg-blue-50 transition-colors
          `}
        >
          {day.label}
        </div>
      ))}
    </div>
  );
};

export default MultiDaySelector;