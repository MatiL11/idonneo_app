import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ExerciseItem from './ExerciseItem';
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
  onChangeExerciseRepsBySet: (blockId: string, idx: number, setIndex: number, reps: number) => void;
  onChangeExerciseWeightBySet: (blockId: string, idx: number, setIndex: number, weight: number) => void;
  onRemoveExercise: (blockId: string, idx: number) => void;
  onChangeExercise?: (blockId: string, idx: number) => void;
  onOpenTimeModal: (blockId: string) => void;
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
  onChangeExerciseRepsBySet,
  onChangeExerciseWeightBySet,
  onRemoveExercise,
  onChangeExercise,
  onOpenTimeModal,
}: Props) {
  return (
    <View style={styles.blockCard}>
      <View style={styles.blockTop}>
        {/* Drag handle (3 líneas) */}
        <View style={styles.dragHandle}>
          <View style={styles.dragLine} />
          <View style={styles.dragLine} />
          <View style={styles.dragLine} />
        </View>
        
        {block.type === 'superset' ? <Text style={styles.supersetText}>SUPERSET</Text> : null}

        {/* Botón de eliminar */}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onRemoveBlock(block.id)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="trash" size={18} color="#cececeff" />
        </TouchableOpacity>
      </View>


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
            <View style={styles.timeIconWrap}>
              <Ionicons name="time" size={24} color="#fff" style={styles.timeIcon} />
            </View>
            <TouchableOpacity 
              style={styles.timePill} 
              onPress={() => onOpenTimeModal(block.id)}
              activeOpacity={0.7}
            >
              <View style={styles.timeContent}>
                <Text style={styles.timeText}>{fmtTime(block.rest_seconds)}</Text>
                <Ionicons name="chevron-down" size={14} color="#666" style={styles.timeEditIcon} />
              </View>
            </TouchableOpacity>
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
          onChangeRepsBySet={onChangeExerciseRepsBySet}
          onChangeWeightBySet={onChangeExerciseWeightBySet}
          onRemove={onRemoveExercise}
          onChangeExercise={onChangeExercise}
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
    backgroundColor: '#222222',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  blockTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
  },
  dragHandle: {
    width: 30,
    height: 15,
    justifyContent: 'space-between',
  },
  dragLine: {
    height: 2,
    backgroundColor: '#cececeff',
    borderRadius: 1,
    width: 30,
    marginVertical: 1.5,
  },
  deleteButton: {
    padding: 5,
  },
  supersetText: {
    color: '#cececeff',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  controlsRow: { flexDirection: 'row', marginBottom: 2, gap: 110 },
  controlCol: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlTitle: { color: '#ffff', fontSize: 14, marginBottom: 0 },
  pillControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  circleBtnDark: {
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillValue: { color: '#333', fontWeight: '700', fontSize: 16, minWidth: 24, textAlign: 'center' },
  timeIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  timeIcon: {
    marginRight: 0,
  },
  timePill: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    // Indicador visual de que es clickeable
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  timeText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  timeEditIcon: {
    marginLeft: 2,
  },
  timeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    marginTop: 12,
    backgroundColor: '#ffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineText: { color: '#333', fontWeight: '800' },
});
