import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/styles/tokens';

type Props = {
  label: string;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
};

function WeekBarCmp({ label, disabled, onPrev, onNext }: Props) {
  return (
    <View style={styles.weekBar}>
      <TouchableOpacity
        style={[styles.arrowBtn, disabled && { opacity: 0.5 }]}
        onPress={onPrev}
        disabled={disabled}
      >
        <Ionicons name="chevron-back" size={18} color={COLORS.black} />
      </TouchableOpacity>

      <Text style={styles.weekText}>{label}</Text>

      <TouchableOpacity
        style={[styles.arrowBtn, disabled && { opacity: 0.5 }]}
        onPress={onNext}
        disabled={disabled}
      >
        <Ionicons name="chevron-forward" size={18} color={COLORS.black} />
      </TouchableOpacity>
    </View>
  );
}

export const WeekBar = memo(WeekBarCmp);

const styles = StyleSheet.create({
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E8E8',
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: COLORS.black,
  },
});
