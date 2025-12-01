# Quick Testing Guide - Ringtone Sound Fix

## How to Test the Fix

### Step 1: Open the App

- Make sure the Expo app is running on your device
- If not, scan the QR code or press 'a' for Android / 'i' for iOS

### Step 2: Navigate to Ringtone Selector

1. Tap the "+" button to create a new reminder
2. Scroll down to the "Ringtone" option
3. Tap on the ringtone selector

### Step 3: Test Sound Playback

1. **Look for console logs** in your terminal:

   - You should see: "🔧 Configuring audio mode..."
   - Followed by: "✅ Audio mode configured successfully"

2. **Tap the play button** (▶️) next to any ringtone

3. **Check the console** for these logs:

   ```
   🔊 Attempting to play ringtone: [ringtone_id]
   📁 Loading sound source for: [ringtone_id]
   ✅ Sound created successfully
   🎵 Playback status: { isLoaded: true, isPlaying: true, durationMillis: ..., positionMillis: ... }
   ```

4. **Listen for the sound** - You should hear the ringtone playing

5. **When sound finishes**, you should see:
   ```
   🏁 Sound finished playing
   ```

### Step 4: Test Multiple Ringtones

- Try playing different ringtones
- Each should stop the previous one before playing
- You should see "⏹️ Stopping currently playing sound" when switching

### Step 5: Test Modal Close

- Play a ringtone
- Close the modal while it's playing
- You should see: "🚪 Modal closed, cleaning up sound"

## What to Check If Sound Doesn't Play

### Device Settings

- [ ] Volume is turned up
- [ ] Phone is not in silent mode (check the physical switch on iOS)
- [ ] Do Not Disturb is off
- [ ] Media volume is up (not just ringer volume)

### Console Logs

Look for error messages:

- ❌ Error configuring audio
- ❌ Error playing ringtone preview

### Common Issues

**Issue: "Error loading sound source"**

- Solution: Audio files may be missing or corrupted
- Run: `file assets/sounds/*.wav` to verify

**Issue: "isPlaying: false" in status**

- Solution: Audio mode may not be configured correctly
- Check if you see "✅ Audio mode configured successfully"

**Issue: Sound plays but you can't hear it**

- Solution: Check device volume and audio output
- Try plugging in headphones to test
- Check if other apps can play sound

**Issue: "Permission denied" error**

- Solution: Some devices need audio permissions
- Check app permissions in device settings

## Expected Behavior

✅ **Correct behavior:**

1. Tap play button
2. See haptic feedback (vibration)
3. Hear ringtone sound
4. See play button change to stop icon
5. Sound plays for 2-4 seconds
6. Play button returns to normal

❌ **Incorrect behavior:**

1. Tap play button
2. No sound plays
3. No console logs appear
4. Or error messages in console

## Advanced Debugging

If you need more detailed debugging:

1. **Import the test utility:**

   ```javascript
   import { testAudioPlayback } from './src/utils/testAudio';
   ```

2. **Call it from your component:**

   ```javascript
   useEffect(() => {
     testAudioPlayback();
   }, []);
   ```

3. **Check the detailed logs** to see exactly where the issue occurs

## Files Changed

- ✅ `src/components/RingtoneSelector.js` - Main fix
- ✅ `src/utils/testAudio.js` - Test utility
- ✅ `RINGTONE_SOUND_FIX.md` - Detailed documentation

## Need Help?

If sound still doesn't work after following these steps:

1. Share the console logs (especially any ❌ errors)
2. Mention your device type (iOS/Android)
3. Mention your device OS version
4. Check if other sounds in the app work (notifications, etc.)
