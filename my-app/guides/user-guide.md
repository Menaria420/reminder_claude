# User Guide for My App

## Basic App-Related Rules

1. **Initialization**: Start the app using the main entry point in `src/app.ts`.
2. **Configuration**: Adjust settings in `src/app.ts` as needed before running the app.
3. **Type Safety**: Use types and interfaces from `src/types/index.ts` for consistent data handling.
4. **Error Handling**: Handle errors gracefully in your code to avoid crashes.
5. **Routing**: Follow the routing setup in `src/app.ts` to ensure all pages are accessible.
6. **Dependencies**: Keep dependencies updated via `package.json` and run `npm install` for new packages.
7. **Documentation**: Use this guide for user instructions and refer to `guides/copilot-guide.md` for technical updates.

---

## Page-Wise Features

### 1. Home Page

- Displays a welcome message (Good Morning/Afternoon/Evening) and overview of the app.
- Shows upcoming reminders and quick actions.
- **App logo in the top left corner**: Click to return to the Home Page from anywhere.
- **Menu button in the top right corner**: Access additional options.
- Shows statistics: Active reminders count, Today's reminders, Total reminders, Completed count.
- Recent reminders list with toggle and delete actions.

### 2. Add Reminder Page

- Step-by-step form to create a new reminder (3-step wizard).
- **Step 1**: Enter reminder title, description, and select reminder type (Hourly, Weekly, 15 Days, Monthly, Custom).
- **Step 2**: Configure type-specific settings (intervals, days, times, dates).
- **Step 3**: Set additional options (notification sound, category, priority).
- Submit button to save the reminder.
- **Header**: Shows progress step indicator and navigation controls.

### 3. View Reminders Page

- Lists all active reminders with detailed information.
- **Header**: App logo, page title, and menu button.
- Search functionality to find reminders by title or description.
- Filter chips to filter by reminder type (All, Hourly, Weekly, 15 Days, Monthly, Custom).
- Allows toggling reminder active/inactive status.
- Delete reminder functionality with confirmation.
- Shows reminder metadata: category and priority badges.
- Floating Action Button (FAB) for quick reminder creation.

### 4. Reminder Details Page

- Shows full details of a selected reminder.
- Edit and delete options available.
- Displays reminder status (active, completed, missed).

### 5. Settings Page

- Configure notification preferences (email, push).
- Set default reminder times and repeat intervals.
- Manage account information and logout.

### 6. Authentication Page

- Login and registration forms for user accounts.
- Password reset and account recovery options.

---

## Navigation Features

### Header (Top Navigation)

- **App Logo (Top Left)**: Displays "Reminders" with an icon. Tap to navigate to Home page from any screen.
- **Menu Button (Top Right)**: Hamburger menu icon for additional options.

### Footer Navigation Bar

- **Persistent Bottom Navigation**: Provides quick access to major pages from anywhere in the app.
- **Navigation Items**:
  - 🏠 **Home**: Navigate to home page (highlighted when active)
  - ➕ **Add**: Navigate to create reminder page
  - 📋 **Reminders**: Navigate to view reminders page (highlighted when active)
  - ⚙️ **Settings**: Navigate to settings page
- Active page is highlighted with primary color (#667EEA).
- Inactive pages show gray color (#9CA3AF).

---

## Instructions for Users

- To start the application, run: `npm start`.
- Use the **footer navigation bar** at the bottom for quick page navigation.
- Click the **app logo** to quickly return to the home page.
- For issues or bugs, check the troubleshooting section in `README.md`.
- Always review this guide for the latest features and instructions.

---

## Updates

- [2025-11-23] - **ROOT CAUSE FIXED**: Removed ErrorBoundary class component that was causing Metro bundler 500 error.
- [2025-11-23] - Replaced ErrorBoundary with global error handlers using process event listeners.
- [2025-11-23] - Added LogBox suppressions for non-critical warnings.
- [2025-11-23] - Added comprehensive error logging for unhandled rejections and uncaught exceptions.
- [2025-11-23] - Added Error Boundary component to catch and handle runtime errors gracefully.
- [2025-11-23] - Fixed watchman configuration for file watching.
- [2025-11-23] - Fixed datetimepicker version compatibility.
- [2025-11-23] - Fixed all 500 errors by adding comprehensive error handling to AsyncStorage operations.
- [2025-11-23] - Added JSON parsing validation to prevent data corruption errors.
- [2025-11-23] - Improved error handling in toggleReminder, deleteReminder, and saveReminders functions.
- [2025-11-23] - Fixed useEffect state dependency issue in HomeScreen.
- [2025-11-23] - Fixed 500 errors by updating all packages to latest compatible versions.
- [2025-11-23] - Updated React to 19.1.0, React Native to 0.81.5, and all Expo packages to latest.
- [2025-11-23] - Cleared bundler cache and fixed watchman configuration issues.
- [2025-11-23] - Updated app to support latest Expo Go version (Expo 54.0.0).
- [2025-11-23] - Updated all dependencies to latest compatible versions.
- [2025-11-23] - Fixed icon library compatibility (replaced react-native-vector-icons with @expo/vector-icons).
- [2025-11-22] - Added app logo in header for home navigation from any page.
- [2025-11-22] - Added menu button in top right corner for additional options.
- [2025-11-22] - Added persistent footer navigation bar with quick access to Home, Add Reminder, View Reminders, and Settings pages.
- [Date] - Added user authentication feature.
- [Date] - Improved error handling.
- [Date] - Revised routing logic for better performance.
