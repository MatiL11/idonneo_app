import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/styles/tokens';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/lib/store';
import { supabase } from '../../src/lib/supabase';
import { Exercise } from '../../src/hooks/useExercises';
import { Routine } from '../../src/hooks/useRoutines';

// Definir el tipo Program
type Program = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
};

// Tipo para los elementos combinados en la búsqueda
type SearchItem = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  type: 'exercise' | 'routine' | 'program';
  created_at?: string;
};

export default function SearchPane() {
  const [q, setQ] = useState('');
  const { user } = useAuthStore();
  const userId = user?.id;
  
  // Estados para los diferentes tipos de datos
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para las categorías activas
  const [activeTypes, setActiveTypes] = useState<('exercise' | 'routine' | 'program')[]>([
    'exercise', 'routine', 'program'
  ]);
  
  // Función para activar/desactivar tipos
  const toggleType = (type: 'exercise' | 'routine' | 'program') => {
    setActiveTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  // Carga todos los datos
  const loadData = async () => {
    setLoading(true);
    
    try {
      console.log("Cargando datos para userId:", userId);
      
      // ENFOQUE SIMPLIFICADO: Traer TODOS los ejercicios y filtrar después
      const { data: allExercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*');
      
      if (exercisesError) {
        console.error("Error al cargar ejercicios:", exercisesError);
        throw exercisesError;
      }
      
      // Filtramos para mostrar: 
      // 1. Todos los del usuario actual
      // 2. Todos los que sean públicos (is_public = true)
      const filteredExercises = allExercisesData?.filter(ex => 
        ex.user_id === userId || ex.is_public === true
      ) || [];
      
      console.log("Total ejercicios en BD:", allExercisesData?.length || 0);
      console.log("Ejercicios mostrados (usuario + públicos):", filteredExercises.length);
      
      // Log para depuración - ver ejercicios públicos encontrados
      const publicOnes = filteredExercises.filter(ex => ex.is_public === true);
      console.log("Ejercicios públicos encontrados:", publicOnes.length);
      publicOnes.forEach(ex => {
        console.log(`- ID: ${ex.id}, Nombre: ${ex.name}, Usuario: ${ex.user_id}`);
      });
      
      // Ordenamos por fecha de creación
      filteredExercises.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setExercises(filteredExercises);
      
      // Cargar rutinas
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId);
      
      if (routinesError) throw routinesError;
      setRoutines(routinesData || []);
      
      // Cargar programas
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId);
      
      if (programsError) throw programsError;
      setPrograms(programsData || []);
      
    } catch (error) {
      console.error('Error al cargar datos de búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transformar los datos en un formato unificado para la lista
  const searchItems: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];
    
         // Agregar ejercicios
     if (activeTypes.includes('exercise')) {
       items.push(...exercises.map(ex => ({
         id: ex.id,
         name: ex.name,
         image_url: ex.image_url,
         type: 'exercise' as const,
         created_at: ex.created_at,
       })));
     }
    
    // Agregar rutinas
    if (activeTypes.includes('routine')) {
      items.push(...routines.map(routine => ({
        id: routine.id,
        name: routine.title,
        description: routine.description,
        type: 'routine' as const,
        created_at: routine.created_at
      })));
    }
    
    // Agregar programas
    if (activeTypes.includes('program')) {
      items.push(...programs.map(program => ({
        id: program.id,
        name: program.title,
        description: program.description,
        type: 'program' as const,
        created_at: program.created_at
      })));
    }
    
    return items;
  }, [exercises, routines, programs, activeTypes]);
  
  // Filtrar por búsqueda
  const filtered = useMemo(() => {
    if (!q) return searchItems;
    
    const lowerQuery = q.toLowerCase();
    return searchItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) || 
      (item.description && item.description.toLowerCase().includes(lowerQuery))
    );
  }, [searchItems, q]);

  // Navegar al detalle del elemento
  const navigateToItem = (item: SearchItem) => {
    if (item.type === 'exercise') {
      // Navegar a la nueva vista de detalle de ejercicio
      router.push(`/training/exercise/${item.id}`);
    } else if (item.type === 'routine') {
      // Ya no navegamos directamente a la edición de rutina
      // Aquí podríamos mostrar una vista previa o un menú de opciones
      Alert.alert(
        `Rutina: ${item.name}`,
        '¿Qué deseas hacer con esta rutina?',
        [
          {
            text: 'Ver detalles',
            style: 'default',
            // Aquí podrías navegar a una vista de detalles
            onPress: () => {}
          },
          {
            text: 'Editar',
            style: 'default',
            onPress: () => router.push(`/training/routine/${item.id}`)
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } else if (item.type === 'program') {
      router.push(`/training/program/${item.id}`);
    }
  };
  


  return (
    <View style={{ flex: 1 }}>
      {/* Search pill + filtros */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.gray600} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          placeholderTextColor={COLORS.gray600}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.9} onPress={() => {}}>
          <Ionicons name="options-outline" size={18} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* Filtros por tipo */}
      <View style={styles.typesFilter}>
        <TouchableOpacity 
          style={[styles.filterChip, activeTypes.includes('exercise') ? styles.activeChip : null]} 
          onPress={() => toggleType('exercise')}
        >
          <Text style={[styles.filterText, activeTypes.includes('exercise') ? styles.activeFilterText : null]}>
            Ejercicios
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, activeTypes.includes('routine') ? styles.activeChip : null]} 
          onPress={() => toggleType('routine')}
        >
          <Text style={[styles.filterText, activeTypes.includes('routine') ? styles.activeFilterText : null]}>
            Rutinas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, activeTypes.includes('program') ? styles.activeChip : null]} 
          onPress={() => toggleType('program')}
        >
          <Text style={[styles.filterText, activeTypes.includes('program') ? styles.activeFilterText : null]}>
            Programas
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={COLORS.gray500} />
              <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
              <Text style={styles.emptyDescription}>
                Intenta con otra búsqueda o revisa los filtros aplicados
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={0.92} 
              style={styles.card} 
              onPress={() => navigateToItem(item)}
            >
              {/* Tipo de elemento (tag) */}
              <View style={[styles.typeTag, 
                item.type === 'exercise' ? styles.exerciseTag : 
                item.type === 'routine' ? styles.routineTag : styles.programTag
              ]}>
                <Text style={styles.typeTagText}>
                  {item.type === 'exercise' ? 'Ejercicio' : 
                   item.type === 'routine' ? 'Rutina' : 'Programa'}
                </Text>
              </View>

              {/* Thumb */}
              <View style={styles.thumbWrap}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Ionicons 
                      name={
                        item.type === 'exercise' ? 'barbell-outline' : 
                        item.type === 'routine' ? 'list-outline' : 'calendar-outline'
                      } 
                      size={24} 
                      color="#666"
                    />
                  </View>
                )}
              </View>

              {/* Texto */}
              <View style={styles.textCol}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <Text numberOfLines={2} style={styles.title}>
                      {item.name}
                    </Text>
                    
                    
                  </View>
                  

                </View>

                {item.description ? (
                  <Text numberOfLines={1} style={styles.description}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const R = { card: 16, thumb: 12, pill: 24 };

const styles = StyleSheet.create({
  /** Buscador */
  searchRow: {
    height: 46,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: COLORS.black, fontSize: 16 },
  filterBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.gray200,
    alignItems: 'center', justifyContent: 'center', marginLeft: 6,
  },

  /** Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.cardDark,
    borderRadius: R.card,
    ...Platform.select({
      ios: { shadowColor: COLORS.black, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
    position: 'relative',
  },

  /** Thumb */
  thumbWrap: {
    width: 92,
    height: 64,
    borderRadius: R.thumb,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
  },

  /** Texto */
  textCol: { flex: 1 },
  title: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  description: { color: '#cfcfcf', fontSize: 12 },
  
  /** Type Tag */
  typeTag: {
    position: 'absolute',
    top: 8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 2,
  },
  exerciseTag: { backgroundColor: COLORS.green },
  routineTag: { backgroundColor: '#3B82F6' }, // Azul
  programTag: { backgroundColor: '#F59E0B' }, // Naranja
  typeTagText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  
  /** Filtros */
  typesFilter: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.gray200,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: COLORS.green,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  
  /** Estados */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray600,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  

  

});
