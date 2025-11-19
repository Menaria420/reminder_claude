import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const [reminders, setReminders] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [todayReminders, setTodayReminders] = useState([]);

  useEffect(() => {
    loadReminders();
    setGreetingMessage();
  }, []);

  useEffect(() => {
    if (route.params?.newReminder) {
      const newReminder = {
        id: Date.now().toString(),
        ...route.params.newReminder,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      setReminders(prev => [newReminder, ...prev]);
      saveReminders([newReminder, ...reminders]);
    }
  }, [route.params?.newReminder]);

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('reminders');
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const saveReminders = async (remindersList) => {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(remindersList));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const toggleReminder = (id) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const deleteReminder = (id) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedReminders = reminders.filter(r => r.id !== id);
            setReminders(updatedReminders);
            saveReminders(updatedReminders);
          }
        }
      ]
    );
  };

  const getReminderIcon = (type) => {
    const icons = {
      hourly: 'access-time',
      weekly: 'date-range',
      '15days': 'refresh',
      monthly: 'calendar-today',
      custom: 'settings'
    };
    return icons[type] || 'notifications';
  };

  const getReminderColor = (type) => {
    const colors = {
      hourly: ['#3B82F6', '#2563EB'],
      weekly: ['#10B981', '#059669'],
      '15days': ['#8B5CF6', '#7C3AED'],
      monthly: ['#F59E0B', '#D97706'],
      custom: ['#EF4444', '#DC2626']
    };
    return colors[type] || ['#6B7280', '#4B5563'];
  };

  const renderStatCard = (title, value, icon, colors) => (
    <LinearGradient
      colors={colors}
      style={styles.statCard}
    >
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={24} color="white" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </LinearGradient>
  );

  const renderReminderItem = ({ item }) => {
    const colors = getReminderColor(item.type);
    
    return (
      <TouchableOpacity
        style={styles.reminderCard}
        onPress={() => navigation.navigate('ReminderList', { reminderId: item.id })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={colors}
          style={styles.reminderIcon}
        >
          <Icon name={getReminderIcon(item.type)} size={20} color="white" />
        </LinearGradient>
        
        <View style={styles.reminderContent}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderType}>{item.type} • {item.category}</Text>
        </View>
        
        <View style={styles.reminderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleReminder(item.id)}
          >
            <Icon 
              name={item.isActive ? 'toggle-on' : 'toggle-off'} 
              size={32} 
              color={item.isActive ? '#10B981' : '#9CA3AF'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteReminder(item.id)}
          >
            <Icon name="delete-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.subtitle}>Let's organize your day</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Icon name="person" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statsContainer}
          >
            {renderStatCard('Active', reminders.filter(r => r.isActive).length, 'notifications-active', ['#10B981', '#059669'])}
            {renderStatCard('Today', todayReminders.length, 'today', ['#3B82F6', '#2563EB'])}
            {renderStatCard('Total', reminders.length, 'list-alt', ['#8B5CF6', '#7C3AED'])}
            {renderStatCard('Completed', '0', 'check-circle', ['#F59E0B', '#D97706'])}
          </ScrollView>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CreateReminder')}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.quickActionIcon}
              >
                <Icon name="add" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Create New</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ReminderList')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.quickActionIcon}
              >
                <Icon name="list" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>View All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.quickActionIcon}
              >
                <Icon name="calendar-today" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.quickActionIcon}
              >
                <Icon name="settings" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Reminders */}
        {reminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Reminders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ReminderList')}>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={reminders.slice(0, 5)}
              renderItem={renderReminderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Empty State */}
        {reminders.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="notifications-none" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Reminders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first reminder to get started
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => navigation.navigate('CreateReminder')}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.gradientButton}
              >
                <Icon name="add" size={20} color="white" />
                <Text style={styles.createFirstText}>Create Reminder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {reminders.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateReminder')}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.fabGradient}
          >
            <Icon name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  statCard: {
    width: width * 0.35,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  reminderCard: {
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
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reminderType: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  createFirstButton: {
    marginTop: 24,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default HomeScreen;
