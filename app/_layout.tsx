import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/lib/store';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Sesión inicial cargada:', session.user.email);
      }
      setSession(session);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        console.log('Estado de autenticación cambiado:', session.user.email);
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
