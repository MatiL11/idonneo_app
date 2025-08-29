import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../../../../src/styles/tokens';

const { width: screenWidth } = Dimensions.get('window');

interface WarmupStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  icon: string;
}

const WARMUP_STEPS: WarmupStep[] = [
  {
    id: 1,
    title: 'Movilidad Articular',
    description: 'Realiza movimientos circulares suaves en tobillos, rodillas, caderas, hombros y cuello',
    duration: '3-5 min',
    icon: 'body',
  },
  {
    id: 2,
    title: 'Estiramiento Dinámico',
    description: 'Estiramientos controlados que preparen los músculos para el movimiento',
    duration: '5-7 min',
    icon: 'fitness',
  },
  {
    id: 3,
    title: 'Activación Muscular',
    description: 'Ejercicios ligeros para activar los grupos musculares principales',
    duration: '3-5 min',
    icon: 'flash',
  },
  {
    id: 4,
    title: 'Preparación Cardiovascular',
    description: 'Actividad aeróbica suave para elevar la frecuencia cardíaca',
    duration: '5-8 min',
    icon: 'heart',
  },
];

export default function WarmupScreen() {
  const router = useRouter();
  const { id: routineId } = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = () => {
    if (currentStep < WARMUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Terminó el calentamiento, ir al entrenamiento
      console.log('Completando calentamiento, navegando a entrenamiento...');
      const params = { warmupEnabled: 'true', warmupCompleted: 'true' };
      console.log('Parámetros a enviar:', params);
      
      router.push({
        pathname: `/training/routine/${routineId}/session`,
        params: params
      });
    }
  };

  const handleSkipWarmup = () => {
    // Saltar calentamiento e ir directo al entrenamiento
    console.log('Saltando calentamiento, navegando a entrenamiento...');
    const params = { warmupEnabled: 'true', warmupCompleted: 'false' };
    console.log('Parámetros a enviar:', params);
    
    router.push({
      pathname: `/training/routine/${routineId}/session`,
      params: params
    });
  };

  const handleBack = () => {
    router.back();
  };

  const currentWarmupStep = WARMUP_STEPS[currentStep];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>CALENTAMIENTO</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentStep + 1) / WARMUP_STEPS.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Paso {currentStep + 1} de {WARMUP_STEPS.length}
        </Text>
      </View>

      {/* Current Step */}
      <View style={styles.stepContainer}>
        <View style={styles.stepIcon}>
          <Ionicons name={currentWarmupStep.icon as any} size={48} color={COLORS.green} />
        </View>
        
        <Text style={styles.stepTitle}>{currentWarmupStep.title}</Text>
        <Text style={styles.stepDescription}>{currentWarmupStep.description}</Text>
        
        <View style={styles.durationContainer}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.durationText}>{currentWarmupStep.duration}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipWarmup}>
          <Text style={styles.skipText}>SALTAR CALENTAMIENTO</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
          <Text style={styles.nextText}>
            {currentStep < WARMUP_STEPS.length - 1 ? 'SIGUIENTE PASO' : 'COMENZAR ENTRENAMIENTO'}
          </Text>
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
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  stepIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 15,
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
});
