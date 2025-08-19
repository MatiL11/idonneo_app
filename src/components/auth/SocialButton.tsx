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
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginVertical: 8,
    width: '100%',
    maxWidth: 300,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
