import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../../../src/styles/tokens';
import { useRecipes, Recipe } from '../../../../../src/hooks/useRecipes';
import { useBoards, Board } from '../../../../../src/hooks/useBoards';
import { HeaderBar, WhiteSheet } from '../../../../../src/components/shared';

const SCREEN_W = Dimensions.get('window').width;
const HEADER_HEIGHT = 56;       // ajusta si tu HeaderBar es más alto
const MENU_GAP = 6;             // separación vertical del ancla

export default function BoardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchRecipes, loading, deleteRecipe, removeRecipeFromBoard } = useRecipes();
  const { boards, fetchBoards } = useBoards();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Menús
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [showRecipeMenu, setShowRecipeMenu] = useState<string | null>(null);

  // Posición dinámica del menú actualmente visible
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);

  // Refs de los botones "tres puntos" de cada receta para medir su posición
  const recipeBtnRefs = useRef<Record<string, View | null>>({});

  const insets = useSafeAreaInsets();
  const boardMenuTop = insets.top + HEADER_HEIGHT + MENU_GAP;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await fetchBoards();

      if (id && id !== 'mis-recetas') {
        const boardRecipes = await fetchRecipes(id);
        setRecipes(boardRecipes);
      } else {
        const allRecipes = await fetchRecipes();
        const misRecetas = allRecipes.filter(r => !r.board_id);
        setRecipes(misRecetas);
      }
    } catch (error) {
      console.error('Error al cargar datos del tablero:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (boards.length > 0 && id && id !== 'mis-recetas') {
      const currentBoard = boards.find((b: Board) => b.id === id);
      setBoard(currentBoard || null);
    } else if (id === 'mis-recetas') {
      setBoard({
        id: 'mis-recetas',
        title: 'Mis recetas',
        user_id: '',
        created_at: new Date().toISOString(),
        is_public: false
      } as Board);
    }
  }, [boards, id]);

  const handleBack = () => router.back();

  // Menú del header (tablero)
  const handleBoardMenuPress = () => {
    setShowRecipeMenu(null);
    setMenuCoords({ top: boardMenuTop, right: 20 });
    setShowBoardMenu(v => !v);
  };

  // Medir y abrir menú de una receta en el lugar correcto
  const handleRecipeMenuPress = (recipeId: string) => {
    setShowBoardMenu(false);
    const ref = recipeBtnRefs.current[recipeId];

    if (ref?.measureInWindow) {
      ref.measureInWindow((x, y, width, height) => {
        // Convertir coordenadas absolutas de ventana a coordenadas relativas al SafeAreaView
        const top = y - insets.top + height + MENU_GAP;
        // Alinear hacia la derecha del botón
        const right = Math.max(12, SCREEN_W - (x + width)); // margen mínimo
        setMenuCoords({ top, right });
        setShowRecipeMenu(prev => (prev === recipeId ? null : recipeId));
      });
    } else {
      // Fallback: si no se pudo medir, lo mostramos bajo el header
      setMenuCoords({ top: boardMenuTop, right: 20 });
      setShowRecipeMenu(prev => (prev === recipeId ? null : recipeId));
    }
  };

  const handleBoardMenuOption = (option: string) => {
    setShowBoardMenu(false);
    switch (option) {
      case 'Compartir':
      case 'Editar tablero':
      case 'Hacer privado':
      case 'Eliminar tablero':
        // TODO
        break;
    }
  };

  const handleRecipeMenuOption = (option: string, recipeId: string) => {
    setShowRecipeMenu(null);
    switch (option) {
      case 'Compartir':
      case 'Agregar a Tu biblioteca':
      case 'Agregar a Plan':
        // TODO
        break;
      case 'Eliminar receta':
        handleDeleteRecipe(recipeId);
        break;
      case 'Eliminar de este tablero':
        handleRemoveFromBoard(recipeId);
        break;
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    Alert.alert(
      'Eliminar receta',
      '¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipeId);
              Alert.alert('Éxito', 'Receta eliminada correctamente');
              loadData();
            } catch (error) {
              console.error('Error al eliminar receta:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta');
            }
          }
        }
      ]
    );
  };

  const handleRemoveFromBoard = async (recipeId: string) => {
    Alert.alert(
      'Eliminar del tablero',
      '¿Estás seguro de que quieres eliminar esta receta de este tablero?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeRecipeFromBoard(recipeId);
              Alert.alert('Éxito', 'Receta eliminada del tablero');
              loadData();
            } catch (error) {
              console.error('Error al eliminar del tablero:', error);
              Alert.alert('Error', 'No se pudo eliminar la receta del tablero');
            }
          }
        }
      ]
    );
  };

  const filteredRecipes = recipes.filter((recipe: Recipe) =>
    recipe.title.toLowerCase().includes((/* searchQuery */ '').toLowerCase())
  );

  const getBoardTitle = () => (id === 'mis-recetas' ? 'Mis recetas' : board?.title || 'Tablero');

  const getNutritionText = (recipe: Recipe) => {
    const parts: string[] = [];
    // @ts-ignore
    if (recipe.protein_per_100g) parts.push(`Prot: ${recipe.protein_per_100g}g`);
    // @ts-ignore
    if (recipe.carbs_per_100g) parts.push(`Carb: ${recipe.carbs_per_100g}g`);
    // @ts-ignore
    if (recipe.fat_per_100g) parts.push(`Grasas: ${recipe.fat_per_100g}g`);
    return parts.length === 0 ? 'Sin datos nutricionales' : parts.join(' ');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <HeaderBar
        title={getBoardTitle()}
        onBack={handleBack}
        rightButton={{
          icon: 'ellipsis-horizontal',
          text: '',
          onPress: handleBoardMenuPress,
          variant: 'secondary'
        }}
      />

      {/* Contenido */}
      <WhiteSheet>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar recetas..."
              placeholderTextColor={COLORS.gray500}
              // value={searchQuery}
              // onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.loadingText}>Cargando recetas...</Text>
            </View>
          ) : (
            <>
              {filteredRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  {recipe.image_url ? (
                    <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} />
                  ) : (
                    <View style={[styles.recipeImage, styles.recipeImagePlaceholder]}>
                      <Ionicons name="restaurant" size={24} color={COLORS.gray500} />
                    </View>
                  )}

                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    {/* @ts-ignore */}
                    <Text style={styles.recipeDuration}>{recipe.cooking_time || 'Sin tiempo'}</Text>
                    <Text style={styles.recipeNutrition}>{getNutritionText(recipe)}</Text>
                  </View>

                  {/* wrapper con ref para medir */}
                  <View
                    ref={(el) => {
                      recipeBtnRefs.current[recipe.id] = el;
                    }}
                  >
                    <TouchableOpacity
                      style={styles.recipeMenuButton}
                      onPress={() => handleRecipeMenuPress(recipe.id)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {filteredRecipes.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant" size={48} color={COLORS.gray500} />
                  <Text style={styles.emptyStateTitle}>No hay recetas</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {/* {searchQuery ? 'No se encontraron recetas con ese nombre' : 'Este tablero está vacío'} */}
                    Este tablero está vacío
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </WhiteSheet>

      {/* Backdrop (fuera del WhiteSheet y por encima del header) */}
      {(showBoardMenu || showRecipeMenu) && (
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => {
            setShowBoardMenu(false);
            setShowRecipeMenu(null);
          }}
        />
      )}

      {/* Menú del tablero (anclado al header) */}
      {showBoardMenu && menuCoords && (
        <View style={[styles.menuBase, styles.boardMenu, { top: menuCoords.top, right: menuCoords.right }]}>
          <TouchableOpacity style={styles.menuOption} onPress={() => handleBoardMenuOption('Compartir')}>
            <Ionicons name="share" size={20} color={COLORS.gray500} />
            <Text style={styles.menuOptionText}>Compartir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={() => handleBoardMenuOption('Editar tablero')}>
            <Ionicons name="pencil" size={20} color={COLORS.gray500} />
            <Text style={styles.menuOptionText}>Editar tablero</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={() => handleBoardMenuOption('Hacer privado')}>
            <Ionicons name="lock-closed" size={20} color={COLORS.gray500} />
            <Text style={styles.menuOptionText}>Hacer privado</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuOption} onPress={() => handleBoardMenuOption('Eliminar tablero')}>
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>Eliminar tablero</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menú de receta (anclado a cada tarjeta) */}
      {showRecipeMenu && menuCoords && (
        <View style={[styles.menuBase, styles.recipeMenu, { top: menuCoords.top, right: menuCoords.right }]}>
          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => handleRecipeMenuOption('Compartir', showRecipeMenu)}
          >
            <Ionicons name="share" size={20} color={COLORS.gray500} />
            <Text style={styles.menuOptionText}>Compartir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => handleRecipeMenuOption('Agregar a Tu biblioteca', showRecipeMenu)}
          >
            <Ionicons name="add" size={20} color={COLORS.gray500} />
            <Text style={styles.menuOptionText}>Agregar a Tu biblioteca</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => handleRecipeMenuOption('Agregar a Plan', showRecipeMenu)}
          >
            <Ionicons name="add" size={20} color={COLORS.gray500} />
            <Text style={styles.menuOptionText}>Agregar a Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={() =>
              handleRecipeMenuOption(id === 'mis-recetas' ? 'Eliminar receta' : 'Eliminar de este tablero', showRecipeMenu)
            }
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text style={[styles.menuOptionText, { color: '#ef4444' }]}>
              {id === 'mis-recetas' ? 'Eliminar receta' : 'Eliminar de este tablero'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
    position: 'relative',
  },

  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    color: COLORS.black,
    fontSize: 16,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.gray200,
  },
  recipeImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  recipeDuration: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  recipeNutrition: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  recipeMenuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: COLORS.gray500,
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
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
  },

  // Overlays
  menuBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10000,
    elevation: 30,
  },
  menuBase: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 30,
    zIndex: 10001,
  },
  boardMenu: {
    minWidth: 180,
  },
  recipeMenu: {},
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuOptionText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '500',
  },
});
