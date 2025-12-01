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

      console.log('NotificationService initialized');
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

      console.log('Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
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

      console.log('Android notification channels set up');
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
        console.log('Notification received:', notification);
        await this.handleNotificationReceived(notification);
      }
    );

    // Listener for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log('Notification response:', response);
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
        } catch (audioError) {
          console.log('Error playing custom sound:', audioError);
        }
      }
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  }

  /**
   * Handle notification response (user tapped notification)
   */
  static async handleNotificationResponse(response) {
    try {
      const notificationId = response.notification.request.content.data?.notificationId;
      if (notificationId) {
        await NotificationManager.updateNotificationStatus(notificationId, 'completed');
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
  static async scheduleNotification(notificationData, triggerTime = null) {
    try {
      const settings = await this.getNotificationSettings();

      // Check if notifications are enabled
      if (!settings.notificationsEnabled) {
        console.log('Notifications are disabled');
        return null;
      }

      const trigger = triggerTime
        ? new Date(triggerTime)
        : new Date(notificationData.scheduledTime);

      console.log('⏰ SCHEDULING NOTIFICATION:');
      console.log('  - Title:', notificationData.title);
      console.log('  - Trigger Time (input):', triggerTime?.toISOString());
      console.log('  - Trigger Time (parsed):', trigger.toISOString());
      console.log('  - Trigger Hours:', trigger.getHours());
      console.log('  - Trigger Minutes:', trigger.getMinutes());
      console.log('  - Trigger Seconds:', trigger.getSeconds());
      console.log('  - Trigger Milliseconds:', trigger.getMilliseconds());
      console.log('  - Current Time:', new Date().toISOString());
      console.log('  - Time until trigger (ms):', trigger.getTime() - Date.now());
      console.log(
        '  - Time until trigger (minutes):',
        Math.round((trigger.getTime() - Date.now()) / 60000)
      );

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
        // In Expo Go, custom sounds don't work in background. We force 'default' to ensure SOME sound plays.
        // In a production build with custom assets bundled, you would use: notificationData.ringTone
        sound: settings.soundEnabled
          ? notificationData.ringTone
            ? `${notificationData.ringTone}.wav`
            : 'default'
          : null,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(channelId && { channelId }),
      };

      // Use exact timestamp for more precise scheduling
      const exactTrigger = {
        type: 'date',
        date: trigger.getTime(), // Use timestamp instead of Date object
        repeats: false,
      };

      console.log('  - Using exact trigger with timestamp:', trigger.getTime());

      const scheduledNotificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: exactTrigger,
      });

      console.log('✅ Notification scheduled with ID:', scheduledNotificationId);
      return scheduledNotificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Schedule notifications for hourly reminders
   */
  static async scheduleHourlyNotifications(reminderData, hours = 1, count = 24) {
    try {
      const scheduledIds = [];
      const now = new Date();

      for (let i = 0; i < count; i++) {
        const triggerTime = new Date(now.getTime() + hours * 60 * 60 * 1000 * (i + 1));
        const notification = await NotificationManager.createNotification(
          reminderData,
          triggerTime
        );
        const scheduledId = await this.scheduleNotification(notification, triggerTime);

        if (scheduledId) {
          scheduledIds.push({ notificationId: notification.id, scheduledId });
        }
      }

      console.log(`Scheduled ${scheduledIds.length} hourly notifications`);
      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling hourly notifications:', error);
      return [];
    }
  }

  /**
   * Schedule notifications for weekly reminders
   */
  static async scheduleWeeklyNotifications(reminderData, weeklyDays, weeklyTimes) {
    try {
      const scheduledIds = [];
      const now = new Date();

      // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
      const dayMap = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };

      for (const day of weeklyDays) {
        for (const time of weeklyTimes) {
          const [hours, minutesPart] = time.split(':');
          const [minutes, period] = minutesPart.split(' ');

          let hour = parseInt(hours);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;

          const targetDay = dayMap[day];
          const triggerTime = new Date(now);

          // Calculate next occurrence of this day
          const currentDay = triggerTime.getDay();
          let daysUntilTarget = targetDay - currentDay;
          if (daysUntilTarget <= 0) daysUntilTarget += 7;

          triggerTime.setDate(triggerTime.getDate() + daysUntilTarget);
          triggerTime.setHours(hour, parseInt(minutes), 0, 0);

          const notification = await NotificationManager.createNotification(
            reminderData,
            triggerTime
          );
          const scheduledId = await this.scheduleNotification(notification, triggerTime);

          if (scheduledId) {
            scheduledIds.push({ notificationId: notification.id, scheduledId });
          }
        }
      }

      console.log(`Scheduled ${scheduledIds.length} weekly notifications`);
      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling weekly notifications:', error);
      return [];
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(scheduledNotificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(scheduledNotificationId);
      console.log('Notification cancelled:', scheduledNotificationId);
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

      console.log('Cancelled all notifications for reminder:', reminderId);
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
      console.log('All notifications cancelled');
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
      console.log('Notification settings saved');
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
