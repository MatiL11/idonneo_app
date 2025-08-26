import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExerciseItem from './exerciseItem';
import { Block } from '../../../types/routine';
import { fmtTime } from '../../../utils/routine';

type Props = {
  block: Block;
  onRemoveBlock: (id: string) => void;
  onChangeBlockSets: (id: string, delta: number) => void;
  onChangeBlockRest: (id: string, delta: number) => void;
  onConvertToSuperset: (id: string) => void;
  onAddExerciseToBlock: (id: string) => void;
  onChangeExerciseSets: (blockId: string, idx: number, sets: number) => void;
  onChangeExerciseReps: (blockId: string, idx: number, reps: number) => void;
  onRemoveExercise: (blockId: string, idx: number) => void;
};

export default function BlockCard({
  block,
  onRemoveBlock,
  onChangeBlockSets,
  onChangeBlockRest,
  onConvertToSuperset,
  onAddExerciseToBlock,
  onChangeExerciseSets,
  onChangeExerciseReps,
  onRemoveExercise,
}: Props) {
  return (
    <View style={styles.blockCard}>
      <View style={styles.blockTop}>
        <TouchableOpacity onPress={() => onRemoveBlock(block.id)}>
          <Ionicons name="trash" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {block.type === 'superset' ? <Text style={styles.supersetText}>SUPERSET</Text> : null}

      <View style={styles.controlsRow}>
        <View style={styles.controlCol}>
          <Text style={styles.controlTitle}>Series</Text>
          <View style={styles.pillControl}>
            <TouchableOpacity style={styles.circleBtnDark} onPress={() => onChangeBlockSets(block.id, -1)}>
              <Ionicons name="remove" size={18} color="#333" />
            </TouchableOpacity>
            <Text style={styles.pillValue}>{block.sets}</Text>
            <TouchableOpacity style={styles.circleBtnDark} onPress={() => onChangeBlockSets(block.id, +1)}>
              <Ionicons name="add" size={18} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlCol}>
          <Text style={styles.controlTitle}>Descanso</Text>
          <View style={styles.pillControl}>
            <TouchableOpacity style={styles.circleBtnDark} onPress={() => onChangeBlockRest(block.id, -30)}>
              <Ionicons name="remove" size={18} color="#333" />
            </TouchableOpacity>
            <View style={styles.timeWrap}>
              <Ionicons name="time" size={14} color="#333" />
              <Text style={styles.timeText}>{fmtTime(block.rest_seconds)}</Text>
            </View>
            <TouchableOpacity style={styles.circleBtnDark} onPress={() => onChangeBlockRest(block.id, +30)}>
              <Ionicons name="add" size={18} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {block.exercises.map((ex, idx) => (
        <ExerciseItem
          key={`${block.id}-${idx}`}
          blockId={block.id}
          index={idx}
          exercise={ex}
          onChangeSets={onChangeExerciseSets}
          onChangeReps={onChangeExerciseReps}
          onRemove={onRemoveExercise}
        />
      ))}

      {block.type === 'single' ? (
        <TouchableOpacity style={styles.outlineBtn} onPress={() => onConvertToSuperset(block.id)}>
          <Text style={styles.outlineText}>Convertir a Superset</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.outlineBtn} onPress={() => onAddExerciseToBlock(block.id)}>
          <Text style={styles.outlineText}>Agregar ejercicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blockCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  blockTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  supersetText: {
    color: '#444444',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  controlsRow: { flexDirection: 'row', marginBottom: 10 },
  controlCol: { flex: 1 },
  controlTitle: { color: '#666666', fontSize: 12, marginBottom: 6 },
  pillControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  circleBtnDark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillValue: { color: '#333', fontWeight: '700', fontSize: 16, minWidth: 24, textAlign: 'center' },
  timeWrap: { flexDirection: 'row', alignItems: 'center' },
  timeText: { color: '#333', fontWeight: '700', fontSize: 16, marginLeft: 6 },
  outlineBtn: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#c0c0c0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineText: { color: '#333', fontWeight: '800' },
});
