import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII } from '../../styles/tokens';
import { Routine as BaseRoutine } from '../../hooks/useRoutines';

// Tipos para el modal unificado
type ModalType = 'exercise' | 'routine' | 'program';

// Extender el tipo Routine para añadir la propiedad 'selected'
type Routine = BaseRoutine & {
  selected?: boolean;
};

// Definimos los tipos de días de la semana
const WEEKDAYS = [
  '', // Índice 0 no usado (para que coincida con weekday 1-7)
  'Lunes', 
  'Martes', 
  'Miércoles', 
  'Jueves', 
  'Viernes', 
  'Sábado',
  'Domingo'
];

type ProgramDay = {
  weekday: number;
  routine_id: string | null;
  isRest: boolean;
};

// Props unificadas para todos los tipos de modal
interface UnifiedModalProps {
  visible: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  saving?: boolean;
  // Props específicas para ejercicios
  onPickImage?: () => Promise<string | null>;
  // Props específicas para programas
  routines?: Routine[];
  // Callbacks unificados
  onSubmit: (payload: any) => Promise<void>;
}

export default function UnifiedModal({
  visible,
  onClose,
  type,
  title,
  saving = false,
  onPickImage,
  routines = [],
  onSubmit,
}: UnifiedModalProps) {
  // Estados para ejercicios
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [muscles, setMuscles] = useState<string[]>(['']);
  const [material, setMaterial] = useState<string[]>(['']);

  // Estados para rutinas
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');

  // Estados para programas
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programDays, setProgramDays] = useState<ProgramDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializa los días de la semana para programas
  useEffect(() => {
    if (type === 'program') {
      const days: ProgramDay[] = [];
      for (let i = 1; i <= 7; i++) {
        days.push({
          weekday: i,
          routine_id: null,
          isRest: false
        });
      }
      console.log('Inicializando días del programa:', days);
      setProgramDays(days);
    }
  }, [type, visible]); // También se ejecuta cuando cambia la visibilidad

  // Debug: ver cuando cambian los días
  useEffect(() => {
    if (type === 'program') {
      console.log('Estado actual de programDays:', programDays);
    }
  }, [programDays, type]);

  // Limpia los campos cuando cambia la visibilidad
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    if (type === 'exercise') {
      setName('');
      setImageUri(null);
      setDescription('');
      setSteps(['']);
      setMuscles(['']);
      setMaterial(['']);
    } else if (type === 'routine') {
      setRoutineTitle('');
      setRoutineDescription('');
    } else if (type === 'program') {
      setProgramTitle('');
      setProgramDescription('');
      // Reinicializar los días de la semana
      const days: ProgramDay[] = [];
      for (let i = 1; i <= 7; i++) {
        days.push({
          weekday: i,
          routine_id: null,
          isRest: false
        });
      }
      setProgramDays(days);
      setIsLoading(false);
    }
  };

  // Funciones para ejercicios
  const handlePick = async () => {
    if (!onPickImage) return;
    const uri = await onPickImage();
    if (uri) setImageUri(uri);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addMuscle = () => setMuscles([...muscles, '']);
  const removeMuscle = (index: number) => setMuscles(muscles.filter((_, i) => i !== index));
  const updateMuscle = (index: number, value: string) => {
    const newMuscles = [...muscles];
    newMuscles[index] = value;
    setMuscles(newMuscles);
  };

  const addMaterial = () => setMaterial([...material, '']);
  const removeMaterial = (index: number) => setMaterial(material.filter((_, i) => i !== index));
  const updateMaterial = (index: number, value: string) => {
    const newMaterial = [...material];
    newMaterial[index] = value;
    setMaterial(newMaterial);
  };

  // Funciones para programas
  const handleSelectRoutine = (dayIndex: number, routineId: string) => {
    setProgramDays(prev => 
      prev.map((day, i) => 
        i === dayIndex 
          ? { ...day, routine_id: routineId, isRest: false } 
          : day
      )
    );
  };

  const handleToggleRest = (dayIndex: number) => {
    setProgramDays(prev => 
      prev.map((day, i) => 
        i === dayIndex 
          ? { ...day, isRest: !day.isRest, routine_id: day.isRest ? null : day.routine_id } 
          : day
      )
    );
  };

  // Función de envío unificada
  const handleSubmit = async () => {
    try {
      if (type === 'exercise') {
        if (!name.trim()) return;
        
        const filteredSteps = steps.filter(step => step.trim() !== '');
        const filteredMuscles = muscles.filter(muscle => muscle.trim() !== '');
        const filteredMaterial = material.filter(item => item.trim() !== '');
        
        await onSubmit({ 
          name: name.trim(), 
          imageUri,
          description: description.trim() || undefined,
          steps: filteredSteps,
          muscles: filteredMuscles,
          material: filteredMaterial
        });
      } else if (type === 'routine') {
        if (!routineTitle.trim() || !routineDescription.trim()) return;
        
        await onSubmit({ 
          title: routineTitle.trim(), 
          description: routineDescription.trim() 
        });
      } else if (type === 'program') {
        if (!programTitle) {
          Alert.alert('Error', 'Por favor ingresa un nombre para el programa');
          return;
        }
        
        const hasRoutineOrRest = programDays.some(day => day.routine_id || day.isRest);
        if (!hasRoutineOrRest) {
          Alert.alert('Error', 'Debes asignar al menos una rutina o día de descanso');
          return;
        }
        
        setIsLoading(true);
        
        await onSubmit({
          title: programTitle.trim(),
          description: programDescription.trim() || undefined,
          days: programDays.map(day => ({
            weekday: day.weekday,
            routine_id: day.isRest ? null : day.routine_id,
            is_rest: day.isRest
          }))
        });
        
        setIsLoading(false);
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      if (type === 'program') setIsLoading(false);
      Alert.alert('Error', 'No se pudo guardar. Por favor intenta de nuevo.');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Renderiza el contenido específico según el tipo
  const renderContent = () => {
    if (type === 'exercise') {
      return (
        <>
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

          <Text style={[styles.label, { marginTop: 16 }]}>Descripción (opcional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe brevemente el ejercicio..."
            placeholderTextColor="#9b9b9b"
            style={[styles.input, styles.descriptionInput]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Pasos del ejercicio</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.fieldRow}>
              <TextInput
                value={step}
                onChangeText={(value) => updateStep(index, value)}
                placeholder={`Paso ${index + 1}`}
                placeholderTextColor="#9b9b9b"
                style={[styles.input, styles.stepInput]}
              />
              {steps.length > 1 && (
                <TouchableOpacity onPress={() => removeStep(index)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addStep} style={styles.addBtn}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.green} />
            <Text style={styles.addBtnText}>Agregar paso</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 16 }]}>Músculos trabajados</Text>
          {muscles.map((muscle, index) => (
            <View key={index} style={styles.fieldRow}>
              <TextInput
                value={muscle}
                onChangeText={(value) => updateMuscle(index, value)}
                placeholder={`Músculo ${index + 1}`}
                placeholderTextColor="#9b9b9b"
                style={[styles.input, styles.stepInput]}
              />
              {muscles.length > 1 && (
                <TouchableOpacity onPress={() => removeMuscle(index)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addMuscle} style={styles.addBtn}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.green} />
            <Text style={styles.addBtnText}>Agregar músculo</Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 16 }]}>Material necesario</Text>
          {material.map((item, index) => (
            <View key={index} style={styles.fieldRow}>
              <TextInput
                value={item}
                onChangeText={(value) => updateMaterial(index, value)}
                placeholder={`Material ${index + 1}`}
                placeholderTextColor="#9b9b9b"
                style={[styles.input, styles.stepInput]}
              />
              {material.length > 1 && (
                <TouchableOpacity onPress={() => removeMaterial(index)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity onPress={addMaterial} style={styles.addBtn}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.green} />
            <Text style={styles.addBtnText}>Agregar material</Text>
          </TouchableOpacity>
        </>
      );
    } else if (type === 'routine') {
      return (
        <>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Entrenamiento de pecho"
            placeholderTextColor="#9b9b9b"
            value={routineTitle}
            onChangeText={setRoutineTitle}
            returnKeyType="next"
            blurOnSubmit={false}
          />
          
          <Text style={[styles.label, {marginTop: 12}]}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.descInput]}
            placeholder="Describe los objetivos de esta rutina"
            placeholderTextColor="#9b9b9b"
            value={routineDescription}
            onChangeText={setRoutineDescription}
            multiline
            numberOfLines={3}
            returnKeyType="default"
          />
        </>
      );
    } else if (type === 'program') {
      return (
        <>
          <Text style={styles.sectionTitle}>Información básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre del programa*</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Programa Semanal"
              value={programTitle}
              onChangeText={setProgramTitle}
              maxLength={50}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripción (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Breve descripción del programa"
              value={programDescription}
              onChangeText={setProgramDescription}
              multiline
              maxLength={200}
            />
          </View>
          
          <Text style={[styles.sectionTitle, {marginTop: 20}]}>Planificación semanal</Text>
          <Text style={styles.sectionSubtitle}>Asigna rutinas a los días de la semana</Text>
          
          <View style={styles.daysContainer}>
            {programDays.map((day, index) => (
              <View key={index} style={styles.dayItem}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>
                    {WEEKDAYS[day.weekday]}
                  </Text>
                  <View style={styles.restToggle}>
                    <Text style={styles.restText}>Descanso</Text>
                    <Switch
                      value={day.isRest}
                      onValueChange={() => handleToggleRest(index)}
                      trackColor={{ false: '#e0e0e0', true: '#AED581' }}
                      thumbColor={day.isRest ? COLORS.green : '#f4f3f4'}
                    />
                  </View>
                </View>
                
                {!day.isRest && (
                  <View style={styles.routineSelector}>
                    <Text style={styles.routineSelectorLabel}>Rutina:</Text>
                    <TouchableOpacity 
                      style={styles.routineDropdown}
                      onPress={() => {
                        const routineOptions = routines.map((routine, idx) => ({
                          label: routine.title,
                          onPress: () => handleSelectRoutine(index, routine.id)
                        }));
                        
                        Alert.alert(
                          "Selecciona una rutina",
                          "",
                          [
                            ...routineOptions.map(option => ({
                              text: option.label,
                              onPress: option.onPress
                            })),
                            {
                              text: "Cancelar",
                              style: "cancel"
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.routineDropdownText}>
                        {day.routine_id 
                          ? routines.find(r => r.id === day.routine_id)?.title || 'Rutina seleccionada' 
                          : 'Seleccionar rutina'}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={COLORS.black} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </>
      );
    }
    return null;
  };

  // Determina si el formulario es válido
  const isFormValid = () => {
    if (type === 'exercise') {
      return name.trim() !== '';
    } else if (type === 'routine') {
      return routineTitle.trim() !== '' && routineDescription.trim() !== '';
    } else if (type === 'program') {
      return programTitle.trim() !== '' && programDays.some(day => day.routine_id || day.isRest);
    }
    return false;
  };

  // Obtiene el texto del botón según el tipo
  const getButtonText = () => {
    if (type === 'exercise') return 'Guardar';
    if (type === 'routine') return 'Guardar';
    if (type === 'program') return 'Crear Programa';
    return 'Guardar';
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
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              bounces={true}
              alwaysBounceVertical={false}
              onScrollBeginDrag={() => Keyboard.dismiss()}
            >
              {renderContent()}
            </ScrollView>
            
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveBtn, (!isFormValid() || saving || isLoading) && styles.saveBtnDisabled]}
                onPress={handleSubmit}
                disabled={!isFormValid() || saving || isLoading}
              >
                {saving || isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>{getButtonText()}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', 
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    height: screenHeight * 0.6, // 60% de la pantalla
    backgroundColor: '#fff',
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
  scrollContent: {
    flex: 1,
    maxHeight: screenHeight * 0.5,
  },
  scrollContentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12, 
    alignItems: 'center', 
    paddingVertical: 12,
  },
  saveText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  label: { 
    fontWeight: '600', 
    color: COLORS.black, 
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    borderWidth: 1, 
    borderColor: '#e2e2e2', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    color: COLORS.black,
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  descInput: {
    height: 100,
    textAlignVertical: 'top',
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
    backgroundColor: '#fafafa',
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
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stepInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  addBtnText: {
    color: COLORS.green,
    fontWeight: '600',
    fontSize: 14,
  },
  descriptionInput: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  // Estilos para programas
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: COLORS.black,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  daysContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
  dayItem: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  restToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restText: {
    marginRight: 8,
    fontSize: 14,
  },
  routineSelector: {
    marginTop: 8,
  },
  routineSelectorLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  routineDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fafafa',
  },
  routineDropdownText: {
    fontSize: 14,
  },
});
