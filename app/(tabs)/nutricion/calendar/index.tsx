import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../../src/styles/tokens';

// ===== Locale =====
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';
dayjs.locale('es');

// ===== Tipos de datos =====
type Marked = Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }>;

// Datos de ejemplo para nutrición
interface NutritionDay {
  date: string;
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string[];
  };
  nutrients: {
    proteins: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

// Datos de ejemplo - en una app real esto vendría de una base de datos
const SAMPLE_NUTRITION_DATA: Record<string, NutritionDay> = {
  '2025-01-29': {
    date: '2025-01-29',
    meals: {
      breakfast: 'Tostada de huevo y palta',
      lunch: 'Pollo al curry con arroz',
      dinner: 'Ensalada mediterránea',
      snacks: ['Manzana', 'Nueces']
    },
    nutrients: {
      proteins: 100,
      carbs: 223,
      fats: 65,
      calories: 1850
    }
  },
  '2025-01-30': {
    date: '2025-01-30',
    meals: {
      breakfast: 'Bowl de açaí con frutas',
      lunch: 'Salmón con quinoa',
      dinner: 'Sopa de verduras',
      snacks: ['Yogur griego']
    },
    nutrients: {
      proteins: 95,
      carbs: 180,
      fats: 45,
      calories: 1650
    }
  },
  '2025-01-31': {
    date: '2025-01-31',
    meals: {
      breakfast: 'Avena con plátano',
      lunch: 'Ensalada de atún',
      dinner: 'Pechuga a la plancha',
      snacks: ['Almendras']
    },
    nutrients: {
      proteins: 110,
      carbs: 150,
      fats: 55,
      calories: 1750
    }
  }
};

// ===== Utilidades =====
const fmt = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');
const monthRange = (anchorIso: string) => {
  const start = dayjs(anchorIso).startOf('month');
  const end = dayjs(anchorIso).endOf('month');
  return { startIso: fmt(start), endIso: fmt(end) };
};

export default function NutritionCalendarScreen() {
  const router = useRouter();

  const today = dayjs().format('YYYY-MM-DD');
  const [current, setCurrent] = useState<string>(today);
  const [selected, setSelected] = useState<string>(today);
  const [marked, setMarked] = useState<Marked>({});
  const [selectedDayData, setSelectedDayData] = useState<NutritionDay | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const monthLabel = useMemo(() => dayjs(current).format('MMMM YYYY'), [current]);

  // ====== Carga de datos del mes visible ======
  const loadMonth = useCallback(async () => {
    setLoading(true);
    try {
      
      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Marcar días que tienen datos de nutrición
      const m: Marked = {};
      Object.keys(SAMPLE_NUTRITION_DATA).forEach((iso) => {
        m[iso] = { marked: true, dotColor: '#22C55E' };
      });
      
      // Resaltar día seleccionado si pertenece al mes visible
      if (dayjs(selected).isSame(current, 'month')) {
        m[selected] = { ...(m[selected] || {}), selected: true, selectedColor: '#22C55E' };
      }
      
      setMarked(m);
      
      // Actualizar datos del día seleccionado
      setSelectedDayData(SAMPLE_NUTRITION_DATA[selected] || null);
      
    } catch (e) {
      console.error('Error cargando calendario de nutrición:', e);
    } finally {
      setLoading(false);
    }
  }, [current, selected]);

  // Carga al entrar y cuando cambia mes/selección
  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // Handlers de navegación de mes
  const goPrevMonth = () =>
    setCurrent(dayjs(current).startOf('month').subtract(1, 'month').format('YYYY-MM-DD'));
  const goNextMonth = () =>
    setCurrent(dayjs(current).startOf('month').add(1, 'month').format('YYYY-MM-DD'));

  const handleDayPress = (d: any) => {
    const iso = d.dateString;
    setSelected(iso);
    
    // Actualiza marcado y datos del día seleccionado
    setMarked((prev) => ({
      ...prev,
      [iso]: { ...(prev[iso] || {}), selected: true, selectedColor: '#22C55E' },
    }));
    
    setSelectedDayData(SAMPLE_NUTRITION_DATA[iso] || null);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Overlay para cerrar menú al tocar fuera */}
      {showMenu && (
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
      )}
      
      {/* Header superior */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Plan Nutricional</Text>

        <TouchableOpacity
          onPress={() => setShowMenu(!showMenu)}
          style={styles.circleBtn}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Menú contextual */}
        {showMenu && (
          <View style={styles.menuOverlay}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                router.push('/nutricion/calendar/edit');
              }}
            >
              <Ionicons name="pencil" size={20} color="#333" />
              <Text style={styles.menuText}>Editar plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                console.log('Ver lista de compras');
              }}
            >
              <Ionicons name="clipboard" size={20} color="#333" />
              <Text style={styles.menuText}>Ver lista de compras</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                console.log('Generar lista');
              }}
            >
              <Ionicons name="cart" size={20} color="#333" />
              <Text style={styles.menuText}>Generar lista</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Card con calendario */}
      <View style={styles.card}>
        <View style={styles.monthBar}>
          <TouchableOpacity onPress={goPrevMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.monthText}>{monthLabel}</Text>

          <TouchableOpacity onPress={goNextMonth} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Calendar
          key={current.slice(0, 7)}
          firstDay={1}
          current={current}
          enableSwipeMonths
          hideArrows
          hideExtraDays
          onVisibleMonthsChange={(months) => {
            if (months?.[0]?.dateString) {
              setCurrent(months[0].dateString);
            }
          }}
          onDayPress={handleDayPress}
          renderHeader={() => <View />}
          markedDates={marked}
          theme={{
            calendarBackground: '#111',
            textSectionTitleColor: '#bfbfbf',
            dayTextColor: '#fff',
            todayTextColor: '#22C55E',
            monthTextColor: '#fff',
            textDisabledColor: '#6b6b6b',
            selectedDayBackgroundColor: '#22C55E',
            selectedDayTextColor: '#000',
            textDayFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
        />

        {loading && (
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>

      {/* Panel blanco inferior */}
      <View style={styles.bodyWhite}>
        {/* Resumen de nutrientes - SIEMPRE visible */}
        <View style={styles.nutrientBar}>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>
              {selectedDayData ? `${selectedDayData.nutrients.proteins}g` : '-'}
            </Text>
            <Text style={styles.nutrientLabel}>Proteínas</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>
              {selectedDayData ? `${selectedDayData.nutrients.carbs}g` : '-'}
            </Text>
            <Text style={styles.nutrientLabel}>Carbs</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>
              {selectedDayData ? `${selectedDayData.nutrients.fats}g` : '-'}
            </Text>
            <Text style={styles.nutrientLabel}>Grasas</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientValue}>
              {selectedDayData ? selectedDayData.nutrients.calories : '-'}
            </Text>
            <Text style={styles.nutrientLabel}>Calorías</Text>
          </View>
        </View>

        {/* Menús del día */}
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>
            {dayjs(selected).format('dddd D')} • {selectedDayData ? 'Plan nutricional' : 'Sin plan'}
          </Text>
          {selectedDayData && (
            <Text style={styles.subNote}>
              {Object.keys(selectedDayData.meals).filter(key => selectedDayData.meals[key as keyof typeof selectedDayData.meals]).length} comidas programadas
            </Text>
          )}
        </View>

        {/* Contenido del día */}
        {selectedDayData ? (
          // Con datos: mostrar comidas
          <View style={styles.mealsContainer}>
            {selectedDayData.meals.breakfast && (
              <View style={styles.mealItem}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTime}>Desayuno</Text>
                </View>
                <Text style={styles.mealTitle}>{selectedDayData.meals.breakfast}</Text>
              </View>
            )}
            
            {selectedDayData.meals.lunch && (
              <View style={styles.mealItem}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTime}>Almuerzo</Text>
                </View>
                <Text style={styles.mealTitle}>{selectedDayData.meals.lunch}</Text>
              </View>
            )}
            
            {selectedDayData.meals.dinner && (
              <View style={styles.mealItem}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTime}>Cena</Text>
                </View>
                <Text style={styles.mealTitle}>{selectedDayData.meals.dinner}</Text>
              </View>
            )}
            
            {selectedDayData.meals.snacks && selectedDayData.meals.snacks.length > 0 && (
              <View style={styles.mealItem}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTime}>Snacks</Text>
                </View>
                <Text style={styles.mealTitle}>{selectedDayData.meals.snacks.join(', ')}</Text>
              </View>
            )}
          </View>
        ) : (
          // Sin datos: mostrar mensaje
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nada programado</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },

  topHeader: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  circleBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center',
  },

  card: { backgroundColor: '#111', marginHorizontal: 20, marginTop: 10, padding: 14, borderRadius: 26 },

  monthBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1a1a1a', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
  },
  monthText: { color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  monthArrow: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#262626', alignItems: 'center', justifyContent: 'center',
  },

  calendar: { marginTop: 12, borderRadius: 18, overflow: 'hidden' },

  bodyWhite: {
    flex: 1, backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel, borderTopRightRadius: RADII.panel,
    marginTop: 18, paddingHorizontal: 20, paddingTop: 14,
  },

  nutrientBar: {
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutrientItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutrientValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutrientLabel: {
    color: '#cfcfcf',
    fontSize: 12,
    fontWeight: '500',
  },

  dayPill: {
    backgroundColor: '#1f1f1f', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    alignSelf: 'center', width: '85%', marginBottom: 16,
  },
  dayPillText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
  subNote: { color: '#cfcfcf', fontSize: 12, textAlign: 'center', marginTop: 4 },

  mealsContainer: {
    gap: 12,
  },
  mealItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mealHeader: {
    marginBottom: 8,
  },
  mealTime: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mealTitle: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  
  menuOverlay: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
});
