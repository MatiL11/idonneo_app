import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SocialButton } from '../../src/components/auth/SocialButton';
import { signInWithGoogle, signInWithFacebook } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import { logger } from '../../src/lib/logger';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Inicializa WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const setSession = useAuthStore((state) => state.setSession);

  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
    try {
      setIsLoading(true);
      logger.log(`Iniciando login con ${provider}`);
      const response = await (provider === 'google' ? signInWithGoogle() : signInWithFacebook());
      
      if (response.error) {
        logger.error('Error en respuesta de autenticación social', response.error);
        // Mensaje de error amigable para el usuario
        Alert.alert('No se pudo iniciar sesión', 'Hubo un problema al conectar con tu cuenta. Por favor intenta nuevamente.');
        return;
      }
      
      if (response.url) {
        logger.log('URL de autenticación:', response.url);
        logger.log('Abriendo sesión de autenticación...');
        const result = await WebBrowser.openAuthSessionAsync(
          response.url,
          'idonneoapp://'
        );
        
        logger.log('Resultado de autenticación:', result);
        if (result.type === 'success' && result.url) {
          try {
            const url = new URL(result.url);
            const authCode = url.searchParams.get('code');
            
            if (!authCode) {
              logger.error('No se encontró código de autorización en la URL');
              Alert.alert('Error de autenticación', 'No se pudo completar el inicio de sesión. Intenta nuevamente.');
              return;
            }
            
            logger.log('Código de autorización recibido, intercambiando por tokens...');
            
            // Intercambiar el código por tokens (esto lo maneja Supabase automáticamente)
            const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(authCode);

            if (sessionError) {
              logger.error('Error setting session', sessionError);
              Alert.alert('Problema de sesión', 'No pudimos iniciar tu sesión. Por favor intenta nuevamente.');
              return;
            }
            
            // Verificar si tenemos una sesión válida
            if (!data || !data.session) {
              logger.error('No se obtuvo una sesión válida');
              Alert.alert('Sesión no disponible', 'No pudimos verificar tu identidad. Por favor intenta iniciar sesión nuevamente.');
              return;
            }
            
            const session = data.session;
            logger.log('Sesión establecida correctamente');
            
            // Verificar si el usuario tiene un perfil
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // No se encontró el perfil
              Alert.alert(
                'Cuenta no encontrada',
                'No encontramos una cuenta existente. ¿Deseas crear una nueva cuenta?',
                [
                  {
                    text: 'Cancelar',
                    style: 'cancel',
                    onPress: async () => {
                      // Cerrar la sesión ya que no tiene perfil
                      await supabase.auth.signOut();
                    }
                  },
                  {
                    text: 'Crear cuenta',
                    onPress: () => {
                      setSession(session); // Guardamos la sesión primero
                      router.replace('/auth/register'); // Usamos replace en lugar de push para evitar acumular historial
                    }
                  }
                ]
              );
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setEmailError(isValid ? '' : 'Ingresa un email válido');
    return isValid;
  };

  const validatePassword = (password: string): boolean => {
    const isValid = password.length >= 6;
    setPasswordError(isValid ? '' : 'La contraseña debe tener al menos 6 caracteres');
    return isValid;
  };

  const handleEmailLogin = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    try {
      setEmailLoginLoading(true);
      
      // Limpiamos cualquier sesión anterior para evitar conflictos
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Solo registramos el error en la consola para depuración
        logger.error('Error al iniciar sesión', error);
        
        // Mensajes más amigables según el tipo de error
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Error de acceso', 'Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert('Cuenta no verificada', 'Por favor confirma tu email antes de iniciar sesión');
        } else {
          // Para cualquier otro error, mostramos un mensaje genérico
          Alert.alert('Error de acceso', 'No se pudo iniciar sesión. Verifica tus datos e intenta nuevamente.');
        }
        return;
      }

      if (data?.session) {
        console.log('Inicio de sesión exitoso con email');
        
        // Verificamos que la sesión tenga tokens válidos
        if (!data.session.access_token || !data.session.refresh_token) {
          console.error('Error: Tokens de sesión inválidos');
          Alert.alert('Error', 'La sesión no contiene tokens válidos');
          return;
        }
        
        // Simplemente establecemos la sesión y redirigimos sin mostrar alertas adicionales
        // para evitar la duplicación de mensajes
        setSession(data.session);
        router.replace('/');
      } else {
        console.error('No se recibió una sesión válida');
        Alert.alert('Error', 'No se recibió información de sesión');
      }
    } catch (error) {
      logger.error('Error inesperado al iniciar sesión', error);
      // Mensaje de error genérico y amigable
      Alert.alert('Problema de conexión', 'No pudimos completar tu solicitud. Por favor, intenta nuevamente más tarde.');
    } finally {
      setEmailLoginLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/idonneo-logo-blanco.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>Estar fuerte</Text>
          <Text style={styles.taglineText}>y saludable</Text>
          <Text style={styles.taglineText}>es fácil,</Text>
          <Text style={styles.taglineText}>si sabés cómo.</Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* Formulario de inicio de sesión con email */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Email"
                placeholderTextColor="#AAAAAA"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Contraseña"
                placeholderTextColor="#AAAAAA"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                onBlur={() => validatePassword(password)}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleEmailLogin}
              disabled={emailLoginLoading}
            >
              {emailLoginLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.orContainer}>
            <View style={styles.divider} />
            <Text style={styles.orText}>O</Text>
            <View style={styles.divider} />
          </View>
          
          <SocialButton
            provider="facebook"
            onPress={() => !isLoading && handleSocialLogin('facebook')}
          />
          <SocialButton
            provider="google"
            onPress={() => !isLoading && handleSocialLogin('google')}
          />
          
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
            <Link href="/auth/manual-register" replace={true} asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Crear cuenta</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    paddingTop: 30,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  taglineContainer: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    paddingLeft: 10,
  },
  taglineText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 6,
  },
  registerLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
    width: '100%',
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFFFFF40',
  },
  orText: {
    color: '#FFFFFF',
    marginHorizontal: 10,
    fontSize: 14,
  },
});
