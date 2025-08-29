import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface WeekNavigationProps {
  startDate: string;
  endDate: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  variant?: 'dark' | 'light';
}

export default function WeekNavigation({ 
  startDate, 
  endDate, 
  onPrevWeek, 
  onNextWeek,
  variant = 'light'
}: WeekNavigationProps) {
  const isDark = variant === 'dark';
  
  return (
    <View style={[
      styles.weekNavigation, 
      isDark && styles.weekNavigationDark
    ]}>
      <TouchableOpacity 
        onPress={onPrevWeek} 
        style={[
          styles.weekArrow, 
          isDark && styles.weekArrowDark
        ]}
      >
        <Ionicons 
          name="chevron-back" 
          size={18} 
          color={isDark ? '#fff' : COLORS.black} 
        />
      </TouchableOpacity>

      <Text style={[
        styles.weekText, 
        isDark && styles.weekTextDark
      ]}>
        {startDate} - {endDate}
      </Text>

      <TouchableOpacity 
        onPress={onNextWeek} 
        style={[
          styles.weekArrow, 
          isDark && styles.weekArrowDark
        ]}
      >
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={isDark ? '#fff' : COLORS.black} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: COLORS.white,
  },
  weekNavigationDark: {
    backgroundColor: '#111',
  },
  weekText: { 
    color: COLORS.black, 
    fontSize: 17, 
    fontWeight: '800' 
  },
  weekTextDark: {
    color: '#fff',
  },
  weekArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
  },
});
