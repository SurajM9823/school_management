// Helper function to calculate start time based on period number
export const calculateStartTimeFromPeriod = (
  periodNumber: number,
  schoolStartTime: string,
  periodDuration: number,
  breaks: any[]
): string => {
  // Convert school start time to minutes since midnight
  const [hours, minutes] = schoolStartTime.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  // Add time for previous periods and breaks
  for (let period = 1; period < periodNumber; period++) {
    // Add period duration
    totalMinutes += periodDuration;
    
    // Check if there's a break after this period
    const breakAfterPeriod = breaks.find(b => {
      const [breakHours, breakMinutes] = b.start_time.split(':').map(Number);
      const breakTotalMinutes = breakHours * 60 + breakMinutes;
      return breakTotalMinutes === totalMinutes;
    });
    
    if (breakAfterPeriod) {
      totalMinutes += breakAfterPeriod.duration;
    }
  }
  
  // Convert back to HH:MM format
  const resultHours = Math.floor(totalMinutes / 60);
  const resultMinutes = totalMinutes % 60;
  return `${resultHours.toString().padStart(2, '0')}:${resultMinutes.toString().padStart(2, '0')}`;
};

// Helper function to get days of the week with checkboxes
export const getDaysOfWeek = () => [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];