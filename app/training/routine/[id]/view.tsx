import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ReadOnlyRoundsPill from '../../../../src/components/training/routineBuilder/ReadOnlyRoundsPill';
import ReadOnlyBlockCard from '../../../../src/components/training/routineBuilder/ReadOnlyBlockCard';

import { useRoutineBuilder } from '../../../../src/hooks/useRoutineBuilder';
import { supabase } from '../../../../src/lib/supabase';
import { useState, useEffect } from 'react';

export default function RoutineViewScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [description, setDescription] = useState('');

  const {
    routine,
    loading,
    rounds,
    blocks,
  } = useRoutineBuilder(id as string);
  
  // Fetch the full routine data to get the description
  useEffect(() => {
    if (routine?.id) {
      const fetchRoutineDetails = async () => {
        const { data } = await supabase
          .from('routines')
          .select('description')
          .eq('id', routine.id)
          .single();
        if (data) {
          setDescription(data.description || '');
        }
      };
      fetchRoutineDetails();
    }
  }, [routine?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando rutina…</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No se pudo cargar la rutina</Text>
      </View>
    );
  }

  const handleEditPress = () => {
    router.push(`/training/routine/${id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../../assets/idonneo-logo-blanco.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Título y descripción */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{routine.title}</Text>
        <Text style={styles.description}>{description || 'Sin descripción'}</Text>
      </View>

      {/* Panel blanco para ejercicios */}
      <View style={styles.whitePanel}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {blocks.map((block) => (
            <ReadOnlyBlockCard 
              key={block.id} 
              block={block}
            />
          ))}
        </ScrollView>
      </View>

      {/* Botón de comenzar entrenamiento */}
      <TouchableOpacity 
        style={styles.startTrainingButton}
        onPress={handleEditPress}
      >
        <Text style={styles.startTrainingButtonText}>COMENZAR ENTRENAMIENTO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 32,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  startTrainingButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startTrainingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  }
});
