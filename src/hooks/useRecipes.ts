import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  image_url?: string;
  board_id?: string;
  portions: number;
  ingredients: string;
  instructions?: string;
  notes?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecipeData {
  title: string;
  image_url?: string;
  board_id?: string;
  portions: number;
  ingredients: string[];
  instructions?: string;
  notes?: string;
  is_public?: boolean;
}

export function useRecipes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecipe = useCallback(async (recipeData: CreateRecipeData) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Convertir el array de ingredientes a string para el campo ingredients
      const ingredientsString = recipeData.ingredients
        .filter(ingredient => ingredient.trim() !== '')
        .join('\n');

      // Crear la receta
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipeData.title,
          image_url: recipeData.image_url,
          board_id: recipeData.board_id,
          portions: recipeData.portions,
          ingredients: ingredientsString,
          instructions: recipeData.instructions,
          notes: recipeData.notes,
          is_public: recipeData.is_public || false,
        })
        .select()
        .single();

      if (recipeError) {
        throw recipeError;
      }

      console.log('✅ Receta creada exitosamente:', recipe);
      return recipe;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al crear receta:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipes = useCallback(async (boardId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (boardId) {
        query = query.eq('board_id', boardId);
      }

      const { data: recipes, error: recipesError } = await query;

      if (recipesError) {
        throw recipesError;
      }

      return recipes || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al obtener recetas:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecipe = useCallback(async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      console.log('✅ Receta eliminada exitosamente');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al eliminar receta:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createRecipe,
    fetchRecipes,
    deleteRecipe,
  };
}
