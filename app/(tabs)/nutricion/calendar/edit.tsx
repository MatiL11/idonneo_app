import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Modal, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../../src/styles/tokens';
import { 
  HeaderBar, 
  WeekNavigation, 
  DayCard, 
  MealItem, 
  MealTypeMenu, 
  WhiteSheet 
} from '../../../../src/components/shared';
import { WeekSkeleton } from '../../../../src/components/training/WeekSkeleton';
import { useRecipes, Recipe } from '../../../../src/hooks/useRecipes';
import { useNutritionPlans, DayPlan as NutritionDayPlan } from '../../../../src/hooks/useNutritionPlans';

dayjs.locale('es');

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'snack';
  image: string;
  recipeId?: string; // ID de la receta seleccionada
  recipe?: Recipe; // Datos completos de la receta
}
interface DayPlan {
  date: string;
  meals: Meal[];
}

export default function EditNutritionPlanScreen() {
  const router = useRouter();
  const { fetchRecipes } = useRecipes();
  const { saveNutritionPlan, loadNutritionPlan, loading: savingPlan } = useNutritionPlans();
  const [anchor, setAnchor] = useState(dayjs());
  const [showMealMenu, setShowMealMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{ mealId: string; date: string } | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Cargar recetas y datos existentes al montar el componente
  useEffect(() => {
    loadRecipes();
    loadExistingData();
  }, []);

  // Cargar datos existentes cuando cambia la semana
  useEffect(() => {
    loadExistingData();
  }, [anchor]);

  const loadRecipes = async () => {
    try {
      const userRecipes = await fetchRecipes();
      setRecipes(userRecipes);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    }
  };

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const startDate = weekDates[0].format('YYYY-MM-DD');
      const endDate = weekDates[6].format('YYYY-MM-DD');
      
      const { mealsByDay } = await loadNutritionPlan(startDate, endDate);
      
      if (mealsByDay && typeof mealsByDay === 'object') {
        const existingPlans: DayPlan[] = [];
        
        Object.keys(mealsByDay).forEach(date => {
          const meals = mealsByDay[date];
          if (Array.isArray(meals) && meals.length > 0) {
            const dayMeals: Meal[] = meals.map(meal => ({
              id: meal.id,
              name: meal.recipes?.title || meal.notes?.replace('Planificado: ', '') || 'Comida sin nombre',
              type: meal.meal_type,
              image: meal.recipes?.image_url || '🍽️',
              recipeId: meal.recipe_id,
              recipe: meal.recipes,
            }));
            
            existingPlans.push({
              date,
              meals: sortMealsByType(dayMeals)
            });
          }
        });
        
        setWeekPlan(existingPlans);
      } else {
        // Si no hay datos, inicializar con planes vacíos
        const emptyPlans: DayPlan[] = weekDates.map(date => ({
          date: date.format('YYYY-MM-DD'),
          meals: []
        }));
        setWeekPlan(emptyPlans);
      }
    } catch (error) {
      console.error('Error al cargar datos existentes:', error);
      // En caso de error, inicializar con planes vacíos
      const emptyPlans: DayPlan[] = weekDates.map(date => ({
        date: date.format('YYYY-MM-DD'),
        meals: []
      }));
      setWeekPlan(emptyPlans);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el lunes de la semana (igual que en entrenamiento)
  const mondayStart = (d: dayjs.Dayjs) => {
    const shift = (d.day() + 6) % 7;
    return d.subtract(shift, 'day').startOf('day');
  };

  // Semana (Lun–Dom visual)
  const weekDates = useMemo(() => {
    const start = mondayStart(anchor);
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  }, [anchor]);

  // Datos de ejemplo para la semana actual
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);

  const goPrevWeek = () => {
    setAnchor((p) => p.subtract(1, 'week'));
  };
  const goNextWeek = () => {
    setAnchor((p) => p.add(1, 'week'));
  };

  const dayAbbr = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  const getDayPlan = (date: string) => {
    const existingPlan = weekPlan.find((d) => d.date === date);
    if (existingPlan) {
      return existingPlan;
    }
    // Si no existe un plan para esta fecha, crear uno vacío
    const newPlan: DayPlan = { date, meals: [] };
    setWeekPlan(prev => [...prev, newPlan]);
    return newPlan;
  };

  const addMeal = (date: string, mealType: string) => {
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: `Nueva ${mealType}`,
      type: mealType as any,
      image: '🍽️',
    };
    setWeekPlan((prev) => {
      const existingDay = prev.find((d) => d.date === date);
      if (existingDay) {
        const updatedMeals = [...existingDay.meals, newMeal];
        const sortedMeals = sortMealsByType(updatedMeals);
        return prev.map((d) => d.date === date ? { ...d, meals: sortedMeals } : d);
      } else {
        return [...prev, { date, meals: [newMeal] }];
      }
    });
    setShowMealMenu(null);
  };

  const handleMealPress = (mealId: string, date: string) => {
    setSelectedMeal({ mealId, date });
    setShowRecipeModal(true);
  };

  const selectRecipe = (recipe: Recipe) => {
    if (!selectedMeal) return;

    setWeekPlan((prev) => {
      return prev.map((day) => {
        if (day.date === selectedMeal.date) {
          const updatedMeals = day.meals.map((meal) => {
            if (meal.id === selectedMeal.mealId) {
              return {
                ...meal,
                name: recipe.title,
                image: recipe.image_url || '🍽️',
                recipeId: recipe.id,
                recipe: recipe,
              };
            }
            return meal;
          });
          const sortedMeals = sortMealsByType(updatedMeals);
          return {
            ...day,
            meals: sortedMeals,
          };
        }
        return day;
      });
    });

    setShowRecipeModal(false);
    setSelectedMeal(null);
  };

  const handleSavePlan = async () => {
    try {
      const startDate = weekDates[0].format('YYYY-MM-DD');
      const endDate = weekDates[6].format('YYYY-MM-DD');
      
      // Convertir weekPlan al formato esperado por el hook
      const planData: NutritionDayPlan[] = weekPlan.map(day => ({
        date: day.date,
        meals: day.meals.map(meal => ({
          id: meal.id,
          name: meal.name,
          type: meal.type,
          image: meal.image,
          recipeId: meal.recipeId,
          recipe: meal.recipe,
        }))
      }));

      await saveNutritionPlan(planData, startDate, endDate);
      
      // Mostrar mensaje de éxito y regresar
      alert('Plan guardado exitosamente');
      router.back();
    } catch (error) {
      console.error('Error al guardar plan:', error);
      alert('Error al guardar el plan. Inténtalo de nuevo.');
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Desayuno', icon: 'sunny' },
    { key: 'lunch', label: 'Almuerzo', icon: 'restaurant' },
    { key: 'merienda', label: 'Merienda', icon: 'cafe' },
    { key: 'dinner', label: 'Cena', icon: 'moon' },
    { key: 'snack', label: 'Snack', icon: 'nutrition' },
  ];

  // Función para ordenar las comidas según el tipo
  const sortMealsByType = (meals: Meal[]): Meal[] => {
    const typeOrder = ['breakfast', 'lunch', 'merienda', 'dinner', 'snack'];
    return meals.sort((a, b) => {
      const aIndex = typeOrder.indexOf(a.type);
      const bIndex = typeOrder.indexOf(b.type);
      return aIndex - bIndex;
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header superior usando componente compartido */}
      <HeaderBar
        title="Editar Plan"
        onBack={() => router.back()}
        rightButton={{
          icon: 'checkmark',
          text: savingPlan ? 'Guardando...' : 'Guardar',
          onPress: handleSavePlan,
          variant: 'primary'
        }}
      />

      {/* Hoja blanca usando componente compartido */}
      <WhiteSheet>
        {/* Navegación semanal usando componente compartido */}
        <WeekNavigation
          startDate={weekDates[0].format('DD MMM YYYY')}
          endDate={weekDates[6].format('DD MMM YYYY')}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
        />

        <ScrollView style={styles.daysContainer} showsVerticalScrollIndicator={false}>
          {loading ? (
            <WeekSkeleton />
          ) : (
            weekDates.map((date, idx) => {
              const key = date.format('YYYY-MM-DD');
              const dayPlan = getDayPlan(key);
              const isToday = date.isSame(dayjs(), 'day');

              const abbr = dayAbbr[idx];
              const num = date.format('DD');

              return (
                <DayCard
                  key={idx}
                  dayAbbr={abbr}
                  dayNumber={num}
                  isToday={isToday}
                  onAddMeal={() => setShowMealMenu(showMealMenu === key ? null : key)}
                >
                  {/* Comidas del día usando componente compartido */}
                  {dayPlan.meals.length > 0 && (
                    <View style={styles.mealsList}>
                      {dayPlan.meals.map((meal) => (
                        <TouchableOpacity
                          key={meal.id}
                          onPress={() => handleMealPress(meal.id, key)}
                          style={styles.mealTouchable}
                        >
                          <MealItem
                            name={meal.name}
                            type={mealTypes.find((t) => t.key === meal.type)?.label || ''}
                            image={meal.image}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Menú de tipos de comida usando componente compartido */}
                  <MealTypeMenu
                    mealTypes={mealTypes}
                    onSelectMealType={(mealType) => addMeal(key, mealType)}
                    visible={showMealMenu === key}
                    onClose={() => setShowMealMenu(null)}
                  />
                </DayCard>
              );
            })
          )}
        </ScrollView>
      </WhiteSheet>

      {/* Modal para seleccionar receta */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowRecipeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Receta</Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            style={styles.recipesList}
            contentContainerStyle={styles.recipesListContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recipeItem}
                onPress={() => selectRecipe(item)}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
                ) : (
                  <View style={[styles.recipeImage, styles.recipeImagePlaceholder]}>
                    <Ionicons name="restaurant" size={24} color={COLORS.gray500} />
                  </View>
                )}
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <Text style={styles.recipeSubtitle}>
                    {item.cooking_time || 'Sin tiempo'} • {item.portions || 1} porción{item.portions !== 1 ? 'es' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray500} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyRecipes}>
                <Ionicons name="restaurant" size={48} color={COLORS.gray500} />
                <Text style={styles.emptyRecipesTitle}>No hay recetas</Text>
                <Text style={styles.emptyRecipesSubtitle}>
                  Crea tu primera receta para poder agregarla a tu plan
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: COLORS.black 
  },
  daysContainer: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingBottom: 16 
  },
  mealsList: { 
    gap: 10, 
    marginTop: 6 
  },
  mealTouchable: {
    // Permite que el TouchableOpacity funcione correctamente
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 32, // Mismo ancho que el botón de cerrar para centrar el título
  },
  recipesList: {
    flex: 1,
  },
  recipesListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  recipeImage: {
    width: 60,
    height: 60,
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
  recipeSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  emptyRecipes: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyRecipesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRecipesSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
