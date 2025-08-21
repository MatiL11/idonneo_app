import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';

import { SocialButton } from '../../src/components/auth/SocialButton';
import { signInWithGoogle, signInWithFacebook, signInWithApple } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import { logger } from '../../src/lib/logger';

WebBrowser.maybeCompleteAuthSession();

/** =========================
 *  Constantes & Tipos
 *  ========================= */
const REDIRECT_URL = 'idonneoapp://auth/callback';

type Provider = 'google' | 'facebook' | 'apple';

type OAuthResponse =
  | { url?: string; error?: { message?: string } | Error }
  | { url: string }
  | { error: Error };

/** =========================
 *  Helpers UI
 *  ========================= */
const showAlert = (title: string, message: string, buttons?: Parameters<typeof Alert.alert>[2]) => {
  Alert.alert(title, message, buttons);
};

const parseErrorMessage = (err: unknown): string => {
  if (!err) return 'Ocurrió un error desconocido.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  const maybeMsg = (err as any)?.message || (err as any)?.error?.message;
  return typeof maybeMsg === 'string' ? maybeMsg : 'Ocurrió un error inesperado.';
};

const isAccountConflict = (msg: string) =>
  /email already registered|already been registered|already exists|account conflict/i.test(msg);

/** =========================
 *  Helpers de Perfil
 *  ========================= */
const getNamesFromMetadata = (userMeta: Record<string, any> = {}) => {
  const full = userMeta.full_name || userMeta.name || '';
  if (!full) return { firstName: '', lastName: '' };
  const parts = String(full).trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '' };
};

const buildUsername = (userMeta: Record<string, any> = {}) => {
  const base =
    userMeta.name ||
    (typeof userMeta.email === 'string' ? userMeta.email.split('@')[0] : '') ||
    'user';
  const normalized = String(base).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
  const suffix = `${Date.now().toString().slice(-6)}_${Math.random().toString(36).slice(2, 6)}`;
  return `${normalized}_${suffix}`;
};

