-- ==========================================
-- Remove restaurantes/bares inventados ou não confirmados
-- Rode no SQL Editor do Supabase
-- ==========================================

-- Primeiro, deletar reviews e favoritos associados aos places que serão removidos
-- (cascading delete cuida disso automaticamente por causa do ON DELETE CASCADE)

DELETE FROM public.places WHERE name IN (
  -- seed-extra.sql: Japoneses inventados
  'Mori Sushi',
  'Sushimar',
  'Yoshi',
  'Hokkaido',
  'Aska Lamen',
  'Udon Kenzo',
  'Robata Jinya',
  'Inazuma Sushi',
  'Koji',
  'Tanaka',
  'Azumi',
  'Temaki Fry',
  'Sushi Gen',
  'I Vitelloni',
  'Le Jardin',
  'Forneria San Paolo',
  'La Braciera',
  'Monte Verde Pizzaria',
  'Pizza da Mooca',
  'Piazza Zini',
  'Beco do Espeto Italiano',
  'Empório Santa Rosa',
  'Caracol',
  'Famiglia Giuliano',

  -- seed-extra.sql: Brasileiros inventados
  'Mani Manioca',
  'Tantin',
  'Casa de Feijoada',
  'Rancho Brasileiro',
  'Sertaneja Gastronomia',
  'Cozinha da Matilde',
  'Lá no Quintal',
  'Vila Butantan',
  'Casa do Sertão',
  'Restaurante Amazônia',
  'Moqueca Capixaba',
  'Sertão Veredas',
  'Rota do Acarajé',
  'Patuá',
  'Casa do Tapioqueiro',
  'Jerimum',
  'Beijupirá',
  'Casa Tucupi',
  'Cumbuca',
  'Dendê',
  'Pirarucu',
  'Farinha Pura',
  'Gosto com Gosto',
  'Jangada',
  'Casa de Farinha',

  -- seed-extra.sql: Franceses inventados
  'Brasserie Victoire',
  'Éze',
  'Chez Amis',
  'Bistrô de la Place',
  'Tartine',
  'La Boucherie',
  'Voulez-Vous',

  -- seed-extra.sql: Churrascarias inventadas
  'Baby Beef Rubaiyat',
  'Pampa Grill',
  'Jardineira Grill',
  'Novilho de Prata',
  'Estância Churrascaria',
  'Usina',
  'American Prime',
  'Kansas Grill',
  'Bull Ranch Burger',

  -- seed-extra.sql: Peruanos inventados
  'Lima Cocina Peruana',
  'Nazca',
  'Costa Brava Cevicheria',
  'Matsuya',
  'Chicha',
  'Sipan',

  -- seed-extra.sql: Coreanos inventados
  'Seoul House',
  'Gopchang Story',
  'Korea House',
  'Biwon',
  'Gangnam',
  'Kimchi',
  'Hanok',

  -- seed-extra.sql: Chineses inventados
  'China in Box Gourmet',
  'Dim Sum Haus',
  'Golden Dragon',
  'Wu Xing',
  'Lan Zhou',

  -- seed-extra.sql: Tailandeses/Vietnamitas inventados
  'Thai Gallery',
  'Pho',
  'Saigon',
  'Bangkok Kitchen',
  'Hanoi Cozinha Vietnamita',

  -- seed-extra.sql: Mexicanos inventados
  'Tacos de la Calle',
  'Calavera',
  'Quitandinha',
  'El Mexicano',
  'Frida y Diego',

  -- seed-extra.sql: Indianos inventados
  'Indian Taste',
  'Govinda',
  'Namaste India',
  'Tandoor',

  -- seed-extra.sql: Árabes inventados
  'Baalbek',
  'Baruk',
  'Folha de Uva',
  'Hamza',
  'Arábia Express',
  'Tabule',
  'Halim',

  -- seed-extra.sql: Espanhóis inventados
  'Brava',
  'Don Curro',
  'Bodega Espanhola',
  'Paella del Tio',

  -- seed-extra.sql: Portugueses inventados
  'Tasca do Zé',
  'A Adega',
  'Bacalhau do Porto',
  'Porto a Porto',

  -- seed-extra.sql: Gregos inventados
  'Oia',
  'Mykonos',
  'Santorini',
  'Olympia',

  -- seed-extra.sql: Hambúrgueres inventados
  'Na Garagem',
  'New Dog',
  'Bullger',
  'Buzina Food Truck Park',
  'Stunt Burger',
  'Underdog',

  -- seed-extra.sql: Veganos inventados
  'Panda Vegano',
  'Vegan Park',
  'Quinoa Real',
  'Lótus Vegetariano',
  'Fresh Vegan',

  -- seed-extra.sql: Cafés inventados
  'Octavio Café',
  'Isso É Café',
  'Grão Espresso',
  'The Little Bread',
  'Pain de France',
  'Bela Paulista',

  -- seed-extra.sql: Frutos do Mar inventados
  'Chez Patrick',
  'Pereira',
  'Peixaria Barceloneta',
  'Mare Nostrum',

  -- seed-extra.sql: Contemporâneos inventados
  'Ristorantino',
  'Mesa III',
  'Primo Basilico',
  'Primus',
  'Quintana Gastronomia',
  'Mirê',
  'Quitéria',
  'Galeria dos Pães',

  -- seed-extra.sql: Argentinos inventados
  'Buenos Aires Café',
  'Parrilla Madrid',
  'El Tranvía',

  -- seed-extra.sql: Africanos inventados
  'Jeje Àfríkà',
  'Baobá',
  'Acarajé da Cira',

  -- seed-extra.sql: Internacionais inventados
  'Mercearia do Conde',
  'Le Jazz Brasserie',
  'Cantaloup',
  'Barnaby',
  'O Alquimista',
  'Ecully',
  'Ici Bistrô',
  'Chou Chou',
  'Bouillon',

  -- seed-extra.sql: Mais brasileiros inventados
  'Casa Jaya',
  'Caxiri',
  'Arueira',
  'Birosca S2',
  'Quebrada Cozinha',
  'Mandacaru',
  'Boteco do Vini',
  'Cozinha Regional',
  'Cachaçaria Nacional',
  'Canjiquinha',
  'Casa do Norte',
  'Comida de Santo',
  'Consulado Gaúcho',
  'Sítio Gastronomia',
  'Raízes',
  'Fogão Caipira',
  'Tapioquinha',
  'Empório Sagarana',

  -- seed-extra.sql: Mais japoneses inventados
  'Koi Izakaya',
  'Sakagura A1',
  'Temaki Beach',
  'Wasabi Sushi',
  'Teppan Edo',
  'Yakissoba Express',
  'Dragon Sushi',
  'Kabuki',
  'Daiki',
  'Sushi Tsuru',

  -- seed-extra.sql: Mais italianos inventados
  'Cantina e Cucina',
  'Don Carlini',
  'Gattopardo',
  'Cantina Gigio',
  'Tarantella',

  -- seed-extra.sql: Pizzas inventadas
  'A Pizza da Mooca',
  'Bráz Trattoria',
  'Pizzaria do Brás',
  'Cristal Pizza Bar',
  '1900 Pizzeria',

  -- seed-extra.sql: Hotel inventados
  'Restaurante Tivoli',
  'Palácio Tangará Restaurant',
  'Emiliano Restaurant',
  'George V Restaurante',
  'Rosewood Restaurante',

  -- seed-extra.sql: Casual inventados
  'Bar do Luiz Fernandes',
  'Esch Café',
  'Casa Guedes',
  'Genésio',
  'Cervejaria Nacional',
  'Pracinha do Forró',
  'Leitaria da Quintanda',
  'Vinil Burger',
  'Sushi Lika',
  'Japa 25',
  'Giordano',
  'Manzuá',
  'Aoyama',
  'Restaurante Sírio',
  'Kitchin',
  'Açaí Frooty',
  'Tia Lina',
  'Ponto Chic',
  'Hocca Bar',
  'Casa Premium',
  'Bottega 21',
  'Trattoria da Rosario',
  'Miso Ramen',
  'Torii Sushi',
  'Cantina Famiglia',
  'Almanaque Café',
  'Empanadas Porteñas',
  'Nino',
  'Frangó',

  -- === BARES INVENTADOS (seed-extra.sql) ===

  -- Coquetelaria inventados
  'Apothek',
  'Bar Numero',
  'Alcôva',
  'Bar Secreto',
  'Boca de Ouro',
  'Fel',
  'Coffee & Cocktails',
  'Void',
  'Meza Bar',
  'Bar Oculto',
  'Drinks & Co',
  'Alquimia Bar',
  'Sacristia',
  'Lab Club',
  'Club Noir',

  -- Speakeasy inventados
  'Presidente Bar',
  'Mr. Lam',
  'Caves du Valais',
  'Door 48',
  'The Punch',

  -- Cervejarias inventadas
  'Cervejaria Nacional',
  'Empório Alto de Pinheiros',
  'Hoppy Days',
  'Trilha Cervejaria',
  'We Craft Beer',
  'Pratinha',
  'Mestre Cervejeiro',
  'Stone Brewing Tap Room',

  -- Vinhos inventados
  'Wine Not',
  'Enoteca Decanter',
  'Grand Cru Bar',
  'Winehouse',
  'Vino!',
  'Cellar Wine Bar',
  'Prosa Wine Bar',
  'Copa Wine Bar',
  'Terroir Vinhos',
  'Uvva Wine Bar',

  -- Botecos inventados
  'Bar da Vila',
  'Mercearia São Pedro',
  'Quitandinha Bar',
  'Bar do Juarez',
  'Empório São Bento',
  'Pirajá Bar',
  'Salve Jorge',
  'Bar Original',
  'Balcão',

  -- Cocktail bars inventados
  'Locale Bar',
  'Negroni Bar',
  'Gin House',
  'The Gin Club',
  'Rota 66',
  'Zimbro',
  'Botanicus Bar',
  'Bitters & Bubbles',

  -- Rooftop inventados
  'Sky Bar',
  'Vista Rooftop',
  'Above Bar',
  'Highline Bar',
  'Edge Rooftop',
  'Tetto Rooftop',

  -- Sakê inventados
  'Sakeria',
  'Izakaya Issa',
  'Kazu Bar',
  'Kampai Bar',
  'Shochu Bar',

  -- Pub inventados
  'Finnegan''s Pub',
  'The Blue Pub',
  'Lions English Pub',
  'Williams Pub',
  'Ozzie Pub',
  'Shamrock',
  'The Crown',

  -- Cachaça inventados
  'Bar da Cachaça',
  'Cachaçaria Paulista',
  'Alambique Paulista',
  'Catedral da Cachaça',
  'De Janeiro',

  -- Whisky inventados
  'Single Malt Bar',
  'The Whisky Library',
  'Scotch Bar',

  -- Jazz inventados
  'Jazz nos Fundos',
  'Café Piu Piu',
  'All of Jazz',

  -- Hotel bar inventados
  'Baretto',
  'Bar do Copan',
  'Punch Bar',
  'Tangará Bar',
  'Tivoli Bar',

  -- Low ABV inventados
  'Microbar',
  'Sober Bar',
  'Spritz Bar',

  -- Tiki inventados
  'Tiki Bar SP',
  'Caju Bar',
  'Maracujá Bar',

  -- Bares variados inventados
  'Bar Beirute',
  'Bar do Arnesto',
  'Bar do Ponto',
  'Beco 203',
  'Bar Buena Vista',
  'Bar Goiaba',
  'Botequim',
  'Bar Volt',
  'Genial Bar',
  'Farol Bar',
  'Bar dos Cornos',
  'Carioca Club',
  'Drosophyla Bar',
  'Empório Magalhães',
  'Giramundo Bar',
  'Kia Ora',
  'Joá Bar',
  'Kazebre',
  'Leme Bar',
  'Mirante 9 de Julho',
  'Orbit Bar',
  'Pé de Manga',
  'Rosa Bar',
  'São Cristóvão Bar',
  'Samba Bar',
  'Tokyo Bar',
  'Urbano Bar',
  'Ventura Bar',

  -- seed-150.sql: Inventados/incertos
  'Miya',
  'Beco do Batman Bistrô',
  'Clos',
  'Helena',
  'Alma Chef',
  'Cais do Porto',
  'Mangue Seco',
  'Temple Bar',
  'Limão Rosa',
  'Kaá',
  'Moma',
  'Le Blenheim',
  'Mon Bijou',
  'Shahiya',
  'Osmanieh',
  'Tadka',
  'Casa Bela Madalena',
  'Padaria São Domingos',
  'Lá da Venda',
  'Qceviche',
  'Root Vegan Diner',
  'Cuia Café',
  'Ella Fernandes',
  'Jamile',
  'Casa da Fazenda Morumbi',
  'Officina de Massas',
  'Tuy',
  'Dois Trópicos',
  'Yamy',
  'Praça São Lourenço',
  'Tradi',
  'Bagua'
);
