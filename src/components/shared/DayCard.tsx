import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface DayCardProps {
  dayAbbr: string;
  dayNumber: string;
  isToday?: boolean;
  onAddMeal?: () => void;
  children?: React.ReactNode;
  variant?: 'light' | 'dark';
}

export default function DayCard({ 
  dayAbbr, 
  dayNumber, 
  isToday = false, 
  onAddMeal,
  children,
  variant = 'light'
}: DayCardProps) {
  const isDark = variant === 'dark';
  
  return (
    <View style={[
      styles.dayItem, 
      isDark && styles.dayItemDark
    ]}>
      {/* Encabezado del día */}
      <View style={styles.dayHeader}>
        <View style={styles.dayLabelRow}>
          <Text style={[
            styles.dayAbbr, 
            isToday && styles.todayText,
            isDark && styles.dayAbbrDark
          ]}>
            {dayAbbr}
          </Text>
          <Text style={[
            styles.dayNumber, 
            isDark && styles.dayNumberDark
          ]}>
            {dayNumber}
          </Text>
        </View>

        {onAddMeal && (
          <TouchableOpacity
            style={[
              styles.addMealBtn,
              isDark && styles.addMealBtnDark
            ]}
            onPress={onAddMeal}
          >
            <Ionicons 
              name="add" 
              size={20} 
              color={isDark ? '#fff' : COLORS.black} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido del día */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  dayItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  dayItemDark: {
    backgroundColor: '#111',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayLabelRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline' 
  },
  dayAbbr: { 
    color: '#111', 
    fontSize: 16, 
    fontWeight: '900', 
    marginRight: 2 
  },
  dayAbbrDark: {
    color: '#fff',
  },
  dayNumber: { 
    color: '#D0D0D0', 
    fontSize: 16, 
    fontWeight: '900' 
  },
  dayNumberDark: {
    color: '#999',
  },
  todayText: { 
    color: COLORS.green 
  },
  addMealBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealBtnDark: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
});
