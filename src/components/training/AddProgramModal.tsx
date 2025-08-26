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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII } from '../../styles/tokens';
import { Routine as BaseRoutine } from '../../hooks/useRoutines';

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
  weekday: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  routine_id: string | null;
  isRest: boolean;
};

interface AddProgramModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    days: Array<{
      weekday: number;
      routine_id: string | null;
      is_rest: boolean;
    }>;
  }) => Promise<void>;
  routines: Routine[];
  saving?: boolean;
}

export default function AddProgramModal({
  visible,
  onClose,
  onSubmit,
  routines = [],
  saving = false,
}: AddProgramModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [localRoutines, setLocalRoutines] = useState<Routine[]>([]);
  const [programDays, setProgramDays] = useState<ProgramDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Actualiza las rutinas locales cuando se reciben nuevas
  useEffect(() => {
    setLocalRoutines(routines.map(routine => ({ ...routine, selected: false })));
  }, [routines]);

  // Inicializa los días de la semana
  useEffect(() => {
    const days: ProgramDay[] = [];
    for (let i = 1; i <= 7; i++) {
      days.push({
        weekday: i,
        routine_id: null,
        isRest: false
      });
    }
    setProgramDays(days);
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocalRoutines(routines.map(routine => ({ ...routine, selected: false })));
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
  };

  // Maneja la selección de rutina para un día específico
  const handleSelectRoutine = (dayIndex: number, routineId: string) => {
    setProgramDays(prev => 
      prev.map((day, i) => 
        i === dayIndex 
          ? { ...day, routine_id: routineId, isRest: false } 
          : day
      )
    );
  };

  // Maneja el toggle de día de descanso
  const handleToggleRest = (dayIndex: number) => {
    setProgramDays(prev => 
      prev.map((day, i) => 
        i === dayIndex 
          ? { ...day, isRest: !day.isRest, routine_id: day.isRest ? null : day.routine_id } 
          : day
      )
    );
  };

  const handleSubmit = async () => {
    if (!title) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el programa');
      return;
    }
    
    const hasRoutineOrRest = programDays.some(day => day.routine_id || day.isRest);
    if (!hasRoutineOrRest) {
      Alert.alert('Error', 'Debes asignar al menos una rutina o día de descanso');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        days: programDays.map(day => ({
          weekday: day.weekday,
          routine_id: day.isRest ? null : day.routine_id,
          is_rest: day.isRest
        }))
      });
      
      resetForm();
    } catch (error) {
      console.error('Error al crear programa:', error);
      Alert.alert('Error', 'No se pudo crear el programa. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Programa</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isLoading || saving}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalBody} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text style={styles.sectionTitle}>Información básica</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del programa*</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Programa Semanal"
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Breve descripción del programa"
                value={description}
                onChangeText={setDescription}
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
                          // Aquí iría la lógica para abrir un selector de rutinas
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
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, isLoading || saving ? styles.buttonDisabled : {}]}
              onPress={handleSubmit}
              disabled={isLoading || saving}
            >
              {isLoading || saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Crear Programa</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    height: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: COLORS.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 16,
    marginBottom: 8,
    color: COLORS.black,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  routineDropdownText: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: COLORS.black,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
