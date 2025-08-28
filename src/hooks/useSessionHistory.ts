import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CompletedSession {
  id: string;
  routine_id: string;
  routine_title?: string;
  started_at: string;
  completed_at: string;
  total_duration_minutes: number;
  warmup_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface SessionBlock {
  id: string;
  block_order: number;
  block_type: 'single' | 'superset';
  sets_completed: number;
  rest_seconds: number;
}

export interface SessionExercise {
  id: string;
  exercise_id: string;
  exercise_name?: string;
  exercise_image_url?: string;
  exercise_order: number;
  sets_completed: number;
  reps_per_set: number[];
  weight_per_set: number[];
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuario no autenticado');

      const { data, error: fetchError } = await supabase
        .from('completed_sessions')
        .select(`
          *,
          routines:routine_id(title)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const sessionsWithTitles = data?.map(session => ({
        ...session,
        routine_title: session.routines?.title || 'Rutina sin título'
      })) || [];

      setSessions(sessionsWithTitles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      // Obtener bloques de la sesión
      const { data: blocks, error: blocksError } = await supabase
        .from('session_blocks')
        .select('*')
        .eq('session_id', sessionId)
        .order('block_order');

      if (blocksError) throw blocksError;

      // Obtener ejercicios de cada bloque
      const blocksWithExercises = await Promise.all(
        blocks.map(async (block) => {
          const { data: exercises, error: exercisesError } = await supabase
            .from('session_exercises')
            .select(`
              *,
              exercises:exercise_id(name, image_url)
            `)
            .eq('session_block_id', block.id)
            .order('exercise_order');

          if (exercisesError) throw exercisesError;

          return {
            ...block,
            exercises: exercises.map(ex => ({
              ...ex,
              exercise_name: ex.exercises?.name || 'Ejercicio sin nombre',
              exercise_image_url: ex.exercises?.image_url
            }))
          };
        })
      );

      return blocksWithExercises;
    } catch (err) {
      console.error('Error fetching session details:', err);
      throw err;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Eliminar en cascada: ejercicios -> bloques -> sesión
      const { error: deleteError } = await supabase
        .from('completed_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) throw deleteError;

      // Actualizar la lista local
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    fetchSessionDetails,
    deleteSession,
    refresh: fetchSessions
  };
}
