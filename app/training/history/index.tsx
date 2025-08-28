import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../src/styles/tokens';
import { useSessionHistory, CompletedSession } from '../../../src/hooks/useSessionHistory';

const { width: screenWidth } = Dimensions.get('window');

export default function TrainingHistoryScreen() {
  const router = useRouter();
  const { sessions, loading, error, refresh, deleteSession } = useSessionHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleSessionPress = (session: CompletedSession) => {
    setSelectedSession(session);
  };

  const handleViewSessionDetails = (session: CompletedSession) => {
    // Aquí podrías navegar a una pantalla de detalles de la sesión
    Alert.alert(
      'Detalles de la Sesión',
      `Rutina: ${session.routine_title}\n` +
      `Fecha: ${formatDate(session.started_at)}\n` +
      `Duración: ${formatDuration(session.total_duration_minutes)}\n` +
      `Calentamiento: ${session.warmup_completed ? 'Sí' : 'No'}`
    );
  };

  const handleDeleteSession = (session: CompletedSession) => {
    Alert.alert(
      'Eliminar Sesión',
      `¿Estás seguro de que quieres eliminar la sesión del ${formatDate(session.started_at)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(session.id);
              Alert.alert('Éxito', 'Sesión eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la sesión');
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#666" />
          <Text style={styles.errorText}>Error al cargar el historial</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
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
        <Text style={styles.title}>HISTORIAL DE ENTRENAMIENTOS</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Summary */}
      {sessions.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {Math.round(sessions.reduce((total, session) => total + session.total_duration_minutes, 0) / sessions.length)}
            </Text>
            <Text style={styles.statLabel}>Promedio (min)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {sessions.filter(s => s.warmup_completed).length}
            </Text>
            <Text style={styles.statLabel}>Con Calentamiento</Text>
          </View>
        </View>
      )}

      {/* Sessions List */}
      <ScrollView 
        style={styles.sessionsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No hay entrenamientos registrados</Text>
            <Text style={styles.emptySubtitle}>
              Completa tu primer entrenamiento para verlo aquí
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => handleSessionPress(session)}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.routineTitle}>{session.routine_title}</Text>
                  <Text style={styles.sessionDate}>
                    {formatDate(session.started_at)} • {formatTime(session.started_at)}
                  </Text>
                </View>
                
                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {formatDuration(session.total_duration_minutes)}
                    </Text>
                  </View>
                  
                  {session.warmup_completed && (
                    <View style={styles.warmupBadge}>
                      <Ionicons name="flame" size={12} color={COLORS.green} />
                      <Text style={styles.warmupText}>Calentamiento</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.sessionActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewSessionDetails(session)}
                >
                  <Ionicons name="eye" size={16} color="#666" />
                  <Text style={styles.actionText}>Ver Detalles</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteSession(session)}
                >
                  <Ionicons name="trash" size={16} color="#ff4444" />
                  <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
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
    color: COLORS.green,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  sessionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  sessionInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
  },
  sessionDate: {
    fontSize: 14,
    color: '#ccc',
  },
  sessionStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#ccc',
  },
  warmupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warmupText: {
    fontSize: 10,
    color: COLORS.green,
    fontWeight: '600',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#444',
  },
  actionText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  deleteText: {
    color: '#ff4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
