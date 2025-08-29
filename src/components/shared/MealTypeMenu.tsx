import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MealType {
  key: string;
  label: string;
  icon: string;
}

interface MealTypeMenuProps {
  mealTypes: MealType[];
  onSelectMealType: (mealType: string) => void;
  visible: boolean;
}

export default function MealTypeMenu({ 
  mealTypes, 
  onSelectMealType, 
  visible 
}: MealTypeMenuProps) {
  if (!visible) return null;

  return (
    <View style={styles.mealMenu}>
      {mealTypes.map((mealType, index) => (
        <TouchableOpacity
          key={mealType.key}
          style={[
            styles.mealMenuItem,
            index === mealTypes.length - 1 && styles.lastMenuItem
          ]}
          onPress={() => onSelectMealType(mealType.key)}
        >
          <Ionicons name={mealType.icon as any} size={18} color="#333" />
          <Text style={styles.mealMenuText}>{mealType.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mealMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    right: 12,
    top: 50,
    minWidth: 180,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  mealMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  mealMenuText: { 
    fontSize: 14, 
    color: '#333', 
    marginLeft: 10, 
    fontWeight: '500' 
  },
});
