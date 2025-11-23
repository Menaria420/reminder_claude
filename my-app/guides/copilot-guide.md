# Copilot Guide for My App

## Basic App Rules

1. **Code Quality**: Ensure all code adheres to the project's coding standards and best practices.
2. **Documentation**: Every new feature or significant change must be documented in the relevant guide files.
3. **Error Handling**: All async operations must have try-catch blocks with proper fallbacks.
4. **Version Control**: Use meaningful commit messages and follow the branching strategy defined in the project.
5. **Testing**: All new features must be tested in Expo Go before deployment.
6. **AsyncStorage**: Always validate and parse JSON data with error handling.

## Critical App Architecture

### File Structure

```
src/
  screens/
    HomeScreen.js - Main dashboard, reminder list and quick actions
    ReminderListScreen.js - Detailed reminder list with search and filters
    CreateReminderScreen.js - Multi-step reminder creation wizard
  components/
    ErrorBoundary.js - Global error handling component
App.js - Main app entry point with navigation
```

### Key Technologies

- **Expo 54.0.0** - React Native framework for cross-platform development
- **React Navigation** - Stack-based screen navigation
- **AsyncStorage** - Local data persistence
- **React Native Reanimated** - Smooth animations
- **Expo Linear Gradient** - Gradient UI components
- **Expo Haptics** - Vibration feedback

## Update Log

- **[2025-11-23]**: **ROOT CAUSE FIXED** - ErrorBoundary class component was causing Metro bundler 500 error
- **[2025-11-23]**: Replaced with global error handlers using `process.on()` for unhandled rejections
- **[2025-11-23]**: Added LogBox suppressions to suppress non-critical warnings
- **[2025-11-23]**: Added Error Boundary component, fixed watchman, enhanced error handling
- **[2025-11-23]**: Updated all packages to latest compatible versions (React 19.1.0, React Native 0.81.5)
- **[2025-11-23]**: Fixed AsyncStorage JSON parsing with validation, added user alerts
- **[2025-11-22]**: Added app logo (top-left), menu button (top-right), footer navigation bar
- **[Date]**: Added user authentication feature.
- **[Date]**: Improved error handling in the application.
- **[Date]**: Refactored the main application logic for better performance.

## Change Application Instructions

### IMPORTANT WORKFLOW

**Before making changes, follow these steps:**

1. ✅ Read the latest version of this guide (copilot-guide.md)
2. ✅ Check AsyncStorage operations for error handling
3. ✅ Verify all imports use @expo/vector-icons (not react-native-vector-icons)
4. ✅ Add try-catch blocks to all async operations
5. ✅ Validate data types before processing
6. ✅ Run `node -c` syntax check on modified files

### When Applying Changes

1. Only apply newly added changes - DO NOT modify existing working code
2. Ensure Date objects are serializable (convert to ISO strings for navigation)
3. Always wrap AsyncStorage calls in try-catch blocks
4. Test in Expo Go with actual device/emulator
5. Clear cache if experiencing unexpected errors: `npm start -- --reset-cache`

### After Applying Changes

1. ✅ Update the user-guide.md with all changes
2. ✅ Include date stamp in format [YYYY-MM-DD]
3. ✅ Test the app in Expo Go
4. ✅ Verify no new errors appear in console

## Common Issues & Solutions

### **500 Error on App Load (METRO BUNDLER ERROR) - FIXED**

- **Root Cause**: ErrorBoundary class component wrapping app was incompatible with Metro bundler
- **Symptom**: "development server returned response error code:500" immediately after scanning QR code
- **Previous Fix**: Replaced ErrorBoundary with LogBox suppressions and process event listeners
- **Solution**: Use `process.on()` for global error handlers instead of React ErrorBoundary for app-level errors
- **Key Learning**: Class-based ErrorBoundary does not work well with Metro bundler in Expo - use functional error handling instead

### 500 Errors (AsyncStorage Related)

- **Cause**: Unhandled JSON parsing, invalid data format
- **Fix**: Ensure all JSON.parse() calls are wrapped in try-catch with validation

### AsyncStorage Failures

- **Cause**: Data corruption or invalid format
- **Fix**: Added fallback to empty arrays, proper error handling with user alerts

### Navigation Errors with Date Objects

- **Cause**: Non-serializable values passed through navigation params
- **Fix**: Convert Date objects to ISO strings before navigation

### Watchman Warnings

- **Fix**: Run `watchman watch-del '/path' ; watchman watch-project '/path'`

### Package Version Mismatches

- **Fix**: Run `npm install @exact/package@version --save`

## Running the App

```bash
# Start development server
npm start

# With cache reset
npm start -- --reset-cache

# Kill all running processes
killall -9 node

# Syntax check
node -c src/screens/HomeScreen.js
```

## Development Best Practices

1. **Always include error boundaries** for new screens
2. **Validate all user input** before storage
3. **Test on real device** before considering complete
4. **Use console.error()** for debugging async issues
5. **Add user-friendly Alert** notifications for errors
6. **Keep AsyncStorage keys consistent** across the app
7. **Never pass Date objects** in navigation params - use ISO strings
