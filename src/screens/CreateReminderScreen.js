import React, { useState, useRef } from 'react';
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

const CreateReminderScreen = ({ navigation }) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRingtoneSelector, setShowRingtoneSelector] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [reminderData, setReminderData] = useState({
    category: '',
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
    weeklyTimes: [],
    timeMethod: 'specific',
    fifteenDaysStart: new Date(),
    fifteenDaysTime: new Date(),
    monthlyDate: 1,
    monthlyTime: new Date(),
    dateRepeat: 'specific',
    notificationSound: 'default',
    ringTone: 'default',
    priority: 'normal',
    goal: '',
  });

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

      if (reminderData.type === 'weekly' && reminderData.weeklyTimes.length > 0) {
        const firstTime = reminderData.weeklyTimes[0];
        const [time, period] = firstTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;

        return `${reminderData.weeklyDays[0] || 'Day'} at ${firstTime}`;
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

      return 'Soon';
    } catch (error) {
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
    setCurrentStep(2);
  };

  const handleSelectType = (type) => {
    handleVibrate();
    setReminderData({ ...reminderData, type });
    // If we are in a specific flow that needs type selection, move to next step
    // Otherwise, this might be part of the form
    if (currentStep === 2 && reminderData.category === 'others') {
      setCurrentStep(3);
    }
  };

  const toggleWeekday = (day) => {
    handleVibrate();
    const updatedDays = reminderData.weeklyDays.includes(day)
      ? reminderData.weeklyDays.filter((d) => d !== day)
      : [...reminderData.weeklyDays, day];
    setReminderData({ ...reminderData, weeklyDays: updatedDays });
  };

  const toggleTime = (time) => {
    handleVibrate();
    const updatedTimes = reminderData.weeklyTimes.includes(time)
      ? reminderData.weeklyTimes.filter((t) => t !== time)
      : [...reminderData.weeklyTimes, time];
    setReminderData({ ...reminderData, weeklyTimes: updatedTimes });
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
      } else if (category === 'habits') {
        if (!reminderData.habitName.trim()) {
          Alert.alert('Required Field', 'Please enter habit name');
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

    if (currentStep === 2) {
      if (reminderData.type === 'weekly' && reminderData.weeklyDays.length === 0) {
        Alert.alert('Required Field', 'Please select at least one day');
        return false;
      }
      if (
        reminderData.type === 'weekly' &&
        reminderData.timeMethod === 'specific' &&
        reminderData.weeklyTimes.length === 0
      ) {
        Alert.alert('Required Field', 'Please select at least one time');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      handleVibrate();
      if (currentStep < 3) {
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
      // Create reminder object with unique ID and timestamp
      const newReminder = {
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...reminderData,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      // Get existing reminders from AsyncStorage
      const existingReminders = await AsyncStorage.getItem('reminders');
      const reminders = existingReminders ? JSON.parse(existingReminders) : [];

      // Add new reminder
      reminders.push(newReminder);

      // Save to AsyncStorage
      await AsyncStorage.setItem('reminders', JSON.stringify(reminders));

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
        } else if (reminderData.type === 'weekly' && reminderData.weeklyTimes.length > 0) {
          // Parse string time like "6:00 AM" to proper time
          const firstTime = reminderData.weeklyTimes[0];
          const [time, period] = firstTime.split(' ');
          const [hours, minutes] = time.split(':').map(Number);

          // Convert to 24-hour format
          let hour24 = hours;
          if (period === 'PM' && hours !== 12) hour24 += 12;
          if (period === 'AM' && hours === 12) hour24 = 0;

          triggerTime.setHours(hour24, minutes, 0, 0);

          // If time is in the past today, move to next occurrence
          if (triggerTime < new Date()) {
            triggerTime.setDate(triggerTime.getDate() + 1);
          }
        } else if (reminderData.type === '15days') {
          triggerTime = new Date(reminderData.fifteenDaysTime);
          // Set date to start date
          triggerTime.setFullYear(reminderData.fifteenDaysStart.getFullYear());
          triggerTime.setMonth(reminderData.fifteenDaysStart.getMonth());
          triggerTime.setDate(reminderData.fifteenDaysStart.getDate());
        } else if (reminderData.type === 'monthly') {
          triggerTime = new Date(reminderData.monthlyTime);
          triggerTime.setDate(reminderData.monthlyDate);
        } else {
          // Default to 1 hour from now
          triggerTime.setHours(triggerTime.getHours() + 1);
        }

        // Create notification record
        await NotificationManager.createNotification(newReminder, triggerTime);

        // Schedule the notification
        await NotificationService.scheduleNotification(newReminder, triggerTime);
      } catch (notifError) {
        console.log('Notification setup skipped:', notifError.message);
        // Continue even if notification fails
      }

      setLoading(false);
      setShowSuccess(true);

      // Navigate back after showing success
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('Home', { refresh: true });
      }, 2500);
    } catch (error) {
      console.error('Error creating reminder:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicatorContainer, isDarkMode && styles.stepIndicatorContainerDark]}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepWrapper}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepText, currentStep >= step && styles.stepTextActive]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
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

  const renderCategorySelection = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
        What do you want to be reminded about?
      </Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryCard, isDarkMode && styles.categoryCardDark]}
            onPress={() => handleSelectCategory(cat)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={cat.color} style={styles.categoryIcon}>
              <Icon name={cat.icon} size={28} color="white" />
            </LinearGradient>
            <Text style={[styles.categoryLabel, isDarkMode && styles.categoryLabelDark]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

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
      {reminderTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[styles.typeCard, isDarkMode && styles.typeCardDark]}
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
          <Icon name="chevron-right" size={24} color="#9CA3AF" />
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
            <View style={styles.weekDayGrid}>
              {weekDays.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.weekDayButton,
                    reminderData.weeklyDays.includes(day) && styles.weekDayActive,
                  ]}
                  onPress={() => toggleWeekday(day)}
                >
                  <Text
                    style={[
                      styles.weekDayText,
                      reminderData.weeklyDays.includes(day) && styles.weekDayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.configTitle, isDarkMode && styles.configTitleDark]}>
              Select Times
            </Text>
            <View style={styles.timeGrid}>
              {quickTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeChip,
                    reminderData.weeklyTimes.includes(time) && styles.timeChipActive,
                  ]}
                  onPress={() => toggleTime(time)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      reminderData.weeklyTimes.includes(time) && styles.timeChipTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
                />
              )}

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

              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Icon name="access-time" size={20} color="#667EEA" />
                <Text style={styles.timePickerText}>Set Time</Text>
              </TouchableOpacity>
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
            {['Personal', 'Work', 'Health', 'Family'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  reminderData.category === category.toLowerCase() && styles.categoryChipActive,
                ]}
                onPress={() => {
                  handleVibrate();
                  setReminderData({ ...reminderData, category: category.toLowerCase() });
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    reminderData.category === category.toLowerCase() &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {category}
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
            <Text style={styles.createButtonText}>Create Reminder</Text>
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
          <Text style={styles.headerTitle}>Create Reminder</Text>
          <TouchableOpacity
            onPress={currentStep === 3 ? handleCreateReminder : handleNext}
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
            setShowTimePicker(false);
            if (selectedTime) {
              if (reminderData.type === 'hourly') {
                setReminderData({ ...reminderData, hourlyStartTime: selectedTime });
              } else if (reminderData.type === '15days') {
                setReminderData({ ...reminderData, fifteenDaysTime: selectedTime });
              } else if (reminderData.type === 'monthly') {
                setReminderData({ ...reminderData, monthlyTime: selectedTime });
              }
            }
          }}
        />
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
  },
  categoryCardDark: {
    backgroundColor: '#2a2a2a',
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
});

export default CreateReminderScreen;
