// Utility function to calculate the next trigger time for a reminder
export const getNextTriggerTime = (reminder) => {
  try {
    const now = new Date();

    if (reminder.type === 'hourly') {
      const startTime = new Date(reminder.hourlyStartTime || now);
      while (startTime < now) {
        startTime.setHours(startTime.getHours() + (reminder.hourlyInterval || 1));
      }
      return startTime;
    }

    if (reminder.type === 'weekly' && reminder.weeklyTimes && reminder.weeklyTimes.length > 0) {
      // Parse first time
      const firstTime = reminder.weeklyTimes[0];
      const [time, period] = (firstTime || '12:00 PM').split(' ');
      const [hours, minutes] = time.split(':').map(Number);

      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      const nextTrigger = new Date();
      nextTrigger.setHours(hour24, minutes, 0, 0);

      // If in past, move to next day
      if (nextTrigger < now) {
        nextTrigger.setDate(nextTrigger.getDate() + 1);
      }

      return nextTrigger;
    }

    if (reminder.type === '15days') {
      const triggerTime = new Date(reminder.fifteenDaysTime || now);
      const startDate = new Date(reminder.fifteenDaysStart || now);
      triggerTime.setFullYear(startDate.getFullYear());
      triggerTime.setMonth(startDate.getMonth());
      triggerTime.setDate(startDate.getDate());
      return triggerTime;
    }

    if (reminder.type === 'monthly') {
      const triggerTime = new Date(reminder.monthlyTime || now);
      triggerTime.setDate(reminder.monthlyDate || 1);
      return triggerTime;
    }

    // Default: 1 hour from now
    const defaultTime = new Date(now);
    defaultTime.setHours(defaultTime.getHours() + 1);
    return defaultTime;
  } catch (error) {
    console.error('Error calculating next trigger:', error);
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 1);
    return fallback;
  }
};

// Format trigger time for display
export const formatTriggerTime = (triggerTime) => {
  const now = new Date();
  const diff = triggerTime - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 24) {
    if (hours === 0) {
      return `in ${minutes} min`;
    }
    return `in ${hours}h ${minutes}m`;
  }

  return triggerTime.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get schedule description
export const getScheduleDescription = (reminder) => {
  if (reminder.type === 'hourly') {
    return `Every ${reminder.hourlyInterval || 1} ${
      reminder.hourlyInterval === 1 ? 'hour' : 'hours'
    }`;
  }

  if (reminder.type === 'weekly') {
    const days = reminder.weeklyDays?.join(', ') || 'Selected days';
    const times = reminder.weeklyTimes?.[0] || 'Set time';
    return `${days} at ${times}`;
  }

  if (reminder.type === '15days') {
    return 'Every 15 days';
  }

  if (reminder.type === 'monthly') {
    return `${reminder.monthlyDate || 1}${getDaySuffix(reminder.monthlyDate || 1)} of each month`;
  }

  return 'Custom schedule';
};

const getDaySuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};
