import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Image } from 'react-native';

interface SocialButtonProps {
  provider: 'facebook' | 'google';
  onPress: () => void;
  isLoading?: boolean;
  text?: string;
}

const icons = {
  facebook: require('../../../assets/facebook-icon.png'),
  google: require('../../../assets/google-icon.png'),
};

const providerNames = {
  facebook: 'Facebook',
  google: 'Google',
};

export function SocialButton({ provider, onPress, isLoading, text }: SocialButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isLoading && styles.buttonDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <Image source={icons[provider]} style={styles.icon} />
      <Text style={styles.text}>
        {isLoading ? 'Cargando...' : (text || `Continuar con ${providerNames[provider]}`)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 8,
    width: '100%',
    maxWidth: 280,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
});
