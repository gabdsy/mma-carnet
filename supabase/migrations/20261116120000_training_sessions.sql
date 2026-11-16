-- Étape 3 : séances d'entraînement réalisées (journal).
-- À exécuter une seule fois dans Supabase > SQL Editor. Ne pas modifier après exécution :
-- tout changement futur va dans une nouvelle migration.

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  -- Rempli automatiquement avec l'utilisateur connecté.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null default current_date,
  session_type text not null
    check (session_type in ('mma', 'grappling', 'boxe', 'sparring', 'physique', 'autre')),
  duration_min integer not null check (duration_min between 1 and 600),
  -- Effort perçu 1-10. Facultatif pour garder une saisie rapide.
  rpe integer check (rpe between 1 and 10),
  focus text,
  notes text,
  -- Bilan rapide de fin de séance (facultatif).
  went_well text,
  to_adjust text,
  -- Créneau prévu correspondant. La clé étrangère sera ajoutée avec la table
  -- recurring_sessions (étape « emploi du temps »).
  recurring_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accélère l'affichage du journal (mes séances, les plus récentes d'abord).
create index training_sessions_user_date_idx
  on public.training_sessions (user_id, date desc);

create trigger training_sessions_set_updated_at
  before update on public.training_sessions
  for each row execute function public.set_updated_at();

-- RLS : chacun ne voit, ne crée, ne modifie et ne supprime que ses propres séances.
alter table public.training_sessions enable row level security;

create policy "training_sessions_select_own" on public.training_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "training_sessions_insert_own" on public.training_sessions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "training_sessions_update_own" on public.training_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "training_sessions_delete_own" on public.training_sessions
  for delete to authenticated
  using (user_id = (select auth.uid()));
