# 📱 RemindMe App - Developer Guide & Architecture

## 📖 Overview

RemindMe is a comprehensive reminder application built with **React Native** and **Expo**. It supports advanced scheduling (Hourly, Daily, Weekly, Monthly, Custom), local notifications, and categorized reminders.

This guide is intended for developers (and AI agents) to understand the codebase structure, functionality, and maintenance procedures before making changes.

---

## 🛠 Technology Stack

- **Framework:** React Native (Expo)
- **Navigation:** React Navigation (Native Stack)
- **State Management:** React Context API (`AuthContext`, `ThemeContext`)
- **Persistence:** `@react-native-async-storage/async-storage`
- **Notifications:** `expo-notifications`
- **Audio:** `expo-av`
- **Icons:** `@expo/vector-icons`
- **Styling:** `StyleSheet` (Custom design system, no external UI library)

---

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── NotificationSettingsModal.js  # Advanced notification settings (Snooze, duration)
│   ├── RingtoneSelector.js           # Custom ringtone picker
│   └── ...
├── constants/           # App constants (Colors, Ringtones)
├── context/             # Global State
│   ├── AuthContext.js        # User session management
│   └── ThemeContext.js       # Dark/Light mode toggle
├── screens/             # Application Screens
│   ├── LoginScreen.js / SignupScreen.js  # Auth screens
│   ├── HomeScreen.js         # Dashboard, Stats, Quick Actions
│   ├── ReminderListScreen.js # List view with filters & search
│   ├── CreateReminderScreen.js # Complex form for creating reminders
│   ├── SettingsScreen.js     # User preferences, Backup, Notification settings
│   └── ...
└── utils/               # Logic & Helper functions
    ├── NotificationService.js  # Wrapper for expo-notifications (Scheduling, Channels)
    ├── NotificationManager.js  # Business logic for Notification objects
    └── Storage.js              # Sync/AsyncStorage wrappers
```

---

## 🖥️ Screen Details & Functionality

### 1. **Authentication (Login/Signup)**

- **Files:** `LoginScreen.js`, `SignupScreen.js`, `ForgotPasswordScreen.js`
- **Logic:** Uses `AuthContext` to manage user sessions. Currently simulates auth (stores users in AsyncStorage).
- **Features:** Input validation, secure password entry, "Remember me" functionality.

### 2. **Home Dashboard**

- **File:** `HomeScreen.js`
- **Logic:** Displays current date, quick stats (Pending, Completed), and upcoming reminders.
- **Key Features:**
  - "Quick Add" FAB.
  - Summary Cards.
  - Pull-to-refresh to sync data.

### 3. **Create Reminder (The Core)**

- **File:** `CreateReminderScreen.js`
- **Logic:** A multi-step wizard for detailed reminder configuration.
- **Support Types:**
  - **Medication:** Frequency based, recurring.
  - **Hourly:** Interval based (e.g., "Every 2 hours").
  - **Daily/Weekly:** Specific days/times.
  - **Custom:** Complex rules (Specific dates, Month repeat, Year repeat).
- **UI:** Custom selectors for days, times, and categories.

### 4. **Reminder List**

- **File:** `ReminderListScreen.js`
- **Logic:** Displays all reminders with filtering options.
- **Features:**
  - Filter by Category (Work, Personal, etc.).
  - Filter by Status (Active, Completed).
  - Search functionality.
  - Swipe actions (Delete, Complete).

### 5. **Settings**

- **File:** `SettingsScreen.js`
- **Logic:** formatting app-wide preferences.
- **Features:**
  - **Notification Settings:** Ringtone, Vibration, Duration, Snooze time.
  - **Data Management:** Export/Clear data.
  - **Theme:** Dark Mode toggle.

---

## 🔔 Notification System (Critical)

The notification system consists of two layers:

### 1. `NotificationService.js` (Infrastructure)

- Handles `expo-notifications` configuration.
- **Channels (Android):** Sets up channels for different priorities (Medication = High, General = Default).
- **Scheduling:** Handles exact time scheduling.
- **Actions:** Registers 'Snooze' and 'Complete' interactive categories.
- **Foreground Handling:** plays custom sounds via `expo-av` when app is open.
- **Settings Respect:** Applies user settings for **Duration** (timeout) and **Snooze** intervals.

### 2. `NotificationManager.js` (Business Logic)

- formats data structure for notifications.
- Manages local storage of notification history.

**Flow:**

1. User creates reminder -> `CreateReminderScreen` calls `NotificationService.schedule...`
2. `NotificationService` calculates next trigger time.
3. System schedules notification.
4. **On Trigger:**
   - **Background:** System notification appears.
   - **Foreground:** Custom sound plays, Alert shows.
5. **Interaction:**
   - **Tap:** Opens app.
   - **Snooze:** Reschedules for +X minutes (defined in Settings).
   - **Mark Done:** Updates status in Storage.

---

## 💾 Data Schema (AsyncStorage)

### Key: `reminders`

Array of Reminder Objects:

```javascript
{
  id: string,              // UUID
  title: string,
  type: 'medication' | 'fitness' | 'hourly' | 'custom' | ...,
  category: string,        // 'Personal', 'Work'
  priority: 'low' | 'normal' | 'high' | 'urgent',
  date: string,            // ISO String
  time: string,            // ISO String
  completed: boolean,
  ...customSettings        // Type-specific configs
}
```

### Key: `notificationSettings`

```javascript
{
  notificationsEnabled: boolean,
  soundEnabled: boolean,
  vibrationEnabled: boolean,
  defaultRingtone: string,
  notificationDuration: number, // Seconds
  snoozeTime: number,           // Minutes
  vibrationPattern: string
}
```

---

## ⚠️ Maintenance & Rules for Developers

1.  **Documentation Update:** ALWAYS update this file (`APP_GUIDE.md`) if you add a new screen, change the auth flow, or modify the data schema.
2.  **Notification Changes:** If modifying `NotificationService`, test both **Foreground** (active app) and **Background** (closed app) behavior.
3.  **Styles:** Do NOT use Tailwind or external UI libraries. Use the existing `StyleSheet` objects and `ThemeContext` for Dark Mode consistency.
4.  **Comments:** Keep code comments minimal but meaningful. Describe _why_ complex logic exists, not _what_ the code is doing (the code should be self-documenting).
5.  **Safe Area:** Always wrap screens in `SafeAreaView` or handle padding for notches manually.

---

**Last Updated:** 2025-12-07
