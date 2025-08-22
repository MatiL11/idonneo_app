import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WeeklyStrip from '../../src/components/training/WeeklyStrip';
import TopMiniNav, { TopMiniTab } from '../../src/components/training/TopMiniNav';
import SearchPane from '../training/search';
import SavedPane from '../training/saved';
import { COLORS, RADII } from '../../src/styles/tokens';

const FEATURED = [
  { id: 'p1', title: 'Programa para front lever' },
  { id: 'p2', title: 'Programa de handstand (vertical)' },
  { id: 'p3', title: 'Ganar masa muscular' },
  { id: 'p4', title: 'Perder grasa / recomposición' },
];

export default function EntrenamientoScreen() {
  const router = useRouter();
  const [topTab, setTopTab] = useState<TopMiniTab>('overview');

  const goToCalendar = () => router.push('/training/calendar');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Mini navbar superior */}
        <TopMiniNav active={topTab} onChange={setTopTab} />

        {topTab === 'overview' ? (
          <>
            {/* Bloque negro clickeable */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={goToCalendar}
              style={styles.topPanel}
              accessibilityRole="button"
              accessibilityLabel="Abrir calendario completo"
            >
              <View style={styles.topHeaderRow}>
                <Text style={styles.weekTitle}>ESTA SEMANA</Text>
                <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
              </View>

              <WeeklyStrip />

              <View style={styles.todayCard}>
                <Text style={styles.todayLabel}>Entrenamiento de hoy</Text>
                <View style={styles.emptySlot}>
                  <Text style={styles.emptySlotText}>Nada programado</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Panel blanco */}
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Programas destacados</Text>
              <FlatList
                data={FEATURED}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <TouchableOpacity activeOpacity={0.85} style={styles.programCard} onPress={() => {}}>
                    <Text style={styles.programTitle}>{item.title}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </>
        ) : (
          // Search / Saved dentro del mismo panel blanco
          <View style={styles.panel}>
            {topTab === 'search' ? <SearchPane /> : <SavedPane />}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  safeTop: { flex: 1, backgroundColor: COLORS.black },

  topPanel: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
    borderBottomLeftRadius: RADII.panel,
    borderBottomRightRadius: RADII.panel,
  },

  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  weekTitle: { color: COLORS.white, fontWeight: '700', letterSpacing: 0.2 },

  todayCard: { marginTop: 10 },
  todayLabel: { color: COLORS.white, fontWeight: '600', marginBottom: 6 },
  emptySlot: {
    backgroundColor: '#2a2a2a',
    borderRadius: RADII.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  emptySlotText: { color: '#d1d1d1', fontWeight: '500' },

  panel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    paddingTop: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black, marginBottom: 12 },
  programCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADII.card,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  programTitle: { color: COLORS.black, fontSize: 15, fontWeight: '600' },
});
