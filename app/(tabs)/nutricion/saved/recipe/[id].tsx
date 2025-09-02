import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../../../src/styles/tokens';
import { useRecipes, Recipe, parseIngredients, formatIngredient, Ingredient, parseSteps, RecipeStep } from '../../../../../src/hooks/useRecipes';
import { HeaderBar, WhiteSheet } from '../../../../../src/components/shared';
import { supabase } from '../../../../../src/lib/supabase';

const SCREEN_W = Dimensions.get('window').width;

type TabType = 'ingredients' | 'steps' | 'nutrition';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchRecipes } = useRecipes();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [portions, setPortions] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const recipes = await fetchRecipes();
      const foundRecipe = recipes.find(r => r.id === id);
      setRecipe(foundRecipe || null);
      if (foundRecipe?.portions) {
        setPortions(foundRecipe.portions);
      }
      
      // Obtener el usuario actual para verificar si la receta es propia
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    } catch (error) {
      console.error('Error al cargar receta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.back();

  const handleMenuPress = () => {
    setShowContextMenu(true);
  };

  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
  };

  const handleContextMenuOption = (option: string) => {
    setShowContextMenu(false);
    switch (option) {
      case 'Compartir':
        // TODO: Implementar compartir
        break;
      case 'Agregar a Tus me gusta':
        // TODO: Implementar agregar a favoritos
        break;
      case 'Agregar a Tu biblioteca':
        // TODO: Implementar agregar a biblioteca
        break;
      case 'Agregar a Plan':
        // TODO: Implementar agregar a plan
        break;
    }
  };

  const adjustPortions = (increment: boolean) => {
    if (increment) {
      setPortions(prev => prev + 1);
    } else if (portions > 1) {
      setPortions(prev => prev - 1);
    }
  };

  const getAdjustedIngredientAmount = (ingredient: Ingredient) => {
    const adjustedAmount = (ingredient.amount * portions).toFixed(1);
    return `${adjustedAmount}${ingredient.unit}`;
  };

  const getNutritionText = () => {
    if (!recipe) return 'Sin datos nutricionales';
    
    const parts: string[] = [];
    // @ts-ignore
    if (recipe.protein_per_100g) parts.push(`Prot: ${recipe.protein_per_100g}g`);
    // @ts-ignore
    if (recipe.carbs_per_100g) parts.push(`Carb: ${recipe.carbs_per_100g}g`);
    // @ts-ignore
    if (recipe.fat_per_100g) parts.push(`Grasas: ${recipe.fat_per_100g}g`);
    // @ts-ignore
    if (recipe.calories_per_100g) parts.push(`Cal: ${recipe.calories_per_100g}kcal`);
    
    return parts.length === 0 ? 'Sin datos nutricionales' : parts.join(' • ');
  };

  const renderIngredients = () => (
    <View style={styles.tabContent}>
      <View style={styles.portionsSection}>
        <Text style={styles.portionsLabel}>Porciones</Text>
        <View style={styles.portionsSelector}>
          <TouchableOpacity 
            style={[styles.portionsButton, portions <= 1 && styles.portionsButtonDisabled]} 
            onPress={() => adjustPortions(false)}
            disabled={portions <= 1}
          >
            <Ionicons name="remove" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.portionsInput}>
            <Text style={styles.portionsText}>{portions}</Text>
          </View>
          <TouchableOpacity style={styles.portionsButton} onPress={() => adjustPortions(true)}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ingredientsList}>
        {recipe?.ingredients ? parseIngredients(recipe.ingredients).map((ingredient, index) => (
          <View key={index} style={styles.ingredientItem}>
            <Text style={styles.ingredientName}>{ingredient.name}</Text>
            <Text style={styles.ingredientAmount}>{getAdjustedIngredientAmount(ingredient)}</Text>
          </View>
        )) : null}
      </View>
    </View>
  );

  const renderSteps = () => {
    const steps = recipe?.instructions ? parseSteps(recipe.instructions) : [];
    
    return (
      <View style={styles.tabContent}>
        {/* Botón Cocinar paso a paso */}
        <TouchableOpacity style={styles.cookButton}>
          <Ionicons name="play" size={20} color={COLORS.green} />
          <Text style={styles.cookButtonText}>Cocinar paso a paso</Text>
        </TouchableOpacity>

        {/* Lista de pasos */}
        {steps.length > 0 ? (
          <View style={styles.stepsList}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{step.step}</Text>
                </View>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noStepsText}>No hay pasos disponibles.</Text>
        )}
      </View>
    );
  };

  const renderNutrition = () => (
    <View style={styles.tabContent}>
      <View style={styles.nutritionCard}>
        <Text style={styles.nutritionTitle}>Información Nutricional</Text>
        <Text style={styles.nutritionSubtitle}>Por 100g</Text>
        <Text style={styles.nutritionText}>{getNutritionText()}</Text>
      </View>
      
      {recipe?.cooking_time && (
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>Tiempo de Cocción</Text>
          <Text style={styles.nutritionText}>{recipe.cooking_time}</Text>
        </View>
      )}

      {recipe?.notes && (
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>Notas</Text>
          <Text style={styles.nutritionText}>{recipe.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return renderIngredients();
      case 'steps':
        return renderSteps();
      case 'nutrition':
        return renderNutrition();
      default:
        return renderIngredients();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <HeaderBar title="Cargando..." onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando receta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <HeaderBar title="Receta no encontrada" onBack={handleBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar la receta</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <HeaderBar
        title="Receta"
        onBack={handleBack}
        rightButton={{
          icon: 'ellipsis-horizontal',
          text: '',
          onPress: handleMenuPress,
          variant: 'secondary'
        }}
      />

      <WhiteSheet>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recipe Image */}
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} />
          ) : (
            <View style={[styles.recipeImage, styles.recipeImagePlaceholder]}>
              <Ionicons name="restaurant" size={48} color={COLORS.gray500} />
            </View>
          )}

          {/* Recipe Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
          </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ingredients' && styles.activeTab]}
            onPress={() => setActiveTab('ingredients')}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.activeTabText]}>
              Ingredientes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'steps' && styles.activeTab]}
            onPress={() => setActiveTab('steps')}
          >
            <Text style={[styles.tabText, activeTab === 'steps' && styles.activeTabText]}>
              Pasos
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nutrition' && styles.activeTab]}
            onPress={() => setActiveTab('nutrition')}
          >
            <Text style={[styles.tabText, activeTab === 'nutrition' && styles.activeTabText]}>
              Info. nutricional
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
        </ScrollView>
      </WhiteSheet>

      {/* Menú Contextual */}
      {showContextMenu && (
        <View style={styles.contextMenuOverlay}>
          <TouchableOpacity 
            style={styles.contextMenuBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseContextMenu}
          />
          <View style={styles.contextMenu}>
            <TouchableOpacity 
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuOption('Compartir')}
            >
              <Ionicons name="share-outline" size={24} color={COLORS.black} />
              <Text style={styles.contextMenuText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuOption('Agregar a Tus me gusta')}
            >
              <View style={styles.likeIconContainer}>
                <Ionicons name="heart" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.contextMenuText}>Agregar a Tus me gusta</Text>
            </TouchableOpacity>

            {recipe && currentUserId && recipe.user_id !== currentUserId && (
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => handleContextMenuOption('Agregar a Tu biblioteca')}
              >
                <Ionicons name="bookmark" size={24} color={COLORS.gray700} />
                <Text style={styles.contextMenuText}>Agregar a Tu biblioteca</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.contextMenuItem}
              onPress={() => handleContextMenuOption('Agregar a Plan')}
            >
              <Ionicons name="calendar-outline" size={24} color={COLORS.black} />
              <Text style={styles.contextMenuText}>Agregar a Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    color: COLORS.gray500,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorText: {
    color: COLORS.gray500,
    fontSize: 16,
  },
  recipeImage: {
    width: SCREEN_W,
    height: 300,
    backgroundColor: COLORS.gray200,
  },
  recipeImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    lineHeight: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.black,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  portionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  portionsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  portionsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionsButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  portionsInput: {
    width: 60,
    height: 32,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  portionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  ingredientName: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  cookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  stepInstruction: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    flex: 1,
  },
  noStepsText: {
    fontSize: 16,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: 20,
  },
  nutritionCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  nutritionSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  nutritionText: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 22,
  },
  contextMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  contextMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contextMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  contextMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 16,
  },
  likeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
