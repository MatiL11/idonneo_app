import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADII, SIZES } from '../../styles/tokens';
import type { Article } from '../../types/index';

type Props = {
  article: Article;
  onPress: () => void;
  canSave: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
};

export default function ArticleCard({ article, onPress, canSave, isSaving, onToggleSave }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
        {article.image_url ? (
          <View style={styles.thumbBox}>
            <Image source={{ uri: article.image_url }} style={styles.thumb} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.thumbPlaceholder} />
        )}
        <Text style={styles.title}>{article.title}</Text>
      </TouchableOpacity>

      {canSave && (
        <TouchableOpacity style={styles.saveBtn} onPress={onToggleSave} disabled={isSaving}>
          <MaterialCommunityIcons
            name={article.saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={article.saved ? COLORS.black : COLORS.gray700}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', marginBottom: 20 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADII.card, overflow: 'hidden',
    padding: 0, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  thumbBox: { height: SIZES.thumbHeight, borderRadius: 15, overflow: 'hidden', marginBottom: 4 },
  thumbPlaceholder: { height: SIZES.thumbHeight, backgroundColor: COLORS.gray500, borderRadius: 15, marginBottom: 12 },
  thumb: { width: '100%', height: '100%' },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.black, lineHeight: 26, paddingBottom: 10 },
  saveBtn: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
});
