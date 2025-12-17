import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationManager from './NotificationManager';
import { RINGTONE_FILES } from '../constants/ringtones';

/**
 * NotificationService - Handles expo-notifications integration
 * Manages notification permissions, scheduling, and handling
 */

const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  static notificationListener = null;
  static responseListener = null;

  /**
   * Initialize notification service
   */
  static async initialize() {
    try {
      // Request permissions
      await this.requestPermissions();

      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Set up notification listeners
      this.setupListeners();

      // Run cleanup on initialization
      await NotificationManager.cleanupOldNotifications();

      // Set up notification categories (Snooze/Complete)
      await this.setupCategories();

      return true;
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Set up notification categories
   */
  static async setupCategories() {
    try {
      await Notifications.setNotificationCategoryAsync('reminder', [
        {
          identifier: 'snooze',
          buttonTitle: 'Snooze',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'complete',
          buttonTitle: 'Mark as Done',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  /**
   * Set up Android notification channels
   */
  static async setupAndroidChannels() {
    if (Platform.OS !== 'android') return;

    try {
      // Default channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667EEA',
        sound: 'default.wav',
        enableVibrate: true,
        enableLights: true,
      });

      // We will dynamically create other channels as needed based on sound
    } catch (error) {
      console.error('Error setting up Android channels:', error);
    }
  }

  /**
   * Ensure Android channel exists for a specific sound
   */
  static async ensureAndroidChannel(soundName) {
    if (Platform.OS !== 'android') return 'default';

    // valid sound name check
    if (!soundName || soundName === 'default') return 'default';

    const channelId = `reminder-${soundName}`;
    try {
      // Android expects sound files to be in raw resources without extension
      // The sound will be the filename without .wav extension
      await Notifications.setNotificationChannelAsync(channelId, {
        name: `Reminder (${soundName})`,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667EEA',
        sound: `${soundName}.wav`, // Include .wav extension for Android to find the sound
        enableVibrate: true,
        enableLights: true,
      });
      return channelId;
    } catch (error) {
      console.warn(`Failed to create channel for ${soundName}, falling back to default`, error);
      return 'default';
    }
  }

  /**
   * Set up notification listeners
   */
  static setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        await this.handleNotificationReceived(notification);
      }
    );

    // Listener for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        await this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Handle notification received
   */
  static async handleNotificationReceived(notification) {
    try {
      const data = notification.request.content.data;
      const notificationId = data?.notificationId;
      const reminderId = data?.reminderId;

      if (notificationId) {
        await NotificationManager.updateNotificationStatus(notificationId, 'triggered');
      }

      // Auto-reschedule recurring reminders that use one-off scheduling
      if (reminderId) {
        await this.rescheduleReminderIfNeeded(reminderId);
      }

      // Note: Custom sound playback in foreground is handled by the notification system
      // expo-audio requires React hooks which can't be used in a service class
      // Foreground notifications will use the system notification sound
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  }

  /**
   * Reschedule a reminder after notification triggers (for one-off scheduled reminders)
   */
  static async rescheduleReminderIfNeeded(reminderId) {
    try {
      // Load reminder from storage
      const remindersData = await AsyncStorage.getItem('reminders');
      if (!remindersData) return;

      const reminders = JSON.parse(remindersData);
      const reminder = reminders.find((r) => r.id === reminderId);

      if (!reminder || !reminder.isActive) return;

      // Check if reminder has expired
      if (this.isReminderExpired(reminder)) {
        console.log(`Reminder ${reminderId} has expired, not rescheduling`);
        return;
      }

      // Only reschedule types that use one-off scheduling
      // (daily with non-standard interval, 15days, monthly with 'last' day)
      const needsRescheduling =
        (reminder.type === 'daily' &&
          reminder.dailyMode === 'interval' &&
          24 % (reminder.dailyInterval || 1) !== 0) ||
        reminder.type === '15days' ||
        (reminder.type === 'monthly' && reminder.monthlyDate === 'last');

      if (needsRescheduling) {
        console.log(`Rescheduling reminder: ${reminder.title} (${reminder.type})`);
        await this.scheduleReminder(reminder);
      }
    } catch (error) {
      console.error('Error rescheduling reminder:', error);
    }
  }

  /**
   * Handle notification response (user tapped notification or action)
   */
  static async handleNotificationResponse(response) {
    try {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;
      const notificationId = data?.notificationId;

      if (actionIdentifier === 'snooze') {
        // Handle Snooze
        const settings = await this.getNotificationSettings();
        const snoozeMinutes = settings.snoozeTime || 10;

        console.log(`Snoozing notification ${notificationId} for ${snoozeMinutes} minutes`);

        // Reschedule for later
        const triggerDate = new Date();
        triggerDate.setMinutes(triggerDate.getMinutes() + snoozeMinutes);

        const content = notification.request.content;

        // Check if sound should be enabled (respect both soundEnabled and silentMode)
        const shouldPlaySound = settings.soundEnabled && !settings.silentMode;

        // Get channel ID for Android
        let channelId = 'default';
        if (
          Platform.OS === 'android' &&
          shouldPlaySound &&
          data.ringTone &&
          data.ringTone !== 'default'
        ) {
          channelId = await this.ensureAndroidChannel(data.ringTone);
        }

        // For Android, sound is set via channel; for iOS, set in content
        let soundConfig;
        if (Platform.OS === 'android') {
          soundConfig = undefined; // Sound handled by channel
        } else if (Platform.OS === 'ios') {
          soundConfig =
            shouldPlaySound && data.ringTone !== 'default' ? `${data.ringTone}.wav` : 'default';
        }

        // Get vibration pattern based on settings
        const VIBRATION_PATTERNS = {
          default: [0, 250, 250, 250],
          gentle: [0, 100, 200, 100],
          strong: [0, 500, 200, 500],
          pulse: [0, 100, 100, 100, 100, 100],
          none: [],
        };
        const vibrationPattern =
          VIBRATION_PATTERNS[settings.vibrationPattern] || VIBRATION_PATTERNS.default;

        // Schedule one-off snooze notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: content.title,
            body: `Snoozed: ${content.body}`,
            data: { ...data, isSnoozed: true },
            ...(soundConfig !== undefined && { sound: soundConfig }),
            vibrate: settings.vibrationEnabled ? vibrationPattern : [],
            ...(Platform.OS === 'android' && { channelId }),
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'reminder',
          },
          trigger: triggerDate,
        });
      } else if (actionIdentifier === 'complete') {
        // Handle Complete
        console.log(`Marking notification ${notificationId} as done`);
        if (notificationId) {
          await NotificationManager.updateNotificationStatus(notificationId, 'completed');
        }
      } else {
        // Default action (tap)
        console.log('Notification tapped');
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  /**
   * Schedule a single notification
   * @param {Object} notificationData - The notification data from NotificationManager
   * @param {Date} triggerTime - When to trigger the notification
   */
  static async scheduleNotification(notificationData, triggerOrDate = null) {
    try {
      const settings = await this.getNotificationSettings();

      // Check if notifications are enabled
      if (!settings.notificationsEnabled) {
        return null;
      }

      let trigger;
      // Handle Date object or Timestamp (one-off specific time)
      if (triggerOrDate instanceof Date || typeof triggerOrDate === 'number') {
        // Use DateTriggerInput format: { type: 'date', date: Date | number }
        const targetDate = triggerOrDate instanceof Date ? triggerOrDate : new Date(triggerOrDate);
        trigger = {
          type: 'date',
          date: targetDate,
        };
      } else if (triggerOrDate && typeof triggerOrDate === 'object') {
        // Use provided trigger configuration directly (for repeating notifications)
        trigger = triggerOrDate;
      } else {
        // Fallback to data.scheduledTime
        trigger = {
          type: 'date',
          date: new Date(notificationData.scheduledTime),
        };
      }

      // Get channel ID based on sound (Android)
      // Respect both soundEnabled and silentMode
      let channelId = 'default';
      if (Platform.OS === 'android') {
        const soundName = notificationData.ringTone;
        const shouldPlaySound = settings.soundEnabled && !settings.silentMode;
        if (shouldPlaySound && soundName && soundName !== 'default') {
          channelId = await this.ensureAndroidChannel(soundName);
        }
      }

      // Check if sound should be enabled (respect both soundEnabled and silentMode)
      const shouldPlaySound = settings.soundEnabled && !settings.silentMode;

      // For Android, sound is set via channel, not notification content
      // For iOS, sound is set in notification content
      let soundConfig;
      if (Platform.OS === 'android') {
        // On Android, sound is handled by the channel
        soundConfig = undefined;
      } else if (Platform.OS === 'ios') {
        // On iOS, set sound in notification content
        soundConfig = shouldPlaySound
          ? notificationData.ringTone && notificationData.ringTone !== 'default'
            ? `${notificationData.ringTone}.wav`
            : 'default'
          : null;
      }

      // Get vibration pattern based on settings
      const VIBRATION_PATTERNS = {
        default: [0, 250, 250, 250],
        gentle: [0, 100, 200, 100],
        strong: [0, 500, 200, 500],
        pulse: [0, 100, 100, 100, 100, 100],
        none: [],
      };
      const vibrationPattern =
        VIBRATION_PATTERNS[settings.vibrationPattern] || VIBRATION_PATTERNS.default;

      const notificationContent = {
        title: notificationData.title,
        body: notificationData.description || 'Time for your reminder!',
        data: {
          notificationId: notificationData.id,
          reminderId: notificationData.id, // Ensure this matches the reminder ID for cancellation
          category: notificationData.category,
          ringTone: notificationData.ringTone,
        },
        ...(soundConfig !== undefined && { sound: soundConfig }),
        vibrate: settings.vibrationEnabled ? vibrationPattern : [],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'reminder',
        ...(Platform.OS === 'android' && { channelId }),
        ...(Platform.OS === 'android' &&
          settings.notificationDuration > 0 && {
            timeoutAfter: settings.notificationDuration * 1000,
          }),
      };

      const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      console.log(`Scheduled notification for ${notificationData.title} at`, trigger);

      return scheduledNotificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Check if reminder has expired
   */
  static isReminderExpired(reminder) {
    if (!reminder.hasExpiry || !reminder.expiryDate) {
      return false;
    }
    const expiryDate = new Date(reminder.expiryDate);
    const now = new Date();
    // Set expiry date to end of day (23:59:59)
    expiryDate.setHours(23, 59, 59, 999);
    return now > expiryDate;
  }

  /**
   * Schedule notifications based on reminder type
   */
  static async scheduleReminder(reminder) {
    // Check if reminder has expired
    if (this.isReminderExpired(reminder)) {
      console.log(`Reminder ${reminder.id} has expired, deactivating...`);
      // Deactivate the reminder
      try {
        const remindersData = await AsyncStorage.getItem('reminders');
        if (remindersData) {
          const reminders = JSON.parse(remindersData);
          const updatedReminders = reminders.map((r) =>
            r.id === reminder.id ? { ...r, isActive: false } : r
          );
          await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
        }
      } catch (error) {
        console.error('Error deactivating expired reminder:', error);
      }
      return [];
    }

    switch (reminder.type) {
      case 'daily':
      case 'hourly': // backward compatibility
        return this.scheduleDailyNotifications(reminder);
      case 'weekly':
        return this.scheduleWeeklyNotifications(reminder);
      case 'monthly':
        return this.scheduleMonthlyNotifications(reminder);
      default:
        // One-off (Custom/15days handled as one-off for now or add logic)
        // For custom, if it's "Daily", we can treat as 24h interval
        if (reminder.type === 'custom' && reminder.customSettings?.dateRepeat === 'every') {
          // Daily repeat
          const time = new Date(reminder.customSettings.time);
          return this.scheduleNotification(reminder, {
            hour: time.getHours(),
            minute: time.getMinutes(),
            repeats: true,
          });
        }
        // Default one-off based on provided/calculated time
        // Since we don't have the 'next' time here easily without recalculation,
        // rely on passed logic or calculate it?
        // For now, if called from CreateReminder, it handles one-off manually.
        // If called from reschedule, we might need logic.
        return null;
    }
  }

  /**
   * Schedule notifications for daily reminders
   */
  static async scheduleDailyNotifications(reminder) {
    try {
      const scheduledIds = [];

      // Handle exact mode - Repeating at specific times
      if (reminder.dailyMode === 'exact') {
        const exactTimes = reminder.dailyExactTimes || [];

        for (const timeStr of exactTimes) {
          try {
            const [time, period] = timeStr.split(' ');
            const [hoursStr, minutesStr] = time.split(':');
            let hour = parseInt(hoursStr, 10);
            const minute = parseInt(minutesStr, 10);

            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;

            // Use DailyTriggerInput for both platforms (repeats daily)
            const scheduledId = await this.scheduleNotification(reminder, {
              type: 'daily',
              hour,
              minute,
            });
            if (scheduledId) scheduledIds.push({ notificationId: reminder.id, scheduledId });
          } catch (err) {
            console.error('Error scheduling exact time:', timeStr, err);
          }
        }
        return scheduledIds;
      }

      // Handle interval mode
      const startTime = new Date(reminder.dailyStartTime || reminder.hourlyStartTime);
      const interval = parseInt(reminder.dailyInterval || reminder.hourlyInterval) || 1;
      const minutes = startTime.getMinutes();

      // If interval divides 24 smoothly, we can use daily repeating triggers
      if (24 % interval === 0) {
        const startHour = startTime.getHours();

        // Use DailyTriggerInput for each time slot (repeats daily)
        for (let i = 0; i < 24 / interval; i++) {
          const hour = (startHour + i * interval) % 24;
          const scheduledId = await this.scheduleNotification(reminder, {
            type: 'daily',
            hour,
            minute: minutes,
          });
          if (scheduledId) scheduledIds.push({ notificationId: reminder.id, scheduledId });
        }
      } else {
        // For non-standard intervals: Schedule only the NEXT occurrence
        // Will be rescheduled automatically after it triggers
        const now = new Date();
        let current = new Date(startTime);

        // Advance current to be in the future
        while (current <= now) {
          current.setHours(current.getHours() + interval);
        }

        // Schedule only the next occurrence
        const id = await this.scheduleNotification(reminder, new Date(current));
        if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });
      }

      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling daily notifications:', error);
      return [];
    }
  }

  /**
   * Schedule notifications for weekly reminders
   */
  static async scheduleWeeklyNotifications(reminder) {
    try {
      const scheduledIds = [];
      const weeklyDays = reminder.weeklyDays || [];
      const weeklyTimes = reminder.weeklyTimes || {};

      const dayMap = {
        Sun: 1,
        Mon: 2,
        Tue: 3,
        Wed: 4,
        Thu: 5,
        Fri: 6,
        Sat: 7,
      };

      for (const day of weeklyDays) {
        const weekday = dayMap[day];
        const times = weeklyTimes[day] || [];

        for (const timeStr of times) {
          const [hours, minutesPart] = timeStr.trim().split(':');
          const [minutes, period] = minutesPart.split(' ');

          let hour = parseInt(hours);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          // Use WeeklyTriggerInput for both platforms (repeats weekly)
          const scheduledId = await this.scheduleNotification(reminder, {
            type: 'weekly',
            weekday,
            hour,
            minute: parseInt(minutes),
          });
          if (scheduledId) scheduledIds.push({ notificationId: reminder.id, scheduledId });
        }
      }

      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling weekly notifications:', error);
      return [];
    }
  }

  static async scheduleMonthlyNotifications(reminder) {
    try {
      const scheduledIds = [];
      const date = reminder.monthlyDate;
      const time = new Date(reminder.monthlyTime);
      const hour = time.getHours();
      const minute = time.getMinutes();

      if (date === 'last') {
        // For 'last day of month', schedule only the next occurrence
        const current = new Date();
        const target = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        target.setHours(hour, minute, 0, 0);

        // If this month's last day has passed, schedule for next month
        if (target <= new Date()) {
          target.setMonth(target.getMonth() + 2);
          target.setDate(0); // Last day of that month
        }

        const id = await this.scheduleNotification(reminder, target);
        if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });
      } else {
        // Use monthly repeating trigger
        const id = await this.scheduleNotification(reminder, {
          type: 'monthly',
          day: date,
          hour,
          minute,
        });
        if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });
      }
      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling monthly:', error);
      return [];
    }
  }

  static async scheduleIntervalNotifications(reminder, intervalHours) {
    try {
      const scheduledIds = [];
      // 15 Days typcially uses fifteenDaysStart
      const startTime = new Date(reminder.fifteenDaysStart || new Date());
      const now = new Date();

      // Calculate start point: ensure we start in the future or today
      // If startTime is old, fast forward
      let current = new Date(startTime);
      while (current < now) {
        current.setHours(current.getHours() + intervalHours);
      }

      // Schedule only the NEXT occurrence (will be rescheduled after trigger)
      const id = await this.scheduleNotification(reminder, new Date(current));
      if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });

      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling interval notifications:', error);
      return [];
    }
  }

  static async scheduleCustomNotifications(reminder) {
    try {
      const scheduledIds = []; // Initialize scheduledIds for this function
      const settings = reminder.customSettings;
      if (!settings) return [];
      const time = new Date(settings.time);
      const hour = time.getHours();
      const minute = time.getMinutes();

      if (settings.dateRepeat === 'every') {
        // Daily
        // Use DailyTriggerInput for both platforms (repeats daily)
        const id = await this.scheduleNotification(reminder, {
          type: 'daily',
          hour,
          minute,
        });
        return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
      }

      if (settings.monthRepeat === 'every') {
        // Monthly - Use monthly repeating trigger
        const date = parseInt(settings.date);
        const id = await this.scheduleNotification(reminder, {
          type: 'monthly',
          day: date,
          hour,
          minute,
        });
        return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
      }

      if (settings.yearRepeat === 'every') {
        // Yearly - Use yearly repeating trigger
        const month = parseInt(settings.month);
        const date = parseInt(settings.date);
        const id = await this.scheduleNotification(reminder, {
          type: 'yearly',
          month,
          day: date,
          hour,
          minute,
        });
        return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
      }

      // Specific Date (One-off)
      const target = new Date(settings.year, settings.month - 1, settings.date, hour, minute);
      if (target > new Date()) {
        const id = await this.scheduleNotification(reminder, target);
        return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
      }
      return [];
    } catch (error) {
      console.error('Error scheduling custom notifications:', error);
      return [];
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(scheduledNotificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all notifications for a reminder
   */
  static async cancelNotificationsByReminderId(reminderId) {
    try {
      // Get all scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      console.log(
        `Cancelling notifications for reminder: ${reminderId}. Found ${scheduled.length} total.`
      );

      let cancelledCount = 0;
      // Cancel notifications that match the reminderId
      for (const notification of scheduled) {
        const data = notification.content.data;
        // Check both reminderId and notificationId (fallback)
        if (data?.reminderId === reminderId || data?.notificationId === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          cancelledCount++;
        }
      }

      console.log(`Cancelled ${cancelledCount} notifications for ${reminderId}`);

      // Also delete from NotificationManager
      await NotificationManager.deleteNotificationsByReminderId(reminderId);

      return true;
    } catch (error) {
      console.error('Error cancelling notifications for reminder:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getAllScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Reschedule all pending notifications
   * Used when settings (sound, vibration) change
   */
  static async rescheduleAllNotifications() {
    try {
      // 1. Cancel all system notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // 2. Get master list of reminders
      const remindersJson = await AsyncStorage.getItem('reminders');
      let count = 0;

      if (remindersJson) {
        const reminders = JSON.parse(remindersJson);

        // 3. Reschedule each active reminder using full logic
        for (const reminder of reminders) {
          // If isActive is undefined, assume true (legacy)
          if (reminder.isActive !== false) {
            await this.scheduleReminder(reminder);
            count++;
          }
        }
      }

      console.log(`Rescheduled ${count} reminders`);
      return true;
    } catch (error) {
      console.error('Error rescheduling notifications:', error);
      return false;
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings() {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      const defaults = {
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        defaultRingtone: 'default',
        notificationDuration: 30, // seconds
        snoozeTime: 10, // minutes
        vibrationPattern: 'default',
        silentMode: false,
      };

      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        defaultRingtone: 'default',
        notificationDuration: 30,
        snoozeTime: 10,
        vibrationPattern: 'default',
        silentMode: false,
      };
    }
  }

  /**
   * Save notification settings
   */
  static async saveNotificationSettings(settings) {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return false;
    }
  }

  /**
   * Clean up listeners (call when unmounting)
   */
  static cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export default NotificationService;
