import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
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
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667EEA',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('medication', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#EF4444',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('fitness', {
        name: 'Fitness Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        sound: 'default',
      });
    } catch (error) {
      console.error('Error setting up Android channels:', error);
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

      if (notificationId) {
        await NotificationManager.updateNotificationStatus(notificationId, 'triggered');
      }

      // Play custom sound if in foreground
      if (data?.ringTone && RINGTONE_FILES[data.ringTone]) {
        try {
          const { sound } = await Audio.Sound.createAsync(RINGTONE_FILES[data.ringTone], {
            shouldPlay: true,
          });

          // Handle notification duration for foreground sound
          const settings = await this.getNotificationSettings();
          const durationSeconds = settings.notificationDuration || 30;

          if (durationSeconds > 0) {
            setTimeout(async () => {
              try {
                await sound.stopAsync();
                await sound.unloadAsync();
              } catch (e) {
                // Ignore error if sound already unloaded
              }
            }, durationSeconds * 1000);
          }
        } catch (audioError) {
          // Ignore audio error
        }
      }
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  }

  /**
   * Handle notification response (user tapped notification or action)
   */
  static async handleNotificationResponse(response) {
    try {
      const notificationId = response.notification.request.content.data?.notificationId;
      const actionIdentifier = response.actionIdentifier;

      if (actionIdentifier === 'snooze') {
        // Handle Snooze
        const settings = await this.getNotificationSettings();
        const snoozeMinutes = settings.snoozeTime || 10;

        // Reconstruct notification data
        const content = response.notification.request.content;
        const data = content.data;

        const notificationData = {
          id: data.notificationId,
          reminderId: data.reminderId,
          title: content.title,
          description: content.body,
          category: data.category,
          ringTone: data.ringTone,
          scheduledTime: new Date(Date.now() + snoozeMinutes * 60000), // Snooze time
        };

        // Schedule snoozed notification
        await this.scheduleNotification(notificationData, notificationData.scheduledTime);

        // Update status? Maybe keep as triggered or set to snoozed if we had that status
      } else if (actionIdentifier === 'complete') {
        // Handle Complete
        if (notificationId) {
          await NotificationManager.updateNotificationStatus(notificationId, 'completed');
        }
      } else {
        // Default (tap on notification body)
        if (notificationId) {
          await NotificationManager.updateNotificationStatus(notificationId, 'completed');
        }
      }

      // You can add navigation logic here based on the notification data
      // For example: navigate to reminder details screen
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
      // Handle Date object or Timestamp (legacy/one-off)
      if (triggerOrDate instanceof Date || typeof triggerOrDate === 'number') {
        trigger = {
          type: 'date',
          date: new Date(triggerOrDate).getTime(),
          repeats: false,
        };
      } else if (triggerOrDate && typeof triggerOrDate === 'object') {
        // Use provided trigger configuration directly (for repeating notifications)
        trigger = triggerOrDate;
      } else {
        // Fallback to data.scheduledTime
        trigger = {
          type: 'date',
          date: new Date(notificationData.scheduledTime).getTime(),
          repeats: false,
        };
      }

      // Get channel ID based on category
      const channelId =
        Platform.OS === 'android' ? notificationData.category || 'default' : undefined;

      const notificationContent = {
        title: notificationData.title,
        body: notificationData.description || 'Time for your reminder!',
        data: {
          notificationId: notificationData.id,
          reminderId: notificationData.reminderId,
          category: notificationData.category,
          ringTone: notificationData.ringTone,
        },
        sound: settings.soundEnabled
          ? notificationData.ringTone
            ? `${notificationData.ringTone}.wav`
            : 'default'
          : null,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'reminder',
        ...(channelId && { channelId }),
        ...(Platform.OS === 'android' &&
          settings.notificationDuration > 0 && {
            timeoutAfter: settings.notificationDuration * 1000,
          }),
      };

      const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      return scheduledNotificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule notifications based on reminder type
   */
  static async scheduleReminder(reminder) {
    switch (reminder.type) {
      case 'hourly':
        return this.scheduleHourlyNotifications(reminder);
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
   * Schedule notifications for hourly reminders
   */
  static async scheduleHourlyNotifications(reminder) {
    try {
      const scheduledIds = [];
      const startTime = new Date(reminder.hourlyStartTime);
      const interval = parseInt(reminder.hourlyInterval) || 1;
      const minutes = startTime.getMinutes();

      // If interval divides 24 smoothly, we can use daily repeating triggers
      if (24 % interval === 0) {
        const startHour = startTime.getHours();

        // Schedule for today/tomorrow coverage (daily repeats)
        // We start from the user's selected hour and add intervals
        for (let i = 0; i < 24 / interval; i++) {
          const hour = (startHour + i * interval) % 24;

          const scheduledId = await this.scheduleNotification(reminder, {
            hour,
            minute: minutes,
            repeats: true,
          });

          if (scheduledId) scheduledIds.push({ notificationId: reminder.id, scheduledId });
        }
      } else {
        // Fallback for non-standard intervals: Schedule 24 occurrences one-off
        const now = new Date();
        const triggerTime = new Date(now);
        triggerTime.setMinutes(minutes);
        triggerTime.setSeconds(0);

        // Find next hour that matches pattern relative to startTime
        // This is complex, simplifying to just "Start from now+interval" is safer for user expectation if they just created it
        // But user wants "Trigger on applied time".
        // Let's just schedule next 24 intervals starting from strict logic

        let current = new Date(startTime);
        while (current <= now) {
          current.setHours(current.getHours() + interval);
        }

        for (let i = 0; i < 24; i++) {
          const id = await this.scheduleNotification(reminder, new Date(current));
          if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId });
          current.setHours(current.getHours() + interval);
        }
      }

      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling hourly notifications:', error);
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

          const scheduledId = await this.scheduleNotification(reminder, {
            weekday,
            hour,
            minute: parseInt(minutes),
            repeats: true,
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
        // 'last' day is hard to repeat natively. Schedule 12 months manual?
        // Or find logic. For now, schedule 6 months manual.
        const current = new Date();
        for (let i = 0; i < 6; i++) {
          const target = new Date(current.getFullYear(), current.getMonth() + 1 + i, 0); // Last day
          target.setHours(hour, minute, 0, 0);
          const id = await this.scheduleNotification(reminder, target);
          if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId });
        }
      } else {
        // Specific date (1-31)
        if (Platform.OS === 'android') {
          // Android restriction: 'calendar' trigger with 'day' is not supported.
          // Schedule 12 months manually.
          const current = new Date();
          for (let i = 0; i < 12; i++) {
            // Calculate next occurrence of this 'date'
            let target = new Date(
              current.getFullYear(),
              current.getMonth() + i,
              date,
              hour,
              minute
            );
            // Adjust if target is in past
            if (target < new Date()) {
              target = new Date(
                current.getFullYear(),
                current.getMonth() + i + 1,
                date,
                hour,
                minute
              );
            }
            const id = await this.scheduleNotification(reminder, target);
            if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });
          }
        } else {
          // iOS supports native monthly repeat
          const scheduledId = await this.scheduleNotification(reminder, {
            day: date,
            hour,
            minute,
            repeats: true,
          });
          if (scheduledId) scheduledIds.push({ notificationId: reminder.id, scheduledId });
        }
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

      // Schedule 24 occurrences (assuming 15 days -> ~1 year)
      for (let i = 0; i < 24; i++) {
        const id = await this.scheduleNotification(reminder, new Date(current));
        if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId });
        current.setHours(current.getHours() + intervalHours);
      }
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
        const id = await this.scheduleNotification(reminder, {
          hour,
          minute,
          repeats: true,
        });
        return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
      }

      if (settings.monthRepeat === 'every') {
        // Monthly
        const date = parseInt(settings.date);

        if (Platform.OS === 'android') {
          // Android restriction: manual schedule 12 months
          const current = new Date();
          for (let i = 0; i < 12; i++) {
            let target = new Date(
              current.getFullYear(),
              current.getMonth() + i,
              date,
              hour,
              minute
            );
            if (target < new Date()) {
              target = new Date(
                current.getFullYear(),
                current.getMonth() + i + 1,
                date,
                hour,
                minute
              );
            }
            const id = await this.scheduleNotification(reminder, target);
            if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });
          }
          return scheduledIds;
        } else {
          const id = await this.scheduleNotification(reminder, {
            day: date,
            hour,
            minute,
            repeats: true,
          });
          return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
        }
      }

      if (settings.yearRepeat === 'every') {
        // Yearly
        const month = parseInt(settings.month);
        const date = parseInt(settings.date);

        if (Platform.OS === 'android') {
          // Android: Schedule 5 years manually
          const current = new Date();
          for (let i = 0; i < 5; i++) {
            const target = new Date(current.getFullYear() + i, month - 1, date, hour, minute);
            if (target < new Date()) target.setFullYear(target.getFullYear() + 1); // Ensure future
            const id = await this.scheduleNotification(reminder, target);
            if (id) scheduledIds.push({ notificationId: reminder.id, scheduledId: id });
          }
          return scheduledIds;
        } else {
          // iOS Native
          const id = await this.scheduleNotification(reminder, {
            month: parseInt(settings.month),
            day: date,
            hour,
            minute,
            repeats: true,
          });
          return id ? [{ notificationId: reminder.id, scheduledId: id }] : [];
        }
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

      // Cancel notifications that match the reminderId
      for (const notification of scheduled) {
        if (notification.content.data?.reminderId === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

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
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default NotificationService;
