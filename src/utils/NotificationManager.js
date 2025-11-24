import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * NotificationManager - Handles local storage and management of notifications
 * Stores notifications in AsyncStorage with 15-day history maintenance
 */

const NOTIFICATIONS_KEY = 'notifications';
const NOTIFICATION_HISTORY_DAYS = 15;

class NotificationManager {
  /**
   * Generate a unique ID for a notification
   */
  static generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new notification
   * @param {Object} reminderData - The reminder data
   * @param {Date} scheduledTime - When the notification should trigger
   * @returns {Object} The created notification
   */
  static async createNotification(reminderData, scheduledTime) {
    try {
      const notification = {
        id: this.generateId(),
        reminderId: reminderData.id || `reminder_${Date.now()}`,
        scheduledTime: scheduledTime.toISOString(),
        title:
          reminderData.title ||
          reminderData.medicineName ||
          reminderData.exerciseName ||
          reminderData.habitName ||
          'Reminder',
        description: reminderData.description || '',
        category: reminderData.category || 'others',
        status: 'pending',
        ringTone: reminderData.ringTone || 'default',
        createdAt: new Date().toISOString(),
      };

      // Get existing notifications
      const notifications = await this.getAllNotifications();

      // Add new notification
      notifications.push(notification);

      // Save to storage
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));

      console.log('Notification created:', notification.id);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create multiple notifications for a reminder
   * @param {Object} reminderData - The reminder data
   * @param {Array<Date>} scheduledTimes - Array of scheduled times
   * @returns {Array<Object>} Array of created notifications
   */
  static async createBulkNotifications(reminderData, scheduledTimes) {
    try {
      const notifications = [];
      for (const time of scheduledTimes) {
        const notification = await this.createNotification(reminderData, time);
        notifications.push(notification);
      }
      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get all notifications
   */
  static async getAllNotifications() {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get notifications by reminder ID
   */
  static async getNotificationsByReminderId(reminderId) {
    try {
      const notifications = await this.getAllNotifications();
      return notifications.filter((n) => n.reminderId === reminderId);
    } catch (error) {
      console.error('Error getting notifications by reminder ID:', error);
      return [];
    }
  }

  /**
   * Get pending notifications
   */
  static async getPendingNotifications() {
    try {
      const notifications = await this.getAllNotifications();
      return notifications.filter((n) => n.status === 'pending');
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Get notification history (last X days)
   * @param {number} days - Number of days to retrieve (default: 15)
   */
  static async getNotificationHistory(days = NOTIFICATION_HISTORY_DAYS) {
    try {
      const notifications = await this.getAllNotifications();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return notifications.filter((n) => {
        const createdAt = new Date(n.createdAt);
        return createdAt >= cutoffDate;
      });
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Update notification status
   * @param {string} id - Notification ID
   * @param {string} status - New status ('pending' | 'triggered' | 'completed')
   */
  static async updateNotificationStatus(id, status) {
    try {
      const notifications = await this.getAllNotifications();
      const index = notifications.findIndex((n) => n.id === id);

      if (index !== -1) {
        notifications[index].status = status;
        notifications[index].updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        console.log(`Notification ${id} status updated to ${status}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating notification status:', error);
      return false;
    }
  }

  /**
   * Delete notification by ID
   */
  static async deleteNotification(id) {
    try {
      const notifications = await this.getAllNotifications();
      const filtered = notifications.filter((n) => n.id !== id);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
      console.log(`Notification ${id} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a reminder
   */
  static async deleteNotificationsByReminderId(reminderId) {
    try {
      const notifications = await this.getAllNotifications();
      const filtered = notifications.filter((n) => n.reminderId !== reminderId);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
      console.log(`Notifications for reminder ${reminderId} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting notifications by reminder ID:', error);
      return false;
    }
  }

  /**
   * Clean up old notifications (older than X days)
   * @param {number} days - Number of days to keep (default: 15)
   */
  static async cleanupOldNotifications(days = NOTIFICATION_HISTORY_DAYS) {
    try {
      const notifications = await this.getAllNotifications();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filtered = notifications.filter((n) => {
        const createdAt = new Date(n.createdAt);
        return createdAt >= cutoffDate;
      });

      const deletedCount = notifications.length - filtered.length;
      if (deletedCount > 0) {
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
        console.log(`Cleaned up ${deletedCount} old notifications`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification by ID
   */
  static async getNotificationById(id) {
    try {
      const notifications = await this.getAllNotifications();
      return notifications.find((n) => n.id === id);
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      return null;
    }
  }

  /**
   * Clear all notifications (use with caution)
   */
  static async clearAllNotifications() {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
      console.log('All notifications cleared');
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats() {
    try {
      const notifications = await this.getAllNotifications();
      const pending = notifications.filter((n) => n.status === 'pending').length;
      const triggered = notifications.filter((n) => n.status === 'triggered').length;
      const completed = notifications.filter((n) => n.status === 'completed').length;

      return {
        total: notifications.length,
        pending,
        triggered,
        completed,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, pending: 0, triggered: 0, completed: 0 };
    }
  }
}

export default NotificationManager;
