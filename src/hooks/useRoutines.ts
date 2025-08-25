import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string | null;
  created_at: string;
  // Información adicional del ejercicio cuando hacemos un join
  exercise?: {
    id: string;
    name: string;
    image_url?: string | null;
  };
};

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  exercises?: RoutineExercise[];
};

type AddPayload = { title: string; description?: string | null };

type AddExercisePayload = {
  routine_id: string;
  exercise_id: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
};

export function useRoutines(userId?: string) {
  const [list, setList] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setList(data || []);
    } catch (e: any) {
      setError(e?.message || "Error al cargar rutinas");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async ({ title, description }: AddPayload) => {
      if (!userId) throw new Error("No hay usuario");
      try {
        setSaving(true);

        const { data, error } = await supabase
          .from("routines")
          .insert({ user_id: userId, title, description })
          .select("*")
          .single();

        if (error) throw error;

        setList((prev) => [data as Routine, ...prev]);
        return data as Routine;
      } catch (err) {
        console.error("Error al guardar la rutina:", err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  const remove = useCallback(
    async (routineId: string) => {
      if (!userId) throw new Error("No hay usuario");
      try {
        setSaving(true);

        const { error } = await supabase
          .from("routines")
          .delete()
          .eq("id", routineId)
          .eq("user_id", userId);

        if (error) throw error;

        setList((prev) => prev.filter((routine) => routine.id !== routineId));
        return true;
      } catch (err) {
        console.error("Error al eliminar la rutina:", err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  // Cargar los ejercicios de una rutina específica
  const loadRoutineExercises = useCallback(async (routineId: string) => {
    if (!userId) throw new Error("No hay usuario");
    try {
      setSaving(true);
      
      // Primero verificamos que la rutina pertenezca al usuario
      const { data: routineCheck, error: routineError } = await supabase
        .from("routines")
        .select("id")
        .eq("id", routineId)
        .eq("user_id", userId)
        .single();
        
      if (routineError) throw routineError;
      if (!routineCheck) throw new Error("No tienes acceso a esta rutina");
      
      // Luego obtenemos los ejercicios con su información
      const { data, error } = await supabase
        .from("routine_exercises")
        .select(`
          *,
          exercise:exercise_id (
            id,
            name,
            image_url
          )
        `)
        .eq("routine_id", routineId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      
      // Actualizamos la lista local con los ejercicios cargados
      setList(prev => 
        prev.map(routine => 
          routine.id === routineId 
            ? { ...routine, exercises: data as RoutineExercise[] } 
            : routine
        )
      );
      
      return data as RoutineExercise[];
    } catch (err: any) {
      setError(err?.message || "Error al cargar ejercicios de la rutina");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Añadir un ejercicio a una rutina
  const addExerciseToRoutine = useCallback(async ({
    routine_id,
    exercise_id,
    sets = 3,
    reps = "10",
    rest_seconds = 60,
    notes
  }: AddExercisePayload) => {
    if (!userId) throw new Error("No hay usuario");
    try {
      setSaving(true);
      
      // Obtenemos la posición máxima actual
      const { data: posData } = await supabase
        .from("routine_exercises")
        .select("order_index")
        .eq("routine_id", routine_id)
        .order("order_index", { ascending: false })
        .limit(1);
        
      const nextPosition = posData && posData.length > 0 
        ? posData[0].order_index + 1 
        : 1;
      
      // Insertamos el nuevo ejercicio
      const { data, error } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id,
          exercise_id,
          order_index: nextPosition,
          sets,
          reps,
          rest_seconds,
          notes
        })
        .select(`
          *,
          exercise:exercise_id (
            id,
            name,
            image_url
          )
        `)
        .single();

      if (error) throw error;
      
      // Actualizamos la lista local
      setList(prev => 
        prev.map(routine => {
          if (routine.id !== routine_id) return routine;
          
          const updatedExercises = routine.exercises 
            ? [...routine.exercises, data as RoutineExercise]
            : [data as RoutineExercise];
            
          return {
            ...routine,
            exercises: updatedExercises
          };
        })
      );
      
      return data;
    } catch (err: any) {
      setError(err?.message || "Error al añadir ejercicio a la rutina");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  // Eliminar un ejercicio de una rutina
  const removeExerciseFromRoutine = useCallback(async (
    routineId: string, 
    routineExerciseId: string
  ) => {
    if (!userId) throw new Error("No hay usuario");
    try {
      setSaving(true);
      
      // Eliminamos el ejercicio de la rutina
      const { error } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", routineExerciseId);

      if (error) throw error;
      
      // Actualizamos la lista local
      setList(prev => 
        prev.map(routine => {
          if (routine.id !== routineId || !routine.exercises) return routine;
          
          return {
            ...routine,
            exercises: routine.exercises.filter(ex => ex.id !== routineExerciseId)
          };
        })
      );
      
      return true;
    } catch (err: any) {
      setError(err?.message || "Error al eliminar ejercicio de la rutina");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return { 
    list, 
    loading, 
    saving, 
    error, 
    load, 
    add, 
    remove, 
    loadRoutineExercises,
    addExerciseToRoutine,
    removeExerciseFromRoutine
  };
}
