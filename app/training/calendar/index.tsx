// app/training/calendar/CalendarMonthScreen.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../src/styles/tokens';
import { supabase } from '../../../src/lib/supabase';
import { useAuthStore } from '../../../src/lib/store';

// ===== Locale =====
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';
dayjs.locale('es');

// ===== Tipos de datos =====
type Marked = Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }>;
type Plan = { id: string; start_date: string; end_date: string };
type PlanDay = { 
  id: string; 
  date: string; 
  routine_id: string | null; 
  title: string | null; 
  routines?: any; // Temporalmente usamos 'any' para solucionar el error
  description?: string | null 
};

type Override = { 
  date: string; 
  is_rest: boolean | null; 
  notes?: string | null; 
  routine_id?: string | null; 
  routines?: any // Temporalmente usamos 'any' para solucionar el error
};

// ===== Utilidades =====
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');
const monthRange = (anchorIso: string) => {
  const start = dayjs(anchorIso).startOf('month');
  const end = dayjs(anchorIso).endOf('month');
  return { startIso: fmt(start), endIso: fmt(end) };
};

export default function CalendarMonthScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? null;

  const today = dayjs().format('YYYY-MM-DD');
  const [current, setCurrent] = useState<string>(today);   // “ancla” del mes visible (cualquier día del mes)
  const [selected, setSelected] = useState<string>(today);
  const [marked, setMarked] = useState<Marked>({});
  const [desc, setDesc] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [byDate, setByDate] = useState<Record<string, { label: string; hasPlan: boolean; isRest?: boolean }>>({});

  const monthLabel = useMemo(() => dayjs(current).format('MMMM YYYY'), [current]);

  // ====== Carga de datos del mes visible ======
  const loadMonth = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { startIso, endIso } = monthRange(current);

      // 1) Buscar plan ACTIVO del usuario que se solape con el mes visible
      //    (start_date <= finMes) && (end_date >= inicioMes)
      const { data: plans, error: planErr } = await supabase
        .from('training_plans')
        .select('id, start_date, end_date')
        .eq('user_id', userId)
        .lte('start_date', endIso)
        .gte('end_date', startIso)
        .order('start_date', { ascending: false })
        .limit(1);

      if (planErr) throw planErr;

      const plan: Plan | null = plans?.[0] ?? null;
      setActivePlan(plan);

      // Si no hay plan activo, limpiamos y listo
      if (!plan) {
        setByDate({});
        setMarked((prev) => {
          const m: Marked = {};
          // solo mantener seleccionado
          m[selected] = { selected: true, selectedColor: '#22C55E' };
          return m;
        });
        setDesc('Sin plan activo');
        return;
      }

      // 2) Traer plan_days del rango del mes con el título de la rutina (join)
      const { data: days, error: daysErr } = await supabase
        .from('training_plan_days')
        .select('id, date, routine_id, title, description, routines ( title )')
        .eq('plan_id', plan.id)
        .gte('date', startIso)
        .lte('date', endIso);

      if (daysErr) throw daysErr;

      // 3) Traer overrides del usuario en el mismo rango (descanso o rutina cambiada)
      const { data: ovs, error: ovErr } = await supabase
        .from('training_overrides')
        .select('date, is_rest, notes, routine_id, routines ( title )')
        .eq('user_id', userId)
        .gte('date', startIso)
        .lte('date', endIso);

      if (ovErr) throw ovErr;

      // 4) Construir mapa por fecha
      const tmp: Record<string, { label: string; hasPlan: boolean; isRest?: boolean }> = {};

      // Base: lo del plan
      (days ?? []).forEach((d: PlanDay) => {
        const key = dayjs(d.date).format('YYYY-MM-DD');
        // Manejo seguro para diferentes estructuras de routines
        let routineTitle = 'Sesión';
        if (d.title) {
          routineTitle = d.title;
        } else if (d.routines) {
          // Si es un objeto con propiedad title
          if (typeof d.routines === 'object' && !Array.isArray(d.routines) && d.routines.title) {
            routineTitle = d.routines.title;
          } 
          // Si es un array y tiene elementos
          else if (Array.isArray(d.routines) && d.routines.length > 0 && d.routines[0].title) {
            routineTitle = d.routines[0].title;
          }
        }
        
        tmp[key] = { label: routineTitle, hasPlan: true };
      });

      // Overrides pisan lo del plan
      (ovs ?? []).forEach((ov: Override) => {
        const key = dayjs(ov.date).format('YYYY-MM-DD');
        if (ov.is_rest) {
          tmp[key] = { label: 'Descanso', hasPlan: true, isRest: true };
        } else if (ov.routines?.title) {
          tmp[key] = { label: ov.routines.title, hasPlan: true };
        } else if (tmp[key]) {
          // si había algo y solo hay notas, mantenemos label anterior
          tmp[key] = { ...tmp[key] };
        }
      });

      setByDate(tmp);

      // 5) Armamos markedDates
      const m: Marked = {};
      Object.keys(tmp).forEach((iso) => {
        m[iso] = { marked: true, dotColor: '#fff' };
      });
      // resaltar seleccionado si pertenece al mes visible
      if (dayjs(selected).isSame(current, 'month')) {
        m[selected] = { ...(m[selected] || {}), selected: true, selectedColor: '#22C55E' };
      }
      setMarked(m);

      // 6) Descripción del día seleccionado
      setDesc(tmp[selected]?.label ?? 'Nada programado');
    } catch (e) {
      console.error('Error cargando calendario:', e);
      setByDate({});
      setDesc('Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [current, selected, userId]);

  // Carga al entrar y cuando cambia mes/selección
  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // Handlers de navegación de mes
  const goPrevMonth = () =>
    setCurrent(dayjs(current).startOf('month').subtract(1, 'month').format('YYYY-MM-DD'));
  const goNextMonth = () =>
    setCurrent(dayjs(current).startOf('month').add(1, 'month').format('YYYY-MM-DD'));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header superior */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Plan</Text>

        <TouchableOpacity
          onPress={() => router.push('/training/calendar/edit')}
          style={styles.circleBtn}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Card con calendario */}
      <View style={styles.card}>
        <View style={styles.monthBar}>
          <TouchableOpacity onPress={goPrevMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.monthText}>{monthLabel}</Text>

          <TouchableOpacity onPress={goNextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Calendar
          key={current.slice(0, 7)}
          firstDay={1}
          current={current}
          enableSwipeMonths
          hideArrows
          hideExtraDays
          onVisibleMonthsChange={(months) => {
            if (months?.[0]?.dateString) {
              setCurrent(months[0].dateString);
            }
          }}
          onDayPress={(d) => {
            const iso = d.dateString;
            setSelected(iso);
            // actualiza marcado y descripción sin recargar desde red
            setMarked((prev) => ({
              ...prev,
              [iso]: { ...(prev[iso] || {}), selected: true, selectedColor: '#22C55E' },
            }));
            setDesc(byDate[iso]?.label ?? 'Nada programado');
          }}
          renderHeader={() => <View />}
          markedDates={marked}
          theme={{
            calendarBackground: '#111',
            textSectionTitleColor: '#bfbfbf',
            dayTextColor: '#fff',
            todayTextColor: '#22C55E',
            monthTextColor: '#fff',
            textDisabledColor: '#6b6b6b',
            selectedDayBackgroundColor: '#22C55E',
            selectedDayTextColor: '#000',
            textDayFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
        />

        {loading && (
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>

      {/* Panel blanco inferior */}
      <View style={styles.bodyWhite}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>
            {dayjs(selected).format('dddd D')} • {desc}
          </Text>
          {activePlan ? (
            <Text style={styles.subNote}>
              Plan activo: {dayjs(activePlan.start_date).format('D MMM')} – {dayjs(activePlan.end_date).format('D MMM')}
            </Text>
          ) : (
            <Text style={styles.subNote}>Sin plan activo en este mes</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },

  topHeader: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  circleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center',
  },

  card: { backgroundColor: '#111', marginHorizontal: 20, marginTop: 10, padding: 14, borderRadius: 26 },

  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1a1a1a', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
  },
  monthText: { color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  monthArrow: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#262626', alignItems: 'center', justifyContent: 'center',
  },

  calendar: { marginTop: 12, borderRadius: 18, overflow: 'hidden' },

  bodyWhite: {
    flex: 1, backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel, borderTopRightRadius: RADII.panel,
    marginTop: 18, paddingHorizontal: 20, paddingTop: 14,
  },
  dayPill: {
    backgroundColor: '#1f1f1f', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    alignSelf: 'center', width: '85%',
  },
  dayPillText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  subNote: { color: '#cfcfcf', fontSize: 12, textAlign: 'center', marginTop: 4 },
});
