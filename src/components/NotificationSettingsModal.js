import React, { useState, useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ThemeContext } from '../context/ThemeContext';

const DURATION_OPTIONS = [
  { label: '10 seconds', value: 10 },
  { label: '15 seconds', value: 15 },
  { label: '20 seconds', value: 20 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: 'Infinite', value: -1 },
];

const SNOOZE_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
];

const VIBRATION_PATTERNS = [
  { id: 'default', name: 'Default', pattern: [0, 250, 250, 250] },
  { id: 'gentle', name: 'Gentle', pattern: [0, 100, 200, 100] },
  { id: 'strong', name: 'Strong', pattern: [0, 500, 200, 500] },
  { id: 'pulse', name: 'Pulse', pattern: [0, 100, 100, 100, 100, 100] },
  { id: 'none', name: 'No Vibration', pattern: [] },
];

const NotificationSettingsModal = ({ visible, onClose, settings, onSave }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleVibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateSetting = (key, value) => {
    handleVibrate();
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    handleVibrate();
    onSave(localSettings);
    onClose();
  };

  const testVibration = (pattern) => {
    if (pattern.length > 0) {
      // Simulate vibration pattern - expo-haptics doesn't support custom patterns
      // so we'll do a series of impacts
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
          {/* Header */}
          <LinearGradient
            colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Notification Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content}>
            {/* Silent Mode */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Quick Settings
              </Text>

              <View style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
                <View style={styles.settingLeft}>
                  <Icon name="notifications-off" size={24} color="#EF4444" />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark]}>
                      Silent Mode
                    </Text>
                    <Text style={[styles.settingDesc, isDarkMode && styles.settingDescDark]}>
                      Disable all notification sounds
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localSettings.silentMode}
                  onValueChange={(value) => updateSetting('silentMode', value)}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={localSettings.silentMode ? '#10B981' : '#F3F4F6'}
                />
              </View>
            </View>

            {/* Notification Duration */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Notification Duration
              </Text>
              <Text style={[styles.sectionDesc, isDarkMode && styles.sectionDescDark]}>
                How long should notifications ring
              </Text>

              <View style={styles.optionsGrid}>
                {DURATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      localSettings.notificationDuration === option.value &&
                        styles.optionButtonActive,
                    ]}
                    onPress={() => updateSetting('notificationDuration', option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        localSettings.notificationDuration === option.value &&
                          styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Snooze Duration */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Snooze Duration
              </Text>
              <Text style={[styles.sectionDesc, isDarkMode && styles.sectionDescDark]}>
                Default snooze time when you snooze a notification
              </Text>

              <View style={styles.optionsGrid}>
                {SNOOZE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      localSettings.snoozeTime === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => updateSetting('snoozeTime', option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        localSettings.snoozeTime === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Vibration Pattern */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Vibration Pattern
              </Text>

              {VIBRATION_PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternRow,
                    isDarkMode && styles.patternRowDark,
                    localSettings.vibrationPattern === pattern.id && styles.patternRowActive,
                  ]}
                  onPress={() => updateSetting('vibrationPattern', pattern.id)}
                >
                  <View style={styles.patternLeft}>
                    <Text style={[styles.patternName, isDarkMode && styles.patternNameDark]}>
                      {pattern.name}
                    </Text>
                  </View>

                  <View style={styles.patternRight}>
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        testVibration(pattern.pattern);
                      }}
                    >
                      <Icon name="vibration" size={20} color="#667EEA" />
                      <Text style={styles.testButtonText}>Test</Text>
                    </TouchableOpacity>

                    {localSettings.vibrationPattern === pattern.id && (
                      <Icon name="check-circle" size={24} color="#10B981" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Settings */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Additional Settings
              </Text>

              <View style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
                <View style={styles.settingLeft}>
                  <Icon name="volume-up" size={24} color="#667EEA" />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark]}>
                      Sound
                    </Text>
                    <Text style={[styles.settingDesc, isDarkMode && styles.settingDescDark]}>
                      Play notification sounds
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localSettings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={localSettings.soundEnabled ? '#10B981' : '#F3F4F6'}
                  disabled={localSettings.silentMode}
                />
              </View>

              <View style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
                <View style={styles.settingLeft}>
                  <Icon name="vibration" size={24} color="#667EEA" />
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, isDarkMode && styles.settingLabelDark]}>
                      Vibration
                    </Text>
                    <Text style={[styles.settingDesc, isDarkMode && styles.settingDescDark]}>
                      Vibrate on notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localSettings.vibrationEnabled}
                  onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={localSettings.vibrationEnabled ? '#10B981' : '#F3F4F6'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.saveButtonGradient}>
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalContentDark: {
    backgroundColor: '#1a1f3a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  sectionDescDark: {
    color: '#9CA3AF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingRowDark: {
    backgroundColor: '#2a2f4a',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingLabelDark: {
    color: '#ffffff',
  },
  settingDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingDescDark: {
    color: '#9CA3AF',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#667EEA',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  optionTextActive: {
    color: '#667EEA',
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  patternRowDark: {
    backgroundColor: '#2a2f4a',
  },
  patternRowActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  patternLeft: {
    flex: 1,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  patternNameDark: {
    color: '#ffffff',
  },
  patternRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    gap: 4,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
  },
  footer: {
    padding: 20,
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default NotificationSettingsModal;
