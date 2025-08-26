import { useEffect, useState } from 'react';
import { loadRoutineAndBlocks, saveRoutineBlocks } from '../services/index';
import { RoutineDetail, Block, BlockType } from '../types/routine';
import { uid } from '../utils/routine';

type ExercisePick = { id: string; name?: string; image_url?: string | null };

export function useRoutineBuilder(routineId?: string) {
  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [rounds, setRounds] = useState(1);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // UI modal destino
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);

  // Carga inicial
  useEffect(() => {
    if (!routineId) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { routine, blocks } = await loadRoutineAndBlocks(routineId);
        if (!alive) return;
        setRoutine(routine);
        setBlocks(blocks);
        setRounds(1);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [routineId]);

  // ── Mutadores de bloques/ejercicios
  const addBlock = (exercise: ExercisePick) => {
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
              exercises: [...b.exercises, { exercise_id: 'placeholder', name: 'Elegir ejercicio', reps: 10, sets: b.sets }],
            }
          : b
      )
    );
  };

  const openAddExerciseToBlock = (blockId: string) => {
    setTargetBlockId(blockId);
    setShowExerciseModal(true);
  };

  const handleSelectExercise = (exercise: ExercisePick) => {
    if (!targetBlockId) {
      addBlock(exercise);
      setShowExerciseModal(false);
      return;
    }
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== targetBlockId) return b;
        const hasPlaceholder = b.exercises.some((ex) => ex.exercise_id === 'placeholder');
        const exObj = {
          exercise_id: exercise.id,
          name: exercise.name || 'Ejercicio',
          image_url: exercise.image_url || null,
          reps: 10,
          sets: b.sets,
        };
        return {
          ...b,
          exercises: hasPlaceholder ? b.exercises.map((ex) => (ex.exercise_id === 'placeholder' ? exObj : ex)) : [...b.exercises, exObj],
        };
      })
    );
    setTargetBlockId(null);
    setShowExerciseModal(false);
  };

  const updateBlockSets = (id: string, delta: number) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, sets: Math.max(1, b.sets + delta) } : b)));

  const updateBlockRest = (id: string, delta: number) =>
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, rest_seconds: Math.max(30, Math.min(600, b.rest_seconds + delta)) } : b))
    );

  const updateExerciseReps = (blockId: string, idx: number, reps: number) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, exercises: b.exercises.map((ex, i) => (i === idx ? { ...ex, reps: Math.max(1, reps) } : ex)) }
          : b
      )
    );

  const updateExerciseSets = (blockId: string, idx: number, sets: number) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, exercises: b.exercises.map((ex, i) => (i === idx ? { ...ex, sets: Math.max(1, sets) } : ex)) }
          : b
      )
    );

  const removeExerciseInBlock = (blockId: string, index: number) =>
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const exercises = b.exercises.filter((_, i) => i !== index);
        const type: BlockType = b.type === 'superset' && exercises.length <= 1 ? 'single' : b.type;
        return { ...b, exercises, type };
      })
    );

  const removeBlock = (blockId: string) => setBlocks((prev) => prev.filter((b) => b.id !== blockId));

  // ── Persistencia
  const save = async () => {
    if (!routine) throw new Error('Rutina no disponible');
    await saveRoutineBlocks(routine.id, blocks);
  };

  return {
    // estado
    routine,
    loading,
    rounds,
    blocks,
    showExerciseModal,
    targetBlockId,

    // setters simples
    setRounds,
    setShowExerciseModal,
    setTargetBlockId,

    // acciones
    addBlock,
    convertToSuperset,
    openAddExerciseToBlock,
    handleSelectExercise,
    updateBlockSets,
    updateBlockRest,
    updateExerciseReps,
    updateExerciseSets,
    removeExerciseInBlock,
    removeBlock,
    save,
  };
}
