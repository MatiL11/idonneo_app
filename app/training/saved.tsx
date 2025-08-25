import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { COLORS } from '../../src/styles/tokens';
import { useExercises, Exercise } from '../../src/hooks/useExercises';
import { useRoutines, Routine } from '../../src/hooks/useRoutines';
import { useAuthStore } from '../../src/lib/store';
import AddExerciseModal from '../../src/components/training/AddExerciseModal';
import AddRoutineModal from '../../src/components/training/AddRoutineModal';
import RoutineOptionsMenu from '../../src/components/training/RoutineOptionsMenu';
import ExerciseOptionsMenu from '../../src/components/training/ExerciseOptionsMenu';

const RADIUS = { segment: 18, card: 12 };
type SavedTab = 'exercises' | 'routines' | 'programs';

// Datos de ejemplo que se mostrarán solo cuando no haya rutinas guardadas
// Rutinas de ejemplo que tienen la misma estructura que nuestras Routine
const FEATURED_ROUTINES = [
  { 
    id: 'r1', 
    user_id: 'featured', 
    title: 'Nombre de la rutina', 
    description: 'músculos que trabaja esta rutina',
    created_at: new Date().toISOString() 
  },
  { 
    id: 'r2', 
    user_id: 'featured', 
    title: 'Push/Pull/Legs (3 días)', 
    description: 'Pectoral – Espalda – Piernas',
    created_at: new Date().toISOString() 
  },
] as Routine[];

