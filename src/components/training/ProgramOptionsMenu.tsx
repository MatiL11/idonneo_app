import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Share,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface ProgramMenuProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  programName: string;
}

export default function ProgramOptionsMenu({ 
  visible, 
  onClose, 
  onDelete,
  programName
}: ProgramMenuProps) {
  
  const handleDelete = () => {
    Alert.alert(
      "Eliminar programa",
      `¿Estás seguro de que quieres eliminar el programa "${programName}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await onDelete();
              onClose();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el programa");
            }
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira mi programa de entrenamiento "${programName}" en iDonneo!`,
        title: `Programa: ${programName}`
      });
      onClose();
    } catch (error) {
      console.error("Error al compartir:", error);
    }
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
            <Text style={styles.titleText}>Opciones de programa</Text>
            <Text style={[styles.titleText, {fontSize: 14, fontWeight: '400', marginTop: 4, opacity: 0.9}]}>
              {programName}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={COLORS.black} />
            <Text style={styles.menuText}>Compartir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.deleteItem]} 
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
            <Text style={[styles.menuText, styles.deleteText]}>Eliminar</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  titleContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4caf50',  // Color verde para los programas (puedes cambiarlo a COLORS.black si prefieres)
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
    color: COLORS.black,
  },
  deleteItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteText: {
    color: '#ff3b30',
  },
  cancelItem: {
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.black,
  }
});
