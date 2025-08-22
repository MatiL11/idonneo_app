import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TopMiniTab = 'overview' | 'search' | 'saved';

type Props = {
  active: TopMiniTab;
  onChange: (tab: TopMiniTab) => void;
};

export default function TopMiniNav({ active, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <NavItem icon="stats-chart-outline" active={active === 'overview'} onPress={() => onChange('overview')} />
        <NavItem icon="search-outline" active={active === 'search'} onPress={() => onChange('search')} />
        <NavItem icon="bookmark-outline" active={active === 'saved'} onPress={() => onChange('saved')} />
      </View>
    </View>
  );
}

function NavItem({
  icon, active, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.8} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#fff" />
      {active && <View style={styles.indicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 10 },
  pill: {
    backgroundColor: '#1f1f1f',
    borderRadius: 18,
    paddingHorizontal: 8,
    height: 36,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  item: {
    flex: 1,
    height: 28,
    marginHorizontal: 2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: -2,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },
});
