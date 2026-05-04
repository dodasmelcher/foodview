-- ==========================================
-- 130+ restaurantes adicionais de São Paulo
-- Rode no SQL Editor do Supabase
-- (não duplica os 22 já existentes)
-- ==========================================

-- Adicionar coluna featured se não existir
alter table public.places add column if not exists featured boolean default false;

insert into public.places (type, name, cuisine, address, image_url, badge) values
-- Michelin Bib Gourmand & Selecionados
('restaurante', 'Mocotó', 'Brasileira / Nordestina', 'Av. Nossa Sra. do Loreto, 1100 — Vila Medeiros', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', 'Bib Gourmand Michelin'),
('restaurante', 'Balaio IMS', 'Brasileira', 'Av. Paulista, 2424 — Bela Vista', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Metzi', 'Mexicana', 'R. Augusta, 2690 — Jardins', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Nelita', 'Contemporânea', 'R. Mourato Coelho, 1284 — Vila Madalena', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Komah', 'Coreana', 'R. Bandeira Paulista, 555 — Itaim Bibi', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Le Cordon Bleu Bistrot', 'Francesa', 'R. Natingui, 463 — Vila Madalena', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Presidente', 'Japonesa', 'R. Amauri, 401 — Itaim Bibi', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Notiê', 'Brasileira', 'R. Cônego Eugênio Leite, 830 — Pinheiros', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Pipo', 'Francesa / Brasileira', 'R. Alves Guimarães, 428 — Pinheiros', 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Giusto', 'Italiana', 'R. Vittorio Fasano, 88 — Jardins', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', 'Selecionado Michelin'),

-- Japonesa
('restaurante', 'Aizomê', 'Japonesa', 'R. Augusta, 463 — Consolação', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop', 'Selecionado Michelin'),
('restaurante', 'Sushi Leblon', 'Japonesa / Sushi', 'R. Haddock Lobo, 1629 — Jardins', 'https://images.unsplash.com/photo-1586999768265-24af89630739?w=800&h=600&fit=crop', ''),
('restaurante', 'Kosushi', 'Japonesa / Sushi', 'R. Bandeira Paulista, 603 — Itaim Bibi', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Temakeria e Cia', 'Japonesa / Temaki', 'R. Inhambu, 805 — Moema', 'https://images.unsplash.com/photo-1586999768265-24af89630739?w=800&h=600&fit=crop', ''),
('restaurante', 'Sassá Sushi', 'Japonesa / Sushi', 'R. Barão de Capanema, 440 — Jardins', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop', ''),
('restaurante', 'Nagayama', 'Japonesa', 'R. Bandeira Paulista, 369 — Itaim Bibi', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Shin Zushi', 'Japonesa / Sushi', 'R. Jerônimo da Veiga, 62 — Itaim Bibi', 'https://images.unsplash.com/photo-1586999768265-24af89630739?w=800&h=600&fit=crop', ''),
('restaurante', 'Miya', 'Japonesa / Omakase', 'R. Padre João Manuel, 807 — Jardins', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop', ''),
('restaurante', 'Jiquitaia', 'Brasileira / Nordestina', 'R. António Carlos, 268 — Consolação', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', 'Bib Gourmand Michelin'),

-- Italiana
('restaurante', 'Fasano', 'Italiana', 'R. Vittorio Fasano, 88 — Jardins', 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&h=600&fit=crop', ''),
('restaurante', 'Gero', 'Italiana', 'R. Haddock Lobo, 1629 — Jardins', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', ''),
('restaurante', 'Nino Cucina', 'Italiana', 'R. Pedroso Alvarenga, 1004 — Itaim Bibi', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'La Tambouille', 'Francesa / Italiana', 'Av. 9 de Julho, 5925 — Jardim Europa', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Bottega Bernacca', 'Italiana', 'R. Melo Alves, 458 — Jardins', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'La Pasta Gialla', 'Italiana', 'R. Augusta, 1508 — Consolação', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', ''),
('restaurante', 'Cucina Paradiso', 'Italiana', 'R. Aspicuelta, 216 — Vila Madalena', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'Locale Caffè', 'Italiana / Café', 'R. Manuel Guedes, 349 — Itaim Bibi', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Terraço Itália', 'Italiana', 'Av. Ipiranga, 344 — República', 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&h=600&fit=crop', ''),
('restaurante', 'Bráz Pizzaria', 'Italiana / Pizza', 'R. Graúna, 125 — Moema', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'Leggera Pizza', 'Italiana / Pizza', 'R. Diana, 80 — Pompeia', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'Speranza', 'Italiana / Pizza', 'R. 13 de Maio, 1004 — Bela Vista', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', ''),

-- Francesa
('restaurante', 'Bistrot de Paris', 'Francesa', 'R. Augusta, 2542 — Jardins', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Café Journal', 'Francesa / Bistrô', 'R. dos Pinheiros, 145 — Pinheiros', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Marcel', 'Francesa', 'R. Sampaio Vidal, 555 — Jardim Paulistano', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Le Blenheim', 'Francesa', 'R. Pedroso Alvarenga, 640 — Itaim Bibi', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Mon Bijou', 'Francesa / Bistrô', 'R. Amauri, 281 — Itaim Bibi', 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=600&fit=crop', ''),
('restaurante', 'Le Vin Bistro', 'Francesa', 'R. Melo Alves, 726 — Jardins', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),

-- Brasileira / Contemporânea
('restaurante', 'Tordesilhas', 'Brasileira', 'R. Bela Cintra, 465 — Consolação', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Brasil a Gosto', 'Brasileira', 'R. Professor Azevedo do Amaral, 70 — Jardim Paulista', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Dalva e Dito', 'Brasileira', 'R. Padre João Manuel, 1115 — Jardins', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', ''),
('restaurante', 'Consulado Mineiro', 'Brasileira / Mineira', 'R. Cônsul Crispiniano Soares, 49 — Praça da Árvore', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Banana Verde', 'Brasileira / Vegana', 'R. Cônego Eugênio Leite, 324 — Pinheiros', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop', ''),
('restaurante', 'Esquina Mocotó', 'Brasileira / Nordestina', 'Av. Nossa Sra. do Loreto, 1002 — Vila Medeiros', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Beco do Batman Bistrô', 'Brasileira', 'R. Gonçalo Afonso, 48 — Vila Madalena', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Manioca', 'Brasileira', 'R. Artur de Azevedo, 471 — Pinheiros', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Chou', 'Brasileira / Contemporânea', 'R. Mateus Grou, 348 — Pinheiros', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Clos', 'Brasileira / Francesa', 'R. Aspicuelta, 43 — Vila Madalena', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Helena', 'Brasileira', 'R. Augusta, 3161 — Jardins', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Capim Santo', 'Brasileira / Baiana', 'R. Aracaju, 49 — Vila Mariana', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),

-- Carnes / Churrascaria
('restaurante', 'Fogo de Chão', 'Churrascaria', 'R. Augusta, 2077 — Jardins', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'NB Steak', 'Steakhouse', 'R. Haddock Lobo, 1421 — Jardins', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'Varanda Grill', 'Churrascaria', 'R. Amauri, 275 — Itaim Bibi', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'Temple Bar', 'Steakhouse', 'R. Artur de Azevedo, 990 — Pinheiros', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'Rubaiyat', 'Steakhouse', 'R. Haddock Lobo, 1738 — Jardins', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'Vento Haragano', 'Churrascaria', 'R. Pedroso Alvarenga, 1254 — Itaim Bibi', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'CT Boucherie', 'Steakhouse / Francesa', 'R. Barão de Capanema, 440 — Jardins', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),

-- Peruanas / Latinas
('restaurante', 'La Mar', 'Peruana', 'R. Tabapuã, 1410 — Itaim Bibi', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Tanta', 'Peruana', 'R. Amauri, 275 — Itaim Bibi', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Limão Rosa', 'Peruana', 'R. Barão de Capanema, 201 — Jardins', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Kaá', 'Peruana / Brasileira', 'R. Gomes de Carvalho, 1765 — Vila Olímpia', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),

-- Mediterrânea / Espanhola / Portuguesa
('restaurante', 'Amado', 'Mediterrânea', 'R. Oscar Freire, 591 — Jardins', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', ''),
('restaurante', 'A Bela Sintra', 'Portuguesa', 'R. Bela Cintra, 2325 — Jardins', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', ''),
('restaurante', 'Antiquarius', 'Portuguesa', 'R. Artur de Azevedo, 870 — Pinheiros', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Moma', 'Mediterrânea', 'R. Joaquim Antunes, 210 — Pinheiros', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', ''),

-- Asiática (Thai, Chinesa, Coreana, Vietnamita)
('restaurante', 'Bao', 'Chinesa / Asiática', 'R. Joaquim Floriano, 413 — Itaim Bibi', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Na Thai', 'Tailandesa', 'R. Pais de Araújo, 105 — Itaim Bibi', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Tam Tam', 'Tailandesa / Vietnamita', 'R. dos Pinheiros, 1293 — Pinheiros', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Jojo Lab', 'Coreana', 'R. Ferreira de Araújo, 285 — Pinheiros', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Jae', 'Coreana', 'R. Galeno de Almeida, 30 — Pinheiros', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Huang Shan', 'Chinesa', 'R. Tomás Gonzaga, 22 — Liberdade', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Bagua', 'Chinesa', 'R. Galvão Bueno, 80 — Liberdade', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop', ''),
('restaurante', 'Mi Ramen', 'Japonesa / Ramen', 'R. dos Pinheiros, 396 — Pinheiros', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop', ''),

-- Contemporânea / Autoral
('restaurante', 'Ama.zo', 'Brasileira / Amazônica', 'R. Barão de Capanema, 549 — Jardins', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Pirajá', 'Brasileira / Boteco', 'R. Pedroso Alvarenga, 1564 — Itaim Bibi', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Lilu', 'Italiana / Contemporânea', 'R. Artur de Azevedo, 363 — Pinheiros', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Petí Gastronomia', 'Contemporânea', 'R. Wisard, 149 — Vila Madalena', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Ápice', 'Contemporânea', 'R. Mourato Coelho, 1386 — Vila Madalena', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Santo Grão', 'Café / Bistrô', 'R. Oscar Freire, 413 — Jardins', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Fitó', 'Contemporânea', 'R. Harmonia, 484 — Vila Madalena', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Alma Chef', 'Contemporânea', 'R. Artur de Azevedo, 1147 — Pinheiros', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Ori', 'Contemporânea / Brasileira', 'R. Augusta, 2077 — Jardins', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),

-- Frutos do Mar
('restaurante', 'Maremonti', 'Italiana / Frutos do Mar', 'R. da Consolação, 3585 — Jardins', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', ''),
('restaurante', 'Cais do Porto', 'Frutos do Mar', 'R. Haddock Lobo, 1024 — Jardins', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', ''),
('restaurante', 'Mangue Seco', 'Frutos do Mar / Brasileira', 'R. Mourato Coelho, 1128 — Pinheiros', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Kalimera', 'Grega / Mediterrânea', 'R. Simão Álvares, 530 — Pinheiros', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop', ''),

-- Hambúrgueres & Casual Premium
('restaurante', 'Lanchonete da Cidade', 'Hambúrgueres', 'R. Augusta, 1463 — Consolação', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop', ''),
('restaurante', 'Burger Lab', 'Hambúrgueres', 'R. dos Pinheiros, 220 — Pinheiros', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop', ''),
('restaurante', 'Z Deli', 'Deli / Sanduíches', 'R. Augusta, 2504 — Jardins', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop', ''),
('restaurante', 'Meats', 'Hambúrgueres', 'R. dos Pinheiros, 320 — Pinheiros', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop', ''),
('restaurante', 'Tradi', 'Hambúrgueres / Artesanal', 'R. dos Pinheiros, 753 — Pinheiros', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop', ''),

-- Indiana / Árabe / Turca
('restaurante', 'Shahiya', 'Árabe', 'R. Oscar Freire, 652 — Jardins', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', ''),
('restaurante', 'Arabia', 'Árabe', 'R. Haddock Lobo, 1397 — Jardins', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', ''),
('restaurante', 'Osmanieh', 'Árabe / Libanesa', 'R. 25 de Março, 1087 — Centro', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', ''),
('restaurante', 'Banzeiro', 'Brasileira / Amazônica', 'R. Lavradio, 150 — Itaim Bibi', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Tadka', 'Indiana', 'R. Augusta, 1403 — Consolação', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', ''),

-- Padarias & Brunch
('restaurante', 'Padoca do Maní', 'Padaria / Bistrô', 'R. Joaquim Antunes, 210 — Pinheiros', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Casa Bela Madalena', 'Café / Brunch', 'R. Aspicuelta, 188 — Vila Madalena', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Padaria São Domingos', 'Padaria / Café', 'R. Domingos de Morais, 2293 — Vila Mariana', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Lá da Venda', 'Brunch / Bistrô', 'R. Harmonia, 161 — Vila Madalena', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),

-- Espanhola
('restaurante', 'La Casserole', 'Espanhola / Francesa', 'Largo do Arouche, 346 — República', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Qceviche', 'Espanhola / Peruana', 'R. Ferreira de Araújo, 351 — Pinheiros', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),

-- Vegetariana / Vegana
('restaurante', 'Nambu', 'Brasileira / Vegana', 'R. Augusta, 1563 — Consolação', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop', ''),
('restaurante', 'Teva', 'Vegetariana', 'R. Padre Carvalho, 480 — Pinheiros', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop', ''),
('restaurante', 'Root Vegan Diner', 'Vegana / Fast-casual', 'R. Augusta, 1750 — Jardins', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop', ''),

-- Mexicana
('restaurante', 'Guacamole Cocina Mexicana', 'Mexicana', 'R. Oscar Freire, 888 — Jardins', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Cuia Café', 'Mexicana / Café', 'R. Aspicuelta, 52 — Vila Madalena', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),

-- Mais Contemporânea / Autoral
('restaurante', 'Ella Fernandes', 'Contemporânea', 'R. Jerônimo da Veiga, 163 — Itaim Bibi', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Spot', 'Internacional', 'R. Min. Rocha Azevedo, 72 — Jardins', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Grano', 'Italiana / Bistrô', 'R. Aspicuelta, 374 — Vila Madalena', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', ''),
('restaurante', 'Jamile', 'Árabe / Contemporânea', 'R. Pamplona, 1484 — Jardins', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop', ''),
('restaurante', 'Dona Onça', 'Brasileira', 'Av. Ipiranga, 200 — República', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Carlota', 'Contemporânea / Brasileira', 'R. Sergipe, 753 — Higienópolis', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'A Baianeira', 'Brasileira / Baiana', 'R. Padre Garcia Velho, 30 — Pinheiros', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Adega Santiago', 'Portuguesa / Espanhola', 'R. Pamplona, 1410 — Jardins', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Arturito', 'Brasileira / Italiana', 'R. Artur de Azevedo, 542 — Pinheiros', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Bacaro', 'Italiana / Vinhos', 'R. Oscar Freire, 1801 — Pinheiros', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', ''),
('restaurante', 'Bar da Dona Onça', 'Brasileira / Boteco', 'Av. Ipiranga, 200 — República', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Bellopão', 'Padaria / Bistrô', 'R. Joaquim Antunes, 74 — Pinheiros', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Casa da Fazenda Morumbi', 'Brasileira', 'Av. Morumbi, 5594 — Morumbi', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', ''),
('restaurante', 'Skye', 'Contemporânea / Internacional', 'Av. Brigadeiro Luís Antônio, 4700 — Jardim Paulista', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Seen', 'Contemporânea', 'R. Ferreira de Araújo, 269 — Pinheiros', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Toro Gastrobar', 'Espanhola / Contemporânea', 'R. Padre João Manuel, 1307 — Jardins', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Chez Oscar', 'Francesa / Bistrô', 'R. Oscar Freire, 600 — Jardins', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Osteria Bottega', 'Italiana', 'R. Wisard, 109 — Vila Madalena', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'Obá', 'Contemporânea / Brasileira', 'R. Fradique Coutinho, 210 — Pinheiros', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Benê', 'Italiana / Pizza', 'R. Wisard, 361 — Vila Madalena', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'MEE Izakaya', 'Japonesa / Izakaya', 'Al. Jaú, 150 — Jardins', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop', ''),
('restaurante', 'Rincón', 'Argentina / Parrilla', 'R. Ferreira de Araújo, 371 — Pinheiros', 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop', ''),
('restaurante', 'Bar Astor', 'Internacional', 'R. Delfina, 163 — Vila Madalena', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Dona Carmela', 'Italiana / Pizza', 'R. Augusta, 973 — Consolação', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'Praça São Lourenço', 'Café / Brunch', 'R. Casa do Ator, 608 — Vila Olímpia', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop', ''),
('restaurante', 'Santinho', 'Brasileira / Praiana', 'R. Graúna, 61 — Moema', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', ''),
('restaurante', 'Sal Gastronomia', 'Contemporânea', 'R. Minas Gerais, 350 — Higienópolis', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', ''),
('restaurante', 'Pizzaria Camelo', 'Italiana / Pizza', 'R. Pamplona, 1873 — Jardim Paulista', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', ''),
('restaurante', 'Officina de Massas', 'Italiana / Massas', 'R. Harmonia, 550 — Vila Madalena', 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop', ''),
('restaurante', 'Bistro Charlô', 'Francesa', 'R. Barão de Capanema, 440 — Jardins', 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&h=600&fit=crop', ''),
('restaurante', 'Tuy', 'Brasileira / Contemporânea', 'R. Gomes de Carvalho, 1213 — Vila Olímpia', 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', ''),
('restaurante', 'Makoto', 'Japonesa', 'R. Haddock Lobo, 1629 — Jardins', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop', ''),
('restaurante', 'Dois Trópicos', 'Brasileira / Bar', 'R. Aspicuelta, 324 — Vila Madalena', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', ''),
('restaurante', 'Yamy', 'Coreana / Ramen', 'R. Augusta, 1731 — Consolação', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop', '');
