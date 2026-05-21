-- ==========================================
-- FoodView — Canonical schema + RLS
-- ==========================================
-- Source of truth for the database, reconstructed from the application code
-- (the older db/supabase-setup.sql is incomplete: it predates `category`,
-- `profiles`, `favorites`, `follows`, coordinates and the Google-match fields).
--
-- Written to be safe to run against the LIVE database to reconcile drift:
--   • tables/columns use IF NOT EXISTS (never drops data)
--   • policies use DROP POLICY IF EXISTS + CREATE (idempotent)
--
-- ⚠️ Before running on production, review the RLS section against the policies
-- currently in the Supabase dashboard. The policies below are the *intended,
-- secure* set — applying them will REPLACE whatever exists with these names.
--
-- Admin is identified by email; keep it in sync with ADMIN_EMAIL in js/data.js.

-- ===== Tables =================================================================

create table if not exists public.places (
  id              bigint generated always as identity primary key,
  type            text not null check (type in ('restaurante', 'bar')),
  name            text not null,
  category        text,
  address         text default '',
  image_url       text default '',
  photos          jsonb default '[]'::jsonb,
  badge           text default '',
  has_reservation boolean default false,
  reservation_url text,
  delivery_apps   text,
  website         text,
  phone           text,
  hours           jsonb,
  lat             double precision,
  lng             double precision,
  fsq_id          text,
  user_id         uuid references auth.users(id) on delete set null,
  created_at      timestamptz default now()
);

-- Columns added after the original setup — no-ops if already present.
alter table public.places add column if not exists category        text;
alter table public.places add column if not exists has_reservation boolean default false;
alter table public.places add column if not exists reservation_url text;
alter table public.places add column if not exists delivery_apps   text;
alter table public.places add column if not exists website         text;
alter table public.places add column if not exists phone           text;
alter table public.places add column if not exists hours           jsonb;  -- Google regularOpeningHours
alter table public.places add column if not exists lat             double precision;
alter table public.places add column if not exists lng             double precision;
alter table public.places add column if not exists fsq_id          text;

create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  place_id    bigint references public.places(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  text        text default '',
  images      jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  avatar_url text,
  bio        text,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  place_id   bigint not null references public.places(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, place_id)
);

create table if not exists public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.review_likes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  review_id  bigint not null references public.reviews(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, review_id)
);

-- ===== Row Level Security =====================================================

alter table public.places       enable row level security;
alter table public.reviews      enable row level security;
alter table public.profiles     enable row level security;
alter table public.favorites    enable row level security;
alter table public.follows      enable row level security;
alter table public.review_likes enable row level security;

-- places: world-readable; logged-in users create; owner or admin edits/deletes.
drop policy if exists read_places   on public.places;
drop policy if exists insert_places on public.places;
drop policy if exists update_places on public.places;
drop policy if exists delete_places on public.places;
create policy read_places   on public.places for select using (true);
create policy insert_places on public.places for insert with check (auth.email() = 'diogo.melcher@gmail.com');
create policy update_places on public.places for update
  using (auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com');
create policy delete_places on public.places for delete
  using (auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com');

-- reviews: world-readable; author must be the logged-in user; owner/admin edit+delete.
drop policy if exists read_reviews   on public.reviews;
drop policy if exists insert_reviews on public.reviews;
drop policy if exists update_reviews on public.reviews;
drop policy if exists delete_reviews on public.reviews;
create policy read_reviews   on public.reviews for select using (true);
create policy insert_reviews on public.reviews for insert with check (auth.uid() = user_id);
create policy update_reviews on public.reviews for update
  using (auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com');
create policy delete_reviews on public.reviews for delete
  using (auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com');

-- profiles: world-readable (names/avatars shown everywhere); each user may only
-- create and edit THEIR OWN row. Without the WITH CHECK on update, any logged-in
-- user could overwrite someone else's profile.
drop policy if exists read_profiles   on public.profiles;
drop policy if exists insert_profile  on public.profiles;
drop policy if exists update_profile  on public.profiles;
create policy read_profiles  on public.profiles for select using (true);
create policy insert_profile on public.profiles for insert with check (auth.uid() = id);
create policy update_profile on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- favorites: counts are public (getFavCount sums everyone), so reads are open;
-- a user may only add/remove their OWN favorites.
drop policy if exists read_favorites   on public.favorites;
drop policy if exists insert_favorite  on public.favorites;
drop policy if exists delete_favorite  on public.favorites;
create policy read_favorites  on public.favorites for select using (true);
create policy insert_favorite on public.favorites for insert with check (auth.uid() = user_id);
create policy delete_favorite on public.favorites for delete using (auth.uid() = user_id);

-- follows: follower/following counts are public, so reads are open; a user may
-- only create/remove follow edges where THEY are the follower.
drop policy if exists read_follows   on public.follows;
drop policy if exists insert_follow  on public.follows;
drop policy if exists delete_follow  on public.follows;
create policy read_follows  on public.follows for select using (true);
create policy insert_follow on public.follows for insert with check (auth.uid() = follower_id);
create policy delete_follow on public.follows for delete using (auth.uid() = follower_id);

-- review_likes: counts are public; a user may only add/remove their own likes.
drop policy if exists read_review_likes  on public.review_likes;
drop policy if exists insert_review_like on public.review_likes;
drop policy if exists delete_review_like on public.review_likes;
create policy read_review_likes  on public.review_likes for select using (true);
create policy insert_review_like on public.review_likes for insert with check (auth.uid() = user_id);
create policy delete_review_like on public.review_likes for delete using (auth.uid() = user_id);

-- ===== Storage ================================================================
-- Public photos bucket; logged-in users upload; owner (by folder = uid) or
-- admin deletes. Imported photos live under imported/… and are admin-managed.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view photos"        on storage.objects;
drop policy if exists "Auth users can upload photos"  on storage.objects;
drop policy if exists "Owner or admin can delete photos" on storage.objects;
create policy "Anyone can view photos" on storage.objects
  for select using (bucket_id = 'photos');
create policy "Auth users can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid() is not null);
create policy "Owner or admin can delete photos" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and (auth.uid()::text = (storage.foldername(name))[1]
         or auth.email() = 'diogo.melcher@gmail.com')
  );
