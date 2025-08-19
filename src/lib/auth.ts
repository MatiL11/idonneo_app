import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from './supabase';
import { AuthError } from '@supabase/supabase-js';

export const getAuthUrl = () => {
  const url = makeRedirectUri({
    scheme: 'idonneoapp',
    path: 'auth/callback',
  });
  console.log('Redirect URL:', url); // Para debugging
  return url;
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
    const redirectUrl = getAuthUrl();
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
    const redirectUrl = getAuthUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    
    if (error) throw error;
    return { url: data?.url };
  } catch (error) {
    return handleAuthError(error, 'Facebook');
  }
};
