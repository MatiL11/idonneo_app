import { Block, RoutineExerciseRow } from '../types/routine';
import { uid } from '../utils/routine';

export function rowsToBlocks(rows: RoutineExerciseRow[]): Block[] {
  console.log('rowsToBlocks - Datos originales:', rows);
  
  if (!rows || rows.length === 0) return [];
  
  // Agrupar ejercicios por order_index y rest_seconds para detectar supersets
  const groupedExercises = new Map<string, RoutineExerciseRow[]>();
  
  rows.forEach(row => {
    const key = `${row.order_index}_${row.rest_seconds}`;
    if (!groupedExercises.has(key)) {
      groupedExercises.set(key, []);
    }
    groupedExercises.get(key)!.push(row);
  });
  
  // Convertir grupos a bloques
  return Array.from(groupedExercises.values()).map((groupRows) => {
    const firstRow = groupRows[0];
    const isSuperset = groupRows.length > 1;
    
    const exercises = groupRows.map((row) => {
      const convertedRepsBySet = row.reps_by_set ? row.reps_by_set.map(r => parseInt(String(r), 10)) : null;
      const convertedWeightBySet = row.weight_by_set ? row.weight_by_set.map(w => parseInt(String(w), 10)) : null;
      
      console.log(`Ejercicio ${row.exercise_id}:`, {
        original: { reps_by_set: row.reps_by_set, weight_by_set: row.weight_by_set },
        converted: { reps_by_set: convertedRepsBySet, weight_by_set: convertedWeightBySet }
      });
      
      return {
        exercise_id: row.exercise_id,
        name: row.exercises?.name || 'Ejercicio',
        image_url: row.exercises?.image_url || null,
        reps: Number(row.reps) || 10,
        sets: row.sets || 3,
        reps_by_set: convertedRepsBySet || Array(row.sets || 3).fill(Number(row.reps) || 10),
        weight_by_set: convertedWeightBySet || Array(row.sets || 3).fill(0),
      };
    });
    
    return {
      id: uid(),
      type: isSuperset ? 'superset' : 'single',
      sets: firstRow.sets || 3,
      rest_seconds: firstRow.rest_seconds || 90,
      order_index: firstRow.order_index ?? 0,
      exercises: exercises,
    };
  });
}

export function blocksToRows(blocks: Block[], routineId: string): Omit<RoutineExerciseRow, 'exercises'>[] {
  let order = 0;
  return blocks.flatMap((b) => {
    const currentOrder = order++;
    return (b.type === 'single' ? b.exercises.slice(0, 1) : b.exercises)
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
          // Para supersets, todos los ejercicios tienen el mismo order_index
          order_index: currentOrder,
          // Conservar exactamente lo que hay, NO regenerar desde reps
          reps_by_set: ex.reps_by_set,
          weight_by_set: ex.weight_by_set,
        };
      });
  });
}
