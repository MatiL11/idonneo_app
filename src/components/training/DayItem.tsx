import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type DayVM = {
  iso: string;
  isToday: boolean;
  label: string;
  hasRoutine: boolean;
  title?: string;
  subtitle?: string;
};

type Props = {
  item: DayVM;
  isOpen: boolean;
  onToggle: (iso: string) => void;
  onAdd: (iso: string) => void;
  onMenu: (iso: string, title: string) => void;
};

function DayItemCmp({ item, isOpen, onToggle, onAdd, onMenu }: Props) {
  return (
    <View style={styles.itemWrap}>
      <View style={[styles.dayRow, isOpen && styles.dayRowOpen]}>
        <TouchableOpacity style={styles.rowTapZone} activeOpacity={0.7} onPress={() => onToggle(item.iso)}>
          <Text style={[styles.dayCode, item.isToday && styles.dayCodeToday]}>{item.label}</Text>
          <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#7a7a7a" />
        </TouchableOpacity>

        {!item.hasRoutine && (
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.7} onPress={() => onAdd(item.iso)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {isOpen && (
        <View style={styles.detailArea}>
          {item.hasRoutine ? (
            <View style={styles.routineCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineTitle}>{item.title}</Text>
                <Text style={styles.routineSubtitle}>{item.subtitle}</Text>
              </View>
              <TouchableOpacity onPress={() => onMenu(item.iso, item.title || '')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyPill}>
              <Text style={styles.emptyPillText}>Nada programado</Text>
              <TouchableOpacity style={styles.addRoutineSmall} onPress={() => onAdd(item.iso)}>
                <Text style={styles.addRoutineSmallText}>Agregar rutina</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export const DayItem = memo(DayItemCmp);

const styles = StyleSheet.create({
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
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
  addRoutineSmall: {
    marginTop: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  addRoutineSmallText: { color: '#fff', fontSize: 12 },
});
