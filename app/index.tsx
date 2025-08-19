import { View, Text, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/lib/store';
import { getUserProfile, Profile } from '../src/lib/profiles';

export default function Index() {
  const router = useRouter();
  const session = useAuthStore(state => state.session);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (session?.user) {
        const { profile, error } = await getUserProfile(session.user.id);
        if (profile) {
          setProfile(profile);
          console.log('Perfil encontrado:', profile);
          // Redirigir a la sección de tabs
          router.replace('/(tabs)/newsletter');
        } else {
          console.log('No se encontró el perfil:', error);
          router.replace('/auth/register');
        }
      }
      setLoading(false);
    }

    loadProfile();
  }, [session]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bienvenido a IdonneoApp</Text>
        <Link href="/auth/login" style={styles.link}>
          <Text style={styles.linkText}>Iniciar Sesión</Text>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido {profile?.first_name}!</Text>
      {profile && (
        <View style={styles.profileInfo}>
          <Text style={styles.text}>Nombre: {profile.first_name} {profile.last_name}</Text>
          <Text style={styles.text}>Usuario: {profile.username}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileInfo: {
    backgroundColor: '#FFFFFF10',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  link: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  linkText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  }
});
