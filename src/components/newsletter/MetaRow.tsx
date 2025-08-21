import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MetaRow({ date, readTime }: { date?: string; readTime?: string }) {
  if (!date && !readTime) return null;
  return (
    <View style={styles.metaContainer}>
      <Text style={styles.meta}>{date || ''}</Text>
      <Text style={styles.meta}>{readTime ? `${readTime} de lectura` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 15,
  },
  meta: { fontSize: 14, color: '#666' },
});
