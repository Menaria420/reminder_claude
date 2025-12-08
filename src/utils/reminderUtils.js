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

    if (reminder.type === 'daily' || reminder.type === 'hourly') {
      // Handle exact mode
      if (reminder.dailyMode === 'exact') {
        const exactTime = new Date(reminder.dailyExactDateTime);
        if (!isNaN(exactTime.getTime())) {
          const hours = exactTime.getHours();
          const minutes = exactTime.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const displayMinutes = minutes.toString().padStart(2, '0');
          return `${exactTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${displayHours}:${displayMinutes} ${period}`;
        }
      }

      // Convert string to Date if needed (backward compatibility)
      const startTime =
        (reminder.dailyStartTime || reminder.hourlyStartTime) instanceof Date
          ? (reminder.dailyStartTime || reminder.hourlyStartTime)
          : new Date(reminder.dailyStartTime || reminder.hourlyStartTime);

      if (isNaN(startTime.getTime())) {
        return `Every ${reminder.dailyInterval || reminder.hourlyInterval || 1} hour(s)`;
      }

      // Use TODAY's date with the selected time
      let nextTime = new Date();
      nextTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

      // Adjust to future
      while (nextTime < now) {
        nextTime.setHours(nextTime.getHours() + (reminder.dailyInterval || reminder.hourlyInterval || 1));
      }

      const hours = nextTime.getHours();
      const minutes = nextTime.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');

      return `${displayHours}:${displayMinutes} ${period}`;
    }

    if (reminder.type === 'weekly') {
      if (reminder.weeklyDays && reminder.weeklyDays.length > 0) {
        const days = reminder.weeklyDays.join(', ');
        // Get first time if available
        const firstDay = reminder.weeklyDays[0];
        const times = reminder.weeklyTimes[firstDay];
        if (times && times.length > 0) {
          return `${days} at ${times[0]}`;
        }
        return `Weekly on ${days}`;
      }
      return 'Weekly';
    }

    if (reminder.type === '15days') {
      const start =
        reminder.fifteenDaysStart instanceof Date
          ? reminder.fifteenDaysStart
          : new Date(reminder.fifteenDaysStart);

      const time =
        reminder.fifteenDaysTime instanceof Date
          ? reminder.fifteenDaysTime
          : new Date(reminder.fifteenDaysTime);

      if (!isNaN(start.getTime()) && !isNaN(time.getTime())) {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        const timeStr = `${displayHours}:${displayMinutes} ${period}`;

        return `Every 15 days at ${timeStr}`;
      }
      return 'Every 15 days';
    }

    if (reminder.type === 'monthly') {
      const date = reminder.monthlyDate;
      const time =
        reminder.monthlyTime instanceof Date
          ? reminder.monthlyTime
          : new Date(reminder.monthlyTime);

      if (!isNaN(time.getTime())) {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        const timeStr = `${displayHours}:${displayMinutes} ${period}`;

        if (date === 'last') return `Last day of month at ${timeStr}`;
        return `${date}${getDaySuffix(date)} of month at ${timeStr}`;
      }
      return 'Monthly';
    }

    if (reminder.type === 'custom') {
      const { customSettings } = reminder;
      if (!customSettings) return 'Custom';

      const time =
        customSettings.time instanceof Date ? customSettings.time : new Date(customSettings.time);

      if (!isNaN(time.getTime())) {
        const hours = time.getHours();
        const minutes = time.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        const timeStr = `${displayHours}:${displayMinutes} ${period}`;

        if (customSettings.dateRepeat === 'every') return `Daily at ${timeStr}`;
        if (customSettings.monthRepeat === 'every')
          return `Monthly on ${customSettings.date}${getDaySuffix(
            customSettings.date
          )} at ${timeStr}`;
        if (customSettings.yearRepeat === 'every')
          return `Yearly on ${customSettings.month}/${customSettings.date} at ${timeStr}`;

        return `${customSettings.month}/${customSettings.date}/${customSettings.year} at ${timeStr}`;
      }
      return 'Custom';
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
    if (!reminder) {
      return 'Not set';
    }

    const now = new Date();
    let nextTrigger = null;

    if (reminder.type === 'daily' || reminder.type === 'hourly') {
      // Handle exact mode
      if (reminder.dailyMode === 'exact') {
        nextTrigger = new Date(reminder.dailyExactDateTime);
        if (isNaN(nextTrigger.getTime())) {
          return 'Invalid date/time';
        }
      } else {
        // Convert string to Date if needed (backward compatibility)
        const startTime =
          (reminder.dailyStartTime || reminder.hourlyStartTime) instanceof Date
            ? (reminder.dailyStartTime || reminder.hourlyStartTime)
            : new Date(reminder.dailyStartTime || reminder.hourlyStartTime);

        if (isNaN(startTime.getTime())) {
          return 'Invalid time';
        }

        // IMPORTANT: Use TODAY's date with the selected time
        // Don't use the stored date as it might be from the past
        nextTrigger = new Date();
        nextTrigger.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

        const interval = reminder.dailyInterval || reminder.hourlyInterval || 1;

        // Find next occurrence
        while (nextTrigger < now) {
          nextTrigger.setHours(nextTrigger.getHours() + interval);
        }
      }
    } else if (reminder.type === 'weekly') {
      // Find the next occurrence
      const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

      for (const day of reminder.weeklyDays) {
        const times = reminder.weeklyTimes[day] || [];

        if (times.length === 0) {
          continue;
        }

        for (const timeStr of times) {
          try {
            // Parse time string like "9:00 AM"
            const trimmed = timeStr.trim();
            // Use regex to split on any whitespace (handles non-breaking spaces)
            const parts = trimmed.split(/\s+/);

            if (parts.length !== 2) {
              // Try alternative parsing: look for AM/PM at the end
              const ampmMatch = trimmed.match(/^(.+?)\s*(AM|PM)$/i);
              if (ampmMatch) {
                const [, timePart, period] = ampmMatch;
                parts[0] = timePart.trim();
                parts[1] = period.toUpperCase();
              } else {
                continue;
              }
            }

            const [time, period] = parts;
            const [hoursStr, minutesStr] = time.split(':');

            if (!hoursStr || !minutesStr) {
              continue;
            }

            let hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);

            if (isNaN(hours) || isNaN(minutes)) {
              continue;
            }

            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const dayIndex = dayMap[day];
            if (dayIndex === undefined) {
              continue;
            }

            const currentDayIndex = now.getDay();
            let daysUntil = dayIndex - currentDayIndex;
            if (daysUntil < 0) daysUntil += 7;

            const potentialDate = new Date(now);
            potentialDate.setDate(now.getDate() + daysUntil);
            potentialDate.setHours(hours, minutes, 0, 0);

            // If it's today but time has passed, move to next week
            if (daysUntil === 0 && potentialDate < now) {
              potentialDate.setDate(potentialDate.getDate() + 7);
            }

            if (!nextTrigger || potentialDate < nextTrigger) {
              nextTrigger = potentialDate;
            }
          } catch (err) {
            console.error('Error parsing weekly time:', timeStr, err);
            continue;
          }
        }
      }

      if (!nextTrigger) {
        return 'No times set';
      }
    } else if (reminder.type === '15days') {
      // Convert strings to Date if needed
      const startDate =
        reminder.fifteenDaysStart instanceof Date
          ? reminder.fifteenDaysStart
          : new Date(reminder.fifteenDaysStart);

      const timeDate =
        reminder.fifteenDaysTime instanceof Date
          ? reminder.fifteenDaysTime
          : new Date(reminder.fifteenDaysTime);

      if (isNaN(startDate.getTime()) || isNaN(timeDate.getTime())) {
        return 'Invalid date';
      }

      nextTrigger = new Date(startDate);
      nextTrigger.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

      // Find next occurrence (every 15 days from start)
      while (nextTrigger < now) {
        nextTrigger.setDate(nextTrigger.getDate() + 15);
      }
    } else if (reminder.type === 'monthly') {
      // Convert string to Date if needed
      const timeDate =
        reminder.monthlyTime instanceof Date
          ? reminder.monthlyTime
          : new Date(reminder.monthlyTime);

      if (isNaN(timeDate.getTime())) {
        return 'Invalid time';
      }

      nextTrigger = new Date();
      nextTrigger.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);

      const date = reminder.monthlyDate;

      if (date === 'last') {
        // Set to last day of current month
        nextTrigger.setMonth(nextTrigger.getMonth() + 1, 0);
      } else {
        nextTrigger.setDate(date);
      }

      // If this month's date has passed, move to next month
      if (nextTrigger < now) {
        if (date === 'last') {
          nextTrigger.setMonth(nextTrigger.getMonth() + 2, 0);
        } else {
          nextTrigger.setMonth(nextTrigger.getMonth() + 1);
          nextTrigger.setDate(date);
        }
      }
    } else if (reminder.type === 'custom') {
      const { customSettings } = reminder;
      if (customSettings) {
        // Convert string to Date if needed
        const timeDate =
          customSettings.time instanceof Date ? customSettings.time : new Date(customSettings.time);

        if (isNaN(timeDate.getTime())) {
          return 'Invalid time';
        }

        nextTrigger = new Date(timeDate);

        // Set year
        if (customSettings.yearRepeat === 'specific') {
          nextTrigger.setFullYear(customSettings.year);
        } else {
          nextTrigger.setFullYear(now.getFullYear());
        }

        // Set month
        if (customSettings.monthRepeat === 'specific') {
          nextTrigger.setMonth(customSettings.month - 1); // 0-indexed
        } else {
          nextTrigger.setMonth(now.getMonth());
        }

        // Set date
        if (customSettings.dateRepeat === 'specific') {
          nextTrigger.setDate(customSettings.date);
        } else {
          nextTrigger.setDate(now.getDate());
        }

        // If calculated time is in the past, adjust based on repetition
        if (nextTrigger < now) {
          if (customSettings.dateRepeat === 'every') {
            // Daily - move to tomorrow
            nextTrigger.setDate(nextTrigger.getDate() + 1);
          } else if (customSettings.monthRepeat === 'every') {
            // Monthly - move to next month
            nextTrigger.setMonth(nextTrigger.getMonth() + 1);
          } else if (customSettings.yearRepeat === 'every') {
            // Yearly - move to next year
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

      // Format time consistently
      const hours = nextTrigger.getHours();
      const minutes = nextTrigger.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      const time = `${displayHours}:${displayMinutes} ${period}`;

      return `${date} ${dayName}, ${monthName} ${year} at ${time}`;
    }

    return 'Not set';
  } catch (error) {
    console.error('Error formatting next trigger:', error);
    return 'Error';
  }
};
