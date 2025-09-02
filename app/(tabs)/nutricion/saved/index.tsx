import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../../../../src/styles/tokens';
import { useBoards, Board } from '../../../../src/hooks/useBoards';

// Componente genérico para las categorías estilo Pinterest
const CategoryCard = ({ 
  title, 
  showLeaf = false, 
  onPress,
  previewImages = []
}: {
  title: string;
  showLeaf?: boolean;
  onPress?: () => void;
  previewImages?: string[];
}) => {
  const [imageLoadStates, setImageLoadStates] = useState<boolean[]>([false, false, false, false]);

  const handleImageLoad = (index: number) => {
    setImageLoadStates(prev => {
      const newStates = [...prev];
      newStates[index] = true;
      return newStates;
    });
  };

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress}>
      <View style={[
        styles.categoryIconContainer,
        title === 'Tus me gusta' && styles.heartIconContainer
      ]}>
        {title === 'Tus me gusta' ? (
          // Diseño especial para "Tus me gusta" - corazón verde
          <Ionicons name="heart" size={40} color={COLORS.white} />
        ) : (
          // Grid de 4 imágenes estilo Pinterest para las demás categorías
          <View style={styles.imageGrid}>
            {previewImages.length > 0 ? (
              <>
                {/* Primera imagen - ocupa la mitad superior izquierda */}
                <View style={[styles.imageItem, styles.imageLarge]}>
                  <Image 
                    source={{ uri: previewImages[0] }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                    onLoad={() => handleImageLoad(0)}
                  />
                  {!imageLoadStates[0] && (
                    <View style={styles.imageLoadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.gray500} />
                    </View>
                  )}
                </View>
                {/* Segunda imagen - ocupa la mitad superior derecha */}
                <View style={[styles.imageItem, styles.imageSmall]}>
                  <Image 
                    source={{ uri: previewImages[1] }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                    onLoad={() => handleImageLoad(1)}
                  />
                  {!imageLoadStates[1] && (
                    <View style={styles.imageLoadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.gray500} />
                    </View>
                  )}
                </View>
                {/* Tercera imagen - ocupa la mitad inferior izquierda */}
                <View style={[styles.imageItem, styles.imageSmall]}>
                  <Image 
                    source={{ uri: previewImages[2] }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                    onLoad={() => handleImageLoad(2)}
                  />
                  {!imageLoadStates[2] && (
                    <View style={styles.imageLoadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.gray500} />
                    </View>
                  )}
                </View>
                {/* Cuarta imagen - ocupa la mitad inferior derecha */}
                <View style={[styles.imageItem, styles.imageSmall]}>
                  <Image 
                    source={{ uri: previewImages[3] }} 
                    style={styles.previewImage}
                    resizeMode="cover"
                    onLoad={() => handleImageLoad(3)}
                  />
                  {!imageLoadStates[3] && (
                    <View style={styles.imageLoadingContainer}>
                      <ActivityIndicator size="small" color={COLORS.gray500} />
                    </View>
                  )}
                </View>
              </>
            ) : (
              // Placeholder cuando no hay imágenes
              <View style={styles.placeholderContainer}>
                <Ionicons name="images" size={32} color={COLORS.gray500} />
                <Text style={styles.placeholderText}>Sin imágenes</Text>
              </View>
            )}
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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const previousBoardsCountRef = useRef(0);

  // Inicializar la referencia cuando se monta el componente
  useEffect(() => {
    previousBoardsCountRef.current = boards.length;
  }, [boards.length]);

  // Recargar tableros cuando se regrese a esta pantalla
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 useFocusEffect ejecutado en SavedNutritionScreen');
      const currentBoardsCount = boards.length;
      
      fetchBoards().then(() => {
        // Si hay más tableros que antes, mostrar mensaje de éxito
        if (boards.length > previousBoardsCountRef.current) {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000); // Ocultar después de 3 segundos
        }
        // Actualizar la referencia
        previousBoardsCountRef.current = boards.length;
      });
    }, [fetchBoards])
  );

  // Datos de ejemplo - en el futuro esto vendrá de una API o base de datos
  const categories = [
    { 
      title: 'Tus me gusta', 
      showLeaf: true,
      previewImages: [] // Sin imágenes por ahora
    },
    { 
      title: 'Mis recetas', 
      showLeaf: true,
      previewImages: [] // Sin imágenes por ahora
    },
  ];

  const handleAddPress = () => {
    setShowAddMenu(true);
  };

  const handleMenuOption = (option: string) => {
    console.log(`Opción seleccionada: ${option}`);
    setShowAddMenu(false);
    
    if (option === 'Nueva receta') {
      router.push('/nutricion/saved/create-recipe');
    } else if (option === 'Nuevo tablero') {
      router.push('/nutricion/saved/create-board');
    }
  };

  const closeMenu = () => {
    setShowAddMenu(false);
  };

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

      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.gray500} />
        <Text style={styles.searchPlaceholder}>Buscar en tu biblioteca...</Text>
      </View>

                     {/* Categorías de la biblioteca */}
        <View style={styles.libraryCategories}>
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              title={category.title}
              showLeaf={category.showLeaf}
              previewImages={category.previewImages}
              onPress={() => console.log(`Navegar a ${category.title}`)}
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
                  {boards.map((board) => (
                    <TouchableOpacity
                      key={board.id}
                      style={styles.boardCard}
                      onPress={() => console.log(`Navegar a tablero: ${board.title}`)}
                    >
                                             <View style={styles.boardIconContainer}>
                         <Ionicons name="grid" size={40} color={COLORS.green} />
                       </View>
                      <Text style={styles.boardTitle} numberOfLines={2}>
                        {board.title}
                      </Text>
                      <Text style={styles.boardDate}>
                        {new Date(board.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </Text>
                    </TouchableOpacity>
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
           {/* Backdrop para cerrar el menú */}
           <TouchableOpacity 
             style={styles.menuBackdrop} 
             activeOpacity={1} 
             onPress={closeMenu}
           />
           
           {/* Menú contextual */}
           <View style={styles.addMenu}>
             <TouchableOpacity 
               style={styles.menuOption}
               onPress={() => handleMenuOption('Nueva receta')}
             >
               <Text style={styles.menuOptionText}>Nueva receta</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               style={[styles.menuOption, styles.menuOptionLast]}
               onPress={() => handleMenuOption('Nuevo tablero')}
             >
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
    paddingHorizontal: 0, // Removido porque el panel ya tiene paddingHorizontal: 20
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
    justifyContent: 'center', // Centrar las categorías horizontalmente
  },
  categoryCard: {
    alignItems: 'center',
    width: '42%', // Mantener el ancho para que quepan 2 por fila
    minWidth: 150, // Ancho mínimo para mantener consistencia
  },
  categoryIconContainer: {
    width: '100%', // Adaptarse al contenedor padre
    height: 150,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden', // Asegurar que el contenido respete los bordes redondeados
  },
  heartIconContainer: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  // Estilos para el grid de imágenes estilo Pinterest
  imageGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    backgroundColor: COLORS.gray100,
    borderRadius: 20, // Mismo radio que el contenedor padre
    overflow: 'hidden', // Asegurar que las imágenes respeten los bordes
  },
  imageItem: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  imageLarge: {
    width: '50%',
    height: '50%',
  },
  imageSmall: {
    width: '50%',
    height: '50%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray200,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 20, // Mismo radio que el contenedor padre
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
    borderRadius: 20, // Mismo radio que el contenedor padre
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
  // Estilos para el menú contextual
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  addMenu: {
    position: 'absolute',
    top: 80, // Ajustado para que aparezca más cerca del botón
    right: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  // Estilos para los tableros
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
    marginTop: 24, // Espaciado más equilibrado con las categorías
    width: '100%', // Ocupar todo el ancho disponible
  },
  boardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20, // Mismo espaciado que las categorías
    justifyContent: 'center', // Centrar los tableros horizontalmente
  },
  boardCard: {
    alignItems: 'center',
    width: '42%', // Mismo ancho que las categorías para consistencia
  },
  boardIconContainer: {
    width: 150, // Mismo tamaño que las categorías
    height: 150, // Mismo tamaño que las categorías
    borderRadius: 20, // Mismo radio que las categorías
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  boardTitle: {
    color: COLORS.black,
    fontSize: 16, // Tamaño más grande para mejor legibilidad
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6, // Más espacio entre título y fecha
  },
  boardDate: {
    color: COLORS.gray500,
    fontSize: 14, // Tamaño más grande para mejor legibilidad
  },
  // Estilos para el estado vacío de tableros
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
  // Estilos para el mensaje de éxito
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
