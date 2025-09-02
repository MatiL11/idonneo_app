import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../src/styles/tokens';
import SavedNutritionScreen from './saved';
import SearchRecipesScreen from './search';
import { useNutritionPlans } from '../../../src/hooks/useNutritionPlans';
import dayjs from 'dayjs';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Meal {
  id: string;
  title: string;
  category: string;
  image: string;
  calories: string;
}

interface DatabaseMeal {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'snack';
  notes: string;
  recipe_id?: string;
  portions_consumed?: number;
  recipes?: {
    id: string;
    title: string;
    image_url?: string;
    cooking_time?: string;
    portions?: number;
    calories_per_100g?: number;
    protein_per_100g?: number;
    carbs_per_100g?: number;
    fat_per_100g?: number;
  };
}

const TODAYS_MENU: Meal[] = [
  {
    id: '1',
    title: 'Tostada de huevo y palta',
    category: 'Desayuno',
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500',
    calories: '320 kcal',
  },
];

const FEATURED_MEALS: Meal[] = [
  {
    id: '2',
    title: 'Pollo al Curry con Arroz',
    category: 'Almuerzo',
    image: 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=500',
    calories: '450 kcal',
  },
  {
    id: '3',
    title: 'Ensalada Mediterránea',
    category: 'Cena',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    calories: '280 kcal',
  },
];

