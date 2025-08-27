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
          reps_by_set: Array(3).fill(10),
          weight_by_set: Array(3).fill(0),
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
              exercises: [...b.exercises, { exercise_id: 'placeholder', name: 'Elegir ejercicio', reps: 10, sets: b.sets, reps_by_set: Array(b.sets).fill(10), weight_by_set: Array(b.sets).fill(0) }],
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
        
        const exObj = {
          exercise_id: exercise.id,
          name: exercise.name || 'Ejercicio',
          image_url: exercise.image_url || null,
          reps: 10,
          sets: b.sets,
          reps_by_set: Array(b.sets).fill(10),
          weight_by_set: Array(b.sets).fill(0),
        };

        // Para supersets, siempre agregar el ejercicio (reemplazando placeholder si existe)
        if (b.type === 'superset') {
          const hasPlaceholder = b.exercises.some((ex) => ex.exercise_id === 'placeholder');
          return {
            ...b,
            exercises: hasPlaceholder 
              ? b.exercises.map((ex) => (ex.exercise_id === 'placeholder' ? exObj : ex))
              : [...b.exercises, exObj],
          };
        }
        
        // Para bloques single, reemplazar el ejercicio existente
        return {
          ...b,
          exercises: [exObj],
        };
      })
    );
    setTargetBlockId(null);
    setShowExerciseModal(false);
  };

  const updateBlockSets = (id: string, delta: number) => {
    console.log(`updateBlockSets: blockId=${id}, delta=${delta}`);
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      const newSets = Math.max(1, b.sets + delta);
      console.log(`Actualizando bloque ${id}: sets ${b.sets} -> ${newSets}`);
      return {
        ...b,
        sets: newSets,
        exercises: b.exercises.map(ex => {
          // Preservar arrays existentes y ajustar su longitud
          let newRepsBySet = ex.reps_by_set;
          let newWeightBySet = ex.weight_by_set;
          
          if (newRepsBySet && newRepsBySet.length !== newSets) {
            if (newSets > newRepsBySet.length) {
              // Agregar series faltantes con el último valor o valor base
              const lastValue = newRepsBySet[newRepsBySet.length - 1] || ex.reps;
              newRepsBySet = [...newRepsBySet, ...Array(newSets - newRepsBySet.length).fill(lastValue)];
            } else {
              // Reducir series, manteniendo las primeras
              newRepsBySet = newRepsBySet.slice(0, newSets);
            }
          }
          
          if (newWeightBySet && newWeightBySet.length !== newSets) {
            if (newSets > newWeightBySet.length) {
              // Agregar series faltantes con el último valor o valor base
              const lastValue = newWeightBySet[newWeightBySet.length - 1] || 0;
              newWeightBySet = [...newWeightBySet, ...Array(newSets - newWeightBySet.length).fill(lastValue)];
            } else {
              // Reducir series, manteniendo las primeras
              newWeightBySet = newWeightBySet.slice(0, newSets);
            }
          }
          
          return {
            ...ex,
            sets: newSets,
            reps_by_set: newRepsBySet,
            weight_by_set: newWeightBySet
          };
        })
      };
    }));
  };

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

  const updateExerciseRepsBySet = (blockId: string, idx: number, setIndex: number, reps: number) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              exercises: b.exercises.map((ex, i) => {
                if (i !== idx) return ex;
                // Crear copia del array existente y actualizar solo el valor específico
                const newRepsBySet = [...ex.reps_by_set];
                newRepsBySet[setIndex] = reps;
                return { ...ex, reps_by_set: newRepsBySet };
              }),
            }
          : b
      )
    );

  const updateExerciseWeightBySet = (blockId: string, idx: number, setIndex: number, weight: number) =>
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              exercises: b.exercises.map((ex, i) => {
                if (i !== idx) return ex;
                // Crear copia del array existente y actualizar solo el valor específico
                const newWeightBySet = [...ex.weight_by_set];
                newWeightBySet[setIndex] = weight;
                return { ...ex, weight_by_set: newWeightBySet };
              }),
            }
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

  const changeExerciseInBlock = (blockId: string, index: number, exercise: ExercisePick) =>
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const exercises = b.exercises.map((ex, i) => 
          i === index 
            ? {
                ...ex,
                exercise_id: exercise.id,
                name: exercise.name || 'Ejercicio',
                image_url: exercise.image_url || null,
              }
            : ex
        );
        return { ...b, exercises };
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
    updateExerciseRepsBySet,
    updateExerciseWeightBySet,
    updateExerciseSets,
    removeExerciseInBlock,
    changeExerciseInBlock,
    removeBlock,
    save,
  };
}
