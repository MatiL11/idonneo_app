import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../../src/styles/tokens';
import { useRecipes, CreateRecipeWithImageData } from '../../../../src/hooks/useRecipes';
import { useBoards } from '../../../../src/hooks/useBoards';
import { HeaderBar, WhiteSheet } from '../../../../src/components/shared';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { createRecipeWithImage, loading, pickImage } = useRecipes();
  const { boards, fetchBoards } = useBoards();
  const [title, setTitle] = useState('');
  const [portions, setPortions] = useState(1);
  const [cookingTime, setCookingTime] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>(['mis-recetas']);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [nutritionData, setNutritionData] = useState({
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
  });

  // Cargar tableros al montar el componente
  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!title.trim()) {
        Alert.alert('Error', 'Por favor ingresa un título para la receta');
        return;
      }

      const validIngredients = ingredients.filter(ingredient => ingredient.trim() !== '');
      if (validIngredients.length === 0) {
        Alert.alert('Error', 'Por favor agrega al menos un ingrediente');
        return;
      }

      // Procesar los tableros seleccionados
      const boardsToSave: (string | null)[] = [];
      
      if (selectedBoardIds.length === 0) {
        // Si no hay selección, usar "Mis recetas" por defecto
        boardsToSave.push(null);
      } else {
        // Procesar cada selección
        selectedBoardIds.forEach(id => {
          if (id === 'mis-recetas') {
            boardsToSave.push(null);
          } else {
            boardsToSave.push(id);
          }
        });
      }
      
      console.log('🔄 Guardando receta en', boardsToSave.length, 'tablero(s)...');
      
      // Crear la receta en cada tablero seleccionado
      const createdRecipes = [];
      for (const boardId of boardsToSave) {
        const recipeData: CreateRecipeWithImageData = {
          title: title.trim(),
          imageUri: selectedImage || undefined,
          board_id: boardId || undefined,
          portions,
          cooking_time: cookingTime.trim() || undefined,
          ingredients: validIngredients,
          instructions: instructions.trim() || undefined,
          notes: notes.trim() || undefined,
          calories_per_100g: nutritionData.calories_per_100g ? parseFloat(nutritionData.calories_per_100g) : undefined,
          protein_per_100g: nutritionData.protein_per_100g ? parseFloat(nutritionData.protein_per_100g) : undefined,
          carbs_per_100g: nutritionData.carbs_per_100g ? parseFloat(nutritionData.carbs_per_100g) : undefined,
          fat_per_100g: nutritionData.fat_per_100g ? parseFloat(nutritionData.fat_per_100g) : undefined,
          is_public: false, // Por defecto las recetas son privadas
        };

        const newRecipe = await createRecipeWithImage(recipeData);
        createdRecipes.push(newRecipe);
        console.log(`✅ Receta guardada en tablero ${boardId || 'Mis recetas'}:`, newRecipe);
      }
      
      console.log('✅ Todas las recetas guardadas exitosamente:', createdRecipes);
      
      // Mostrar mensaje de éxito y navegar de vuelta
      const successMessage = boardsToSave.length === 1 
        ? 'Tu receta ha sido guardada correctamente'
        : `Tu receta ha sido guardada en ${boardsToSave.length} tableros`;
        
      Alert.alert(
        '¡Éxito!', 
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error al guardar receta:', error);
      Alert.alert(
        'Error', 
        'No se pudo guardar la receta. Por favor intenta de nuevo.'
      );
    }
  };

  const handleBack = () => {
    router.back();
  };

  const incrementPortions = () => {
    setPortions(prev => prev + 1);
  };

  const decrementPortions = () => {
    if (portions > 1) {
      setPortions(prev => prev - 1);
    }
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    setIngredients(prev => {
      const newIngredients = [...prev];
      newIngredients[index] = value;
      return newIngredients;
    });
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleImagePress = async () => {
    try {
      const imageUri = await pickImage();
      if (imageUri) {
        setSelectedImage(imageUri);
        console.log('✅ Imagen seleccionada:', imageUri);
      }
    } catch (error) {
      console.error('❌ Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleBoardPress = () => {
    setShowBoardSelector(true);
  };

  const handleNutritionPress = () => {
    setShowNutritionModal(true);
  };

  const handleNutritionChange = (field: string, value: string) => {
    setNutritionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveNutrition = () => {
    setShowNutritionModal(false);
  };

  const getNutritionSummary = () => {
    const hasData = Object.values(nutritionData).some(value => value.trim() !== '');
    if (!hasData) {
      return 'Agregar datos nutricionales';
    }
    
    const parts = [];
    if (nutritionData.calories_per_100g) parts.push(`${nutritionData.calories_per_100g} cal`);
    if (nutritionData.protein_per_100g) parts.push(`${nutritionData.protein_per_100g}g prot`);
    if (nutritionData.carbs_per_100g) parts.push(`${nutritionData.carbs_per_100g}g carb`);
    if (nutritionData.fat_per_100g) parts.push(`${nutritionData.fat_per_100g}g grasa`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Agregar datos nutricionales';
  };

  const handleBoardSelect = (boardId: string | null) => {
    setSelectedBoardIds(prev => {
      if (boardId === null) {
        // Para "Mis recetas", no permitir deseleccionar
        const misRecetasId = 'mis-recetas';
        if (!prev.includes(misRecetasId)) {
          return [...prev, misRecetasId];
        }
        // Si ya está seleccionado, no hacer nada (no permitir deseleccionar)
        return prev;
      } else {
        // Toggle de la selección del tablero (solo para tableros normales)
        if (prev.includes(boardId)) {
          return prev.filter(id => id !== boardId);
        } else {
          return [...prev, boardId];
        }
      }
    });
  };

  const getSelectedBoardNames = () => {
    if (selectedBoardIds.length === 1 && selectedBoardIds[0] === 'mis-recetas') {
      return 'Mis recetas';
    }
    
    if (selectedBoardIds.length === 2 && selectedBoardIds.includes('mis-recetas')) {
      // Solo "Mis recetas" + 1 tablero más
      const otherBoardId = selectedBoardIds.find(id => id !== 'mis-recetas');
      const board = boards.find(b => b.id === otherBoardId);
      return board ? `Mis recetas + ${board.title}` : 'Mis recetas + Tablero';
    }
    
    if (selectedBoardIds.length > 2) {
      const otherBoardsCount = selectedBoardIds.length - 1; // -1 por "Mis recetas"
      return `Mis recetas + ${otherBoardsCount} tableros más`;
    }
    
    return 'Mis recetas';
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
       {/* Header superior usando componente compartido */}
       <HeaderBar
         title="Crear receta"
         onBack={handleBack}
         rightButton={{
           icon: 'checkmark',
           text: loading ? 'Guardando...' : 'Guardar',
           onPress: handleSave,
           variant: 'primary'
         }}
       />

       {/* Hoja blanca usando componente compartido */}
       <WhiteSheet>
         <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Recipe Details Section */}
          <View style={styles.mainCard}>
            {/* Título */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Título"
                placeholderTextColor={COLORS.gray300}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Imagen */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Imagen</Text>
              <TouchableOpacity style={styles.imageContainer} onPress={handleImagePress}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.cameraButton}>
                    <Ionicons name="camera" size={20} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Tu biblioteca */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tu biblioteca</Text>
              <TouchableOpacity style={styles.boardSelector} onPress={handleBoardPress}>
                <Text style={styles.boardSelectorText}>{getSelectedBoardNames()}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {/* Porciones */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Porciones</Text>
              <View style={styles.portionsSelector}>
                <TouchableOpacity style={styles.portionsButton} onPress={decrementPortions}>
                  <Ionicons name="remove" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.portionsText}>{portions}</Text>
                <TouchableOpacity style={styles.portionsButton} onPress={incrementPortions}>
                  <Ionicons name="add" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tiempo de cocción */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tiempo de cocción</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: 30 min"
                placeholderTextColor={COLORS.gray300}
                value={cookingTime}
                onChangeText={setCookingTime}
              />
            </View>

            {/* Nutrición */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Datos nutricionales</Text>
              <TouchableOpacity 
                style={styles.arrowButton}
                onPress={handleNutritionPress}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredientes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={styles.ingredientInput}
                  placeholder="Agregar ingrediente"
                  placeholderTextColor={COLORS.gray300}
                  value={ingredient}
                  onChangeText={(value) => updateIngredient(index, value)}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeIngredient(index)}
                  >
                    <Ionicons name="close" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                )}
                {index === ingredients.length - 1 && (
                  <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                    <Ionicons name="add" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Instrucciones Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            <TextInput
              style={styles.multilineInput}
              placeholder="Describe los pasos para preparar la receta..."
              placeholderTextColor={COLORS.gray300}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Notas Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <TextInput
              style={styles.multilineInput}
              placeholder="Añadir notas adicionales sobre la receta..."
              placeholderTextColor={COLORS.gray300}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
         </ScrollView>

         {/* Modal Selector de Tableros */}
         {showBoardSelector && (
           <View style={styles.modalOverlay}>
             <TouchableOpacity 
               style={styles.modalBackdrop} 
               activeOpacity={1} 
               onPress={() => setShowBoardSelector(false)}
             />
             <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Seleccionar tablero</Text>
                 <TouchableOpacity 
                   style={styles.modalCloseButton}
                   onPress={() => setShowBoardSelector(false)}
                 >
                   <Ionicons name="close" size={24} color={COLORS.black} />
                 </TouchableOpacity>
               </View>
               
               <ScrollView style={styles.modalBody}>
                 {/* Opción "Mis recetas" (siempre seleccionada) */}
                 <View 
                   style={[
                     styles.boardOption,
                     styles.boardOptionSelected,
                     styles.boardOptionDisabled
                   ]}
                 >
                   <View style={styles.boardOptionContent}>
                     <Ionicons 
                       name="book" 
                       size={24} 
                       color={COLORS.green} 
                     />
                     <Text style={[
                       styles.boardOptionText,
                       styles.boardOptionTextSelected
                     ]}>
                       Mis recetas
                     </Text>
                   </View>
                   <Ionicons name="checkmark" size={20} color={COLORS.green} />
                 </View>

                 {/* Tableros creados por el usuario */}
                 {boards.map((board) => (
                   <TouchableOpacity 
                     key={board.id}
                     style={[
                       styles.boardOption,
                       selectedBoardIds.includes(board.id) && styles.boardOptionSelected
                     ]}
                     onPress={() => handleBoardSelect(board.id)}
                   >
                     <View style={styles.boardOptionContent}>
                       <Ionicons 
                         name="grid" 
                         size={24} 
                         color={selectedBoardIds.includes(board.id) ? COLORS.green : COLORS.gray500} 
                       />
                       <Text style={[
                         styles.boardOptionText,
                         selectedBoardIds.includes(board.id) && styles.boardOptionTextSelected
                       ]}>
                         {board.title}
                       </Text>
                     </View>
                     {selectedBoardIds.includes(board.id) && (
                       <Ionicons name="checkmark" size={20} color={COLORS.green} />
                     )}
                   </TouchableOpacity>
                 ))}

                 {/* Botón para crear nuevo tablero */}
                 <TouchableOpacity 
                   style={styles.createBoardButton}
                   onPress={() => {
                     setShowBoardSelector(false);
                     router.push('/nutricion/saved/create-board');
                   }}
                 >
                   <Ionicons name="add" size={20} color={COLORS.green} />
                   <Text style={styles.createBoardButtonText}>Crear nuevo tablero</Text>
                 </TouchableOpacity>
               </ScrollView>
             </View>
           </View>
                  )}

         {/* Modal Datos Nutricionales */}
         {showNutritionModal && (
           <View style={styles.modalOverlay}>
             <TouchableOpacity 
               style={styles.modalBackdrop} 
               activeOpacity={1} 
               onPress={() => setShowNutritionModal(false)}
             />
             <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>Datos nutricionales (por 100g)</Text>
                 <TouchableOpacity 
                   style={styles.modalCloseButton}
                   onPress={() => setShowNutritionModal(false)}
                 >
                   <Ionicons name="close" size={24} color={COLORS.black} />
                 </TouchableOpacity>
               </View>
               
               <ScrollView style={styles.modalBody}>
                 {/* Calorías */}
                 <View style={styles.nutritionField}>
                   <Text style={styles.nutritionLabel}>Calorías por 100g</Text>
                   <TextInput
                     style={styles.nutritionInput}
                     value={nutritionData.calories_per_100g}
                     onChangeText={(value) => handleNutritionChange('calories_per_100g', value)}
                     placeholder="Ej: 250"
                     keyboardType="numeric"
                   />
                 </View>

                 {/* Proteínas */}
                 <View style={styles.nutritionField}>
                   <Text style={styles.nutritionLabel}>Proteínas por 100g (g)</Text>
                   <TextInput
                     style={styles.nutritionInput}
                     value={nutritionData.protein_per_100g}
                     onChangeText={(value) => handleNutritionChange('protein_per_100g', value)}
                     placeholder="Ej: 15"
                     keyboardType="numeric"
                   />
                 </View>

                 {/* Carbohidratos */}
                 <View style={styles.nutritionField}>
                   <Text style={styles.nutritionLabel}>Carbohidratos por 100g (g)</Text>
                   <TextInput
                     style={styles.nutritionInput}
                     value={nutritionData.carbs_per_100g}
                     onChangeText={(value) => handleNutritionChange('carbs_per_100g', value)}
                     placeholder="Ej: 30"
                     keyboardType="numeric"
                   />
                 </View>

                 {/* Grasas */}
                 <View style={styles.nutritionField}>
                   <Text style={styles.nutritionLabel}>Grasas por 100g (g)</Text>
                   <TextInput
                     style={styles.nutritionInput}
                     value={nutritionData.fat_per_100g}
                     onChangeText={(value) => handleNutritionChange('fat_per_100g', value)}
                     placeholder="Ej: 10"
                     keyboardType="numeric"
                   />
                 </View>
               </ScrollView>

               <View style={styles.modalFooter}>
                 <TouchableOpacity 
                   style={styles.saveNutritionButton}
                   onPress={handleSaveNutrition}
                 >
                   <Text style={styles.saveNutritionButtonText}>Guardar</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </View>
         )}
       </WhiteSheet>
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
    padding: 20,
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    flex: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'right',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  portionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    minWidth: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
  },
  sectionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTextInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ingredientInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multilineInput: {
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  boardSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boardSelectorText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  boardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: COLORS.gray100,
  },
  boardOptionSelected: {
    backgroundColor: COLORS.green + '20',
    borderWidth: 1,
    borderColor: COLORS.green,
  },
  boardOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  boardOptionDisabled: {
    opacity: 0.7,
  },
  boardOptionSubtext: {
    fontSize: 12,
    color: COLORS.gray500,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  nutritionSummary: {
    fontSize: 14,
    color: COLORS.gray500,
    marginRight: 8,
    flex: 1,
    textAlign: 'right',
  },
  nutritionField: {
    marginBottom: 20,
  },
  nutritionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  saveNutritionButton: {
    backgroundColor: COLORS.green,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveNutritionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  boardOptionText: {
    fontSize: 16,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  boardOptionTextSelected: {
    color: COLORS.green,
    fontWeight: '600',
  },
  createBoardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  createBoardButtonText: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '600',
  },
});
