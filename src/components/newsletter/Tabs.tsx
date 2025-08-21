import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, RADII } from '../../styles/tokens';
import type { TabKey } from '../../hooks/useArticles';

type Props = {
  active: TabKey;
  onChange: (k: TabKey) => void;
  disableSaved?: boolean;
  onRequireLogin?: () => void;
  disabled?: boolean; // loading
};

export default function Tabs({ active, onChange, disableSaved, onRequireLogin, disabled }: Props) {
  const item = (key: TabKey, label: string) => {
    const isActive = active === key;
    const style = [styles.pill, isActive ? styles.active : styles.inactive];
    const textStyle = [styles.text, isActive ? styles.textActive : styles.textInactive];

    const onPress = () => {
      if (key === 'saved' && disableSaved) {
        onRequireLogin?.();
        return;
      }
      onChange(key);
    };

    return (
      <TouchableOpacity key={key} onPress={onPress} style={style} activeOpacity={0.8} disabled={disabled}>
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.row}>
      {item('all', 'Ver todo')}
      {item('saved', 'Mis guardados')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 20, paddingHorizontal: 10,
  },
  pill: {
    paddingVertical: 8, paddingHorizontal: 15, borderRadius: RADII.pill,
    width: '48%', alignItems: 'center', justifyContent: 'center', height: 34,
  },
  active: { backgroundColor: COLORS.black, borderWidth: 0 },
  inactive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.grayBorder },
  text: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  textActive: { color: COLORS.white, fontWeight: '600' },
  textInactive: { color: COLORS.gray700 },
});
