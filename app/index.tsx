import { View, Text, StyleSheet, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/lib/store';
import { getUserProfile, Profile } from '../src/lib/profiles';
import { StatusBar } from 'expo-status-bar';

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
          // Si el error es específicamente que el perfil no se encontró,
          // redirigimos al proceso de registro
          if (error && error.code === 'PROFILE_NOT_FOUND') {
            console.log('Usuario nuevo, redirigiendo a la pantalla de registro');
            router.replace('/auth/register');
          } else {
            console.log('Error al obtener el perfil:', error);
            router.replace('/auth/register');
          }
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
        <StatusBar style="light" />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/idonneo-logo-blanco.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>SIMPLE</Text>
            <Text style={styles.taglineText}>EFECTIVO</Text>
            <Text style={styles.taglineText}>IDÓNEO</Text>
          </View>
          <View style={styles.buttonWrapper}>
            <Link href="/auth/login" replace={true} style={styles.button}>
              <Text style={styles.buttonText}>COMENZAR</Text>
            </Link>
          </View>
        </View>
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
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 50,
    paddingLeft: 20,
  },
  taglineText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
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
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center', /* Añadido para centrar verticalmente */
    height: 50, /* Altura fija para el botón */
  },
  buttonText: {
    fontSize: 18, /* Aumentado el tamaño */
    color: '#000000',
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center', /* Aseguramos que el texto esté centrado */
  },
  linkText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  }
});
