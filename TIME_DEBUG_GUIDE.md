# Time Display Debugging Guide

## Issue

User selected 5:55 PM but the reminder card shows 6:53 PM (58 minutes difference).

## Debugging Steps Added

### 1. Time Picker Logging (⏰)

**Location**: `CreateReminderScreen.js` - DateTimePicker onChange

**What it logs**:

- Event object
- Selected Time (Date object)
- ISO string representation
- Hours (0-23)
- Minutes (0-59)

**When**: When you select a time in the time picker

### 2. Save Logging (💾)

**Location**: `CreateReminderScreen.js` - handleCreateReminder

**What it logs**:

- Reminder type
- hourlyStartTime value
- Parsed hours from the time
- Parsed minutes from the time

**When**: When you tap "Create Reminder" or "Update Reminder"

### 3. Display Logging (🕐)

**Location**: `reminderUtils.js` - getFormattedNextTrigger

**What it logs**:

- Raw hourlyStartTime from storage
- Parsed startTime (Date object)
- ISO string
- getHours() result
- getMinutes() result
- Next trigger calculation
- Final hours and minutes being displayed

**When**: When the reminder card is rendered

## How to Debug

1. **Create a new reminder**:

   - Select "Hourly" type
   - Choose a specific time (e.g., 5:55 PM)
   - Watch console for ⏰ logs
   - Tap "Create Reminder"
   - Watch console for 💾 logs

2. **View the reminder**:

   - Go to Home or ReminderList screen
   - Watch console for 🕐 logs
   - Compare the logged hours/minutes with what's displayed

3. **Check the logs**:

   ```
   ⏰ Time Picker Changed:
     - Selected Time: [Date object]
     - Hours: 17  (should be 17 for 5:55 PM)
     - Minutes: 55

   💾 Saving Reminder:
     - hourlyStartTime: [ISO string]
     - Parsed hours: 17  (should match picker)
     - Parsed minutes: 55

   🕐 Hourly Reminder Debug:
     - Raw hourlyStartTime: [ISO string from storage]
     - getHours(): 17  (should match saved)
     - getMinutes(): 55
     - Next getHours(): 17 or 18 (depending on current time)
     - Next getMinutes(): 55
   ```

## Expected vs Actual

### Expected Flow:

1. User selects 5:55 PM (17:55)
2. DateTimePicker returns Date with hours=17, minutes=55
3. Saved to AsyncStorage as ISO string
4. Loaded back, parsed to Date
5. getHours() returns 17, getMinutes() returns 55
6. Displayed as "5:55 PM"

### Possible Issues:

#### Issue 1: Time Picker Problem

- **Symptom**: ⏰ logs show wrong hours/minutes
- **Cause**: DateTimePicker returning incorrect time
- **Solution**: Check device time settings

#### Issue 2: Save Problem

- **Symptom**: 💾 logs show different time than ⏰ logs
- **Cause**: reminderData not updated correctly
- **Solution**: Check state management

#### Issue 3: Storage Problem

- **Symptom**: 🕐 raw data shows different time than 💾 logs
- **Cause**: JSON serialization issue
- **Solution**: Check AsyncStorage implementation

#### Issue 4: Display Problem

- **Symptom**: 🕐 getHours()/getMinutes() show different values than raw data
- **Cause**: Date parsing or timezone issue
- **Solution**: Check Date constructor usage

#### Issue 5: Formatting Problem

- **Symptom**: Hours/minutes are correct but display is wrong
- **Cause**: Time formatting logic error
- **Solution**: Check the formatting code

## Common Timezone Issues

### IST (UTC+5:30) Example:

- Local time: 5:55 PM IST
- UTC time: 12:25 PM UTC
- ISO string: "2025-11-30T12:25:00.000Z"
- When parsed: Should return 17:55 in IST

### What to Check:

1. Is the Date object using local time or UTC?
2. Are we calling getHours() or getUTCHours()?
3. Is the ISO string being parsed correctly?

## Quick Test

Run this in your browser console or Node:

```javascript
const testTime = new Date();
testTime.setHours(17, 55, 0, 0);
console.log('Local:', testTime.getHours(), testTime.getMinutes());
console.log('UTC:', testTime.getUTCHours(), testTime.getUTCMinutes());
console.log('ISO:', testTime.toISOString());

const saved = JSON.stringify({ time: testTime });
const loaded = JSON.parse(saved);
const parsed = new Date(loaded.time);
console.log('Loaded:', parsed.getHours(), parsed.getMinutes());
```

Expected output (in IST):

```
Local: 17 55
UTC: 12 25
ISO: 2025-11-30T12:25:00.000Z
Loaded: 17 55
```

## Next Steps

1. Create a test reminder with 5:55 PM
2. Share the console logs (all ⏰, 💾, and 🕐 logs)
3. We'll identify exactly where the time is changing
4. Apply the appropriate fix

## Files with Logging

1. `src/screens/CreateReminderScreen.js`

   - Line ~1808: Time picker onChange
   - Line ~476: Before saving

2. `src/utils/reminderUtils.js`
   - Line ~156: getFormattedNextTrigger for hourly
