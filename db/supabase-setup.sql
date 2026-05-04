-- ==========================================
-- FoodView - Supabase Setup
-- Cole tudo isso no SQL Editor do Supabase
-- ==========================================

-- Tabela de places
create table public.places (
  id bigint generated always as identity primary key,
  type text not null check (type in ('restaurante', 'bar')),
  name text not null,
  cuisine text default '',
  address text default '',
  image_url text default '',
  photos jsonb default '[]'::jsonb,
  badge text default '',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Tabela de reviews
create table public.reviews (
  id bigint generated always as identity primary key,
  place_id bigint references public.places(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text default '',
  images jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.places enable row level security;
alter table public.reviews enable row level security;

-- Qualquer pessoa pode ler
create policy "read_places" on public.places for select using (true);
create policy "read_reviews" on public.reviews for select using (true);

-- Usuários logados podem inserir
create policy "insert_places" on public.places for insert with check (auth.uid() is not null);
create policy "insert_reviews" on public.reviews for insert with check (auth.uid() is not null);

-- Dono ou admin pode atualizar/deletar
create policy "update_places" on public.places for update using (
  auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com'
);
create policy "delete_places" on public.places for delete using (
  auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com'
);
create policy "update_reviews" on public.reviews for update using (
  auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com'
);
create policy "delete_reviews" on public.reviews for delete using (
  auth.uid() = user_id or auth.email() = 'diogo.melcher@gmail.com'
);

-- Seed: restaurantes Michelin SP
insert into public.places (type, name, cuisine, address, badge) values
('restaurante', 'Tuju', 'Brasileira', 'R. Fradique Coutinho, 1248 — Pinheiros', '★★★ Michelin'),
('restaurante', 'Evvai', 'Italiana', 'R. Joaquim Antunes, 108 — Pinheiros', '★★★ Michelin'),
('restaurante', 'D.O.M.', 'Brasileira', 'R. Barão de Capanema, 549 — Jardins', '★★ Michelin'),
('restaurante', 'Maní', 'Brasileira', 'R. Joaquim Antunes, 210 — Pinheiros', '★ Michelin'),
('restaurante', 'Jun Sakamoto', 'Japonesa / Omakase', 'R. Lisboa, 55 — Pinheiros', '★ Michelin'),
('restaurante', 'Kinoshita', 'Japonesa', 'R. Jacques Félix, 405 — Vila Nova Conceição', '★ Michelin'),
('restaurante', 'Kan Suke', 'Japonesa / Kaiseki', 'R. Osaka, 523 — Liberdade', '★ Michelin'),
('restaurante', 'Kuro', 'Japonesa', 'R. Min. Jesuíno Cardoso, 52 — Vila Olímpia', '★ Michelin'),
('restaurante', 'Oseille', 'Francesa', 'R. Vittorio Fasano, 146 — Jardins', '★ Michelin'),
('restaurante', 'Fame Osteria', 'Italiana', 'R. Cônego Eugênio Leite, 523 — Pinheiros', '★ Michelin'),
('restaurante', 'Tangará Jean-Georges', 'Francesa', 'Av. Lineu de Paula Machado, 1088', '★ Michelin'),
('restaurante', 'Kazuo', 'Japonesa / Omakase', 'R. Barão de Capanema, 440 — Jardins', '★ Michelin'),
('restaurante', 'Ryo Gastronomia', 'Japonesa', 'R. Amauri, 240 — Itaim Bibi', '★ Michelin'),
('restaurante', 'Mee', 'Chinesa', 'Al. Santos, 1437 — Jardins', '★ Michelin'),
('restaurante', 'Kanoe', 'Japonesa / Sushi', 'R. Padre Carvalho, 171 — Pinheiros', '★ Michelin'),
('restaurante', 'Lar 201', 'Brasileira', 'R. dos Pinheiros, 201 — Pinheiros', '★ Michelin'),
('restaurante', 'Murakami', 'Japonesa / Sushi', 'R. Sacramento, 600 — Liberdade', '★ Michelin'),
('restaurante', 'Oizumi Sushi', 'Japonesa / Sushi', 'R. Bento de Andrade, 80 — Jd. Paulista', '★ Michelin'),
('restaurante', 'San Omakase', 'Japonesa / Omakase', 'R. Oscar Freire, 163 — Jardins', '★ Michelin'),
('restaurante', 'A Casa do Porco', 'Brasileira / Suínos', 'R. Araújo, 124 — República', '★ Verde Michelin'),
('restaurante', 'Corrutela', 'Brasileira', 'R. Rodésia, 197 — Vila Madalena', '★ Verde Michelin'),
('restaurante', 'Madame Olympe', 'Francesa', 'R. Joaquim Antunes, 93 — Pinheiros', '★ Michelin (nova)');

-- Seed: bares SP
insert into public.places (type, name, cuisine, address, badge) values
('bar', 'Tan Tan', 'Coquetelaria asiática', 'R. dos Pinheiros, 1208 — Pinheiros', '#24 World''s Best Bars'),
('bar', 'Exímia Bar', 'Coquetelaria autoral', 'R. Joaquim Floriano, 541 — Itaim Bibi', '#61 World''s Best Bars'),
('bar', 'SubAstor', 'Speakeasy / Clássicos', 'R. Delfina, 163 — Vila Madalena', 'Top 500 World''s Best'),
('bar', 'Bar dos Arcos', 'Coquetelaria / Cozinha de bar', 'Av. Nove de Julho, 5765 — Jd. Europa', 'Top 500 World''s Best'),
('bar', 'Santana Bar', 'Coquetelaria brasileira', 'R. Consolação, 3507 — Jardins', 'Top 500 World''s Best'),
('bar', 'Picco', 'Coquetelaria', 'R. Aspicuelta, 59 — Vila Madalena', 'Top 500 World''s Best'),
('bar', 'Guilhotina', 'Coquetelaria autoral', 'R. Costa Carvalho, 84 — Pinheiros', 'Top 100 Brasil'),
('bar', 'Frank Bar', 'Speakeasy / Clássicos', 'R. Cristiano Viana, 250 — Pinheiros', 'Top 100 Brasil'),
('bar', 'Banco Bar', 'Coquetelaria japonesa', 'R. Joaquim Antunes, 137 — Pinheiros', 'Top 100 Brasil'),
('bar', 'Bar Tiquira', 'Destilados brasileiros', 'R. Aspicuelta, 108 — Vila Madalena', 'Top 100 Brasil');

-- Storage bucket para fotos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

-- Políticas de storage
create policy "Anyone can view photos" on storage.objects for select using (bucket_id = 'photos');
create policy "Auth users can upload photos" on storage.objects for insert with check (bucket_id = 'photos' and auth.uid() is not null);
create policy "Owner or admin can delete photos" on storage.objects for delete using (
  bucket_id = 'photos' and (auth.uid()::text = (storage.foldername(name))[1] or auth.email() = 'diogo.melcher@gmail.com')
);
