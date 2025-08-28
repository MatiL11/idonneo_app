import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADII } from '../../../../../src/styles/tokens';

import { useRoutineBuilder } from '../../../../../src/hooks/useRoutineBuilder';

const { width: screenWidth } = Dimensions.get('window');

// Función helper para convertir segundos a formato MM:SS
const secondsToTimeFormat = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface SessionConfig {
  warmup: boolean;
  voice: boolean;
  handsFree: boolean;
}

export default function SessionConfigScreen() {
  const router = useRouter();
  const { id: routineId } = useLocalSearchParams();
  const { routine, blocks, loading } = useRoutineBuilder(routineId as string);
  
  const [config, setConfig] = useState<SessionConfig>({
    warmup: true,
    voice: true,
    handsFree: false,
  });



  const handleToggle = (key: keyof SessionConfig) => {
    if (key === 'warmup' || key === 'voice' || key === 'handsFree') {
      setConfig(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleStartSession = () => {
    // Aquí puedes navegar a la pantalla de entrenamiento con la configuración
    console.log('Configuración de sesión:', config);
    console.log('Bloques de la rutina:', blocks.length);
    
    if (blocks && blocks.length > 0) {
      blocks.forEach((block, index) => {
        console.log(`Bloque ${index + 1}: ${secondsToTimeFormat(block.rest_seconds)} segundos de descanso`);
      });
    }
    
    // Navegar según si el calentamiento está activo o no
    if (config.warmup) {
      console.log('Iniciando con calentamiento...');
      router.push({
        pathname: `/training/routine/${routineId}/warmup`,
        params: { warmupEnabled: 'true' }
      });
    } else {
      console.log('Iniciando entrenamiento directo...');
      router.push({
        pathname: `/training/routine/${routineId}/session`,
        params: { warmupEnabled: 'false', warmupCompleted: 'false' }
      });
    }
  };



  // Actualizar configuración cuando se carguen los datos de la rutina
  useEffect(() => {
    if (routine && blocks && !loading) {
      // Los tiempos de descanso se cargan automáticamente desde los bloques
      console.log('Rutina cargada:', routine.title);
      console.log('Bloques cargados:', blocks.length);
    }
  }, [routine, blocks, loading]);

  const handleBack = () => {
    router.back();
  };

  const renderConfigOption = (
    icon: string,
    label: string,
    isActive: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.configOption, isActive && styles.configOptionActive]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={icon as any} 
          size={32} 
          color={isActive ? COLORS.green : '#666'} 
        />
      </View>
      <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );



  const renderBlockRestTimes = () => {
    if (!blocks || blocks.length === 0) {
      return (
        <View style={styles.timeSetting}>
          <Text style={styles.timeLabel}>Tiempo de descanso entre bloques</Text>
          <Text style={styles.noBlocksText}>No hay bloques configurados</Text>
        </View>
      );
    }

    return blocks.map((block, index) => (
      <View key={block.id} style={styles.timeSetting}>
        <Text style={styles.timeLabel}>
          Tiempo de descanso - Bloque {index + 1}
        </Text>
        <View style={styles.timeValue}>
          <Text style={styles.timeText}>
            {secondsToTimeFormat(block.rest_seconds)}
          </Text>
          <Text style={styles.blockInfo}>
            ({block.exercises.length} {block.exercises.length === 1 ? 'ejercicio' : 'ejercicios'})
          </Text>
        </View>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando configuración...</Text>
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
        <Text style={styles.title}>CONFIGURAR ENTRENAMIENTO</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Configuration Options */}
      <View style={styles.configSection}>
        <View style={styles.optionsGrid}>
          {renderConfigOption('flame', 'Calentamiento', config.warmup, () => handleToggle('warmup'))}
          {renderConfigOption('volume-high', 'Sin sonido', config.voice, () => handleToggle('voice'))}
          {renderConfigOption('time', 'Manos libres', config.handsFree, () => handleToggle('handsFree'))}
        </View>
      </View>

      {/* White Panel with Start Button */}
      <View style={styles.whitePanel}>
                 {/* Time Settings */}
         <View style={styles.timeSettingsContainer}>
           {/* Tiempos de descanso de todos los bloques */}
           {renderBlockRestTimes()}
         </View>
        
        <TouchableOpacity style={styles.startButton} onPress={handleStartSession}>
          <Text style={styles.startText}>COMENZAR ENTRENAMIENTO</Text>
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
  configSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  configOption: {
    width: (screenWidth - 80) / 3,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  configOptionActive: {
    backgroundColor: '#2a2a2a',
    borderColor: COLORS.green,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  optionLabelActive: {
    color: COLORS.green,
  },
  whitePanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
    flex: 1,
    justifyContent: 'space-between',
  },
  timeSettingsContainer: {
    marginBottom: 30,
  },
  timeSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  startButton: {
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
  startText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
  noBlocksText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  blockInfo: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});