function startOfWeek(d = new Date()) {
  const day = d.getDay(); // 0 dom - 6 sab
  const diff = (day === 0 ? -6 : 1) - day; // mover a lunes
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function NutricionScreen() {
  const router = useRouter();
  const { loadNutritionPlan } = useNutritionPlans();
  const [topTab, setTopTab] = useState<'overview' | 'search' | 'saved'>('overview');
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  const weekItems = useMemo(() => {
    const monday = startOfWeek(new Date());
    return new Array(7).fill(0).map((_, idx) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + idx);
      return dt;
    });
  }, []);

  const todayKey = new Date().toDateString();

  // Cargar comidas del día actual
  useEffect(() => {
    loadTodaysMeals();
  }, []);

  const loadTodaysMeals = async () => {
    try {
      setLoadingMeals(true);
      const today = dayjs().format('YYYY-MM-DD');
      
      const { mealsByDay } = await loadNutritionPlan(today, today);
      
      if (mealsByDay && mealsByDay[today]) {
        const meals = mealsByDay[today];
        const convertedMeals: Meal[] = meals.map((meal: DatabaseMeal) => {
          const mealName = meal.recipes?.title || meal.notes?.replace('Planificado: ', '') || 'Comida sin nombre';
          const mealImage = meal.recipes?.image_url || '🍽️';
          const calories = meal.recipes?.calories_per_100g 
            ? `${Math.round((meal.recipes.calories_per_100g * (meal.portions_consumed || 1)) * 10) / 10} kcal`
            : 'Sin datos';
          
          // Mapear tipos de comida a categorías en español
          const categoryMap = {
            'breakfast': 'Desayuno',
            'lunch': 'Almuerzo',
            'merienda': 'Merienda',
            'dinner': 'Cena',
            'snack': 'Snack'
          };
          
          return {
            id: meal.id,
            title: mealName,
            category: categoryMap[meal.meal_type] || meal.meal_type,
            image: mealImage,
            calories: calories,
          };
        });
        
        setTodaysMeals(convertedMeals);
      } else {
        setTodaysMeals([]);
      }
    } catch (error) {
      console.error('Error al cargar comidas del día:', error);
      setTodaysMeals([]);
    } finally {
      setLoadingMeals(false);
    }
  };

  const goToCalendar = () => {
    console.log('Intentando navegar a calendario de nutrición...');
    try {
      router.push('/nutricion/calendar');
      console.log('Navegación exitosa');
    } catch (error) {
      console.error('Error en navegación:', error);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Mini navbar superior */}
        <View style={styles.topMiniNav}>
          <TouchableOpacity
            style={[styles.navTab, topTab === 'overview' && styles.navTabActive]}
            onPress={() => setTopTab('overview')}
          >
            <Ionicons 
              name="restaurant" 
              size={24} 
              color={topTab === 'overview' ? COLORS.green : COLORS.white} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navTab, topTab === 'search' && styles.navTabActive]}
            onPress={() => setTopTab('search')}
          >
            <Ionicons 
              name="search" 
              size={24} 
              color={topTab === 'search' ? COLORS.green : COLORS.white} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navTab, topTab === 'saved' && styles.navTabActive]}
            onPress={() => setTopTab('saved')}
          >
            <Ionicons 
              name="bookmark" 
              size={24} 
              color={topTab === 'saved' ? COLORS.green : COLORS.white} 
            />
          </TouchableOpacity>
        </View>

        {topTab === 'overview' ? (
          <>
            {/* Bloque negro clickeable */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={goToCalendar}
              style={styles.topPanel}
              accessibilityRole="button"
              accessibilityLabel="Abrir calendario completo"
            >
              <View style={styles.topHeaderRow}>
                <Text style={styles.weekTitle}>ÉSTA SEMANA</Text>
                <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
              </View>

              {/* Calendario semanal */}
              <View style={styles.weeklyStrip}>
                {weekItems.map((dt, idx) => {
                  const isToday = dt.toDateString() === todayKey;
                  return (
                    <View key={idx.toString()} style={styles.dayColumn}>
                      <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                        {DAYS[idx]}
                      </Text>
                      <View style={[styles.datePill, isToday && styles.datePillActive]}>
                        <Text style={[styles.dateText, isToday && styles.dateTextActive]}>
                          {dt.getDate()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Menú de hoy */}
              <View style={styles.todayCard}>
                <Text style={styles.todayLabel}>Menú de hoy</Text>
                {loadingMeals ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando comidas...</Text>
                  </View>
                ) : todaysMeals.length > 0 ? (
                  todaysMeals.map((meal, index) => (
                    <View key={meal.id} style={[styles.mealCard, index > 0 && styles.mealCardSpacing]}>
                      {meal.image.startsWith('http') ? (
                        <Image source={{ uri: meal.image }} style={styles.mealImage} />
                      ) : (
                        <View style={[styles.mealImage, styles.mealImagePlaceholder]}>
                          <Text style={styles.mealImageEmoji}>{meal.image}</Text>
                        </View>
                      )}
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealTitle}>{meal.title}</Text>
                        <View style={styles.mealCategory}>
                          <Text style={styles.mealCategoryText}>{meal.category}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyMealsContainer}>
                    <Text style={styles.emptyMealsText}>No hay comidas programadas para hoy</Text>
                    <Text style={styles.emptyMealsSubtext}>Toca para planificar tu día</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Panel blanco */}
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Destacados</Text>
              <FlatList
                data={FEATURED_MEALS}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <TouchableOpacity activeOpacity={0.85} style={styles.mealCardLarge}>
                    <Image source={{ uri: item.image }} style={styles.mealImageLarge} />
                    <View style={styles.mealInfoLarge}>
                      <Text style={styles.mealTitleLarge}>{item.title}</Text>
                      <View style={styles.mealDetails}>
                        <View style={styles.mealCategoryLarge}>
                          <Text style={styles.mealCategoryTextLarge}>{item.category}</Text>
                        </View>
                        <Text style={styles.mealCalories}>{item.calories}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </>
                 ) : topTab === 'search' ? (
           // Vista de búsqueda
           <View style={styles.panel}>
             <SearchRecipesScreen />
           </View>
         ) : (
           // Vista de guardados - mostrar el componente SavedNutritionScreen
           <View style={styles.panel}>
             <SavedNutritionScreen />
           </View>
         )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: COLORS.black 
  },
  safeTop: { 
    flex: 1, 
    backgroundColor: COLORS.black 
  },

  topMiniNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  navTab: {
    padding: 8,
    borderRadius: 8,
  },
  navTabActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },

  topPanel: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
    borderBottomLeftRadius: RADII.panel,
    borderBottomRightRadius: RADII.panel,
  },

  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  weekTitle: { 
    color: COLORS.white, 
    fontWeight: '700', 
    letterSpacing: 0.2,
    fontSize: 16,
  },

  weeklyStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  dayColumn: { 
    alignItems: 'center', 
    width: `${100 / 7}%` 
  },
  dayLabel: { 
    color: '#bdbdbd', 
    fontSize: 12, 
    marginBottom: 4 
  },
  dayLabelActive: { 
    color: COLORS.white 
  },
  datePill: {
    width: 30, 
    height: 30, 
    borderRadius: 15,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  datePillActive: { 
    backgroundColor: COLORS.green 
  },
  dateText: { 
    color: '#bdbdbd', 
    fontWeight: '700' 
  },
  dateTextActive: { 
    color: COLORS.white 
  },

  todayCard: { 
    marginTop: 10 
  },
  todayLabel: { 
    color: COLORS.white, 
    fontWeight: '600', 
    marginBottom: 6 
  },
  mealCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealCardSpacing: {
    marginTop: 8,
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  mealCategory: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  mealCategoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },

  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.7,
  },
  mealImagePlaceholder: {
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealImageEmoji: {
    fontSize: 24,
  },
  emptyMealsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMealsText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyMealsSubtext: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.7,
  },

  panel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    paddingTop: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.black, 
    marginBottom: 12 
  },
  
  mealCardLarge: {
    backgroundColor: COLORS.white,
    borderRadius: RADII.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  mealImageLarge: {
    width: '100%',
    height: 120,
  },
  mealInfoLarge: {
    padding: 12,
  },
  mealTitleLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  mealDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCategoryLarge: {
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mealCategoryTextLarge: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '600',
  },
  mealCalories: {
    color: COLORS.gray700,
    fontSize: 14,
    fontWeight: '500',
  },
  
     comingSoon: {
     color: COLORS.gray700,
     fontSize: 16,
     textAlign: 'center',
     marginTop: 40,
   },

   
 });
