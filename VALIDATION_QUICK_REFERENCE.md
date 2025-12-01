# Quick Reference: Reminder Title Validation

## What Changed?

### ✅ Validation Rules (Step 2 - Details Form)

| Category   | Required Fields           | Alert Message                 |
| ---------- | ------------------------- | ----------------------------- |
| Medication | Medicine Name + Frequency | "Please enter medicine name"  |
|            |                           | "Please select frequency"     |
| Fitness    | Exercise Name + Frequency | "Please enter exercise name"  |
|            |                           | "Please select frequency"     |
| Habits     | Habit Name + Frequency    | "Please enter habit name"     |
|            |                           | "Please select frequency"     |
| Others     | Title + Reminder Type     | "Please enter title"          |
|            |                           | "Please select reminder type" |

### ✅ UI Display Rules

**Title Display:**

- If title exists → Show the title
- If title is empty/null → Show "Untitled Reminder"

**Description Display:**

- If description exists → Show the description
- If description is empty/null → Don't render (no empty space)

## User Flow

### Creating a Medication Reminder:

1. **Step 1**: Select "Medication" category ✓
2. **Step 2**:
   - Enter medicine name (e.g., "Aspirin") ← **REQUIRED**
   - Enter dosage (optional)
   - Select frequency (Hourly/Weekly) ← **REQUIRED**
   - Tap "Next" → Validation checks both fields
3. **Step 3**: Configure schedule
4. **Step 4**: Review and create

### Creating a Fitness Reminder:

1. **Step 1**: Select "Fitness" category ✓
2. **Step 2**:
   - Enter exercise name (e.g., "Morning Run") ← **REQUIRED**
   - Enter duration (optional)
   - Select frequency (Weekly) ← **REQUIRED**
   - Tap "Next" → Validation checks both fields
3. **Step 3**: Configure schedule
4. **Step 4**: Review and create

### Creating a Habits Reminder:

1. **Step 1**: Select "Habits" category ✓
2. **Step 2**:
   - Enter habit name (e.g., "Drink Water") ← **REQUIRED**
   - Enter goal (optional)
   - Select frequency (Hourly/Weekly) ← **REQUIRED**
   - Tap "Next" → Validation checks both fields
3. **Step 3**: Configure schedule
4. **Step 4**: Review and create

### Creating an Others/Custom Reminder:

1. **Step 1**: Select "Others" category ✓
2. **Step 2**:
   - Enter title (e.g., "Team Meeting") ← **REQUIRED**
   - Enter description (optional)
   - Select reminder type ← **REQUIRED**
   - Tap "Next" → Validation checks both fields
3. **Step 3**: Configure schedule (if custom, must set time)
4. **Step 4**: Review and create

## Error Messages

When user tries to proceed without required fields:

```
┌─────────────────────────────┐
│      Required Field         │
├─────────────────────────────┤
│ Please enter medicine name  │
│                             │
│           [ OK ]            │
└─────────────────────────────┘
```

```
┌─────────────────────────────┐
│      Required Field         │
├─────────────────────────────┤
│ Please select frequency     │
│                             │
│           [ OK ]            │
└─────────────────────────────┘
```

## Example Displays

### Home Screen / Reminder List

**With Title & Description:**

```
┌──────────────────────────────────────┐
│ 🔵  Aspirin                          │
│     Dosage: 500mg                    │
│     ⏰ Mon at 9:00 AM                │
│     MEDICATION  N  HOURLY            │
└──────────────────────────────────────┘
```

**With Title, No Description:**

```
┌──────────────────────────────────────┐
│ 🔵  Morning Run                      │
│     ⏰ Mon, Wed, Fri at 6:00 AM      │
│     FITNESS  N  WEEKLY               │
└──────────────────────────────────────┘
```

**No Title (Fallback):**

```
┌──────────────────────────────────────┐
│ 🔵  Untitled Reminder                │
│     ⏰ Daily at 9:00 AM              │
│     GENERAL  N  CUSTOM               │
└──────────────────────────────────────┘
```

## Code Locations

### Validation:

- File: `src/screens/CreateReminderScreen.js`
- Function: `validateStep()`
- Lines: ~300-380

### UI Display:

- File: `src/screens/HomeScreen.js`
  - Line 344: Legacy renderReminderItem
  - Line 489: Main reminder card
- File: `src/screens/ReminderListScreen.js`
  - Line 185: Reminder card display

## Testing Commands

```bash
# Reload the app
# In Expo terminal, press 'r'

# Or restart
npx expo start
```

## Quick Test Scenarios

1. **Test Empty Title Prevention:**

   - Create medication reminder
   - Leave medicine name blank
   - Try to tap "Next"
   - Should see alert: "Please enter medicine name"

2. **Test Missing Frequency:**

   - Create fitness reminder
   - Enter exercise name
   - Don't select frequency
   - Try to tap "Next"
   - Should see alert: "Please select frequency"

3. **Test UI Fallback:**

   - If you have any old reminders without titles
   - Check Home screen
   - Should see "Untitled Reminder" instead of blank

4. **Test Description Handling:**
   - Create reminder with description → Should show
   - Create reminder without description → Should NOT show empty space
