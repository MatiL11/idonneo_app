import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Board {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
  cover_image_url?: string;
}

export const useBoards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Obtener todos los tableros del usuario
  const fetchBoards = useCallback(async () => {
    try {
      console.log('🔍 Iniciando fetchBoards...');
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('👤 Usuario autenticado:', user.id);

      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('📋 Tableros obtenidos:', data?.length || 0);
      console.log('📊 Datos recibidos:', data);
      setBoards(data || []);
      setHasInitialized(true);
    } catch (err) {
      console.error('❌ Error en fetchBoards:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener tableros');
    } finally {
      setLoading(false);
      console.log('✅ fetchBoards completado');
    }
  }, []);

  // Crear un nuevo tablero
  const createBoard = useCallback(async (title: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('boards')
        .insert([
          {
            title,
            description,
            user_id: user.id,
            is_public: false
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Agregar el nuevo tablero al estado
      setBoards(prev => [data, ...prev]);
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tablero');
      console.error('Error creating board:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar un tablero
  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) {
        throw error;
      }

      // Remover el tablero del estado
      setBoards(prev => prev.filter(board => board.id !== boardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar tablero');
      console.error('Error deleting board:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    boards,
    loading,
    error,
    hasInitialized,
    createBoard,
    deleteBoard,
    fetchBoards
  };
};
