import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import FilterChip from './FilterChip';

const { height } = Dimensions.get('window');

const FilterModal = ({ visible, onClose, onApply, initialFilters, initialSort, isDarkMode }) => {
  const [filters, setFilters] = useState(
    initialFilters || {
      categories: [],
      dateRange: null,
      timeSlots: [],
      types: [],
      statuses: [],
    }
  );
  const [sortBy, setSortBy] = useState(initialSort || 'dateNewest');

  const categoryOptions = [
    { id: 'medication', label: 'Medication', color: '#EF4444' },
    { id: 'fitness', label: 'Fitness', color: '#10B981' },
    { id: 'habits', label: 'Habits', color: '#8B5CF6' },
    { id: 'others', label: 'Others', color: '#6B7280' },
  ];

  const dateOptions = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const timeOptions = [
    { id: 'morning', label: 'Morning (6AM-12PM)' },
    { id: 'afternoon', label: 'Afternoon (12PM-6PM)' },
    { id: 'evening', label: 'Evening (6PM-12AM)' },
    { id: 'night', label: 'Night (12AM-6AM)' },
  ];

  const typeOptions = [
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
  ];

  const sortOptions = [
    { id: 'dateNewest', label: 'Date: New to Old', icon: 'arrow-downward' },
    { id: 'dateOldest', label: 'Date: Old to New', icon: 'arrow-upward' },
    { id: 'alphabeticalAsc', label: 'Name: A-Z', icon: 'sort-by-alpha' },
    { id: 'alphabeticalDesc', label: 'Name: Z-A', icon: 'sort-by-alpha' },
    { id: 'timeEarly', label: 'Time: Early to Late', icon: 'access-time' },
    { id: 'timeLate', label: 'Time: Late to Early', icon: 'access-time' },
  ];

  const toggleCategory = (categoryId) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const setDateRange = (range) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: prev.dateRange === range ? null : range,
    }));
  };

  const toggleTimeSlot = (slot) => {
    setFilters((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter((s) => s !== slot)
        : [...prev.timeSlots, slot],
    }));
  };

  const toggleType = (type) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      dateRange: null,
      timeSlots: [],
      types: [],
      statuses: [],
    });
    setSortBy('dateNewest');
  };

  const handleApply = () => {
    onApply(filters, sortBy);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
          {/* Header */}
          <LinearGradient
            colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Filters & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Category
              </Text>
              <View style={styles.chipContainer}>
                {categoryOptions.map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={filters.categories.includes(option.id)}
                    onPress={() => toggleCategory(option.id)}
                    color={option.color}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </View>
            </View>

            {/* Date Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Date Range
              </Text>
              <View style={styles.chipContainer}>
                {dateOptions.map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={filters.dateRange === option.id}
                    onPress={() => setDateRange(option.id)}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </View>
            </View>

            {/* Time Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Time of Day
              </Text>
              <View style={styles.chipContainer}>
                {timeOptions.map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={filters.timeSlots.includes(option.id)}
                    onPress={() => toggleTimeSlot(option.id)}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </View>
            </View>

            {/* Type Filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Reminder Type
              </Text>
              <View style={styles.chipContainer}>
                {typeOptions.map((option) => (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    selected={filters.types.includes(option.id)}
                    onPress={() => toggleType(option.id)}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Sort By
              </Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    sortBy === option.id && styles.sortOptionSelected,
                    isDarkMode && styles.sortOptionDark,
                    sortBy === option.id && isDarkMode && styles.sortOptionSelectedDark,
                  ]}
                  onPress={() => setSortBy(option.id)}
                >
                  <Icon
                    name={option.icon}
                    size={20}
                    color={sortBy === option.id ? '#667EEA' : isDarkMode ? '#9CA3AF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.id && styles.sortOptionTextSelected,
                      isDarkMode && styles.sortOptionTextDark,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.id && <Icon name="check" size={20} color="#667EEA" />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isDarkMode && styles.footerDark]}>
            <TouchableOpacity
              style={[styles.clearButton, isDarkMode && styles.clearButtonDark]}
              onPress={clearAllFilters}
            >
              <Text style={[styles.clearButtonText, isDarkMode && styles.clearButtonTextDark]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} activeOpacity={0.9}>
              <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  modalContainerDark: {
    backgroundColor: '#0a0e27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#F9FAFB',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  sortOptionDark: {
    backgroundColor: '#1a1f3a',
  },
  sortOptionSelected: {
    backgroundColor: '#EDE9FE',
  },
  sortOptionSelectedDark: {
    backgroundColor: '#2a2f4a',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  sortOptionTextDark: {
    color: '#E5E7EB',
  },
  sortOptionTextSelected: {
    color: '#667EEA',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerDark: {
    borderTopColor: '#3a4560',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#667EEA',
    alignItems: 'center',
  },
  clearButtonDark: {
    borderColor: '#9CA3AF',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667EEA',
  },
  clearButtonTextDark: {
    color: '#9CA3AF',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default FilterModal;
