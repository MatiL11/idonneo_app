import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

const BUCKET = "recipe-images";

// ---------------- Helpers (copiados de useExercises.ts) ----------------

function guessExt(uri: string) {
  const m = uri.match(/\.(\w+)$/);
  return (m ? m[1] : "jpg").toLowerCase();
}

function mimeFromExt(ext: string) {
  const e = ext.toLowerCase();
  if (e === "png") return "image/png";
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  return "application/octet-stream";
}

/** Decodifica base64 a Uint8Array (robusto, sin dependencias) */
function b64ToBytes(b64: string): Uint8Array {
  // limpiar saltos/espacios/char no base64
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lut = new Uint8Array(256);
  for (let i = 0; i < alphabet.length; i++) lut[alphabet.charCodeAt(i)] = i;

  const len = b64.length;
  let padding = 0;
  if (len >= 2) {
    if (b64[len - 1] === "=") padding++;
    if (b64[len - 2] === "=") padding++;
  }
  const outLen = ((len / 4) * 3) - padding;
  const out = new Uint8Array(outLen);

  let o = 0, i = 0;
  while (i < len) {
    const c1 = lut[b64.charCodeAt(i++)];
    const c2 = lut[b64.charCodeAt(i++)];
    const c3 = lut[b64.charCodeAt(i++)];
    const c4 = lut[b64.charCodeAt(i++)];
    const triple = (c1 << 18) | (c2 << 12) | ((c3 & 63) << 6) | (c4 & 63);
    if (o < outLen) out[o++] = (triple >> 16) & 0xff;
    if (o < outLen) out[o++] = (triple >> 8) & 0xff;
    if (o < outLen) out[o++] = triple & 0xff;
  }
  return out;
}

