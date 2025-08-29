import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../src/lib/supabase';
import { useAuthStore } from '../../../../src/lib/store';

type ExerciseDetail = {
  id: string;
  name: string;
  video_url?: string | null;
  image_url?: string | null;
  steps?: string[];
  muscles?: string[];
  material?: string[];
  description?: string | null;
  user_id: string;
  created_at?: string;
  is_public?: boolean;
};

type TabType = 'steps' | 'muscles' | 'material';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id;
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('steps');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      loadExerciseDetail();
    }
  }, [id]);

  useEffect(() => {
    if (exercise && userId) {
      // Verificar si el ejercicio ya está guardado por el usuario actual
      setIsSaved(exercise.user_id === userId);
    }
  }, [exercise, userId]);

  const loadExerciseDetail = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del ejercicio desde la base de datos
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Mapear directamente los datos de la base de datos
      const exerciseDetail: ExerciseDetail = {
        ...data,
        // Los campos steps, muscles y material ya vienen como arrays desde la DB
        // Si no existen, usar arrays vacíos como fallback
        steps: data.steps || [],
        muscles: data.muscles || [],
        material: data.material || [],
      };

      setExercise(exerciseDetail);
    } catch (error) {
      console.error('Error al cargar el ejercicio:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveExercise = async () => {
    if (!exercise || !userId) return;
    
    try {
      // Crear una copia del ejercicio con tu user_id
      const exerciseToSave = {
        name: exercise.name,
        video_url: exercise.video_url,
        image_url: exercise.image_url,
        description: exercise.description,
        user_id: userId,
        is_public: false, // Ejercicio guardado como privado
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('exercises')
        .insert([exerciseToSave])
        .select()
        .single();

      if (error) throw error;

      // Mostrar mensaje de éxito
      alert('Ejercicio guardado exitosamente');
      
      // Actualizar el estado local para mostrar que ya está guardado
      setIsSaved(true);
      
    } catch (error) {
      console.error('Error al guardar el ejercicio:', error);
      alert('Error al guardar el ejercicio');
    }
  };

  const renderTabContent = () => {
    if (!exercise) return null;

    switch (activeTab) {
      case 'steps':
        return (
          <View style={styles.tabContent}>
            {exercise.steps && exercise.steps.length > 0 ? (
              exercise.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No hay pasos disponibles para este ejercicio</Text>
              </View>
            )}
          </View>
        );
      
      case 'muscles':
        return (
          <View style={styles.tabContent}>
            {exercise.muscles && exercise.muscles.length > 0 ? (
              exercise.muscles.map((muscle, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listText}>{muscle}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No hay músculos especificados para este ejercicio</Text>
              </View>
            )}
          </View>
        );
      
      case 'material':
        return (
          <View style={styles.tabContent}>
            {exercise.material && exercise.material.length > 0 ? (
              exercise.material.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No hay material especificado para este ejercicio</Text>
              </View>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando ejercicio...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar el ejercicio</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

             {/* Video Player Area */}
       <View style={styles.videoContainer}>
         {exercise.video_url ? (
           <View style={styles.videoPlaceholder}>
             {/* Aquí iría el componente de video real */}
             <Text style={styles.videoText}>Video del ejercicio</Text>
           </View>
         ) : exercise.image_url ? (
           <Image 
             source={{ uri: exercise.image_url }} 
             style={styles.exerciseImage}
             resizeMode="cover"
           />
         ) : (
           <View style={styles.videoPlaceholder}>
             <View style={styles.playButton}>
               <Ionicons name="play" size={32} color="#fff" />
             </View>
           </View>
         )}
       </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                     {/* Title and Bookmark */}
           <View style={styles.titleRow}>
             <Text style={styles.exerciseTitle}>{exercise.name}</Text>
             {exercise.user_id !== userId && !isSaved ? (
               <TouchableOpacity style={styles.bookmarkButton} onPress={saveExercise}>
                 <Ionicons name="bookmark-outline" size={24} color="#666" />
               </TouchableOpacity>
             ) : (
               <View style={styles.bookmarkButton}>
                 <Ionicons name="bookmark" size={24} color="#16A34A" />
               </View>
             )}
           </View>

           {/* Description */}
           {exercise.description && (
             <Text style={styles.exerciseDescription}>{exercise.description}</Text>
           )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'steps' && styles.activeTab]} 
              onPress={() => setActiveTab('steps')}
            >
              <Text style={[styles.tabText, activeTab === 'steps' && styles.activeTabText]}>
                Pasos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'muscles' && styles.activeTab]} 
              onPress={() => setActiveTab('muscles')}
            >
              <Text style={[styles.tabText, activeTab === 'muscles' && styles.activeTabText]}>
                Músculos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'material' && styles.activeTab]} 
              onPress={() => setActiveTab('material')}
            >
              <Text style={[styles.tabText, activeTab === 'material' && styles.activeTabText]}>
                Material
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </ScrollView>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Video Area
  videoContainer: {
    height: width * 0.6, // 60% del ancho de la pantalla
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    fontSize: 16,
  },
  imageText: {
    color: '#fff',
    fontSize: 16,
  },

  // Content Area
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 16,
  },
  exerciseDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  bookmarkButton: {
    padding: 8,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#16A34A',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },

  // Tab Content
  tabContent: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    flexShrink: 0,
  },
  listText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },

  // Loading and Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyStateText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
