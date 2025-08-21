import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADII } from '../../styles/tokens';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Feather name="search" size={18} color={COLORS.gray700} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Buscar"
        placeholderTextColor={COLORS.gray700}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderRadius: RADII.search,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, height: '100%', color: '#000', fontSize: 16 },
});
