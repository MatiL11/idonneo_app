import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../src/styles/tokens';

// Configuración de locale para el calendario
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
    'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

dayjs.locale('es');

type Marked = Record<
  string,
  { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
>;

export default function CalendarMonthScreen() {
  const router = useRouter();
  const today = dayjs().format('YYYY-MM-DD');

  // fecha “ancla” del mes visible (usa siempre una fecha dentro del mes)
  const [current, setCurrent] = useState<string>(today);
  const [selected, setSelected] = useState<string>(today);
  const [marked, setMarked] = useState<Marked>({});
  const [desc, setDesc] = useState<string>('');

  // MOCK de plantilla semanal (cámbialo por datos reales desde Supabase)
  const weekTemplate = useMemo(
    () => ({
      1: { name: 'Pecho / Tríceps' }, // Lunes
      2: { name: 'Espalda / Bíceps' },
      3: null,
      4: { name: 'Piernas' },
      5: { name: 'Hombros' },
      6: null,
      7: null, // Domingo
    }),
    []
  );

  useEffect(() => {
    const start = dayjs(current).startOf('month');
    const end = dayjs(current).endOf('month');

    const m: Marked = {};
    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      const iso = d.format('YYYY-MM-DD');
      const weekday = (d.day() + 6) % 7 + 1;
      const tpl = (weekTemplate as any)[weekday];
      if (tpl) m[iso] = { ...(m[iso] || {}), marked: true, dotColor: '#fff' };
    }

    if (dayjs(selected).isSame(current, 'month')) {
      m[selected] = { ...(m[selected] || {}), selected: true, selectedColor: '#22C55E' };
    }

    setMarked(m);
    updateDesc(selected);
  }, [current, selected, weekTemplate]);

  const updateDesc = (iso: string) => {
    const d = dayjs(iso);
    const weekday = (d.day() + 6) % 7 + 1;
    const tpl = (weekTemplate as any)[weekday];
    setDesc(tpl ? tpl.name : 'Nada programado');
  };

  // Navegación manual de meses: siempre anclar al día 1 del mes resultante
  const goPrevMonth = () =>
    setCurrent(dayjs(current).startOf('month').subtract(1, 'month').format('YYYY-MM-DD'));
  const goNextMonth = () =>
    setCurrent(dayjs(current).startOf('month').add(1, 'month').format('YYYY-MM-DD'));

  const monthLabel = dayjs(current).format('MMMM YYYY');

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

      {/* Card negro con calendario */}
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
          key={current.slice(0, 7)}     // fuerza re-render al cambiar de mes (AAAA-MM)
          firstDay={1}                  // semana empieza en lunes
          current={current}
          enableSwipeMonths
          hideArrows                    // usamos nuestras flechas personalizadas
          hideExtraDays                 // oculta días de otros meses
          onVisibleMonthsChange={(months) => {
            if (months?.[0]?.dateString) {
              // sincroniza el estado cuando el usuario hace swipe
              setCurrent(months[0].dateString);
            }
          }}
          onDayPress={(d) => {
            setSelected(d.dateString);
            setCurrent(d.dateString);   // mantiene el “ancla” dentro del mes
          }}
          renderHeader={() => <View />} // header custom arriba (monthBar)
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
      </View>

      {/* Panel blanco inferior */}
      <View style={styles.bodyWhite}>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>
            {dayjs(selected).format('dddd D')} • {desc}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },

  /** Header superior */
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
    backgroundColor: '#1e1e1e',
    alignItems: 'center', justifyContent: 'center',
  },

  /** Card negro del calendario */
  card: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 14,
    borderRadius: 26,
  },

  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  monthText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  monthArrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#262626',
    alignItems: 'center', justifyContent: 'center',
  },

  calendar: {
    marginTop: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },

  /** Panel blanco inferior */
  bodyWhite: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  /** Pill de estado del día */
  dayPill: {
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignSelf: 'center',
    width: '80%',
  },
  dayPillText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
