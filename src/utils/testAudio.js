import { Audio } from 'expo-av';

// Test script to verify audio files can be loaded and played
export const testAudioPlayback = async () => {
  console.log('🧪 Starting audio playback test...');

  try {
    // Configure audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    console.log('✅ Audio mode configured');

    // Test loading the default sound
    const source = require('../../assets/sounds/default.wav');
    console.log('📁 Loading default.wav:', source);

    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false, volume: 1.0 });
    console.log('✅ Sound loaded successfully');

    // Get status before playing
    const statusBefore = await sound.getStatusAsync();
    console.log('📊 Status before play:', {
      isLoaded: statusBefore.isLoaded,
      isPlaying: statusBefore.isPlaying,
      durationMillis: statusBefore.durationMillis,
    });

    // Play the sound
    await sound.playAsync();
    console.log('▶️ Play command sent');

    // Get status after playing
    const statusAfter = await sound.getStatusAsync();
    console.log('📊 Status after play:', {
      isLoaded: statusAfter.isLoaded,
      isPlaying: statusAfter.isPlaying,
      durationMillis: statusAfter.durationMillis,
      positionMillis: statusAfter.positionMillis,
    });

    // Wait for sound to finish
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Cleanup
    await sound.unloadAsync();
    console.log('✅ Audio test completed successfully');

    return true;
  } catch (error) {
    console.error('❌ Audio test failed:', error);
    return false;
  }
};
