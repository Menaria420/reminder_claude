import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { ThemeContext } from '../context/ThemeContext';

import { RINGTONES, RINGTONE_FILES } from '../constants/ringtones';

const RingtoneSelector = ({ visible, onClose, selectedRingtone, onSelect }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [previewId, setPreviewId] = useState(null);
  const soundRef = useRef(null);

  // Configure audio mode on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  // Cleanup when modal closes
  useEffect(() => {
    if (!visible) {
      stopSound();
      setPreviewId(null);
    }
  }, [visible]);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const stopSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.log('Error stopping sound:', error);
      }
    }
  };

  const handleVibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const playRingtone = async (ringtoneId) => {
    handleVibrate();

    // If clicking the same one, stop preview
    if (previewId === ringtoneId) {
      await stopSound();
      setPreviewId(null);
      return;
    }

    // Stop any currently playing sound
    await stopSound();

    try {
      // Load and play the sound
      const soundFile = RINGTONE_FILES[ringtoneId];
      if (soundFile) {
        const { sound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: true });
        soundRef.current = sound;

        // Show preview animation
        setPreviewId(ringtoneId);

        // Set up playback status update to stop preview when sound finishes
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPreviewId(null);
            stopSound();
          }
        });

        // Auto-stop preview after 3 seconds as a fallback
        setTimeout(() => {
          setPreviewId(null);
          stopSound();
        }, 3000);
      }
    } catch (error) {
      console.log('Error playing ringtone:', error);
      setPreviewId(null);
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

          {/* Info Note */}
          <View style={[styles.infoNote, isDarkMode && styles.infoNoteDark]}>
            <Icon name="volume-up" size={16} color="#667EEA" />
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              Tap the play button to preview sounds. Your selected ringtone will play when notifications trigger.
            </Text>
          </View>

          {/* Ringtone List */}
          <ScrollView style={styles.ringtoneList}>
            {RINGTONES.map((ringtone) => (
              <TouchableOpacity
                key={ringtone.id}
                style={[
                  styles.ringtoneItem,
                  isDarkMode && styles.ringtoneItemDark,
                  selectedRingtone === ringtone.id && styles.ringtoneItemSelected,
                  selectedRingtone === ringtone.id && isDarkMode && styles.ringtoneItemSelectedDark,
                ]}
                onPress={() => handleSelect(ringtone)}
              >
                <View style={styles.ringtoneLeft}>
                  <View style={[styles.ringtoneIcon, isDarkMode && styles.ringtoneIconDark]}>
                    <Icon name={ringtone.icon} size={20} color="#667EEA" />
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
                  {/* Preview Button */}
                  <TouchableOpacity
                    style={[styles.playButton, isDarkMode && styles.playButtonDark]}
                    onPress={(e) => {
                      e.stopPropagation();
                      playRingtone(ringtone.id);
                    }}
                  >
                    <Icon
                      name={previewId === ringtone.id ? 'stop' : 'play-arrow'}
                      size={20}
                      color="#667EEA"
                    />
                  </TouchableOpacity>

                  {/* Selected Indicator */}
                  {selectedRingtone === ringtone.id && (
                    <Icon name="check-circle" size={20} color="#10B981" />
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
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoNoteDark: {
    backgroundColor: '#2a2f4a',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  infoTextDark: {
    color: '#9CA3AF',
  },
  ringtoneList: {
    padding: 12,
  },
  ringtoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ringtoneItemDark: {
    backgroundColor: '#232946',
  },
  ringtoneItemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  ringtoneItemSelectedDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  ringtoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ringtoneIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ringtoneIconDark: {
    backgroundColor: '#2a2f4a',
  },
  ringtoneInfo: {
    flex: 1,
  },
  ringtoneName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  ringtoneNameDark: {
    color: '#ffffff',
  },
  ringtoneDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  ringtoneDescDark: {
    color: '#9CA3AF',
  },
  ringtoneRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    backgroundColor: '#F0F4FF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDark: {
    backgroundColor: '#374151',
  },
});

export default RingtoneSelector;
