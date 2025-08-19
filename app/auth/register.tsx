import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { SocialButton } from '../../src/components/auth/SocialButton';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { profileExists } from '../../src/lib/profiles';

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);
  
  // Crear perfil automáticamente al cargar la pantalla
  React.useEffect(() => {
    if (session?.user) {
      checkAndCreateProfile();
    }
  }, []);
  
  // Primero verificar si el perfil ya existe para evitar duplicados
  const checkAndCreateProfile = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      // Verificar primero si ya existe un perfil para este usuario
      const exists = await profileExists(session.user.id);
      
      if (exists) {
        console.log('El perfil ya existe, redirigiendo al inicio...');
        setIsLoading(false);
        router.replace('/');
      } else {
        // Si no existe perfil, proceder a crearlo
        handleCreateProfile();
      }
    } catch (error) {
      console.error('Error al verificar perfil:', error);
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Iniciando creación de perfil...");

      if (!session?.user) {
        console.log("Error: No hay sesión de usuario");
        Alert.alert('Error', 'No se pudo obtener la información del usuario');
        return;
      }

      // Extraer metadatos del usuario y asegurar que no haya valores nulos
      const userData = session.user.user_metadata || {};
      console.log("Metadatos de usuario:", userData);
      
      // Manejar diferentes formatos posibles de nombre completo
      let firstName = '';
      let lastName = '';
      
      if (userData.full_name) {
        const nameParts = userData.full_name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else if (userData.name) {
        const nameParts = userData.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // Obtener un nombre de usuario válido y único
      // Generamos un sufijo más complejo para reducir la probabilidad de colisiones
      const timestamp = Date.now().toString().slice(-6);
      const randomString = Math.random().toString(36).substring(2, 6);
      let baseUsername = userData.name || userData.email?.split('@')[0] || `user`;
      // Normalizar el username: quitar espacios y caracteres especiales
      baseUsername = baseUsername.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      // Crear un username único combinando base + timestamp + random
      const username = `${baseUsername}_${timestamp}_${randomString}`;
      
      console.log("Datos procesados:", { firstName, lastName, username });

      // Crear el perfil del usuario
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: session.user.id,
            username: username,
            first_name: firstName,
            last_name: lastName,
            avatar_url: userData.avatar_url || null,
          }
        ]);

      if (createError) {
        console.error('Error creating profile:', createError);
        
        // Comprobar si el error es porque el perfil ya existe
        if (createError.code === '23505') { // Código de error de duplicado en PostgreSQL
          console.log('Detectado nombre de usuario duplicado o clave primaria duplicada...');
          
          // Verificar si ya existe un perfil para este usuario por ID
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (existingProfile) {
            console.log('El perfil ya existe para este ID, redirigiendo...');
            // Redirigimos directamente sin mostrar alerta para evitar duplicación
            router.replace('/');
            return;
          } else {
            // Si no existe un perfil con este ID pero hay conflicto de username, intentamos con otro username
            console.log('Intentando crear perfil con otro username único...');
            // Generamos un username más único para evitar colisiones
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 10);
            const retryUsername = `user_${randomId}_${timestamp.toString().slice(-6)}`;
            
            const { error: retryError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  username: retryUsername,
                  first_name: firstName,
                  last_name: lastName,
                  avatar_url: userData.avatar_url || null,
                }
              ]);
              
            if (retryError) {
              console.error('Error en segundo intento:', retryError);
              setError(`No se pudo crear el perfil: ${retryError.message || 'Error desconocido'}`);
              Alert.alert('Error', 'No se pudo crear el perfil después de varios intentos');
              return;
            } else {
              console.log('Perfil creado exitosamente en segundo intento');
              // Eliminamos la alerta duplicada y solo redirigimos directamente
              router.replace('/');
              return;
            }
          }
        }
        
        setError(`No se pudo crear el perfil: ${createError.message || 'Error desconocido'}`);
        Alert.alert('Error', 'No se pudo crear el perfil');
        return;
      }

      console.log('Perfil creado exitosamente');
      // Eliminamos la alerta duplicada y solo redirigimos directamente
      router.replace('/');
    } catch (error: any) {
      console.error('Error en registro:', error);
      setError(`Error: ${error?.message || 'Ocurrió un error durante el registro'}`);
      Alert.alert('Error', 'Ocurrió un error durante el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Creá tu cuenta</Text>
          <Text style={styles.subtitle}>
            y comenzá tu viaje hacia una vida más saludable
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Estás registrándote con:
          </Text>
          <Text style={styles.emailText}>
            {session?.user?.email || "Cargando..."}
          </Text>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Creando tu perfil...</Text>
            </View>
          ) : (
            <SocialButton
              provider={session?.user?.app_metadata?.provider === 'facebook' ? 'facebook' : 'google'}
              onPress={handleCreateProfile}
              isLoading={isLoading}
              text="Confirmar registro"
            />
          )}
        </View>

        <View style={styles.manualRegisterContainer}>
          <Text style={styles.manualRegisterText}>¿Prefieres registrarte manualmente?</Text>
          <Link href="/auth/manual-register" replace={true} asChild>
            <TouchableOpacity>
              <Text style={styles.manualRegisterLink}>Crear cuenta con email</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  infoContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF10',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  emailText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  manualRegisterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    flexWrap: 'wrap',
  },
  manualRegisterText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 6,
  },
  manualRegisterLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
});
