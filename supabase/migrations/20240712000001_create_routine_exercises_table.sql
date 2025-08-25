-- Script para crear la tabla de relación entre rutinas y ejercicios
create table routine_exercises (
    id uuid default gen_random_uuid() not null primary key,
    routine_id uuid references routines not null,
    exercise_id uuid references exercises not null,
    order_position integer not null,  -- Para determinar el orden de los ejercicios en la rutina
    sets integer default 3,           -- Número de series
    reps integer default 10,          -- Número de repeticiones
    rest_time integer default 60,     -- Tiempo de descanso en segundos
    notes text,                       -- Notas adicionales para este ejercicio en esta rutina
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Asegura que un ejercicio no aparezca duplicado en la misma rutina
    unique (routine_id, exercise_id)
);

-- Establecer políticas RLS para seguridad
alter table routine_exercises enable row level security;

-- Políticas de RLS para routine_exercises basadas en el propietario de la rutina
create policy "Los usuarios pueden ver ejercicios de sus propias rutinas"
  on routine_exercises for select
  using (
    exists (
      select 1
      from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden insertar ejercicios en sus propias rutinas"
  on routine_exercises for insert
  with check (
    exists (
      select 1
      from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden actualizar ejercicios en sus propias rutinas"
  on routine_exercises for update
  using (
    exists (
      select 1
      from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

create policy "Los usuarios pueden eliminar ejercicios de sus propias rutinas"
  on routine_exercises for delete
  using (
    exists (
      select 1
      from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

-- Activar la función de actualización automática del campo updated_at
create trigger handle_updated_at before update on routine_exercises
  for each row execute procedure moddatetime (updated_at);

-- Crear índices para mejorar el rendimiento
create index routine_exercises_routine_id_idx on routine_exercises (routine_id);
create index routine_exercises_exercise_id_idx on routine_exercises (exercise_id);
create index routine_exercises_order_idx on routine_exercises (routine_id, order_position);
