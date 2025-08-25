import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Alert } from 'react-native';
import { useTrainingPlan, TrainingPlanDay } from '../../src/hooks/useTrainingPlan';

export type PlanItem = { routineId: string; title: string; subtitle: string };
export type PlanMap = Record<string, PlanItem | undefined>;

const mondayStart = (d: dayjs.Dayjs) => {
  const shift = (d.day() + 6) % 7;
  return d.subtract(shift, 'day').startOf('day');
};

const shallowEqualPlan = (a: PlanMap, b: PlanMap) => {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const ia = a[k];
    const ib = b[k];
    if (!ia && !ib) continue;
    if (!ia || !ib) return false;
    if (ia.routineId !== ib.routineId || ia.title !== ib.title || ia.subtitle !== ib.subtitle) {
      return false;
    }
  }
  return true;
};

export function useWeekPlan(userId: string | undefined, anchor: dayjs.Dayjs) {
  const tp = useTrainingPlan(userId as string);

  // ⬇️ mantener una referencia estable al objeto `tp`
  const tpRef = useRef(tp);
  useEffect(() => {
    tpRef.current = tp;
  }, [tp]);

  const [plan, setPlan] = useState<PlanMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const initialPlanRef = useRef<PlanMap>({});
  const hydratingRef = useRef(false);
  const weekStart = useMemo(() => mondayStart(anchor), [anchor]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    hydratingRef.current = true;

    try {
      const isoMonday = weekStart.format('YYYY-MM-DD');
      // ⬇️ usar la ref estable, no el objeto `tp` de la clausura
      const existingPlan = await tpRef.current.loadCurrentPlan(isoMonday);

      if (existingPlan?.days?.length) {
        const planMap: PlanMap = {};
        existingPlan.days.forEach((day: TrainingPlanDay) => {
          if (day?.date && day?.routine_id) {
            planMap[day.date] = {
              routineId: day.routine_id,
              title: day.title || '',
              subtitle: day.description || '',
            };
          }
        });
        setPlan(planMap);
        initialPlanRef.current = planMap;
      } else {
        setPlan({});
        initialPlanRef.current = {};
      }
      setHasUnsaved(false);
    } catch (err) {
      console.error('Error loading plan:', err);
      Alert.alert('Error', 'No se pudo cargar el plan de entrenamiento');
      setPlan({});
      initialPlanRef.current = {};
      setHasUnsaved(false);
    } finally {
      hydratingRef.current = false;
      setLoading(false);
    }
  // ❗️no dependas de `tp` aquí
  }, [userId, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (hydratingRef.current) return;
    setHasUnsaved(!shallowEqualPlan(plan, initialPlanRef.current));
  }, [plan]);

  const save = useCallback(async () => {
    if (!userId) {
      Alert.alert('Sin usuario', 'Debes iniciar sesión');
      return;
    }
    try {
      setSaving(true);

      const isoMonday = weekStart.format('YYYY-MM-DD');
      const isoSunday = weekStart.add(6, 'day').format('YYYY-MM-DD');

      const days: TrainingPlanDay[] = Object.entries(plan)
        .map(([date, item]) =>
          item
            ? { date, routine_id: item.routineId, title: item.title, description: item.subtitle }
            : null
        )
        .filter(Boolean) as TrainingPlanDay[];

      const saved = await tpRef.current.savePlan({
        id: tpRef.current.currentPlan?.id,
        start_date: isoMonday,
        end_date: isoSunday,
        days,
      });

      initialPlanRef.current = plan;
      setHasUnsaved(false);

      Alert.alert('Plan guardado', 'Tu plan de entrenamiento ha sido guardado correctamente');
      console.log('Plan guardado:', saved);
    } catch (e: any) {
      console.error('Error al guardar el plan:', e);
      Alert.alert('Error', e?.message || 'No se pudo guardar el plan');
    } finally {
      setSaving(false);
    }
  }, [plan, userId, weekStart]);

  return { plan, setPlan, weekStart, loading, saving, hasUnsaved, reload: load, save };
}
