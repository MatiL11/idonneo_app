import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlockExercise } from '../../../types/routine';

type Props = {
  blockId: string;
  index: number;
  exercise: BlockExercise;
  onChangeSets: (blockId: string, index: number, sets: number) => void;
  onChangeReps: (blockId: string, index: number, reps: number) => void;
  onRemove: (blockId: string, index: number) => void;
};

export default function ExerciseItem({
  blockId,
  index,
  exercise: ex,
  onChangeSets,
  onChangeReps,
  onRemove,
}: Props) {
  return (
    <View style={styles.exerciseCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {ex.image_url ? (
          <Image source={{ uri: ex.image_url }} style={styles.exerciseImg} />
        ) : (
          <View style={[styles.exerciseImg, { alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image" size={18} color="#888" />
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.exerciseName}>{ex.name}</Text>

          {ex.exercise_id !== 'placeholder' && (
            <View style={styles.itemControlsRow}>
              <View style={styles.itemControlCol}>
                <Text style={styles.itemLabel}>Series</Text>
                <View style={styles.itemPill}>
                  <TouchableOpacity
                    style={styles.itemBtn}
                    onPress={() => onChangeSets(blockId, index, Math.max(1, ex.sets - 1))}
                  >
                    <Ionicons name="remove" size={14} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.itemValue}>{ex.sets}</Text>
                  <TouchableOpacity
                    style={styles.itemBtn}
                    onPress={() => onChangeSets(blockId, index, ex.sets + 1)}
                  >
                    <Ionicons name="add" size={14} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.itemControlCol, { marginLeft: 18 }]}>
                <Text style={styles.itemLabel}>Reps</Text>
                <View style={styles.itemPill}>
                  <TouchableOpacity
                    style={styles.itemBtn}
                    onPress={() => onChangeReps(blockId, index, Math.max(1, ex.reps - 1))}
                  >
                    <Ionicons name="remove" size={14} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.itemValue}>{ex.reps}</Text>
                  <TouchableOpacity
                    style={styles.itemBtn}
                    onPress={() => onChangeReps(blockId, index, ex.reps + 1)}
                  >
                    <Ionicons name="add" size={14} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {ex.exercise_id !== 'placeholder' ? (
        <TouchableOpacity onPress={() => onRemove(blockId, index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color="#bdbdbd" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0' },
  exerciseName: { color: '#333', fontWeight: '700', fontSize: 16 },
  itemControlsRow: { flexDirection: 'row', marginTop: 8 },
  itemControlCol: { alignItems: 'center' },
  itemLabel: { color: '#666666', fontSize: 10, marginBottom: 4 },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemValue: { color: '#333', fontWeight: '700', fontSize: 14, minWidth: 26, textAlign: 'center', marginHorizontal: 8 },
});
