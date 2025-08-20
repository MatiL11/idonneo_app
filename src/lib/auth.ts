import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto'
import { supabase } from './supabase';
import { AuthError } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export const getAuthUrl = () => {
  // Siempre usamos nuestro esquema personalizado para compatibilidad con Facebook
  const customRedirectUrl = 'idonneoapp://auth/callback';
  
  // Imprimir la URL para verificación
  console.log('============================');
  console.log('URL de redirección configurada:', customRedirectUrl);
  console.log('============================');
  
  return customRedirectUrl;
};

type AuthResponse = {
  url?: string;
  error?: AuthError;
};

const handleAuthError = (error: unknown, provider: string): AuthResponse => {
  if (error instanceof AuthError) {
    console.error(`Error signing in with ${provider}:`, error.message);
    return { error };
  }
  if (error instanceof Error) {
    console.error(`Error signing in with ${provider}:`, error.message);
    return { error: new AuthError(error.message) };
  }
  const genericError = new AuthError('An unknown error occurred');
  console.error(`Error signing in with ${provider}:`, genericError.message);
  return { error: genericError };
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const redirectUrl = getAuthUrl(); // 'idonneoapp://auth/callback'
    
    // Logs para depuración
    console.log('============================');
    console.log('GOOGLE AUTH DETAILS:');
    console.log('Google redirect URL:', redirectUrl);
    console.log('============================');
    
    // Aseguramos que haya una sesión limpia antes de iniciar el flujo
    await supabase.auth.signOut();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) throw error;
    return { url: data?.url };
  } catch (error) {
    return handleAuthError(error, 'Google');
  }
};

export const signInWithFacebook = async (): Promise<AuthResponse> => {
  try {
    const redirectUrl = getAuthUrl(); // 'idonneoapp://auth/callback'
    
    // Logs detallados para depuración
    console.log('============================');
    console.log('FACEBOOK AUTH DETAILS:');
    console.log('Facebook redirect URL:', redirectUrl);
    console.log('Verificar que esta URL esté configurada en:');
    console.log('1. Supabase Dashboard > Authentication > URL Configuration');
    console.log('2. Facebook Developers Console > Facebook Login > Settings > Valid OAuth Redirect URIs');
    console.log('============================');
    
    // Aseguramos que haya una sesión limpia antes de iniciar el flujo
    await supabase.auth.signOut();
    
    // Configuración específica para Facebook
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
        scopes: 'public_profile,email',
        queryParams: {
          auth_type: 'rerequest',
        },
      },
    });
    
    if (error) throw error;
    return { url: data?.url };
  } catch (error) {
    return handleAuthError(error, 'Facebook');
  }
};

export const signInWithApple = async (): Promise<AuthResponse> => {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS devices')
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync()
    if (!isAvailable) {
      throw new Error('Sign in with Apple is not available on this device')
    }

    // Nonce recomendado por Apple/Supabase
    const rawNonce = Math.random().toString(36).slice(2)
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    )

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      // Apple valida el hash del nonce
      nonce: hashedNonce,
    })

    console.log('============================')
    console.log('APPLE AUTH DETAILS:')
    console.log('Apple authentication successful')
    console.log('Identity token available:', !!credential.identityToken)
    console.log('============================')

    if (!credential.identityToken) {
      throw new Error('No identity token provided by Apple')
    }

    // IMPORTANTE: enviar también el nonce *en claro* a Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    })

    if (error) {
      // Caso típico en desarrollo por configuración de Apple/Supabase
      if (error.message?.includes('Unacceptable audience')) {
        return {
          error: new AuthError(
            'El token de Apple no coincide con la audiencia configurada. ' +
            'Verificá en Supabase (Auth → Providers → Apple) que el Bundle ID/Service ID y la Key estén bien, ' +
            'y que tu ios.bundleIdentifier de Expo/EAS coincida.'
          )
        }
      }
      throw error
    }

    // Ajustá este retorno a tu tipo esperado; aquí simulamos el “todo OK”
    return { data, error: null } as unknown as AuthResponse

  } catch (err: any) {
    // Usuario canceló el diálogo de Apple
    if (err?.code === 'ERR_CANCELED') {
      return {
        error: new AuthError('Inicio de sesión cancelado por el usuario.')
      }
    }
    console.error('Error en autenticación con Apple:', err)
    // Tu manejador centralizado
    return handleAuthError(err, 'Apple')
  }
}

export const signOut = async (): Promise<{ error?: AuthError }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return {};
  } catch (error) {
    return handleAuthError(error, 'Sign Out');
  }
};

/**
 * Verifica qué método de autenticación está asociado a un email
 * @param email - El email a verificar
 * @returns El método de autenticación (google, facebook, apple, email) o null si no existe
 */
export const checkAuthMethodForEmail = async (email: string): Promise<string | null> => {
  try {
    // Intenta recuperar la contraseña para este email
    // Esto nos dará información sobre si el email existe y con qué proveedor está registrado
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'idonneoapp://auth/reset-password'
    });
    
    if (error) {
      // Si el error contiene información sobre un proveedor específico
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('OAuth provider')) {
        // Extrae el nombre del proveedor del mensaje de error
        // Ejemplo de mensaje: "User registered via OAuth provider: google"
        const provider = errorMsg.split('OAuth provider:')[1]?.trim().toLowerCase();
        return provider || 'social';
      } else if (errorMsg.includes('social provider')) {
        // Alternativa para otro formato de mensaje
        const provider = errorMsg.split('social provider')[1]?.trim().toLowerCase();
        return provider || 'social';
      } else if (errorMsg.includes('auth provider')) {
        // Otra alternativa
        const provider = errorMsg.split('auth provider')[1]?.trim().toLowerCase();
        return provider || 'social';
      } else if (errorMsg.includes('user is registered but has no password')) {
        // Usuario registrado sin contraseña (probablemente social)
        return 'social';
      } else if (errorMsg.includes('registered with a different authentication method')) {
        // Usuario registrado con otro método
        return 'social';
      } else if (errorMsg.includes('user not found')) {
        // El email no está registrado
        return null;
      }
    }
    
    // Si no hubo error, el usuario existe con email/contraseña
    return 'email';
  } catch (error) {
    console.error('Error al verificar método de autenticación', error);
    return null;
  }
};
