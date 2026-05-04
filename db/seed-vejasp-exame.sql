-- ==========================================
-- Restaurantes e Bares verificados
-- Fontes: EXAME Casual 2025, Prêmio Paladar,
--         Michelin 2026, VejaSP Comer & Beber
-- Rode no SQL Editor do Supabase
-- ==========================================

-- === RESTAURANTES (25) ===

insert into public.places (type, name, cuisine, address, badge) values
('restaurante', 'Cepa', 'Contemporânea', 'Praça dos Omaguás, 110 — Pinheiros', ''),
('restaurante', 'Kotori', 'Japonesa / Yōshoku', 'R. Cônego Eugênio Leite, 639 — Pinheiros', ''),
('restaurante', 'Aiô', 'Taiwanesa', 'R. Áurea, 307 — Vila Mariana', ''),
('restaurante', 'Cais', 'Frutos do Mar / Contemporânea', 'R. Fidalga, 314 — Vila Madalena', ''),
('restaurante', 'Cala del Tanit', 'Mediterrânea / Espanhola', 'R. Pais de Araújo, 147 — Itaim Bibi', ''),
('restaurante', 'Charco', 'Brasileira / Churrasco', 'R. Peixoto Gomide, 1492 — Jardim Paulista', ''),
('restaurante', 'Ping Yang', 'Tailandesa', 'R. Dr. Melo Alves, 767 — Jardim Paulista', ''),
('restaurante', 'Clandestina', 'Brasileira / Contemporânea', 'R. Girassol, 833 — Vila Madalena', ''),
('restaurante', 'Picchi', 'Italiana / Contemporânea', 'R. Oscar Freire, 533 — Jardins', '★ Michelin'),
('restaurante', 'Shihoma', 'Italiana / Massa Fresca', 'R. Medeiros de Albuquerque, 431 — Vila Madalena', ''),
('restaurante', 'Tanit', 'Mediterrânea / Catalã', 'R. Oscar Freire, 145 — Jardins', ''),
('restaurante', 'Modern Mamma Osteria', 'Italiana', 'R. Manuel Guedes, 160 — Itaim Bibi', ''),
('restaurante', 'Cora', 'Frutos do Mar / Contemporânea', 'R. Amaral Gurgel, 344 — Vila Buarque', ''),
('restaurante', 'Cozinha 212', 'Contemporânea', 'R. dos Pinheiros, 174 — Pinheiros', ''),
('restaurante', 'Goya Zushi', 'Japonesa / Omakase', 'São Paulo', ''),
('restaurante', 'Jacó', 'Contemporânea', 'São Paulo', ''),
('restaurante', 'Fame', 'Contemporânea / Espanhola', 'R. Oscar Freire, 216 — Jardins', '★ Michelin'),
('restaurante', 'A Figueira Rubaiyat', 'Brasileira / Steakhouse', 'R. Haddock Lobo, 1738 — Jardins', 'Selecionado Michelin'),
('restaurante', 'Lena', 'Mineira', 'R. Dr. Virgílio de Carvalho Pinto, 98 — Pinheiros', ''),
('restaurante', 'Assador SP', 'Brasileira / Steakhouse', 'Av. Brig. Faria Lima, 3732 — Itaim Bibi', ''),
('restaurante', 'Donna Di Nico', 'Italiana / Trattoria', 'R. Agostinho Gomes, 2045 — Ipiranga', ''),
('restaurante', 'Bistrot Parigi', 'Francesa', 'São Paulo', ''),
('restaurante', 'Jardim de Napoli', 'Italiana', 'São Paulo', ''),
('restaurante', 'Osso', 'Steakhouse', 'São Paulo', ''),
('restaurante', 'Soffio Pizzeria', 'Italiana / Pizza', 'São Paulo', '');

-- === BARES (36) ===

