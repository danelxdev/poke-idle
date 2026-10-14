// Datos de PokéIdle: regiones, rutas y jefes, Poké Balls, mejoras, tienda de la Liga, misiones y logros.
'use strict';

const RARITY = [null,
  { name: 'Común', color: '#b9c1cc' },
  { name: 'Poco común', color: '#5fe08a' },
  { name: 'Rara', color: '#4fb4ff' },
  { name: 'Épica', color: '#c47bff' },
  { name: 'Legendaria', color: '#ffd23f' },
];
const RAR_MULT = [0, 1, 1.25, 1.6, 2.2, 3.2];   // daño
const RAR_COST = [0, 1, 1.2, 1.45, 1.8, 2.4];   // coste de subir nivel
const STAR_MULT = [1, 1.6, 2.5, 4, 6.5, 10];    // ★0..★5
const STAR_COPIES = [1, 2, 4, 6, 10];           // copias para pasar a la siguiente estrella
const DUST_GAIN = [0, 3, 8, 20, 60, 150];       // polvo estelar por copia repetida
const DUST_COST = [0, 60, 150, 400, 1200, 3500];// polvo para canjear un Pokémon concreto
const EVO_LVL = [16, 36];                       // niveles de evolución (1.ª y 2.ª)
const RARITY_FIX = {};
const RAR_CUT = [485, 505, 530];                // BST final de la línea para poder ser poco común, rara o épica

// Regiones: la primera ruta de cada una (cada ruta = 10 etapas, la 10.ª es el jefe)
const REGIONS = [
  { name: 'Kanto', gen: 1, first: 0 },
  { name: 'Johto', gen: 2, first: 14 },
  { name: 'Hoenn', gen: 3, first: 28 },
  { name: 'Sinnoh', gen: 4, first: 42 },
  { name: 'Teselia', gen: 5, first: 56 },
  { name: 'Kalos', gen: 6, first: 70 },
  { name: 'Alola', gen: 7, first: 84 },
  { name: 'Galar', gen: 8, first: 98 },
  { name: 'Paldea', gen: 9, first: 112 },
  { name: 'Más allá', gen: 0, first: 126 },
];
const BOSS_TIER = [null,
  { name: 'Líder', hp: 6, time: 30, gems: 12, scale: 2 },
  { name: 'Alto Mando', hp: 8, time: 35, gems: 20, scale: 2 },
  { name: 'Campeón', hp: 11, time: 40, gems: 35, scale: 2.2 },
  { name: 'Legendario', hp: 15, time: 45, gems: 50, scale: 2.4 },
  { name: 'Jefe final', hp: 20, time: 60, gems: 80, scale: 2.6 },
];

