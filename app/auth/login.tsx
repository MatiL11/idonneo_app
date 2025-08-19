import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Image, TouchableOpacity } from 'react-native';
import { SocialButton } from '../../src/components/auth/SocialButton';
import { signInWithGoogle, signInWithFacebook } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Inicializa WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  const handleSocialLogin = async (provider: 'facebook' | 'google') => {
    try {
      setIsLoading(true);
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
                        router.push('/auth/register');
                      }
                    }
                  ]
                );
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
      Alert.alert('Error', 'Ocurrió un error durante el inicio de sesión');
      console.error('Error en autenticación:', error);
    } finally {
      setIsLoading(false);
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
          <Text style={styles.subtitle}>INICIAR SESIÓN</Text>
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
            <Link href="/auth/manual-register" asChild>
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
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 200,
  },
  taglineContainer: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    marginBottom: 40,
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
});
