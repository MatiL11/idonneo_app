import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../../src/styles/tokens';
import { useRecipes, CreateRecipeData } from '../../../../src/hooks/useRecipes';

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { createRecipe, loading } = useRecipes();
  const [title, setTitle] = useState('');
  const [portions, setPortions] = useState(1);
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

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

      // Preparar los datos de la receta
      const recipeData: CreateRecipeData = {
        title: title.trim(),
        image_url: imageUrl.trim() || undefined,
        portions,
        ingredients: validIngredients,
        instructions: instructions.trim() || undefined,
        notes: notes.trim() || undefined,
        is_public: false, // Por defecto las recetas son privadas
      };

      console.log('🔄 Guardando receta...', recipeData);
      
      // Crear la receta
      const newRecipe = await createRecipe(recipeData);
      
      console.log('✅ Receta guardada exitosamente:', newRecipe);
      
      // Mostrar mensaje de éxito y navegar de vuelta
      Alert.alert(
        '¡Éxito!', 
        'Tu receta ha sido guardada correctamente',
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

         return (
     <View style={styles.root}>
       <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
       
       {/* Header Bar */}
       <View style={styles.header}>
         <TouchableOpacity style={styles.backButton} onPress={handleBack}>
           <Ionicons name="arrow-back" size={24} color={COLORS.white} />
         </TouchableOpacity>
         
         <Text style={styles.headerTitle}>Crear receta</Text>
         
         <TouchableOpacity 
           style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
           onPress={handleSave}
           disabled={loading}
         >
           <Ionicons name="checkmark" size={20} color={COLORS.white} />
           <Text style={styles.saveButtonText}>
             {loading ? 'Guardando...' : 'Guardar'}
           </Text>
         </TouchableOpacity>
       </View>

       {/* Content Area */}
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
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Tu biblioteca */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Tu biblioteca</Text>
              <TouchableOpacity style={styles.arrowButton}>
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

            {/* Nutrición */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Datos nutricionales</Text>
              <TouchableOpacity style={styles.arrowButton}>
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
       </View>
     );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingTop: 60, // Padding para la barra de estado
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 25, // Ajustado para los bordes redondeados
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
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
});
