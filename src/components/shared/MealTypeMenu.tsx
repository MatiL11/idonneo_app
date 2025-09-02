import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface MealType {
  key: string;
  label: string;
  icon: string;
}

interface MealTypeMenuProps {
  mealTypes: MealType[];
  onSelectMealType: (mealType: string) => void;
  visible: boolean;
  onClose: () => void;
}

export default function MealTypeMenu({ 
  mealTypes, 
  onSelectMealType, 
  visible,
  onClose
}: MealTypeMenuProps) {
  const handleSelectMealType = (mealType: string) => {
    onSelectMealType(mealType);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Agregar Comida</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.mealTypesList}>
          {mealTypes.map((mealType) => (
            <TouchableOpacity
              key={mealType.key}
              style={styles.mealTypeItem}
              onPress={() => handleSelectMealType(mealType.key)}
            >
              <Ionicons name={mealType.icon as any} size={24} color={COLORS.black} />
              <Text style={styles.mealTypeText}>{mealType.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 32, // Mismo ancho que el botón de cerrar para centrar el título
  },
  mealTypesList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  mealTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 16,
  },
});
