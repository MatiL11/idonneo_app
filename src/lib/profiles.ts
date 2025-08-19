import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      // Si el error es PGRST116, significa que no se encontró el perfil
      // Esto es común después de la autenticación OAuth y no debe tratarse como error crítico
      if (error.code === 'PGRST116') {
        console.log(`No se encontró perfil para el usuario ${userId} - Es posible que sea un nuevo registro`);
        return { profile: null, error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil no encontrado' } };
      }
      throw error;
    }
    
    return { profile: data as Profile, error: null };
  } catch (error: any) {
    console.error('Error al obtener el perfil:', error.message || error);
    return { profile: null, error };
  }
}

/**
 * Verifica si existe un perfil para el ID de usuario proporcionado
 * Útil para comprobar si un usuario necesita completar el registro después de OAuth
 */
export async function profileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el perfil
        return false;
      }
      throw error;
    }
    
    return !!data; // Retorna true si el perfil existe
  } catch (error) {
    console.log('Error al verificar perfil:', error);
    return false;
  }
}
