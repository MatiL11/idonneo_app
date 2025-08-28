import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/styles/tokens';

const { width: screenWidth } = Dimensions.get('window');

export default function TrainingScreen() {
  const router = useRouter();

  const trainingOptions = [
    {
      id: 'routines',
      title: 'Mis Rutinas',
      description: 'Gestiona y crea tus rutinas de entrenamiento',
      icon: 'fitness',
      route: '/training/saved',
      color: COLORS.green,
    },
    {
      id: 'search',
      title: 'Buscar Ejercicios',
      description: 'Explora ejercicios y crea nuevas rutinas',
      icon: 'search',
      route: '/training/search',
      color: '#4A90E2',
    },
    {
      id: 'calendar',
      title: 'Calendario',
      description: 'Planifica tus entrenamientos semanalmente',
      icon: 'calendar',
      route: '/training/calendar',
      color: '#F39C12',
    },
    {
      id: 'history',
      title: 'Historial',
      description: 'Revisa tus entrenamientos completados',
      icon: 'time',
      route: '/training/history',
      color: '#9B59B6',
    },
  ];

  const handleOptionPress = (route: string) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ENTRENAMIENTO</Text>
        <Text style={styles.subtitle}>Gestiona tu fitness</Text>
      </View>

      {/* Training Options */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsGrid}>
          {trainingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleOptionPress(option.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={32} color={option.color} />
              </View>
              
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
              
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen Rápido</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="fitness" size={24} color={COLORS.green} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Rutinas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#4A90E2" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Sesiones</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color="#F39C12" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsGrid: {
    gap: 20,
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  arrowContainer: {
    marginLeft: 10,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
});
