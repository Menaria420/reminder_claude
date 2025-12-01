import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeContext } from '../context/ThemeContext';
import { CATEGORIES } from '../constants/categories';
import RingtoneSelector from '../components/RingtoneSelector';
import NotificationService from '../utils/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const CreateReminderScreen = ({ navigation, route }) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const editMode = route?.params?.editMode || false;
  const existingReminder = route?.params?.reminder || null;

  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRingtoneSelector, setShowRingtoneSelector] = useState(false);
  const [selectedDayForTimePicker, setSelectedDayForTimePicker] = useState(null);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState(new Date());

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [reminderData, setReminderData] = useState(
    editMode && existingReminder
      ? {
          ...existingReminder,
          // Ensure dates are Date objects
          hourlyStartTime: existingReminder.hourlyStartTime
            ? new Date(existingReminder.hourlyStartTime)
            : new Date(),
          fifteenDaysStart: existingReminder.fifteenDaysStart
            ? new Date(existingReminder.fifteenDaysStart)
            : new Date(),
          fifteenDaysTime: existingReminder.fifteenDaysTime
            ? new Date(existingReminder.fifteenDaysTime)
            : new Date(),
          monthlyTime: existingReminder.monthlyTime
            ? new Date(existingReminder.monthlyTime)
            : new Date(),
          customSettings: existingReminder.customSettings
            ? {
                ...existingReminder.customSettings,
                time: new Date(existingReminder.customSettings.time),
              }
            : {
                yearRepeat: 'specific',
                year: new Date().getFullYear(),
                monthRepeat: 'specific',
                month: new Date().getMonth() + 1,
                dateRepeat: 'specific',
                date: new Date().getDate(),
                time: new Date(),
              },
        }
      : {
          category: '',
          categoryTag: '', // Step 4 category (Personal, Work, Health, Family)
          title: '',
          description: '',
          medicineName: '',
          dosage: '',
          exerciseName: '',
          duration: '',
          habitName: '',
          goal: '',
          type: '',
          hourlyInterval: 1,
          hourlyStartTime: new Date(),
          weeklyDays: [],
          weeklyTimes: {}, // Changed to object for per-day times: { 'Mon': ['9:00 AM'], ... }
          timeMethod: 'specific',
          fifteenDaysStart: new Date(),
          fifteenDaysTime: new Date(),
          monthlyDate: 1,
          monthlyTime: new Date(),
          dateRepeat: 'specific',
          notificationSound: 'default',
          ringTone: 'default',
          priority: 'normal',
          customSettings: {
            yearRepeat: 'specific',
            year: new Date().getFullYear(),
            monthRepeat: 'specific',
            month: new Date().getMonth() + 1,
            dateRepeat: 'specific',
            date: new Date().getDate(),
            time: new Date(),
          },
          goal: '',
        }
  );

  const reminderTypes = [
    {
      id: 'hourly',
      label: 'Hourly',
      icon: 'access-time',
      color: ['#3B82F6', '#2563EB'],
      description: 'Repeat every X hours',
    },
    {
      id: 'weekly',
      label: 'Weekly',
      icon: 'date-range',
      color: ['#10B981', '#059669'],
      description: 'Specific days & times',
    },
    {
      id: '15days',
      label: '15 Days',
      icon: 'refresh',
      color: ['#8B5CF6', '#7C3AED'],
      description: 'Every 15 days cycle',
    },
    {
      id: 'monthly',
      label: 'Monthly',
      icon: 'calendar-today',
      color: ['#F59E0B', '#D97706'],
      description: 'Same date each month',
    },
    {
      id: 'custom',
      label: 'Custom',
      icon: 'settings',
      color: ['#EF4444', '#DC2626'],
      description: 'Advanced scheduling',
    },
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const quickTimes = ['6:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];
  const [isReady, setIsReady] = useState(false);

  React.useEffect(() => {
    // Small delay to ensure layout is ready before showing content
    // This prevents the "flash" of unstyled/default content
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleVibrate = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getNextTriggerTime = () => {
    try {
      const now = new Date();

      if (reminderData.type === 'hourly') {
        const startTime = new Date(reminderData.hourlyStartTime);
        while (startTime < now) {
          startTime.setHours(startTime.getHours() + (reminderData.hourlyInterval || 1));
        }
        return startTime.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      if (reminderData.type === 'weekly' && reminderData.weeklyDays.length > 0) {
        // Find next occurrence
        // This is complex with per-day times, for now just show first available
        const day = reminderData.weeklyDays[0];
        const times = reminderData.weeklyTimes[day];
        if (times && times.length > 0) {
          return `${day} at ${times[0]}`;
        }
        return 'Weekly';
      }

      if (reminderData.type === '15days') {
        return reminderData.fifteenDaysStart.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      if (reminderData.type === 'monthly') {
        return `${reminderData.monthlyDate}${getDaySuffix(reminderData.monthlyDate)} of each month`;
      }

      if (reminderData.type === 'custom') {
        const { customSettings } = reminderData;
        const time = new Date(customSettings.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        if (customSettings.dateRepeat === 'every') return `Daily at ${time}`;
        if (customSettings.monthRepeat === 'every')
          return `Monthly on ${customSettings.date}${getDaySuffix(customSettings.date)} at ${time}`;
        if (customSettings.yearRepeat === 'every')
          return `Yearly on ${customSettings.month}/${customSettings.date} at ${time}`;
        return `${customSettings.month}/${customSettings.date}/${customSettings.year} at ${time}`;
      }

      return 'Soon';
    } catch (error) {
      return 'Soon';
    }
  };

  // Debug: Log reminder data in edit mode
  useEffect(() => {
    if (editMode && existingReminder) {
      console.log('📝 EDIT MODE - Loaded Reminder Data:');
      console.log('  - Category:', reminderData.category);
      console.log('  - Type:', reminderData.type);
      console.log('  - Title:', reminderData.title);
      console.log('  - Medicine Name:', reminderData.medicineName);
      console.log('  - Exercise Name:', reminderData.exerciseName);
      console.log('  - Habit Name:', reminderData.habitName);
      console.log('  - Priority:', reminderData.priority);
      console.log('  - Ring Tone:', reminderData.ringTone);
      console.log('  - Weekly Days:', reminderData.weeklyDays);
      console.log('  - Hourly Interval:', reminderData.hourlyInterval);
      console.log('  - Monthly Date:', reminderData.monthlyDate);
    }
  }, [editMode]);

  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const handleSelectCategory = (category) => {
    handleVibrate();
    setReminderData({ ...reminderData, category: category.id });
    setCurrentStep(2);
  };

  const handleSelectType = (type) => {
    handleVibrate();
    setReminderData({ ...reminderData, type });
    // If we are in a specific flow that needs type selection, move to next step
    // Otherwise, this might be part of the form
    if (currentStep === 2 && reminderData.category === 'others') {
      // Validate title before moving to next step
      if (!reminderData.title || !reminderData.title.trim()) {
        Alert.alert('Required Field', 'Please enter a title before selecting reminder type');
        return;
      }
      setCurrentStep(3);
    }
  };

  const toggleWeekday = (day) => {
    handleVibrate();
    const updatedDays = reminderData.weeklyDays.includes(day)
      ? reminderData.weeklyDays.filter((d) => d !== day)
      : [...reminderData.weeklyDays, day];

    // Initialize times for new day if needed
    const updatedTimes = { ...reminderData.weeklyTimes };
    if (!updatedTimes[day]) {
      updatedTimes[day] = [];
    }

    setReminderData({ ...reminderData, weeklyDays: updatedDays, weeklyTimes: updatedTimes });
  };

  const toggleTime = (day, time) => {
    handleVibrate();
    const currentTimes = reminderData.weeklyTimes[day] || [];
    const updatedDayTimes = currentTimes.includes(time)
      ? currentTimes.filter((t) => t !== time)
      : [...currentTimes, time];

    setReminderData({
      ...reminderData,
      weeklyTimes: {
        ...reminderData.weeklyTimes,
        [day]: updatedDayTimes,
      },
    });
  };

  const addCustomTimeForDay = (day) => {
    handleVibrate();
    setSelectedDayForTimePicker(day);
    setCustomTime(new Date());
    setShowCustomTimePicker(true);
  };

  const confirmCustomTime = () => {
    if (!selectedDayForTimePicker) return;

    const timeString = customTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    toggleTime(selectedDayForTimePicker, timeString);
    setShowCustomTimePicker(false);
    setSelectedDayForTimePicker(null);
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!reminderData.category) {
        Alert.alert('Required Field', 'Please select a category');
        return false;
      }
    }

    if (currentStep === 2) {
      const { category } = reminderData;
      if (category === 'medication') {
        if (!reminderData.medicineName.trim()) {
          Alert.alert('Required Field', 'Please enter medicine name');
          return false;
        }
        if (!reminderData.type) {
          // Frequency
          Alert.alert('Required Field', 'Please select frequency');
          return false;
        }
      } else if (category === 'fitness') {
        if (!reminderData.exerciseName.trim()) {
          Alert.alert('Required Field', 'Please enter exercise name');
          return false;
        }
        if (!reminderData.type) {
          Alert.alert('Required Field', 'Please select frequency');
          return false;
        }
      } else if (category === 'habits') {
        if (!reminderData.habitName.trim()) {
          Alert.alert('Required Field', 'Please enter habit name');
          return false;
        }
        if (!reminderData.type) {
          Alert.alert('Required Field', 'Please select frequency');
          return false;
        }
      } else if (category === 'others') {
        if (!reminderData.title.trim()) {
          Alert.alert('Required Field', 'Please enter title');
          return false;
        }
        if (!reminderData.type) {
          Alert.alert('Required Field', 'Please select reminder type');
          return false;
        }
      }
    }

    if (currentStep === 3) {
      if (reminderData.type === 'weekly') {
        if (reminderData.weeklyDays.length === 0) {
          Alert.alert('Required Field', 'Please select at least one day');
          return false;
        }

        // Check if any selected day has no times
        const hasEmptyDay = reminderData.weeklyDays.some(
          (day) => !reminderData.weeklyTimes[day] || reminderData.weeklyTimes[day].length === 0
        );

        if (hasEmptyDay) {
          Alert.alert('Required Field', 'Please add at least one time for each selected day');
          return false;
        }
      }

      // Validate custom reminder has all required settings
      if (reminderData.type === 'custom') {
        // Ensure title is set for custom reminders
        if (!reminderData.title || !reminderData.title.trim()) {
          Alert.alert('Required Field', 'Please enter a title for your reminder');
          return false;
        }

        // Title is already validated in step 2, just ensure custom settings are reasonable
        const { customSettings } = reminderData;
        if (!customSettings || !customSettings.time) {
          Alert.alert('Required Field', 'Please set a time for your custom reminder');
          return false;
        }
      }

      // Final check: ensure title is never empty for any reminder type
      if (!reminderData.title || !reminderData.title.trim()) {
        Alert.alert('Required Field', 'Please enter a title for your reminder');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      handleVibrate();
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    handleVibrate();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateReminder = async () => {
    if (!validateStep()) return;

    handleVibrate();
    setLoading(true);

    try {
      // Get existing reminders from AsyncStorage
      const existingReminders = await AsyncStorage.getItem('reminders');
      const reminders = existingReminders ? JSON.parse(existingReminders) : [];

      let updatedReminder;
      let updatedReminders;

      if (editMode && existingReminder) {
        // Update existing reminder - preserve ID and createdAt
        updatedReminder = {
          ...reminderData,
          id: existingReminder.id,
          createdAt: existingReminder.createdAt,
          updatedAt: new Date().toISOString(),
          isActive: existingReminder.isActive, // Preserve active state
        };

        // Replace the old reminder with updated one
        updatedReminders = reminders.map((r) =>
          r.id === existingReminder.id ? updatedReminder : r
        );
      } else {
        // Create new reminder with unique ID and timestamp
        updatedReminder = {
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...reminderData,
          createdAt: new Date().toISOString(),
          isActive: true,
        };

        // Add new reminder
        updatedReminders = [...reminders, updatedReminder];
      }

      console.log('💾 Saving Reminder:');
      console.log('  - Type:', updatedReminder.type);
      console.log('  - Category:', updatedReminder.category);
      console.log('  - Title:', updatedReminder.title);

      if (updatedReminder.type === 'hourly') {
        console.log('  - hourlyStartTime:', updatedReminder.hourlyStartTime);
        console.log('  - hourlyInterval:', updatedReminder.hourlyInterval);
        if (updatedReminder.hourlyStartTime) {
          const time = new Date(updatedReminder.hourlyStartTime);
          console.log('  - Parsed hours:', time.getHours());
          console.log('  - Parsed minutes:', time.getMinutes());
        }
      } else if (updatedReminder.type === 'weekly') {
        console.log('  - weeklyDays:', updatedReminder.weeklyDays);
        console.log('  - weeklyTimes:', updatedReminder.weeklyTimes);
        console.log('  - weeklyDays length:', updatedReminder.weeklyDays?.length);
        console.log('  - weeklyTimes keys:', Object.keys(updatedReminder.weeklyTimes || {}));
      } else if (updatedReminder.type === '15days') {
        console.log('  - fifteenDaysStart:', updatedReminder.fifteenDaysStart);
        console.log('  - fifteenDaysTime:', updatedReminder.fifteenDaysTime);
      } else if (updatedReminder.type === 'monthly') {
        console.log('  - monthlyDate:', updatedReminder.monthlyDate);
        console.log('  - monthlyTime:', updatedReminder.monthlyTime);
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));

      // Create notification if notification system is enabled
      try {
        const NotificationManager = require('../utils/NotificationManager').default;
        const NotificationService = require('../utils/NotificationService').default;

        // Calculate trigger time based on reminder type
        let triggerTime = new Date();

        if (reminderData.type === 'hourly') {
          // Use the hourlyStartTime the user selected
          triggerTime = new Date(reminderData.hourlyStartTime);
          // If start time is in the past, add interval to get next trigger
          while (triggerTime < new Date()) {
            triggerTime.setHours(triggerTime.getHours() + (reminderData.hourlyInterval || 1));
          }
        } else if (reminderData.type === 'weekly' && reminderData.weeklyDays.length > 0) {
          // Schedule for each day and time
          let nextTrigger = null;
          const now = new Date();

          // Find the next occurrence across all days and times
          for (const day of reminderData.weeklyDays) {
            const times = reminderData.weeklyTimes[day] || [];
            for (const timeStr of times) {
              try {
                // Parse time string (e.g., "9:00 AM")
                const timeParts = timeStr.trim().split(' ');
                if (timeParts.length !== 2) {
                  console.warn('Invalid time format:', timeStr);
                  continue;
                }

                const [time, period] = timeParts;
                const [hoursStr, minutesStr] = time.split(':');
                const hours = parseInt(hoursStr, 10);
                const minutes = parseInt(minutesStr, 10);

                if (
                  isNaN(hours) ||
                  isNaN(minutes) ||
                  hours < 1 ||
                  hours > 12 ||
                  minutes < 0 ||
                  minutes > 59
                ) {
                  console.warn('Invalid time values:', timeStr);
                  continue;
                }

                // Convert to 24-hour format
                let hour24 = hours;
                if (period === 'PM' && hours !== 12) hour24 += 12;
                if (period === 'AM' && hours === 12) hour24 = 0;

                // Calculate date for this day
                const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
                if (dayIndex === -1) {
                  console.warn('Invalid day name:', day);
                  continue;
                }

                const currentDayIndex = now.getDay();
                let daysUntil = dayIndex - currentDayIndex;
                if (daysUntil < 0) daysUntil += 7;

                const potentialDate = new Date();
                potentialDate.setDate(now.getDate() + daysUntil);
                potentialDate.setHours(hour24, minutes, 0, 0);

                // If it's today but the time has passed, move to next week
                if (daysUntil === 0 && potentialDate < now) {
                  potentialDate.setDate(potentialDate.getDate() + 7);
                }

                // Validate the date is valid
                if (isNaN(potentialDate.getTime())) {
                  console.warn('Invalid date created for:', day, timeStr);
                  continue;
                }

                if (!nextTrigger || potentialDate < nextTrigger) {
                  nextTrigger = potentialDate;
                }
              } catch (error) {
                console.error('Error parsing time for', day, timeStr, error);
                continue;
              }
            }
          }

          if (nextTrigger && !isNaN(nextTrigger.getTime())) {
            triggerTime = nextTrigger;
          } else {
            // Fallback - set to tomorrow at 9 AM
            triggerTime = new Date();
            triggerTime.setDate(triggerTime.getDate() + 1);
            triggerTime.setHours(9, 0, 0, 0);
          }
        } else if (reminderData.type === '15days') {
          console.log('📅 15-Day Reminder Trigger Calculation:');
          console.log('  - fifteenDaysTime:', reminderData.fifteenDaysTime);
          console.log('  - fifteenDaysStart:', reminderData.fifteenDaysStart);

          triggerTime = new Date(reminderData.fifteenDaysTime);
          console.log('  - Initial trigger from time:', triggerTime.toISOString());
          console.log('  - Hours:', triggerTime.getHours());
          console.log('  - Minutes:', triggerTime.getMinutes());
          console.log('  - Seconds:', triggerTime.getSeconds());
          console.log('  - Milliseconds:', triggerTime.getMilliseconds());

          // Set date to start date
          const startDate = new Date(reminderData.fifteenDaysStart);
          if (!isNaN(startDate.getTime())) {
            console.log('  - Start date:', startDate.toISOString());
            triggerTime.setFullYear(startDate.getFullYear());
            triggerTime.setMonth(startDate.getMonth());
            triggerTime.setDate(startDate.getDate());
            console.log('  - Final trigger time:', triggerTime.toISOString());
            console.log('  - Final Hours:', triggerTime.getHours());
            console.log('  - Final Minutes:', triggerTime.getMinutes());
            console.log('  - Final Seconds:', triggerTime.getSeconds());
          }
        } else if (reminderData.type === 'monthly') {
          triggerTime = new Date(reminderData.monthlyTime);
          const monthlyDate = reminderData.monthlyDate;
          if (monthlyDate && monthlyDate !== 'last') {
            triggerTime.setDate(monthlyDate);
          } else if (monthlyDate === 'last') {
            // Set to last day of current month
            triggerTime.setMonth(triggerTime.getMonth() + 1, 0);
          }
        } else if (reminderData.type === 'custom') {
          const { customSettings } = reminderData;
          triggerTime = new Date(customSettings.time);

          // Set Year
          if (customSettings.yearRepeat === 'specific') {
            triggerTime.setFullYear(customSettings.year);
          } else {
            triggerTime.setFullYear(new Date().getFullYear());
          }

          // Set Month
          if (customSettings.monthRepeat === 'specific') {
            triggerTime.setMonth(customSettings.month - 1); // 0-indexed
          } else {
            triggerTime.setMonth(new Date().getMonth());
          }

          // Set Date
          if (customSettings.dateRepeat === 'specific') {
            triggerTime.setDate(customSettings.date);
          } else {
            triggerTime.setDate(new Date().getDate());
          }

          // If calculated time is in the past, adjust based on repetition
          if (triggerTime < new Date()) {
            if (customSettings.dateRepeat === 'every') {
              triggerTime.setDate(triggerTime.getDate() + 1);
            } else if (customSettings.monthRepeat === 'every') {
              triggerTime.setMonth(triggerTime.getMonth() + 1);
            } else if (customSettings.yearRepeat === 'every') {
              triggerTime.setFullYear(triggerTime.getFullYear() + 1);
            }
          }
        } else {
          // Default to 1 hour from now
          triggerTime.setHours(triggerTime.getHours() + 1);
        }

        // Final validation: ensure the date is valid and in the future
        if (isNaN(triggerTime.getTime())) {
          console.warn('Invalid trigger time calculated, using default');
          triggerTime = new Date();
          triggerTime.setHours(triggerTime.getHours() + 1);
        }

        // Ensure trigger time is in the future
        if (triggerTime < new Date()) {
          console.log('Trigger time is in the past, adjusting to next occurrence');
          triggerTime.setDate(triggerTime.getDate() + 1);
        }

        console.log('Final trigger time:', triggerTime.toISOString());

        // Create notification record
        await NotificationManager.createNotification(updatedReminder, triggerTime);

        // Schedule the notification
        await NotificationService.scheduleNotification(updatedReminder, triggerTime);
      } catch (notifError) {
        console.log('Notification setup skipped:', notifError.message);
        // Continue even if notification fails
      }

      setLoading(false);
      setShowSuccess(true);

      // Navigate back after showing success
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('ReminderList', { refresh: true });
      }, 2500);
    } catch (error) {
      console.error(editMode ? 'Error updating reminder:' : 'Error creating reminder:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        editMode
          ? 'Failed to update reminder. Please try again.'
          : 'Failed to create reminder. Please try again.'
      );
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicatorContainer, isDarkMode && styles.stepIndicatorContainerDark]}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepWrapper}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepText, currentStep >= step && styles.stepTextActive]}>
              {step}
            </Text>
          </View>
          {step < 4 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#667EEA" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const renderCategorySelection = () => {
    console.log('🎯 RENDERING CATEGORY SELECTION');
    console.log('  Current reminderData.category:', reminderData.category);
    console.log('  Edit Mode:', editMode);

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          What do you want to be reminded about?
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = reminderData.category === cat.id;
            console.log(
              `  Category ${cat.id}: isSelected=${isSelected} (comparing '${reminderData.category}' === '${cat.id}')`
            );

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  isDarkMode && styles.categoryCardDark,
                  isSelected && styles.categoryCardActive,
                  isSelected && isDarkMode && styles.categoryCardActiveDark,
                ]}
                onPress={() => handleSelectCategory(cat)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={cat.color} style={styles.categoryIcon}>
                  <Icon name={cat.icon} size={28} color="white" />
                </LinearGradient>
                <Text style={[styles.categoryLabel, isDarkMode && styles.categoryLabelDark]}>
                  {cat.label}
                </Text>
                {isSelected && (
                  <View style={styles.categorySelectedBadge}>
                    <Icon name="check-circle" size={24} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  const renderMedicationForm = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Medicine Name *</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.medicineName}
          onChangeText={(text) =>
            setReminderData({ ...reminderData, medicineName: text, title: text })
          }
          placeholder="e.g., Aspirin, Vitamin D"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Dosage (Optional)</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.dosage}
          onChangeText={(text) =>
            setReminderData({ ...reminderData, dosage: text, description: `Dosage: ${text}` })
          }
          placeholder="e.g., 500mg, 1 tablet"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Frequency</Text>
      {console.log('🔄 Rendering Medication Frequency - Current type:', reminderData.type)}
      {/* Reusing reminderTypes but filtering or simplifying if needed */}
      {reminderTypes.slice(0, 2).map(
        (
          type // Showing Hourly and Weekly for now
        ) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              isDarkMode && styles.typeCardDark,
              reminderData.type === type.id && styles.typeCardActive,
              reminderData.type === type.id && isDarkMode && styles.typeCardActiveDark,
            ]}
            onPress={() => setReminderData({ ...reminderData, type: type.id })}
          >
            <LinearGradient colors={type.color} style={styles.typeIcon}>
              <Icon name={type.icon} size={24} color="white" />
            </LinearGradient>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeName, isDarkMode && styles.typeNameDark]}>{type.label}</Text>
              <Text style={[styles.typeDesc, isDarkMode && styles.typeDescDark]}>
                {type.description}
              </Text>
            </View>
            {reminderData.type === type.id && (
              <Icon name="check-circle" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
        )
      )}
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFitnessForm = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Exercise Name *</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.exerciseName}
          onChangeText={(text) =>
            setReminderData({ ...reminderData, exerciseName: text, title: text })
          }
          placeholder="e.g., Morning Run, Yoga"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Duration (Optional)</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.duration}
          onChangeText={(text) =>
            setReminderData({ ...reminderData, duration: text, description: `Duration: ${text}` })
          }
          placeholder="e.g., 30 mins"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Frequency</Text>
      {reminderTypes.slice(1, 2).map(
        (
          type // Weekly only for fitness for now
        ) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              isDarkMode && styles.typeCardDark,
              reminderData.type === type.id && styles.typeCardActive,
              reminderData.type === type.id && isDarkMode && styles.typeCardActiveDark,
            ]}
            onPress={() => setReminderData({ ...reminderData, type: type.id })}
          >
            <LinearGradient colors={type.color} style={styles.typeIcon}>
              <Icon name={type.icon} size={24} color="white" />
            </LinearGradient>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeName, isDarkMode && styles.typeNameDark]}>{type.label}</Text>
              <Text style={[styles.typeDesc, isDarkMode && styles.typeDescDark]}>
                {type.description}
              </Text>
            </View>
            {reminderData.type === type.id && (
              <Icon name="check-circle" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
        )
      )}
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderHabitForm = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Habit Name *</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.habitName}
          onChangeText={(text) =>
            setReminderData({ ...reminderData, habitName: text, title: text })
          }
          placeholder="e.g., Drink Water, Read Book"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Goal (Optional)</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.goal}
          onChangeText={(text) =>
            setReminderData({ ...reminderData, goal: text, description: `Goal: ${text}` })
          }
          placeholder="e.g., 2 liters, 10 pages"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Frequency</Text>
      {reminderTypes.slice(0, 2).map(
        (
          type // Hourly/Weekly
        ) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeCard,
              isDarkMode && styles.typeCardDark,
              reminderData.type === type.id && styles.typeCardActive,
              reminderData.type === type.id && isDarkMode && styles.typeCardActiveDark,
            ]}
            onPress={() => setReminderData({ ...reminderData, type: type.id })}
          >
            <LinearGradient colors={type.color} style={styles.typeIcon}>
              <Icon name={type.icon} size={24} color="white" />
            </LinearGradient>
            <View style={styles.typeInfo}>
              <Text style={[styles.typeName, isDarkMode && styles.typeNameDark]}>{type.label}</Text>
              <Text style={[styles.typeDesc, isDarkMode && styles.typeDescDark]}>
                {type.description}
              </Text>
            </View>
            {reminderData.type === type.id && (
              <Icon name="check-circle" size={24} color="#10B981" />
            )}
          </TouchableOpacity>
        )
      )}
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderGeneralForm = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Reminder Title *</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.title}
          onChangeText={(text) => setReminderData({ ...reminderData, title: text })}
          placeholder="e.g., Team meeting"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark, styles.textArea]}
          value={reminderData.description}
          onChangeText={(text) => setReminderData({ ...reminderData, description: text })}
          placeholder="Add notes or details..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
        Select Reminder Type
      </Text>
      {console.log('🔄 Rendering Others Type Selection - Current type:', reminderData.type)}
      {reminderTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.typeCard,
            isDarkMode && styles.typeCardDark,
            reminderData.type === type.id && styles.typeCardActive,
            reminderData.type === type.id && isDarkMode && styles.typeCardActiveDark,
          ]}
          onPress={() => handleSelectType(type.id)}
          activeOpacity={0.8}
        >
          <LinearGradient colors={type.color} style={styles.typeIcon}>
            <Icon name={type.icon} size={24} color="white" />
          </LinearGradient>
          <View style={styles.typeInfo}>
            <Text style={[styles.typeName, isDarkMode && styles.typeNameDark]}>{type.label}</Text>
            <Text style={[styles.typeDesc, isDarkMode && styles.typeDescDark]}>
              {type.description}
            </Text>
          </View>
          {reminderData.type === type.id && <Icon name="check-circle" size={24} color="#10B981" />}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderStepContent = () => {
    if (currentStep === 1) return renderCategorySelection();

    const { category } = reminderData;
    if (currentStep === 2) {
      switch (category) {
        case 'medication':
          return renderMedicationForm();
        case 'fitness':
          return renderFitnessForm();
        case 'habits':
          return renderHabitForm();
        default:
          return renderGeneralForm();
      }
    }
    if (currentStep === 3) return renderStep2(); // The old Step 2 (Time configuration)
    if (currentStep === 4) return renderStep3(); // The old Step 3 (Options)
    return null;
  };

  const renderStep2 = () => {
    const { type } = reminderData;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Hourly Configuration */}
        {type === 'hourly' && (
          <>
            <View style={[styles.configCard, isDarkMode && styles.configCardDark]}>
              <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
                Set Hourly Interval
              </Text>
              <View style={styles.intervalSelector}>
                <TouchableOpacity
                  style={[styles.intervalButton, isDarkMode && styles.intervalButtonDark]}
                  onPress={() => {
                    handleVibrate();
                    setReminderData({
                      ...reminderData,
                      hourlyInterval: Math.max(1, reminderData.hourlyInterval - 1),
                    });
                  }}
                >
                  <Text style={styles.intervalButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.intervalDisplay}>
                  <Text style={styles.intervalValue}>{reminderData.hourlyInterval}</Text>
                  <Text style={styles.intervalUnit}>
                    {reminderData.hourlyInterval === 1 ? 'hour' : 'hours'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.intervalButton, isDarkMode && styles.intervalButtonDark]}
                  onPress={() => {
                    handleVibrate();
                    setReminderData({
                      ...reminderData,
                      hourlyInterval: Math.min(24, reminderData.hourlyInterval + 1),
                    });
                  }}
                >
                  <Text style={styles.intervalButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.quickSelectGrid}>
                {[1, 2, 3, 4, 6, 8, 12, 24].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.quickSelectButton,
                      reminderData.hourlyInterval === hours && styles.quickSelectActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({ ...reminderData, hourlyInterval: hours });
                    }}
                  >
                    <Text
                      style={[
                        styles.quickSelectText,
                        reminderData.hourlyInterval === hours && styles.quickSelectTextActive,
                      ]}
                    >
                      {hours}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => {
                handleVibrate();
                setShowTimePicker(true);
              }}
            >
              <Icon name="access-time" size={20} color="#667EEA" />
              <Text style={styles.timePickerText}>
                Start Time:{' '}
                {reminderData.hourlyStartTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Weekly Configuration */}
        {type === 'weekly' && (
          <>
            <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
              Select Days
            </Text>
            <View style={styles.weekDayChipGrid}>
              {weekDays.map((day) => {
                const isSelected = reminderData.weeklyDays.includes(day);
                const timesCount = (reminderData.weeklyTimes[day] || []).length;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.weekDayChip,
                      isSelected && styles.weekDayChipSelected,
                      isDarkMode && styles.weekDayChipDark,
                      isSelected && isDarkMode && styles.weekDayChipSelectedDark,
                    ]}
                    onPress={() => toggleWeekday(day)}
                  >
                    <Text
                      style={[styles.weekDayChipText, isSelected && styles.weekDayChipTextSelected]}
                    >
                      {day}
                    </Text>
                    {isSelected && timesCount > 0 && (
                      <View style={styles.dayTimeCount}>
                        <Text style={styles.dayTimeCountText}>{timesCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {reminderData.weeklyDays.length > 0 && (
              <>
                <Text
                  style={[
                    styles.configTitle,
                    isDarkMode && styles.configTitleDark,
                    { marginTop: 16 },
                  ]}
                >
                  Set Times for Selected Days
                </Text>
                <View style={styles.selectedDaysContainer}>
                  {reminderData.weeklyDays.map((day) => {
                    const dayTimes = reminderData.weeklyTimes[day] || [];
                    return (
                      <View
                        key={day}
                        style={[styles.dayTimeCard, isDarkMode && styles.dayTimeCardDark]}
                      >
                        <View style={styles.dayTimeCardHeader}>
                          <Text
                            style={[
                              styles.dayTimeCardTitle,
                              isDarkMode && styles.dayTimeCardTitleDark,
                            ]}
                          >
                            {day}
                          </Text>
                          <TouchableOpacity
                            style={styles.addTimeIconButton}
                            onPress={() => addCustomTimeForDay(day)}
                          >
                            <Icon name="add-circle" size={24} color="#667EEA" />
                          </TouchableOpacity>
                        </View>
                        {dayTimes.length > 0 ? (
                          <View style={styles.timeChipsRow}>
                            {dayTimes.map((time, index) => (
                              <View key={index} style={styles.timeChipCompact}>
                                <Text style={styles.timeChipCompactText}>{time}</Text>
                                <TouchableOpacity onPress={() => toggleTime(day, time)}>
                                  <Icon name="close" size={16} color="#667EEA" />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.noTimesText, isDarkMode && styles.noTimesTextDark]}>
                            No times set. Tap + to add.
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* 15 Days Configuration */}
        {type === '15days' && (
          <>
            <View style={styles.infoCard}>
              <Icon name="info-outline" size={20} color="#8B5CF6" />
              <Text style={styles.infoText}>
                This reminder will repeat every 15 days from your selected start date
              </Text>
            </View>

            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-today" size={20} color="#667EEA" />
              <Text style={styles.datePickerText}>
                Start Date: {reminderData.fifteenDaysStart.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Icon name="access-time" size={20} color="#667EEA" />
              <Text style={styles.timePickerText}>
                Time:{' '}
                {reminderData.fifteenDaysTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Next Occurrences</Text>
              {[0, 15, 30].map((days, index) => {
                const date = new Date(reminderData.fifteenDaysStart);
                date.setDate(date.getDate() + days);
                return (
                  <View key={index} style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Reminder {index + 1}</Text>
                    <Text style={styles.previewValue}>
                      {date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Monthly Configuration */}
        {type === 'monthly' && (
          <>
            <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
              Select Date
            </Text>
            <View style={styles.dateGrid}>
              {[...Array(31)].map((_, i) => (
                <TouchableOpacity
                  key={i + 1}
                  style={[
                    styles.dateButton,
                    reminderData.monthlyDate === i + 1 && styles.dateButtonActive,
                  ]}
                  onPress={() => {
                    handleVibrate();
                    setReminderData({ ...reminderData, monthlyDate: i + 1 });
                  }}
                >
                  <Text
                    style={[
                      styles.dateButtonText,
                      reminderData.monthlyDate === i + 1 && styles.dateButtonTextActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.lastDayButton,
                reminderData.monthlyDate === 'last' && styles.lastDayButtonActive,
              ]}
              onPress={() => {
                handleVibrate();
                setReminderData({ ...reminderData, monthlyDate: 'last' });
              }}
            >
              <Text
                style={[
                  styles.lastDayButtonText,
                  reminderData.monthlyDate === 'last' && styles.lastDayButtonTextActive,
                ]}
              >
                Last Day of Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Icon name="access-time" size={20} color="#667EEA" />
              <Text style={styles.timePickerText}>
                Time:{' '}
                {reminderData.monthlyTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Custom Configuration */}
        {type === 'custom' && (
          <>
            <View style={styles.customCard}>
              <Text style={styles.customTitle}>Custom Schedule</Text>

              {/* Year Selection */}
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>Year</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      reminderData.customSettings.yearRepeat === 'specific' && styles.toggleActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, yearRepeat: 'specific' },
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        reminderData.customSettings.yearRepeat === 'specific' &&
                          styles.toggleTextActive,
                      ]}
                    >
                      Specific
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      reminderData.customSettings.yearRepeat === 'every' && styles.toggleActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, yearRepeat: 'every' },
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        reminderData.customSettings.yearRepeat === 'every' &&
                          styles.toggleTextActive,
                      ]}
                    >
                      Every Year
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {reminderData.customSettings.yearRepeat === 'specific' && (
                <TextInput
                  style={styles.yearInput}
                  value={String(reminderData.customSettings.year)}
                  onChangeText={(text) => {
                    const year = parseInt(text) || new Date().getFullYear();
                    setReminderData({
                      ...reminderData,
                      customSettings: { ...reminderData.customSettings, year },
                    });
                  }}
                  keyboardType="numeric"
                  placeholder="2025"
                  maxLength={4}
                />
              )}

              {/* Month Selection */}
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>Month</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      reminderData.customSettings.monthRepeat === 'specific' && styles.toggleActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, monthRepeat: 'specific' },
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        reminderData.customSettings.monthRepeat === 'specific' &&
                          styles.toggleTextActive,
                      ]}
                    >
                      Specific
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      reminderData.customSettings.monthRepeat === 'every' && styles.toggleActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, monthRepeat: 'every' },
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        reminderData.customSettings.monthRepeat === 'every' &&
                          styles.toggleTextActive,
                      ]}
                    >
                      Every Month
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {reminderData.customSettings.monthRepeat === 'specific' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  {[
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ].map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.chip,
                        reminderData.customSettings.month === index + 1 && styles.chipActive,
                      ]}
                      onPress={() => {
                        handleVibrate();
                        setReminderData({
                          ...reminderData,
                          customSettings: { ...reminderData.customSettings, month: index + 1 },
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          reminderData.customSettings.month === index + 1 && styles.chipTextActive,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Date Selection */}
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>Date</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      reminderData.customSettings.dateRepeat === 'specific' && styles.toggleActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, dateRepeat: 'specific' },
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        reminderData.customSettings.dateRepeat === 'specific' &&
                          styles.toggleTextActive,
                      ]}
                    >
                      Specific
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      reminderData.customSettings.dateRepeat === 'every' && styles.toggleActive,
                    ]}
                    onPress={() => {
                      handleVibrate();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, dateRepeat: 'every' },
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        reminderData.customSettings.dateRepeat === 'every' &&
                          styles.toggleTextActive,
                      ]}
                    >
                      Every Day
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {reminderData.customSettings.dateRepeat === 'specific' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipScroll}
                >
                  {[...Array(31)].map((_, i) => (
                    <TouchableOpacity
                      key={i + 1}
                      style={[
                        styles.chip,
                        reminderData.customSettings.date === i + 1 && styles.chipActive,
                      ]}
                      onPress={() => {
                        handleVibrate();
                        setReminderData({
                          ...reminderData,
                          customSettings: { ...reminderData.customSettings, date: i + 1 },
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          reminderData.customSettings.date === i + 1 && styles.chipTextActive,
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Time Selection */}
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Icon name="access-time" size={20} color="#667EEA" />
                  <Text style={styles.timePickerText}>
                    {reminderData.customSettings.time
                      ? new Date(reminderData.customSettings.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Select Time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
            <Text style={styles.continueButtonText}>Continue to Options</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderStep3 = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
        Additional Options
      </Text>

      <TouchableOpacity style={styles.optionCard} onPress={() => setShowRingtoneSelector(true)}>
        <View style={styles.optionIcon}>
          <Icon name="music-note" size={20} color="#667EEA" />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Ringtone</Text>
          <View style={styles.ringtoneDisplay}>
            <Text style={styles.ringtoneValue}>
              {reminderData.ringTone === 'default'
                ? 'Use Default'
                : reminderData.ringTone.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.optionCard}>
        <View style={styles.optionIcon}>
          <Icon name="label" size={20} color="#10B981" />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {['Personal', 'Work', 'Health', 'Family'].map((categoryTag) => (
              <TouchableOpacity
                key={categoryTag}
                style={[
                  styles.categoryChip,
                  reminderData.categoryTag === categoryTag.toLowerCase() &&
                    styles.categoryChipActive,
                ]}
                onPress={() => {
                  handleVibrate();
                  setReminderData({ ...reminderData, categoryTag: categoryTag.toLowerCase() });
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    reminderData.categoryTag === categoryTag.toLowerCase() &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {categoryTag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.optionCard}>
        <View style={styles.optionIcon}>
          <Icon name="flag" size={20} color="#F59E0B" />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Priority</Text>
          <View style={styles.priorityOptions}>
            {['Low', 'Normal', 'High', 'Urgent'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityChip,
                  reminderData.priority === priority.toLowerCase() && styles.priorityChipActive,
                  reminderData.priority === priority.toLowerCase() && {
                    backgroundColor:
                      priority === 'Urgent'
                        ? '#EF4444'
                        : priority === 'High'
                        ? '#F59E0B'
                        : priority === 'Normal'
                        ? '#3B82F6'
                        : '#6B7280',
                  },
                ]}
                onPress={() => {
                  handleVibrate();
                  setReminderData({ ...reminderData, priority: priority.toLowerCase() });
                }}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    reminderData.priority === priority.toLowerCase() &&
                      styles.priorityChipTextActive,
                  ]}
                >
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.summaryCard, isDarkMode && styles.summaryCardDark]}>
        <Text style={[styles.summaryTitle, isDarkMode && styles.summaryTitleDark]}>
          Reminder Summary
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>Title:</Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
            {reminderData.title || 'Not set'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>Type:</Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
            {reminderData.type || 'Not set'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>
            Category:
          </Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
            {reminderData.category}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>
            Priority:
          </Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
            {reminderData.priority}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateReminder}
        disabled={loading}
      >
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>
              {editMode ? 'Update Reminder' : 'Create Reminder'}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.logoButton}>
            <Icon name="arrow-back" size={24} color="white" />
            <Text style={styles.logoText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editMode ? 'Edit Reminder' : 'Create Reminder'}</Text>
          {/* Create Button */}
          <TouchableOpacity
            onPress={currentStep === 4 ? handleCreateReminder : handleNext}
            style={styles.checkButton}
          >
            <Icon name="check" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={reminderData.fifteenDaysStart}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setReminderData({ ...reminderData, fifteenDaysStart: selectedDate });
            }
          }}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={
            reminderData.type === 'hourly'
              ? reminderData.hourlyStartTime
              : reminderData.type === '15days'
              ? reminderData.fifteenDaysTime
              : reminderData.monthlyTime
          }
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            console.log('⏰ Time Picker Changed:');
            console.log('  - Event:', event);
            console.log('  - Selected Time:', selectedTime);
            if (selectedTime) {
              console.log('  - ISO:', selectedTime.toISOString());
              console.log('  - Hours:', selectedTime.getHours());
              console.log('  - Minutes:', selectedTime.getMinutes());
            }

            setShowTimePicker(false);
            if (selectedTime) {
              if (reminderData.type === 'hourly') {
                console.log('  - Saving to hourlyStartTime');
                setReminderData({ ...reminderData, hourlyStartTime: selectedTime });
              } else if (reminderData.type === '15days') {
                setReminderData({ ...reminderData, fifteenDaysTime: selectedTime });
              } else if (reminderData.type === 'monthly') {
                setReminderData({ ...reminderData, monthlyTime: selectedTime });
              } else if (reminderData.type === 'custom') {
                setReminderData({
                  ...reminderData,
                  customSettings: { ...reminderData.customSettings, time: selectedTime },
                });
              }
            }
          }}
        />
      )}

      {/* Custom Time Picker for Weekly Reminders */}
      {showCustomTimePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={customTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            if (event.type === 'dismissed') {
              setShowCustomTimePicker(false);
              setSelectedDayForTimePicker(null);
              return;
            }

            if (selectedTime && selectedDayForTimePicker) {
              setCustomTime(selectedTime);
              const timeString = selectedTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              toggleTime(selectedDayForTimePicker, timeString);
              handleVibrate();
            }

            setShowCustomTimePicker(false);
            setSelectedDayForTimePicker(null);
          }}
        />
      )}

      {/* Web Time Picker Modal */}
      {showCustomTimePicker && Platform.OS === 'web' && (
        <Modal
          visible={showCustomTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowCustomTimePicker(false);
            setSelectedDayForTimePicker(null);
          }}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              setShowCustomTimePicker(false);
              setSelectedDayForTimePicker(null);
            }}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={[styles.timePickerModal, isDarkMode && styles.timePickerModalDark]}>
                  <View style={styles.timePickerHeader}>
                    <Text
                      style={[styles.timePickerTitle, isDarkMode && styles.timePickerTitleDark]}
                    >
                      Add Time for {selectedDayForTimePicker}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowCustomTimePicker(false);
                        setSelectedDayForTimePicker(null);
                      }}
                    >
                      <Icon name="close" size={24} color={isDarkMode ? '#E5E7EB' : '#6B7280'} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timePickerContent}>
                    <Text
                      style={[styles.quickTimesLabel, isDarkMode && styles.quickTimesLabelDark]}
                    >
                      Select a Time
                    </Text>
                    <View style={styles.quickTimesGrid}>
                      {quickTimes.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[styles.quickTimeChip, isDarkMode && styles.quickTimeChipDark]}
                          onPress={() => {
                            if (selectedDayForTimePicker) {
                              toggleTime(selectedDayForTimePicker, time);
                              handleVibrate();
                              setShowCustomTimePicker(false);
                              setSelectedDayForTimePicker(null);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.quickTimeChipText,
                              isDarkMode && styles.quickTimeChipTextDark,
                            ]}
                          >
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.timePickerActions}>
                    <TouchableOpacity
                      style={styles.timePickerCancelButton}
                      onPress={() => {
                        handleVibrate();
                        setShowCustomTimePicker(false);
                        setSelectedDayForTimePicker(null);
                      }}
                    >
                      <Text style={styles.timePickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Success Modal */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, isDarkMode && styles.successModalDark]}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={60} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, isDarkMode && styles.successTitleDark]}>
              Success!
            </Text>
            <Text style={[styles.successMessage, isDarkMode && styles.successMessageDark]}>
              Your reminder has been created
            </Text>
            <View style={styles.triggerInfoContainer}>
              <Icon name="schedule" size={16} color="#667EEA" />
              <Text style={[styles.triggerInfo, isDarkMode && styles.triggerInfoDark]}>
                Next: {getNextTriggerTime()}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ringtone Selector Modal */}
      <RingtoneSelector
        visible={showRingtoneSelector}
        onClose={() => setShowRingtoneSelector(false)}
        selectedRingtone={reminderData.ringTone}
        onSelect={(ringtoneId) => {
          setReminderData({ ...reminderData, ringTone: ringtoneId });
          handleVibrate();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  checkButton: {
    padding: 8,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    width: '100%',
    alignSelf: 'center',
  },
  stepIndicatorContainerDark: {
    backgroundColor: '#2a2a2a',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#667EEA',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepTextActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#667EEA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#E5E7EB',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444444',
    color: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#E5E7EB',
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#667EEA',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  typeCardDark: {
    backgroundColor: '#2a2a2a',
  },
  typeCardActiveDark: {
    backgroundColor: '#3a4560',
    borderColor: '#667EEA',
  },
  // New compact weekly day selection styles
  weekDayChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  weekDayChip: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  weekDayChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#667EEA',
  },
  weekDayChipDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a4560',
  },
  weekDayChipSelectedDark: {
    backgroundColor: '#3a4560',
    borderColor: '#667EEA',
  },
  weekDayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekDayChipTextSelected: {
    color: '#667EEA',
    fontWeight: '700',
  },
  dayTimeCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#667EEA',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTimeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  selectedDaysContainer: {
    gap: 12,
  },
  dayTimeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayTimeCardDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a4560',
  },
  dayTimeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTimeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  dayTimeCardTitleDark: {
    color: '#E5E7EB',
  },
  addTimeIconButton: {
    padding: 4,
  },
  timeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChipCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  timeChipCompactText: {
    fontSize: 13,
    color: '#667EEA',
    fontWeight: '600',
  },
  noTimesText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  noTimesTextDark: {
    color: '#6B7280',
  },
  // Time picker modal styles
  timePickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '80%',
    position: 'absolute',
    bottom: 0,
  },
  timePickerModalDark: {
    backgroundColor: '#1a1a1a',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  timePickerTitleDark: {
    color: '#E5E7EB',
  },
  timePickerContent: {
    padding: 16,
  },
  quickTimesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  quickTimesLabelDark: {
    color: '#9CA3AF',
  },
  quickTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTimeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickTimeChipDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a4560',
  },
  quickTimeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickTimeChipTextDark: {
    color: '#9CA3AF',
  },
  timePickerActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timePickerCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  timePickerConfirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timePickerGradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  timePickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  timePickerConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  typeCardDark: {
    backgroundColor: '#2a2a2a',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  typeNameDark: {
    color: '#E5E7EB',
  },
  typeDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  typeDescDark: {
    color: '#9CA3AF',
  },
  configCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  configCardDark: {
    backgroundColor: '#2a2a2a',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  configTitleDark: {
    color: '#E5E7EB',
  },
  intervalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  intervalButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  intervalDisplay: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  intervalValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#667EEA',
  },
  intervalUnit: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  quickSelectButton: {
    width: '23%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    margin: '1%',
    alignItems: 'center',
  },
  quickSelectActive: {
    backgroundColor: '#667EEA',
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quickSelectTextActive: {
    color: 'white',
  },
  weekDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  weekDayButton: {
    width: `${100 / 7 - 2}%`,
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
  },
  weekDayActive: {
    backgroundColor: '#667EEA',
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  weekDayTextActive: {
    color: 'white',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  timeChip: {
    width: '31.33%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    margin: '1%',
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: '#10B981',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  timeChipTextActive: {
    color: 'white',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timePickerText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5B21B6',
    marginLeft: 12,
  },
  previewCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },
  previewLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dateButton: {
    width: `${100 / 7 - 2}%`,
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
  },
  dateButtonActive: {
    backgroundColor: '#F59E0B',
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  dateButtonTextActive: {
    color: 'white',
  },
  lastDayButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  lastDayButtonActive: {
    backgroundColor: '#F59E0B',
  },
  lastDayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  lastDayButtonTextActive: {
    color: 'white',
  },
  customCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 16,
  },
  customRow: {
    marginBottom: 16,
  },
  customLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#EF4444',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  toggleTextActive: {
    color: 'white',
  },
  yearInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  chipScroll: {
    marginBottom: 16,
    maxHeight: 50,
  },
  chip: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: 'white',
  },
  continueButton: {
    marginTop: 20,
  },
  createButton: {
    marginTop: 20,
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  intervalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonDark: {
    backgroundColor: '#2a2f4a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  ringtoneDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ringtoneValue: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },
  soundOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  soundChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  soundChipActive: {
    backgroundColor: '#667EEA',
  },
  soundChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  soundChipTextActive: {
    color: 'white',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityChipActive: {
    backgroundColor: '#667EEA',
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  priorityChipTextActive: {
    color: 'white',
  },
  summaryCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    textTransform: 'capitalize',
  },
  summaryCardDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  summaryTitleDark: {
    color: '#8B9EFF',
  },
  summaryLabelDark: {
    color: '#9CA3AF',
  },
  summaryValueDark: {
    color: '#8B9EFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width * 0.8,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  triggerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  triggerInfo: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    marginLeft: 6,
  },
  successModalDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  successTitleDark: {
    color: '#ffffff',
  },
  successMessageDark: {
    color: '#9CA3AF',
  },
  triggerInfoDark: {
    color: '#8B9EFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    // Reduced elevation and added overflow hidden to prevent artifacts
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardDark: {
    backgroundColor: '#2a2a2a',
  },
  categoryCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#667EEA',
    elevation: 3,
    shadowOpacity: 0.1,
  },
  categoryCardActiveDark: {
    backgroundColor: '#3a4560',
    borderColor: '#667EEA',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  categoryLabelDark: {
    color: '#E5E7EB',
  },
  categorySelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default CreateReminderScreen;
