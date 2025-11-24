import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const FilterChip = ({ label, selected, onPress, color = '#667EEA', isDarkMode = false }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && [styles.chipSelected, { backgroundColor: color }],
        isDarkMode && !selected && styles.chipDark,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.chipTextSelected,
          isDarkMode && !selected && styles.chipTextDark,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  chipDark: {
    backgroundColor: '#1a1f3a',
    borderColor: '#3a4560',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: 'white',
  },
  chipTextDark: {
    color: '#E5E7EB',
  },
});

export default FilterChip;
