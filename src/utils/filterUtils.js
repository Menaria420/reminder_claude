// Filter utilities for reminder filtering and sorting

/**
 * Get the time slot for a given date
 * @param {Date} date - The date to check
 * @returns {string} - 'morning' | 'afternoon' | 'evening' | 'night'
 */
export const getTimeSlot = (date) => {
  const hours = date.getHours();

  if (hours >= 6 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 18) return 'afternoon';
  if (hours >= 18 && hours < 24) return 'evening';
  return 'night'; // 0-6
};

/**
 * Check if a date is within a date range
 * @param {Date} date - Date to check
 * @param {string} range - 'today' | 'tomorrow' | 'week' | 'month' | { start, end }
 * @returns {boolean}
 */
export const isInDateRange = (date, range) => {
  const now = new Date();
  const checkDate = new Date(date);

  // Reset time to start of day for comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDateStart = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate()
  );

  if (range === 'today') {
    return checkDateStart.getTime() === todayStart.getTime();
  }

  if (range === 'tomorrow') {
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return checkDateStart.getTime() === tomorrowStart.getTime();
  }

  if (range === 'week') {
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return checkDateStart >= todayStart && checkDateStart < weekEnd;
  }

  if (range === 'month') {
    const monthEnd = new Date(todayStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    return checkDateStart >= todayStart && checkDateStart < monthEnd;
  }

  // Custom range
  if (range && range.start && range.end) {
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    return checkDateStart >= startDate && checkDateStart <= endDate;
  }

  return true;
};

/**
 * Filter reminders by category
 * @param {Array} reminders - List of reminders
 * @param {Array} categories - Categories to filter by (e.g., ['medication', 'fitness'])
 * @returns {Array} - Filtered reminders
 */
export const filterByCategory = (reminders, categories) => {
  if (!categories || categories.length === 0) return reminders;

  return reminders.filter((reminder) => categories.includes(reminder.category?.toLowerCase()));
};

/**
 * Filter reminders by date range
 * @param {Array} reminders - List of reminders
 * @param {string|Object} dateRange - Date range to filter by
 * @returns {Array} - Filtered reminders
 */
export const filterByDate = (reminders, dateRange) => {
  if (!dateRange) return reminders;

  return reminders.filter((reminder) => isInDateRange(reminder.createdAt || new Date(), dateRange));
};

/**
 * Filter reminders by time slots
 * @param {Array} reminders - List of reminders
 * @param {Array} timeSlots - Time slots to filter by (e.g., ['morning', 'evening'])
 * @returns {Array} - Filtered reminders
 */
export const filterByTime = (reminders, timeSlots) => {
  if (!timeSlots || timeSlots.length === 0) return reminders;

  return reminders.filter((reminder) => {
    const slot = getTimeSlot(new Date(reminder.createdAt || new Date()));
    return timeSlots.includes(slot);
  });
};

/**
 * Filter reminders by type
 * @param {Array} reminders - List of reminders
 * @param {Array} types - Types to filter by (e.g., ['active', 'inactive'])
 * @returns {Array} - Filtered reminders
 */
export const filterByType = (reminders, types) => {
  if (!types || types.length === 0) return reminders;

  return reminders.filter((reminder) => {
    if (types.includes('active') && reminder.isActive) return true;
    if (types.includes('inactive') && !reminder.isActive) return true;
    if (types.includes('completed') && reminder.completed) return true;
    if (types.includes('missed') && reminder.missed) return true;
    return false;
  });
};

/**
 * Filter reminders by status
 * @param {Array} reminders - List of reminders
 * @param {Array} statuses - Statuses to filter by (e.g., ['onTime', 'late'])
 * @returns {Array} - Filtered reminders
 */
export const filterByStatus = (reminders, statuses) => {
  if (!statuses || statuses.length === 0) return reminders;

  return reminders.filter((reminder) => {
    // This is placeholder logic - adjust based on your reminder data structure
    const status = reminder.status || 'pending';
    return statuses.includes(status);
  });
};

/**
 * Apply all filters to reminders
 * @param {Array} reminders - List of reminders
 * @param {Object} filters - Filter object containing all filter criteria
 * @returns {Array} - Filtered reminders
 */
export const applyAllFilters = (reminders, filters) => {
  let filtered = [...reminders];

  if (filters.categories && filters.categories.length > 0) {
    filtered = filterByCategory(filtered, filters.categories);
  }

  if (filters.dateRange) {
    filtered = filterByDate(filtered, filters.dateRange);
  }

  if (filters.timeSlots && filters.timeSlots.length > 0) {
    filtered = filterByTime(filtered, filters.timeSlots);
  }

  if (filters.types && filters.types.length > 0) {
    filtered = filterByType(filtered, filters.types);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filterByStatus(filtered, filters.statuses);
  }

  return filtered;
};

