/**
 * TIMEZONE FIX - Complete Solution
 *
 * Problem: Date objects saved to AsyncStorage are converted to ISO strings (UTC),
 * causing timezone conversion issues when loaded back.
 *
 * Solution: Store only time (hours and minutes) separately, not full Date objects.
 * This ensures consistent display across all screens.
 */

// Helper to extract time from Date
export const extractTimeFromDate = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  return {
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
};

// Helper to create Date from time components
export const createDateFromTime = (hours, minutes) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper to format time for display
export const formatTime12Hour = (hours, minutes) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

// Prepare reminder data for storage (extract times)
export const prepareReminderForStorage = (reminderData) => {
  const prepared = { ...reminderData };

  // Extract time components for daily reminders
  if (prepared.dailyStartTime) {
    const time = extractTimeFromDate(prepared.dailyStartTime);
    if (time) {
      prepared.dailyStartTime_hours = time.hours;
      prepared.dailyStartTime_minutes = time.minutes;
    }
    delete prepared.dailyStartTime; // Remove Date object
  }

  if (prepared.dailyExactDateTime) {
    const time = extractTimeFromDate(prepared.dailyExactDateTime);
    if (time) {
      prepared.dailyExactDateTime_hours = time.hours;
      prepared.dailyExactDateTime_minutes = time.minutes;
    }
    delete prepared.dailyExactDateTime;
  }

  // Extract time for 15-day reminders
  if (prepared.fifteenDaysTime) {
    const time = extractTimeFromDate(prepared.fifteenDaysTime);
    if (time) {
      prepared.fifteenDaysTime_hours = time.hours;
      prepared.fifteenDaysTime_minutes = time.minutes;
    }
    delete prepared.fifteenDaysTime;
  }

  if (prepared.fifteenDaysStart) {
    // Keep the date but as ISO string
    prepared.fifteenDaysStart = new Date(prepared.fifteenDaysStart).toISOString();
  }

  // Extract time for monthly reminders
  if (prepared.monthlyTime) {
    const time = extractTimeFromDate(prepared.monthlyTime);
    if (time) {
      prepared.monthlyTime_hours = time.hours;
      prepared.monthlyTime_minutes = time.minutes;
    }
    delete prepared.monthlyTime;
  }

  // Extract time for custom reminders
  if (prepared.customSettings && prepared.customSettings.time) {
    const time = extractTimeFromDate(prepared.customSettings.time);
    if (time) {
      prepared.customSettings = {
        ...prepared.customSettings,
        time_hours: time.hours,
        time_minutes: time.minutes,
      };
      delete prepared.customSettings.time;
    }
  }

  // Handle expiry date (keep as ISO string)
  if (prepared.expiryDate) {
    prepared.expiryDate = new Date(prepared.expiryDate).toISOString();
  }

  return prepared;
};

// Restore reminder data from storage (recreate Date objects)
export const restoreReminderFromStorage = (storedReminder) => {
  const restored = { ...storedReminder };

  // Restore daily times
  if (
    restored.dailyStartTime_hours !== undefined &&
    restored.dailyStartTime_minutes !== undefined
  ) {
    restored.dailyStartTime = createDateFromTime(
      restored.dailyStartTime_hours,
      restored.dailyStartTime_minutes
    );
  } else if (restored.hourlyStartTime_hours !== undefined) {
    // Backward compatibility
    restored.dailyStartTime = createDateFromTime(
      restored.hourlyStartTime_hours,
      restored.hourlyStartTime_minutes || 0
    );
  }

  if (
    restored.dailyExactDateTime_hours !== undefined &&
    restored.dailyExactDateTime_minutes !== undefined
  ) {
    restored.dailyExactDateTime = createDateFromTime(
      restored.dailyExactDateTime_hours,
      restored.dailyExactDateTime_minutes
    );
  }

  // Restore 15-day times
  if (
    restored.fifteenDaysTime_hours !== undefined &&
    restored.fifteenDaysTime_minutes !== undefined
  ) {
    restored.fifteenDaysTime = createDateFromTime(
      restored.fifteenDaysTime_hours,
      restored.fifteenDaysTime_minutes
    );
  }

  if (restored.fifteenDaysStart) {
    restored.fifteenDaysStart = new Date(restored.fifteenDaysStart);
  }

  // Restore monthly times
  if (restored.monthlyTime_hours !== undefined && restored.monthlyTime_minutes !== undefined) {
    restored.monthlyTime = createDateFromTime(
      restored.monthlyTime_hours,
      restored.monthlyTime_minutes
    );
  }

  // Restore custom times
  if (restored.customSettings) {
    if (
      restored.customSettings.time_hours !== undefined &&
      restored.customSettings.time_minutes !== undefined
    ) {
      restored.customSettings = {
        ...restored.customSettings,
        time: createDateFromTime(
          restored.customSettings.time_hours,
          restored.customSettings.time_minutes
        ),
      };
    }
  }

  // Restore expiry date
  if (restored.expiryDate) {
    restored.expiryDate = new Date(restored.expiryDate);
  }

  return restored;
};
