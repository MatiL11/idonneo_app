import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { supabase } from '../../../src/lib/supabase';
import SelectExerciseModal from '../../../src/components/training/SelectExerciseModal';

type RoutineExerciseRow = {
  routine_id: string;
  exercise_id: number;
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
  exercises?: { name?: string; image_url?: string | null } | null;
};

type RoutineDetail = {
  id: string;
  title: string;
};

type BlockType = 'single' | 'superset';
type BlockExercise = {
  exercise_id: number;
  name: string;
  image_url?: string | null;
  reps: number;
  sets: number; // series individuales por ejercicio (siempre requerido)
};
type Block = {
  id: string;
  type: BlockType;
  sets: number;
  rest_seconds: number;
  order_index: number;
  exercises: BlockExercise[]; // single: 1; superset: 2+
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const routineId = id as string;

  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // UI / diseño
  const [rounds, setRounds] = useState(1);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null); // para agregar ejercicio a un bloque

  // Cargar rutina + ejercicios y convertir a bloques
  useEffect(() => {
    console.log('useEffect triggered, id:', id, 'routineId:', routineId);
    if (!routineId || typeof routineId !== 'string') {
      console.log('routineId is invalid:', routineId);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        console.log('Starting to load routine...');
        setLoading(true);

        const { data: routineData, error: rErr } = await supabase
          .from('routines')
          .select('id, title')
          .eq('id', routineId)
          .single();

        console.log('Routine query result:', { routineData, rErr });
        if (rErr) throw rErr;
        setRoutine({ id: routineData.id, title: routineData.title });

        // Default rounds to 1
        setRounds(1);

        const { data: exRows, error: eErr } = await supabase
          .from('routine_exercises')
          .select(
            `
            routine_id,
            exercise_id,
            sets,
            reps,
            rest_seconds,
            order_index,
            exercises(name, image_url)
          `
          )
          .eq('routine_id', routineId)
          .order('order_index');

        console.log('Exercises query result:', { exRows, eErr });
        if (eErr) throw eErr;

        const rows = (exRows || []) as RoutineExerciseRow[];

        // Transformo filas → bloques (cada fila = bloque single por ahora)
        const asBlocks: Block[] = rows.map((row) => ({
          id: uid(),
          type: 'single',
          sets: row.sets || 3,
          rest_seconds: row.rest_seconds || 90,
          order_index: row.order_index ?? 0,
          exercises: [
            {
              exercise_id: row.exercise_id,
              name: row.exercises?.name || 'Ejercicio',
              image_url: row.exercises?.image_url || null,
              reps: row.reps || 10,
              sets: row.sets || 3, // Series independientes del ejercicio, inicialmente iguales al bloque
            },
          ],
        }));

        setBlocks(asBlocks);
        console.log('Successfully loaded blocks:', asBlocks);
      } catch (err) {
        console.error('Error in routine loading:', err);
        Alert.alert('Error', 'No se pudo cargar la rutina');
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    })();
  }, [routineId]);

  const rangeLabel = useMemo(() => {
    const d = dayjs();
    return d.format('DD MMM YYYY');
  }, []);

  // ───────────── Handlers de bloque / ejercicios
  const addBlock = (exercise: any) => {
    const order = blocks.length ? Math.max(...blocks.map((b) => b.order_index)) + 1 : 0;
    const newBlock: Block = {
      id: uid(),
      type: 'single',
      sets: 3,
      rest_seconds: 90,
      order_index: order,
      exercises: [
        {
          exercise_id: exercise.id,
          name: exercise.name || 'Ejercicio',
          image_url: exercise.image_url || null,
          reps: 10,
          sets: 3, // Series independientes del ejercicio
        },
      ],
    };
    setBlocks((b) => [...b, newBlock]);
  };

  const convertToSuperset = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId && b.type === 'single'
          ? {
              ...b,
              type: 'superset',
              // deja el ejercicio existente y agrega un "slot vacío" a completar
              exercises: [...b.exercises, { exercise_id: -1, name: 'Elegir ejercicio', reps: 10, sets: 3 }],
            }
          : b
      )
    );
  };

  const openAddExerciseToBlock = (blockId: string) => {
    setTargetBlockId(blockId);
    setShowExerciseModal(true);
  };

  const handleSelectExercise = (exercise: any) => {
    if (!targetBlockId) {
      // agregar bloque nuevo (desde botón inferior)
      addBlock(exercise);
      setShowExerciseModal(false);
      return;
    }

    // completar slot en superset o agregar uno más
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== targetBlockId) return b;
        const hasPlaceholder = b.exercises.some((ex) => ex.exercise_id === -1);
        const exObj: BlockExercise = {
          exercise_id: exercise.id,
          name: exercise.name || 'Ejercicio',
          image_url: exercise.image_url || null,
          reps: 10,
          sets: 3, // Series independientes del ejercicio
        };
        return {
          ...b,
          exercises: hasPlaceholder
            ? b.exercises.map((ex) => (ex.exercise_id === -1 ? exObj : ex))
            : [...b.exercises, exObj],
        };
      })
    );

    setTargetBlockId(null);
    setShowExerciseModal(false);
  };

  const updateBlockSets = (blockId: string, delta: number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, sets: Math.max(1, b.sets + delta) } : b))
    );
  };

  const updateBlockRest = (blockId: string, deltaSec: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              rest_seconds: Math.min(600, Math.max(30, b.rest_seconds + deltaSec)),
            }
          : b
      )
    );
  };

  const updateExerciseReps = (blockId: string, exerciseIndex: number, newReps: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              exercises: b.exercises.map((ex, idx) =>
                idx === exerciseIndex ? { ...ex, reps: Math.max(1, newReps) } : ex
              ),
            }
          : b
      )
    );
  };

  const updateExerciseSets = (blockId: string, exerciseIndex: number, newSets: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              exercises: b.exercises.map((ex, idx) =>
                idx === exerciseIndex ? { ...ex, sets: Math.max(1, newSets) } : ex
              ),
            }
          : b
      )
    );
  };

  const applyDefaultSetsToAll = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              exercises: b.exercises.map((ex) => ({ ...ex, sets: b.sets })),
            }
          : b
      )
    );
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const removeExerciseInBlock = (blockId: string, index: number) => {
    setBlocks((prev) =>
      prev
        .map((b) => {
          if (b.id !== blockId) return b;
          const copy = { ...b, exercises: b.exercises.filter((_, i) => i !== index) };
          // si era superset y queda 1 solo, pasa a single
          if (copy.type === 'superset' && copy.exercises.length <= 1) {
            copy.type = 'single';
          }
          return copy;
        })
        .filter(Boolean) as Block[]
    );
  };

  // Guardar: aplano bloques → filas
  const handleSaveRoutine = async () => {
    try {
      if (!routine) return;
      // opcional: guardar rounds si tenés columna en routines
      await supabase.from('routines').update({ rounds }).eq('id', routine.id);

      // Borro todas las filas actuales y cargo desde cero (sencillo y robusto)
      await supabase.from('routine_exercises').delete().eq('routine_id', routine.id);

      const rows: RoutineExerciseRow[] = [];
      let order = 0;
      for (const b of blocks) {
        if (b.type === 'single') {
          const ex = b.exercises[0];
          rows.push({
            routine_id: routine.id,
            exercise_id: ex.exercise_id,
            sets: ex.sets || b.sets, // usar series individuales si están definidas
            reps: ex.reps,
            rest_seconds: b.rest_seconds,
            order_index: order++,
          });
        } else {
          // superset: empujo cada ejercicio con mismo descanso/sets, manteniendo el orden
          for (const ex of b.exercises) {
            if (ex.exercise_id === -1) continue; // slot vacío
            rows.push({
              routine_id: routine.id,
              exercise_id: ex.exercise_id,
              sets: ex.sets || b.sets, // usar series individuales si están definidas
              reps: ex.reps,
              rest_seconds: b.rest_seconds,
              order_index: order++,
            });
          }
        }
      }

      if (rows.length) {
        const { error } = await supabase.from('routine_exercises').insert(rows);
        if (error) throw error;
      }

      Alert.alert('Listo', 'Rutina guardada correctamente');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la rutina');
    }
  };

  // ───────────── UI
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.center}>
          <Text style={styles.loadingText}>Cargando rutina...</Text>
        </View>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Error' }} />
        <View style={styles.center}>
          <Text style={styles.loadingText}>No se pudo cargar la rutina</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: routine.title }} />

      {/* Header interno con rondas */}
      <View style={styles.headerCard}>
        <Text style={styles.headerLabel}>Rondas</Text>
        <View style={styles.roundsControl}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => setRounds(Math.max(1, rounds - 1))}>
            <Ionicons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.roundValue}>{rounds}</Text>
          <TouchableOpacity style={styles.roundBtn} onPress={() => setRounds(rounds + 1)}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {blocks.map((block) => (
          <View key={block.id} style={styles.blockCard}>
            <View style={styles.blockTop}>
              {block.type === 'superset' ? (
                <Text style={styles.supersetBadge}>SUPERSET</Text>
              ) : (
                <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: '#444' }} />
              )}

              <TouchableOpacity onPress={() => removeBlock(block.id)}>
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Controles de bloque */}
            <View style={styles.controlsRow}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Series por defecto</Text>
                <View style={styles.controlContainer}>
                  <TouchableOpacity style={styles.controlButton} onPress={() => updateBlockSets(block.id, -1)}>
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>{block.sets}</Text>
                  <TouchableOpacity style={styles.controlButton} onPress={() => updateBlockSets(block.id, +1)}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Descanso</Text>
                <View style={styles.controlContainer}>
                  <TouchableOpacity style={styles.controlButton} onPress={() => updateBlockRest(block.id, -30)}>
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.controlValue}>{formatTime(block.rest_seconds)}</Text>
                  <TouchableOpacity style={styles.controlButton} onPress={() => updateBlockRest(block.id, +30)}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Ejercicios del bloque */}
            {block.exercises.map((ex, idx) => (
              <View key={`${block.id}-${idx}`} style={styles.exerciseRow}>
                {/* Imagen del ejercicio */}
                {ex.image_url ? (
                  <Image source={{ uri: ex.image_url }} style={styles.exerciseImg} />
                ) : (
                  <View style={[styles.exerciseImg, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="image" size={20} color="#888" />
                  </View>
                )}
                
                {/* Información y controles del ejercicio */}
                <View style={styles.exerciseContent}>
                  {/* Nombre del ejercicio */}
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  
                  {/* Controles en fila horizontal */}
                  {ex.exercise_id !== -1 ? (
                    <View style={styles.exerciseControlsRow}>
                      {/* Control de series */}
                      <View style={styles.smallControlGroup}>
                        <Text style={styles.smallControlLabel}>Series</Text>
                        <View style={styles.smallControlContainer}>
                          <TouchableOpacity 
                            style={styles.smallControlButton} 
                            onPress={() => updateExerciseSets(block.id, idx, Math.max(1, ex.sets - 1))}
                          >
                            <Ionicons name="remove" size={14} color="#fff" />
                          </TouchableOpacity>
                          <Text style={styles.smallControlValue}>{ex.sets}</Text>
                          <TouchableOpacity 
                            style={styles.smallControlButton} 
                            onPress={() => updateExerciseSets(block.id, idx, ex.sets + 1)}
                          >
                            <Ionicons name="add" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* Control de repeticiones */}
                      <View style={styles.smallControlGroup}>
                        <Text style={styles.smallControlLabel}>Reps</Text>
                        <View style={styles.smallControlContainer}>
                          <TouchableOpacity 
                            style={styles.smallControlButton} 
                            onPress={() => updateExerciseReps(block.id, idx, Math.max(1, ex.reps - 1))}
                          >
                            <Ionicons name="remove" size={14} color="#fff" />
                          </TouchableOpacity>
                          <Text style={styles.smallControlValue}>{ex.reps}</Text>
                          <TouchableOpacity 
                            style={styles.smallControlButton} 
                            onPress={() => updateExerciseReps(block.id, idx, ex.reps + 1)}
                          >
                            <Ionicons name="add" size={14} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* Botón eliminar */}
                {ex.exercise_id !== -1 ? (
                  <TouchableOpacity 
                    onPress={() => removeExerciseInBlock(block.id, idx)} 
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#bbb" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}

            {/* Acciones del bloque */}
            {block.type === 'single' ? (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => convertToSuperset(block.id)}>
                <Text style={styles.secondaryBtnText}>Convertir a Superset</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => openAddExerciseToBlock(block.id)}>
                <Text style={styles.secondaryBtnText}>Agregar ejercicio</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* espacio final para que no lo tape el footer */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Footer fijo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: '#222' }]}
          onPress={() => {
            setTargetBlockId(null); // modo "crear bloque"
            setShowExerciseModal(true);
          }}
        >
          <Text style={styles.footerBtnText}>AGREGAR BLOQUE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#16A34A' }]} onPress={handleSaveRoutine}>
          <Text style={styles.footerBtnText}>GUARDAR RUTINA</Text>
        </TouchableOpacity>
      </View>

      <SelectExerciseModal
        visible={showExerciseModal}
        onClose={() => {
          setTargetBlockId(null);
          setShowExerciseModal(false);
        }}
        onSelectExercise={handleSelectExercise}
      />
    </View>
  );
}

/* ───────────────────── styles ───────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0B' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },

  headerCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLabel: { color: '#111', fontWeight: '800', fontSize: 16 },
  roundsControl: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundValue: { color: '#111', fontWeight: '800', minWidth: 20, textAlign: 'center' },

  blockCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  blockTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  supersetBadge: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.4,
    backgroundColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },

  controlsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  controlGroup: { flex: 1 },
  controlLabel: { color: '#bbb', fontSize: 12, marginBottom: 6 },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2B2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 12,
    minWidth: 60,
    textAlign: 'center',
  },

  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 10,
  },
  exerciseLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  exerciseImg: { 
    width: 60, 
    height: 60, 
    borderRadius: 8,
    backgroundColor: '#333',
  },
  exerciseContent: {
    flex: 1,
    gap: 8,
  },
  exerciseName: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  exerciseControlsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallControlGroup: {
    alignItems: 'center',
  },
  smallControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  smallControlValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 25,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  exerciseMeta: { color: '#9e9e9e', fontSize: 12, marginTop: 2 },
  
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  repsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  smallControlButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  repsLabel: {
    color: '#9e9e9e',
    fontSize: 12,
    fontWeight: '500',
  },
  smallControlLabel: {
    color: '#9e9e9e',
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
  },

  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.4 },
});
