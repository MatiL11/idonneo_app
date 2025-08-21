import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export default function CoverImage({ uri, loading }: { uri?: string; loading?: boolean }) {
  return (
    <View style={styles.box}>
      {uri ? (
        <Image source={{ uri }} style={styles.img} resizeMode="cover" />
      ) : (
        <Text style={styles.ph}>{loading ? 'Cargando imagen...' : 'foto de portada'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 200, backgroundColor: '#f0f0f0', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginVertical: 15, overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  ph: { fontSize: 16, color: '#666' },
});
