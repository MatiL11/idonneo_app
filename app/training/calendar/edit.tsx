import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useRouter } from 'expo-router';
import { COLORS, RADII } from '../../../src/styles/tokens';
import { useRoutines, Routine } from '../../../src/hooks/useRoutines';
import { useTrainingPlan, TrainingPlanDay } from '../../../src/hooks/useTrainingPlan';
import { useAuthStore } from '../../../src/lib/store';
import SelectRoutineModal from '../../../src/components/training/SelectRoutineModal';
import CalendarRoutineMenu from '../../../src/components/training/CalendarRoutineMenu';

dayjs.locale('es');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PlanItem = { 
  routineId: string; 
  title: string; 
  subtitle: string;
};
type PlanMap = Record<string, PlanItem | undefined>;

const WD3 = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

function mondayStart(d: dayjs.Dayjs) {
  const shift = (d.day() + 6) % 7;
  return d.subtract(shift, 'day').startOf('day');
}

export default function EditWeekTemplateScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  
  const [anchor, setAnchor] = useState(dayjs());
  const weekStart = useMemo(() => mondayStart(anchor), [anchor]);

  const [plan, setPlan] = useState<PlanMap>({});
  const [expandedIso, setExpandedIso] = useState<string | null>(null);
  
  // Estado para los modales
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<{
    iso: string;
    title: string;
  } | null>(null);
  
  // Hook para obtener rutinas
  const rt = useRoutines(userId as string);
  const routines = useMemo(() => rt?.list || [], [rt?.list]);
  const isLoadingRoutines = rt?.loading;
  
  // Hook para el plan de entrenamiento
  const tp = useTrainingPlan(userId as string);
  const [isSaving, setIsSaving] = useState(false);
  
  // Cargar el plan existente para esta semana cuando cambia la semana
  // Estado para saber si el plan actual tiene cambios sin guardar
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cargar plan al cambiar de semana
  useEffect(() => {
    if (!userId) return;
    
    // Use a flag to prevent race conditions
    let isCurrent = true;
    
    const loadPlan = async () => {
      try {
        setHasUnsavedChanges(false);
        
        // Get the Monday date as string - make sure we don't use a mutable reference
        const isoMonday = mondayStart(anchor).format('YYYY-MM-DD');
        
        // Load the plan
        const existingPlan = await tp.loadCurrentPlan(isoMonday);
        
        // Check if this effect is still relevant
        if (!isCurrent) return;
        
        // Process plan if it exists and has days
        if (existingPlan && existingPlan.days && existingPlan.days.length > 0) {
          // Convert days to plan map format
          const planMap: PlanMap = {};
          existingPlan.days.forEach((day: TrainingPlanDay) => {
            if (day && day.date && day.routine_id) {
              planMap[day.date] = {
                routineId: day.routine_id,
                title: day.title || '',
                subtitle: day.description || '',
              };
            }
          });
          
          // Set the plan state
          setPlan(planMap);
        } else {
          // No plan for this week, set empty plan
          setPlan({});
        }
      } catch (error) {
        // Only show alert if this effect is still relevant
        if (isCurrent) {
          console.error('Error loading plan:', error);
          Alert.alert('Error', 'No se pudo cargar el plan de entrenamiento');
          setPlan({});
        }
      }
    };
    
    loadPlan();
    
    // Cleanup function to prevent state updates if the component unmounts
    return () => {
      isCurrent = false;
    };
  }, [anchor, userId]);
  
  // Detectar cambios en el plan
  useEffect(() => {
    // Solo marcamos cambios si ya hemos cargado datos
    if (tp.currentPlan) {
      setHasUnsavedChanges(true);
    }
  }, [plan]);

  const days = useMemo(() => {
    // Important: Create static dates instead of adding to the original weekStart
    // This prevents mutations that cause re-renders
    const startOfWeek = mondayStart(anchor); // Use a fresh copy
    
    return Array.from({ length: 7 }).map((_, i) => {
      // Using add() on a new date instance for each day
      const d = startOfWeek.clone().add(i, 'day');
      const iso = d.format('YYYY-MM-DD');
      const isToday = d.isSame(dayjs(), 'day');
      
      // Check if we have a routine for this day
      const dayRoutine = plan[iso];
      
      return {
        iso,
        isToday,
        wdIndex: i,
        label: `${WD3[i]}${d.format('DD')}`,
        date: d,
        routine: dayRoutine,
      };
    });
  }, [anchor, plan]);

  const rangeLabel = useMemo(() => {
    // Clone the start date to prevent mutations
    const start = mondayStart(anchor);
    const end = start.clone().add(6, 'day');
    return `${start.format('DD MMM YYYY')} - ${end.format('DD MMM YYYY')}`;
  }, [anchor]);

  const confirmNavigationIfChanged = (callback: () => void) => {
    // Verificar si hay cambios sin guardar
    if (hasUnsavedChanges) {
      Alert.alert(
        "Cambios sin guardar",
        "Tienes cambios en este plan que no has guardado. ¿Quieres guardarlos antes de continuar?",
        [
          {
            text: "Descartar",
            style: "destructive",
            onPress: callback
          },
          {
            text: "Guardar",
            style: "default",
            onPress: async () => {
              await handleSavePlan();
              callback();
            }
          },
          {
            text: "Cancelar",
            style: "cancel"
          }
        ]
      );
    } else {
      callback();
    }
  };

  const goPrevWeek = () => {
    confirmNavigationIfChanged(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Use the clone method to create a new instance and avoid mutation
      setAnchor((a) => a.clone().subtract(1, 'week'));
      setExpandedIso(null);
    });
  };
  
  const goNextWeek = () => {
    confirmNavigationIfChanged(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // Use the clone method to create a new instance and avoid mutation
      setAnchor((a) => a.clone().add(1, 'week'));
      setExpandedIso(null);
    });
  };

  const toggleExpand = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIso((curr) => (curr === iso ? null : iso));
  };

  const openRoutineSelector = (iso: string) => {
    setSelectedDate(iso);
    setShowRoutineSelector(true);
  };
  
  const handleSelectRoutine = (routine: Routine) => {
    if (!selectedDate) return;
    
    // Store the date to use after the modal closes
    const dateToUpdate = selectedDate;
    
    // First close the modal
    setShowRoutineSelector(false);
    
    // Prepare the new plan item
    const newPlanItem = { 
      routineId: routine.id, 
      title: routine.title, 
      subtitle: routine.description || 'Sin descripción'
    };
    
    // Update the plan with the new routine
    setPlan((currentPlan) => {
      return {
        ...currentPlan,
        [dateToUpdate]: newPlanItem
      };
    });
    
    // Set the expanded day
    setExpandedIso(dateToUpdate);
    
    // Apply animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const removeRoutine = (iso: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlan((p) => {
      const copy = { ...p };
      delete copy[iso];
      return copy;
    });
  };
  
  const openRoutineMenu = (iso: string, title: string) => {
    setSelectedRoutine({ iso, title });
    setShowRoutineMenu(true);
  };
  
  const handleSavePlan = async () => {
    if (!userId || Object.keys(plan).length === 0) {
      Alert.alert('Sin cambios', 'No hay rutinas asignadas para guardar');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const isoMonday = weekStart.format('YYYY-MM-DD');
      const isoSunday = weekStart.add(6, 'day').format('YYYY-MM-DD');
      
      // Convertir el plan a formato de días
      const planDays: TrainingPlanDay[] = Object.entries(plan).map(([date, item]) => {
        if (!item) return null;
        
        return {
          date,
          routine_id: item.routineId,
          title: item.title,
          description: item.subtitle
        };
      }).filter(Boolean) as TrainingPlanDay[];
      
      // Guardar el plan
      const savedPlan = await tp.savePlan({
        id: tp.currentPlan?.id, // Mantener el ID si estamos actualizando
        start_date: isoMonday,
        end_date: isoSunday,
        days: planDays
      });
      
      // Marcar como guardado
      setHasUnsavedChanges(false);
      
      Alert.alert('Plan guardado', 'Tu plan de entrenamiento ha sido guardado correctamente');
      console.log('Plan guardado:', savedPlan);
      
    } catch (error: any) {
      console.error('Error al guardar el plan:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el plan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header negro */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar plan</Text>
        <TouchableOpacity 
          style={[
            styles.savePill, 
            hasUnsavedChanges && { backgroundColor: '#ffc107' }
          ]} 
          onPress={handleSavePlan}
          disabled={isSaving}
        >
          {isSaving ? (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Text style={styles.savePillText}>Guardando</Text>
            </View>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Ionicons 
                name={hasUnsavedChanges ? "alert" : "checkmark"} 
                size={16} 
                color="#0A0A0A" 
              />
              <Text style={styles.savePillText}>
                {hasUnsavedChanges ? "Guardar cambios" : "Guardar"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Panel blanco */}
      <View style={styles.panel}>
        {/* Selector de semana */}
        <View style={styles.weekBar}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goPrevWeek}>
            <Ionicons name="chevron-back" size={18} color={COLORS.black} />
          </TouchableOpacity>

          <Text style={styles.weekText}>{rangeLabel}</Text>

          <TouchableOpacity style={styles.arrowBtn} onPress={goNextWeek}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {/* Lista de 7 días */}
        <FlatList
          data={days}
          keyExtractor={(d) => d.iso}
          extraData={Object.keys(plan).length} // Use the plan length as the trigger for re-render
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const isOpen = expandedIso === item.iso;
            return (
              <View style={styles.itemWrap}>
                <View style={[styles.dayRow, isOpen && styles.dayRowOpen]}>
                  <TouchableOpacity
                    style={styles.rowTapZone}
                    activeOpacity={0.7}
                    onPress={() => toggleExpand(item.iso)}
                  >
                    <Text style={[styles.dayCode, item.isToday && styles.dayCodeToday]}>
                      {item.label}
                    </Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#7a7a7a"
                    />
                  </TouchableOpacity>

                  {!plan[item.iso] && (
                    <TouchableOpacity 
                      style={styles.addBtn} 
                      activeOpacity={0.7}
                      onPress={() => openRoutineSelector(item.iso)}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>

                {isOpen && (
                  <View style={styles.detailArea}>
                    {plan[item.iso] ? (
                      <View style={styles.routineCard}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.routineTitle}>{plan[item.iso]?.title}</Text>
                          <Text style={styles.routineSubtitle}>{plan[item.iso]?.subtitle}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => plan[item.iso] && openRoutineMenu(item.iso, plan[item.iso]?.title || '')}
                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        >
                          <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.emptyPill}>
                        <Text style={styles.emptyPillText}>Nada programado</Text>
                        <TouchableOpacity 
                          style={{
                            marginTop: 8, 
                            backgroundColor: '#16A34A', 
                            paddingVertical: 6, 
                            paddingHorizontal: 10, 
                            borderRadius: 4
                          }} 
                          onPress={() => openRoutineSelector(item.iso)}
                        >
                          <Text style={{color: '#fff', fontSize: 12}}>Agregar rutina</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
      
      {/* Modal de selección de rutina */}
      <SelectRoutineModal
        visible={showRoutineSelector}
        onClose={() => setShowRoutineSelector(false)}
        onSelect={handleSelectRoutine}
        routines={routines}
        loading={isLoadingRoutines}
        dayLabel={selectedDate ? 
          days.find(d => d.iso === selectedDate)?.label || 'día seleccionado' 
          : ''}
      />
      
      {/* Menú de opciones para rutina en calendario */}
      {selectedRoutine && (
        <CalendarRoutineMenu
          visible={showRoutineMenu}
          onClose={() => setShowRoutineMenu(false)}
          onRemove={() => removeRoutine(selectedRoutine.iso)}
          routineName={selectedRoutine.title}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },

  topHeader: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1e1e1e',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
  },
  savePillText: { color: '#0A0A0A', fontWeight: '700' },

  panel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    padding: 16,
  },

  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 14,
  },
  arrowBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8E8E8',
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: COLORS.black,
  },

  itemWrap: {},
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dayRowOpen: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  rowTapZone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayCode: { fontWeight: '800', color: '#111' },
  dayCodeToday: { color: '#16A34A' },

  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },

  detailArea: { paddingHorizontal: 10, paddingTop: 10 },

  routineCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineTitle: { color: '#fff', fontWeight: '700', marginBottom: 2 },
  routineSubtitle: { color: '#bdbdbd', fontSize: 12 },

  emptyPill: {
    backgroundColor: '#EFEFEF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  emptyPillText: { color: '#333', fontWeight: '600' },
});