insert into public.places (type, name, cuisine, address, badge) values
('bar', 'The Liquor Store', 'Coquetelaria', 'Al. Franca, 1151 — Jardim Paulista', ''),
('bar', 'Caledonia Whisky & Co.', 'Whisky Bar', 'R. Vupabussu, 309 — Pinheiros', ''),
('bar', 'Plou Vinhos', 'Bar de Vinhos', 'R. Original, 141 — Vila Madalena', ''),
('bar', 'The Punch Bar', 'Coquetelaria', 'R. Manuel da Nóbrega, 76 — Paraíso', ''),
('bar', 'Boca de Ouro', 'Coquetelaria / Boteco', 'R. Cônego Eugênio Leite, 1121 — Pinheiros', ''),
('bar', 'Guarita', 'Coquetelaria / Boteco', 'R. Simão Álvares, 952 — Pinheiros', ''),
('bar', 'Moela', 'Boteco', 'R. Canuto do Val, 136 — Santa Cecília', ''),
('bar', 'Koya88', 'Coquetelaria / Asiática', 'R. Jesuíno Pascoal, 21 — Santa Cecília', ''),
('bar', 'Lágrima', 'Coquetelaria', 'R. Major Sertório, 95 — Vila Buarque', ''),
('bar', 'Sede 261', 'Bar de Vinhos', 'R. Benjamim Egas, 261 — Pinheiros', ''),
('bar', 'Shiro', 'Coquetelaria / Japonesa', 'R. Padre João Manuel, 712 — Cerqueira César', ''),
('bar', 'Balcão', 'Coquetelaria', 'R. Dr. Melo Alves, 150 — Jardim Paulista', ''),
('bar', 'Baretto', 'Bar de Hotel / Coquetelaria', 'R. Vittorio Fasano, 88 — Jardim Paulista', ''),
('bar', 'Regô', 'Coquetelaria', 'R. Rego Freitas, 441 — República', ''),
('bar', 'Cascasse il Mondo', 'Coquetelaria / Italiana', 'R. Tucuna, 724 — Perdizes', ''),
('bar', 'Trinca Bar e Vermuteria', 'Vermuteria', 'R. Costa Carvalho, 96 — Pinheiros', ''),
('bar', 'Atlântico 212', 'Bar de Ostras / Frutos do Mar', 'R. dos Pinheiros, 70 — Pinheiros', ''),
('bar', 'Dōmo', 'Listening Bar', 'R. Major Sertório, 452 — Vila Buarque', ''),
('bar', 'Rabo di Galo', 'Speakeasy', 'R. Itapeva, 435 — Bela Vista', ''),
('bar', 'Boteco de Manu', 'Boteco / Chef', 'R. do Lavradio, 235 — Barra Funda', ''),
('bar', 'Bar do Luiz Nozoie', 'Boteco / Tradicional', 'Av. do Cursino, 1210 — Bosque da Saúde', ''),
('bar', 'Barouche', 'Coquetelaria', 'R. Medeiros de Albuquerque, 401 — Vila Madalena', ''),
('bar', 'Fifty Fifty', 'Coquetelaria', 'R. Dep. Lacerda Franco, 596 — Pinheiros', ''),
('bar', 'The Door', 'Coquetelaria', 'R. Fradique Coutinho, 1111 — Vila Madalena', ''),
('bar', 'Nit Bar de Tapas', 'Tapas / Espanhola', 'R. Oscar Freire, 153 — Jardins', ''),
('bar', 'Pina Drinques', 'Coquetelaria', 'R. Brig. Galvão, 177 — Barra Funda', ''),
('bar', 'Bar do Cofre', 'Coquetelaria', 'R. João Brícola, 24 — Centro', ''),
('bar', 'Caracol', 'Listening Bar', 'R. Boracéa, 160 — Barra Funda', ''),
('bar', 'Casa de Francisca', 'Música / Gastronomia', 'R. Quintino Bocaiúva, 22 — Sé', ''),
('bar', 'Cineclube Cortina', 'Cinema / Bar', 'R. Araújo, 62 — República', ''),
('bar', 'Fel', 'Coquetelaria Clássica', 'Av. Ipiranga, 200 — República', ''),
('bar', 'Veloso Bar', 'Boteco', 'R. Conceição Veloso, 54 — Vila Mariana', ''),
('bar', 'PLek', 'Coquetelaria / Tailandesa', 'R. Dr. Melo Alves, 762 — Cerqueira César', ''),
('bar', 'KuroMoon', 'Coquetelaria / Asiática', 'São Paulo', ''),
('bar', 'Kotchi', 'Listening Bar / Japonesa', 'São Paulo', ''),
('bar', 'Hideout Speakeasy', 'Speakeasy', 'São Paulo', '');
