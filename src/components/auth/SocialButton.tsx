import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Image } from 'react-native';

interface SocialButtonProps {
  provider: 'facebook' | 'google' | 'apple';
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  text?: string;
}

const icons = {
  facebook: require('../../../assets/facebook-icon.png'),
  google: require('../../../assets/google-icon.png'),
  apple: require('../../../assets/apple-icon.png'), // Asegúrate de tener este icono
};

const providerNames = {
  facebook: 'Facebook',
  google: 'Google',
  apple: 'Apple',
};

export function SocialButton({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
  text,
}: SocialButtonProps) {
  const isButtonDisabled = isLoading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isButtonDisabled}
    >
      <View style={styles.contentContainer}>
        <Image source={icons[provider]} style={styles.icon} />
        <Text style={styles.text}>
          {isLoading ? 'CARGANDO...' : (text || providerNames[provider].toUpperCase())}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 8,
    width: '80%',
    maxWidth: 320,
    height: 42, // Altura consistente para todos los botones
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FFFFFF40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'relative',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '50%',
    position: 'relative',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
    position: 'absolute',
    left: 0,
  },
  text: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    letterSpacing: 0.5,
    position: 'absolute',
    left: 36, // icono (24px) + margen (12px)
  },
});
