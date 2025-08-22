import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../src/styles/tokens';

dayjs.locale('es');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlanItem = { title: string; subtitle: string };
type PlanMap = Record<string, PlanItem | undefined>;

const WD3 = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

function mondayStart(d: dayjs.Dayjs) {
  const shift = (d.day() + 6) % 7;
  return d.subtract(shift, 'day').startOf('day');
}

export default function EditWeekTemplateScreen() {
  const router = useRouter(); // <- NUEVO

  const [anchor, setAnchor] = useState(dayjs());
  const weekStart = useMemo(() => mondayStart(anchor), [anchor]);

  const [plan, setPlan] = useState<PlanMap>({});
  const [expandedIso, setExpandedIso] = useState<string | null>(null);

  useEffect(() => {
    const isoMonday = weekStart.format('YYYY-MM-DD');
    setPlan((p) =>
      p[isoMonday]
        ? p
        : {
            ...p,
            [isoMonday]: {
              title: 'Nombre de la rutina',
              subtitle: 'músculos que trabaja esta rutina',
            },
          }
    );
  }, [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = weekStart.add(i, 'day');
      const iso = d.format('YYYY-MM-DD');
      const isToday = d.isSame(dayjs(), 'day');
      return {
        iso,
        isToday,
        wdIndex: i,
        label: `${WD3[i]}${d.format('DD')}`,
        date: d,
        routine: plan[iso],
      };
    });
  }, [weekStart, plan]);

  const rangeLabel = `${weekStart.format('DD MMM YYYY')} - ${weekStart
    .add(6, 'day')
    .format('DD MMM YYYY')}`;

  const goPrevWeek = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAnchor((a) => a.subtract(1, 'week'));
    setExpandedIso(null);
  };
  const goNextWeek = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAnchor((a) => a.add(1, 'week'));
    setExpandedIso(null);
  };

  const toggleExpand = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIso((curr) => (curr === iso ? null : iso));
  };

  const addSample = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlan((p) => ({
      ...p,
      [iso]: { title: 'Nombre de la rutina', subtitle: 'músculos que trabaja esta rutina' },
    }));
    setExpandedIso(iso);
  };

  const removeRoutine = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlan((p) => {
      const copy = { ...p };
      delete copy[iso];
      return copy;
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header negro */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar plan</Text>
        <TouchableOpacity style={styles.savePill} onPress={() => { /* TODO: persistir */ }}>
          <Ionicons name="checkmark" size={16} color="#0A0A0A" />
          <Text style={styles.savePillText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* Panel blanco */}
      <View style={styles.panel}>
        {/* Selector de semana */}
        <View style={styles.weekBar}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goPrevWeek}>
            <Ionicons name="chevron-back" size={18} color={COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.weekText}>{rangeLabel}</Text>

          <TouchableOpacity style={styles.arrowBtn} onPress={goNextWeek}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {/* Lista de 7 días */}
        <FlatList
          data={days}
          keyExtractor={(d) => d.iso}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const isOpen = expandedIso === item.iso;
            return (
              <View style={styles.itemWrap}>
                <View style={[styles.dayRow, isOpen && styles.dayRowOpen]}>
                  <TouchableOpacity
                    style={styles.rowTapZone}
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(item.iso)}
                  >
                    <Text style={[styles.dayCode, item.isToday && styles.dayCodeToday]}>
                      {item.label}
                    </Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#7a7a7a"
                    />
                  </TouchableOpacity>

                  {!item.routine && (
                    <TouchableOpacity style={styles.addBtn} onPress={() => addSample(item.iso)}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>

                {isOpen && (
                  <View style={styles.detailArea}>
                    {item.routine ? (
                      <View style={styles.routineCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.routineTitle}>{item.routine.title}</Text>
                          <Text style={styles.routineSubtitle}>{item.routine.subtitle}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeRoutine(item.iso)}>
                          <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.emptyPill}>
                        <Text style={styles.emptyPillText}>Nada programado</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },

  topHeader: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1e1e1e',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
  },
  savePillText: { color: '#0A0A0A', fontWeight: '700' },

  panel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    padding: 16,
  },

  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  arrowBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8E8E8',
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: COLORS.black,
  },

  itemWrap: {},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dayRowOpen: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  rowTapZone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayCode: { fontWeight: '800', color: '#111' },
  dayCodeToday: { color: '#16A34A' },

  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },

  detailArea: { paddingHorizontal: 10, paddingTop: 10 },

  routineCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineTitle: { color: '#fff', fontWeight: '700', marginBottom: 2 },
  routineSubtitle: { color: '#bdbdbd', fontSize: 12 },

  emptyPill: {
    backgroundColor: '#EFEFEF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  emptyPillText: { color: '#333', fontWeight: '600' },
});
