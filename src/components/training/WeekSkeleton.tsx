import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

function WeekSkeletonCmp() {
  return (
    <View>
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <View style={styles.skelRow}>
            <View style={styles.skelDot} />
            <View style={styles.skelBar} />
            <View style={styles.skelBtn} />
          </View>
        </View>
      ))}
    </View>
  );
}

export const WeekSkeleton = memo(WeekSkeletonCmp);

const styles = StyleSheet.create({
  skelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  skelDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E6E6E6', marginRight: 8 },
  skelBar: { flex: 1, height: 14, borderRadius: 7, backgroundColor: '#EAEAEA' },
  skelBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E2E2', marginLeft: 10 },
});
