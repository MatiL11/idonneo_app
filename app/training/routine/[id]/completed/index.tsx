import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../../../src/styles/tokens';
import { useRoutineBuilder } from '../../../../../src/hooks/useRoutineBuilder';
import { supabase } from '../../../../../src/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface ExerciseSummary {
  exercise_id: string;
  name: string;
  image_url?: string | null;
  sets_completed: number;
  reps_per_set: number[];
  weight_per_set: number[];
}

interface BlockSummary {
  id: string;
  type: 'single' | 'superset';
  sets_completed: number;
  rest_seconds: number;
  exercises: ExerciseSummary[];
}

interface SessionData {
  routineId: string;
  blocks: BlockSummary[];
  startTime: Date | null;
  endTime: Date | null;
  warmupCompleted: boolean;
}

export default function CompletedSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id: routineId } = params;
  const { routine, blocks, loading } = useRoutineBuilder(routineId as string);
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Obtener datos reales de la sesión desde los parámetros de navegación
  useEffect(() => {
    // Evitar ejecutar si ya tenemos sessionData
    if (sessionData) return;
    
    const sessionDataParam = params.sessionData;
    
    if (sessionDataParam && typeof sessionDataParam === 'string') {
      try {
        const parsedSessionData = JSON.parse(sessionDataParam);
        console.log('Session data recibida (raw):', parsedSessionData);
        
        // Convertir las fechas de string a Date
        const processedSessionData: SessionData = {
          ...parsedSessionData,
          startTime: parsedSessionData.startTime ? new Date(parsedSessionData.startTime) : null,
          endTime: parsedSessionData.endTime ? new Date(parsedSessionData.endTime) : null,
        };
        
                 console.log('Session data procesada:', processedSessionData);
         
         // Log detallado de los datos procesados
         processedSessionData.blocks.forEach((block, blockIndex) => {
           console.log(`Bloque ${blockIndex + 1} procesado (${block.type}):`);
           block.exercises.forEach((exercise, exerciseIndex) => {
             console.log(`  Ejercicio ${exerciseIndex + 1}: ${exercise.name}`);
             console.log(`    Reps por set:`, exercise.reps_per_set);
             console.log(`    Sets completados:`, exercise.sets_completed);
           });
         });
         
         setSessionData(processedSessionData);
      } catch (error) {
        console.error('Error parsing session data:', error);
        // Fallback a datos simulados si hay error
        if (blocks && blocks.length > 0) {
          const fallbackSessionData: SessionData = {
            routineId: routineId as string,
            blocks: blocks.map(block => ({
              id: block.id,
              type: block.type,
              sets_completed: block.sets,
              rest_seconds: block.rest_seconds,
              exercises: block.exercises.map(exercise => ({
                exercise_id: exercise.exercise_id,
                name: exercise.name,
                image_url: exercise.image_url,
                sets_completed: block.sets,
                reps_per_set: Array(block.sets).fill(exercise.reps || 10),
                weight_per_set: Array(block.sets).fill(0),
              })),
            })),
            startTime: new Date(Date.now() - 45 * 60 * 1000),
            endTime: new Date(),
            warmupCompleted: true,
          };
          setSessionData(fallbackSessionData);
        }
      }
    } else if (blocks && blocks.length > 0) {
      // Fallback a datos simulados si no hay parámetros
      const fallbackSessionData: SessionData = {
        routineId: routineId as string,
        blocks: blocks.map(block => ({
          id: block.id,
          type: block.type,
          sets_completed: block.sets,
          rest_seconds: block.rest_seconds,
          exercises: block.exercises.map(exercise => ({
            exercise_id: exercise.exercise_id,
            name: exercise.name,
            image_url: exercise.image_url,
            sets_completed: block.sets,
            reps_per_set: Array(block.sets).fill(exercise.reps || 10),
            weight_per_set: Array(block.sets).fill(0),
          })),
        })),
        startTime: new Date(Date.now() - 45 * 60 * 1000),
        endTime: new Date(),
        warmupCompleted: true,
      };
      setSessionData(fallbackSessionData);
    }
  }, [blocks, routineId, params.sessionData, sessionData]);

  const formatDuration = (startTime: Date | null, endTime: Date | null): string => {
    if (!startTime || !endTime) return '0m';
    
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const saveSessionHistory = async () => {
    if (!sessionData) return;
    
    setIsSaving(true);
    
    try {
             // 1. Crear la sesión completada
       const { data: session, error: sessionError } = await supabase
         .from('completed_sessions')
         .insert({
           user_id: (await supabase.auth.getUser()).data.user?.id,
           routine_id: sessionData.routineId,
           started_at: sessionData.startTime?.toISOString() || new Date().toISOString(),
           completed_at: sessionData.endTime?.toISOString() || new Date().toISOString(),
           total_duration_minutes: sessionData.startTime && sessionData.endTime 
             ? Math.floor((sessionData.endTime.getTime() - sessionData.startTime.getTime()) / (1000 * 60))
             : 0,
           warmup_completed: sessionData.warmupCompleted,
         })
         .select()
         .single();

      if (sessionError) throw sessionError;

      // 2. Crear los bloques de la sesión
      for (let i = 0; i < sessionData.blocks.length; i++) {
        const block = sessionData.blocks[i];
        
        const { data: sessionBlock, error: blockError } = await supabase
          .from('session_blocks')
          .insert({
            session_id: session.id,
            block_order: i + 1,
            block_type: block.type,
            sets_completed: block.sets_completed,
            rest_seconds: block.rest_seconds,
          })
          .select()
          .single();

        if (blockError) throw blockError;

        // 3. Crear los ejercicios de la sesión
        for (let j = 0; j < block.exercises.length; j++) {
          const exercise = block.exercises[j];
          
          const { error: exerciseError } = await supabase
            .from('session_exercises')
            .insert({
              session_block_id: sessionBlock.id,
              exercise_id: exercise.exercise_id,
              exercise_order: j + 1,
              sets_completed: exercise.sets_completed,
              reps_per_set: exercise.reps_per_set,
              weight_per_set: exercise.weight_per_set,
            });

          if (exerciseError) throw exerciseError;
        }
      }

      setIsSaved(true);
      Alert.alert(
        '¡Éxito!',
        'Tu sesión de entrenamiento ha sido guardada en el historial.',
        [{ text: 'OK', onPress: () => router.push('/training') }]
      );
      
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar la sesión. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishWithoutSaving = () => {
    Alert.alert(
      '¿Estás seguro?',
      'Si no guardas la sesión, perderás todo el historial de este entrenamiento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'No guardar', style: 'destructive', onPress: () => router.push('/index') }
      ]
    );
  };

  if (loading || !sessionData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {loading ? 'Cargando resumen...' : 'Preparando datos de la sesión...'}
          </Text>
          {!loading && !sessionData && (
            <Text style={styles.loadingSubtext}>
              No se recibieron datos de la sesión
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.title}>ENTRENAMIENTO COMPLETADO</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Session Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
                     <View style={styles.summaryRow}>
             <Ionicons name="time" size={24} color={COLORS.green} />
             <Text style={styles.summaryLabel}>Duración total:</Text>
             <Text style={styles.summaryValue}>
               {sessionData.startTime && sessionData.endTime 
                 ? formatDuration(sessionData.startTime, sessionData.endTime)
                 : 'No disponible'
               }
             </Text>
           </View>
          
          <View style={styles.summaryRow}>
            <Ionicons name="fitness" size={24} color={COLORS.green} />
            <Text style={styles.summaryLabel}>Bloques completados:</Text>
            <Text style={styles.summaryValue}>{sessionData.blocks.length}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Ionicons name="flame" size={24} color={COLORS.green} />
            <Text style={styles.summaryLabel}>Calentamiento:</Text>
            <Text style={styles.summaryValue}>
              {sessionData.warmupCompleted ? 'Completado' : 'No realizado'}
            </Text>
          </View>
        </View>
      </View>

      {/* Blocks Summary */}
      <ScrollView style={styles.blocksContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Resumen de Bloques</Text>
        
        {sessionData.blocks.map((block, blockIndex) => (
          <View key={block.id} style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>
                Bloque {blockIndex + 1} - {block.type === 'superset' ? 'Superset' : 'Ejercicio Único'}
              </Text>
              <Text style={styles.blockSubtitle}>
                {block.sets_completed} series completadas
              </Text>
            </View>
            
            {block.exercises.map((exercise, exerciseIndex) => (
              <View key={exercise.exercise_id} style={styles.exerciseItem}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseImageContainer}>
                    {exercise.image_url ? (
                      <Image 
                        source={{ uri: exercise.image_url }} 
                        style={styles.exerciseImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.exercisePlaceholder}>
                        <Ionicons name="fitness" size={24} color="#666" />
                      </View>
                    )}
                  </View>
                  
                                     <View style={styles.exerciseInfo}>
                     <Text style={styles.exerciseName}>{exercise.name}</Text>
                     <Text style={styles.exerciseDetails}>
                       {exercise.sets_completed} series
                     </Text>
                   </View>
                </View>
                
                {/* Sets Summary */}
                <View style={styles.setsSummary}>
                  {exercise.reps_per_set.map((reps, setIndex) => (
                    <View key={setIndex} style={styles.setItem}>
                      <Text style={styles.setNumber}>S{setIndex + 1}</Text>
                      <Text style={styles.setReps}>{reps} reps</Text>
                      {exercise.weight_per_set[setIndex] > 0 && (
                        <Text style={styles.setWeight}>{exercise.weight_per_set[setIndex]}kg</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.finishButton} 
          onPress={handleFinishWithoutSaving}
          disabled={isSaving}
        >
          <Text style={styles.finishText}>TERMINAR SIN GUARDAR</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, isSaved && styles.saveButtonDisabled]} 
          onPress={saveSessionHistory}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <View style={styles.loadingButton}>
              <Text style={styles.loadingButtonText}>GUARDANDO...</Text>
            </View>
          ) : isSaved ? (
            <View style={styles.savedButton}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.savedButtonText}>GUARDADO</Text>
            </View>
          ) : (
            <Text style={styles.saveText}>GUARDAR EN HISTORIAL</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    gap: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#ccc',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  blocksContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  blockCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  blockHeader: {
    marginBottom: 20,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  blockSubtitle: {
    fontSize: 14,
    color: '#ccc',
  },
  exerciseItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  exerciseImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exercisePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#ccc',
  },
  setsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  setItem: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  setNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.green,
    marginBottom: 2,
  },
  setReps: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  setWeight: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 15,
  },
  finishButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonDisabled: {
    backgroundColor: '#4CAF50',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
     loadingText: {
     fontSize: 18,
     color: '#fff',
     fontWeight: '600',
     marginBottom: 10,
   },
   loadingSubtext: {
     fontSize: 14,
     color: '#ccc',
     textAlign: 'center',
   },
});
