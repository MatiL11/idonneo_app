import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../../../src/styles/tokens';
import { useRoutineBuilder } from '../../../../../src/hooks/useRoutineBuilder';

const { width: screenWidth } = Dimensions.get('window');

interface Exercise {
  exercise_id: string;
  name: string;
  image_url?: string | null;
  reps: number;
  sets: number;
  reps_by_set: number[];
  weight_by_set: number[];
}

interface Block {
  id: string;
  type: 'single' | 'superset';
  sets: number;
  rest_seconds: number;
  exercises: Exercise[];
}

export default function TrainingSessionScreen() {
  const router = useRouter();
  const { id: routineId, warmupEnabled, warmupCompleted } = useLocalSearchParams();
  const { routine, blocks, loading } = useRoutineBuilder(routineId as string);
  
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(new Date());
  const [actualReps, setActualReps] = useState<{ [key: string]: number[] }>({});
  const [actualWeights, setActualWeights] = useState<{ [key: string]: number[] }>({});
  
  // Determinar si el calentamiento fue completado basado en los parámetros
  const isWarmupCompleted = warmupEnabled === 'true' && warmupCompleted === 'true';
  
  // Si no hay calentamiento habilitado, considerar como no completado
  const finalWarmupStatus = warmupEnabled === 'false' ? false : isWarmupCompleted;
  
  // Log adicional para debug
  console.log('Parámetros recibidos en session:');
  console.log('  warmupEnabled:', warmupEnabled);
  console.log('  warmupCompleted:', warmupCompleted);
  console.log('  isWarmupCompleted:', isWarmupCompleted);
  console.log('  finalWarmupStatus:', finalWarmupStatus);

  const currentBlock = blocks[currentBlockIndex];
  const currentExercise = currentBlock?.exercises[currentExerciseIndex];

  // Establecer tiempo de inicio de la sesión y log de datos de la rutina
  useEffect(() => {
    if (blocks && blocks.length > 0) {
      setSessionStartTime(new Date());
      
      // Log de la configuración de calentamiento
      console.log('Configuración de calentamiento:');
      console.log('  warmupEnabled:', warmupEnabled);
      console.log('  warmupCompleted:', warmupCompleted);
      console.log('  isWarmupCompleted:', isWarmupCompleted);
      
      // Log de los datos de la rutina cargados
      console.log('Datos de la rutina cargados:');
      blocks.forEach((block, blockIndex) => {
        console.log(`Bloque ${blockIndex + 1} (${block.type}):`);
        block.exercises.forEach((exercise, exerciseIndex) => {
          console.log(`  Ejercicio ${exerciseIndex + 1}: ${exercise.name}`);
          console.log(`  Reps por set:`, exercise.reps_by_set);
          console.log(`  Sets:`, exercise.sets);
          console.log(`  Reps base:`, exercise.reps);
        });
      });
    }
  }, [blocks, warmupEnabled, warmupCompleted, isWarmupCompleted, finalWarmupStatus]);

  // Timer para el descanso
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isResting && restTimeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTimeLeft, isPaused]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextExercise = () => {
    if (!currentBlock) return;

    console.log('Estado actual:', {
      currentBlockIndex,
      currentSetIndex,
      currentExerciseIndex,
      totalBlocks: blocks.length,
      totalSets: currentBlock.sets,
      totalExercises: currentBlock.exercises.length
    });

    if (currentExerciseIndex < currentBlock.exercises.length - 1) {
      // Siguiente ejercicio en el mismo bloque
      console.log('Siguiente ejercicio en el mismo bloque');
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else if (currentSetIndex < currentBlock.sets - 1) {
      // Siguiente serie del mismo bloque
      console.log('Siguiente serie del mismo bloque');
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(currentSetIndex + 1);
      // Iniciar descanso entre series
      setIsResting(true);
      setRestTimeLeft(60); // 1 minuto entre series
    } else if (currentBlockIndex < blocks.length - 1) {
      // Siguiente bloque
      console.log('Siguiente bloque');
      setCurrentBlockIndex(currentBlockIndex + 1);
      setCurrentSetIndex(0);
      setCurrentExerciseIndex(0);
      // Iniciar descanso entre bloques
      setIsResting(true);
      setRestTimeLeft(currentBlock.rest_seconds);
    } else {
      // Terminó el entrenamiento - navegar con datos de la sesión
      console.log('¡ENTRENAMIENTO COMPLETADO! Navegando a pantalla de completado...');
      
             const sessionData = {
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
             reps_per_set: exercise.reps_by_set || Array(block.sets).fill(exercise.reps || 10),
             weight_per_set: actualWeights[exercise.exercise_id] || Array(block.sets).fill(0),
           })),
         })),
         startTime: sessionStartTime,
         endTime: new Date(),
                           warmupCompleted: finalWarmupStatus,
       };
      
             console.log('Session data a enviar:', sessionData);
       console.log('startTime type:', typeof sessionData.startTime, sessionData.startTime);
       console.log('endTime type:', typeof sessionData.endTime, sessionData.endTime);
       
       // Log de las repeticiones por ejercicio
       sessionData.blocks.forEach((block, blockIndex) => {
         console.log(`Bloque ${blockIndex + 1} (${block.type}):`);
         block.exercises.forEach((exercise, exerciseIndex) => {
           console.log(`  Ejercicio ${exerciseIndex + 1}: ${exercise.name}`);
           console.log(`    Reps por set:`, exercise.reps_per_set);
           console.log(`    Sets completados:`, exercise.sets_completed);
         });
       });
      
      // Navegar a la pantalla de completado con los datos de la sesión
      try {
        const paramsToSend = { sessionData: JSON.stringify(sessionData) };
        console.log('Parámetros a enviar:', paramsToSend);
        
        router.push({
          pathname: `/training/routine/${routineId}/completed`,
          params: paramsToSend
        });
      } catch (error) {
        console.error('Error al navegar:', error);
        // Fallback: navegación simple
        router.push(`/training/routine/${routineId}/completed`);
      }
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando entrenamiento...</Text>
        </View>
      </View>
    );
  }

  if (!currentBlock || !currentExercise) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay ejercicios para mostrar</Text>
        </View>
      </View>
    );
  }

  if (isResting) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>TIEMPO DE DESCANSO</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Rest Timer */}
        <View style={styles.restContainer}>
          <View style={styles.restIcon}>
            <Ionicons name="timer" size={80} color={COLORS.green} />
          </View>
          
          <Text style={styles.restTitle}>Descanso</Text>
          <Text style={styles.restSubtitle}>
            {currentSetIndex < currentBlock.sets - 1 
              ? 'Entre series' 
              : 'Entre bloques'
            }
          </Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(restTimeLeft)}</Text>
          </View>
          
          <Text style={styles.restInfo}>
            Bloque {currentBlockIndex + 1} - Serie {currentSetIndex + 1}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.pauseButton} onPress={handlePauseResume}>
            <Ionicons 
              name={isPaused ? "play" : "pause"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.pauseText}>
              {isPaused ? "REANUDAR" : "PAUSAR"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipRest}>
            <Text style={styles.skipText}>SALTAR DESCANSO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>ENTRENAMIENTO</Text>
        <View style={styles.placeholder} />
      </View>

             {/* Progress */}
       <View style={styles.progressContainer}>
         <View style={styles.progressBar}>
           <View 
             style={[
               styles.progressFill, 
               { 
                 width: `${((currentBlockIndex * blocks.length + currentSetIndex * currentBlock.sets + currentExerciseIndex + 1) / (blocks.reduce((total, block) => total + block.sets * block.exercises.length, 0))) * 100}%` 
               }
             ]} 
           />
         </View>
         <Text style={styles.progressText}>
           Bloque {currentBlockIndex + 1} de {blocks.length} - 
           Serie {currentSetIndex + 1} de {currentBlock.sets}
         </Text>
         <Text style={styles.progressDetail}>
           Ejercicio {currentExerciseIndex + 1} de {currentBlock.exercises.length} • 
           Total: {Math.round(((currentBlockIndex * blocks.length + currentSetIndex * currentBlock.sets + currentExerciseIndex + 1) / (blocks.reduce((total, block) => total + block.sets * block.exercises.length, 0))) * 100)}%
         </Text>
       </View>

      {/* Current Exercise */}
      <View style={styles.exerciseContainer}>
        <View style={styles.exerciseImageContainer}>
          {currentExercise.image_url ? (
            <Image 
              source={{ uri: currentExercise.image_url }} 
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.exercisePlaceholder}>
              <Ionicons name="fitness" size={60} color="#666" />
            </View>
          )}
        </View>
        
        <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        
        <View style={styles.exerciseInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="repeat" size={20} color="#666" />
            <Text style={styles.infoText}>
              {currentExercise.reps_by_set[currentSetIndex] || currentExercise.reps} repeticiones
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="layers" size={20} color="#666" />
            <Text style={styles.infoText}>
              Serie {currentSetIndex + 1} de {currentBlock.sets}
            </Text>
          </View>
          
          {currentBlock.type === 'superset' && (
            <View style={styles.infoRow}>
              <Ionicons name="flash" size={20} color="#666" />
              <Text style={styles.infoText}>
                Superset con {currentBlock.exercises.length} ejercicios
              </Text>
            </View>
          )}
        </View>
      </View>

             {/* Action Buttons */}
       <View style={styles.actionContainer}>
         <TouchableOpacity style={styles.pauseButton} onPress={handlePauseResume}>
           <Ionicons 
             name={isPaused ? "play" : "pause"} 
             size={24} 
             color="#fff" 
           />
           <Text style={styles.pauseText}>
             {isPaused ? "REANUDAR" : "PAUSAR"}
           </Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.nextButton} onPress={handleNextExercise}>
           <Text style={styles.nextText}>SIGUIENTE</Text>
         </TouchableOpacity>
         
         {/* Botón manual para completar entrenamiento */}
         <TouchableOpacity 
           style={styles.completeButton} 
                       onPress={() => {
              console.log('Completando entrenamiento manualmente...');
                             const sessionData = {
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
                     reps_per_set: exercise.reps_by_set || Array(block.sets).fill(exercise.reps || 10),
                     weight_per_set: actualWeights[exercise.exercise_id] || Array(block.sets).fill(0),
                   })),
                 })),
                 startTime: sessionStartTime,
                 endTime: new Date(),
                 warmupCompleted: finalWarmupStatus,
               };
              
                             console.log('Session data manual:', sessionData);
               console.log('startTime manual type:', typeof sessionData.startTime, sessionData.startTime);
               console.log('endTime manual type:', typeof sessionData.endTime, sessionData.endTime);
               
               // Log de las repeticiones por ejercicio (manual)
               sessionData.blocks.forEach((block, blockIndex) => {
                 console.log(`Bloque ${blockIndex + 1} (${block.type}) - Manual:`);
                 block.exercises.forEach((exercise, exerciseIndex) => {
                   console.log(`  Ejercicio ${exerciseIndex + 1}: ${exercise.name}`);
                   console.log(`    Reps por set:`, exercise.reps_per_set);
                   console.log(`    Sets completados:`, exercise.sets_completed);
                 });
               });
              
              const paramsToSend = { sessionData: JSON.stringify(sessionData) };
              console.log('Parámetros manuales a enviar:', paramsToSend);
              
              router.push({
                pathname: `/training/routine/${routineId}/completed`,
                params: paramsToSend
              });
            }}
         >
           <Text style={styles.completeText}>COMPLETAR ENTRENAMIENTO</Text>
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
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
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
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 4,
  },
     progressText: {
     color: '#fff',
     fontSize: 14,
     textAlign: 'center',
   },
   progressDetail: {
     color: '#ccc',
     fontSize: 12,
     textAlign: 'center',
     marginTop: 5,
   },
  exerciseContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  exerciseImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exercisePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  exerciseInfo: {
    width: '100%',
    gap: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#ccc',
  },
  restContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  restIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  restTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  restSubtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 40,
  },
  timerContainer: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.green,
  },
  restInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 15,
  },
  pauseButton: {
    backgroundColor: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  pauseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  nextButton: {
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
     nextText: {
     fontSize: 16,
     fontWeight: '700',
     color: '#fff',
     letterSpacing: 0.5,
   },
   completeButton: {
     backgroundColor: '#FF6B35',
     paddingVertical: 16,
     borderRadius: 12,
     alignItems: 'center',
     elevation: 5,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.25,
     shadowRadius: 3.84,
   },
   completeText: {
     fontSize: 16,
     fontWeight: '700',
     color: '#fff',
     letterSpacing: 0.5,
   },
   skipButton: {
     backgroundColor: 'transparent',
     borderWidth: 2,
     borderColor: '#666',
     paddingVertical: 16,
     borderRadius: 12,
     alignItems: 'center',
   },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});
