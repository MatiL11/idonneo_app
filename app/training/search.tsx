import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/styles/tokens';

type Exercise = {
  id: string;
  name: string;
  muscles: string;
  img: string;
  saved?: boolean;
  difficulty?: number; // 1..3
};

const MOCK: Exercise[] = [
  { id: 'e1', name: 'Flexiones de brazos', muscles: 'Pectoral - Tríceps', img: 'https://images.unsplash.com/photo-1571731956672-f2b94d6b1f05?q=80&w=800&auto=format&fit=crop', difficulty: 2 },
  { id: 'e2', name: 'Flexiones de brazos arqueras', muscles: 'Pectoral - Tríceps', img: 'https://images.unsplash.com/photo-1599050751795-b6cda4b5c5c5?q=80&w=800&auto=format&fit=crop', difficulty: 3 },
  { id: 'e3', name: 'Aplausos al fallo', muscles: 'Palmas - Dedos', img: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=800&auto=format&fit=crop', difficulty: 3 },
  { id: 'e4', name: 'Dominadas pronas', muscles: 'Dorsal - Bíceps', img: 'https://images.unsplash.com/photo-1558611848-7e13f3a46a1d?q=80&w=800&auto=format&fit=crop', difficulty: 2 },
];

export default function SearchPane() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Exercise[]>(MOCK);

  const filtered = useMemo(
    () => data.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())),
    [q, data]
  );

  const toggleSaved = (id: string) =>
    setData((prev) => prev.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)));

  return (
    <View style={{ flex: 1 }}>
      {/* Search pill + filtros */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.gray600} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          placeholderTextColor={COLORS.gray600}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.9} onPress={() => {}}>
          <Ionicons name="options-outline" size={18} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.92} style={styles.card} onPress={() => {}}>
            {/* Bookmark arriba derecha */}
            <TouchableOpacity onPress={() => toggleSaved(item.id)} hitSlop={10} style={styles.bookmark}>
              <MaterialCommunityIcons
                name={item.saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color="#ffffff"
              />
            </TouchableOpacity>

            {/* Thumb */}
            <View style={styles.thumbWrap}>
              <Image source={{ uri: item.img }} style={styles.thumb} />
            </View>

            {/* Texto */}
            <View style={styles.textCol}>
              <Text numberOfLines={2} style={styles.title}>
                {item.name}
              </Text>

              <View style={styles.difficultyRow}>
                {Array.from({ length: item.difficulty ?? 3 }).map((_, i) => (
                  <Ionicons key={i} name="flash" size={12} color={COLORS.green} style={{ marginRight: 3 }} />
                ))}
              </View>

              <Text numberOfLines={1} style={styles.muscles}>
                {item.muscles}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const R = { card: 16, thumb: 12, pill: 24 };

const styles = StyleSheet.create({
  /** Buscador */
  searchRow: {
    height: 46,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: COLORS.black, fontSize: 16 },
  filterBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.gray200,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },

  /** Card negra */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.cardDark,
    borderRadius: R.card,
    ...Platform.select({
      ios: { shadowColor: COLORS.black, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
    position: 'relative',
  },
  bookmark: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 2,
  },

  /** Thumb */
  thumbWrap: {
    width: 92,
    height: 64,
    borderRadius: R.thumb,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  thumb: { width: '100%', height: '100%' },

  /** Texto */
  textCol: { flex: 1 },
  title: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  muscles: { color: '#cfcfcf', fontSize: 12 },
});
