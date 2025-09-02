import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../../src/styles/tokens';
import { HeaderBar, WhiteSheet } from '../../../../src/components/shared';
import { useRecipes } from '../../../../src/hooks/useRecipes';

interface FilterState {
  categoria: boolean;
  dietas: boolean;
  tiempoCocina: boolean;
  proteinasPorcion: boolean;
  carbohidratosPorcion: boolean;
  incluirIngredientes: boolean;
  excluirIngredientes: boolean;
}

export default function FiltersScreen() {
  const router = useRouter();
  const { loadPublicRecipes } = useRecipes();
  const [filters, setFilters] = useState<FilterState>({
    categoria: true,
    dietas: false,
    tiempoCocina: false,
    proteinasPorcion: false,
    carbohidratosPorcion: false,
    incluirIngredientes: false,
    excluirIngredientes: false,
  });

  const [recipeCount, setRecipeCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    loadTotalRecipes();
  }, []);

  const loadTotalRecipes = async () => {
    try {
      setLoadingCount(true);
      // Cargar un número alto para obtener el total de recetas públicas
      const recipes = await loadPublicRecipes(1000);
      setRecipeCount(recipes.length);
    } catch (error) {
      console.error('Error al cargar el total de recetas:', error);
      setRecipeCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleFilterPress = (filterKey: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const clearSelections = () => {
    setFilters({
      categoria: false,
      dietas: false,
      tiempoCocina: false,
      proteinasPorcion: false,
      carbohidratosPorcion: false,
      incluirIngredientes: false,
      excluirIngredientes: false,
    });
  };

  const applyFilters = () => {
    // Aquí se aplicarían los filtros y se navegaría de vuelta
    router.back();
  };

  const getFilterIcon = (filterKey: keyof FilterState) => {
    if (filterKey === 'incluirIngredientes') {
      return <Ionicons name="add" size={20} color={COLORS.green} />;
    }
    if (filterKey === 'excluirIngredientes') {
      return <Ionicons name="remove" size={20} color={COLORS.green} />;
    }
    if (filters[filterKey]) {
      return <Ionicons name="checkmark" size={20} color={COLORS.green} />;
    }
    return <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />;
  };

  const filterOptions = [
    { key: 'categoria' as keyof FilterState, label: 'Categoría' },
    { key: 'dietas' as keyof FilterState, label: 'Dietas' },
    { key: 'tiempoCocina' as keyof FilterState, label: 'Tiempo de cocina' },
    { key: 'proteinasPorcion' as keyof FilterState, label: 'Proteinas por porción' },
    { key: 'carbohidratosPorcion' as keyof FilterState, label: 'Carbohidratos por porción' },
    { key: 'incluirIngredientes' as keyof FilterState, label: 'Incluir ingredientes' },
    { key: 'excluirIngredientes' as keyof FilterState, label: 'Excluir ingredientes' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <HeaderBar
        title="Filtros"
        onBack={() => router.back()}
      />

      {/* Content */}
      <WhiteSheet>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Filter List */}
          <View style={styles.filterContainer}>
            {filterOptions.map((option, index) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterItem,
                  index === filterOptions.length - 1 && styles.lastFilterItem
                ]}
                onPress={() => handleFilterPress(option.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterLabel}>{option.label}</Text>
                <View style={styles.filterIcon}>
                  {getFilterIcon(option.key)}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity onPress={clearSelections} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Borrar selecciones</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFilters} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>
                {loadingCount ? 'Cargando...' : `Ver ${recipeCount} recetas`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </WhiteSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
    position: 'relative',
  },
  
  content: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  
  explanationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  explanationText: {
    fontSize: 14,
    color: COLORS.gray500,
    lineHeight: 20,
  },
  
  filterContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: RADII.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  
  lastFilterItem: {
    borderBottomWidth: 0,
  },
  
  filterLabel: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  
  filterIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  
  clearButtonText: {
    fontSize: 16,
    color: COLORS.gray500,
  },
  
  applyButton: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
