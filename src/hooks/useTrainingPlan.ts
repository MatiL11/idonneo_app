import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

export type TrainingPlanDay = {
  date: string; // ISO date
  routine_id: string;
  title?: string;
  description?: string;
};

export type TrainingPlan = {
  id?: string;
  user_id: string;
  start_date: string; // ISO date
  end_date: string; // ISO date
  days: TrainingPlanDay[];
  created_at?: string;
  updated_at?: string;
};

export function useTrainingPlan(userId?: string) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<TrainingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar el plan de entrenamiento actual
  const loadCurrentPlan = useCallback(async (weekStartDate: string) => {
    if (!userId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      // Calculamos el final de la semana
      const endDate = dayjs(weekStartDate).add(6, 'day').format('YYYY-MM-DD');
      
      // Buscamos si ya existe un plan para esta semana
      const { data: planData, error: planError } = await supabase
        .from("training_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("start_date", weekStartDate)
        .eq("end_date", endDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      // Si hay un error pero no es "No se encontraron registros"
      if (planError && planError.code !== 'PGRST116') {
        throw planError;
      }
      
      if (planData) {
        // Si encontramos un plan, cargamos sus días
        const { data: daysData, error: daysError } = await supabase
          .from("training_plan_days")
          .select("*")
          .eq("plan_id", planData.id)
          .order("date", { ascending: true });
        
        if (daysError) throw daysError;
        
        setCurrentPlan({
          ...planData,
          days: daysData || []
        });
        return {
          ...planData,
          days: daysData || []
        };
      } else {
        // Si no hay plan, devolvemos null
        setCurrentPlan(null);
        return null;
      }
    } catch (err: any) {
      console.error("Error al cargar el plan de entrenamiento:", err);
      setError(err?.message || "Error al cargar el plan");
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  // Guardar un plan de entrenamiento
  const savePlan = useCallback(async (plan: Omit<TrainingPlan, 'user_id'>) => {
    if (!userId) throw new Error("No hay usuario");
    
    try {
      setSaving(true);
      
      // Verificamos si ya existe un plan para estas fechas
      let planId = plan.id;
      
      if (!planId) {
        const { data: existingPlan, error: existingError } = await supabase
          .from("training_plans")
          .select("id")
          .eq("user_id", userId)
          .eq("start_date", plan.start_date)
          .eq("end_date", plan.end_date)
          .maybeSingle();
        
        if (existingError && existingError.code !== 'PGRST116') throw existingError;
        
        planId = existingPlan?.id;
      }
      
      if (planId) {
        // Si ya existe, actualizamos
        const { error: updateError } = await supabase
          .from("training_plans")
          .update({
            updated_at: new Date().toISOString()
          })
          .eq("id", planId);
        
        if (updateError) throw updateError;
        
        // Eliminamos todos los días existentes
        const { error: deleteError } = await supabase
          .from("training_plan_days")
          .delete()
          .eq("plan_id", planId);
          
        if (deleteError) throw deleteError;
      } else {
        // Si no existe, creamos uno nuevo
        const { data: newPlan, error: createError } = await supabase
          .from("training_plans")
          .insert({
            user_id: userId,
            start_date: plan.start_date,
            end_date: plan.end_date,
          })
          .select("*")
          .single();
        
        if (createError) throw createError;
        
        planId = newPlan.id;
      }
      
      // Insertamos los días del plan
      if (plan.days.length > 0) {
        const daysToInsert = plan.days.map(day => ({
          plan_id: planId,
          date: day.date,
          routine_id: day.routine_id,
          title: day.title,
          description: day.description
        }));
        
        const { error: daysError } = await supabase
          .from("training_plan_days")
          .insert(daysToInsert);
        
        if (daysError) throw daysError;
      }
      
      // Cargamos el plan actualizado
      return await loadCurrentPlan(plan.start_date);
      
    } catch (err: any) {
      console.error("Error al guardar el plan de entrenamiento:", err);
      setError(err?.message || "Error al guardar el plan");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, loadCurrentPlan]);
  
  return {
    currentPlan,
    loading,
    saving,
    error,
    loadCurrentPlan,
    savePlan
  };
}
