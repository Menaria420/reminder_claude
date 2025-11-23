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
import { ThemeContext } from '../../App';

const { width } = Dimensions.get('window');

const CreateReminderScreen = ({ navigation }) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [reminderData, setReminderData] = useState({
    title: '',
    description: '',
    type: '',
    hourlyInterval: 1,
    weeklyDays: [],
    weeklyTimes: [],
    timeMethod: 'specific',
    fifteenDaysStart: new Date(),
    fifteenDaysTime: new Date(),
    monthlyDate: 1,
    monthlyTime: new Date(),
    customSettings: {
      year: new Date().getFullYear(),
      month: 1,
      date: 1,
      time: new Date(),
      yearRepeat: 'specific',
      monthRepeat: 'specific',
      dateRepeat: 'specific',
    },
    notificationSound: 'default',
    category: 'personal',
    priority: 'normal',
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

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
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
    const now = new Date();

    switch (reminderData.type) {
      case 'hourly': {
        const next = new Date(now.getTime() + reminderData.hourlyInterval * 60 * 60 * 1000);
        return next.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      case 'weekly': {
        const nextTime = reminderData.weeklyTimes[0] || '6:00 AM';
        return `${reminderData.weeklyDays[0]} at ${nextTime}`;
      }
      case '15days': {
        const next = new Date(reminderData.fifteenDaysTime);
        return next.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      case 'monthly': {
        const next = new Date(reminderData.monthlyTime);
        return `${reminderData.monthlyDate} at ${next.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}`;
      }
      case 'custom': {
        const customTime = reminderData.customSettings.time;
        return customTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      default:
        return 'Soon';
    }
  };

  const handleSelectType = (type) => {
    handleVibrate();
    setReminderData({ ...reminderData, type });
    setCurrentStep(2);
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
      if (!reminderData.title.trim()) {
        Alert.alert('Required Field', 'Please enter a reminder title');
        return false;
      }
      if (!reminderData.type) {
        Alert.alert('Required Field', 'Please select a reminder type');
        return false;
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

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('Home', { newReminder: reminderData });
      }, 4000);
    }, 1500);
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

  const renderStep1 = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, isDarkMode && styles.labelDark]}>Reminder Title *</Text>
        <TextInput
          style={[styles.input, isDarkMode && styles.inputDark]}
          value={reminderData.title}
          onChangeText={(text) => setReminderData({ ...reminderData, title: text })}
          placeholder="e.g., Take medication, Team meeting"
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
                  style={styles.intervalButton}
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
                  style={styles.intervalButton}
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
              onPress={() => setShowTimePicker(true)}
            >
              <Icon name="access-time" size={20} color="#667EEA" />
              <Text style={styles.timePickerText}>Set Start Time</Text>
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

      <View style={styles.optionCard}>
        <View style={styles.optionIcon}>
          <Icon name="volume-up" size={20} color="#667EEA" />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>Notification Sound</Text>
          <View style={styles.soundOptions}>
            {['Default', 'Bell', 'Chime'].map((sound) => (
              <TouchableOpacity
                key={sound}
                style={[
                  styles.soundChip,
                  reminderData.notificationSound === sound.toLowerCase() && styles.soundChipActive,
                ]}
                onPress={() => {
                  handleVibrate();
                  setReminderData({ ...reminderData, notificationSound: sound.toLowerCase() });
                }}
              >
                <Text
                  style={[
                    styles.soundChipText,
                    reminderData.notificationSound === sound.toLowerCase() &&
                      styles.soundChipTextActive,
                  ]}
                >
                  {sound}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Reminder Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Title:</Text>
          <Text style={styles.summaryValue}>{reminderData.title || 'Not set'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{reminderData.type || 'Not set'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Category:</Text>
          <Text style={styles.summaryValue}>{reminderData.category}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Priority:</Text>
          <Text style={styles.summaryValue}>{reminderData.priority}</Text>
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
            <Icon name="event-note" size={28} color="white" />
            <Text style={styles.logoText}>Reminders</Text>
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
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
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
          value={reminderData.fifteenDaysTime}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setReminderData({ ...reminderData, fifteenDaysTime: selectedTime });
            }
          }}
        />
      )}

      {/* Success Modal */}
      <Modal transparent visible={showSuccess} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={60} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>Your reminder has been created</Text>
            <View style={styles.triggerInfoContainer}>
              <Icon name="schedule" size={16} color="#667EEA" />
              <Text style={styles.triggerInfo}>Next: {getNextTriggerTime()}</Text>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default CreateReminderScreen;
