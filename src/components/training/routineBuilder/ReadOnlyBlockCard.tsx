import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Block } from '../../../types/routine';
import { fmtTime } from '../../../utils/routine';

type Props = {
  block: Block;
};

export default function ReadOnlyBlockCard({ block }: Props) {
  const isSuperset = block.type === 'superset';
  
  return (
    <View style={[styles.card, isSuperset && styles.supersetCard]}>
      {/* Línea verde para supersets */}
      {isSuperset && <View style={styles.supersetLine} />}
      
      {/* Indicador del tipo de bloque */}
      <View style={styles.blockTypeIndicator}>
        <View style={[styles.typeBadge, isSuperset ? styles.supersetBadge : styles.singleBadge]}>
          <Text style={styles.typeText}>
            {isSuperset ? 'SUPERSET' : 'EJERCICIO'}
          </Text>
        </View>
      </View>
      
      <View style={styles.exercises}>
        {block.exercises.map((exercise, idx) => (
          <View key={idx} style={[styles.exerciseItem, isSuperset && styles.supersetExerciseItem]}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIcon}>
                {exercise.image_url ? (
                  <Image source={{ uri: exercise.image_url }} style={styles.exerciseImage} />
                ) : (
                  <Text style={styles.exerciseInitial}>{exercise.name.charAt(0)}</Text>
                )}
              </View>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
            </View>

            <View style={styles.exerciseMetrics}>
              <Text style={styles.setsInfo}>
                {exercise.sets}x
              </Text>
              <View style={styles.repsPills}>
                {Array.from({ length: exercise.sets }).map((_, setIdx) => (
                  <View key={setIdx} style={styles.repPill}>
                    <Text style={styles.repText}>
                      {exercise.reps_by_set && exercise.reps_by_set[setIdx] !== undefined 
                        ? exercise.reps_by_set[setIdx] 
                        : exercise.reps}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    paddingTop: 20,
    marginBottom: 16,
    position: 'relative',
  },
  supersetCard: {
    backgroundColor: '#2A2A2A',
    paddingLeft: 24,
    paddingTop: 20,
  },
  supersetLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  blockTypeIndicator: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  supersetBadge: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  singleBadge: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  exercises: {
    gap: 12,
  },
  exerciseItem: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
  },
  supersetExerciseItem: {
    backgroundColor: '#333333',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  exerciseInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  exerciseMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setsInfo: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  repsPills: {
    flexDirection: 'row',
    gap: 4,
  },
  repPill: {
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  repText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
