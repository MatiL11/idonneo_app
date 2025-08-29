import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/tokens';

interface MealItemProps {
  name: string;
  type: string;
  image: string;
  variant?: 'light' | 'dark';
}

export default function MealItem({ 
  name, 
  type, 
  image, 
  variant = 'light' 
}: MealItemProps) {
  const isDark = variant === 'dark';
  
  return (
    <View style={[
      styles.mealItem, 
      isDark && styles.mealItemDark
    ]}>
      <View style={[
        styles.mealImage, 
        isDark && styles.mealImageDark
      ]}>
        <Text style={styles.mealImageText}>{image}</Text>
      </View>
      <View style={styles.mealInfo}>
        <Text style={[
          styles.mealName, 
          isDark && styles.mealNameDark
        ]}>
          {name}
        </Text>
        <Text style={styles.mealType}>{type}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealItemDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  mealImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealImageDark: {
    backgroundColor: '#2a2a2a',
  },
  mealImageText: { 
    fontSize: 20 
  },
  mealInfo: { 
    flex: 1 
  },
  mealName: { 
    color: COLORS.black, 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 4 
  },
  mealNameDark: {
    color: '#fff',
  },
  mealType: { 
    color: COLORS.green, 
    fontSize: 12, 
    fontWeight: '700' 
  },
});
