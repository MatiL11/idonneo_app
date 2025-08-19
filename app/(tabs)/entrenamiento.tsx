import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutType {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const WORKOUT_TYPES: WorkoutType[] = [
  { id: '1', name: 'Fuerza', icon: 'barbell' },
  { id: '2', name: 'Cardio', icon: 'fitness' },
  { id: '3', name: 'Flexibilidad', icon: 'body' },
  { id: '4', name: 'HIIT', icon: 'timer' },
];

interface WorkoutPlan {
  id: string;
  title: string;
  duration: string;
  level: string;
  description: string;
}

const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: '1',
    title: 'Full Body Workout',
    duration: '45 min',
    level: 'Intermedio',
    description: 'Entrenamiento completo para todo el cuerpo enfocado en los principales grupos musculares.',
  },
  {
    id: '2',
    title: 'Core & Abs',
    duration: '30 min',
    level: 'Principiante',
    description: 'Rutina especializada para fortalecer el core y los abdominales.',
  },
  {
    id: '3',
    title: 'Upper Body Power',
    duration: '40 min',
    level: 'Avanzado',
    description: 'Entrenamiento intenso para desarrollar fuerza en la parte superior del cuerpo.',
  },
];

export default function EntrenamientoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de Entrenamiento</Text>
          <View style={styles.workoutTypesContainer}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity key={type.id} style={styles.workoutTypeCard}>
                <Ionicons name={type.icon} size={32} color="#2C6ECB" />
                <Text style={styles.workoutTypeName}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Rutinas</Text>
          {WORKOUT_PLANS.map((plan) => (
            <TouchableOpacity key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <View style={styles.planDetails}>
                  <Text style={styles.planDetailText}>{plan.duration}</Text>
                  <Text style={styles.planDetailText}>•</Text>
                  <Text style={styles.planDetailText}>{plan.level}</Text>
                </View>
              </View>
              <Text style={styles.planDescription}>{plan.description}</Text>
              <TouchableOpacity style={styles.startButton}>
                <Text style={styles.startButtonText}>Empezar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  workoutTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  workoutTypeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutTypeName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  planDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planDetailText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#2C6ECB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
