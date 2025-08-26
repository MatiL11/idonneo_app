export type RoutineExerciseRow = {
  routine_id: string;
  exercise_id: string; // Cambiado a string para UUID
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
  exercises?: { name?: string; image_url?: string | null } | null;
};

export type RoutineDetail = { id: string; title: string };

export type BlockType = 'single' | 'superset';

export type BlockExercise = {
  exercise_id: string; // Cambiado a string para UUID
  name: string;
  image_url?: string | null;
  reps: number;
  sets: number;
};

export type Block = {
  id: string;
  type: BlockType;
  sets: number;
  rest_seconds: number;
  order_index: number;
  exercises: BlockExercise[];
};
