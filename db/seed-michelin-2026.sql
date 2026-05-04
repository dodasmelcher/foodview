-- ==========================================
-- Michelin 2026 - Restaurantes novos de SP
-- (49 que ainda não estão no banco)
-- Rode no SQL Editor do Supabase
-- ==========================================

-- Atualizar badges dos que já existem para Michelin 2026
UPDATE public.places SET badge = '★★★ Michelin' WHERE name = 'Tuju';
UPDATE public.places SET badge = '★★★ Michelin' WHERE name = 'Evvai';
UPDATE public.places SET badge = '★★ Michelin' WHERE name = 'D.O.M.';
UPDATE public.places SET badge = '★ Michelin' WHERE name = 'Picchi';
UPDATE public.places SET badge = '★ Michelin' WHERE name = 'Fame';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Cepa';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Clandestina';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Cora';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Jacó';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Kotori';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Ping Yang';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Shihoma';
UPDATE public.places SET badge = 'Bib Gourmand Michelin' WHERE name = 'Tanit';
UPDATE public.places SET badge = 'Selecionado Michelin' WHERE name = 'Aiô';
UPDATE public.places SET badge = 'Selecionado Michelin' WHERE name = 'Cais';
UPDATE public.places SET badge = 'Selecionado Michelin' WHERE name = 'Cala del Tanit';
UPDATE public.places SET badge = 'Selecionado Michelin' WHERE name = 'Goya Zushi';
UPDATE public.places SET badge = 'Selecionado Michelin' WHERE name = 'Osso';
UPDATE public.places SET badge = 'Selecionado Michelin' WHERE name = 'A Figueira Rubaiyat';

-- === NOVOS RESTAURANTES (49) ===

insert into public.places (type, name, cuisine, address, badge) values
-- Bib Gourmand
('restaurante', 'AE! Cozinha', 'Brasileira', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Barú Marisquería', 'Frutos do Mar', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Brasserie Victória', 'Libanesa', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Cuia', 'Brasileira / Criativa', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Ecully', 'Internacional', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Le Bife', 'Steakhouse', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Manioca JK', 'Brasileira', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Manioca da Mata', 'Brasileira', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'NOMO', 'Contemporânea', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Più Higienópolis', 'Italiana', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Più Pinheiros', 'Italiana', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Tabôa Cozinha Artesanal', 'Brasileira', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'The Kith', 'Brasileira', 'São Paulo', 'Bib Gourmand Michelin'),
('restaurante', 'Zena Cucina', 'Italiana', 'São Paulo', 'Bib Gourmand Michelin'),

-- Selecionados
('restaurante', 'Amadeus', 'Frutos do Mar', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Animus', 'Contemporânea', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Aya Japanese Cuisine', 'Japonesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Bicol Korean Cuisine', 'Coreana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Blaise', 'Francesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Borgo Mooca', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Cantaloup', 'Francesa / Bistrô', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Casa Rios', 'Brasileira', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Casa Santo Antônio', 'Brasileira', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Chef Rouge', 'Francesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'De Segunda', 'Contemporânea', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Dinho''s', 'Brasileira / Steakhouse', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'El Tranvia', 'Espanhola', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Emiliano', 'Contemporânea', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Fasano Trattoria', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Giulietta Carni', 'Italiana / Carnes', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Grotta Cucina', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Kubo Zushi', 'Japonesa / Sushi', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Kureiji', 'Japonesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Lassù', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Le Jardin', 'Italiana / Francesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Les Présidents', 'Francesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Loup', 'Francesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Makoto San', 'Japonesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Marena Cucina', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Maza', 'Árabe', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Mondo', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Naga', 'Japonesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Paparoto Cucina', 'Italiana', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Pobre Juan', 'Steakhouse', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'SIMONE', 'Francesa', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Taraz', 'Contemporânea', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Terraço Notiê', 'Brasileira', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Vinheria Percussi', 'Italiana / Vinhos', 'São Paulo', 'Selecionado Michelin'),
('restaurante', 'Vista', 'Contemporânea', 'São Paulo', 'Selecionado Michelin');
