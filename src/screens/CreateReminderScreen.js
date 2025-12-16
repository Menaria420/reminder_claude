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
  BackHandler,
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

const REMINDER_TYPES = [
  {
    id: 'daily',
    label: 'Daily',
    icon: 'access-time',
    color: ['#3B82F6', '#2563EB'],
    description: 'Daily reminders with interval or exact time',
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

const CreateReminderScreen = ({ navigation, route }) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const editMode = route?.params?.editMode || false;
  const existingReminder = route?.params?.reminder || null;

  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date'); // 'date' or 'time'
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRingtoneSelector, setShowRingtoneSelector] = useState(false);
  const [selectedDayForTimePicker, setSelectedDayForTimePicker] = useState(null);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState(new Date());
  const [fieldErrors, setFieldErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const getInitialState = () => {
    if (editMode && existingReminder) {
      return {
        ...existingReminder,
        // Ensure dates are Date objects
        dailyStartTime:
          existingReminder.dailyStartTime || existingReminder.hourlyStartTime
            ? new Date(existingReminder.dailyStartTime || existingReminder.hourlyStartTime)
            : new Date(),
        dailyInterval: existingReminder.dailyInterval || existingReminder.hourlyInterval || 1,
        dailyMode: existingReminder.dailyMode || 'interval',
        dailyExactDateTime: existingReminder.dailyExactDateTime
          ? new Date(existingReminder.dailyExactDateTime)
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
      };
    }
    return {
      category: 'general',
      categoryTag: '', // Step 4 category (Personal, Work, Health, Family)
      title: '',
      description: '',
      medicineName: '',
      dosage: '',
      exerciseName: '',
      duration: '',
      type: REMINDER_TYPES[0].id,
      dailyInterval: 1,
      dailyStartTime: new Date(),
      dailyMode: 'interval', // 'interval' or 'exact'
      dailyExactDateTime: new Date(),
      dailyExactTimes: [], // Array of times for exact mode
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
    };
  };

  const [reminderData, setReminderData] = useState(getInitialState);

  const reminderTypes = REMINDER_TYPES;

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

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
        handleVibrate();
        return true; // Prevent default behavior (exit screen)
      }
      return false; // Allow default behavior (exit screen)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [currentStep]);

  const handleVibrate = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getNextTriggerTime = () => {
    try {
      const now = new Date();

      if (reminderData.type === 'daily') {
        if (reminderData.dailyMode === 'exact') {
          if (reminderData.dailyExactTimes && reminderData.dailyExactTimes.length > 0) {
            // Return just the count or one examples
            return `Frequency: ${reminderData.dailyExactTimes.length} times`;
          }
          return 'No times set';
        }
        const startTime = new Date(reminderData.dailyStartTime);
        let next = new Date(startTime);
        // Fast forward if in past
        if (next < now) {
          const intervalMs = (reminderData.dailyInterval || 1) * 60 * 60 * 1000;
          const diff = now.getTime() - next.getTime();
          const periods = Math.floor(diff / intervalMs) + 1;
          next = new Date(next.getTime() + periods * intervalMs);
        }
        return next.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      if (reminderData.type === 'weekly' && reminderData.weeklyDays.length > 0) {
        const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        let candidates = [];

        reminderData.weeklyDays.forEach((day) => {
          const times = reminderData.weeklyTimes[day] || [];
          times.forEach((timeStr) => {
            const [hStr, mPart] = timeStr.split(':');
            const [mStr, period] = mPart.split(' ');
            let h = parseInt(hStr);
            if (period === 'PM' && h !== 12) h += 12;
            if (period === 'AM' && h === 12) h = 0;
            const m = parseInt(mStr);

            const targetDay = dayMap[day];
            let date = new Date(now);
            let diff = targetDay - date.getDay();

            // Calculate date for this candidate
            // If strictly in allowed future (or later today)
            if (diff < 0) diff += 7;

            // Same day check
            if (diff === 0) {
              if (date.getHours() > h || (date.getHours() === h && date.getMinutes() >= m)) {
                diff = 7; // Move to next week
              }
            }

            date.setDate(date.getDate() + diff);
            date.setHours(h, m, 0, 0);
            candidates.push(date);
          });
        });

        if (candidates.length > 0) {
          candidates.sort((a, b) => a - b);
          return candidates[0].toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
        return 'Weekly';
      }

      if (reminderData.type === '15days') {
        let start = new Date(reminderData.fifteenDaysStart || new Date());
        const intervalMs = 15 * 24 * 60 * 60 * 1000;
        while (start < now) {
          start = new Date(start.getTime() + intervalMs);
        }
        return start.toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }

      if (reminderData.type === 'monthly') {
        const date = reminderData.monthlyDate;
        if (date === 'last') return 'End of each month';
        return `${date}${getDaySuffix(date)} of each month`;
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
    } catch (e) {
      console.error(e);
      return 'Soon';
    }
  };

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
  };

  const handleSelectType = (type) => {
    handleVibrate();
    setReminderData({ ...reminderData, type });
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
    const errors = {};

    // Step 1: Category + Form validation
    if (currentStep === 1) {
      if (!reminderData.category) {
        errors.category = 'Please select a category';
      }

      const { category } = reminderData;
      if (category === 'medication') {
        if (!reminderData.medicineName.trim()) {
          errors.medicineName = 'Medicine name is required';
        }
        if (!reminderData.type) {
          errors.type = 'Please select frequency';
        }
      } else if (category === 'fitness') {
        if (!reminderData.exerciseName.trim()) {
          errors.exerciseName = 'Exercise name is required';
        }
        if (!reminderData.type) {
          errors.type = 'Please select frequency';
        }
      } else if (category === 'general') {
        if (!reminderData.title.trim()) {
          errors.title = 'Title is required';
        }
        if (!reminderData.type) {
          errors.type = 'Please select reminder type';
        }
      }
    }

    // Step 2: Time Configuration validation
    if (currentStep === 2) {
      if (reminderData.type === 'weekly') {
        if (reminderData.weeklyDays.length === 0) {
          errors.weeklyDays = 'Please select at least one day';
        }

        // Check if any selected day has no times
        const hasEmptyDay = reminderData.weeklyDays.some(
          (day) => !reminderData.weeklyTimes[day] || reminderData.weeklyTimes[day].length === 0
        );

        if (hasEmptyDay) {
          errors.weeklyTimes = 'Please add at least one time for each selected day';
        }
      }

      // Validate custom reminder has all required settings
      if (reminderData.type === 'custom') {
        const { customSettings } = reminderData;
        if (!customSettings || !customSettings.time) {
          errors.customSettings = 'Please set a time for your custom reminder';
        }
      }

      // Final check: ensure title is never empty for any reminder type
      if (!reminderData.title || !reminderData.title.trim()) {
        errors.title = 'Please enter a title for your reminder';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      handleVibrate();
      if (currentStep < 2) {
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

      // Save to AsyncStorage
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));

      // Create notification if notification system is enabled
      try {
        const NotificationManager = require('../utils/NotificationManager').default;
        const NotificationService = require('../utils/NotificationService').default;

        // Calculate trigger time based on reminder type
        let triggerTime = new Date();

        if (reminderData.type === 'daily') {
          if (reminderData.dailyMode === 'exact') {
            triggerTime = new Date(reminderData.dailyExactDateTime);
          } else {
            // Use the dailyStartTime the user selected
            triggerTime = new Date(reminderData.dailyStartTime);
            // If start time is in the past, add interval to get next trigger
            while (triggerTime < new Date()) {
              triggerTime.setHours(triggerTime.getHours() + (reminderData.dailyInterval || 1));
            }
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
          triggerTime = new Date(reminderData.fifteenDaysTime);

          // Set date to start date
          const startDate = new Date(reminderData.fifteenDaysStart);
          if (!isNaN(startDate.getTime())) {
            triggerTime.setFullYear(startDate.getFullYear());
            triggerTime.setMonth(startDate.getMonth());
            triggerTime.setDate(startDate.getDate());
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
          triggerTime.setDate(triggerTime.getDate() + 1);
        }

        // Create notification record
        await NotificationManager.createNotification(updatedReminder, triggerTime);

        // Schedule the notification
        await NotificationService.scheduleReminder(updatedReminder);
      } catch (notifError) {
        // Continue even if notification fails
      }

      setLoading(false);
      setShowSuccess(true);

      // Navigate back after showing success
      setTimeout(() => {
        setShowSuccess(false);
        // Reset state for next use
        setReminderData(getInitialState());
        setCurrentStep(1);
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
      {[1, 2].map((step) => (
        <View key={step} style={styles.stepWrapper}>
          <TouchableOpacity
            style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}
            onPress={() => {
              if (step === 1 || (step === 2 && reminderData.category && reminderData.type)) {
                setCurrentStep(step);
                handleVibrate();
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepText, currentStep >= step && styles.stepTextActive]}>
              {step}
            </Text>
          </TouchableOpacity>
          {step < 2 && (
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
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
          Select Category
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isSelected = reminderData.category === cat.id;

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
                  <Icon name={cat.icon} size={20} color="white" />
                </LinearGradient>
                <Text style={[styles.categoryLabel, isDarkMode && styles.categoryLabelDark]}>
                  {cat.label}
                </Text>
                {isSelected && (
                  <View style={styles.categorySelectedBadge}>
                    <Icon name="check-circle" size={16} color="#10B981" />
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
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginTop: 16 }}
    >
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>
          Medicine Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            isDarkMode && styles.inputDark,
            fieldErrors.medicineName && styles.inputError,
          ]}
          value={reminderData.medicineName}
          onChangeText={(text) => {
            setReminderData({ ...reminderData, medicineName: text, title: text });
            if (fieldErrors.medicineName) {
              setFieldErrors({ ...fieldErrors, medicineName: null });
            }
          }}
          placeholder="e.g., Aspirin, Vitamin D"
          placeholderTextColor="#9CA3AF"
        />
        {fieldErrors.medicineName && (
          <Text style={styles.errorText}>{fieldErrors.medicineName}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Dosage</Text>
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
      <View style={styles.typeGrid}>
        {reminderTypes
          .filter((type) => ['daily', 'weekly', 'custom'].includes(type.id))
          .map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                isDarkMode && styles.typeCardDark,
                reminderData.type === type.id && styles.typeCardActive,
                reminderData.type === type.id && isDarkMode && styles.typeCardActiveDark,
              ]}
              onPress={() => setReminderData({ ...reminderData, type: type.id })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  reminderData.type === type.id
                    ? type.color
                    : [type.color[0] + '15', type.color[0] + '15']
                }
                style={styles.typeGradient}
              >
                <Icon
                  name={type.icon}
                  size={22}
                  color={reminderData.type === type.id ? '#FFFFFF' : type.color[0]}
                />
              </LinearGradient>
              <Text
                style={[
                  styles.typeName,
                  isDarkMode && styles.typeNameDark,
                  reminderData.type === type.id && styles.typeNameActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFitnessForm = () => (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginTop: 16 }}
    >
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>
          Exercise Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            isDarkMode && styles.inputDark,
            fieldErrors.exerciseName && styles.inputError,
          ]}
          value={reminderData.exerciseName}
          onChangeText={(text) => {
            setReminderData({ ...reminderData, exerciseName: text, title: text });
            if (fieldErrors.exerciseName) {
              setFieldErrors({ ...fieldErrors, exerciseName: null });
            }
          }}
          placeholder="e.g., Morning Run, Yoga"
          placeholderTextColor="#9CA3AF"
        />
        {fieldErrors.exerciseName && (
          <Text style={styles.errorText}>{fieldErrors.exerciseName}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Duration</Text>
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
      <View style={styles.typeGrid}>
        {reminderTypes
          .filter((type) => ['daily', 'custom'].includes(type.id))
          .map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                isDarkMode && styles.typeCardDark,
                reminderData.type === type.id && styles.typeCardActive,
                reminderData.type === type.id && isDarkMode && styles.typeCardActiveDark,
              ]}
              onPress={() => setReminderData({ ...reminderData, type: type.id })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  reminderData.type === type.id
                    ? type.color
                    : [type.color[0] + '15', type.color[0] + '15']
                }
                style={styles.typeGradient}
              >
                <Icon
                  name={type.icon}
                  size={22}
                  color={reminderData.type === type.id ? '#FFFFFF' : type.color[0]}
                />
              </LinearGradient>
              <Text
                style={[
                  styles.typeName,
                  isDarkMode && styles.typeNameDark,
                  reminderData.type === type.id && styles.typeNameActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderGeneralForm = () => (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginTop: 16 }}
    >
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>
          Reminder Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            isDarkMode && styles.inputDark,
            fieldErrors.title && styles.inputError,
          ]}
          value={reminderData.title}
          onChangeText={(text) => {
            setReminderData({ ...reminderData, title: text });
            if (fieldErrors.title) {
              setFieldErrors({ ...fieldErrors, title: null });
            }
          }}
          placeholder="e.g., Team meeting"
          placeholderTextColor="#9CA3AF"
        />
        {fieldErrors.title && <Text style={styles.errorText}>{fieldErrors.title}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Description</Text>
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
      <View style={styles.typeGrid}>
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
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                reminderData.type === type.id
                  ? type.color
                  : [type.color[0] + '15', type.color[0] + '15']
              }
              style={styles.typeGradient}
            >
              <Icon
                name={type.icon}
                size={22}
                color={reminderData.type === type.id ? '#FFFFFF' : type.color[0]}
              />
            </LinearGradient>
            <Text
              style={[
                styles.typeName,
                isDarkMode && styles.typeNameDark,
                reminderData.type === type.id && styles.typeNameActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
          <Text style={styles.continueButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStepContent = () => {
    if (currentStep === 1) {
      // Step 1: Category + Form
      const { category } = reminderData;
      return (
        <>
          {renderCategorySelection()}
          {category === 'medication' && renderMedicationForm()}
          {category === 'fitness' && renderFitnessForm()}
          {category === 'general' && renderGeneralForm()}
        </>
      );
    }
    if (currentStep === 2) {
      // Step 2: Time Configuration + Options
      return (
        <>
          {renderStep2()}
          {renderStep3()}
        </>
      );
    }
    return null;
  };

  const renderStep2 = () => {
    const { type } = reminderData;

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Daily Configuration */}
        {type === 'daily' && (
          <>
            {/* Mode Selection */}
            <View style={[styles.configCard, isDarkMode && styles.configCardDark]}>
              <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
                Daily Reminder Mode
              </Text>
              <View style={styles.modeTabContainer}>
                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    reminderData.dailyMode === 'interval' && styles.modeTabActive,
                  ]}
                  onPress={() => {
                    handleVibrate();
                    setReminderData({ ...reminderData, dailyMode: 'interval' });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modeTabIconContainer}>
                    <Icon
                      name="loop"
                      size={22}
                      color={reminderData.dailyMode === 'interval' ? '#FFFFFF' : '#667EEA'}
                    />
                  </View>
                  <View style={styles.modeTabContent}>
                    <Text
                      style={[
                        styles.modeTabText,
                        reminderData.dailyMode === 'interval' && styles.modeTabTextActive,
                      ]}
                    >
                      Interval
                    </Text>
                    <Text
                      style={[
                        styles.modeTabDesc,
                        reminderData.dailyMode === 'interval' && styles.modeTabDescActive,
                      ]}
                    >
                      Every X hours
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeTab,
                    reminderData.dailyMode === 'exact' && styles.modeTabActive,
                  ]}
                  onPress={() => {
                    handleVibrate();
                    setReminderData({ ...reminderData, dailyMode: 'exact' });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modeTabIconContainer}>
                    <Icon
                      name="schedule"
                      size={22}
                      color={reminderData.dailyMode === 'exact' ? '#FFFFFF' : '#667EEA'}
                    />
                  </View>
                  <View style={styles.modeTabContent}>
                    <Text
                      style={[
                        styles.modeTabText,
                        reminderData.dailyMode === 'exact' && styles.modeTabTextActive,
                      ]}
                    >
                      Exact Times
                    </Text>
                    <Text
                      style={[
                        styles.modeTabDesc,
                        reminderData.dailyMode === 'exact' && styles.modeTabDescActive,
                      ]}
                    >
                      Multiple times
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Interval Mode Configuration */}
            {reminderData.dailyMode === 'interval' && (
              <>
                <View style={[styles.configCard, isDarkMode && styles.configCardDark]}>
                  <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
                    Set Interval
                  </Text>
                  <View style={styles.intervalSelector}>
                    <TouchableOpacity
                      style={[styles.intervalButton, isDarkMode && styles.intervalButtonDark]}
                      onPress={() => {
                        handleVibrate();
                        setReminderData({
                          ...reminderData,
                          dailyInterval: Math.max(1, reminderData.dailyInterval - 1),
                        });
                      }}
                    >
                      <Text style={styles.intervalButtonText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.intervalDisplay}>
                      <Text style={styles.intervalValue}>{reminderData.dailyInterval}</Text>
                      <Text style={styles.intervalUnit}>
                        {reminderData.dailyInterval === 1 ? 'hour' : 'hours'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.intervalButton, isDarkMode && styles.intervalButtonDark]}
                      onPress={() => {
                        handleVibrate();
                        setReminderData({
                          ...reminderData,
                          dailyInterval: Math.min(24, reminderData.dailyInterval + 1),
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
                          reminderData.dailyInterval === hours && styles.quickSelectActive,
                        ]}
                        onPress={() => {
                          handleVibrate();
                          setReminderData({ ...reminderData, dailyInterval: hours });
                        }}
                      >
                        <Text
                          style={[
                            styles.quickSelectText,
                            reminderData.dailyInterval === hours && styles.quickSelectTextActive,
                          ]}
                        >
                          {hours}h
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.configCard, isDarkMode && styles.configCardDark]}>
                  <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
                    Start Time
                  </Text>
                  <TouchableOpacity
                    style={[styles.timeInput, isDarkMode && styles.timeInputDark]}
                    onPress={() => {
                      handleVibrate();
                      setShowTimePicker(true);
                    }}
                  >
                    <View style={styles.timeInputContent}>
                      <Icon name="access-time" size={24} color="#667EEA" />
                      <Text style={[styles.timeInputText, isDarkMode && styles.timeInputTextDark]}>
                        {reminderData.dailyStartTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Exact Mode Configuration */}
            {reminderData.dailyMode === 'exact' && (
              <View style={[styles.configCard, isDarkMode && styles.configCardDark]}>
                <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
                  Select Times
                </Text>

                {/* Display selected times */}
                {reminderData.dailyExactTimes.length > 0 && (
                  <View style={styles.selectedTimesContainer}>
                    {reminderData.dailyExactTimes.map((time, index) => (
                      <View key={index} style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{time}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            handleVibrate();
                            const newTimes = reminderData.dailyExactTimes.filter(
                              (_, i) => i !== index
                            );
                            setReminderData({ ...reminderData, dailyExactTimes: newTimes });
                          }}
                        >
                          <Icon name="close" size={16} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add time button */}
                <TouchableOpacity
                  style={[styles.addTimeButton, isDarkMode && styles.addTimeButtonDark]}
                  onPress={() => {
                    handleVibrate();
                    setShowTimePicker(true);
                  }}
                >
                  <Icon name="add" size={20} color="#667EEA" />
                  <Text style={styles.addTimeButtonText}>
                    {reminderData.dailyExactTimes.length === 0 ? 'Add Time' : 'Add Another Time'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
            <View style={[styles.customCard, isDarkMode && styles.configCardDark]}>
              <Text style={[styles.customTitle, isDarkMode && styles.configTitleDark]}>
                Custom Schedule
              </Text>

              {/* Year Selection */}
              <View style={styles.customSection}>
                <View style={styles.customSectionHeader}>
                  <Text
                    style={[styles.customSectionLabel, isDarkMode && styles.customSectionLabelDark]}
                  >
                    Year
                  </Text>
                  <View
                    style={[styles.segmentContainer, isDarkMode && styles.segmentContainerDark]}
                  >
                    {['Specific', 'Every Year'].map((option) => {
                      const value = option === 'Specific' ? 'specific' : 'every';
                      const isActive = reminderData.customSettings.yearRepeat === value;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.segmentButton,
                            isActive &&
                              (isDarkMode
                                ? styles.segmentButtonActiveDark
                                : styles.segmentButtonActive),
                          ]}
                          onPress={() => {
                            handleVibrate();
                            setReminderData({
                              ...reminderData,
                              customSettings: { ...reminderData.customSettings, yearRepeat: value },
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              isDarkMode && styles.segmentTextDark,
                              isActive && styles.segmentTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {reminderData.customSettings.yearRepeat === 'specific' && (
                  <TextInput
                    style={[styles.input, isDarkMode && styles.inputDark, { marginTop: 8 }]}
                    value={String(reminderData.customSettings.year)}
                    onChangeText={(text) => {
                      const year = parseInt(text) || new Date().getFullYear();
                      setReminderData({
                        ...reminderData,
                        customSettings: { ...reminderData.customSettings, year },
                      });
                    }}
                    keyboardType="numeric"
                    placeholder="YYYY"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                    maxLength={4}
                  />
                )}
              </View>

              {/* Month Selection */}
              <View style={styles.customSection}>
                <View style={styles.customSectionHeader}>
                  <Text
                    style={[styles.customSectionLabel, isDarkMode && styles.customSectionLabelDark]}
                  >
                    Month
                  </Text>
                  <View
                    style={[styles.segmentContainer, isDarkMode && styles.segmentContainerDark]}
                  >
                    {['Specific', 'Every Month'].map((option) => {
                      const value = option === 'Specific' ? 'specific' : 'every';
                      const isActive = reminderData.customSettings.monthRepeat === value;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.segmentButton,
                            isActive &&
                              (isDarkMode
                                ? styles.segmentButtonActiveDark
                                : styles.segmentButtonActive),
                          ]}
                          onPress={() => {
                            handleVibrate();
                            setReminderData({
                              ...reminderData,
                              customSettings: {
                                ...reminderData.customSettings,
                                monthRepeat: value,
                              },
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              isDarkMode && styles.segmentTextDark,
                              isActive && styles.segmentTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {reminderData.customSettings.monthRepeat === 'specific' && (
                  <View style={styles.monthGrid}>
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
                    ].map((month, index) => {
                      const isActive = reminderData.customSettings.month === index + 1;
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.monthButton,
                            isDarkMode && styles.monthButtonDark,
                            isActive &&
                              (isDarkMode
                                ? styles.monthButtonActiveDark
                                : styles.monthButtonActive),
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
                              styles.monthButtonText,
                              isDarkMode && styles.monthButtonTextDark,
                              isActive && styles.monthButtonTextActive,
                            ]}
                          >
                            {month}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Date Selection */}
              <View style={styles.customSection}>
                <View style={styles.customSectionHeader}>
                  <Text
                    style={[styles.customSectionLabel, isDarkMode && styles.customSectionLabelDark]}
                  >
                    Date
                  </Text>
                  <View
                    style={[styles.segmentContainer, isDarkMode && styles.segmentContainerDark]}
                  >
                    {['Specific', 'Every Day'].map((option) => {
                      const value = option === 'Specific' ? 'specific' : 'every';
                      const isActive = reminderData.customSettings.dateRepeat === value;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.segmentButton,
                            isActive &&
                              (isDarkMode
                                ? styles.segmentButtonActiveDark
                                : styles.segmentButtonActive),
                          ]}
                          onPress={() => {
                            handleVibrate();
                            setReminderData({
                              ...reminderData,
                              customSettings: { ...reminderData.customSettings, dateRepeat: value },
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.segmentText,
                              isDarkMode && styles.segmentTextDark,
                              isActive && styles.segmentTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {reminderData.customSettings.dateRepeat === 'specific' && (
                  <View style={styles.monthGrid}>
                    {[...Array(31)].map((_, i) => {
                      const date = i + 1;
                      const isActive = reminderData.customSettings.date === date;
                      return (
                        <TouchableOpacity
                          key={date}
                          style={[
                            styles.dateButton, // Reusing dateButton style from Monthly view
                            { width: '12.28%', margin: '1%' }, // Override width for 7 columns
                            isDarkMode && styles.dateButtonDark, // Need to ensure this style exists or use generic
                            isActive && styles.customDateButtonActive,
                          ]}
                          onPress={() => {
                            handleVibrate();
                            setReminderData({
                              ...reminderData,
                              customSettings: { ...reminderData.customSettings, date: date },
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.dateButtonText,
                              isActive && styles.customDateButtonTextActive,
                            ]}
                          >
                            {date}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Time Selection */}
              <View style={[styles.customSection, { marginBottom: 0 }]}>
                <Text
                  style={[
                    styles.customSectionLabel,
                    isDarkMode && styles.customSectionLabelDark,
                    { marginBottom: 12 },
                  ]}
                >
                  Time
                </Text>
                <TouchableOpacity
                  style={[styles.largeTimeButton, isDarkMode && styles.largeTimeButtonDark]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.largeTimeText}>
                    {reminderData.customSettings.time
                      ? new Date(reminderData.customSettings.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Select Time'}
                  </Text>
                  <Text
                    style={{
                      color: isDarkMode ? '#9CA3AF' : '#6B7280',
                      marginTop: 4,
                      fontSize: 12,
                    }}
                  >
                    Tap to change
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
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
          {/* Navigation Button */}
          <TouchableOpacity
            onPress={currentStep === 2 ? handleCreateReminder : handleNext}
            style={styles.checkButton}
          >
            <Icon name={currentStep === 2 ? 'check' : 'arrow-forward'} size={24} color="white" />
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
            reminderData.type === 'daily'
              ? reminderData.dailyStartTime
              : reminderData.type === '15days'
              ? reminderData.fifteenDaysTime
              : reminderData.monthlyTime
          }
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              if (reminderData.type === 'daily') {
                // Check if in exact mode - add to times array
                if (reminderData.dailyMode === 'exact') {
                  const timeString = selectedTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  // Only add if not already in list
                  if (!reminderData.dailyExactTimes.includes(timeString)) {
                    setReminderData({
                      ...reminderData,
                      dailyExactTimes: [...reminderData.dailyExactTimes, timeString].sort(),
                    });
                  }
                } else {
                  // Interval mode - update start time
                  setReminderData({ ...reminderData, dailyStartTime: selectedTime });
                }
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

      {/* Date Time Picker for Daily Exact Mode */}
      {showDateTimePicker && (
        <DateTimePicker
          value={reminderData.dailyExactDateTime}
          mode={dateTimePickerMode}
          display="default"
          onChange={(event, selectedDateTime) => {
            if (dateTimePickerMode === 'date') {
              // After selecting date, show time picker
              setDateTimePickerMode('time');
              if (selectedDateTime) {
                const newDateTime = new Date(reminderData.dailyExactDateTime);
                newDateTime.setFullYear(selectedDateTime.getFullYear());
                newDateTime.setMonth(selectedDateTime.getMonth());
                newDateTime.setDate(selectedDateTime.getDate());
                setReminderData({ ...reminderData, dailyExactDateTime: newDateTime });
              }
            } else {
              // After selecting time, close picker and reset mode
              setShowDateTimePicker(false);
              setDateTimePickerMode('date');
              if (selectedDateTime) {
                const newDateTime = new Date(reminderData.dailyExactDateTime);
                newDateTime.setHours(selectedDateTime.getHours());
                newDateTime.setMinutes(selectedDateTime.getMinutes());
                setReminderData({ ...reminderData, dailyExactDateTime: newDateTime });
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
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  checkButton: {
    padding: 6,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
    width: 60,
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
    padding: 14,
    paddingBottom: 24,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labelDark: {
    color: '#E5E7EB',
  },
  required: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444444',
    color: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleDark: {
    color: '#E5E7EB',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  typeCard: {
    width: '31.5%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#667EEA',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  typeCardDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
  },
  typeCardActiveDark: {
    backgroundColor: '#3a4560',
    borderColor: '#667EEA',
  },
  // New compact weekly day selection styles
  weekDayChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  weekDayChip: {
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekDayChipTextSelected: {
    color: '#667EEA',
    fontWeight: '700',
  },
  dayTimeCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#667EEA',
    borderRadius: 9,
    width: 18,
    height: 18,
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
  typeGradient: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  typeNameActive: {
    color: '#667EEA',
  },
  typeNameDark: {
    color: '#E5E7EB',
  },
  typeDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  typeDescDark: {
    color: '#9CA3AF',
  },
  configCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  configCardDark: {
    backgroundColor: '#2a2a2a',
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  configTitleDark: {
    color: '#E5E7EB',
  },
  intervalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  intervalButton: {
    width: 36,
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  intervalDisplay: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  intervalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#667EEA',
  },
  intervalUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -2,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickSelectButton: {
    width: '23%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickSelectActive: {
    backgroundColor: '#667EEA',
  },
  quickSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  quickSelectTextActive: {
    color: 'white',
  },
  modeTabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modeTabActive: {
    backgroundColor: '#667EEA',
    borderColor: '#667EEA',
    elevation: 3,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modeTabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modeTabContent: {
    flex: 1,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeTabDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  modeTabDescActive: {
    color: '#E0E7FF',
  },
  selectedTimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667EEA',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#667EEA',
    borderStyle: 'dashed',
    gap: 6,
  },
  addTimeButtonDark: {
    backgroundColor: '#3a3a3a',
  },
  addTimeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
  },
  timeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  timeInputDark: {
    backgroundColor: '#3a3a3a',
    borderColor: '#4a4a4a',
  },
  timeInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeInputText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timeInputTextDark: {
    color: '#E5E7EB',
  },
  timeInputTextSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  dateTimeDisplay: {
    flex: 1,
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
    padding: 16, // Reduced from 20
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#667EEA',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: 'white',
  },
  // New Custom UI Styles
  customSection: {
    marginBottom: 16, // Reduced from 24
  },
  customSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customSectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  customSectionLabelDark: {
    color: '#E5E7EB',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  segmentContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#667EEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  segmentButtonActiveDark: {
    backgroundColor: '#3a4560',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: 'white',
  },
  segmentTextDark: {
    color: '#9CA3AF',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  monthButton: {
    width: '31.33%',
    margin: '1%',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a4560',
  },
  monthButtonActive: {
    backgroundColor: '#667EEA',
    borderColor: '#667EEA',
  },
  monthButtonActiveDark: {
    backgroundColor: '#3a4560',
    borderColor: '#667EEA',
  },
  monthButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthButtonTextDark: {
    color: '#9CA3AF',
  },
  monthButtonTextActive: {
    color: 'white',
  },
  largeTimeButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  largeTimeButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a4560',
  },
  largeTimeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#667EEA',
  },
  customDateButtonActive: {
    backgroundColor: '#667EEA',
  },
  customDateButtonTextActive: {
    color: 'white',
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
    marginTop: 12,
  },
  createButton: {
    marginTop: 12,
  },
  gradientButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  intervalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
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
    gap: 8,
  },
  categoryCard: {
    width: '31.5%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 0,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
    borderWidth: 1.5,
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
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
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
