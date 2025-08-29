import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../src/styles/tokens';
import { useAuthStore } from '../../../../src/lib/store';
import { useRoutines, Routine } from '../../../../src/hooks/useRoutines';
import SelectRoutineModal from '../../../../src/components/training/SelectRoutineModal';

import { useWeekPlan, PlanItem, PlanMap } from '../../../../src/hooks/useWeekPlans';
import { HeaderBar, WeekNavigation, WhiteSheet, DayCard } from '../../../../src/components/shared';
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

// Interfaz local para los días de la semana
interface DayVM {
  iso: string;          // YYYY-MM-DD
  isToday: boolean;
  dayAbbr: string;      // ej: "LUN"
  dayNumber: string;    // ej: "25"
  hasRoutine?: boolean;
  title?: string;
  subtitle?: string;
}

export default function EditWeekTemplateScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const [anchor, setAnchor] = useState(dayjs());


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
        dayAbbr: WD3[i],
        dayNumber: d.format('DD'),
        hasRoutine: !!p,
        title: p?.title,
        subtitle: p?.subtitle,
      };
    });
  }, [anchor, plan]);



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
    });
  }, [confirmNavigationIfChanged, loading]);

  const goNextWeek = useCallback(() => {
    if (loading) return;
    confirmNavigationIfChanged(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAnchor((a) => a.clone().add(1, 'week'));
    });
  }, [confirmNavigationIfChanged, loading]);



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
        title="Editar Plan"
        onBack={() => router.back()}
        rightButton={{
          icon: 'checkmark',
          text: 'Guardar',
          onPress: save,
          variant: 'primary'
        }}
      />

      <WhiteSheet>
        <WeekNavigation
          startDate={mondayStart(anchor).format('DD MMM YYYY')}
          endDate={mondayStart(anchor).add(6, 'day').format('DD MMM YYYY')}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
        />

        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {loading ? (
            <WeekSkeleton />
          ) : (
            days.map((item, idx) => (
              <DayCard
                key={idx}
                dayAbbr={item.dayAbbr}
                dayNumber={item.dayNumber}
                isToday={item.isToday}
                onAddMeal={() => openRoutineSelector(item.iso)}
              >
                {item.hasRoutine && (
                  <View style={styles.routineCard}>
                    <View style={styles.routineInfo}>
                      <Text style={styles.routineTitle}>{item.title}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => removeRoutine(item.iso)}
                    >
                      <Ionicons name="close" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
              </DayCard>
            ))
          )}
        </ScrollView>
      </WhiteSheet>

      <SelectRoutineModal
        visible={showRoutineSelector}
        onClose={() => setShowRoutineSelector(false)}
        onSelect={handleSelectRoutine}
        routines={routines}
        loading={isLoadingRoutines}
        dayLabel={selectedDate ? days.find((d) => d.iso === selectedDate) ? `${WD3[days.findIndex(d => d.iso === selectedDate)]}${days.find((d) => d.iso === selectedDate)?.dayNumber}` : 'día' : ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  routineCard: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: { 
    color: COLORS.black, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
