import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII } from '../../styles/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { name: string; imageUri?: string | null }) => Promise<void>;
  onPickImage: () => Promise<string | null>;
  saving?: boolean;
};

export default function AddExerciseModal({ visible, onClose, onSubmit, onPickImage, saving }: Props) {
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePick = async () => {
    const uri = await onPickImage();
    if (uri) setImageUri(uri);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    console.log('AddExerciseModal: Intentando guardar ejercicio', { name: name.trim(), imageUri });
    try {
      await onSubmit({ name: name.trim(), imageUri });
      console.log('AddExerciseModal: Ejercicio guardado correctamente');
      setName('');
      setImageUri(null);
      onClose();
    } catch (error) {
      console.error('AddExerciseModal: Error al guardar el ejercicio', error);
      alert('Error al guardar el ejercicio. Por favor, intenta de nuevo.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>Nuevo ejercicio</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#111" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. Flexiones de brazos"
                placeholderTextColor="#9b9b9b"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Imagen</Text>
              {imageUri ? (
                <TouchableOpacity onPress={handlePick} style={styles.imageWrap}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handlePick} style={styles.imagePicker}>
                  <Ionicons name="image-outline" size={20} color="#555" />
                  <Text style={styles.imagePickerText}>Elegir de la galería</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                disabled={saving || !name.trim()}
                onPress={handleSave}
                style={[styles.saveBtn, (!name.trim() || saving) && { opacity: 0.6 }]}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', 
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Más espacio en iOS
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { 
    fontWeight: '700', 
    fontSize: 18, 
    color: COLORS.black 
  },
  closeBtn: {
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#efefef',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  label: { 
    fontWeight: '600', 
    color: COLORS.black, 
    marginTop: 6 
  },
  input: {
    borderWidth: 1, 
    borderColor: '#e2e2e2', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    color: COLORS.black,
    backgroundColor: '#fafafa', // Color de fondo más suave
  },
  imagePicker: {
    height: 80, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e2e2',
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8,
    backgroundColor: '#fafafa', // Color de fondo más suave
  },
  imagePickerText: { 
    color: '#444', 
    fontWeight: '600' 
  },
  imageWrap: { 
    height: 120, 
    borderRadius: 12, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#e2e2e2' 
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  saveBtn: {
    marginTop: 18, 
    backgroundColor: COLORS.green, // Cambiamos a verde para mantener consistencia
    borderRadius: 12, 
    alignItems: 'center', 
    paddingVertical: 12,
  },
  saveText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
});
