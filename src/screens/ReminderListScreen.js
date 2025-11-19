import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReminderListScreen = ({ navigation }) => {
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadReminders();
  }, []);

  useEffect(() => {
    filterReminders();
  }, [reminders, searchQuery, selectedFilter]);

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

  const filterReminders = () => {
    let filtered = [...reminders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reminder.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((reminder) => reminder.type === selectedFilter);
    }

    setFilteredReminders(filtered);
  };

  const getReminderIcon = (type) => {
    const icons = {
      hourly: 'access-time',
      weekly: 'date-range',
      '15days': 'refresh',
      monthly: 'calendar-today',
      custom: 'settings',
    };
    return icons[type] || 'notifications';
  };

  const getReminderColor = (type) => {
    const colors = {
      hourly: ['#3B82F6', '#2563EB'],
      weekly: ['#10B981', '#059669'],
      '15days': ['#8B5CF6', '#7C3AED'],
      monthly: ['#F59E0B', '#D97706'],
      custom: ['#EF4444', '#DC2626'],
    };
    return colors[type] || ['#6B7280', '#4B5563'];
  };

  const deleteReminder = (id) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedReminders = reminders.filter((r) => r.id !== id);
          setReminders(updatedReminders);
          await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
        },
      },
    ]);
  };

  const toggleReminder = async (id) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder
    );
    setReminders(updatedReminders);
    await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
  };

  const renderReminderItem = ({ item }) => {
    const colors = getReminderColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.reminderCard, !item.isActive && styles.reminderCardInactive]}
        activeOpacity={0.9}
      >
        <LinearGradient colors={colors} style={styles.reminderIcon}>
          <Icon name={getReminderIcon(item.type)} size={24} color="white" />
        </LinearGradient>

        <View style={styles.reminderContent}>
          <Text style={[styles.reminderTitle, !item.isActive && styles.textInactive]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={[styles.reminderDescription, !item.isActive && styles.textInactive]}>
              {item.description}
            </Text>
          )}
          <View style={styles.reminderMeta}>
            <View style={styles.metaChip}>
              <Icon name="label" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
            <View style={styles.metaChip}>
              <Icon name="flag" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{item.priority}</Text>
            </View>
          </View>
        </View>

        <View style={styles.reminderActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleReminder(item.id)}>
            <Icon
              name={item.isActive ? 'toggle-on' : 'toggle-off'}
              size={32}
              color={item.isActive ? '#10B981' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => deleteReminder(item.id)}>
            <Icon name="delete-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const filters = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'hourly', label: 'Hourly', icon: 'access-time' },
    { id: 'weekly', label: 'Weekly', icon: 'date-range' },
    { id: '15days', label: '15 Days', icon: 'refresh' },
    { id: 'monthly', label: 'Monthly', icon: 'calendar-today' },
    { id: 'custom', label: 'Custom', icon: 'settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reminders</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Icon name="more-vert" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reminders..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === item.id && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item.id)}
            >
              <Icon
                name={item.icon}
                size={16}
                color={selectedFilter === item.id ? 'white' : '#667EEA'}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.filterContainer}
        />
      </LinearGradient>

      {/* Reminders List */}
      <FlatList
        data={filteredReminders}
        renderItem={renderReminderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="search-off" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Reminders Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first reminder'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateReminder')}
              >
                <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.gradientButton}>
                  <Text style={styles.createButtonText}>Create Reminder</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateReminder')}>
        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.fabGradient}>
          <Icon name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  filterContainer: {
    marginBottom: -8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
    marginLeft: 6,
  },
  filterChipTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  reminderCard: {
    flexDirection: 'row',
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
  reminderCardInactive: {
    opacity: 0.6,
  },
  reminderIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  textInactive: {
    color: '#9CA3AF',
  },
  reminderMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  reminderActions: {
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
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
  createButton: {
    marginTop: 24,
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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

export default ReminderListScreen;
