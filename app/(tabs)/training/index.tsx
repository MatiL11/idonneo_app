import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WeeklyStrip from '../../../src/components/training/WeeklyStrip';
import TopMiniNav, { TopMiniTab } from '../../../src/components/training/TopMiniNav';
import SearchPane from './search';
import SavedPane from './saved';
import { COLORS, RADII } from '../../../src/styles/tokens';
import dayjs from 'dayjs';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/lib/store';

const FEATURED = [
  { id: 'p1', title: 'Programa para front lever' },
  { id: 'p2', title: 'Programa de handstand (vertical)' },
  { id: 'p3', title: 'Ganar masa muscular' },
  { id: 'p4', title: 'Perder grasa / recomposición' },
];

export default function EntrenamientoScreen() {
  const router = useRouter();
  const [topTab, setTopTab] = useState<TopMiniTab>('overview');

  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? null;

  const todayIso = dayjs().format('YYYY-MM-DD');

  const [todayLabel, setTodayLabel] = useState<string>('Nada programado');
  const [loadingToday, setLoadingToday] = useState<boolean>(false);

  // --- Cargar "entrenamiento de hoy" desde Supabase ---
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    (async () => {
      try {
        setLoadingToday(true);

        // 1) Plan activo del usuario que incluya HOY
        const { data: plans, error: planErr } = await supabase
          .from('training_plans')
          .select('id, start_date, end_date')
          .eq('user_id', userId)
          .lte('start_date', todayIso)
          .gte('end_date', todayIso)
          .order('start_date', { ascending: false })
          .limit(1);

        if (planErr) throw planErr;
        const plan = plans?.[0];
        if (!plan) {
          if (mounted) setTodayLabel('Sin plan activo');
          return;
        }

        // 2) Override del usuario para hoy (pisa todo)
        const { data: ovs, error: ovErr } = await supabase
          .from('training_overrides')
          .select('date, is_rest, routine_id, routines ( title )')
          .eq('user_id', userId)
          .eq('date', todayIso)
          .limit(1);

        if (ovErr) throw ovErr;

        if (ovs && ovs[0]) {
          const ov = ovs[0];
          if (ov.is_rest) {
            if (mounted) setTodayLabel('Descanso');
            return;
          }
          if (ov.routines && Array.isArray(ov.routines) && ov.routines[0]?.title) {
            if (mounted) setTodayLabel(ov.routines[0].title);
            return;
          }
          // si hay override sin rutina/is_rest, continuamos al plan_day
        }

        // 3) Día del plan de hoy (con join a routines)
        const { data: days, error: dayErr } = await supabase
          .from('training_plan_days')
          .select('id, date, title, routine_id, routines ( title )')
          .eq('plan_id', plan.id)
          .eq('date', todayIso)
          .limit(1);

        if (dayErr) throw dayErr;

        const day = days?.[0];
        const label =
          day?.title ??
          (Array.isArray(day?.routines) && day?.routines[0]?.title) ??
          (day ? 'Sesión' : 'Nada programado');

        if (mounted) setTodayLabel(label);
      } catch (e) {
        console.error('[today] error:', e);
        if (mounted) setTodayLabel('Error al cargar');
      } finally {
        if (mounted) setLoadingToday(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId, todayIso]);

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
                  {loadingToday ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.emptySlotText}>{todayLabel}</Text>
                  )}
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
