import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface AddRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; description?: string }) => void;
  saving?: boolean;
}

export default function AddRoutineModal({
  visible,
  onClose,
  onSubmit,
  saving = false,
}: AddRoutineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Limpia los campos al montar o cuando cambia la visibilidad
  useEffect(() => {
    if (visible) {
      // No limpiar al aparecer porque puede interrumpir la experiencia del usuario
    } else {
      // Limpiar al cerrar
      setTitle('');
      setDescription('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    console.log('AddRoutineModal: Intentando guardar rutina', { title, description });
    onSubmit({ title, description: description.trim() });
  };

  const handleClose = () => {
    // Limpiar el estado al cerrar
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{flex: 1}}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva rutina</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#111" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Título *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Entrenamiento de pecho"
                  placeholderTextColor="#9b9b9b"
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    // Solo avanzar al siguiente campo, no enviar el formulario
                  }}
                />
                
                <Text style={[styles.label, {marginTop: 12}]}>Descripción *</Text>
                <TextInput
                  style={[styles.input, styles.descInput]}
                  placeholder="Describe los objetivos de esta rutina"
                  placeholderTextColor="#9b9b9b"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  returnKeyType="default"
                />
              </View>

              <TouchableOpacity
                style={[styles.continueButton, (!title.trim() || !description.trim() || saving) && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!title.trim() || !description.trim() || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', 
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontWeight: '700', 
    fontSize: 18, 
    color: COLORS.black
  },
  closeButton: {
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#efefef',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e2e2', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    color: COLORS.black,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  descInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  continueButton: {
    marginTop: 18, 
    backgroundColor: COLORS.green,
    borderRadius: 12, 
    alignItems: 'center', 
    paddingVertical: 12,
  },
  continueText: {
    color: '#fff', 
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6,
  },
  label: {
    fontWeight: '600', 
    color: COLORS.black, 
    marginBottom: 6,
    fontSize: 16,
  },
});
