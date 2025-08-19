import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import { useAuthStore } from '../lib/store';

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const session = useAuthStore(state => state.session);

  useEffect(() => {
    async function testConnection() {
      try {
        if (!session?.user) {
          setStatus('error');
          setMessage('No hay usuario autenticado');
          return;
        }

        // Primero intentamos obtener el perfil del usuario
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Si hay un error que no sea "no se encontró el registro"
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        // Si no existe el perfil, notificamos
        if (!data) {
          setStatus('error');
          setMessage('No se encontró una cuenta existente');
          return;
        }

        setStatus('success');
        setMessage('¡Conexión exitosa con Supabase!');
        console.log('Datos recibidos:', data);
      } catch (error) {
        setStatus('error');
        const pgError = error as PostgrestError;
        setMessage(`Error de conexión: ${pgError.message}`);
        console.error('Error:', pgError);
      }
    }

    testConnection();
  }, [session]);

  return (
    <View style={styles.container}>
      <Text style={[
        styles.text,
        status === 'success' ? styles.success : 
        status === 'error' ? styles.error : 
        styles.loading
      ]}>
        {status === 'loading' ? 'Probando conexión...' : message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  loading: {
    color: 'gray',
  },
});
