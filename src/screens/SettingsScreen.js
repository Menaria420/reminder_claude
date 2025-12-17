import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Linking,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import RingtoneSelector from '../components/RingtoneSelector';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import NotificationService from '../utils/NotificationService';
import NotificationManager from '../utils/NotificationManager';

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);

  const [showRingtoneSelector, setShowRingtoneSelector] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    defaultRingtone: 'default',
    notificationDuration: 30,
    snoozeTime: 10,
    vibrationPattern: 'default',
    silentMode: false,
  });

  useEffect(() => {
    loadNotificationSettings();
    checkPermissions(); // Check initial permission (sync switch with OS)
  }, []);

  const loadNotificationSettings = async () => {
    const settings = await NotificationService.getNotificationSettings();
    setNotificationSettings(settings);
  };

  const checkPermissions = async () => {
    // Check permission status
  };

  const handleSaveNotificationSettings = async (newSettings) => {
    await NotificationService.saveNotificationSettings(newSettings);
    setNotificationSettings(newSettings);
    Alert.alert('Success', 'Notification settings saved!');
    NotificationService.rescheduleAllNotifications();
  };

  const handleSelectRingtone = async (ringtoneId) => {
    const updatedSettings = { ...notificationSettings, defaultRingtone: ringtoneId };
    await NotificationService.saveNotificationSettings(updatedSettings);
    setNotificationSettings(updatedSettings);
    NotificationService.rescheduleAllNotifications();
  };

  const toggleSetting = async (key) => {
    const newValue = !notificationSettings[key];

    if (key === 'notificationsEnabled' && newValue === true) {
      // Trying to enable
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Notifications are disabled in system settings. Please enable them to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return; // Don't toggle ON if denied
      }
    }

    const updatedSettings = { ...notificationSettings, [key]: newValue };
    setNotificationSettings(updatedSettings);
    await NotificationService.saveNotificationSettings(updatedSettings);
    NotificationService.rescheduleAllNotifications();
  };

  const handleClearAndReschedule = async () => {
    Alert.alert(
      'Clear & Reschedule Notifications',
      'This will cancel all scheduled notifications and reschedule them with optimized settings. This fixes the "500 alarm limit" error.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Fix It',
          onPress: async () => {
            try {
              // Get count before
              const beforeCount = (await NotificationService.getAllScheduledNotifications()).length;

              // Clear and reschedule
              await NotificationService.cancelAllNotifications();
              await NotificationService.rescheduleAllNotifications();

              // Get count after
              const afterCount = (await NotificationService.getAllScheduledNotifications()).length;

              Alert.alert(
                'Success!',
                `Cleared ${beforeCount} old notifications.\nRescheduled ${afterCount} new notifications.\n\nAll reminders are now optimized!`
              );
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const reminders = await AsyncStorage.getItem('reminders');
      if (!reminders) {
        Alert.alert('No Data', 'There are no reminders to export.');
        return;
      }
      const result = await Share.share({
        message: reminders,
        title: 'RemindMe Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data: ' + error.message);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Warning',
      'This will permanently delete ALL your reminders and notification history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('reminders');
              await AsyncStorage.removeItem('notifications');
              await NotificationService.cancelAllNotifications();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (!result.success) Alert.alert('Error', result.error);
        },
      },
    ]);
  };

  const getRingtoneName = (id) => {
    const ringtoneNames = {
      default: 'Default',
      mechanical_bell: 'Mechanical Bell',
      digital_alarm: 'Digital Alarm',
      classic_ring: 'Classic Ring',
      soft_chime: 'Soft Chime',
      gentle_notification: 'Gentle Notification',
      electronic_beep: 'Electronic Beep',
    };
    return ringtoneNames[id] || 'Default';
  };

  // Define Sections
  const sections = [
    {
      title: 'Notification Preferences',
      items: [
        {
          id: 'notificationsEnabled',
          title: 'Allow Notifications',
          subtitle: 'Enable or disable all reminders',
          icon: 'notifications',
          type: 'toggle',
          value: notificationSettings.notificationsEnabled,
          onPress: () => toggleSetting('notificationsEnabled'),
        },
        {
          id: 'soundEnabled',
          title: 'Sound',
          subtitle: 'Play sound when reminder triggers',
          icon: 'volume-up',
          type: 'toggle',
          value: notificationSettings.soundEnabled,
          onPress: () => toggleSetting('soundEnabled'),
          disabled: !notificationSettings.notificationsEnabled,
        },
        {
          id: 'vibrationEnabled',
          title: 'Vibration',
          subtitle: 'Vibrate when reminder triggers',
          icon: 'vibration',
          type: 'toggle',
          value: notificationSettings.vibrationEnabled,
          onPress: () => toggleSetting('vibrationEnabled'),
          disabled: !notificationSettings.notificationsEnabled,
        },
        {
          id: 'ringtone',
          title: 'Ringtone',
          subtitle: getRingtoneName(notificationSettings.defaultRingtone),
          icon: 'music-note',
          type: 'link',
          onPress: () => setShowRingtoneSelector(true),
          disabled:
            !notificationSettings.notificationsEnabled || !notificationSettings.soundEnabled,
        },
        {
          id: 'advanced',
          title: 'Advanced Settings',
          subtitle: 'Duration, Snooze, Vibration Pattern',
          icon: 'tune',
          type: 'link',
          onPress: () => setShowNotificationSettings(true),
          disabled: !notificationSettings.notificationsEnabled,
        },
        {
          id: 'system',
          title: 'System Settings',
          subtitle: 'Open device notification settings',
          icon: 'settings-cell',
          type: 'link',
          onPress: () => Linking.openSettings(),
        },
        {
          id: 'clearReschedule',
          title: 'Fix Notification Limit',
          subtitle: 'Clear and reschedule all (fixes 500 alarm error)',
          icon: 'refresh',
          iconColor: '#EF4444',
          type: 'link',
          onPress: handleClearAndReschedule,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: isDarkMode ? 'On' : 'Off',
          icon: 'dark-mode',
          type: 'toggle',
          value: isDarkMode,
          onPress: toggleTheme,
        },
      ],
    },
    {
      title: 'Data & Account',
      items: [
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Save reminders as JSON',
          icon: 'file-download',
          type: 'link',
          onPress: handleExportData,
        },
        {
          id: 'clear',
          title: 'Clear All Data',
          subtitle: 'Delete all data permanently',
          icon: 'delete-forever',
          type: 'link',
          onPress: handleClearAllData,
          danger: true,
        },
        {
          id: 'logout',
          title: 'Logout',
          subtitle: 'Sign out',
          icon: 'logout',
          type: 'link',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={[styles.section, isDarkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              {section.title}
            </Text>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingItem,
                  index === section.items.length - 1 && { borderBottomWidth: 0 },
                  item.disabled && { opacity: 0.5 },
                ]}
                onPress={item.disabled ? null : item.onPress}
                disabled={item.disabled}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      isDarkMode && styles.iconContainerDark,
                      item.danger && {
                        backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={20}
                      color={item.danger ? '#EF4444' : item.iconColor || '#667EEA'}
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text
                      style={[
                        styles.settingTitle,
                        isDarkMode && styles.settingTitleDark,
                        item.danger && { color: '#EF4444' },
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text
                        style={[styles.settingSubtitle, isDarkMode && styles.settingSubtitleDark]}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                </View>

                {item.type === 'toggle' ? (
                  <View pointerEvents="none">
                    <Icon
                      name={item.value ? 'toggle-on' : 'toggle-off'}
                      size={36}
                      color={item.value ? '#10B981' : '#9CA3AF'}
                    />
                  </View>
                ) : (
                  <Icon name="chevron-right" size={24} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>About</Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Version</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>1.0.0</Text>
          </View>
          <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Developer</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              RemindMe Team
            </Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <RingtoneSelector
        visible={showRingtoneSelector}
        onClose={() => setShowRingtoneSelector(false)}
        selectedRingtone={notificationSettings.defaultRingtone}
        onSelect={handleSelectRingtone}
      />

      <NotificationSettingsModal
        visible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        settings={notificationSettings}
        onSave={handleSaveNotificationSettings}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#0a0e27',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDark: {
    backgroundColor: '#2a2f4a',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingTitleDark: {
    color: '#ffffff',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingSubtitleDark: {
    color: '#9CA3AF',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  alertBannerWarning: {
    backgroundColor: '#FEF3C7',
  },
  alertBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  infoLabelDark: {
    color: '#ffffff',
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoValueDark: {
    color: '#9CA3AF',
  },
});

export default SettingsScreen;
