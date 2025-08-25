import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII } from '../../styles/tokens';
import { useExercises, Exercise } from '../../hooks/useExercises';
import { useAuthStore } from '../../lib/store';

interface SelectExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  excludeExerciseIds?: string[];
}

export default function SelectExerciseModal({
  visible,
  onClose,
  onSelectExercise,
  excludeExerciseIds = [],
}: SelectExerciseModalProps) {
  const [searchText, setSearchText] = useState('');
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  
  const ex = useExercises(userId as string);
  const exercises = ex?.list || [];
  const isLoading = ex?.loading;

  // Filtrar ejercicios por búsqueda y excluir los ya seleccionados
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchText.toLowerCase());
    const notExcluded = !excludeExerciseIds.includes(exercise.id);
    return matchesSearch && notExcluded;
  });

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    onClose();
    setSearchText('');
  };

  const handleClose = () => {
    onClose();
    setSearchText('');
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleSelectExercise(item)}
      activeOpacity={0.7}
    >
      <View style={styles.exerciseImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.exerciseImage} />
        ) : (
          <View style={styles.exerciseImagePlaceholder}>
            <Ionicons name="fitness" size={24} color={COLORS.gray500} />
          </View>
        )}
      </View>
      
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.exerciseMeta} numberOfLines={1}>
          Personal • Guardado
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray500} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Ejercicio</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicios..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={COLORS.gray500}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Exercise List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>Cargando ejercicios...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExerciseItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="fitness-outline" size={48} color={COLORS.gray300} />
                <Text style={styles.emptyTitle}>
                  {searchText ? 'No se encontraron ejercicios' : 'No hay ejercicios guardados'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchText 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Agrega ejercicios a tu biblioteca para poder usarlos en rutinas'
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: RADII.search,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  exerciseImageContainer: {
    marginRight: 12,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  exerciseImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray600,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
