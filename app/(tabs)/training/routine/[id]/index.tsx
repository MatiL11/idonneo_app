// This file is the routine editor page
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import RoundsPill from '../../../../../src/components/training/routineBuilder/RoundsPill';
import BlockCard from '../../../../../src/components/training/routineBuilder/BlockCard';
import SelectExerciseModal from '../../../../../src/components/training/SelectExerciseModal';
import TimePickerModal from '../../../../../src/components/training/TimePickerModal'; 

import { useRoutineBuilder } from '../../../../../src/hooks/useRoutineBuilder';

export default function RoutineEditScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [targetExerciseIndex, setTargetExerciseIndex] = React.useState<number | null>(null);
  const [showTimeModal, setShowTimeModal] = React.useState(false);
  const [targetTimeBlockId, setTargetTimeBlockId] = React.useState<string | null>(null);

  const {
    routine,
    loading,
    rounds,
    blocks,
    showExerciseModal,
    setShowExerciseModal,
    setRounds,
    targetBlockId,
    setTargetBlockId,

    // actions
    openAddExerciseToBlock,
    handleSelectExercise,
    removeBlock,
    updateBlockSets,
    updateBlockRest,
    convertToSuperset,
    updateExerciseSets,
    updateExerciseReps,
    updateExerciseRepsBySet,
    updateExerciseWeightBySet,
    removeExerciseInBlock,
    changeExerciseInBlock,
    save,
  } = useRoutineBuilder(id as string);

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Cargando…' }} />
        <Text style={styles.loadingText}>Cargando rutina…</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.loadingText}>No se pudo cargar la rutina</Text>
      </View>
    );
  }

  const openTimeModal = (blockId: string) => {
    setTargetTimeBlockId(blockId);
    setShowTimeModal(true);
  };

  const handleSavePress = async () => {
    try {
      await save();
      Alert.alert('Listo', 'Rutina guardada correctamente');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la rutina');
    }
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: routine.title, headerShown: false }} />

      {/* Header negro */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{routine.title?.toUpperCase() || 'NOMBRE DE LA RUTINA'}</Text>
      </View>

      {/* Panel blanco */}
      <View style={styles.panel}>
        <RoundsPill value={rounds} onInc={() => setRounds((r) => r + 1)} onDec={() => setRounds((r) => Math.max(1, r - 1))} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onRemoveBlock={removeBlock}
              onChangeBlockSets={updateBlockSets}
              onChangeBlockRest={updateBlockRest}
              onConvertToSuperset={convertToSuperset}
              onAddExerciseToBlock={openAddExerciseToBlock}
              onChangeExerciseSets={updateExerciseSets}
              onChangeExerciseReps={updateExerciseReps}
              onChangeExerciseRepsBySet={updateExerciseRepsBySet}
              onChangeExerciseWeightBySet={updateExerciseWeightBySet}
              onRemoveExercise={removeExerciseInBlock}
              onChangeExercise={(blockId, index) => {
                setTargetBlockId(blockId);
                setShowExerciseModal(true);
                // Guardar el índice del ejercicio para reemplazarlo
                setTargetExerciseIndex(index);
              }}
              onOpenTimeModal={openTimeModal}
            />
          ))}
          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.footerBtnDark]}
            onPress={() => {
              setTargetBlockId(null);
              setShowExerciseModal(true);
            }}
          >
            <Text style={styles.footerBtnText}>AGREGAR BLOQUE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, styles.footerBtnGreen]} onPress={handleSavePress}>
            <Text style={styles.footerBtnText}>GUARDAR RUTINA</Text>
          </TouchableOpacity>
        </View>
      </View>

              <SelectExerciseModal
          visible={showExerciseModal}
          onClose={() => {
            setShowExerciseModal(false);
            setTargetBlockId(null);
            setTargetExerciseIndex(null);
          }}
          onSelectExercise={(exercise) => {
            // Usar el id como string (UUID)
            if (targetExerciseIndex !== null && targetBlockId) {
              // Cambiar ejercicio existente
              changeExerciseInBlock(targetBlockId, targetExerciseIndex, {
                id: exercise.id,
                name: exercise.name,
                image_url: exercise.image_url
              });
            } else {
              // Agregar nuevo ejercicio
              handleSelectExercise({
                id: exercise.id,
                name: exercise.name,
                image_url: exercise.image_url
              });
            }
            setShowExerciseModal(false);
            setTargetBlockId(null);
            setTargetExerciseIndex(null);
          }}
        />

        <TimePickerModal
          visible={showTimeModal}
          onClose={() => {
            setShowTimeModal(false);
            setTargetTimeBlockId(null);
          }}
          onSelectTime={(seconds) => {
            if (targetTimeBlockId) {
              // Calcular la diferencia para actualizar el tiempo
              const currentBlock = blocks.find(b => b.id === targetTimeBlockId);
              if (currentBlock) {
                const delta = seconds - currentBlock.rest_seconds;
                updateBlockRest(targetTimeBlockId, delta);
              }
            }
            setShowTimeModal(false);
            setTargetTimeBlockId(null);
          }}
          currentTime={targetTimeBlockId ? blocks.find(b => b.id === targetTimeBlockId)?.rest_seconds || 90 : 90}
        />
    </View>
  );
}

/* ====================== styles ====================== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#333', fontSize: 16 },

  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18, flex: 1, textAlign: 'center', marginRight: 32 },

  panel: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  bottomSpace: { height: 120 },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 12, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row' },
  footerBtn: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  footerBtnDark: { backgroundColor: '#222' },
  footerBtnGreen: { backgroundColor: '#16A34A' },
  footerBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.4 },
});
