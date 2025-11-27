import React, { useState, useContext, useEffect, useRef } from 'react';
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
import { Audio } from 'expo-av';
import { ThemeContext } from '../context/ThemeContext';

// Map ringtone IDs to audio files
const RINGTONE_FILES = {
  default: require('../../assets/sounds/default.wav'),
  mechanical_bell: require('../../assets/sounds/mechanical_bell.wav'),
  digital_alarm: require('../../assets/sounds/digital_alarm.wav'),
  classic_ring: require('../../assets/sounds/classic_ring.wav'),
  soft_chime: require('../../assets/sounds/soft_chime.wav'),
  gentle_notification: require('../../assets/sounds/gentle_notification.wav'),
  electronic_beep: require('../../assets/sounds/electronic_beep.wav'),
};

const RINGTONES = [
  { id: 'default', name: 'Default', icon: 'notifications', description: 'Standard notification' },
  {
    id: 'mechanical_bell',
    name: 'Mechanical Bell',
    icon: 'notifications-active',
    description: 'Ding Dong sound',
  },
  { id: 'digital_alarm', name: 'Digital Alarm', icon: 'alarm', description: 'Beep beep alarm' },
  {
    id: 'classic_ring',
    name: 'Classic Ring',
    icon: 'ring-volume',
    description: 'Phone ringtone',
  },
  { id: 'soft_chime', name: 'Soft Chime', icon: 'music-note', description: 'Gentle whisper' },
  {
    id: 'gentle_notification',
    name: 'Gentle Notification',
    icon: 'notifications-none',
    description: 'Polite reminder',
  },
  {
    id: 'electronic_beep',
    name: 'Electronic Beep',
    icon: 'volume-up',
    description: 'Robotic beep',
  },
];

const RingtoneSelector = ({ visible, onClose, selectedRingtone, onSelect }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    // Configure audio mode
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log('Error configuring audio:', error);
      }
    };
    configureAudio();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handleVibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const playRingtone = async (ringtoneId) => {
    try {
      handleVibrate();

      // Stop any currently playing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setCurrentlyPlaying(ringtoneId);

      // Play the specific audio file for this ringtone
      const source = RINGTONE_FILES[ringtoneId] || RINGTONE_FILES.default;

      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false } // Don't auto-play, we'll call playAsync
      );

      soundRef.current = sound;

      // Set up completion listener
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
        }
      });

      // Play explicitly
      await sound.playAsync();
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
