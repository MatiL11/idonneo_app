import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  value: number;
};

export default function ReadOnlyRoundsPill({ value }: Props) {
  return (
    <View style={styles.roundsPill}>
      <Text style={styles.roundsLabel}>Rondas</Text>
      <View style={styles.controls}>
        <Text style={styles.roundsValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  roundsPill: {
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roundsLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundsValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
});
