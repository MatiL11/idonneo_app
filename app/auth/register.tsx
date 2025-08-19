import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { SocialButton } from '../../src/components/auth/SocialButton';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import { useRouter } from 'expo-router';

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const session = useAuthStore((state) => state.session);

  const handleCreateProfile = async () => {
    try {
      setIsLoading(true);

      if (!session?.user) {
        Alert.alert('Error', 'No se pudo obtener la información del usuario');
        return;
      }

      // Crear el perfil del usuario
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: session.user.id,
            username: session.user.user_metadata.name,
            first_name: session.user.user_metadata.full_name.split(' ')[0],
            last_name: session.user.user_metadata.full_name.split(' ').slice(1).join(' '),
            avatar_url: session.user.user_metadata.avatar_url,
          }
        ]);

      if (createError) {
        console.error('Error creating profile:', createError);
        Alert.alert('Error', 'No se pudo crear el perfil');
        return;
      }

      console.log('Perfil creado exitosamente');
      router.replace('/');
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert('Error', 'Ocurrió un error durante el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            {session?.user?.email}
          </Text>
          <SocialButton
            provider="google"
            onPress={handleCreateProfile}
            isLoading={isLoading}
            text="Confirmar registro"
          />
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
});
