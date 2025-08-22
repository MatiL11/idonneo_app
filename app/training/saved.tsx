import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { COLORS } from '../../src/styles/tokens';

const RADIUS = { segment: 18, card: 12 };

type SavedTab = 'exercises' | 'routines' | 'programs';

const FEATURED_ROUTINES = [
  { id: 'r1', name: 'Nombre de la rutina', desc: 'músculos que trabaja esta rutina' },
  { id: 'r2', name: 'Push/Pull/Legs (3 días)', desc: 'Pectoral – Espalda – Piernas' },
];

export default function SavedPane() {
  const [tab, setTab] = useState<SavedTab>('routines');

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs */}
      <View style={styles.segmentRow}>
        <Segment label="Ejercicios" active={tab === 'exercises'} onPress={() => setTab('exercises')} />
        <Segment label="Rutinas"   active={tab === 'routines'}  onPress={() => setTab('routines')}  />
        <Segment label="Programas" active={tab === 'programs'}  onPress={() => setTab('programs')}  />
      </View>

      {tab === 'routines' ? (
        <FlatList
          data={FEATURED_ROUTINES}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 80 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} style={styles.routineCard} onPress={() => {}}>
              <View style={styles.routineCardHeader}>
                <Text numberOfLines={1} style={styles.routineTitle}>{item.name}</Text>
                <Entypo name="dots-three-horizontal" size={16} color="#fff" />
              </View>
              <Text numberOfLines={1} style={styles.routineDesc}>{item.desc}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.placeholderBox}>
          <Text style={{ color: '#777' }}>
            {tab === 'exercises' ? 'Ejercicios guardados' : 'Programas guardados'}
          </Text>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => {}}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segment, active ? styles.segmentActive : styles.segmentInactive]}
    >
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : styles.segmentTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  segment: { flex: 1, height: 36, borderRadius: RADIUS.segment, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: COLORS.green },
  segmentInactive: { backgroundColor: COLORS.gray200, borderWidth: 1, borderColor: COLORS.gray300 },
  segmentText: { fontWeight: '700' },
  segmentTextActive: { color: COLORS.white },
  segmentTextInactive: { color: COLORS.gray600 },

  routineCard: { backgroundColor: COLORS.black, borderRadius: RADIUS.card, paddingVertical: 12, paddingHorizontal: 12 },
  routineCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routineTitle: { color: COLORS.white, fontWeight: '700' },
  routineDesc: { color: COLORS.gray500, fontSize: 12, marginTop: 4 },

  placeholderBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 12, marginTop: 12,
  },

  fab: {
    position: 'absolute', right: 18, bottom: 18,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
});
