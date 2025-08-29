import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

interface HeaderBarProps {
  title: string;
  onBack?: () => void;
  rightButton?: {
    icon: string;
    text: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  };
  showBackButton?: boolean;
}

export default function HeaderBar({ 
  title, 
  onBack, 
  rightButton, 
  showBackButton = true 
}: HeaderBarProps) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        {showBackButton && onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#E6E6E6" />
          </TouchableOpacity>
        )}
        <Text style={styles.topTitle}>{title}</Text>
      </View>

      {rightButton && (
        <TouchableOpacity 
          style={[
            styles.rightButton, 
            rightButton.variant === 'primary' && styles.primaryButton
          ]} 
          onPress={rightButton.onPress}
        >
          <View style={[
            styles.buttonBadge, 
            rightButton.variant === 'primary' && styles.primaryBadge
          ]}>
            <Ionicons 
              name={rightButton.icon as any} 
              size={16} 
              color={rightButton.variant === 'primary' ? COLORS.white : '#666'} 
            />
          </View>
          <Text style={[
            styles.buttonText,
            rightButton.variant === 'primary' && styles.primaryButtonText
          ]}>
            {rightButton.text}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    marginLeft: 10,
    color: '#D0D0D0',
    fontSize: 18,
    fontWeight: '700',
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
  },
  buttonBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryBadge: {
    backgroundColor: COLORS.green,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  primaryButtonText: {
    color: COLORS.black,
  },
});
