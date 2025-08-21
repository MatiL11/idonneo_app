import React from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/lib/store';
import LoginView from '../../src/components/auth/LoginView';
import { useOAuthLogin } from '../../src/hooks/useOAuthLogin';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const { isLoading, appleAuthAvailable, loginWith } = useOAuthLogin({
    onSuccess: (session) => {
      setSession(session);
      router.replace('/'); // ir al home
    },
  });

  return (
    <LoginView
      isLoading={isLoading}
      appleAuthAvailable={appleAuthAvailable}
      onLogin={loginWith}
    />
  );
}
