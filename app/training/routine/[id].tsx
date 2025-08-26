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
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
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

type RoutineDetail = { id: string; title: string };

type BlockType = 'single' | 'superset';
type BlockExercise = {
  exercise_id: number;
  name: string;
  image_url?: string | null;
  reps: number;
  sets: number;
};
type Block = {
  id: string;
  type: BlockType;
  sets: number;
  rest_seconds: number;
  order_index: number;
  exercises: BlockExercise[];
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const routineId = id as string;

  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [rounds, setRounds] = useState(1);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (!routineId || typeof routineId !== 'string') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);

        const { data: routineData, error: rErr } = await supabase
          .from('routines')
          .select('id, title')
          .eq('id', routineId)
          .single();
        if (rErr) throw rErr;

        setRoutine({ id: routineData.id, title: routineData.title });
        setRounds(1);

        const { data: exRows, error: eErr } = await supabase
          .from('routine_exercises')
          .select(`
            routine_id,
            exercise_id,
            sets,
            reps,
            rest_seconds,
            order_index,
            exercises(name,image_url)
          `)
          .eq('routine_id', routineId)
          .order('order_index');
        if (eErr) throw eErr;

        const rows = (exRows || []) as RoutineExerciseRow[];
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
              sets: row.sets || 3,
            },
          ],
        }));
        setBlocks(asBlocks);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudo cargar la rutina');
      } finally {
        setLoading(false);
      }
    })();
  }, [routineId]);

  useMemo(() => dayjs().format('DD MMM YYYY'), []); // rangeLabel si lo necesitas

  // Handlers
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
          sets: 3,
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
              exercises: [...b.exercises, { exercise_id: -1, name: 'Elegir ejercicio', reps: 10, sets: b.sets }],
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
      addBlock(exercise);
      setShowExerciseModal(false);
      return;
    }
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== targetBlockId) return b;
        const hasPlaceholder = b.exercises.some((ex) => ex.exercise_id === -1);
        const exObj: BlockExercise = {
          exercise_id: exercise.id,
          name: exercise.name || 'Ejercicio',
          image_url: exercise.image_url || null,
          reps: 10,
          sets: b.sets,
        };
        return {
          ...b,
          exercises: hasPlaceholder ? b.exercises.map((ex) => (ex.exercise_id === -1 ? exObj : ex)) : [...b.exercises, exObj],
        };
      })
    );
    setTargetBlockId(null);
    setShowExerciseModal(false);
  };

  const updateBlockSets = (id: string, delta: number) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, sets: Math.max(1, b.sets + delta) } : b)));
  };

  const updateBlockRest = (id: string, delta: number) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, rest_seconds: Math.max(30, Math.min(600, b.rest_seconds + delta)) } : b))
    );
  };

  const updateExerciseReps = (blockId: string, idx: number, reps: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, exercises: b.exercises.map((ex, i) => (i === idx ? { ...ex, reps: Math.max(1, reps) } : ex)) }
          : b
      )
    );
  };

  const updateExerciseSets = (blockId: string, idx: number, sets: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, exercises: b.exercises.map((ex, i) => (i === idx ? { ...ex, sets: Math.max(1, sets) } : ex)) }
          : b
      )
    );
  };

  const removeExerciseInBlock = (blockId: string, index: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const exercises = b.exercises.filter((_, i) => i !== index);
        const type: BlockType = b.type === 'superset' && exercises.length <= 1 ? 'single' : b.type;
        return { ...b, exercises, type };
      })
    );
  };

  const removeBlock = (blockId: string) => setBlocks((prev) => prev.filter((b) => b.id !== blockId));

  const handleSaveRoutine = async () => {
    try {
      if (!routine) return;
      await supabase.from('routine_exercises').delete().eq('routine_id', routine.id);

      let order = 0;
      const rows = blocks.flatMap((b) =>
        (b.type === 'single' ? b.exercises.slice(0, 1) : b.exercises)
          .filter((ex) => ex.exercise_id !== -1)
          .map((ex) => ({
            routine_id: routine.id,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: b.rest_seconds,
            order_index: order++,
          }))
      );

      if (rows.length) {
        const { error } = await supabase.from('routine_exercises').insert(rows as any);
        if (error) throw error;
      }

      Alert.alert('Listo', 'Rutina guardada correctamente');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la rutina');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Cargando…' }} />
        <Text style={styles.loadingText}>Cargando rutina…</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.loadingText}>No se pudo cargar la rutina</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Stack.Screen options={{ title: routine.title, headerShown: false }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333333', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18, flex: 1, textAlign: 'center', marginRight: 32 }}>
          {routine.title?.toUpperCase() || 'NOMBRE DE LA RUTINA'}
        </Text>
      </View>

      {/* Panel blanco */}
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16 }}>
        {/* Píldora de Rondas */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 22,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#e8e8e8',
          }}
        >
          <Text style={{ color: '#333', fontSize: 16, fontWeight: '800' }}>Rondas</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
            <TouchableOpacity
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
              onPress={() => setRounds((r) => Math.max(1, r - 1))}
            >
              <Ionicons name="remove" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ color: '#333', fontWeight: '800', minWidth: 18, textAlign: 'center' }}>{rounds}</Text>
            <TouchableOpacity
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}
              onPress={() => setRounds((r) => r + 1)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {blocks.map((block) => (
            <View key={block.id} style={styles.blockCard}>
              {/* Top (trash) */}
              <View style={styles.blockTop}>
                <TouchableOpacity onPress={() => removeBlock(block.id)}>
                  <Ionicons name="trash" size={18} color="#666" />
                </TouchableOpacity>
              </View>

              {block.type === 'superset' ? <Text style={styles.supersetText}>SUPERSET</Text> : null}

              {/* Controles del bloque */}
              <View style={styles.controlsRow}>
                <View style={styles.controlCol}>
                  <Text style={styles.controlTitle}>Series</Text>
                  <View style={styles.pillControl}>
                    <TouchableOpacity style={styles.circleBtnDark} onPress={() => updateBlockSets(block.id, -1)}>
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.pillValue}>{block.sets}</Text>
                    <TouchableOpacity style={styles.circleBtnDark} onPress={() => updateBlockSets(block.id, +1)}>
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.controlCol}>
                  <Text style={styles.controlTitle}>Descanso</Text>
                  <View style={styles.pillControl}>
                    <TouchableOpacity style={styles.circleBtnDark} onPress={() => updateBlockRest(block.id, -30)}>
                      <Ionicons name="remove" size={18} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.timeWrap}>
                      <Ionicons name="time" size={14} color="#333" />
                      <Text style={styles.timeText}>{fmt(block.rest_seconds)}</Text>
                    </View>
                    <TouchableOpacity style={styles.circleBtnDark} onPress={() => updateBlockRest(block.id, +30)}>
                      <Ionicons name="add" size={18} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Ejercicios */}
              {block.exercises.map((ex, idx) => (
                <View key={`${block.id}-${idx}`} style={styles.exerciseCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {ex.image_url ? (
                      <Image source={{ uri: ex.image_url }} style={styles.exerciseImg} />
                    ) : (
                      <View style={[styles.exerciseImg, { alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="image" size={18} color="#888" />
                      </View>
                    )}

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>

                      {ex.exercise_id !== -1 && (
                        <View style={styles.itemControlsRow}>
                          <View style={styles.itemControlCol}>
                            <Text style={styles.itemLabel}>Series</Text>
                            <View style={styles.itemPill}>
                              <TouchableOpacity
                                style={styles.itemBtn}
                                onPress={() => updateExerciseSets(block.id, idx, Math.max(1, ex.sets - 1))}
                              >
                                <Ionicons name="remove" size={14} color="#333" />
                              </TouchableOpacity>
                              <Text style={styles.itemValue}>{ex.sets}</Text>
                              <TouchableOpacity
                                style={styles.itemBtn}
                                onPress={() => updateExerciseSets(block.id, idx, ex.sets + 1)}
                              >
                                <Ionicons name="add" size={14} color="#333" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={[styles.itemControlCol, { marginLeft: 18 }]}>
                            <Text style={styles.itemLabel}>Reps</Text>
                            <View style={styles.itemPill}>
                              <TouchableOpacity
                                style={styles.itemBtn}
                                onPress={() => updateExerciseReps(block.id, idx, Math.max(1, ex.reps - 1))}
                              >
                                <Ionicons name="remove" size={14} color="#333" />
                              </TouchableOpacity>
                              <Text style={styles.itemValue}>{ex.reps}</Text>
                              <TouchableOpacity
                                style={styles.itemBtn}
                                onPress={() => updateExerciseReps(block.id, idx, ex.reps + 1)}
                              >
                                <Ionicons name="add" size={14} color="#333" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {ex.exercise_id !== -1 ? (
                    <TouchableOpacity onPress={() => removeExerciseInBlock(block.id, idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="#bdbdbd" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              {/* Acción bloque */}
              {block.type === 'single' ? (
                <TouchableOpacity style={styles.outlineBtn} onPress={() => convertToSuperset(block.id)}>
                  <Text style={styles.outlineText}>Convertir a Superset</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.outlineBtn} onPress={() => openAddExerciseToBlock(block.id)}>
                  <Text style={styles.outlineText}>Agregar ejercicio</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, { backgroundColor: '#222' }]}
            onPress={() => {
              setTargetBlockId(null);
              setShowExerciseModal(true);
            }}
          >
            <Text style={styles.footerBtnText}>AGREGAR BLOQUE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#16A34A' }]} onPress={handleSaveRoutine}>
            <Text style={styles.footerBtnText}>GUARDAR RUTINA</Text>
          </TouchableOpacity>
        </View>
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

/* ====================== styles ====================== */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#333', fontSize: 16 },

  blockCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  blockTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  supersetText: {
    color: '#444444',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.6,
  },

  controlsRow: { flexDirection: 'row', marginBottom: 10 },
  controlCol: { flex: 1 },
  controlTitle: { color: '#666666', fontSize: 12, marginBottom: 6 },

  pillControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  circleBtnDark: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  pillValue: { color: '#333', fontWeight: '700', fontSize: 16, minWidth: 24, textAlign: 'center' },

  timeWrap: { flexDirection: 'row', alignItems: 'center' },
  timeText: { color: '#333', fontWeight: '700', fontSize: 16, marginLeft: 6 },

  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0' },
  exerciseName: { color: '#333', fontWeight: '700', fontSize: 16 },

  itemControlsRow: { flexDirection: 'row', marginTop: 8 },
  itemControlCol: { alignItems: 'center' },
  itemLabel: { color: '#666666', fontSize: 10, marginBottom: 4 },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemBtn: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#e0e0e0',
    alignItems: 'center', justifyContent: 'center',
  },
  itemValue: { color: '#333', fontWeight: '700', fontSize: 14, minWidth: 26, textAlign: 'center', marginHorizontal: 8 },

  outlineBtn: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#c0c0c0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineText: { color: '#333', fontWeight: '800' },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 12, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row' },
  footerBtn: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  footerBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.4 },
});
