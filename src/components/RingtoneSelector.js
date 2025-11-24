import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ThemeContext } from '../context/ThemeContext';

const RINGTONES = [
  { id: 'default', name: 'Default', icon: 'notifications', description: 'System default sound' },
  {
    id: 'mechanical_bell',
    name: 'Mechanical Bell',
    icon: 'notifications-active',
    description: 'Classic bell sound',
  },
  { id: 'digital_alarm', name: 'Digital Alarm', icon: 'alarm', description: 'Digital beeping' },
  {
    id: 'classic_ring',
    name: 'Classic Ring',
    icon: 'ring-volume',
    description: 'Traditional phone ring',
  },
  { id: 'soft_chime', name: 'Soft Chime', icon: 'music-note', description: 'Gentle chime' },
  {
    id: 'gentle_notification',
    name: 'Gentle Notification',
    icon: 'notifications-none',
    description: 'Soft notification',
  },
  {
    id: 'electronic_beep',
    name: 'Electronic Beep',
    icon: 'volume-up',
    description: 'Electronic beep',
  },
];

const RingtoneSelector = ({ visible, onClose, selectedRingtone, onSelect }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  const handleVibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const playRingtone = async (ringtoneId) => {
    try {
      handleVibrate();
      setCurrentlyPlaying(ringtoneId);

      // For demo, we'll use vibration patterns for different ringtones
      // In production with actual sound files, you would load and play them
      const vibrationPatterns = {
        default: Haptics.NotificationFeedbackType.Success,
        mechanical_bell: Haptics.NotificationFeedbackType.Warning,
        digital_alarm: Haptics.NotificationFeedbackType.Error,
        classic_ring: Haptics.NotificationFeedbackType.Success,
        soft_chime: Haptics.ImpactFeedbackStyle.Light,
        gentle_notification: Haptics.ImpactFeedbackStyle.Light,
        electronic_beep: Haptics.ImpactFeedbackStyle.Medium,
      };

      // Play vibration pattern
      const pattern = vibrationPatterns[ringtoneId];
      if (pattern in Haptics.NotificationFeedbackType) {
        await Haptics.notificationAsync(pattern);
      } else {
        await Haptics.impactAsync(pattern);
      }

      // Reset playing state after 1 second
      setTimeout(() => {
        setCurrentlyPlaying(null);
      }, 1000);
    } catch (error) {
      console.log('Error playing ringtone preview:', error);
      setCurrentlyPlaying(null);
    }
  };

  const handleSelect = (ringtone) => {
    handleVibrate();
    onSelect(ringtone.id);
    onClose();
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
            <Text style={styles.modalTitle}>Select Ringtone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Ringtone List */}
          <ScrollView style={styles.ringtoneList}>
            {RINGTONES.map((ringtone) => (
              <TouchableOpacity
                key={ringtone.id}
                style={[
                  styles.ringtoneItem,
                  selectedRingtone === ringtone.id && styles.ringtoneItemSelected,
                ]}
                onPress={() => handleSelect(ringtone)}
              >
                <View style={styles.ringtoneLeft}>
                  <View style={[styles.ringtoneIcon, isDarkMode && styles.ringtoneIconDark]}>
                    <Icon name={ringtone.icon} size={24} color="#667EEA" />
                  </View>
                  <View style={styles.ringtoneInfo}>
                    <Text style={[styles.ringtoneName, isDarkMode && styles.ringtoneNameDark]}>
                      {ringtone.name}
                    </Text>
                    <Text style={[styles.ringtoneDesc, isDarkMode && styles.ringtoneDescDark]}>
                      {ringtone.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.ringtoneRight}>
                  {/* Play/Stop Button */}
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      playRingtone(ringtone.id);
                    }}
                  >
                    <Icon
                      name={currentlyPlaying === ringtone.id ? 'stop' : 'play-arrow'}
                      size={24}
                      color="#667EEA"
                    />
                  </TouchableOpacity>

                  {/* Selected Indicator */}
                  {selectedRingtone === ringtone.id && (
                    <Icon name="check-circle" size={24} color="#10B981" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    maxHeight: '80%',
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
  ringtoneList: {
    padding: 16,
  },
  ringtoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ringtoneItemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  ringtoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ringtoneIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ringtoneIconDark: {
    backgroundColor: '#2a2f4a',
  },
  ringtoneInfo: {
    flex: 1,
  },
  ringtoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ringtoneNameDark: {
    color: '#ffffff',
  },
  ringtoneDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  ringtoneDescDark: {
    color: '#9CA3AF',
  },
  ringtoneRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RingtoneSelector;
