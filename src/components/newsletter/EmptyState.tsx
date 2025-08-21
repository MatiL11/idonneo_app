import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';

type Props = { message: string };

export default function EmptyState({ message }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="text-box-search-outline" size={46} color={COLORS.gray600} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40 },
  text: { marginTop: 10, fontSize: 15, color: COLORS.gray600, textAlign: 'center' },
});
