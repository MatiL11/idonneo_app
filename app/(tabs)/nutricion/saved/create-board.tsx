import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../../src/styles/tokens';
import { useBoards } from '../../../../src/hooks/useBoards';

export default function CreateBoardScreen() {
  const router = useRouter();
  const { createBoard } = useBoards();
  const [boardTitle, setBoardTitle] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!boardTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el tablero');
      return;
    }

    try {
      setIsCreating(true);
      await createBoard(boardTitle.trim());
      
      // Cerrar el modal y regresar automáticamente
      setIsVisible(false);
      router.back();
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el tablero. Inténtalo de nuevo.');
      console.error('Error creating board:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    router.back();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalContent}>
          {/* Header con botón de cerrar */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Contenido del modal */}
          <View style={styles.modalBody}>
            {/* Campo de texto */}
            <TextInput
              style={styles.titleInput}
              placeholder="Escribe el titulo de tu nuevo tablero"
              placeholderTextColor={COLORS.gray500}
              value={boardTitle}
              onChangeText={setBoardTitle}
              autoFocus={true}
            />

            {/* Botón de crear */}
            <TouchableOpacity 
              style={[
                styles.createButton, 
                (!boardTitle.trim() || isCreating) && styles.createButtonDisabled
              ]} 
              onPress={handleCreate}
              disabled={!boardTitle.trim() || isCreating}
            >
              {isCreating ? (
                <Text style={styles.createButtonText}>Creando...</Text>
              ) : (
                <Text style={styles.createButtonText}>Crear</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    alignItems: 'center',
  },
  titleInput: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
});