/** Lee SIEMPRE el file:// en base64 y lo convierte a bytes (evita 0B) */
async function bodyFromUri(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = b64ToBytes(base64);
  console.log("[upload] base64 length:", base64.length, "→ bytes:", bytes.byteLength);
  return bytes;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  step: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  image_url?: string;
  board_id?: string;
  portions: number;
  cooking_time?: string;
  ingredients: string; // JSON string de Ingredient[]
  instructions: string; // JSON string de RecipeStep[]
  notes?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecipeData {
  title: string;
  image_url?: string;
  board_id?: string;
  portions: number;
  cooking_time?: string;
  ingredients: Ingredient[];
  instructions: RecipeStep[];
  notes?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  is_public?: boolean;
}

export interface CreateRecipeWithImageData extends Omit<CreateRecipeData, 'image_url'> {
  imageUri?: string; // URI local de la imagen antes de subir
}

// Helper functions para manejar ingredientes
export const parseIngredients = (ingredientsString: string): Ingredient[] => {
  try {
    const parsed = JSON.parse(ingredientsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback para el formato anterior (string simple)
    return ingredientsString.split('\n')
      .filter(ingredient => ingredient.trim() !== '')
      .map(ingredient => ({
        name: ingredient.trim(),
        amount: 0,
        unit: 'g'
      }));
  }
};

export const formatIngredient = (ingredient: Ingredient): string => {
  return `${ingredient.name} - ${ingredient.amount}${ingredient.unit}`;
};

export const parseSteps = (stepsString: string): RecipeStep[] => {
  try {
    const parsed = JSON.parse(stepsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Fallback para el formato anterior (string simple)
    return stepsString.split('\n')
      .filter(step => step.trim() !== '')
      .map((step, index) => ({
        step: index + 1,
        instruction: step.trim()
      }));
  }
};

export function useRecipes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      // Compatible con tu SDK actual
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      base64: false, // no es necesario, leemos del uri con FileSystem
    });

    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  }, []);

  const uploadToStorage = useCallback(async (localUri: string, uid: string) => {
    try {
      console.log("Subiendo imagen a Supabase Storage…");
      const ext = guessExt(localUri);
      const contentType = mimeFromExt(ext);
      const path = `${uid}/${Date.now()}.${ext}`;

      // 1) leer archivo → bytes (nunca 0B)
      const bytes = await bodyFromUri(localUri);
      if (!bytes.byteLength) throw new Error("El archivo leído tiene 0 bytes");
      console.log("[upload] final body size:", bytes.byteLength);

      // 2) subir ArrayBuffer con contentType correcto
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) {
        console.error("Error al subir archivo:", upErr.message);
        throw upErr;
      }

      // 3) URL del Image CDN (render). No uses HEAD; algunos devuelven 400.
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path, {
        transform: { width: 300, height: 200, resize: "cover", quality: 85 },
      });
      const publicUrl = pub.publicUrl;
      console.log("Imagen subida (render):", publicUrl);

      // Verificación con GET opcional
      try {
        const test = await fetch(publicUrl);
        console.log("GET test", test.status, test.headers.get("content-type"));
      } catch (e) {
        console.warn("No se pudo verificar con GET:", e);
      }

      return publicUrl;
    } catch (err) {
      console.error("Error en uploadToStorage:", err);
      throw err;
    }
  }, []);

  const createRecipe = useCallback(async (recipeData: CreateRecipeData) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Convertir los arrays a JSON strings
      const ingredientsString = JSON.stringify(recipeData.ingredients);
      const instructionsString = JSON.stringify(recipeData.instructions);

      // Crear la receta
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipeData.title,
          image_url: recipeData.image_url,
          board_id: recipeData.board_id,
          portions: recipeData.portions,
          cooking_time: recipeData.cooking_time,
          ingredients: ingredientsString,
          instructions: instructionsString,
          notes: recipeData.notes,
          calories_per_100g: recipeData.calories_per_100g ? parseFloat(recipeData.calories_per_100g.toString()) : null,
          protein_per_100g: recipeData.protein_per_100g ? parseFloat(recipeData.protein_per_100g.toString()) : null,
          carbs_per_100g: recipeData.carbs_per_100g ? parseFloat(recipeData.carbs_per_100g.toString()) : null,
          fat_per_100g: recipeData.fat_per_100g ? parseFloat(recipeData.fat_per_100g.toString()) : null,
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

  const createRecipeWithImage = useCallback(async (recipeData: CreateRecipeWithImageData) => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      let imageUrl: string | undefined;

      // Si hay una imagen, subirla primero
      if (recipeData.imageUri) {
        try {
          imageUrl = await uploadToStorage(recipeData.imageUri, user.id);
        } catch (imgError) {
          console.error("Error al subir la imagen, se guardará sin imagen:", imgError);
        }
      }

      // Convertir los arrays a JSON strings
      const ingredientsString = JSON.stringify(recipeData.ingredients);
      const instructionsString = JSON.stringify(recipeData.instructions);

      // Crear la receta con la URL de la imagen
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: recipeData.title,
          image_url: imageUrl,
          board_id: recipeData.board_id,
          portions: recipeData.portions,
          cooking_time: recipeData.cooking_time,
          ingredients: ingredientsString,
          instructions: instructionsString,
          notes: recipeData.notes,
          calories_per_100g: recipeData.calories_per_100g ? parseFloat(recipeData.calories_per_100g.toString()) : null,
          protein_per_100g: recipeData.protein_per_100g ? parseFloat(recipeData.protein_per_100g.toString()) : null,
          carbs_per_100g: recipeData.carbs_per_100g ? parseFloat(recipeData.carbs_per_100g.toString()) : null,
          fat_per_100g: recipeData.fat_per_100g ? parseFloat(recipeData.fat_per_100g.toString()) : null,
          is_public: recipeData.is_public || false,
        })
        .select()
        .single();

      if (recipeError) {
        throw recipeError;
      }

      console.log('✅ Receta con imagen creada exitosamente:', recipe);
      return recipe;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al crear receta con imagen:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [uploadToStorage]);

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

  const removeRecipeFromBoard = useCallback(async (recipeId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Actualizar la receta para quitar el board_id (ponerlo a null)
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ board_id: null })
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Receta eliminada del tablero exitosamente');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al eliminar receta del tablero:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPublicRecipes = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: recipes, error: searchError } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          image_url,
          cooking_time,
          portions,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          user_id,
          created_at
        `)
        .eq('is_public', true)
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false });

      if (searchError) {
        throw searchError;
      }

      return recipes || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al buscar recetas públicas:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPublicRecipes = useCallback(async (limit: number = 20) => {
    try {
      setLoading(true);
      setError(null);

      const { data: recipes, error: fetchError } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          image_url,
          cooking_time,
          portions,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          user_id,
          created_at
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      return recipes || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al cargar recetas públicas:', errorMessage);
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
    createRecipeWithImage,
    fetchRecipes,
    deleteRecipe,
    removeRecipeFromBoard,
    pickImage,
    uploadToStorage,
    searchPublicRecipes,
    loadPublicRecipes,
  };
}
