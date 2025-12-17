import React, { useState, useEffect, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import CreateReminderScreen from './src/screens/CreateReminderScreen';
import ReminderListScreen from './src/screens/ReminderListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import { ThemeContext } from './src/context/ThemeContext';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import NotificationService from './src/utils/NotificationService';
import Toast from './src/components/Toast';
import CustomAlert from './src/components/CustomAlert';
import { showToast } from './src/components/Toast';
import { showAlert } from './src/components/CustomAlert';

import * as Linking from 'expo-linking';

const linking = {
  prefixes: [Linking.createURL('/'), 'reminderapp://'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          ResetPassword: 'reset-password/:token/:email',
        },
      },
    },
  },
};

const Stack = createStackNavigator();

// Auth Stack - Login & Signup
const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

// App Stack - Main application screens
const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="CreateReminder"
        component={CreateReminderScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen name="ReminderList" component={ReminderListScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
    </Stack.Navigator>
  );
};

// Navigation component that switches between Auth and App stacks
const Navigation = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0e27',
        }}
      >
        <ActivityIndicator size="large" color="#667EEA" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="AppStack" component={AppStack} />
      ) : (
        <Stack.Screen name="AuthStack" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [hasManualPreference, setHasManualPreference] = useState(false);

  // Initialize theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
          setHasManualPreference(true);
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
          setHasManualPreference(false);
        }
        setThemeLoaded(true);
      } catch (error) {
        console.error('Error loading theme:', error);
        setThemeLoaded(true);
      }
    };

    const initializeNotifications = async () => {
      try {
        await NotificationService.initialize();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    loadTheme();
    initializeNotifications();

    // Cleanup notification listeners on unmount
    return () => {
      NotificationService.cleanup();
    };
  }, [systemColorScheme]);

  // Listen to system theme changes in real-time (only if user hasn't manually toggled)
  useEffect(() => {
    if (themeLoaded && !hasManualPreference) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themeLoaded, hasManualPreference]);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      setHasManualPreference(true);
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const toastRef = React.useRef(null);
  const alertRef = React.useRef(null);

  React.useEffect(() => {
    if (toastRef.current) {
      global.showToast = showToast;
    }
    if (alertRef.current) {
      global.showAlert = showAlert;
    }
  }, []);

  if (!themeLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <AuthProvider>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
            <Navigation />
          </NavigationContainer>
          <Toast ref={toastRef} />
          <CustomAlert ref={alertRef} />
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeContext.Provider>
  );
}
