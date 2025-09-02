import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface NutritionPlan {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface NutritionPlanDay {
  id: string;
  plan_id: string;
  date: string;
  board_id?: string;
  title?: string;
  description?: string;
  created_at: string;
}

export interface CompletedMeal {
  id: string;
  user_id: string;
  recipe_id?: string;
  board_id?: string;
  meal_type: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'snack';
  consumed_at: string;
  portions_consumed?: number;
  notes?: string;
  created_at: string;
}

export interface MealData {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'snack';
  image: string;
  recipeId?: string;
  recipe?: any;
}

export interface DayPlan {
  date: string;
  meals: MealData[];
}

export const useNutritionPlans = () => {
  const [loading, setLoading] = useState(false);

  const saveNutritionPlan = async (weekPlan: DayPlan[], startDate: string, endDate: string) => {
    try {
      setLoading(true);
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Crear o actualizar el plan de nutrición
      const { data: existingPlan, error: planError } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('start_date', startDate)
        .eq('end_date', endDate)
        .single();

      let planId: string;

      if (existingPlan) {
        // Actualizar plan existente
        const { data: updatedPlan, error: updateError } = await supabase
          .from('nutrition_plans')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingPlan.id)
          .select()
          .single();

        if (updateError) throw updateError;
        planId = updatedPlan.id;
      } else {
        // Crear nuevo plan
        const { data: newPlan, error: createError } = await supabase
          .from('nutrition_plans')
          .insert({
            user_id: user.id,
            start_date: startDate,
            end_date: endDate,
          })
          .select()
          .single();

        if (createError) throw createError;
        planId = newPlan.id;
      }

      // 2. Procesar cada día del plan
      for (const dayPlan of weekPlan) {
        if (dayPlan.meals.length === 0) continue;

        // Crear o actualizar el día del plan
        const { data: existingDay, error: dayError } = await supabase
          .from('nutrition_plan_days')
          .select('*')
          .eq('plan_id', planId)
          .eq('date', dayPlan.date)
          .single();

        let dayId: string;

        if (existingDay) {
          dayId = existingDay.id;
        } else {
          const { data: newDay, error: createDayError } = await supabase
            .from('nutrition_plan_days')
            .insert({
              plan_id: planId,
              date: dayPlan.date,
              title: `Plan del ${new Date(dayPlan.date).toLocaleDateString('es-ES')}`,
            })
            .select()
            .single();

          if (createDayError) throw createDayError;
          dayId = newDay.id;
        }

        // 3. Eliminar comidas existentes para este día
        await supabase
          .from('completed_meals')
          .delete()
          .eq('user_id', user.id)
          .gte('consumed_at', `${dayPlan.date}T00:00:00`)
          .lt('consumed_at', `${dayPlan.date}T23:59:59`);

        // 4. Crear las comidas planificadas
        for (const meal of dayPlan.meals) {
          const mealData: Partial<CompletedMeal> = {
            user_id: user.id,
            meal_type: meal.type,
            consumed_at: `${dayPlan.date}T12:00:00`, // Hora por defecto
            portions_consumed: 1,
            notes: `Planificado: ${meal.name}`,
          };

          // Si la comida tiene una receta asociada
          if (meal.recipeId) {
            mealData.recipe_id = meal.recipeId;
          }

          const { error: mealError } = await supabase
            .from('completed_meals')
            .insert(mealData);

          if (mealError) throw mealError;
        }
      }

      return { success: true, planId };
    } catch (error) {
      console.error('Error al guardar plan de nutrición:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadNutritionPlan = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Cargar las comidas planificadas directamente por rango de fechas
      const { data: meals, error: mealsError } = await supabase
        .from('completed_meals')
        .select(`
          *,
          recipes (
            id,
            title,
            image_url,
            cooking_time,
            portions,
            calories_per_100g,
            protein_per_100g,
            carbs_per_100g,
            fat_per_100g
          )
        `)
        .eq('user_id', user.id)
        .gte('consumed_at', `${startDate}T00:00:00`)
        .lt('consumed_at', `${endDate}T23:59:59`)
        .order('consumed_at');

      if (mealsError) throw mealsError;

      // Organizar las comidas por día
      const mealsByDay: { [date: string]: any[] } = {};
      meals?.forEach(meal => {
        const date = meal.consumed_at.split('T')[0];
        if (!mealsByDay[date]) {
          mealsByDay[date] = [];
        }
        mealsByDay[date].push(meal);
      });

      return { plan: null, days: [], mealsByDay };
    } catch (error) {
      console.error('Error al cargar plan de nutrición:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveNutritionPlan,
    loadNutritionPlan,
  };
};
