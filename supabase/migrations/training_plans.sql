-- Tabla de planes de entrenamiento
create table if not exists public.training_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de días de planes de entrenamiento
create table if not exists public.training_plan_days (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references public.training_plans(id) on delete cascade,
  date date not null,
  routine_id uuid references public.routines(id) on delete cascade,
  title text,
  description text,
  created_at timestamptz default now()
);

-- Índices
create index if not exists idx_training_plans_user on public.training_plans(user_id);
create index if not exists idx_training_plans_date_range on public.training_plans(start_date, end_date);
create index if not exists idx_training_plan_days_plan on public.training_plan_days(plan_id);
create index if not exists idx_training_plan_days_date on public.training_plan_days(date);

-- Políticas de seguridad para training_plans
alter table public.training_plans enable row level security;

create policy "Users can create their own training plans"
  on public.training_plans for insert
  with check (auth.uid() = user_id);
  
create policy "Users can view their own training plans"
  on public.training_plans for select
  using (auth.uid() = user_id);
  
create policy "Users can update their own training plans"
  on public.training_plans for update
  using (auth.uid() = user_id);
  
create policy "Users can delete their own training plans"
  on public.training_plans for delete
  using (auth.uid() = user_id);

-- Políticas de seguridad para training_plan_days
alter table public.training_plan_days enable row level security;

create policy "Users can create days for their own plans"
  on public.training_plan_days for insert
  with check (exists (
    select 1
    from public.training_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
  
create policy "Users can view days for their own plans"
  on public.training_plan_days for select
  using (exists (
    select 1
    from public.training_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
  
create policy "Users can update days for their own plans"
  on public.training_plan_days for update
  using (exists (
    select 1
    from public.training_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
  
create policy "Users can delete days for their own plans"
  on public.training_plan_days for delete
  using (exists (
    select 1
    from public.training_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  ));
