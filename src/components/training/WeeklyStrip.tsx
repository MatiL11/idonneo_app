import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  white: '#fff',
  dim: '#bdbdbd',
  green: '#22C55E',
  bubble: '#14532d',
};

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function startOfWeek(d = new Date()) {
  const day = d.getDay(); // 0 dom - 6 sab
  const diff = (day === 0 ? -6 : 1) - day; // mover a lunes
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function WeeklyStrip() {
  const items = useMemo(() => {
    const monday = startOfWeek(new Date());
    return new Array(7).fill(0).map((_, idx) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + idx);
      return dt;
    });
  }, []);

  const todayKey = new Date().toDateString();

  return (
    <View style={styles.row}>
      {items.map((dt, idx) => {
        const isToday = dt.toDateString() === todayKey;
        return (
          <View key={idx.toString()} style={styles.col}>
            <Text style={[styles.day, isToday && styles.dayActive]}>{DAYS[idx]}</Text>
            <View style={[styles.pill, isToday && styles.pillActive]}>
              <Text style={[styles.date, isToday && styles.dateActive]}>{dt.getDate()}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  col: { alignItems: 'center', width: `${100 / 7}%` },
  day: { color: COLORS.dim, fontSize: 12, marginBottom: 4 },
  dayActive: { color: COLORS.white },
  pill: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  pillActive: { backgroundColor: COLORS.green },
  date: { color: COLORS.dim, fontWeight: '700' },
  dateActive: { color: COLORS.white },
});
