import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/tokens';
import { Routine } from '../../hooks/useRoutines';

interface SelectRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (routine: Routine) => void;
  routines: Routine[];
  loading?: boolean;
  dayLabel: string;
}

export default function SelectRoutineModal({
  visible,
  onClose,
  onSelect,
  routines,
  loading = false,
  dayLabel
}: SelectRoutineModalProps) {
  // Handler function to safely select a routine
  const handleSelectRoutine = (routine: Routine) => {
    // Call the onSelect callback immediately to ensure the parent component receives the selection
    if (routine && routine.id) {
      onSelect(routine);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar rutina para {dayLabel}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.loadingText}>Cargando rutinas...</Text>
            </View>
          ) : (
            <>
              {routines.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="barbell-outline" size={48} color="#aaa" />
                  <Text style={styles.emptyText}>No tienes rutinas guardadas</Text>
                  <Text style={styles.emptySubtext}>Crea una rutina en la sección de "Guardados"</Text>
                </View>
              ) : (
                <FlatList
                  data={routines}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.routineItem} 
                      onPress={() => handleSelectRoutine(item)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={styles.routineTitle}>{item.title}</Text>
                        <Text style={styles.routineDescription}>
                          {item.description || 'Sin descripción'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#777" />
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  routineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  }
});
