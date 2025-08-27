import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlockExercise } from '../../../types/routine';

type Props = {
  blockId: string;
  index: number;
  exercise: BlockExercise & { weight?: number; repsBySet?: number[]; weightBySet?: number[] };
  onChangeSets: (blockId: string, index: number, sets: number) => void;
  onChangeReps: (blockId: string, index: number, reps: number) => void; // se mantiene para compatibilidad
  onChangeRepsBySet?: (blockId: string, index: number, setIndex: number, reps: number) => void;
  onChangeWeightBySet?: (blockId: string, index: number, setIndex: number, weight: number) => void;
  onRemove: (blockId: string, index: number) => void;
  onChangeExercise?: (blockId: string, index: number) => void;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ExerciseItem({
  blockId,
  index,
  exercise: ex,
  onChangeSets,
  onChangeReps,
  onChangeRepsBySet,
  onChangeWeightBySet,
  onRemove,
  onChangeExercise,
}: Props) {
  const [open, setOpen] = useState(true);
  // Inicializamos arrays por serie (si no vienen desde arriba)
  const baseReps = typeof ex.reps === 'number' ? ex.reps : 0;
  const baseWeight = typeof ex.weight === 'number' ? ex.weight : 0;

  // Estado local para mostrar cambios en tiempo real
  const [localRepsBySet, setLocalRepsBySet] = useState<number[]>(() => {
    return ex.reps_by_set && ex.reps_by_set.length === ex.sets 
      ? ex.reps_by_set 
      : Array(ex.sets).fill(baseReps);
  });
  
  const [localWeightBySet, setLocalWeightBySet] = useState<number[]>(() => {
    return ex.weight_by_set && ex.weight_by_set.length === ex.sets 
      ? ex.weight_by_set 
      : Array(ex.sets).fill(baseWeight);
  });

  // Sincronizar con props cuando cambien
  useEffect(() => {
    if (ex.reps_by_set && ex.reps_by_set.length === ex.sets) {
      setLocalRepsBySet(ex.reps_by_set);
    }
  }, [ex.reps_by_set, ex.sets]);

  useEffect(() => {
    if (ex.weight_by_set && ex.weight_by_set.length === ex.sets) {
      setLocalWeightBySet(ex.weight_by_set);
    }
  }, [ex.weight_by_set, ex.sets]);

  // Ajustar arrays cuando cambie el número de series
  useEffect(() => {
    if (localRepsBySet.length !== ex.sets) {
      setLocalRepsBySet(prev => {
        if (ex.sets > prev.length) {
          const lastValue = prev.length > 0 ? prev[prev.length - 1] : baseReps;
          return [...prev, ...Array(ex.sets - prev.length).fill(lastValue)];
        } else if (ex.sets < prev.length) {
          return prev.slice(0, ex.sets);
        }
        return prev;
      });

      setLocalWeightBySet(prev => {
        if (ex.sets > prev.length) {
          const lastValue = prev.length > 0 ? prev[prev.length - 1] : baseWeight;
          return [...prev, ...Array(ex.sets - prev.length).fill(lastValue)];
        } else if (ex.sets < prev.length) {
          return prev.slice(0, ex.sets);
        }
        return prev;
      });
    }
  }, [ex.sets, baseReps, baseWeight, localRepsBySet.length, localWeightBySet.length]);

  // Usar arrays locales para la UI
  const repsBySet = localRepsBySet;
  const weightBySet = localWeightBySet;

  console.log(`ExerciseItem render: blockId=${blockId}, index=${index}, ex.sets=${ex.sets}, ex.reps=${ex.reps}, repsBySet.length=${repsBySet.length}`);
  console.log(`ExerciseItem - Arrays recibidos:`, {
    ex_reps_by_set: ex.reps_by_set,
    ex_weight_by_set: ex.weight_by_set,
    local_reps_by_set: repsBySet,
    local_weight_by_set: weightBySet
  });


  const animatedToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  const handleEditReps = (setIdx: number, value: string) => {
    const n = Math.max(0, parseInt(value || '0', 10));
    // Actualizar estado local inmediatamente para feedback visual
    setLocalRepsBySet(prev => {
      const copy = [...prev];
      copy[setIdx] = n;
      return copy;
    });
    // Enviar cambio al padre
    if (onChangeRepsBySet) onChangeRepsBySet(blockId, index, setIdx, n);
  };

  const handleEditWeight = (setIdx: number, value: string) => {
    const n = Math.max(0, parseInt(value || '0', 10));
    // Actualizar estado local inmediatamente para feedback visual
    setLocalWeightBySet(prev => {
      const copy = [...prev];
      copy[setIdx] = n;
      return copy;
    });
    // Enviar cambio al padre
    if (onChangeWeightBySet) onChangeWeightBySet(blockId, index, setIdx, n);
  };

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.headerContainer}>
        {/* Imagen del ejercicio */}
        {ex.image_url ? (
          <Image source={{ uri: ex.image_url }} style={styles.exerciseImg} />
        ) : (
          <View style={[styles.exerciseImg, { alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image" size={18} color="#AAA" />
          </View>
        )}

        {/* Nombre del ejercicio y botón de reemplazar */}
        <View style={styles.nameContainer}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {ex.name}
          </Text>
          
          {ex.exercise_id !== 'placeholder' && onChangeExercise && (
            <TouchableOpacity onPress={() => onChangeExercise(blockId, index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="refresh-circle" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {ex.exercise_id !== 'placeholder' && (
        <View style={styles.tableContainer}>
          {/* Tabla de series, repeticiones y peso con botón para desplegar/colapsar */}
          <TouchableOpacity onPress={animatedToggle} style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.3, textAlign: 'center' }]}>Series</Text>
            <Text style={[styles.headerCell, { flex: 0.35 }]}>Repeticiones</Text>
            <Text style={[styles.headerCell, { flex: 0.35 }]}>Peso</Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Filas de la tabla */}
          {open && (
            <View style={styles.tableBody}>
              {Array.from({ length: ex.sets }).map((_, i) => (
                <View key={i} style={styles.row}>
                  <View style={[styles.seriesCol, { flex: 0.3 }]}>
                    <Text style={styles.seriesText}>{`${i + 1}°`}</Text>
                  </View>

                  <View style={[styles.inputCol, { flex: 0.35 }]}>
                    <TextInput
                      value={String(repsBySet[i] ?? 0)}
                      onChangeText={(t) => handleEditReps(i, t)}
                      keyboardType="number-pad"
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9BA0A6"
                    />
                  </View>

                  <View style={[styles.inputCol, { flex: 0.35 }]}>
                    <TextInput
                      value={String(weightBySet[i] ?? 0)}
                      onChangeText={(t) => handleEditWeight(i, t)}
                      keyboardType="number-pad"
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#9BA0A6"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImg: { 
    width: 60, 
    height: 60, 
    borderRadius: 6, 
    backgroundColor: '#444444' 
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  exerciseName: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  tableContainer: {
    marginTop: 12,
  },
  // Cabecera de la tabla
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#595959',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerCell: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 12, 
    textAlign: 'center' 
  },
  tableBody: {
    backgroundColor: '#595959',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  seriesCol: { 
    alignItems: 'center' 
  },
  seriesText: { 
    color: '#FFFFFF', 
    fontWeight: '700' 
  },
  inputCol: {},
  input: {
    height: 32,
    borderRadius: 6,
    backgroundColor: '#3E3E3E',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    textAlign: 'center',
    fontWeight: '700',
    marginHorizontal: 4,
  },
});