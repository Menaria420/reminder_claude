# 📱 RemindMe - React Native Reminder App

A beautiful, feature-rich reminder application built with React Native and Expo, offering multiple scheduling options and a premium UI/UX experience.

## 🚀 Quick Start

```bash
# Clone and install
npm install

# Start development server
npx expo start -c

# Scan QR code in Expo Go app (same Wi-Fi network)
```

## ✨ Key Features

### Reminder Types

- **Daily** - Set interval or exact times
- **Weekly** - Specific days and times
- **15 Days** - Repeating 15-day cycles
- **Monthly** - Same date each month
- **Custom** - Advanced scheduling (yearly, monthly, daily)

### Additional Features

- 🎨 Beautiful gradient UI with dark mode
- 📂 Categories (Medication, Fitness, General)
- 🔔 Custom notification sounds & ringtones
- ⚡ Priority levels (Normal, High, Urgent)
- 🔍 Search and filter reminders
- 📊 Statistics dashboard
- 🔐 Authentication system
- 💾 Local data persistence

## 📋 Prerequisites

- Node.js (v14+)
- Expo CLI
- Expo Go app (for mobile testing)

## 📁 Project Structure

```
reminder_app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # App screens
│   ├── context/        # React context providers
│   ├── constants/      # App constants
│   └── utils/          # Helper functions & services
├── assets/             # Sound files & images
├── App.js              # Main app entry
└── package.json        # Dependencies
```

## 🔧 Available Commands

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in browser

## 🎯 Key Capabilities

✅ All reminder types fully functional  
✅ Local push notifications  
✅ Notification settings (sound, vibration, duration, snooze)  
✅ Ringtone selection with preview  
✅ Dark mode support  
✅ Data export functionality  
✅ No warnings or errors

## 📱 Permissions Required

- **Notifications** - For reminder alerts
- **Background Tasks** - For scheduled reminders

## 🏗️ Tech Stack

- React Native 0.81.5
- Expo SDK 54
- React Navigation 6
- AsyncStorage for data persistence
- Expo Notifications
- Expo AV (audio playback)

## 📝 License

Open source - available for personal and commercial use.

---

Built with ❤️ using React Native and Expo
