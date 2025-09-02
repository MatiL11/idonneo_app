import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../../../src/styles/tokens';
import { useBoards, Board } from '../../../../src/hooks/useBoards';
import { useRecipes } from '../../../../src/hooks/useRecipes';
import { supabase } from '../../../../src/lib/supabase';

// Componente genérico para las categorías estilo Pinterest
const CategoryCard = ({
  title,
  showLeaf = false,
  onPress,
  previewImages = [],
}: {
  title: string;
  showLeaf?: boolean;
  onPress?: () => void;
  previewImages?: string[];
}) => {
  const [imageLoadStates, setImageLoadStates] = useState<boolean[]>([false, false, false, false]);

  const handleImageLoad = (index: number) => {
    setImageLoadStates(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  // Siempre 4 celdas (2x2). Si faltan imágenes, se rellenan con null para mostrar placeholder.
  const cells = Array.from({ length: 4 }, (_, i) => previewImages[i] || null);

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
      <View
        style={[
          styles.categoryIconContainer,
          title === 'Tus me gusta' && styles.heartIconContainer,
        ]}
      >
        {title === 'Tus me gusta' ? (
          <Ionicons name="heart" size={40} color={COLORS.white} />
        ) : (
          <View style={styles.imageGrid}>
            {cells.map((uri, index) => (
              <View key={index} style={styles.imageItem}>
                {uri ? (
                  <>
                    <Image
                      source={{ uri }}
                      style={styles.previewImage}
                      resizeMode="cover"
                      onLoad={() => handleImageLoad(index)}
                    />
                    {!imageLoadStates[index] && (
                      <View style={styles.imageLoadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.gray500} />
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.cellPlaceholder}>
                    <Ionicons name="image" size={16} color={COLORS.gray300} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.categoryLabel}>
        <Text style={styles.categoryText}>{title}</Text>
        {showLeaf && <Ionicons name="pin" size={16} color={COLORS.green} />}
      </View>
    </TouchableOpacity>
  );
};

export default function SavedNutritionScreen() {
  const router = useRouter();
  const { boards, loading, error, hasInitialized, fetchBoards } = useBoards();
  const { fetchRecipes } = useRecipes();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [boardImages, setBoardImages] = useState<Record<string, string[]>>({});
  const previousBoardsCountRef = useRef(0);

  // Carga las 4 imágenes (si existen) de cada tablero (y de "mis-recetas").
  const loadBoardImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const imagesMap: Record<string, string[]> = {};

      // Mis recetas: board_id = null
      {
        const { data, error } = await supabase
          .from('recipes')
          .select('image_url')
          .eq('user_id', user.id)
          .is('board_id', null)
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(4);

        if (!error && data) {
          imagesMap['mis-recetas'] = data.map(r => (r.image_url as string));
        } else {
          imagesMap['mis-recetas'] = [];
          if (error) console.error('Error al cargar imágenes de Mis recetas:', error);
        }
      }

      // Cada board del usuario
      await Promise.all(
        boards.map(async (board) => {
          const { data, error } = await supabase
            .from('recipes')
            .select('image_url')
            .eq('user_id', user.id)
            .eq('board_id', board.id)
            .not('image_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(4);

          if (!error && data) {
            imagesMap[board.id] = data.map(r => (r.image_url as string));
          } else {
            imagesMap[board.id] = [];
            if (error) console.error(`Error al cargar imágenes del tablero ${board.id}:`, error);
          }
        })
      );

      setBoardImages(imagesMap);
    } catch (e) {
      console.error('Error general al cargar imágenes de tableros:', e);
    }
  };

  // Inicializar la referencia cuando se monta el componente
  useEffect(() => {
    previousBoardsCountRef.current = boards.length;
  }, [boards.length]);

  // Cargar imágenes cuando cambien los tableros
  useEffect(() => {
    if (hasInitialized) {
      loadBoardImages();
    }
  }, [boards, hasInitialized]);

  // Recargar tableros cuando se regrese a esta pantalla
  useFocusEffect(
    React.useCallback(() => {
      const run = async () => {
        await fetchBoards();

        // Mensaje de éxito si hay más tableros que antes
        if (boards.length > previousBoardsCountRef.current) {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        }
        previousBoardsCountRef.current = boards.length;

        await loadBoardImages();
      };
      run();
    }, [fetchBoards])
  );

  // Categorías con imágenes reales
  const categories = [
    {
      title: 'Tus me gusta',
      showLeaf: true,
      previewImages: [],
    },
    {
      title: 'Mis recetas',
      showLeaf: true,
      previewImages: boardImages['mis-recetas'] || [],
    },
  ];

  const handleAddPress = () => setShowAddMenu(true);
  const handleMenuOption = (option: string) => {
    setShowAddMenu(false);
    if (option === 'Nueva receta') router.push('/nutricion/saved/create-recipe');
    if (option === 'Nuevo tablero') router.push('/nutricion/saved/create-board');
  };
  const closeMenu = () => setShowAddMenu(false);

  return (
    <>
      {/* Header de la biblioteca */}
      <View style={styles.libraryHeader}>
        <Text style={styles.libraryTitle}>Tu biblioteca</Text>
        <View style={styles.libraryActions}>
          <TouchableOpacity style={styles.libraryActionBtn}>
            <Ionicons name="menu" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mensaje de éxito al crear tablero */}
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
          <Text style={styles.successMessageText}>¡Tablero creado exitosamente!</Text>
        </View>
      )}

      {/* Barra de búsqueda (placeholder visual) */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.gray500} />
        <Text style={styles.searchPlaceholder}>Buscar en tu biblioteca...</Text>
      </View>

      {/* Categorías */}
      <View style={styles.libraryCategories}>
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            title={category.title}
            showLeaf={category.showLeaf}
            previewImages={category.previewImages}
            onPress={() => {
              if (category.title === 'Tus me gusta') {
                // TODO: navegación a "Tus me gusta"
              } else if (category.title === 'Mis recetas') {
                router.push('/nutricion/saved/board/mis-recetas');
              }
            }}
          />
        ))}
      </View>

      {/* Tableros creados por el usuario */}
      {!hasInitialized ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.loadingText}>Cargando tableros...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error al cargar tableros: {error}</Text>
        </View>
      ) : (
        <>
          {boards.length > 0 ? (
            <View style={styles.boardsSection}>
              <View style={styles.boardsGrid}>
                {boards.map(board => (
                  <CategoryCard
                    key={board.id}
                    title={board.title}
                    showLeaf={true}
                    previewImages={boardImages[board.id] || []}
                    onPress={() => router.push(`/nutricion/saved/board/${board.id}`)}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyBoardsContainer}>
              <Ionicons name="grid-outline" size={48} color={COLORS.gray500} />
              <Text style={styles.emptyBoardsTitle}>No tienes tableros creados</Text>
              <Text style={styles.emptyBoardsSubtitle}>
                Crea tu primer tablero para organizar tus recetas favoritas
              </Text>
            </View>
          )}
        </>
      )}

      {/* Menú contextual para agregar */}
      {showAddMenu && (
        <>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={closeMenu} />
          <View style={styles.addMenu}>
            <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuOption('Nueva receta')}>
              <Text style={styles.menuOptionText}>Nueva receta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuOption, styles.menuOptionLast]} onPress={() => handleMenuOption('Nuevo tablero')}>
              <Text style={styles.menuOptionText}>Nuevo tablero</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Estilos para la biblioteca
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  libraryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
  },
  libraryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  libraryActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  searchPlaceholder: {
    color: COLORS.gray500,
    fontSize: 16,
    flex: 1,
  },
  libraryCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  categoryCard: {
    alignItems: 'center',
    width: '42%',
    minWidth: 150,
  },
  categoryIconContainer: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  heartIconContainer: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  // Grid 2x2
  imageGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageItem: {
    width: '50%',
    height: '50%',
    borderWidth: 0.5,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray200,
  },
  cellPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
  },
  placeholderText: {
    color: COLORS.gray500,
    fontSize: 12,
    marginTop: 4,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600',
  },
  // Menú contextual
  menuBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  addMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001,
    minWidth: 160,
  },
  menuOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  menuOptionLast: {
    borderBottomWidth: 0,
  },
  menuOptionText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Tableros
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.gray500,
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  boardsSection: {
    marginTop: 24,
    width: '100%',
  },
  boardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  boardCard: {
    alignItems: 'center',
    width: '42%',
  },
  boardIconContainer: {
    width: 150,
    height: 150,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  boardTitle: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  boardDate: {
    color: COLORS.gray500,
    fontSize: 14,
  },
  // Estado vacío
  emptyBoardsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyBoardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBoardsSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  // Éxito
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  successMessageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
