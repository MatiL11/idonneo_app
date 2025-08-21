import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onBack: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  saved: boolean;
  disabled?: boolean;
};

export default function ArticleHeader({ onBack, onToggleSave, onShare, saved, disabled }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={HITSLOP}>
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onToggleSave} disabled={disabled} hitSlop={HITSLOP}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare} hitSlop={HITSLOP}>
          <Ionicons name="share-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 10, height: 50, backgroundColor: '#000',
  },
  iconBtn: { padding: 5 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