/**
 * Sort reminders by date (newest first)
 * @param {Array} reminders - List of reminders
 * @returns {Array} - Sorted reminders
 */
export const sortByDateNewest = (reminders) => {
  return [...reminders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

/**
 * Sort reminders by date (oldest first)
 * @param {Array} reminders - List of reminders
 * @returns {Array} - Sorted reminders
 */
export const sortByDateOldest = (reminders) => {
  return [...reminders].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
};

/**
 * Sort reminders alphabetically
 * @param {Array} reminders - List of reminders
 * @param {string} direction - 'asc' (A-Z) or 'desc' (Z-A)
 * @returns {Array} - Sorted reminders
 */
export const sortAlphabetically = (reminders, direction = 'asc') => {
  return [...reminders].sort((a, b) => {
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();

    if (direction === 'asc') {
      return titleA.localeCompare(titleB);
    }
    return titleB.localeCompare(titleA);
  });
};

/**
 * Sort reminders by time
 * @param {Array} reminders - List of reminders
 * @param {string} direction - 'early' or 'late'
 * @returns {Array} - Sorted reminders
 */
export const sortByTime = (reminders, direction = 'early') => {
  return [...reminders].sort((a, b) => {
    const timeA =
      new Date(a.createdAt || 0).getHours() * 60 + new Date(a.createdAt || 0).getMinutes();
    const timeB =
      new Date(b.createdAt || 0).getHours() * 60 + new Date(b.createdAt || 0).getMinutes();

    if (direction === 'early') {
      return timeA - timeB;
    }
    return timeB - timeA;
  });
};

/**
 * Sort reminders by frequency (based on type)
 * @param {Array} reminders - List of reminders
 * @returns {Array} - Sorted reminders
 */
export const sortByFrequency = (reminders) => {
  const frequencyOrder = {
    daily: 1,
    hourly: 1, // backward compatibility, same priority as daily
    weekly: 2,
    '15days': 3,
    monthly: 4,
    custom: 5,
  };

  return [...reminders].sort((a, b) => {
    const freqA = frequencyOrder[a.type] || 999;
    const freqB = frequencyOrder[b.type] || 999;
    return freqA - freqB;
  });
};

/**
 * Apply sorting to reminders
 * @param {Array} reminders - List of reminders
 * @param {string} sortBy - Sort criteria
 * @returns {Array} - Sorted reminders
 */
export const applySorting = (reminders, sortBy) => {
  switch (sortBy) {
    case 'dateNewest':
      return sortByDateNewest(reminders);
    case 'dateOldest':
      return sortByDateOldest(reminders);
    case 'alphabeticalAsc':
      return sortAlphabetically(reminders, 'asc');
    case 'alphabeticalDesc':
      return sortAlphabetically(reminders, 'desc');
    case 'timeEarly':
      return sortByTime(reminders, 'early');
    case 'timeLate':
      return sortByTime(reminders, 'late');
    case 'frequency':
      return sortByFrequency(reminders);
    default:
      return reminders;
  }
};

/**
 * Get count of filtered reminders
 * @param {Array} reminders - Original list
 * @param {Array} filteredReminders - Filtered list
 * @returns {Object} - { total, filtered }
 */
export const getFilteredCount = (reminders, filteredReminders) => {
  return {
    total: reminders.length,
    filtered: filteredReminders.length,
  };
};

/**
 * Check if any filters are active
 * @param {Object} filters - Filter object
 * @returns {boolean}
 */
export const hasActiveFilters = (filters) => {
  if (!filters) return false;

  return (
    (filters.categories && filters.categories.length > 0) ||
    !!filters.dateRange ||
    (filters.timeSlots && filters.timeSlots.length > 0) ||
    (filters.types && filters.types.length > 0) ||
    (filters.statuses && filters.statuses.length > 0)
  );
};

/**
 * Get count of active filters
 * @param {Object} filters - Filter object
 * @returns {number}
 */
export const getActiveFilterCount = (filters) => {
  if (!filters) return 0;

  let count = 0;

  if (filters.categories && filters.categories.length > 0) count++;
  if (filters.dateRange) count++;
  if (filters.timeSlots && filters.timeSlots.length > 0) count++;
  if (filters.types && filters.types.length > 0) count++;
  if (filters.statuses && filters.statuses.length > 0) count++;

  return count;
};
