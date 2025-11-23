import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../App';

const CalendarScreen = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [reminders, setReminders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('reminders');
      if (savedReminders) {
        const parsed = JSON.parse(savedReminders);
        if (Array.isArray(parsed)) {
          setReminders(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getRemindersForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.createdAt);
      return reminderDate.toDateString() === dateStr && reminder.isActive;
    });
  };

  const renderCalendarDay = (date) => {
    if (!date) {
      return <View style={styles.emptyDay} />;
    }

    const isSelected = selectedDate.toDateString() === date.toDateString();
    const isToday = new Date().toDateString() === date.toDateString();
    const dayReminders = getRemindersForDate(date);
    const hasReminders = dayReminders.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          isToday && styles.todayDay,
          isDarkMode && styles.calendarDayDark,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          isToday && styles.todayDayText,
          isDarkMode && styles.dayTextDark,
        ]}>
          {date.getDate()}
        </Text>
        {hasReminders && (
          <View style={styles.reminderDot}>
            <Text style={styles.reminderCount}>{dayReminders.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderReminderItem = ({ item }) => (
    <View style={[styles.reminderItem, isDarkMode && styles.reminderItemDark]}>
      <View style={[styles.reminderIcon, isDarkMode && styles.reminderIconDark]}>
        <Icon name="notifications" size={16} color="#667EEA" />
      </View>
      <View style={styles.reminderContent}>
        <Text style={[styles.reminderTitle, isDarkMode && styles.reminderTitleDark]}>{item.title}</Text>
        <Text style={[styles.reminderType, isDarkMode && styles.reminderTypeDark]}>{item.type} • {item.category}</Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]} />
    </View>
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDateReminders = getRemindersForDate(selectedDate);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <LinearGradient colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateReminder')} style={styles.addButton}>
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            style={styles.monthButton}
          >
            <Icon name="chevron-left" size={24} color="#667EEA" />
          </TouchableOpacity>
          
          <Text style={[styles.monthTitle, isDarkMode && styles.monthTitleDark]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            style={styles.monthButton}
          >
            <Icon name="chevron-right" size={24} color="#667EEA" />
          </TouchableOpacity>
        </View>

        <View style={[styles.calendar, isDarkMode && styles.calendarDark]}>
          <View style={styles.weekHeader}>
            {weekDays.map(day => (
              <Text key={day} style={[styles.weekDay, isDarkMode && styles.weekDayDark]}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {getDaysInMonth(currentMonth).map((date, index) => (
              <View key={index} style={styles.dayContainer}>
                {renderCalendarDay(date)}
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.remindersSection, isDarkMode && styles.remindersSectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Reminders for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {selectedDateReminders.length > 0 ? (
            <FlatList
              data={selectedDateReminders}
              renderItem={renderReminderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noReminders}>
              <Icon name="event-available" size={48} color="#CBD5E1" />
              <Text style={[styles.noRemindersText, isDarkMode && styles.noRemindersTextDark]}>No reminders for this date</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#0a0e27',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  monthTitleDark: {
    color: '#ffffff',
  },
  calendar: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  calendarDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekDayDark: {
    color: '#9CA3AF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  emptyDay: {
    flex: 1,
  },
  calendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  calendarDayDark: {
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: '#667EEA',
  },
  todayDay: {
    backgroundColor: '#F0F4FF',
    borderWidth: 2,
    borderColor: '#667EEA',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dayTextDark: {
    color: '#ffffff',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '700',
  },
  todayDayText: {
    color: '#667EEA',
    fontWeight: '700',
  },
  reminderDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderCount: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  remindersSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  remindersSectionDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reminderItemDark: {
    borderBottomColor: '#3a4560',
  },
  reminderIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderIconDark: {
    backgroundColor: '#2a2f4a',
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reminderTitleDark: {
    color: '#ffffff',
  },
  reminderType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  reminderTypeDark: {
    color: '#9CA3AF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noReminders: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRemindersText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  noRemindersTextDark: {
    color: '#9CA3AF',
  },
});

export default CalendarScreen;