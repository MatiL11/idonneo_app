import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  value: number;
  onInc: () => void;
  onDec: () => void;
};

export default function RoundsPill({ value, onInc, onDec }: Props) {
  return (
    <View style={styles.roundsPill}>
      <Text style={styles.roundsLabel}>Rondas</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.circleBtn} onPress={onDec}>
          <Ionicons name="remove" size={18} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.roundsValue}>{value}</Text>
        <TouchableOpacity style={styles.circleBtn} onPress={onInc}>
          <Ionicons name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  roundsPill: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  roundsLabel: { color: '#333', fontSize: 16, fontWeight: '800' },
  controls: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  roundsValue: { color: '#333', fontWeight: '800', minWidth: 18, textAlign: 'center', marginHorizontal: 10 },
  circleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
