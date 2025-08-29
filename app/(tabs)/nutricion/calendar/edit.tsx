import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

dayjs.locale('es');

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'snack';
  image: string;
}
interface DayPlan {
  date: string;
  meals: Meal[];
}

export default function EditNutritionPlanScreen() {
  const router = useRouter();
  const [anchor, setAnchor] = useState(dayjs());
  const [showMealMenu, setShowMealMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    setAnchor((p) => p.subtract(1, 'week'));
    // Simular tiempo de carga
    setTimeout(() => setLoading(false), 300);
  };
  const goNextWeek = () => {
    setLoading(true);
    setAnchor((p) => p.add(1, 'week'));
    // Simular tiempo de carga
    setTimeout(() => setLoading(false), 300);
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
        return prev.map((d) => d.date === date ? { ...d, meals: [...d.meals, newMeal] } : d);
      } else {
        return [...prev, { date, meals: [newMeal] }];
      }
    });
    setShowMealMenu(null);
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Desayuno', icon: 'sunny' },
    { key: 'lunch', label: 'Almuerzo', icon: 'restaurant' },
    { key: 'merienda', label: 'Merienda', icon: 'cafe' },
    { key: 'dinner', label: 'Cena', icon: 'moon' },
    { key: 'snack', label: 'Snack', icon: 'nutrition' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header superior usando componente compartido */}
      <HeaderBar
        title="Editar Plan"
        onBack={() => router.back()}
        rightButton={{
          icon: 'checkmark',
          text: 'Guardar',
          onPress: () => console.log('Guardar plan'),
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
                        <MealItem
                          key={meal.id}
                          name={meal.name}
                          type={mealTypes.find((t) => t.key === meal.type)?.label || ''}
                          image={meal.image}
                        />
                      ))}
                    </View>
                  )}

                  {/* Menú de tipos de comida usando componente compartido */}
                  <MealTypeMenu
                    mealTypes={mealTypes}
                    onSelectMealType={(mealType) => addMeal(key, mealType)}
                    visible={showMealMenu === key}
                  />
                </DayCard>
              );
            })
          )}
        </ScrollView>
      </WhiteSheet>
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
});