export default function SavedPane() {
  const [tab, setTab] = useState<SavedTab>('exercises');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showRoutineOptions, setShowRoutineOptions] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  
  // Verificar si el usuario está autenticado
  useEffect(() => {
    console.log('Estado de autenticación:', session ? 'Autenticado' : 'No autenticado');
    console.log('ID de usuario:', userId || 'No disponible');
    
    // Si no hay sesión, se debería redirigir al login
    if (!session) {
      console.warn('No hay sesión activa. El usuario debe iniciar sesión para guardar ejercicios.');
    }
  }, [session, userId]);

  // Hook de ejercicios
  const ex = useExercises(userId as string);
  const exercises = useMemo(
    () => ex?.list || [],
    [ex?.list]
  );
  const isLoadingExercises = ex?.loading;
  const addExercise = ex?.add;
  const removeExercise = ex?.remove;
  const refreshExercises = ex?.load;
  
  // Hook de rutinas
  const rt = useRoutines(userId as string);
  const routines = useMemo(
    () => rt?.list || [],
    [rt?.list]
  );
  const isLoadingRoutines = rt?.loading;
  const addRoutine = rt?.add;
  const removeRoutine = rt?.remove;
  const refreshRoutines = rt?.load;

  const onSubmitNewExercise = async (payload: { name: string; imageUri?: string | null }) => {
    if (!addExercise) {
      console.error("La función addExercise no está disponible");
      return;
    }
    if (!userId) {
      console.error("No hay userId disponible. El usuario debe estar autenticado para añadir ejercicios.");
      return;
    }
    console.log("Intentando añadir ejercicio para usuario:", userId);
    console.log("Payload:", payload);
    try {
      await addExercise(payload);
      setShowAddExercise(false);
      await refreshExercises();
      console.log("Ejercicio añadido correctamente");
    } catch (error) {
      console.error("Error al añadir ejercicio:", error);
    }
  };
  
  const onSubmitNewRoutine = async (payload: { title: string; description?: string }) => {
    if (!addRoutine) {
      console.error("La función addRoutine no está disponible");
      return;
    }
    if (!userId) {
      console.error("No hay userId disponible. El usuario debe estar autenticado para añadir rutinas.");
      return;
    }
    console.log("Intentando añadir rutina para usuario:", userId);
    console.log("Payload:", payload);
    try {
      await addRoutine(payload);
      setShowAddRoutine(false);
      await refreshRoutines();
      console.log("Rutina añadida correctamente");
    } catch (error) {
      console.error("Error al añadir rutina:", error);
    }
  };
  
  const handleDeleteRoutine = async () => {
    if (!selectedRoutine || !removeRoutine) return;
    
    try {
      console.log("Eliminando rutina:", selectedRoutine.id);
      await removeRoutine(selectedRoutine.id);
      await refreshRoutines();
      console.log("Rutina eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar rutina:", error);
      Alert.alert("Error", "No se pudo eliminar la rutina. Por favor, intenta de nuevo.");
    }
  };
  
  const handleOpenRoutineOptions = (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowRoutineOptions(true);
  };
  
  const handleOpenExerciseOptions = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseOptions(true);
  };
  
  const handleDeleteExercise = async () => {
    if (!selectedExercise || !removeExercise) return;
    
    try {
      console.log("Eliminando ejercicio:", selectedExercise.id);
      await removeExercise(selectedExercise.id);
      await refreshExercises();
      console.log("Ejercicio eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar ejercicio:", error);
      Alert.alert("Error", "No se pudo eliminar el ejercicio. Por favor, intenta de nuevo.");
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    console.log('Renderizando ejercicio:', item.name, 'URL de imagen:', item.image_url);
    
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.exerciseCard} onPress={() => {}}>
        <View style={styles.thumbWrap}>
          {item.image_url ? (
            <Image 
              source={{ 
                uri: item.image_url,
              }} 
              style={styles.thumb} 
              resizeMode="cover"
              onError={(e) => {
                console.error('Error cargando imagen:', e.nativeEvent.error);
                console.log('URL problemática:', item.image_url);
                // Si es URL de renderizado, intentar con URL normal
                if (item.image_url && item.image_url.includes('/render/image/')) {
                  const normalUrl = item.image_url.replace('/render/image', '');
                  console.log('Intentando con URL directa:', normalUrl);
                }
              }}
              onLoad={() => console.log('Imagen cargada correctamente:', item.image_url)}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Ionicons name="image" size={18} color="#999" />
            </View>
          )}
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.exerciseMeta} numberOfLines={1}>
            Personal • Guardado
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => handleOpenExerciseOptions(item)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Entypo name="dots-three-horizontal" size={16} color={COLORS.gray500} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs */}
      <View style={styles.segmentRow}>
        <Segment label="Ejercicios" active={tab === 'exercises'} onPress={() => setTab('exercises')} />
        <Segment label="Rutinas"   active={tab === 'routines'}  onPress={() => setTab('routines')}  />
        <Segment label="Programas" active={tab === 'programs'}  onPress={() => setTab('programs')}  />
      </View>

      {tab === 'exercises' ? (
        isLoadingExercises && exercises.length === 0 ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={COLORS.black} />
            <Text style={{ color: COLORS.black, marginTop: 10 }}>Cargando…</Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(i) => i.id}
            renderItem={renderExercise}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingVertical: 8, paddingBottom: 90 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoadingExercises} onRefresh={refreshExercises} colors={[COLORS.black]} tintColor={COLORS.black} />
            }
            ListEmptyComponent={
              <View style={styles.placeholderBox}>
                <Text style={{ color: '#777' }}>Aún no agregaste ejercicios</Text>
              </View>
            }
          />
        )
      ) : tab === 'routines' ? (
        isLoadingRoutines && routines.length === 0 ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={COLORS.black} />
            <Text style={{ color: COLORS.black, marginTop: 10 }}>Cargando…</Text>
          </View>
        ) : (
          <FlatList
            data={routines.length > 0 ? routines : FEATURED_ROUTINES}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingVertical: 8, paddingBottom: 80 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isLoadingRoutines} onRefresh={refreshRoutines} colors={[COLORS.black]} tintColor={COLORS.black} />
            }
            renderItem={({ item }) => {
              const isFeatureItem = item.user_id === 'featured';
              
              return (
                <TouchableOpacity activeOpacity={0.9} style={styles.routineCard} onPress={() => {}}>
                  <View style={styles.routineCardHeader}>
                    <Text numberOfLines={1} style={styles.routineTitle}>{item.title}</Text>
                    <TouchableOpacity 
                      onPress={() => handleOpenRoutineOptions(item)}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                      <Entypo name="dots-three-horizontal" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text numberOfLines={1} style={styles.routineDesc}>
                    {item.description || 'Sin descripción'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.placeholderBox}>
                <Text style={{ color: '#777' }}>Aún no agregaste rutinas</Text>
              </View>
            }
          />
        )
      ) : (
        <View style={styles.placeholderBox}>
          <Text style={{ color: '#777' }}>Programas guardados</Text>
        </View>
      )}

      {/* FAB para añadir (ejercicio o rutina según tab) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => {
          if (tab === 'exercises') {
            setShowAddExercise(true);
          } else if (tab === 'routines') {
            setShowAddRoutine(true);
          }
        }}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal para crear ejercicio */}
      <AddExerciseModal
        visible={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSubmit={onSubmitNewExercise}
        onPickImage={ex?.pickImage || (async () => null)}
        saving={ex?.saving}
      />
      
      {/* Modal para crear rutina */}
      <AddRoutineModal
        visible={showAddRoutine}
        onClose={() => setShowAddRoutine(false)}
        onSubmit={onSubmitNewRoutine}
        saving={rt?.saving}
      />
      
      {/* Menú de opciones de rutina */}
      {selectedRoutine && (
        <RoutineOptionsMenu
          visible={showRoutineOptions}
          onClose={() => setShowRoutineOptions(false)}
          onDelete={handleDeleteRoutine}
          routineName={selectedRoutine.title}
          isFeatureItem={selectedRoutine.user_id === 'featured'}
        />
      )}
      
      {/* Menú de opciones de ejercicio */}
      {selectedExercise && (
        <ExerciseOptionsMenu
          visible={showExerciseOptions}
          onClose={() => setShowExerciseOptions(false)}
          onDelete={handleDeleteExercise}
          exerciseName={selectedExercise.name}
        />
      )}
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segment, active ? styles.segmentActive : styles.segmentInactive]}
    >
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : styles.segmentTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  segment: { flex: 1, height: 36, borderRadius: RADIUS.segment, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: COLORS.green },
  segmentInactive: { backgroundColor: COLORS.gray200, borderWidth: 1, borderColor: COLORS.gray300 },
  segmentText: { fontWeight: '700' },
  segmentTextActive: { color: COLORS.white },
  segmentTextInactive: { color: COLORS.gray600 },

  /* Ejercicios */
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    padding: 10,
    gap: 12,
  },
  thumbWrap: { width: 92, height: 62, borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.gray200 },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  exerciseTitle: { color: COLORS.black, fontWeight: '700' },
  exerciseMeta: { color: COLORS.gray500, fontSize: 12, marginTop: 2 },

  /* Rutinas (mock) */
  routineCard: { backgroundColor: COLORS.black, borderRadius: RADIUS.card, paddingVertical: 12, paddingHorizontal: 12 },
  routineCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routineTitle: { color: COLORS.white, fontWeight: '700' },
  routineDesc: { color: COLORS.gray500, fontSize: 12, marginTop: 4 },

  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    marginTop: 12,
  },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
