-- Script para crear la tabla de rutinas
create table routines (
    id uuid default auth.uid() not null primary key,
    user_id uuid references auth.users not null,
    name text not null,
    description text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Establecer políticas RLS para seguridad
alter table routines enable row level security;

-- Política para que un usuario solo pueda ver sus propias rutinas
create policy "Los usuarios pueden ver sus propias rutinas"
  on routines for select
  using (auth.uid() = user_id);

-- Política para que un usuario solo pueda insertar rutinas para sí mismo
create policy "Los usuarios pueden insertar sus propias rutinas"
  on routines for insert
  with check (auth.uid() = user_id);

-- Política para que un usuario solo pueda actualizar sus propias rutinas
create policy "Los usuarios pueden actualizar sus propias rutinas"
  on routines for update
  using (auth.uid() = user_id);

-- Política para que un usuario solo pueda eliminar sus propias rutinas
create policy "Los usuarios pueden eliminar sus propias rutinas"
  on routines for delete
  using (auth.uid() = user_id);

-- Activar la función de actualización automática del campo updated_at
create trigger handle_updated_at before update on routines
  for each row execute procedure moddatetime (updated_at);

-- Crear índices para mejorar el rendimiento
create index routines_user_id_idx on routines (user_id);
create index routines_created_at_idx on routines (created_at desc);
