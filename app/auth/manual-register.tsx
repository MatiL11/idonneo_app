import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { signInWithGoogle, signInWithFacebook } from '../../src/lib/auth';
import { SocialButton } from '../../src/components/auth/SocialButton';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../src/lib/store';

// Inicializa WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function ManualRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
    try {
      setIsSocialLoading(true);
      console.log(`Iniciando login con ${provider}`);
      const response = await (provider === 'google' ? signInWithGoogle() : signInWithFacebook());
      
      if (response.error) {
        console.log('Error en respuesta:', response.error);
        Alert.alert('Error', response.error.message);
        return;
      }
      
      if (response.url) {
        console.log('URL de autenticación:', response.url);
        console.log('Abriendo sesión de autenticación...');
        const result = await WebBrowser.openAuthSessionAsync(
          response.url,
          'idonneoapp://'
        );
        
        console.log('Resultado de autenticación:', result);
        if (result.type === 'success' && result.url) {
          const params = new URL(result.url).hash.substring(1).split('&').reduce((acc, curr) => {
            const [key, value] = curr.split('=');
            acc[key] = decodeURIComponent(value);
            return acc;
          }, {} as Record<string, string>);

          if (params.access_token) {
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              Alert.alert('Error', 'No se pudo iniciar la sesión');
              return;
            }

            if (session) {
              console.log('Sesión establecida correctamente:', session.user);
              
              // Verificar si el usuario tiene un perfil
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError && profileError.code === 'PGRST116') {
                // No se encontró el perfil, lo creamos automáticamente
                try {
                  // Extraemos los datos del perfil de usuario de OAuth
                  const userData = session.user.user_metadata || {};
                  
                  // Asegurar que tenemos valores para todos los campos requeridos
                  const fullName = userData.full_name || userData.name || '';
                  const firstName = fullName.split(' ')[0] || '';
                  const lastName = fullName.split(' ').slice(1).join(' ') || '';
                  
                  // Generar un nombre de usuario único con sufijo aleatorio
                  const randomSuffix = Math.floor(Math.random() * 1000);
                  let baseUsername = userData.name || userData.email?.split('@')[0] || `user`;
                  const username = `${baseUsername.replace(/\s+/g, '_')}_${randomSuffix}`;
                  
                  console.log('Creando perfil con datos:', { 
                    username, firstName, lastName, avatar: userData.avatar_url 
                  });
                  
                  // Crear el perfil del usuario
                  const { error: createError } = await supabase
                    .from('profiles')
                    .insert([
                      {
                        id: session.user.id,
                        username: username,
                        first_name: firstName,
                        last_name: lastName,
                        avatar_url: userData.avatar_url,
                      }
                    ]);

                  if (createError) {
                    console.error('Error creating profile:', createError);
                    
                    // Comprobar si el error es porque el perfil ya existe
                    if (createError.code === '23505') { // Código de error de duplicado en PostgreSQL
                      console.log('Detectado nombre de usuario duplicado, verificando si el perfil existe...');
                      
                      // Verificar si ya existe un perfil para este usuario por ID
                      const { data: existingProfile, error: checkError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                      
                      if (existingProfile) {
                        console.log('El perfil ya existe para este ID, redirigiendo...');
                        setSession(session);
                        router.replace('/');
                        return;
                      } else {
                        // Si no existe un perfil con este ID pero hay conflicto de username, intentamos con otro username
                        console.log('Intentando crear perfil con otro username...');
                        const retryUsername = `user_${session.user.id.substring(0, 8)}_${Date.now().toString().slice(-4)}`;
                        
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
                          Alert.alert('Error', 'No se pudo crear el perfil después de varios intentos');
                          return;
                        } else {
                          console.log('Perfil creado exitosamente en segundo intento');
                          setSession(session);
                          // Redirigir sin mostrar alerta para evitar mensajes duplicados
                          router.replace('/');
                          return;
                        }
                      }
                    }
                    
                    Alert.alert('Error', 'No se pudo crear el perfil');
                    return;
                  }
                  
                  console.log('Perfil creado exitosamente');
                  setSession(session);
                  // Redirigir sin mostrar alerta para evitar mensajes duplicados
                  router.replace('/');
                } catch (error) {
                  console.error('Error al crear perfil:', error);
                  Alert.alert('Error', 'No se pudo crear el perfil de usuario');
                }
                return;
              }

              // Si tiene perfil, procedemos normalmente
              setSession(session);
              router.replace('/');
            }
          }
        } else {
          console.log('Autenticación no exitosa:', result.type);
          Alert.alert('Error', 'No se pudo completar la autenticación');
        }
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      
      // Mostrar un mensaje de error más descriptivo
      let errorMessage = 'Ocurrió un error durante el inicio de sesión';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error de autenticación', errorMessage);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Validar nombre
    if (formData.firstName.trim() === '') {
      newErrors.firstName = 'El nombre es obligatorio';
      isValid = false;
    } else {
      newErrors.firstName = '';
    }

    // Validar apellido
    if (formData.lastName.trim() === '') {
      newErrors.lastName = 'El apellido es obligatorio';
      isValid = false;
    } else {
      newErrors.lastName = '';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
      isValid = false;
    } else {
      newErrors.email = '';
    }

    // Validar contraseña
    if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    } else {
      newErrors.password = '';
    }

    // Confirmar contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Registrar al usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            name: formData.firstName,
          }
        }
      });

      if (authError) {
        console.error('Error al registrar usuario:', authError);
        Alert.alert('Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'No se pudo crear la cuenta');
        return;
      }

      // Crear el perfil del usuario en la tabla profiles
      const username = formData.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
      
      // Primer intento de creación de perfil
      let { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            username: username,
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        ]);

      // Si hay un error, podría ser por duplicidad de username
      if (profileError) {
        console.error('Primer intento fallido al crear perfil:', profileError);
        
        // Intentamos nuevamente con un username más único
        const uniqueUsername = `user_${authData.user.id.substring(0, 8)}_${Date.now()}`;
        
        // Segundo intento con username más único
        const { error: secondAttemptError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: uniqueUsername,
              first_name: formData.firstName,
              last_name: formData.lastName,
            }
          ]);
        
        if (secondAttemptError) {
          console.error('Segundo intento fallido al crear perfil:', secondAttemptError);
          
          // A pesar del error en la creación del perfil, enfocamos el mensaje en verificar el correo
          Alert.alert(
            'Cuenta creada',
            'Tu cuenta ha sido creada. Por favor, verifica tu correo electrónico para activarla y poder iniciar sesión.',
            [
              { text: 'OK', onPress: () => router.replace('/auth/login') }
            ]
          );
          return;
        }
      }

      // Mostrar solo una alerta para evitar mensajes duplicados
      Alert.alert(
        'Registro exitoso',
        'Tu cuenta ha sido creada. Por favor, verifica tu correo electrónico para activar tu cuenta.',
        [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]
      );
    } catch (error) {
      console.error('Error en el registro:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Creá tu cuenta</Text>
              <Text style={styles.subtitle}>
                y comenzá tu viaje hacia una vida más saludable
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={[styles.input, errors.firstName ? styles.inputError : null]}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor="#FFFFFF80"
                  value={formData.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                />
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={[styles.input, errors.lastName ? styles.inputError : null]}
                  placeholder="Ingresa tu apellido"
                  placeholderTextColor="#FFFFFF80"
                  value={formData.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                />
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="Ingresa tu email"
                  placeholderTextColor="#FFFFFF80"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#FFFFFF80"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Contraseña</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirma tu contraseña"
                  placeholderTextColor="#FFFFFF80"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.registerButtonText}>REGISTRARSE</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.orContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>O REGÍSTRATE CON</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialButtonsContainer}>
              <SocialButton
                provider="facebook"
                onPress={() => !isSocialLoading && handleSocialLogin('facebook')}
              />
              <SocialButton
                provider="google"
                onPress={() => !isSocialLoading && handleSocialLogin('google')}
              />
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
              <Link href="/auth/login" replace={true} asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Iniciar sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF20',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 4,
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 6,
  },
  loginLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
    backgroundColor: '#FFFFFF30',
  },
  orText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  socialButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
});
