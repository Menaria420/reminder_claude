import React, { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { ThemeContext } from '../../App';

const SettingsScreen = ({ navigation }) => {
  console.log('SettingsScreen rendered');
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    autoBackup: true,
  });

  const settingsOptions = [
    {
      title: 'Notifications',
      subtitle: 'Receive reminder notifications',
      icon: 'notifications',
      key: 'notifications',
      type: 'toggle'
    },
    {
      title: 'Sound',
      subtitle: 'Play sound for notifications',
      icon: 'volume-up',
      key: 'sound',
      type: 'toggle'
    },
    {
      title: 'Vibration',
      subtitle: 'Vibrate on notifications',
      icon: 'vibration',
      key: 'vibration',
      type: 'toggle'
    },
    {
      title: 'Dark Mode',
      subtitle: 'Use dark theme',
      icon: 'dark-mode',
      key: 'darkMode',
      type: 'theme'
    },
    {
      title: 'Auto Backup',
      subtitle: 'Automatically backup reminders',
      icon: 'backup',
      key: 'autoBackup',
      type: 'toggle'
    },
    {
      title: 'Export Data',
      subtitle: 'Export all reminders',
      icon: 'file-download',
      type: 'action',
      action: () => Alert.alert('Export', 'Data exported successfully!')
    },
    {
      title: 'Clear All Data',
      subtitle: 'Delete all reminders',
      icon: 'delete-forever',
      type: 'action',
      action: () => Alert.alert('Warning', 'This will delete all data. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', 'All data cleared!') }
      ])
    }
  ];

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  console.log('SettingsScreen rendering with isDarkMode:', isDarkMode);
  
  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <LinearGradient colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>App Settings</Text>
          
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
                  <Text style={[styles.settingTitle, isDarkMode && styles.settingTitleDark]}>{option.title}</Text>
                  <Text style={[styles.settingSubtitle, isDarkMode && styles.settingSubtitleDark]}>{option.subtitle}</Text>
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
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>RemindMe Team</Text>
          </View>
        </View>
      </ScrollView>
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