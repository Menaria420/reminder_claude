import { Platform } from 'react-native';

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

export const getReminderDisplayTime = (reminder) => {
  try {
    if (!reminder) return '';
    const now = new Date();

    if (reminder.type === 'hourly') {
      // For hourly, we might want to show "Every X hours" or the next time
      // But calculating next time requires loop.
      // Let's show "Every X hours" if interval > 1, else "Hourly"
      // Or better: calculate next occurrence relative to now
      const startTime = new Date(reminder.hourlyStartTime);
      let nextTime = new Date(startTime);
      // If start time is valid
      if (!isNaN(nextTime.getTime())) {
        // Adjust to future
        while (nextTime < now) {
          nextTime.setHours(nextTime.getHours() + (reminder.hourlyInterval || 1));
        }
        return nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `Every ${reminder.hourlyInterval || 1} hour(s)`;
    }

    if (reminder.type === 'weekly') {
      if (reminder.weeklyDays && reminder.weeklyDays.length > 0) {
        // Show "Mon, Wed at 9:00 AM" or similar
        // If multiple days/times, it's complex.
        // Let's show the *next* occurrence.
        // This requires complex logic.
        // For simplicity in card: "Weekly: Mon, Tue..."
        const days = reminder.weeklyDays.join(', ');
        // If times are same for all days?
        // Let's just return "Weekly on " + days
        return `Weekly on ${days}`;
      }
      return 'Weekly';
    }

    if (reminder.type === '15days') {
      const start = new Date(reminder.fifteenDaysStart);
      return `Every 15 days from ${start.toLocaleDateString()}`;
    }

    if (reminder.type === 'monthly') {
      const date = reminder.monthlyDate;
      const time = new Date(reminder.monthlyTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (date === 'last') return `Last day of month at ${time}`;
      return `${date}${getDaySuffix(date)} of month at ${time}`;
    }

    if (reminder.type === 'custom') {
      const { customSettings } = reminder;
      if (!customSettings) return 'Custom';

      const time = new Date(customSettings.time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (customSettings.dateRepeat === 'every') return `Daily at ${time}`;
      if (customSettings.monthRepeat === 'every')
        return `Monthly on ${customSettings.date}${getDaySuffix(customSettings.date)} at ${time}`;
      if (customSettings.yearRepeat === 'every')
        return `Yearly on ${customSettings.month}/${customSettings.date} at ${time}`;

      return `${customSettings.month}/${customSettings.date}/${customSettings.year} at ${time}`;
    }

    return 'Scheduled';
  } catch (error) {
    console.error('Error getting display time:', error);
    return 'Error';
  }
};

// Get formatted next trigger date like "2 Sat, Nov 29, 2025 at 9:00 AM"
export const getFormattedNextTrigger = (reminder) => {
  try {
    if (!reminder) return 'Not set';

    const now = new Date();
    let nextTrigger = null;

    if (reminder.type === 'hourly') {
      const startTime = new Date(reminder.hourlyStartTime);
      nextTrigger = new Date(startTime);
      while (nextTrigger < now) {
        nextTrigger.setHours(nextTrigger.getHours() + (reminder.hourlyInterval || 1));
      }
    } else if (
      reminder.type === 'weekly' &&
      reminder.weeklyDays &&
      reminder.weeklyDays.length > 0
    ) {
      // Find the next occurrence
      const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

      for (const day of reminder.weeklyDays) {
        const times = reminder.weeklyTimes[day] || [];
        for (const timeStr of times) {
          const [time, period] = timeStr.split(' ');
          const [hoursStr, minutesStr] = time.split(':');
          let hours = parseInt(hoursStr, 10);
          const minutes = parseInt(minutesStr, 10);

          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;

          const dayIndex = dayMap[day];
          const currentDayIndex = now.getDay();
          let daysUntil = dayIndex - currentDayIndex;
          if (daysUntil < 0) daysUntil += 7;

          const potentialDate = new Date(now);
          potentialDate.setDate(now.getDate() + daysUntil);
          potentialDate.setHours(hours, minutes, 0, 0);

          if (daysUntil === 0 && potentialDate < now) {
            potentialDate.setDate(potentialDate.getDate() + 7);
          }

          if (!nextTrigger || potentialDate < nextTrigger) {
            nextTrigger = potentialDate;
          }
        }
      }
    } else if (reminder.type === '15days') {
      nextTrigger = new Date(reminder.fifteenDaysStart);
      const time = new Date(reminder.fifteenDaysTime);
      nextTrigger.setHours(time.getHours(), time.getMinutes(), 0, 0);
    } else if (reminder.type === 'monthly') {
      nextTrigger = new Date(reminder.monthlyTime);
      const date = reminder.monthlyDate;
      if (date === 'last') {
        nextTrigger.setMonth(nextTrigger.getMonth() + 1, 0);
      } else {
        nextTrigger.setDate(date);
      }
      if (nextTrigger < now) {
        nextTrigger.setMonth(nextTrigger.getMonth() + 1);
      }
    } else if (reminder.type === 'custom') {
      const { customSettings } = reminder;
      if (customSettings) {
        nextTrigger = new Date(customSettings.time);

        if (customSettings.yearRepeat === 'specific') {
          nextTrigger.setFullYear(customSettings.year);
        } else {
          nextTrigger.setFullYear(now.getFullYear());
        }

        if (customSettings.monthRepeat === 'specific') {
          nextTrigger.setMonth(customSettings.month - 1);
        } else {
          nextTrigger.setMonth(now.getMonth());
        }

        if (customSettings.dateRepeat === 'specific') {
          nextTrigger.setDate(customSettings.date);
        } else {
          nextTrigger.setDate(now.getDate());
        }

        if (nextTrigger < now) {
          if (customSettings.dateRepeat === 'every') {
            nextTrigger.setDate(nextTrigger.getDate() + 1);
          } else if (customSettings.monthRepeat === 'every') {
            nextTrigger.setMonth(nextTrigger.getMonth() + 1);
          } else if (customSettings.yearRepeat === 'every') {
            nextTrigger.setFullYear(nextTrigger.getFullYear() + 1);
          }
        }
      }
    }

    if (nextTrigger && !isNaN(nextTrigger.getTime())) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      const dayName = days[nextTrigger.getDay()];
      const monthName = months[nextTrigger.getMonth()];
      const date = nextTrigger.getDate();
      const year = nextTrigger.getFullYear();
      const time = nextTrigger.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `${date} ${dayName}, ${monthName} ${year} at ${time}`;
    }

    return 'Not set';
  } catch (error) {
    console.error('Error formatting next trigger:', error);
    return 'Error';
  }
};
