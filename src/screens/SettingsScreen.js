import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import RingtoneSelector from '../components/RingtoneSelector';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import NotificationService from '../utils/NotificationService';

const SettingsScreen = ({ navigation }) => {
  console.log('SettingsScreen rendered');
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { logout, user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    autoBackup: true,
  });

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
  }, []);

  const loadNotificationSettings = async () => {
    const settings = await NotificationService.getNotificationSettings();
    setNotificationSettings(settings);
  };

  const handleSaveNotificationSettings = async (newSettings) => {
    await NotificationService.saveNotificationSettings(newSettings);
    setNotificationSettings(newSettings);
    Alert.alert('Success', 'Notification settings saved!');
  };

  const handleSelectRingtone = async (ringtoneId) => {
    const updatedSettings = { ...notificationSettings, defaultRingtone: ringtoneId };
    await NotificationService.saveNotificationSettings(updatedSettings);
    setNotificationSettings(updatedSettings);
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (!result.success) {
            Alert.alert('Error', result.error);
          }
        },
      },
    ]);
  };

  const settingsOptions = [
    {
      title: 'Notifications',
      subtitle: 'Receive reminder notifications',
      icon: 'notifications',
      key: 'notifications',
      type: 'toggle',
    },
    {
      title: 'Sound',
      subtitle: 'Play sound for notifications',
      icon: 'volume-up',
      key: 'sound',
      type: 'toggle',
    },
    {
      title: 'Vibration',
      subtitle: 'Vibrate on notifications',
      icon: 'vibration',
      key: 'vibration',
      type: 'toggle',
    },
    {
      title: 'Dark Mode',
      subtitle: 'Use dark theme',
      icon: 'dark-mode',
      key: 'darkMode',
      type: 'theme',
    },
    {
      title: 'Auto Backup',
      subtitle: 'Automatically backup reminders',
      icon: 'backup',
      key: 'autoBackup',
      type: 'toggle',
    },
    {
      title: 'Export Data',
      subtitle: 'Export all reminders',
      icon: 'file-download',
      type: 'action',
      action: () => Alert.alert('Export', 'Data exported successfully!'),
    },
    {
      title: 'Clear All Data',
      subtitle: 'Delete all reminders',
      icon: 'delete-forever',
      type: 'action',
      action: () =>
        Alert.alert('Warning', 'This will delete all data. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => Alert.alert('Deleted', 'All data cleared!'),
          },
        ]),
    },
    {
      title: 'Logout',
      subtitle: 'Sign out from your account',
      icon: 'logout',
      type: 'action',
      action: handleLogout,
    },
  ];

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  console.log('SettingsScreen rendering with isDarkMode:', isDarkMode);

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
        {/* Notification Settings Section */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Notification Settings
          </Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowRingtoneSelector(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                <Icon name="music-note" size={20} color="#667EEA" />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                  Default Ringtone
                </Text>
                <Text style={[styles.settingSubtitle, isDarkMode && styles.settingSubtitleDark]}>
                  {getRingtoneName(notificationSettings.defaultRingtone)}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowNotificationSettings(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                <Icon name="settings" size={20} color="#667EEA" />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                  Advanced Settings
                </Text>
                <Text style={[styles.settingSubtitle, isDarkMode && styles.settingSubtitleDark]}>
                  Duration, snooze, vibration pattern
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {notificationSettings.silentMode && (
            <View style={[styles.alertBanner, styles.alertBannerWarning]}>
              <Icon name="notifications-off" size={20} color="#F59E0B" />
              <Text style={styles.alertBannerText}>
                Silent mode is enabled. No notification sounds will play.
              </Text>
            </View>
          )}
        </View>

        {/* App Settings */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            App Settings
          </Text>

          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingItem}
              onPress={() => {
                if (option.type === 'toggle') {
                  toggleSetting(option.key);
                } else if (option.type === 'theme') {
                  toggleTheme();
                } else if (option.action) {
                  option.action();
                }
              }}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
                  <Icon name={option.icon} size={20} color="#667EEA" />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, isDarkMode && styles.settingSubtitleDark]}>
                    {option.subtitle}
                  </Text>
                </View>
              </View>

              {option.type === 'toggle' ? (
                <Icon
                  name={settings[option.key] ? 'toggle-on' : 'toggle-off'}
                  size={32}
                  color={settings[option.key] ? '#10B981' : '#9CA3AF'}
                />
              ) : option.type === 'theme' ? (
                <Icon
                  name={isDarkMode ? 'toggle-on' : 'toggle-off'}
                  size={32}
                  color={isDarkMode ? '#10B981' : '#9CA3AF'}
                />
              ) : (
                <Icon name="chevron-right" size={24} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>About</Text>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Version</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Build</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>2024.1</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Developer</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
              RemindMe Team
            </Text>
          </View>
        </View>
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