const createUserProfile = async (session: Session): Promise<boolean> => {
  try {
    const user = session?.user;
    if (!user) {
      logger.error('createUserProfile: no session user');
      return false;
    }

    const meta = user.user_metadata || {};
    const { firstName, lastName } = getNamesFromMetadata(meta);
    const username = buildUsername(meta);

    const { error } = await supabase.from('profiles').insert([
      {
        id: user.id,
        username,
        first_name: firstName,
        last_name: lastName,
        avatar_url: meta.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      logger.error('createUserProfile error', error);
      return false;
    }
    return true;
  } catch (e) {
    logger.error('createUserProfile exception', e);
    return false;
  }
};

/** =========================
 *  Helpers de Sesión
 *  ========================= */
const exchangeCodeForSession = async (code: string) => {
  const clean = code.trim();
  const { data, error } = await supabase.auth.exchangeCodeForSession(clean);
  if (error) throw error;
  return data;
};

const ensureUserProfile = async (session: Session) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // PGRST116 = no row found
  if (error && (error as any).code === 'PGRST116') {
    logger.log('Perfil no encontrado, creando…');
    const ok = await createUserProfile(session);
    if (!ok) throw new Error('No se pudo crear el perfil automáticamente.');
    return;
  }

  if (error) throw error;
};

/** =========================
 *  Login Screen
 *  ========================= */
export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [isLoading, setIsLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable).catch(() => setAppleAuthAvailable(false));
    }
  }, []);

  const providersMap = useMemo<Record<Provider, () => Promise<OAuthResponse>>>(() => {
    return {
      google: signInWithGoogle,
      facebook: signInWithFacebook,
      apple: signInWithApple,
    };
  }, []);

  const finishLogin = useCallback(
    async (session: Session) => {
      await ensureUserProfile(session);
      setSession(session);
      router.replace('/');
    },
    [router, setSession]
  );

  const handleOAuthRedirect = useCallback(
    async (url: string, provider: Provider) => {
      const result = await WebBrowser.openAuthSessionAsync(url, REDIRECT_URL);
      const successWithUrl = result.type === 'success' && 'url' in result && !!(result as any).url;

      if (!successWithUrl) {
        logger.error('Autenticación no exitosa', { type: result.type });
        showAlert('Autenticación cancelada', 'El proceso de inicio de sesión fue interrumpido. Intenta nuevamente.');
        return;
      }

      try {
        const returnedUrl = new URL((result as any).url as string);
        const code = returnedUrl.searchParams.get('code');
        if (!code) {
          logger.error('No se encontró código de autorización en la URL');
          showAlert('Error de autenticación', 'No se pudo completar el inicio de sesión. Intenta nuevamente.');
          return;
        }

        const sessionData = await exchangeCodeForSession(code);
        if (!sessionData?.session) {
          logger.error('No se obtuvo una sesión válida');
          showAlert('Sesión no disponible', 'No pudimos verificar tu identidad. Intentá iniciar sesión nuevamente.');
          return;
        }

        await finishLogin(sessionData.session);
      } catch (e: any) {
        const msg = parseErrorMessage(e);
        logger.error('Error al procesar la sesión', e);

        if (/invalid flow state/i.test(msg)) {
          showAlert('Error de sesión', 'Hubo un problema con la autenticación. ¿Deseás intentar nuevamente?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Intentar de nuevo', onPress: () => handleSocialLogin(provider) },
          ]);
        } else {
          showAlert('Problema de conexión', 'Hubo un problema al conectar con tu cuenta. Por favor intenta nuevamente.');
        }
      }
    },
    [finishLogin]
  );

  const handleApplePostAuth = useCallback(async () => {
    // Intento directo: si Apple devolvió sesión nativa, debería existir.
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      await finishLogin(data.session);
    }
  }, [finishLogin]);

  const handleSocialLogin = useCallback(
    async (provider: Provider) => {
      if (isLoading) return;

      try {
        setIsLoading(true);

        // Limpiamos cualquier sesión previa para evitar conflictos
        await supabase.auth.signOut().catch(() => {});

        const oauthFn = providersMap[provider];
        if (!oauthFn) throw new Error(`Proveedor no soportado: ${provider}`);

        const response = await oauthFn();
        const errorMsg = parseErrorMessage((response as any)?.error);
        if ((response as any)?.error) {
          logger.error('Error en respuesta de autenticación social', (response as any).error);

          if (isAccountConflict(errorMsg)) {
            showAlert('Email ya registrado', 'Este correo está registrado con otro método de inicio de sesión. Por favor, usa ese método.');
            return;
          }

          if (/autenticación con apple.*desarrollo/i.test(errorMsg)) {
            showAlert('Autenticación con Apple', errorMsg);
            return;
          }

          showAlert('No se pudo iniciar sesión', 'Hubo un problema al conectar con tu cuenta. Intenta nuevamente.');
          return;
        }

        // Apple (nativo) puede no devolver URL
        if (provider === 'apple' && !(response as any)?.url) {
          await handleApplePostAuth();
          return;
        }

        if ((response as any)?.url) {
          await handleOAuthRedirect((response as any).url, provider);
          return;
        }

        // Fallback: si no hubo error ni URL, revisar sesión actual
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          await finishLogin(data.session);
          return;
        }

        showAlert('No se pudo iniciar sesión', 'No pudimos completar el proceso. Intenta nuevamente.');
      } catch (e) {
        logger.error('Error en autenticación', e);
        showAlert('No se pudo iniciar sesión', 'Hubo un problema durante el proceso. Por favor intenta nuevamente más tarde.');
      } finally {
        setIsLoading(false);
      }
    },
    [finishLogin, handleApplePostAuth, handleOAuthRedirect, isLoading, providersMap]
  );

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

          <SocialButton provider="facebook" disabled={isLoading} onPress={() => handleSocialLogin('facebook')} />
          <SocialButton provider="google" disabled={isLoading} onPress={() => handleSocialLogin('google')} />

          {Platform.OS === 'ios' && appleAuthAvailable && (
            <SocialButton provider="apple" disabled={isLoading} onPress={() => handleSocialLogin('apple')} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/** =========================
 *  Estilos
 *  ========================= */
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
