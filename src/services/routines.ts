import { supabase } from '../lib/supabase';
import { rowsToBlocks, blocksToRows } from '../lib/routineTransforms';
import { RoutineDetail, RoutineExerciseRow, Block } from '../types/routine';

export async function loadRoutineAndBlocks(routineId: string): Promise<{
  routine: RoutineDetail;
  blocks: Block[];
}> {
  const { data: routineData, error: rErr } = await supabase
    .from('routines')
    .select('id, title')
    .eq('id', routineId)
    .single();

  if (rErr || !routineData) throw rErr || new Error('Rutina no encontrada');

  const { data: exRows, error: eErr } = await supabase
    .from('routine_exercises')
    .select(`
      routine_id,
      exercise_id,
      sets,
      reps,
      rest_seconds,
      order_index,
      reps_by_set,
      weight_by_set,
      exercises(name,image_url)
    `)
    .eq('routine_id', routineId)
    .order('order_index');

  if (eErr) throw eErr;

  const rows = (exRows || []) as RoutineExerciseRow[];
  return {
    routine: { id: routineData.id, title: routineData.title },
    blocks: rowsToBlocks(rows),
  };
}

export async function saveRoutineBlocks(routineId: string, blocks: Block[]): Promise<void> {
  // limpia
  const { error: delErr } = await supabase
    .from('routine_exercises')
    .delete()
    .eq('routine_id', routineId);
  if (delErr) throw delErr;

  // inserta
  const rows = blocksToRows(blocks, routineId);
  if (rows.length) {
    const { error: insErr } = await supabase.from('routine_exercises').insert(rows as any);
    if (insErr) throw insErr;
  }
}