// gens = generaciones de Pokémon salvajes · biome = índice de Tiles.THEMES · top = adorno del borde
const R = (name, gens, types, biome, top, who, title, dex, tier) => ({ name, gens, types, biome, top, boss: { who, title, dex, tier } });
const ROUTES = [
  // ---------- KANTO ----------
  R('Ruta 1', [1], ['normal', 'flying'], 0, 'trees', 'Brock', 'Líder de Plateada', 95, 1),
  R('Bosque Verde', [1], ['bug', 'grass'], 0, 'trees', 'Misty', 'Líder de Celeste', 121, 1),
  R('Monte Moon', [1], ['rock', 'ground', 'fairy'], 1, 'rocks', 'Lt. Surge', 'Líder de Carmín', 26, 1),
  R('Ruta 24', [1], ['water', 'normal', 'poison'], 2, 'water', 'Erika', 'Líder de Azulona', 45, 1),
  R('Túnel Roca', [1], ['rock', 'ground', 'fighting'], 1, 'rocks', 'Koga', 'Líder de Fucsia', 110, 1),
  R('Torre Pokémon', [1], ['ghost', 'poison', 'psychic'], 4, 'tombs', 'Sabrina', 'Líder de Azafrán', 65, 1),
  R('Central Energía', [1], ['electric', 'steel', 'normal'], 3, 'pylons', 'Blaine', 'Líder de Canela', 59, 1),
  R('Islas Espuma', [1], ['water', 'ice'], 2, 'water', 'Giovanni', 'Líder de Verde', 112, 1),
  R('Isla Canela', [1], ['fire', 'poison', 'normal'], 10, 'rocks', 'Lorelei', 'Alto Mando de Kanto', 131, 2),
  R('Calle Victoria', [1], ['fighting', 'rock', 'ground'], 1, 'rocks', 'Bruno', 'Alto Mando de Kanto', 68, 2),
  R('Meseta Añil', [1], ['psychic', 'ghost', 'poison'], 4, 'tombs', 'Agatha', 'Alto Mando de Kanto', 94, 2),
  R('Sala del Dragón', [1], ['dragon', 'flying', 'water'], 5, 'crystals', 'Lance', 'Alto Mando de Kanto', 149, 2),
  R('Sala del Campeón', [1], ['fire', 'water', 'grass', 'psychic'], 13, 'crystals', 'Azul', 'Campeón de Kanto', 9, 3),
  R('Cueva Celeste', [1], ['psychic', 'ice', 'electric', 'fire'], 5, 'crystals', 'Mewtwo', 'Pokémon legendario', 150, 4),
  // ---------- JOHTO ----------
  R('Ruta 29', [2, 1], ['normal', 'flying', 'grass'], 12, 'trees', 'Falkner', 'Líder de Violeta', 18, 1),
  R('Bosque Corteza', [2, 1], ['bug', 'grass', 'poison'], 0, 'trees', 'Bugsy', 'Líder de Azalea', 123, 1),
  R('Granja Mu-Mu', [2, 1], ['normal', 'fairy', 'electric'], 12, 'trees', 'Whitney', 'Líder de Trigal', 241, 1),
  R('Torre Quemada', [2, 1], ['ghost', 'fire', 'dark'], 4, 'tombs', 'Morty', 'Líder de Iris', 94, 1),
  R('Isla Cianwood', [2, 1], ['fighting', 'water', 'rock'], 8, 'water', 'Chuck', 'Líder de Orquídea', 62, 1),
  R('Faro Olivo', [2, 1], ['steel', 'water', 'electric'], 8, 'water', 'Jasmine', 'Líder de Olivo', 208, 1),
  R('Monte Nevado', [2, 1], ['ice', 'water', 'ground'], 7, 'rocks', 'Pryce', 'Líder de Caoba', 221, 1),
  R('Ruta Dragón', [2, 1], ['dragon', 'water', 'flying'], 5, 'crystals', 'Clair', 'Líder de Endrino', 230, 1),
  R('Cueva Oscura', [2, 1], ['psychic', 'dark', 'ghost'], 4, 'tombs', 'Will', 'Alto Mando de Johto', 178, 2),
  R('Túnel Unión', [2, 1], ['poison', 'bug', 'flying'], 9, 'trees', 'Koga', 'Alto Mando de Johto', 169, 2),
  R('Monte Mortero', [2, 1], ['fighting', 'rock', 'ground'], 1, 'rocks', 'Bruno', 'Alto Mando de Johto', 107, 2),
  R('Ruta Oscura', [2, 1], ['dark', 'ghost', 'ice'], 4, 'tombs', 'Karen', 'Alto Mando de Johto', 197, 2),
  R('Salón de Johto', [2, 1], ['dragon', 'flying', 'fire'], 13, 'crystals', 'Lance', 'Campeón de Johto', 6, 3),
  R('Torre Remolino', [2, 1], ['psychic', 'flying', 'water'], 11, 'crystals', 'Lugia', 'Pokémon legendario', 249, 4),
  // ---------- HOENN ----------
  R('Ruta 102', [3, 2], ['normal', 'bug', 'grass'], 12, 'trees', 'Roxanne', 'Líder de Petalia', 299, 1),
  R('Cueva Granito', [3, 2], ['rock', 'fighting', 'dark'], 1, 'rocks', 'Brawly', 'Líder de Férrica', 297, 1),
  R('Ruta 110', [3, 2], ['electric', 'normal', 'bug'], 13, 'pylons', 'Wattson', 'Líder de Malvalona', 310, 1),
  R('Monte Cenizo', [3, 2], ['fire', 'ground', 'rock'], 10, 'rocks', 'Flannery', 'Líder de Lavacalda', 324, 1),
  R('Bosque Petalia', [3, 2], ['normal', 'grass', 'psychic'], 9, 'trees', 'Norman', 'Líder de Petalia', 289, 1),
  R('Ruta 119', [3, 2], ['flying', 'grass', 'water'], 9, 'trees', 'Winona', 'Líder de Arborada', 334, 1),
  R('Ciudad Mosaico', [3, 2], ['psychic', 'rock', 'fairy'], 11, 'crystals', 'Tate y Liza', 'Líderes de Algaria', 338, 1),
  R('Arrecife Algaria', [3, 2], ['water', 'ice', 'dragon'], 8, 'water', 'Juan', 'Líder de Algaria', 342, 1),
  R('Sala Oscura', [3, 2], ['dark', 'ghost', 'poison'], 4, 'tombs', 'Sidney', 'Alto Mando de Hoenn', 359, 2),
  R('Monte Pira', [3, 2], ['ghost', 'fire', 'psychic'], 4, 'tombs', 'Phoebe', 'Alto Mando de Hoenn', 354, 2),
  R('Cueva Helada', [3, 2], ['ice', 'water', 'ground'], 7, 'rocks', 'Glacia', 'Alto Mando de Hoenn', 365, 2),
  R('Cumbre Dragón', [3, 2], ['dragon', 'flying', 'rock'], 5, 'crystals', 'Drake', 'Alto Mando de Hoenn', 373, 2),
  R('Salón de Hoenn', [3, 2], ['steel', 'rock', 'psychic'], 13, 'crystals', 'Steven', 'Campeón de Hoenn', 376, 3),
  R('Cueva Marina', [3, 2], ['water', 'ice', 'dragon'], 2, 'water', 'Kyogre', 'Pokémon legendario', 382, 4),
  // ---------- SINNOH ----------
  R('Ruta 201', [4, 3], ['normal', 'flying', 'bug'], 12, 'trees', 'Roark', 'Líder de gimnasio de Sinnoh', 409, 1),
  R('Bosque Vetusta', [4, 3], ['grass', 'bug', 'poison'], 0, 'trees', 'Gardenia', 'Líder de gimnasio de Sinnoh', 407, 1),
  R('Mina Pirita', [4, 3], ['fighting', 'rock', 'steel'], 1, 'rocks', 'Maylene', 'Líder de gimnasio de Sinnoh', 448, 1),
  R('Lago Veraz', [4, 3], ['water', 'normal', 'flying'], 8, 'water', 'Crasher Wake', 'Líder de gimnasio de Sinnoh', 419, 1),
  R('Ruta 213', [4, 3], ['ghost', 'psychic', 'dark'], 4, 'tombs', 'Fantina', 'Líder de gimnasio de Sinnoh', 426, 1),
  R('Cueva Ferrosa', [4, 3], ['steel', 'rock', 'ground'], 1, 'rocks', 'Byron', 'Líder de gimnasio de Sinnoh', 411, 1),
  R('Monte Corona', [4, 3], ['ice', 'water', 'rock'], 7, 'rocks', 'Candice', 'Líder de gimnasio de Sinnoh', 460, 1),
  R('Central Voltaje', [4, 3], ['electric', 'steel', 'normal'], 13, 'pylons', 'Volkner', 'Líder de gimnasio de Sinnoh', 405, 1),
  R('Salón Insecto', [4, 3], ['bug', 'grass', 'dark'], 9, 'trees', 'Aaron', 'Alto Mando de Sinnoh', 469, 2),
  R('Salón Tierra', [4, 3], ['ground', 'rock', 'fire'], 6, 'rocks', 'Bertha', 'Alto Mando de Sinnoh', 450, 2),
  R('Salón Fuego', [4, 3], ['fire', 'fighting', 'steel'], 10, 'rocks', 'Flint', 'Alto Mando de Sinnoh', 392, 2),
  R('Salón Psíquico', [4, 3], ['psychic', 'ghost', 'fairy'], 4, 'tombs', 'Lucian', 'Alto Mando de Sinnoh', 65, 2),
  R('Cueva Campeona', [4, 3], ['dragon', 'ground', 'steel'], 5, 'crystals', 'Cynthia', 'Campeona de Sinnoh', 445, 3),
  R('Pilar Lanza', [4, 3], ['dragon', 'steel', 'psychic'], 11, 'crystals', 'Dialga', 'Pokémon legendario', 483, 4),
  // ---------- TESELIA ----------
  R('Ruta 1 de Teselia', [5, 4], ['normal', 'grass', 'bug'], 12, 'trees', 'Cilan', 'Líder de gimnasio de Teselia', 512, 1),
  R('Bosque Árida', [5, 4], ['normal', 'ground', 'fighting'], 6, 'rocks', 'Lenora', 'Líder de gimnasio de Teselia', 505, 1),
  R('Túnel Cristal', [5, 4], ['bug', 'rock', 'grass'], 9, 'trees', 'Burgh', 'Líder de gimnasio de Teselia', 545, 1),
  R('Ciudad Electro', [5, 4], ['electric', 'steel', 'normal'], 13, 'pylons', 'Elesa', 'Líder de gimnasio de Teselia', 596, 1),
  R('Desierto Resol', [5, 4], ['ground', 'rock', 'dark'], 6, 'rocks', 'Clay', 'Líder de gimnasio de Teselia', 530, 1),
  R('Puente Skyarrow', [5, 4], ['flying', 'normal', 'water'], 11, 'crystals', 'Skyla', 'Líder de gimnasio de Teselia', 581, 1),
  R('Cueva Helada Teselia', [5, 4], ['ice', 'water', 'fighting'], 7, 'rocks', 'Brycen', 'Líder de gimnasio de Teselia', 614, 1),
  R('Valle Dragón', [5, 4], ['dragon', 'ground', 'ghost'], 5, 'crystals', 'Drayden', 'Líder de gimnasio de Teselia', 612, 1),
  R('Sala Fantasma', [5, 4], ['ghost', 'psychic', 'dark'], 4, 'tombs', 'Shauntal', 'Alto Mando de Teselia', 563, 2),
  R('Sala Siniestra', [5, 4], ['dark', 'fighting', 'bug'], 4, 'tombs', 'Grimsley', 'Alto Mando de Teselia', 553, 2),
  R('Sala Psíquica', [5, 4], ['psychic', 'fairy', 'normal'], 11, 'crystals', 'Caitlin', 'Alto Mando de Teselia', 579, 2),
  R('Sala Lucha', [5, 4], ['fighting', 'rock', 'normal'], 1, 'rocks', 'Marshal', 'Alto Mando de Teselia', 534, 2),
  R('Palacio N', [5, 4], ['fire', 'bug', 'dragon'], 13, 'crystals', 'Alder', 'Campeón de Teselia', 637, 3),
  R('Torre Dragonspiral', [5, 4], ['dragon', 'electric', 'dark'], 5, 'crystals', 'Zekrom', 'Pokémon legendario', 644, 4),
  // ---------- KALOS ----------
  R('Ruta 2 de Kalos', [6, 5], ['bug', 'normal', 'flying'], 12, 'trees', 'Viola', 'Líder de gimnasio de Kalos', 666, 1),
  R('Cueva Fósil', [6, 5], ['rock', 'ice', 'dragon'], 7, 'rocks', 'Grant', 'Líder de gimnasio de Kalos', 699, 1),
  R('Ruta Combate', [6, 5], ['fighting', 'flying', 'normal'], 1, 'rocks', 'Korrina', 'Líder de gimnasio de Kalos', 701, 1),
  R('Prado Floral', [6, 5], ['grass', 'normal', 'fairy'], 12, 'trees', 'Ramos', 'Líder de gimnasio de Kalos', 673, 1),
  R('Ciudad Luminalia', [6, 5], ['electric', 'steel', 'psychic'], 13, 'pylons', 'Clemont', 'Líder de gimnasio de Kalos', 695, 1),
  R('Jardín Hada', [6, 5], ['fairy', 'psychic', 'normal'], 11, 'crystals', 'Valerie', 'Líder de gimnasio de Kalos', 700, 1),
  R('Bosque Psico', [6, 5], ['psychic', 'ghost', 'dark'], 4, 'tombs', 'Olympia', 'Líder de gimnasio de Kalos', 678, 1),
  R('Pico Ventisca', [6, 5], ['ice', 'rock', 'water'], 7, 'rocks', 'Wulfric', 'Líder de gimnasio de Kalos', 713, 1),
  R('Salón Fuego Kalos', [6, 5], ['fire', 'dark', 'normal'], 10, 'rocks', 'Malva', 'Alto Mando de Kalos', 663, 2),
  R('Salón Agua Kalos', [6, 5], ['water', 'ice', 'poison'], 2, 'water', 'Siebold', 'Alto Mando de Kalos', 693, 2),
  R('Salón Fantasma Kalos', [6, 5], ['ghost', 'steel', 'dark'], 4, 'tombs', 'Wikstrom', 'Alto Mando de Kalos', 681, 2),
  R('Salón Dragón Kalos', [6, 5], ['dragon', 'flying', 'fairy'], 5, 'crystals', 'Drasna', 'Alto Mando de Kalos', 706, 2),
  R('Torre Maestra', [6, 5], ['psychic', 'fairy', 'fighting'], 13, 'crystals', 'Diantha', 'Campeona de Kalos', 282, 3),
  R('Árbol Vida', [6, 5], ['fairy', 'grass', 'flying'], 11, 'crystals', 'Xerneas', 'Pokémon legendario', 716, 4),
  // ---------- ALOLA ----------
  R('Ruta 1 de Alola', [7, 6], ['normal', 'bug', 'water'], 15, 'trees', 'Raticate Tótem', 'Pokémon Tótem', 20, 1),
  R('Pradera Wailord', [7, 6], ['water', 'normal', 'fairy'], 8, 'water', 'Wishiwashi Tótem', 'Pokémon Tótem', 746, 1),
  R('Isla Poni Ruta', [7, 6], ['poison', 'dark', 'fire'], 15, 'trees', 'Salazzle Tótem', 'Pokémon Tótem', 758, 1),
  R('Jardín Lurantis', [7, 6], ['grass', 'bug', 'fairy'], 9, 'trees', 'Lurantis Tótem', 'Pokémon Tótem', 754, 1),
  R('Central Tapu', [7, 6], ['electric', 'bug', 'steel'], 13, 'pylons', 'Vikavolt Tótem', 'Pokémon Tótem', 738, 1),
  R('Mansión Thrifty', [7, 6], ['ghost', 'dark', 'psychic'], 4, 'tombs', 'Mimikyu Tótem', 'Pokémon Tótem', 778, 1),
  R('Cueva Ula-Ula', [7, 6], ['dragon', 'fighting', 'rock'], 10, 'rocks', 'Kommo-o Tótem', 'Pokémon Tótem', 784, 1),
  R('Playa Poni', [7, 6], ['bug', 'fairy', 'flying'], 8, 'water', 'Ribombee Tótem', 'Pokémon Tótem', 743, 1),
  R('Salón Hala', [7, 6], ['fighting', 'rock', 'normal'], 15, 'rocks', 'Hala', 'Alto Mando de Alola', 297, 2),
  R('Salón Olivia', [7, 6], ['rock', 'ground', 'fairy'], 1, 'rocks', 'Olivia', 'Alto Mando de Alola', 745, 2),
  R('Salón Acerola', [7, 6], ['ghost', 'steel', 'fire'], 4, 'tombs', 'Acerola', 'Alto Mando de Alola', 770, 2),
  R('Salón Kahili', [7, 6], ['flying', 'fire', 'fighting'], 11, 'crystals', 'Kahili', 'Alto Mando de Alola', 741, 2),
  R('Cima Poni', [7, 6], ['fire', 'dark', 'normal'], 10, 'crystals', 'Kukui', 'Campeón de Alola', 727, 3),
  R('Altar del Sol', [7, 6], ['psychic', 'steel', 'fire'], 11, 'crystals', 'Solgaleo', 'Pokémon legendario', 791, 4),
  // ---------- GALAR ----------
  R('Ruta 1 de Galar', [8, 7], ['normal', 'grass', 'bug'], 16, 'trees', 'Milo', 'Líder de gimnasio de Galar', 830, 1),
  R('Costa Turffield', [8, 7], ['water', 'rock', 'normal'], 8, 'water', 'Nessa', 'Líder de gimnasio de Galar', 834, 1),
  R('Mina Galar', [8, 7], ['fire', 'rock', 'steel'], 10, 'rocks', 'Kabu', 'Líder de gimnasio de Galar', 851, 1),
  R('Páramo Stow', [8, 7], ['fighting', 'steel', 'normal'], 16, 'rocks', 'Bea', 'Líder de gimnasio de Galar', 865, 1),
  R('Valle Ghost', [8, 7], ['ghost', 'fairy', 'dark'], 4, 'tombs', 'Opal', 'Líder de gimnasio de Galar', 869, 1),
  R('Cantera Gordie', [8, 7], ['rock', 'fire', 'ground'], 1, 'rocks', 'Gordie', 'Líder de gimnasio de Galar', 689, 1),
  R('Ventisca Circhester', [8, 7], ['ice', 'water', 'psychic'], 7, 'rocks', 'Melony', 'Líder de gimnasio de Galar', 131, 1),
  R('Estadio Wyndon', [8, 7], ['dragon', 'steel', 'flying'], 13, 'crystals', 'Raihan', 'Líder de gimnasio de Galar', 884, 1),
  R('Salón Marnie', [8, 7], ['dark', 'electric', 'poison'], 16, 'rocks', 'Marnie', 'Alto Mando de Galar', 877, 2),
  R('Salón Bede', [8, 7], ['fairy', 'psychic', 'dark'], 11, 'crystals', 'Bede', 'Alto Mando de Galar', 858, 2),
  R('Salón Hop', [8, 7], ['grass', 'water', 'fire'], 12, 'trees', 'Hop', 'Alto Mando de Galar', 818, 2),
  R('Salón Piers', [8, 7], ['dark', 'poison', 'fighting'], 4, 'tombs', 'Piers', 'Alto Mando de Galar', 861, 2),
  R('Estadio Final', [8, 7], ['fire', 'dragon', 'flying'], 13, 'crystals', 'Leon', 'Campeón de Galar', 6, 3),
  R('Torre Corona', [8, 7], ['fairy', 'steel', 'psychic'], 11, 'crystals', 'Zacian', 'Pokémon legendario', 888, 4),
  // ---------- PALDEA ----------
  R('Pradera Sur', [9, 8], ['normal', 'bug', 'grass'], 12, 'trees', 'Katy', 'Líder de gimnasio de Paldea', 920, 1),
  R('Vergel Cascarrabias', [9, 8], ['grass', 'rock', 'normal'], 12, 'trees', 'Brassius', 'Líder de gimnasio de Paldea', 185, 1),
  R('Ciudad Electrónica', [9, 8], ['electric', 'steel', 'normal'], 13, 'pylons', 'Iono', 'Líder de gimnasio de Paldea', 939, 1),
  R('Glaseado', [9, 8], ['water', 'ice', 'fighting'], 7, 'rocks', 'Kofu', 'Líder de gimnasio de Paldea', 740, 1),
  R('Desierto Tulipán', [9, 8], ['fire', 'ground', 'flying'], 6, 'rocks', 'Larry', 'Líder de gimnasio de Paldea', 22, 1),
  R('Fábrica Poison', [9, 8], ['poison', 'electric', 'ghost'], 9, 'trees', 'Ryme', 'Líder de gimnasio de Paldea', 849, 1),
  R('Cumbre Psico', [9, 8], ['psychic', 'fairy', 'normal'], 11, 'crystals', 'Tulip', 'Líder de gimnasio de Paldea', 981, 1),
  R('Glaseado Norte', [9, 8], ['ice', 'dragon', 'water'], 7, 'rocks', 'Grusha', 'Líder de gimnasio de Paldea', 975, 1),
  R('Salón Rika', [9, 8], ['ground', 'poison', 'dark'], 6, 'rocks', 'Rika', 'Alto Mando de Paldea', 980, 2),
  R('Salón Poppy', [9, 8], ['steel', 'fairy', 'normal'], 13, 'crystals', 'Poppy', 'Alto Mando de Paldea', 959, 2),
  R('Salón Larry', [9, 8], ['normal', 'flying', 'fire'], 11, 'crystals', 'Larry (Alto Mando)', 'Alto Mando de Paldea', 398, 2),
  R('Salón Hassel', [9, 8], ['dragon', 'ice', 'flying'], 5, 'crystals', 'Hassel', 'Alto Mando de Paldea', 998, 2),
  R('Academia Naranja', [9, 8], ['rock', 'ghost', 'fire'], 13, 'crystals', 'Geeta', 'Campeona de Paldea', 970, 3),
  R('Área Cero', [9, 8], ['fighting', 'dragon', 'psychic'], 5, 'crystals', 'Koraidon', 'Pokémon legendario', 1007, 4),
  // ---------- MÁS ALLÁ ----------
  R('Monte Plateado', [1, 2, 3], ['normal', 'fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'ghost'], 7, 'rocks', 'Rojo', 'El mejor entrenador', 25, 5),
  R('Cueva Ancestral', [3, 4, 2], ['fire', 'ground', 'dragon', 'rock'], 10, 'rocks', 'Groudon', 'Pokémon legendario', 383, 5),
  R('Pilar Celeste', [3, 4, 5], ['dragon', 'flying', 'psychic'], 11, 'crystals', 'Rayquaza', 'Guardián del cielo', 384, 5),
  R('Espacio Profundo', [3, 4, 5], ['psychic', 'steel', 'ghost', 'dark'], 5, 'crystals', 'Deoxys', 'Visitante del espacio', 386, 5),
  R('Mundo Distorsión', [4, 5, 6], ['ghost', 'dragon', 'dark', 'psychic'], 4, 'tombs', 'Giratina', 'Señor del Mundo Distorsión', 487, 5),
  R('Hacia el Infinito', [7, 8, 9], ['dragon', 'dark', 'poison', 'steel'], 5, 'crystals', 'Eternatus', 'Amenaza cósmica', 890, 5),
  R('Corona Helada', [8, 9, 5], ['ice', 'ghost', 'psychic', 'fairy'], 7, 'rocks', 'Calyrex', 'Rey de la Corona', 898, 5),
  R('Sala del Origen', [4, 6, 7, 8, 9], ['normal', 'fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'dragon', 'ghost', 'steel'], 11, 'crystals', 'Arceus', 'Creador de todo', 493, 5),
];

// Poké Balls del gacha. rates = probabilidad de cada rareza (1..5)
// gen = solo Pokémon de esa región · banner = tiene destacados (50% al sacar épico/legendario)
const BALLS = {
  poke: { name: 'Poké Ball', icon: 'ball', ticket: 'poke', rates: [0, 62, 28, 9, 1, 0], desc: 'La más común. Los tickets Poké se compran con monedas.' },
  super: { name: 'Super Ball', icon: 'ball2', ticket: 'super', rates: [0, 30, 38, 24, 7, 1], desc: 'Más Pokémon raros y épicos.' },
  ultra: { name: 'Ultra Ball', icon: 'ball3', ticket: 'ultra', rates: [0, 0, 25, 50, 21, 4], desc: 'Nunca sale un común. 4% de legendario.' },
  banner: { name: 'Bola Destacada', icon: 'ballLux', ticket: 'ultra', rates: [0, 0, 30, 44, 21, 5], banner: 1, desc: 'Tiene Pokémon destacados: la mitad de las veces que salga épico o legendario será uno de ellos. Si pierdes el 50/50 de un legendario, el siguiente es el destacado seguro.' },
  region1: { name: 'Bola Kanto', icon: 'ball', ticket: 'super', gen: 1, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Kanto.' },
  region2: { name: 'Bola Johto', icon: 'ballJ', ticket: 'super', gen: 2, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Johto.' },
  region3: { name: 'Bola Hoenn', icon: 'ballH', ticket: 'super', gen: 3, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Hoenn.' },
  region4: { name: 'Bola Sinnoh', icon: 'ballR4', ticket: 'super', gen: 4, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Sinnoh.' },
  region5: { name: 'Bola Teselia', icon: 'ballR5', ticket: 'super', gen: 5, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Teselia.' },
  region6: { name: 'Bola Kalos', icon: 'ballR6', ticket: 'super', gen: 6, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Kalos.' },
  region7: { name: 'Bola Alola', icon: 'ballR7', ticket: 'super', gen: 7, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Alola.' },
  region8: { name: 'Bola Galar', icon: 'ballR8', ticket: 'super', gen: 8, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Galar.' },
  region9: { name: 'Bola Paldea', icon: 'ballR9', ticket: 'super', gen: 9, region: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Paldea.' },
  event: { name: 'Bola del Evento', icon: 'ballLux', ticket: 'super', rates: [0, 26, 38, 26, 8, 2], event: 1, desc: 'Solo Pokémon del tipo de la semana. Al salir épico o legendario, la mitad de las veces es el destacado del evento.' },
  master: { name: 'Bola Maestra', icon: 'ball4', ticket: 'master', rates: [0, 0, 0, 0, 72, 28], desc: 'Siempre épico o legendario: 28% de legendario.' },
};
// Los gachas se abren con tickets. Se consiguen en combate, misiones y logros, o se compran (monedas o gemas).
const TICKETS = {
  poke: { name: 'Ticket Poké', icon: 'tkPoke', cur: 'coins', color: '#ff5f6d' },
  super: { name: 'Ticket Super', icon: 'tkSuper', cur: 'gems', gems: 30, color: '#4fb4ff' },
  ultra: { name: 'Ticket Ultra', icon: 'tkUltra', cur: 'gems', gems: 90, color: '#ffd23f' },
  master: { name: 'Ticket Maestro', icon: 'tkMaster', cur: 'gems', gems: 250, color: '#c47bff' },
};
const TICKET_DUST = { poke: 40, super: 150, ultra: 450, master: 1500 };   // polvo estelar por ticket
const BOSS_TICKETS = [null, { poke: 2, super: 1 }, { poke: 3, super: 2 }, { super: 3, ultra: 1 }, { super: 2, ultra: 2 }, { ultra: 3, master: 1 }];
const DAILY_TICKETS = [{ poke: 2 }, { poke: 2 }, { poke: 3 }, { poke: 3, super: 1 }, { poke: 4 }, { poke: 4, super: 1 }, { super: 2, ultra: 1 }];
const PITY = 90;       // tiradas con gemas hasta un legendario garantizado
const PITY_EPIC = 25;  // y hasta un épico garantizado
const SHINY_RATE = 1 / 100;

// Mejoras que se compran con monedas (se pierden al entrar en la Liga)
const UPGRADES = {
  tap: { name: 'Golpe de Entrenador', icon: 'fist', base: 25, mul: 1.2, max: 999, desc: n => 'Cada toque hace un ' + (15 + n) + '% del daño/s del equipo' + (n ? ' +' + n * 3 : '') },
  train: { name: 'Entrenamiento', icon: 'up', base: 400, mul: 1.5, max: 999, desc: n => '+' + (n * 10) + '% de daño del equipo' },
  coin: { name: 'Moneda Amuleto', icon: 'amuletcoin', base: 350, mul: 1.62, max: 999, desc: n => '+' + (n * 15) + '% de monedas' },
  crit: { name: 'Lente Zoom', icon: 'zoom', base: 1500, mul: 2.2, max: 20, desc: n => (3 + n * 2) + '% de críticos (x3 de daño)' },
  critdmg: { name: 'Garra Afilada', icon: 'quickclaw', base: 9000, mul: 2.7, max: 15, desc: n => 'Los críticos hacen x' + (3 + n * 0.25).toFixed(2) + ' de daño' },
  speed: { name: 'Banda Veloz', icon: 'choicescarf', base: 6000, mul: 2.7, max: 15, desc: n => '+' + (n * 4) + '% de velocidad de ataque' },
  catch: { name: 'Radar de Tickets', icon: 'tkPoke', base: 12000, mul: 2.5, max: 15, desc: n => (1.5 + n * 0.5).toFixed(1) + '% de que un Pokémon derrotado suelte un ticket' },
  golden: { name: 'Polvo Dorado', icon: 'dust', base: 30000, mul: 2.6, max: 12, desc: n => 'Pokémon dorados: 1 de cada ' + Math.round(1 / (1 / 120 + n * 0.002)) },
  type: { name: 'Afinidad de Tipo', icon: 'stone', base: 15000, mul: 2.6, max: 20, desc: n => 'Los golpes súper eficaces hacen +' + n * 4 + '% más de daño' },
  boss: { name: 'Cazajefes', icon: 'rockyhelmet', base: 6000, mul: 2.2, max: 25, desc: n => '+' + n * 4 + '% de daño contra jefes' },
  autotap: { name: 'Toque Automático', icon: 'up', base: 8000, mul: 2.3, max: 20, desc: n => n ? n * 0.5 + ' toques por segundo sin tocar' : 'Toques automáticos' },
  alch: { name: 'Alquimia', icon: 'dust', base: 20000, mul: 2.5, max: 15, desc: n => '+' + n * 10 + '% de polvo estelar' },
  bosstime: { name: 'Cronómetro', icon: 'clock', base: 20000, mul: 2.4, max: 10, desc: n => '+' + n * 3 + ' s para vencer a los jefes' },
};
const SLOT_COST = [0, 150, 3e3, 1e5, 2e7, 1.5e10];

// Habilidades activas (sin coste, con enfriamiento)
const SKILLS = {
  rage: { name: 'Furia', icon: 'fist', dur: 15, cd: 120, desc: 'x3 de daño del equipo durante 15 s.' },
  gold: { name: 'Fiebre del Oro', icon: 'amuletcoin', dur: 20, cd: 150, desc: 'x3 de monedas durante 20 s.' },
  lure: { name: 'Lluvia de Tickets', icon: 'tkSuper', dur: 15, cd: 100, desc: 'x6 de probabilidad de soltar tickets durante 15 s.' },
};

// Tienda de la Liga: se compra con Puntos de Liga (se ganan al entrar en la Liga) y no se pierde nunca
const LEAGUE_SHOP = {
  dmg: { name: 'Entrenamiento de Élite', icon: 'fist', base: 2, mul: 1.5, max: 50, desc: n => '+' + n * 6 + '% de daño' },
  coins: { name: 'Bolsillos Hondos', icon: 'coin', base: 2, mul: 1.5, max: 50, desc: n => '+' + n * 6 + '% de monedas' },
  lvl: { name: 'Mochila de Caramelos', icon: 'candy', base: 3, mul: 1.7, max: 10, desc: n => 'Tras la Liga empiezas con +' + n * 2 + ' niveles' },
  slots: { name: 'Equipo de Campeón', icon: 'friends', base: 5, mul: 2.5, max: 4, desc: n => 'Tras la Liga conservas ' + (2 + n) + ' huecos' },
  offline: { name: 'Campamento', icon: 'clock', base: 3, mul: 1.8, max: 8, desc: n => 'Ganancias offline: hasta ' + (8 + n * 2) + ' h al ' + (50 + n * 5) + '%' },
  catch: { name: 'Radar de Tickets', icon: 'tkSuper', base: 3, mul: 1.7, max: 10, desc: n => '+' + (n * 0.4).toFixed(1) + '% de tickets soltados' },
  shiny: { name: 'Brillo Eterno', icon: 'shiny', base: 6, mul: 1.9, max: 10, desc: n => 'Shinies x' + (1 + n * 0.2).toFixed(1) + ' más frecuentes' },
  gems: { name: 'Buscagemas', icon: 'gem', base: 4, mul: 1.7, max: 10, desc: n => '+' + n * 10 + '% de gemas de jefes y misiones' },
  skill: { name: 'Maestro de Habilidades', icon: 'fist', base: 4, mul: 1.8, max: 10, desc: n => 'Habilidades: -' + n * 4 + '% de enfriamiento y +' + n * 2 + ' s de duración' },
  dust: { name: 'Alquimista', icon: 'dust', base: 4, mul: 1.7, max: 10, desc: n => '+' + n * 15 + '% de polvo estelar' },
  tapd: { name: 'Puño de Hierro', icon: 'fist', base: 3, mul: 1.6, max: 20, desc: n => '+' + n * 10 + '% de daño por toque' },
  critb: { name: 'Ojo de Águila', icon: 'zoom', base: 5, mul: 1.9, max: 10, desc: n => '+' + n + '% de probabilidad de crítico' },
  egg: { name: 'Calor de Incubación', icon: 'egg0', base: 3, mul: 1.6, max: 10, desc: n => 'Los huevos necesitan un ' + n * 5 + '% menos de victorias' },
  disc: { name: 'Descuento de Entrenador', icon: 'coin', base: 4, mul: 1.8, max: 10, desc: n => 'Poké Ball de monedas -' + n * 4 + '% de precio' },
  bt: { name: 'Reloj de Arena', icon: 'clock', base: 5, mul: 1.9, max: 10, desc: n => '+' + n * 2 + ' s para vencer a los jefes' },
};

const DAILY_REWARD = [20, 25, 30, 40, 50, 60, 120];
// stat = estadística que cuenta · goal = objetivo · reward = gemas
const QUEST_POOL = [
  { stat: 'kills', goal: 300, reward: 12, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'kills', goal: 1000, reward: 25, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'kills', goal: 2500, reward: 40, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'taps', goal: 200, reward: 12, text: n => 'Toca ' + n + ' veces a los enemigos' },
  { stat: 'taps', goal: 600, reward: 25, text: n => 'Toca ' + n + ' veces a los enemigos' },
  { stat: 'levels', goal: 50, reward: 15, text: n => 'Sube ' + n + ' niveles a tus Pokémon' },
  { stat: 'levels', goal: 200, reward: 30, text: n => 'Sube ' + n + ' niveles a tus Pokémon' },
  { stat: 'pulls', goal: 3, reward: 15, text: n => 'Abre ' + n + ' Poké Balls' },
  { stat: 'pulls', goal: 10, reward: 30, text: n => 'Abre ' + n + ' Poké Balls' },
  { stat: 'bosses', goal: 2, reward: 20, text: n => 'Vence a ' + n + ' jefes' },
  { stat: 'bosses', goal: 5, reward: 40, text: n => 'Vence a ' + n + ' jefes' },
  { stat: 'catches', goal: 2, reward: 18, text: n => 'Consigue ' + n + ' tickets en combate' },
  { stat: 'stages', goal: 10, reward: 15, text: n => 'Supera ' + n + ' etapas' },
  { stat: 'stages', goal: 30, reward: 30, text: n => 'Supera ' + n + ' etapas' },
  { stat: 'skills', goal: 2, reward: 12, text: n => 'Usa ' + n + ' habilidades activas' },
  { stat: 'evolutions', goal: 1, reward: 20, text: n => 'Evoluciona ' + n + ' Pokémon' },
  { stat: 'crits', goal: 150, reward: 15, text: n => 'Haz ' + n + ' golpes críticos' },
  { stat: 'crits', goal: 800, reward: 30, text: n => 'Haz ' + n + ' golpes críticos' },
  { stat: 'goldens', goal: 1, reward: 20, text: n => 'Derrota ' + n + ' Pokémon dorado' },
  { stat: 'dustBuys', goal: 1, reward: 25, text: n => 'Canjea polvo estelar por ' + n + ' ticket' },
  { stat: 'coinsTotal', goal: 1e4, reward: 12, text: n => 'Gana ' + n + ' monedas' },
];
const WEEKLY_POOL = [
  { stat: 'kills', goal: 12000, reward: 120, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'bosses', goal: 25, reward: 120, text: n => 'Vence a ' + n + ' jefes' },
  { stat: 'pulls', goal: 40, reward: 150, text: n => 'Abre ' + n + ' Poké Balls' },
  { stat: 'taps', goal: 4000, reward: 100, text: n => 'Toca ' + n + ' veces a los enemigos' },
  { stat: 'levels', goal: 1500, reward: 130, text: n => 'Sube ' + n + ' niveles a tus Pokémon' },
  { stat: 'stages', goal: 150, reward: 140, text: n => 'Supera ' + n + ' etapas' },
  { stat: 'catches', goal: 25, reward: 120, text: n => 'Consigue ' + n + ' tickets en combate' },
  { stat: 'skills', goal: 20, reward: 90, text: n => 'Usa ' + n + ' habilidades activas' },
  { stat: 'crits', goal: 5000, reward: 110, text: n => 'Haz ' + n + ' golpes críticos' },
  { stat: 'goldens', goal: 10, reward: 130, text: n => 'Derrota ' + n + ' Pokémon dorados' },
  { stat: 'evolutions', goal: 12, reward: 110, text: n => 'Evoluciona ' + n + ' Pokémon' },
  { stat: 'dust', goal: 800, reward: 100, text: n => 'Consigue ' + n + ' de polvo estelar' },
];

// Logros generados por escalones: [estadística, nombre, icono, [[objetivo, gemas], ...], plantilla]
const ACH_DEFS = [
  ['maxStage', 'Camino de la Liga', 'boot', [[10, 20], [25, 25], [50, 35], [75, 45], [100, 60], [140, 80], [200, 100], [280, 130], [350, 160], [420, 200], [500, 220], [600, 260], [700, 300], [850, 350], [1000, 400], [1150, 450], [1300, 500], [1500, 600]], n => 'Llega a la etapa ' + n],
  ['kills', 'Cazador', 'fist', [[1e3, 20], [1e4, 40], [5e4, 70], [2.5e5, 120], [1e6, 200], [5e6, 300], [1e8, 500]], n => 'Derrota ' + n + ' Pokémon'],
  ['taps', 'Dedo ágil', 'up', [[500, 15], [5e3, 30], [5e4, 80], [5e5, 200]], n => 'Toca ' + n + ' veces'],
  ['pulls', 'Lluvia de Balls', 'ball', [[10, 15], [50, 30], [100, 50], [250, 80], [500, 120], [1000, 200], [2500, 300], [5000, 500]], n => 'Abre ' + n + ' Poké Balls'],
  ['dex', 'Pokédex', 'book', [[10, 20], [25, 25], [50, 40], [100, 70], [150, 100], [200, 130], [250, 160], [300, 200], [386, 300], [500, 250], [600, 280], [700, 320], [800, 360], [900, 400], [1025, 1500]], n => 'Registra ' + n + ' Pokémon'],
  ['evolutions', 'Evolución', 'star', [[1, 15], [15, 40], [50, 70], [150, 120], [400, 200], [1000, 400]], n => 'Evoluciona ' + n + ' veces'],
  ['shinies', 'Brillante', 'shiny', [[1, 50], [3, 70], [10, 120], [25, 250], [50, 400], [100, 700]], n => 'Consigue ' + n + ' shinies'],
  ['maxStars', 'Estrellas', 'star', [[1, 15], [3, 40], [5, 100]], n => 'Lleva un Pokémon a ★' + n],
  ['prestiges', 'Nuevo viaje', 'crown', [[1, 100], [3, 120], [5, 150], [10, 250], [25, 400], [50, 600], [100, 1000]], n => 'Entra ' + n + ' veces en la Liga'],
  ['bosses', 'Rompe-líderes', 'trophy', [[10, 25], [50, 60], [150, 120], [500, 250], [1000, 450], [2500, 800]], n => 'Vence a ' + n + ' jefes'],
  ['catches', 'Recolector de tickets', 'tkPoke', [[5, 15], [25, 40], [100, 80], [500, 200], [1000, 350], [2500, 600]], n => 'Consigue ' + n + ' tickets en combate'],
  ['legends', 'Leyendas', 'trophy', [[1, 40], [5, 100], [10, 180], [20, 350], [40, 600], [80, 1000]], n => 'Ten ' + n + ' legendarios'],
  ['levels', 'Entrenamiento', 'up', [[100, 15], [1000, 35], [1e4, 80], [1e5, 200], [1e6, 400]], n => 'Sube ' + n + ' niveles en total'],
  ['coinsTotal', 'Millonario', 'coin', [[1e6, 20], [1e9, 50], [1e12, 100], [1e15, 200], [1e18, 400]], n => 'Gana ' + n + ' monedas en total'],
  ['skills', 'Habilidoso', 'fist', [[10, 15], [100, 50], [500, 120]], n => 'Usa ' + n + ' habilidades'],
  ['itemsFound', 'Buscaobjetos', 'choiceband', [[1, 15], [10, 40], [50, 100], [200, 250]], n => 'Consigue ' + n + ' objetos'],
  ['dust', 'Polvo de estrellas', 'dust', [[100, 15], [1000, 50], [10000, 150], [1e5, 400]], n => 'Consigue ' + n + ' de polvo estelar'],
  ['crits', 'Golpe certero', 'zoom', [[1e3, 20], [1e4, 50], [1e5, 120], [1e6, 300]], n => 'Haz ' + n + ' críticos'],
  ['goldens', 'Fiebre del oro', 'amuletcoin', [[1, 20], [10, 50], [50, 120], [200, 300]], n => 'Derrota ' + n + ' Pokémon dorados'],
  ['dustBuys', 'Trueque', 'dust', [[1, 20], [10, 60], [50, 200]], n => 'Canjea polvo estelar por ' + n + ' tickets'],
  ['freePulls', 'Constancia', 'ball', [[7, 30], [30, 100], [100, 300]], n => 'Abre ' + n + ' tiradas diarias gratis'],
  ['streak', 'Racha', 'clock', [[7, 40], [14, 80], [30, 200], [60, 400], [100, 800]], n => 'Racha de ' + n + ' días seguidos'],
  ['stars5', 'Constelación', 'star', [[1, 60], [5, 150], [20, 400], [50, 900]], n => 'Ten ' + n + ' Pokémon con ★5'],
  ['maxLvl', 'Nivel máximo', 'up', [[50, 20], [100, 40], [200, 80], [300, 150], [500, 300], [800, 600]], n => 'Lleva un Pokémon a Nv. ' + n],
  ['upMax', 'Mejorado al máximo', 'fist', [[1, 40], [3, 100], [6, 250], [13, 600]], n => 'Lleva ' + n + ' mejoras al nivel máximo'],
  ['shopLvl', 'Veterano de la Liga', 'crown', [[1, 30], [10, 80], [50, 250], [150, 700]], n => 'Compra ' + n + ' niveles en la tienda de la Liga'],
  ['regions', 'Viajero', 'boot', [[2, 40], [3, 60], [5, 150], [7, 300], [9, 600]], n => 'Abre ' + n + ' regiones'],
  ['hatched', 'Criador', 'egg0', [[1, 20], [10, 50], [50, 120], [200, 300], [1000, 700]], n => 'Eclosiona ' + n + ' huevos'],
  ['eggsFound', 'Coleccionista de huevos', 'egg1', [[5, 25], [25, 70], [100, 200]], n => 'Encuentra ' + n + ' huevos'],
  ['ivGood', 'Buen potencial', 'star', [[1, 30], [10, 100], [50, 250]], n => 'Ten ' + n + ' Pokémon con IVs del 90% o más'],
  ['ivPerfect', 'Perfeccionista', 'star', [[1, 60], [5, 150], [20, 400]], n => 'Ten ' + n + ' Pokémon con IVs perfectos (31/31/31)'],
  ['ivUps', 'Mejores genes', 'up', [[1, 15], [25, 60], [100, 150]], n => 'Mejora los IVs de tus Pokémon ' + n + ' veces con copias repetidas'],
  ['tower', 'Escalador', 'crown', [[5, 25], [10, 50], [20, 100], [30, 150], [50, 300], [75, 500], [100, 800]], n => 'Llega al piso ' + n + ' de la Torre'],
  ['eventTiers', 'Cazador de eventos', 'trophy', [[1, 30], [10, 100], [40, 300], [100, 700]], n => 'Vence ' + n + ' veces al jefe de un evento'],
  ['bred', 'Guardería', 'egg2', [[1, 20], [10, 60], [50, 150], [200, 400]], n => 'Cría ' + n + ' huevos en la guardería'],
  ['slots', 'Equipo completo', 'friends', [[3, 20], [6, 100]], n => 'Abre ' + n + ' huecos de equipo'],
];
// Colecciones por tipo
const TYPE_NAMES = { normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada' };
for (const t of Object.keys(TYPE_NAMES)) ACH_DEFS.push(['type:' + t, 'Maestro ' + TYPE_NAMES[t], 'star', [[5, 15], [15, 40], [30, 100]], n => 'Ten ' + n + ' Pokémon de tipo ' + TYPE_NAMES[t]]);
// Pokédex regional completa
for (const r of REGIONS) if (r.gen) ACH_DEFS.push(['regionDex:' + r.gen, 'Pokédex de ' + r.name, 'book', [[POKEDEX.filter(p => p.gen === r.gen).length, 60 + 25 * r.gen]], n => 'Registra los ' + n + ' Pokémon de ' + r.name]);
const abbr = n => { const S = ['', ' mil', ' M', ' mil M', ' B', ' mil B', ' T']; let i = 0; if (n >= 1e6) { n /= 1e6; i = 2; while (n >= 1000 && i < 6) { n /= 1000; i++; } } else if (n >= 1000) { n /= 1000; i = 1; } return n + S[i]; };
const ACHIEVEMENTS = [];
for (const [stat, name, icon, tiers, tpl] of ACH_DEFS) {
  tiers.forEach(([goal, reward], i) => ACHIEVEMENTS.push({ id: stat + goal, stat, goal, reward, icon, name: name + (tiers.length > 1 ? ' ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'][i] : ''), desc: tpl(abbr(goal)) }));
}
// Logros de jefes importantes
for (const [id, name, stage, reward] of [['b130', 'Campeón de Kanto', 131, 120], ['b270', 'Campeón de Johto', 271, 160], ['b410', 'Campeón de Hoenn', 411, 220], ['b550', 'Campeona de Sinnoh', 551, 260], ['b690', 'Campeón de Teselia', 691, 300], ['b830', 'Campeona de Kalos', 831, 340], ['b970', 'Campeón de Alola', 971, 380], ['b1110', 'Campeón de Galar', 1111, 420], ['b1250', 'Campeona de Paldea', 1251, 460], ['b1330', 'Rey del mundo', 1331, 800]]) {
  ACHIEVEMENTS.push({ id, stat: 'maxStage', goal: stage, reward, icon: 'crown', name, desc: 'Vence al último jefe de la región' });
}

// Ataques que van mejorando con el nivel del Pokémon: [id de MOVES] por tipo, uno por escalón
const TIER_LV = [1, 15, 40, 80, 140];
const TIER_MULT = [1, 1.15, 1.35, 1.6, 2];
const MOVE_TIERS = {
  normal: ['placaje', 'ataque_rapido', 'golpe_cuerpo', 'hiperrayo', 'giga_impacto'],
  fire: ['ascuas', 'lanzallamas', 'envite_igneo', 'llamarada', 'erupcion'],
  water: ['pistola_agua', 'burbuja', 'cascada', 'hidrobomba', 'surf'],
  grass: ['latigo_cepa', 'hoja_afilada', 'drenadoras', 'rayo_solar', 'lluevehojas'],
  electric: ['impactrueno', 'chispazo', 'rayo', 'trueno', 'voltio_cruel'],
  ice: ['canto_helado', 'nieve_polvo', 'rayo_hielo', 'ventisca', 'cero_absoluto'],
  fighting: ['golpe_karate', 'patada_baja', 'esfera_aural', 'a_bocajarro', 'puno_dinamico'],
  poison: ['acido', 'picotazo_ven', 'bomba_lodo', 'puas_toxicas', 'lanzamugre'],
  ground: ['disparo_lodo', 'huesomerang', 'excavar', 'terremoto', 'fisura'],
  flying: ['picotazo', 'ataque_ala', 'golpe_aereo', 'tornado', 'pajaro_osado'],
  psychic: ['confusion', 'psicorrayo', 'psicocorte', 'psiquico', 'premonicion'],
  bug: ['picadura', 'zumbido', 'tijera_x', 'disparo_demora', 'megacuerno'],
  rock: ['lanzarrocas', 'roca_afilada', 'avalancha', 'tumba_rocas', 'poder_pasado'],
  ghost: ['lenguetazo', 'bola_sombra', 'tinieblas', 'garra_umbria', 'golpe_fantasma'],
  dragon: ['furia_dragon', 'dragoaliento', 'cometa_draco', 'garra_dragon', 'ultraje'],
  dark: ['mordisco', 'pulso_umbrio', 'triturar', 'juego_sucio', 'vendetta'],
  steel: ['garra_metal', 'bomba_iman', 'cabeza_hierro', 'foco_resplandor', 'ala_de_acero'],
  fairy: ['viento_feerico', 'brillo_magico', 'fuerza_lunar', 'beso_drenaje', 'explosion_magica'],
};
// Ataques nuevos (solo datos de aspecto: clase, tipo y potencia orientativa)
if (typeof MOVES !== 'undefined') {
  const nm = (id, name, type, cls, pow) => { if (!MOVES[id]) MOVES[id] = { name, type, cls, pow, cd: 1, cat: 'e' }; };
  nm('giga_impacto', 'Giga Impacto', 'normal', 'meteor', 150); nm('envite_igneo', 'Envite Ígneo', 'fire', 'dash', 120); nm('erupcion', 'Erupción', 'fire', 'meteor', 150);
  nm('cascada', 'Cascada', 'water', 'dash', 80); nm('lluevehojas', 'Lluevehojas', 'grass', 'burst', 130); nm('voltio_cruel', 'Voltio Cruel', 'electric', 'dash', 90);
  nm('cero_absoluto', 'Cero Absoluto', 'ice', 'beam', 150); nm('puno_dinamico', 'Puño Dinámico', 'fighting', 'melee', 150); nm('lanzamugre', 'Lanzamugre', 'poison', 'proj', 120);
  nm('fisura', 'Fisura', 'ground', 'meteor', 150); nm('pajaro_osado', 'Pájaro Osado', 'flying', 'dash', 120); nm('premonicion', 'Premonición', 'psychic', 'meteor', 120);
  nm('megacuerno', 'Megacuerno', 'bug', 'melee', 120); nm('tumba_rocas', 'Tumba Rocas', 'rock', 'fan', 60); nm('poder_pasado', 'Poder Pasado', 'rock', 'burst', 90);
  nm('garra_umbria', 'Garra Umbría', 'ghost', 'melee', 70); nm('golpe_fantasma', 'Golpe Fantasma', 'ghost', 'proj', 90); nm('garra_dragon', 'Garra Dragón', 'dragon', 'melee', 80);
  nm('ultraje', 'Ultraje', 'dragon', 'burst', 120); nm('triturar', 'Triturar', 'dark', 'melee', 80); nm('juego_sucio', 'Juego Sucio', 'dark', 'proj', 95);
  nm('vendetta', 'Vendetta', 'dark', 'burst', 120); nm('foco_resplandor', 'Foco Resplandor', 'steel', 'beam', 80); nm('ala_de_acero', 'Ala de Acero', 'steel', 'melee', 70);
  nm('beso_drenaje', 'Beso Drenaje', 'fairy', 'proj', 50); nm('explosion_magica', 'Explosión Mágica', 'fairy', 'meteor', 130);
}

// ---------- Objetos equipables: cada Pokémon lleva uno ----------
const KOFI_URL = 'https://ko-fi.com/danelalonso';
const ITEM_RAR = [null,
  { name: 'Común', mult: 1, color: '#b9c1cc', dust: 20 },
  { name: 'Raro', mult: 1.6, color: '#4fb4ff', dust: 60 },
  { name: 'Épico', mult: 2.5, color: '#c47bff', dust: 180 },
];
// fx: dmg · dmgslow · spd · crit · boss · type · coins (equipo) · drop (equipo) · tap (equipo)
const HELD = {
  cinta: { name: 'Cinta Elección', icon: 'choiceband', fx: 'dmg', v: 0.2, desc: v => '+' + Math.round(v * 100) + '% de daño al que la lleva' },
  vidasfera: { name: 'Vidasfera', icon: 'lifeorb', fx: 'dmgslow', v: 0.35, desc: v => '+' + Math.round(v * 100) + '% de daño, pero -10% de velocidad' },
  panuelo: { name: 'Pañuelo Elección', icon: 'choicescarf', fx: 'spd', v: 0.1, desc: v => '+' + Math.round(v * 100) + '% de velocidad de ataque' },
  zoom: { name: 'Gafas Zoom', icon: 'zoom', fx: 'crit', v: 0.06, desc: v => '+' + Math.round(v * 100) + '% de probabilidad de crítico' },
  banda: { name: 'Banda Focus', icon: 'focussash', fx: 'boss', v: 0.3, desc: v => '+' + Math.round(v * 100) + '% de daño contra jefes' },
  orbe: { name: 'Orbe de tipo', icon: 'stone', fx: 'type', v: 0.4, desc: (v, it) => '+' + Math.round(v * 100) + '% de daño si es de tipo ' + TYPE_NAMES[it.type] + ' (+' + Math.round(v * 20) + '% si no)' },
  moneda: { name: 'Moneda Amuleto', icon: 'amuletcoin', fx: 'coins', v: 0.08, desc: v => '+' + Math.round(v * 100) + '% de monedas para todo el equipo' },
  cascabel: { name: 'Cascabel Fortuna', icon: 'bell', fx: 'drop', v: 0.1, desc: v => '+' + Math.round(v * 100) + '% de tickets soltados (equipo)' },
  guante: { name: 'Guante de Entrenador', icon: 'fist', fx: 'tap', v: 0.1, desc: v => '+' + Math.round(v * 100) + '% de daño por toque (equipo)' },
};
const ITEM_DROPS = [[92, 8, 0], [70, 28, 2], [45, 45, 10], [20, 55, 25], [5, 50, 45], [0, 30, 70]];   // [silvestre, jefe T1..T5]: reparto Común/Raro/Épico
const ITEM_DUST_COST = 150;
// Sinergias de equipo
const TYPE_SYN = [0, 0, 0.08, 0.2, 0.35, 0.55, 0.8];

// ---------------- naturalezas, IVs y huevos ----------------
// Cinco ejes (como las estadísticas de los juegos): Ataque → Daño, Velocidad → Velocidad, At. Esp. → Crítico, Defensa → Botín, Def. Esp. → Jefes.
const NAT_AXES = { dmg: 'Daño', spd: 'Velocidad', crit: 'Crítico', coin: 'Botín', boss: 'Jefes' };
const NAT_SHORT = { dmg: 'Daño', spd: 'Vel.', crit: 'Crít.', coin: 'Botín', boss: 'Jefes' };
const NAT_GAIN = { dmg: 0.10, spd: 0.08, crit: 0.03, coin: 0.04, boss: 0.10 };   // el eje que sube; el que baja pierde la mitad
const NATURES = (() => {
  const A = ['dmg', 'coin', 'crit', 'boss', 'spd'];                               // fila = eje que sube, columna = eje que baja (diagonal = neutra)
  const names = [
    ['Fuerte', 'Huraña', 'Firme', 'Pícara', 'Audaz'],
    ['Osada', 'Dócil', 'Agitada', 'Floja', 'Plácida'],
    ['Modesta', 'Afable', 'Tímida', 'Alocada', 'Mansa'],
    ['Serena', 'Amable', 'Cauta', 'Rara', 'Grosera'],
    ['Miedosa', 'Activa', 'Alegre', 'Ingenua', 'Seria'],
  ];
  const out = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) out.push({ id: out.length, name: names[i][j], up: i === j ? null : A[i], down: i === j ? null : A[j] });
  return out;
})();
const IV_MAX = 31, IV_EFF = { d: 0.10, s: 0.05, c: 0.02 };                       // daño +10%, velocidad +5%, crítico +2% con IV 31
const IV_NAMES = { d: 'Daño', s: 'Velocidad', c: 'Crítico' };
const IV_GRADES = [[1, 'Perfecto', '#ffd23f'], [0.9, 'Excelente', '#ff8ad8'], [0.75, 'Muy bueno', '#7ff0a0'], [0.55, 'Bueno', '#9fe0ff'], [0.35, 'Normal', '#c9c9d8'], [0, 'Bajo', '#9aa3c0']];
const IV_TRAIN_STEP = 3, ivTrainCost = iv => 15 + 3 * iv;                        // polvo por +3 a un IV
const NAT_REROLL_COST = 60, NAT_CHOOSE_COST = 450;                                // polvo
const IV_FLOOR = { poke: 0, super: 4, ultra: 8, master: 14 };                     // IV mínimo según el ticket del gacha

const EGGS = [
  { name: 'Huevo común', need: 600, rates: [0, 55, 32, 11, 2, 0], floor: 0, color: '#d8e8b0', gems: 150, dust: 60, desc: 'Como una Poké Ball: casi siempre común o raro.' },
  { name: 'Huevo raro', need: 1500, rates: [0, 0, 50, 38, 11, 1], floor: 8, color: '#7fc8ff', gems: 450, dust: 150, desc: 'Nunca sale un común. IVs de al menos 8.' },
  { name: 'Huevo épico', need: 3500, rates: [0, 0, 0, 60, 36, 4], floor: 16, color: '#c47bff', gems: 1300, dust: 350, desc: 'Raro o mejor, IVs de al menos 16.' },
  { name: 'Huevo legendario', need: 8000, rates: [0, 0, 0, 0, 66, 34], floor: 24, color: '#ffd23f', gems: 4000, dust: 800, desc: 'Épico o legendario, IVs de al menos 24.' },
];
const EGG_CAP = 10, EGG_SHINY = 1.5, EGG_WILD_DROP = 0.0008;                      // máximo de huevos, brillo extra y probabilidad por victoria
const EGG_BOSS = [null, 0, 1, 1, 2, 3];                                           // huevo de la primera victoria contra un jefe según su categoría
const EGG_WILD_TIER = [70, 25, 5];                                                // % de huevo común/raro/épico al caer uno
const INC_COST = [0, 0, 150, 600, 2400];                                          // gemas por incubadora (1.ª gratis)

// ---------------- eventos semanales y Torre de batalla ----------------
// Cada semana cambia el tipo protagonista (18 semanas por ciclo) y un bonus general (cada 5 semanas se repite).
const EVENT_TYPES = ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal'];
const EVENT_BONUS_ORDER = ['shiny', 'eggs', 'coins', 'dust', 'tickets'];
const EVENT_BONUS = {
  shiny: { name: 'Semana brillante', txt: 'Los shinies son el doble de frecuentes' },
  eggs: { name: 'Semana de cría', txt: 'Los huevos avanzan el doble de rápido' },
  coins: { name: 'Semana dorada', txt: '+50% de monedas' },
  dust: { name: 'Semana estelar', txt: 'El doble de polvo estelar' },
  tickets: { name: 'Semana de tickets', txt: '+50% de tickets soltados' },
};
const EVENT_DMG = 0.25;                                   // daño extra de los Pokémon del tipo de la semana
// jefe del evento: vida = vida de un Pokémon salvaje en tu etapa máxima × hp
const EVENT_TIERS = [
  { name: 'Fácil', hp: 3, time: 45, rew: { gems: 20, tk: { super: 2 } } },
  { name: 'Normal', hp: 7, time: 50, rew: { gems: 40, tk: { ultra: 1 }, egg: 0 } },
  { name: 'Difícil', hp: 16, time: 55, rew: { gems: 80, tk: { ultra: 2 }, egg: 1 } },
  { name: 'Extremo', hp: 40, time: 60, rew: { gems: 160, tk: { ultra: 2, master: 1 }, egg: 2 } },
];
const EVENT_TASKS = [
  { id: 'k1', stat: 'kills', goal: 150, rew: { tk: { super: 2 } }, text: (n, t) => 'Derrota ' + n + ' Pokémon de tipo ' + t },
  { id: 'k2', stat: 'kills', goal: 600, rew: { tk: { ultra: 1 }, egg: 0 }, text: (n, t) => 'Derrota ' + n + ' Pokémon de tipo ' + t },
  { id: 'p1', stat: 'pulls', goal: 10, rew: { tk: { ultra: 1 }, egg: 1 }, text: n => 'Abre ' + n + ' Bolas del Evento' },
];
const TOWER_UNLOCK = 10;                                  // etapa máxima necesaria
const TOWER_HP0 = 2.5, TOWER_G = 1.07, TOWER_TIME = 40, TOWER_BOSS_X = 1.5, TOWER_BONUS = 0.003;   // vida piso 1 (× salvaje), crecimiento por piso, segundos, guardián, daño por piso récord
const TOWER_RULES = [
  { id: 'noitems', name: 'Sin objetos', desc: 'Los objetos equipados no funcionan' },
  { id: 'nosyn', name: 'Sin sinergias', desc: 'Las sinergias de equipo están desactivadas' },
  { id: 'only', name: 'Solo del tipo', desc: 'Los Pokémon de otro tipo hacen la mitad de daño' },
  { id: 'nocrit', name: 'Sin críticos', desc: 'No hay golpes críticos' },
  { id: 'fast', name: 'Contrarreloj', desc: 'La mitad de tiempo, pero un 45% menos de vida', hp: 0.55, time: 0.5 },
  { id: 'armor', name: 'Armadura', desc: '+60% de vida y +40% de tiempo', hp: 1.6, time: 1.4 },
];

// ---------------- crianza ----------------
// Dos Pokémon (el principal da la especie) dejan un huevo con IVs heredados. El huevo es del tipo que corresponde a la rareza más alta de la pareja.
const BREED_COST = [0, 30, 60, 120, 300, 700];            // polvo estelar según la rareza más alta
const BREED_EGG = [0, 0, 0, 1, 2, 3];                      // tipo de huevo (EGGS) según esa rareza
const BREED_HI = 0.7, BREED_BONUS = 2;                     // probabilidad de heredar el mejor IV de los dos, y bonus aleatorio 0..2
