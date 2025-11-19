# 📱 ReminderApp - React Native

A beautiful and feature-rich reminder application built with React Native and Expo, featuring multiple scheduling options including hourly, weekly, 15-day cycles, monthly, and custom reminders.

## ✨ Features

- **5 Reminder Types:**
  - ⏰ Hourly - Set reminders to repeat every X hours
  - 📅 Weekly - Choose specific days and times
  - 🔄 15 Days - Unique 15-day cycle reminders
  - 📆 Monthly - Same date each month
  - ⚙️ Custom - Advanced scheduling options

- **Time Selection Methods:**
  - Specific times selection
  - Hour interval configuration

- **Additional Features:**
  - Beautiful gradient UI design
  - Step-by-step reminder creation wizard
  - Categories (Personal, Work, Health, Family, etc.)
  - Priority levels (Low, Normal, High, Urgent)
  - Custom notification sounds
  - Search and filter reminders
  - Toggle reminders on/off
  - Haptic feedback on interactions
  - Persistent storage with AsyncStorage

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or Yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

## 🚀 Quick Start

1. **Extract the project:**
   ```bash
   unzip ReminderApp-ReactNative.zip
   cd ReminderApp-ReactNative
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   expo start
   # or
   npm start
   ```

4. **Run on your device:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 📁 Project Structure

```
ReminderApp-ReactNative/
├── App.js                    # Main application entry point
├── app.json                  # Expo configuration
├── babel.config.js           # Babel configuration
├── package.json              # Dependencies and scripts
├── src/
│   └── screens/
│       ├── HomeScreen.js         # Dashboard with stats and quick actions
│       ├── CreateReminderScreen.js # Reminder creation wizard
│       └── ReminderListScreen.js  # View and manage all reminders
└── assets/                   # Images and icons (to be added)
```

## 🎨 Customization

### Changing Colors
Edit the gradient colors in the components:
```javascript
// Example in HomeScreen.js
<LinearGradient
  colors={['#667EEA', '#764BA2']} // Change these hex values
  style={styles.header}
>
```

### Adding New Reminder Types
1. Add the type to `reminderTypes` array in `CreateReminderScreen.js`
2. Create a configuration section in `renderStep2()`
3. Add the icon and color mapping

### Modifying Categories
Edit the categories array in `CreateReminderScreen.js`:
```javascript
const categories = ['Personal', 'Work', 'Health', 'Family', 'Finance', 'Shopping'];
```

## 🔧 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm test` - Run tests (when configured)

## 📱 Platform-Specific Features

### iOS
- Native date/time pickers
- Haptic feedback using Expo Haptics
- Smooth animations with React Native Reanimated

### Android
- Material Design date/time pickers
- Native haptic feedback
- Elevation shadows for depth

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   expo start -c  # Clear cache
   ```

2. **Dependencies not installing:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **iOS Simulator not opening:**
   - Make sure Xcode is installed
   - Open Xcode > Preferences > Locations > Command Line Tools

4. **Android Emulator not opening:**
   - Ensure Android Studio is installed
   - Check that an AVD is configured

## 🚀 Building for Production

### For iOS:
```bash
expo build:ios
```

### For Android:
```bash
expo build:android
```

### For both platforms:
```bash
expo build:all
```

## 📦 Required Permissions

The app will request the following permissions:
- **Notifications** - To send reminder alerts
- **Background Tasks** - To schedule reminders

## 🤝 Contributing

Feel free to modify and enhance this app! Some ideas:
- Add cloud sync with Firebase
- Implement push notifications
- Add voice input for reminder creation
- Create widgets for home screen
- Add themes and dark mode
- Integrate with calendar apps

## 📄 License

This project is open source and available for personal and commercial use.

## 💡 Tips for VS Code

### Recommended Extensions:
- React Native Tools
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Color Highlight

### Debug Configuration:
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug in Expo",
      "request": "launch",
      "type": "reactnative",
      "platform": "exponent"
    }
  ]
}
```

## 🆘 Support

If you encounter any issues:
1. Check the [Expo documentation](https://docs.expo.dev/)
2. Visit [React Native documentation](https://reactnative.dev/)
3. Search for issues on Stack Overflow

## 🎉 Features Coming Soon

- [ ] Cloud synchronization
- [ ] Web version
- [ ] Desktop app (Windows/Mac)
- [ ] Apple Watch / Wear OS support
- [ ] AI-powered reminder suggestions
- [ ] Location-based reminders
- [ ] Collaborative reminders
- [ ] Analytics dashboard
- [ ] Export/Import functionality
- [ ] Multiple themes

---

**Happy Coding! 🚀**

Built with ❤️ using React Native and Expo
