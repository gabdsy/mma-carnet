-- Étape 1 : profils utilisateurs.
-- À exécuter une seule fois dans Supabase > SQL Editor. Ne pas modifier après exécution :
-- tout changement futur va dans une nouvelle migration.

-- Met à jour automatiquement updated_at (réutilisée par toutes les tables).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  natural_stance text not null default 'orthodoxe'
    check (natural_stance in ('orthodoxe', 'southpaw')),
  switch_hitter boolean not null default false,
  weight_class text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS : chacun ne voit et ne modifie que son propre profil.
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Pas de policy insert/delete : le profil est créé par le trigger ci-dessous
-- et supprimé avec le compte (on delete cascade).

-- Crée le profil dès qu'un utilisateur est ajouté dans Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
