import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../../src/styles/tokens';
import { useAuthStore } from '../../../../src/lib/store';
import { useRoutines, Routine } from '../../../../src/hooks/useRoutines';
import SelectRoutineModal from '../../../../src/components/training/SelectRoutineModal';
import CalendarRoutineMenu from '../../../../src/components/training/CalendarRoutineMenu';

import { useWeekPlan, PlanItem, PlanMap } from '../../../../src/hooks/useWeekPlans';
import { HeaderBar } from '../../../../src/components/training/HeaderBar';
import { WeekBar } from '../../../../src/components/training/WeekBar';
import { DayItem, DayVM } from '../../../../src/components/training/DayItem';
import { WeekSkeleton } from '../../../../src/components/training/WeekSkeleton';

dayjs.locale('es');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WD3 = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'] as const;
const mondayStart = (d: dayjs.Dayjs) => {
  const shift = (d.day() + 6) % 7;
  return d.subtract(shift, 'day').startOf('day');
};

export default function EditWeekTemplateScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const [anchor, setAnchor] = useState(dayjs());
  const [expandedIso, setExpandedIso] = useState<string | null>(null);

  const { plan, setPlan, loading, saving, hasUnsaved, save } = useWeekPlan(userId, anchor);

  const rt = useRoutines(userId as string);
  const routines = useMemo(() => rt?.list || [], [rt?.list]);
  const isLoadingRoutines = rt?.loading;

  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<{ iso: string; title: string } | null>(
    null
  );

  const days: DayVM[] = useMemo(() => {
    const start = mondayStart(anchor);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = start.clone().add(i, 'day');
      const iso = d.format('YYYY-MM-DD');
      const p = (plan as PlanMap)[iso];
      return {
        iso,
        isToday: d.isSame(dayjs(), 'day'),
        label: `${WD3[i]}${d.format('DD')}`,
        hasRoutine: !!p,
        title: p?.title,
        subtitle: p?.subtitle,
      };
    });
  }, [anchor, plan]);

  const rangeLabel = useMemo(() => {
    const start = mondayStart(anchor);
    const end = start.clone().add(6, 'day');
    return `${start.format('DD MMM YYYY')} - ${end.format('DD MMM YYYY')}`;
  }, [anchor]);

  const confirmNavigationIfChanged = useCallback(
    (cb: () => void) => {
      if (hasUnsaved) {
        Alert.alert('Cambios sin guardar', 'Tienes cambios que no has guardado. ¿Guardar antes de continuar?', [
          { text: 'Descartar', style: 'destructive', onPress: cb },
          {
            text: 'Guardar',
            style: 'default',
            onPress: async () => {
              await save();
              cb();
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]);
      } else {
        cb();
      }
    },
    [hasUnsaved, save]
  );

  const goPrevWeek = useCallback(() => {
    if (loading) return;
    confirmNavigationIfChanged(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAnchor((a) => a.clone().subtract(1, 'week'));
      setExpandedIso(null);
    });
  }, [confirmNavigationIfChanged, loading]);

  const goNextWeek = useCallback(() => {
    if (loading) return;
    confirmNavigationIfChanged(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAnchor((a) => a.clone().add(1, 'week'));
      setExpandedIso(null);
    });
  }, [confirmNavigationIfChanged, loading]);

  const toggleExpand = useCallback((iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIso((curr) => (curr === iso ? null : iso));
  }, []);

  const openRoutineSelector = useCallback((iso: string) => {
    setSelectedDate(iso);
    setShowRoutineSelector(true);
  }, []);

  const handleSelectRoutine = useCallback(
    (routine: Routine) => {
      if (!selectedDate) return;

      const dateToUpdate = selectedDate;
      setShowRoutineSelector(false);

      const newPlanItem: PlanItem = {
        routineId: routine.id,
        title: routine.title,
        subtitle: routine.description || 'Sin descripción',
      };

      setPlan((current) => ({ ...current, [dateToUpdate]: newPlanItem }));
      setExpandedIso(dateToUpdate);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    },
    [selectedDate, setPlan]
  );

  const removeRoutine = useCallback(
    (iso: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPlan((p) => {
        const copy = { ...p };
        delete copy[iso];
        return copy;
      });
    },
    [setPlan]
  );

  const openRoutineMenu = useCallback((iso: string, title: string) => {
    setSelectedRoutine({ iso, title });
    setShowRoutineMenu(true);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <HeaderBar
        onBack={() => router.back()}
        saving={saving}
        loading={loading}
        hasUnsaved={hasUnsaved}
        onSave={save}
      />

      <View style={styles.panel}>
        <WeekBar label={rangeLabel} disabled={loading} onPrev={goPrevWeek} onNext={goNextWeek} />

        {loading ? (
          <WeekSkeleton />
        ) : (
          <FlatList
            data={days}
            keyExtractor={(d) => d.iso}
            contentContainerStyle={{ paddingBottom: 24 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <DayItem
                item={item}
                isOpen={expandedIso === item.iso}
                onToggle={toggleExpand}
                onAdd={openRoutineSelector}
                onMenu={openRoutineMenu}
              />
            )}
            removeClippedSubviews
            initialNumToRender={7}
            maxToRenderPerBatch={7}
            windowSize={5}
          />
        )}
      </View>

      <SelectRoutineModal
        visible={showRoutineSelector}
        onClose={() => setShowRoutineSelector(false)}
        onSelect={handleSelectRoutine}
        routines={routines}
        loading={isLoadingRoutines}
        dayLabel={selectedDate ? days.find((d) => d.iso === selectedDate)?.label || 'día' : ''}
      />

      {selectedRoutine && (
        <CalendarRoutineMenu
          visible={showRoutineMenu}
          onClose={() => setShowRoutineMenu(false)}
          onRemove={() => removeRoutine(selectedRoutine.iso)}
          routineName={selectedRoutine.title}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  panel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    padding: 16,
  },
});
