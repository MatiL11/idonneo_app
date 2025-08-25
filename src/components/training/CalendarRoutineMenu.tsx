import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface CalendarRoutineMenuProps {
  visible: boolean;
  onClose: () => void;
  onRemove: () => void;
  routineName: string;
}

export default function CalendarRoutineMenu({ 
  visible, 
  onClose, 
  onRemove,
  routineName
}: CalendarRoutineMenuProps) {
  
  const handleRemove = () => {
    Alert.alert(
      "Quitar rutina",
      `¿Estás seguro de que quieres quitar "${routineName}" del calendario?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            onRemove();
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Opciones</Text>
            <Text style={[styles.titleText, {fontSize: 14, fontWeight: '400', marginTop: 4, opacity: 0.9}]}>
              {routineName}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.deleteItem]} 
            onPress={handleRemove}
          >
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
            <Text style={[styles.menuText, styles.deleteText]}>Quitar del calendario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.cancelItem]} 
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '85%',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.95)' : '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#ff3b30',
  },
  cancelItem: {
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 14,
    marginTop: 8,
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.black,
  },
  titleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.green,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
  }
});
