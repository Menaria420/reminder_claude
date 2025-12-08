import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import FilterModal from '../components/FilterModal';
import { applyAllFilters, applySorting, getActiveFilterCount } from '../utils/filterUtils';
import { showSuccessToast, showErrorToast, showDeleteConfirm } from '../utils/ToastManager';
import { getReminderDisplayTime, getFormattedNextTrigger } from '../utils/reminderUtils';

const ReminderListScreen = ({ navigation, route }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const flatListRef = useRef(null);
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: null,
    timeSlots: [],
    types: [],
    statuses: [],
  });
  const [sortBy, setSortBy] = useState('dateNewest');

  // Reload reminders whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadReminders();
    }, [])
  );

  useEffect(() => {
    filterReminders();
  }, [reminders, searchQuery, selectedFilter, filters, sortBy]);

  // Handle scroll to specific reminder
  useEffect(() => {
    if (route.params?.scrollToId && filteredReminders.length > 0 && flatListRef.current) {
      const index = filteredReminders.findIndex((r) => r.id === route.params.scrollToId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5, // Center the item
          });
        }, 300);
      }
    }
  }, [route.params?.scrollToId, filteredReminders]);

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('reminders');
      if (savedReminders) {
        try {
          const parsed = JSON.parse(savedReminders);
          if (Array.isArray(parsed)) {
            setReminders(parsed);
          } else {
            console.warn('Invalid reminders data format');
            setReminders([]);
          }
        } catch (parseError) {
          console.error('Error parsing reminders JSON:', parseError);
          setReminders([]);
        }
      } else {
        setReminders([]);
      }
    } catch (error) {
      console.error('Error loading reminders from storage:', error);
      setReminders([]);
    }
  };

  const filterReminders = () => {
    let filtered = [...reminders];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reminder.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply advanced filters
    filtered = applyAllFilters(filtered, filters);

    // Apply old filter (for backward compatibility)
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((reminder) => reminder.type === selectedFilter);
    }

    // Apply sorting
    filtered = applySorting(filtered, sortBy);

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
    showDeleteConfirm('this reminder', async () => {
      try {
        const updatedReminders = reminders.filter((r) => r.id !== id);
        setReminders(updatedReminders);
        await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
        showSuccessToast('Reminder deleted successfully');
      } catch (error) {
        console.error('Error deleting reminder:', error);
        showErrorToast('Failed to delete reminder.');
      }
    });
  };

  const toggleReminder = async (id) => {
    try {
      const updatedReminders = reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, isActive: !reminder.isActive } : reminder
      );
      setReminders(updatedReminders);
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error toggling reminder:', error);
      showErrorToast('Failed to update reminder.');
    }
  };

  const renderReminderItem = ({ item }) => {
    const colors = getReminderColor(item.type);
    const priorityColors = {
      low: { bg: '#F3F4F6', text: '#6B7280' },
      normal: { bg: '#DBEAFE', text: '#2563EB' },
      high: { bg: '#FEF3C7', text: '#D97706' },
      urgent: { bg: '#FEE2E2', text: '#DC2626' },
    };
    const priority = priorityColors[item.priority] || priorityColors.normal;

    return (
      <View
        style={[
          styles.reminderCard,
          !item.isActive && styles.reminderCardInactive,
          isDarkMode && styles.reminderCardDark,
        ]}
      >
        {/* Card Header - Category, Type & Priority */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={colors} style={styles.typeIcon}>
              <Icon name={getReminderIcon(item.type)} size={18} color="white" />
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text
                style={[
                  styles.reminderTitle,
                  !item.isActive && styles.textInactive,
                  isDarkMode && styles.reminderTitleDark,
                ]}
                numberOfLines={2}
              >
                {item.title || 'Untitled Reminder'}
              </Text>
              <Text style={[styles.categoryLabel, isDarkMode && styles.categoryLabelDark]}>
                {item.category || 'General'} • {(item.type || 'custom').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
            <Text style={[styles.priorityBadgeText, { color: priority.text }]}>
              {(item.priority || 'normal').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <Text
            style={[
              styles.reminderDescription,
              !item.isActive && styles.textInactive,
              isDarkMode && styles.reminderDescriptionDark,
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {/* Next Trigger - Prominent */}
        <View style={[styles.triggerInfoBox, isDarkMode && styles.triggerInfoBoxDark]}>
          <Icon name="schedule" size={16} color="#667EEA" />
          <Text style={[styles.triggerInfoText, isDarkMode && styles.triggerInfoTextDark]}>
            {getFormattedNextTrigger(item)}
          </Text>
        </View>

        {/* Additional Info Row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoChip, isDarkMode && styles.infoChipDark]}>
            <Icon name="volume-up" size={12} color="#6B7280" />
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {item.ringTone || 'default'}
            </Text>
          </View>
          <View
            style={[styles.statusChip, { backgroundColor: item.isActive ? '#ECFDF5' : '#F3F4F6' }]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]}
            />
            <Text style={[styles.statusText, { color: item.isActive ? '#10B981' : '#9CA3AF' }]}>
              {item.isActive ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.cardActions, isDarkMode && styles.cardActionsDark]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn, isDarkMode && styles.editBtnDark]}
            onPress={() =>
              navigation.navigate('CreateReminder', { editMode: true, reminder: item })
            }
          >
            <Icon name="edit" size={18} color={isDarkMode ? '#60A5FA' : '#3B82F6'} />
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#60A5FA' : '#3B82F6' }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.toggleBtn, isDarkMode && styles.toggleBtnDark]}
            onPress={() => toggleReminder(item.id)}
          >
            <Icon
              name={item.isActive ? 'pause' : 'play-arrow'}
              size={18}
              color={
                item.isActive
                  ? isDarkMode
                    ? '#FBBF24'
                    : '#F59E0B'
                  : isDarkMode
                  ? '#34D399'
                  : '#10B981'
              }
            />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: item.isActive
                    ? isDarkMode
                      ? '#FBBF24'
                      : '#F59E0B'
                    : isDarkMode
                    ? '#34D399'
                    : '#10B981',
                },
              ]}
            >
              {item.isActive ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn, isDarkMode && styles.deleteBtnDark]}
            onPress={() => deleteReminder(item.id)}
          >
            <Icon name="delete-outline" size={18} color={isDarkMode ? '#F87171' : '#EF4444'} />
            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#F87171' : '#EF4444' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const typeFilters = [
    { id: 'all', label: 'All', icon: 'list' },
    { id: 'hourly', label: 'Hourly', icon: 'access-time' },
    { id: 'weekly', label: 'Weekly', icon: 'date-range' },
    { id: '15days', label: '15 Days', icon: 'refresh' },
    { id: 'monthly', label: 'Monthly', icon: 'calendar-today' },
    { id: 'custom', label: 'Custom', icon: 'settings' },
  ];

  const handleApplyFilters = (newFilters, newSortBy) => {
    setFilters(newFilters);
    setSortBy(newSortBy);
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.logoButton}>
            <Icon name="event-note" size={28} color="white" />
            <Text style={styles.logoText}>Reminders</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reminders</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Icon name="filter-list" size={24} color="white" />
            {getActiveFilterCount(filters) > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount(filters)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
            placeholder="Search reminders..."
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={typeFilters}
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

      <FlatList
        data={filteredReminders}
        renderItem={renderReminderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="search-off" size={64} color="#CBD5E1" />
            <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
              No Reminders Found
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
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

      <View style={[styles.footerNav, isDarkMode && styles.footerNavDark]}>
        <TouchableOpacity style={styles.footerNavItem} onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={24} color="#9CA3AF" />
          <Text style={[styles.footerNavLabel, { color: '#9CA3AF' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => navigation.navigate('ReminderList')}
        >
          <Icon name="list" size={24} color="#667EEA" />
          <Text style={[styles.footerNavLabel, { color: '#667EEA' }]}>Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createFooterButton}
          onPress={() => navigation.navigate('CreateReminder')}
        >
          <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.createFooterGradient}>
            <Icon name="add" size={32} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => navigation.navigate('Calendar')}
        >
          <Icon name="calendar-today" size={24} color="#9CA3AF" />
          <Text style={[styles.footerNavLabel, { color: '#9CA3AF' }]}>Calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerNavItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="settings" size={24} color="#9CA3AF" />
          <Text style={[styles.footerNavLabel, { color: '#9CA3AF' }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
        initialSort={sortBy}
        isDarkMode={isDarkMode}
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
    marginBottom: 20,
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
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 12 to 8
    marginBottom: 16,
  },
  searchContainerDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  searchInputDark: {
    color: '#ffffff',
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
    paddingBottom: 80,
  },
  reminderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#667EEA',
  },
  reminderCardDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
    borderWidth: 1,
    borderLeftColor: '#667EEA',
  },
  reminderCardInactive: {
    opacity: 0.6,
    borderLeftColor: '#9CA3AF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  reminderTitleDark: {
    color: '#ffffff',
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  reminderDescriptionDark: {
    color: '#9CA3AF',
  },
  textInactive: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  categoryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  categoryLabelDark: {
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  triggerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  triggerInfoBoxDark: {
    backgroundColor: '#1F2937',
  },
  triggerInfoText: {
    fontSize: 13,
    color: '#667EEA',
    fontWeight: '600',
    flex: 1,
  },
  triggerInfoTextDark: {
    color: '#93C5FD',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  infoChipDark: {
    backgroundColor: '#2a2f4a',
  },
  infoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  infoTextDark: {
    color: '#9CA3AF',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardActionsDark: {
    borderTopColor: '#3a4560',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editBtn: {
    backgroundColor: '#DBEAFE',
  },
  editBtnDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  toggleBtn: {
    backgroundColor: '#DCFCE7',
  },
  toggleBtnDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  deleteBtnDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
  emptyTitleDark: {
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitleDark: {
    color: '#9CA3AF',
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
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingBottom: 20, // Extra padding for bottom
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 80,
  },
  footerNavDark: {
    backgroundColor: '#1a1f3a',
    borderTopColor: '#3a4560',
  },
  footerNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    flex: 1,
  },
  createFooterButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  createFooterGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNavLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667EEA',
    marginTop: 4,
  },
});

export default ReminderListScreen;
