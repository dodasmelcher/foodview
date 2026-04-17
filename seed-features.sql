-- ==========================================
-- Novas features: favoritos, follows, reserva, delivery
-- Rode no SQL Editor do Supabase
-- ==========================================

-- Colunas extras em places
alter table public.places add column if not exists has_reservation boolean default false;
alter table public.places add column if not exists reservation_url text default '';
alter table public.places add column if not exists has_delivery boolean default false;

-- Tabela de favoritos
create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  place_id bigint references public.places(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, place_id)
);

-- Tabela de follows
create table if not exists public.follows (
  id bigint generated always as identity primary key,
  follower_id uuid references auth.users(id) on delete cascade,
  following_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);

-- Tabela de perfis públicos
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  created_at timestamptz default now()
);

-- RLS
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.profiles enable row level security;

-- Favorites policies
create policy "read_favorites" on public.favorites for select using (true);
create policy "insert_favorites" on public.favorites for insert with check (auth.uid() = user_id);
create policy "delete_favorites" on public.favorites for delete using (auth.uid() = user_id);

-- Follows policies
create policy "read_follows" on public.follows for select using (true);
create policy "insert_follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "delete_follows" on public.follows for delete using (auth.uid() = follower_id);

-- Profiles policies
create policy "read_profiles" on public.profiles for select using (true);
create policy "insert_profiles" on public.profiles for insert with check (auth.uid() = id);
create policy "update_profiles" on public.profiles for update using (auth.uid() = id);

-- Trigger: criar perfil quando usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger se existir e recriar
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Inserir perfis para usuários existentes
insert into public.profiles (id, name, email)
select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)), email
from auth.users
on conflict (id) do nothing;
