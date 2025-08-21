import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TagPill({ tag }: { tag?: string }) {
  if (!tag) return null;
  return (
    <View style={styles.tagContainer}>
      <Text style={styles.tag}>{tag}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tagContainer: {
    backgroundColor: '#f0f0f0', paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 20, alignSelf: 'flex-start', marginTop: 20, marginBottom: 10,
  },
  tag: { fontSize: 14, color: '#666', fontWeight: '500' },
});
