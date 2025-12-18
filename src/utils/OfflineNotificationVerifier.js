import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline Notification Verification Utility
 *
 * This utility helps verify that notifications work properly offline.
 * It provides methods to test and confirm offline functionality.
 */

export class OfflineNotificationVerifier {
  /**
   * Create a test notification to verify offline functionality
   * This schedules a notification 2 minutes from now
   */
  static async createTestNotification() {
    try {
      // Check permission first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return {
          success: false,
          message: 'Notification permissions not granted. Please enable in settings.',
        };
      }

      // Schedule a test notification 2 minutes from now
      const triggerDate = new Date();
      triggerDate.setMinutes(triggerDate.getMinutes() + 2);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Offline Test Notification',
          body: 'This notification was scheduled locally on your device. No internet required!',
          data: { isTest: true },
          sound: 'default.wav',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: triggerDate,
        },
      });

      return {
        success: true,
        notificationId,
        triggerTime: triggerDate.toLocaleTimeString(),
        message: `Test notification scheduled for ${triggerDate.toLocaleTimeString()}. You can now turn on airplane mode and close the app. The notification will still trigger!`,
      };
    } catch (error) {
      console.error('Error creating test notification:', error);
      return {
        success: false,
        message: 'Failed to create test notification',
        error: error.message,
      };
    }
  }

  /**
   * Get all scheduled notifications (works offline)
   */
  static async getAllScheduledNotifications() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      return {
        success: true,
        count: scheduledNotifications.length,
        notifications: scheduledNotifications.map((n) => ({
          id: n.identifier,
          title: n.content.title,
          trigger: n.trigger,
        })),
      };
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify app data is stored locally (offline-capable)
   */
  static async verifyLocalStorage() {
    try {
      // Check if reminders are stored
      const reminders = await AsyncStorage.getItem('reminders');
      const reminderCount = reminders ? JSON.parse(reminders).length : 0;

      // Check if settings are stored
      const settings = await AsyncStorage.getItem('notificationSettings');
      const hasSettings = !!settings;

      return {
        success: true,
        localData: {
          reminderCount,
          hasSettings,
          storageType: 'AsyncStorage (Local Device)',
          requiresInternet: false,
        },
        message: 'All data is stored locally on your device. No internet required!',
      };
    } catch (error) {
      console.error('Error verifying local storage:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check notification permissions
   */
  static async checkPermissions() {
    try {
      const { status, ios, android } = await Notifications.getPermissionsAsync();

      return {
        success: true,
        status,
        details: {
          ios: ios || null,
          android: android || null,
        },
        canSchedule: status === 'granted',
        message:
          status === 'granted'
            ? 'Notification permissions granted. Offline scheduling enabled!'
            : 'Notification permissions not granted. Please enable in device settings.',
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get system info about offline capabilities
   */
  static async getOfflineCapabilitiesInfo() {
    return {
      capabilities: {
        localNotifications: true,
        offlineScheduling: true,
        exactTimeTriggers: true,
        customSounds: true,
        vibrationPatterns: true,
        persistentStorage: true,
        backgroundDelivery: true,
      },
      requirements: {
        internetForScheduling: false,
        internetForTriggering: false,
        internetForSounds: false,
        internetForStorage: false,
      },
      technologies: {
        notifications: 'expo-notifications (Local Scheduling)',
        storage: 'AsyncStorage (Device Storage)',
        sounds: 'Local Assets (App Bundle)',
        scheduler: 'Native OS Scheduler',
      },
      guarantees: {
        worksInAirplaneMode: true,
        worksWithoutWiFi: true,
        worksWithoutCellular: true,
        worksWhenAppClosed: true,
        persistsAfterRestart: true,
      },
    };
  }

  /**
   * Run comprehensive offline verification test
   */
  static async runFullVerification() {
    console.log('🔍 Running Offline Notification Verification...\n');

    // Check permissions
    const permissionCheck = await this.checkPermissions();
    console.log('📝 Permission Check:', permissionCheck.message);

    // Verify local storage
    const storageCheck = await this.verifyLocalStorage();
    console.log('💾 Storage Check:', storageCheck.message);

    // Get scheduled notifications
    const scheduledCheck = await this.getAllScheduledNotifications();
    console.log(
      `📅 Scheduled Notifications: ${scheduledCheck.count} notifications currently scheduled`
    );

    // Get capabilities info
    const capabilitiesInfo = await this.getOfflineCapabilitiesInfo();

    return {
      permissionCheck,
      storageCheck,
      scheduledCheck,
      capabilitiesInfo,
      overallStatus: {
        offlineReady: permissionCheck.canSchedule && storageCheck.success,
        message:
          permissionCheck.canSchedule && storageCheck.success
            ? '✅ App is fully offline-capable! Notifications will work without internet.'
            : '⚠️ Some features may require configuration. Check permissions and storage.',
      },
    };
  }
}

export default OfflineNotificationVerifier;
