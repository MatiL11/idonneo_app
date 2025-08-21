import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SocialButton } from './SocialButton'; // ajustá el path si lo tenés en otro lugar
import type { Provider } from '../../hooks/useOAuthLogin';

type Props = {
  isLoading: boolean;
  appleAuthAvailable: boolean;
  onLogin: (p: Provider) => void;
};

export default function LoginView({ isLoading, appleAuthAvailable, onLogin }: Props) {
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

          <SocialButton provider="facebook" disabled={isLoading} onPress={() => onLogin('facebook')} />
          <SocialButton provider="google" disabled={isLoading} onPress={() => onLogin('google')} />

          {appleAuthAvailable && (
            <SocialButton provider="apple" disabled={isLoading} onPress={() => onLogin('apple')} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 30, paddingBottom: 40 },
  taglineContainer: { alignItems: 'flex-start', alignSelf: 'center', paddingTop: 80, width: '90%' },
  taglineText: { fontSize: 48, fontWeight: '800', color: '#fff', lineHeight: 48 },
  buttonContainer: { width: '100%', alignItems: 'center' },
  socialLoginContainer: { width: '100%', marginBottom: 20, alignItems: 'center' },
  socialLoginText: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 20 },
});
