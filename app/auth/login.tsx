import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Image, Platform } from 'react-native';
import { SocialButton } from '../../src/components/auth/SocialButton';
import { signInWithGoogle, signInWithFacebook, signInWithApple } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import { Session } from '@supabase/supabase-js';
import { logger } from '../../src/lib/logger';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as AppleAuthentication from 'expo-apple-authentication';
import { profileExists } from '../../src/lib/profiles';

// Inicializa WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // Eliminamos estados relacionados con login de email/contraseña
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  
  // Verificar si Sign in with Apple está disponible (solo en iOS)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(
        available => setAppleAuthAvailable(available)
      );
    }
  }, []);

  const handleSocialLogin = async (provider: 'facebook' | 'google' | 'apple') => {
    try {
      // Limpiamos cualquier sesión anterior para evitar conflictos
      await supabase.auth.signOut();
      
      setIsLoading(true);
      logger.log(`Iniciando login con ${provider}`);
      let response;
      if (provider === 'google') {
        response = await signInWithGoogle();
      } else if (provider === 'facebook') {
        response = await signInWithFacebook();
      } else if (provider === 'apple') {
        response = await signInWithApple();
      } else {
        throw new Error(`Proveedor no soportado: ${provider}`);
      }
      
      if (response.error) {
        logger.error('Error en respuesta de autenticación social', response.error);
        
        // Mensajes más específicos según el tipo de error
        const errorMsg = response.error.message || '';
        
        if (errorMsg.includes('email already registered') || 
            errorMsg.includes('already been registered') || 
            errorMsg.includes('already exists') ||
            errorMsg.includes('account conflict')) {
          Alert.alert(
            'Email ya registrado', 
            'Este correo está registrado con otro método de inicio de sesión. Por favor, usa ese método.',
            [
              { text: 'Entendido', style: 'default' }
            ]
          );
        } else if (errorMsg.includes('La autenticación con Apple en desarrollo')) {
          // Error específico de Apple en desarrollo
          Alert.alert('Autenticación con Apple', errorMsg);
        } else {
          // Mensaje de error genérico
          Alert.alert('No se pudo iniciar sesión', 'Hubo un problema al conectar con tu cuenta. Por favor intenta nuevamente.');
        }
        return;
      }
      
      // Para Apple, necesitamos un manejo especial
      if (provider === 'apple') {
        // Si hay un error, lo mostramos
        if (response?.error) {
          Alert.alert(
            "Autenticación con Apple", 
            (response.error as Error).message || "Error durante la autenticación con Apple"
          );
          return;
        }
        
        // Si no hay error ni URL, fue una autenticación nativa exitosa
        if (!response?.url) {
          // Verificamos si tenemos sesión
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            setSession(data.session);
            router.replace('/');
          }
          return;
        }
      }
      // Continuamos con flujo normal para otros casos
      
      if (response?.url) {
        logger.log('URL de autenticación:', response.url);
        logger.log('Abriendo sesión de autenticación...');
        logger.log('============================');
        logger.log('URL para abrir navegador:', response.url);
        
        // Siempre usamos nuestro esquema personalizado para redirección
        const redirectUrl = 'idonneoapp://auth/callback';
        
        logger.log('URL de retorno configurada:', redirectUrl);
        logger.log('============================');
        
        const result = await WebBrowser.openAuthSessionAsync(
          response.url,
          redirectUrl // Siempre usamos nuestro esquema personalizado
        );
        
        logger.log('============================');
        logger.log('RESULTADO DE AUTENTICACIÓN:');
        logger.log('Tipo de resultado:', result.type);
        if ('url' in result) {
          logger.log('URL de retorno:', result.url);
        } else {
          logger.log('No hay URL de retorno en el resultado');
        }
        logger.log('Objeto resultado completo:', JSON.stringify(result, null, 2));
        logger.log('============================');
        // Verificar el tipo de resultado y si contiene una URL
        const isSuccessWithUrl = result.type === 'success' && 'url' in result && result.url;
        
        logger.log('¿Éxito con URL?', isSuccessWithUrl ? 'SÍ' : 'NO');
        
        if (isSuccessWithUrl) {
          try {
            logger.log('============================');
            logger.log('PROCESANDO URL DE RETORNO:');
            logger.log('URL completa de retorno:', result.url);
            
            const url = new URL(result.url);
            logger.log('Protocolo:', url.protocol);
            logger.log('Host:', url.host);
            logger.log('Pathname:', url.pathname);
            logger.log('Search params:', url.search);
            
            // Mostrar todos los parámetros en la URL
            logger.log('Todos los parámetros:');
            url.searchParams.forEach((value, key) => {
              logger.log(`- ${key}: ${value}`);
            });
            
            const authCode = url.searchParams.get('code');
            logger.log('Código de autorización encontrado:', authCode ? 'SÍ' : 'NO');
            logger.log('============================');
            
            if (!authCode) {
              logger.error('No se encontró código de autorización en la URL');
              logger.log('Params en URL:', Array.from(url.searchParams.entries()));
              Alert.alert('Error de autenticación', 'No se pudo completar el inicio de sesión. Intenta nuevamente.');
              return;
            }
            
            logger.log('Código de autorización recibido, intercambiando por tokens...');
            
            // Verificar detalles de la URL para depuración
            logger.log('URL completa:', result.url);
            const urlParams = new URL(result.url).searchParams;
            logger.log('Parámetros en URL:', Array.from(urlParams.entries()));
            
            // Intercambiar el código por tokens con manejo de errores más robusto
            let sessionData;
            try {
              // Aseguramos que tenemos un código limpio sin espacios extra
              const cleanAuthCode = authCode.trim();
              
              // Intentamos el intercambio de código a sesión
              logger.log('Intercambiando código por sesión:', cleanAuthCode);
              const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(cleanAuthCode);
              
              if (sessionError) {
                logger.error('Error setting session', sessionError);
                
                // Si hay un error con el flujo, intentar iniciar sesión desde cero
                if (sessionError.message.includes('invalid flow state')) {
                  Alert.alert(
                    'Error de sesión',
                    'Hubo un problema con la autenticación. ¿Deseas intentar nuevamente?',
                    [
                      {
                        text: 'Cancelar',
                        style: 'cancel'
                      },
                      {
                        text: 'Intentar de nuevo',
                        onPress: () => handleSocialLogin(provider)
                      }
                    ]
                  );
                } else {
                  Alert.alert('Problema de sesión', 'No pudimos iniciar tu sesión. Por favor intenta nuevamente.');
                }
                return;
              }
              
              sessionData = data;
            } catch (exchangeError) {
              logger.error('Error al intercambiar código por sesión:', exchangeError);
              Alert.alert('Problema de conexión', 'Hubo un error al verificar tu identidad. Por favor intenta nuevamente.');
              return;
            }
            
            // Verificar si tenemos una sesión válida
            if (!sessionData || !sessionData.session) {
              logger.error('No se obtuvo una sesión válida');
              Alert.alert('Sesión no disponible', 'No pudimos verificar tu identidad. Por favor intenta iniciar sesión nuevamente.');
              return;
            }
            
            const session = sessionData.session;
            logger.log('Sesión establecida correctamente');
            
            // Verificar si el usuario tiene un perfil
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // No se encontró el perfil - creamos uno automáticamente
              logger.log('Perfil no encontrado, creando automáticamente...');
              
              const profileCreated = await createUserProfile(session);
              
              if (profileCreated) {
                // Perfil creado exitosamente
                logger.log('Perfil creado automáticamente, redirigiendo a inicio');
                setSession(session);
                router.replace('/'); // Redirigir directamente a la página principal
              } else {
                // Error al crear el perfil
                Alert.alert(
                  'Error al crear cuenta',
                  'No pudimos crear tu perfil automáticamente. Por favor intenta nuevamente.',
                  [
                    {
                      text: 'Entendido',
                      style: 'default',
                      onPress: async () => {
                        // Cerrar la sesión ya que no se pudo crear el perfil
                        await supabase.auth.signOut();
                      }
                    }
                  ]
                );
              }
              return;
            }

            // Si tiene perfil, procedemos normalmente
            setSession(session);
            router.replace('/');
          } catch (err) {
            logger.error('Error al procesar la sesión', err);
            Alert.alert('Problema de conexión', 'Hubo un problema al conectar con tu cuenta. Por favor intenta nuevamente.');
          }
        } else {
          logger.error('Autenticación no exitosa', { type: result.type });
          Alert.alert('Autenticación cancelada', 'El proceso de inicio de sesión fue interrumpido. Intenta nuevamente.');
        }
      }
    } catch (error) {
      // Solo registramos el error técnico en la consola
      logger.error('Error en autenticación', error);
      // Mostramos un mensaje amigable al usuario
      Alert.alert('No se pudo iniciar sesión', 'Hubo un problema durante el proceso. Por favor intenta nuevamente más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // No necesitamos las funciones de validación y login con email/contraseña
  // ya que solo permitiremos autenticación social
  
  // Función para crear automáticamente el perfil de un usuario nuevo
  const createUserProfile = async (session: Session) => {
    try {
      logger.log("Iniciando creación de perfil automática...");
      
      if (!session?.user) {
        logger.error("Error: No hay sesión de usuario");
        return false;
      }
      
      // Extraer metadatos del usuario
      const userData = session.user.user_metadata || {};
      logger.log("Metadatos de usuario:", userData);
      
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
      
      // Generar nombre de usuario único
      const timestamp = Date.now().toString().slice(-6);
      const randomString = Math.random().toString(36).substring(2, 6);
      let baseUsername = userData.name || userData.email?.split('@')[0] || `user`;
      // Normalizar el username
      baseUsername = baseUsername.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      // Crear username único
      const username = `${baseUsername}_${timestamp}_${randomString}`;
      
      logger.log("Datos procesados:", { firstName, lastName, username });
      
      // Crear el perfil
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: session.user.id,
            username: username,
            first_name: firstName,
            last_name: lastName,
            avatar_url: userData.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
        
      if (createError) {
        logger.error('Error creating profile:', createError);
        return false;
      }
      
      logger.log('Perfil creado exitosamente');
      return true;
    } catch (error) {
      logger.error('Error en creación de perfil:', error);
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>Estar fuerte</Text>
          <Text style={styles.taglineText}>y saludable</Text>
          <Text style={styles.taglineText}>es fácil,</Text>
          <Text style={styles.taglineText}>si sabés cómo.</Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.socialLoginContainer}>
            <Text style={styles.socialLoginText}>Iniciar sesión</Text>
          </View>
          
          <SocialButton
            provider="facebook"
            onPress={() => !isLoading && handleSocialLogin('facebook')}
          />
          <SocialButton
            provider="google"
            onPress={() => !isLoading && handleSocialLogin('google')}
          />
          
          {Platform.OS === 'ios' && appleAuthAvailable && (
            <SocialButton
              provider="apple"
              onPress={() => !isLoading && handleSocialLogin('apple')}
            />
          )}
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
    alignItems: 'center',
    padding: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  taglineContainer: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    paddingTop: 80,
    width: '90%',
  },
  taglineText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 48,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  socialLoginContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  socialLoginText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
});
