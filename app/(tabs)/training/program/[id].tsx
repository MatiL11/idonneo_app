import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../src/lib/supabase';
import { COLORS } from '../../../../src/styles/tokens';
import { useAuthStore } from '../../../../src/lib/store';

interface ProgramDetail {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface RoutineDetail {
  id: string;
  title: string;
  exercises: {
    id: string;
    name: string;
    sets: number | null;
    reps: string | null;
    rest_seconds: number | null;
    image_url?: string | null;
  }[];
}

interface WeekdayRoutineMapping {
  weekday: number;
  routine: RoutineDetail | null;
  is_rest: boolean;
}

// Convert weekday number to name
const getWeekdayName = (weekday: number): string => {
  const weekdays = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return weekdays[weekday] || '';
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams();
  const userId = useAuthStore(state => state.user?.id);
  
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [weekdayRoutines, setWeekdayRoutines] = useState<WeekdayRoutineMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !userId) return;
    
    fetchProgramDetails();
  }, [id, userId]);

  const fetchProgramDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch program details
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('id, title, description, created_at')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (programError) throw programError;
      if (!programData) throw new Error('Programa no encontrado');
      
      setProgram(programData);
      
      // Fetch program week templates with routine info
      const { data: weekTemplates, error: templatesError } = await supabase
        .from('program_week_template')
        .select('weekday, routine_id')
        .eq('program_id', id)
        .order('weekday');
      
      if (templatesError) throw templatesError;
      
      // Create a mapping for each day of the week
      const weekMapping: WeekdayRoutineMapping[] = [];
      for (let i = 1; i <= 7; i++) {
        const template = weekTemplates.find(t => t.weekday === i);
        weekMapping.push({
          weekday: i,
          routine: null, // Will populate with routine details
          is_rest: !template // If no template for this day, it's a rest day
        });
      }
      
      // Fetch all routine details in one go
      const routineIds = weekTemplates.map(t => t.routine_id).filter(Boolean);
      if (routineIds.length > 0) {
        const { data: routines, error: routinesError } = await supabase
          .from('routines')
          .select('id, title')
          .in('id', routineIds);
          
        if (routinesError) throw routinesError;
        
        // Fetch exercises for all routines
        for (const routine of routines) {
          const { data: exercises, error: exercisesError } = await supabase
            .from('routine_exercises')
            .select(`
              exercise_id,
              routine_id,
              order_index,
              sets,
              reps,
              rest_seconds
            `)
            .eq('routine_id', routine.id)
            .order('order_index');
            
          if (exercisesError) throw exercisesError;
          
          // Get all exercise IDs to fetch their details
          const exerciseIds = exercises.map(ex => ex.exercise_id);
          
          // Fetch exercise details in a separate query
          const { data: exerciseDetails, error: detailsError } = await supabase
            .from('exercises')
            .select('id, name, image_url')
            .in('id', exerciseIds);
            
          if (detailsError) throw detailsError;
          
          // Map exercises with their details
          const formattedExercises = exercises.map(ex => {
            const details = exerciseDetails.find(detail => detail.id === ex.exercise_id);
            // Create a composite key since there's no id in routine_exercises
            const compositeId = `${routine.id}_${ex.exercise_id}_${ex.order_index}`;
            return {
              id: compositeId, // Using a composite key as unique identifier
              name: details?.name || 'Ejercicio sin nombre',
              sets: ex.sets,
              reps: ex.reps,
              rest_seconds: ex.rest_seconds,
              image_url: details?.image_url || null
            };
          });
          
          // Find all weekdays that use this routine and update the mapping
          weekMapping.forEach((day, index) => {
            const template = weekTemplates.find(t => t.weekday === day.weekday && t.routine_id === routine.id);
            if (template) {
              weekMapping[index].routine = {
                id: routine.id,
                title: routine.title,
                exercises: formattedExercises
              };
              weekMapping[index].is_rest = false;
            }
          });
        }
      }
      
      setWeekdayRoutines(weekMapping);
    } catch (err: any) {
      console.error("Error fetching program details:", err);
      setError(err.message || 'Error al cargar los detalles del programa');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTraining = (routineId: string) => {
    // Al iniciar entrenamiento desde un programa, siempre editamos la rutina
    router.push(`/training/routine/${routineId}`);
  };

  const renderExercise = (exercise: RoutineDetail['exercises'][0]) => {
    return (
      <View key={exercise.id} style={styles.exerciseItem}>
        {exercise.image_url ? (
          <Image 
            source={{ uri: exercise.image_url }} 
            style={styles.exerciseImage} 
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="barbell-outline" size={24} color="#bbb" />
          </View>
        )}
        <View style={styles.exerciseDetails}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.sets && exercise.reps && (
            <View style={styles.exerciseNumbers}>
              <Text style={styles.exerciseSets}>{exercise.sets}x</Text>
              {exercise.reps.split(',').map((rep, index) => (
                <View key={index} style={styles.repBadge}>
                  <Text style={styles.repText}>{rep}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando programa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Programa no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333333', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          onPress={() => router.back()}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 18, flex: 1, textAlign: 'center', marginRight: 32 }}>
          {program.title?.toUpperCase() || 'NOMBRE DEL PROGRAMA'}
        </Text>
      </View>

      {/* Panel blanco */}
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          {weekdayRoutines.map((dayData) => (
            !dayData.is_rest && dayData.routine ? (
              <View key={`day-${dayData.weekday}`} style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <Text style={styles.routineTitle}>{dayData.routine.title}</Text>
                  <Text style={styles.weekday}>{getWeekdayName(dayData.weekday)}</Text>
                </View>
                
                <View style={styles.exercisesList}>
                  {dayData.routine.exercises.map((exercise) => renderExercise(exercise))}
                </View>
              </View>
            ) : dayData.is_rest ? (
              <View key={`day-${dayData.weekday}`} style={styles.restDayCard}>
                <Text style={styles.restDayTitle}>Día de descanso</Text>
                <Text style={styles.weekday}>{getWeekdayName(dayData.weekday)}</Text>
              </View>
            ) : null
          ))}
        </ScrollView>

        <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
          <TouchableOpacity 
            style={{ backgroundColor: '#16A34A', borderRadius: 8, paddingVertical: 16, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              const firstRoutine = weekdayRoutines.find(day => !day.is_rest && day.routine)?.routine;
              if (firstRoutine) {
                handleStartTraining(firstRoutine.id);
              }
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>COMENZAR ENTRENAMIENTO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.black,
    marginVertical: 10,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.black,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: COLORS.black,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  programName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  programDescription: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: 4,
  },
  menuBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  routineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  weekday: {
    fontSize: 14,
    color: '#666',
  },
  restDayCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restDayTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  exercisesList: {
    marginTop: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseDetails: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 4,
  },
  exerciseNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseSets: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  repBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 4,
  },
  repText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
