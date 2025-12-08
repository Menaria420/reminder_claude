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

import { RINGTONE_FILES, RINGTONES } from '../constants/ringtones';

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
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          interruptionModeIOS: 1, // DoNotMix
          interruptionModeAndroid: 1, // DoNotMix
        });
      } catch (error) {
        console.error('❌ Error configuring audio:', error);
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

  // Cleanup sound when modal closes
  useEffect(() => {
    if (!visible && soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
      setCurrentlyPlaying(null);
    }
  }, [visible]);

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
        { shouldPlay: true, volume: 1.0 } // Auto-play with full volume
      );

      soundRef.current = sound;

      // Set up completion listener
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
        }
      });
    } catch (error) {
      console.error('❌ Error playing ringtone preview:', error);
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
});

export default RingtoneSelector;
