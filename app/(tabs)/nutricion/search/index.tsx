import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../../src/styles/tokens';
import { useRecipes } from '../../../../src/hooks/useRecipes';

interface PublicRecipe {
  id: string;
  title: string;
  image_url?: string;
  cooking_time?: string;
  portions?: number;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  user_id: string;
  created_at: string;
}

export default function SearchRecipesScreen() {
  const router = useRouter();
  const { searchPublicRecipes, loadPublicRecipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicRecipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      setHasSearched(true);
      
      const results = await searchPublicRecipes(searchQuery.trim());
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error al buscar recetas:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    loadInitialRecipes();
  };

  const loadInitialRecipes = async () => {
    try {
      setInitialLoading(true);
      const recipes = await loadPublicRecipes(5);
      setSearchResults(recipes);
    } catch (error) {
      console.error('Error al cargar recetas iniciales:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialRecipes();
  }, []);

  const handleFiltersPress = () => {
    router.push('/nutricion/search/filters');
  };

  const renderRecipe = ({ item }: { item: PublicRecipe }) => (
    <TouchableOpacity style={styles.recipeCard} activeOpacity={0.8}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
      ) : (
        <View style={[styles.recipeImage, styles.recipeImagePlaceholder]}>
          <Ionicons name="restaurant" size={32} color={COLORS.gray500} />
        </View>
      )}
      
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.cookingTime}>
          {item.cooking_time || '15m'}
        </Text>

        <Text style={styles.nutritionalInfo}>
          Proteina: {Math.round(item.protein_per_100g || 0)}gr Carbs: {Math.round(item.carbs_per_100g || 0)}gr Grasas: {Math.round(item.fat_per_100g || 0)}gr
        </Text>
      </View>
      
      <TouchableOpacity style={styles.optionsButton}>
        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.gray500} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (searchLoading || initialLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.emptyStateTitle}>
            {initialLoading ? 'Cargando recetas...' : 'Buscando recetas...'}
          </Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={COLORS.gray500} />
          <Text style={styles.emptyStateTitle}>No se encontraron recetas</Text>
          <Text style={styles.emptyStateSubtitle}>
            Intenta con otros términos de búsqueda
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant" size={48} color={COLORS.gray500} />
          <Text style={styles.emptyStateTitle}>No hay recetas públicas</Text>
          <Text style={styles.emptyStateSubtitle}>
            Aún no hay recetas compartidas por otros usuarios
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray500} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Explorar recetas"
            placeholderTextColor={COLORS.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.filterButton} onPress={handleFiltersPress}>
          <Ionicons name="options" size={20} color={COLORS.gray500} />
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}

      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  
  searchIcon: {
    marginRight: 8,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  
  clearButton: {
    marginLeft: 8,
  },
  
  filterButton: {
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  
  recipeImagePlaceholder: {
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  recipeInfo: {
    flex: 1,
  },
  
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  
  cookingTime: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  
  nutritionalInfo: {
    fontSize: 12,
    color: COLORS.gray500,
    lineHeight: 16,
  },
  
  optionsButton: {
    padding: 8,
  },
  

  
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
