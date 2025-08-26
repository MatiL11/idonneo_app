import { Block, RoutineExerciseRow } from '../types/routine';
import { uid } from '../utils/routine';

export function rowsToBlocks(rows: RoutineExerciseRow[]): Block[] {
  return (rows || []).map((row) => ({
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
}

export function blocksToRows(blocks: Block[], routineId: string): Omit<RoutineExerciseRow, 'exercises'>[] {
  let order = 0;
  return blocks.flatMap((b) =>
    (b.type === 'single' ? b.exercises.slice(0, 1) : b.exercises)
      .filter((ex) => ex.exercise_id !== 'placeholder')
      .map((ex) => {
        // Verificar que tengamos un UUID válido
        if (!ex.exercise_id || typeof ex.exercise_id !== 'string') {
          console.error('ID de ejercicio inválido en blocksToRows:', ex.exercise_id);
          throw new Error(`ID de ejercicio inválido o faltante: ${ex.exercise_id}`);
        }
        
        return {
          routine_id: routineId,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: b.rest_seconds,
          order_index: order++,
        };
      })
  );
}
