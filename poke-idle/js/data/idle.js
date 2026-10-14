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
const EVO_LVL = [20, 45];                       // niveles de evolución (1.ª y 2.ª)
const RARITY_FIX = { 172: 3, 113: 3, 132: 2, 143: 4, 236: 2, 238: 2, 239: 2, 240: 2, 298: 2, 360: 3, 174: 2, 175: 3, 173: 2 };

// Regiones: la primera ruta de cada una (cada ruta = 10 etapas, la 10.ª es el jefe)
const REGIONS = [
  { name: 'Kanto', gen: 1, first: 0 },
  { name: 'Johto', gen: 2, first: 14 },
  { name: 'Hoenn', gen: 3, first: 28 },
  { name: 'Más allá', gen: 0, first: 42 },
];
const BOSS_TIER = [null,
  { name: 'Líder', hp: 9, time: 30, gems: 12, scale: 2 },
  { name: 'Alto Mando', hp: 12, time: 35, gems: 20, scale: 2 },
  { name: 'Campeón', hp: 16, time: 40, gems: 35, scale: 2.2 },
  { name: 'Legendario', hp: 22, time: 45, gems: 50, scale: 2.4 },
  { name: 'Jefe final', hp: 30, time: 60, gems: 80, scale: 2.6 },
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
  // ---------- MÁS ALLÁ ----------
  R('Monte Plateado', [1, 2, 3], ['normal', 'fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'ghost'], 7, 'rocks', 'Rojo', 'El mejor entrenador', 25, 5),
  R('Cueva Ancestral', [3, 2], ['fire', 'ground', 'dragon', 'rock'], 10, 'rocks', 'Groudon', 'Pokémon legendario', 383, 5),
  R('Pilar Celeste', [3, 2], ['dragon', 'flying', 'psychic'], 11, 'crystals', 'Rayquaza', 'Guardián del cielo', 384, 5),
  R('Espacio Profundo', [3, 2, 1], ['psychic', 'steel', 'ghost', 'dark'], 5, 'crystals', 'Deoxys', 'Visitante del espacio', 386, 5),
];

// Poké Balls del gacha. rates = probabilidad de cada rareza (1..5)
// gen = solo Pokémon de esa región · banner = tiene destacados (50% al sacar épico/legendario)
const BALLS = {
  poke: { name: 'Poké Ball', icon: 'ball', cur: 'coins', rates: [0, 62, 28, 9, 1, 0], desc: 'Se compra con monedas. Su precio sube con tu progreso.' },
  super: { name: 'Super Ball', icon: 'ball2', cur: 'gems', price: 30, rates: [0, 30, 38, 24, 7, 1], desc: 'Más Pokémon raros y épicos.' },
  ultra: { name: 'Ultra Ball', icon: 'ball3', cur: 'gems', price: 90, rates: [0, 0, 25, 50, 21, 4], desc: 'Nunca sale un común. 4% de legendario.' },
  banner: { name: 'Bola Destacada', icon: 'ballLux', cur: 'gems', price: 60, rates: [0, 0, 30, 44, 21, 5], banner: 1, desc: 'Tiene Pokémon destacados: la mitad de las veces que salga épico o legendario será uno de ellos. Si pierdes el 50/50 de un legendario, el siguiente es el destacado seguro.' },
  kanto: { name: 'Bola Kanto', icon: 'ball', cur: 'gems', price: 24, gen: 1, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Kanto.' },
  johto: { name: 'Bola Johto', icon: 'ballJ', cur: 'gems', price: 24, gen: 2, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Johto.' },
  hoenn: { name: 'Bola Hoenn', icon: 'ballH', cur: 'gems', price: 24, gen: 3, rates: [0, 26, 38, 26, 8, 2], desc: 'Solo Pokémon de Hoenn.' },
  master: { name: 'Bola Maestra', icon: 'ball4', cur: 'gems', price: 250, rates: [0, 0, 0, 0, 72, 28], desc: 'Siempre épico o legendario: 28% de legendario.' },
};
const PITY = 90;       // tiradas con gemas hasta un legendario garantizado
const PITY_EPIC = 25;  // y hasta un épico garantizado
const SHINY_RATE = 1 / 150;

// Mejoras que se compran con monedas (se pierden al entrar en la Liga)
const UPGRADES = {
  tap: { name: 'Golpe de Entrenador', icon: 'fist', base: 25, mul: 1.2, max: 999, desc: n => 'Cada toque hace un ' + (15 + n) + '% del daño/s del equipo' + (n ? ' +' + n * 3 : '') },
  train: { name: 'Entrenamiento', icon: 'up', base: 400, mul: 1.5, max: 999, desc: n => '+' + (n * 10) + '% de daño del equipo' },
  coin: { name: 'Moneda Amuleto', icon: 'amuletcoin', base: 350, mul: 1.62, max: 999, desc: n => '+' + (n * 15) + '% de monedas' },
  crit: { name: 'Lente Zoom', icon: 'zoom', base: 1500, mul: 2.2, max: 20, desc: n => (3 + n * 2) + '% de críticos (x3 de daño)' },
  critdmg: { name: 'Garra Afilada', icon: 'quickclaw', base: 9000, mul: 2.7, max: 15, desc: n => 'Los críticos hacen x' + (3 + n * 0.25).toFixed(2) + ' de daño' },
  speed: { name: 'Banda Veloz', icon: 'choicescarf', base: 6000, mul: 2.7, max: 15, desc: n => '+' + (n * 4) + '% de velocidad de ataque' },
  catch: { name: 'Super Caña', icon: 'berry', base: 12000, mul: 2.5, max: 15, desc: n => (1.5 + n * 0.5).toFixed(1) + '% de capturar Pokémon salvajes' },
  golden: { name: 'Polvo Dorado', icon: 'dust', base: 30000, mul: 2.6, max: 12, desc: n => 'Pokémon dorados: 1 de cada ' + Math.round(1 / (1 / 120 + n * 0.002)) },
  bosstime: { name: 'Cronómetro', icon: 'clock', base: 20000, mul: 2.4, max: 10, desc: n => '+' + n * 3 + ' s para vencer a los jefes' },
};
const SLOT_COST = [0, 600, 2e5, 2e9, 5e12, 1e17];

// Habilidades activas (sin coste, con enfriamiento)
const SKILLS = {
  rage: { name: 'Furia', icon: 'fist', dur: 15, cd: 120, desc: 'x3 de daño del equipo durante 15 s.' },
  gold: { name: 'Fiebre del Oro', icon: 'amuletcoin', dur: 20, cd: 150, desc: 'x3 de monedas durante 20 s.' },
  lure: { name: 'Señuelo', icon: 'berry', dur: 15, cd: 100, desc: 'x6 de probabilidad de captura durante 15 s.' },
};

// Tienda de la Liga: se compra con Puntos de Liga (se ganan al entrar en la Liga) y no se pierde nunca
const LEAGUE_SHOP = {
  dmg: { name: 'Entrenamiento de Élite', icon: 'fist', base: 2, mul: 1.5, max: 50, desc: n => '+' + n * 6 + '% de daño' },
  coins: { name: 'Bolsillos Hondos', icon: 'coin', base: 2, mul: 1.5, max: 50, desc: n => '+' + n * 6 + '% de monedas' },
  lvl: { name: 'Mochila de Caramelos', icon: 'candy', base: 3, mul: 1.7, max: 15, desc: n => 'Tras la Liga empiezas con +' + n * 3 + ' niveles' },
  slots: { name: 'Equipo de Campeón', icon: 'friends', base: 5, mul: 2.5, max: 4, desc: n => 'Tras la Liga conservas ' + (2 + n) + ' huecos' },
  offline: { name: 'Campamento', icon: 'clock', base: 3, mul: 1.8, max: 8, desc: n => 'Ganancias offline: hasta ' + (8 + n * 2) + ' h al ' + (50 + n * 5) + '%' },
  catch: { name: 'Radar de Capturas', icon: 'berry', base: 3, mul: 1.7, max: 10, desc: n => '+' + (n * 0.4).toFixed(1) + '% de captura' },
  shiny: { name: 'Brillo Eterno', icon: 'shiny', base: 6, mul: 1.9, max: 10, desc: n => 'Shinies x' + (1 + n * 0.2).toFixed(1) + ' más frecuentes' },
  gems: { name: 'Buscagemas', icon: 'gem', base: 4, mul: 1.7, max: 10, desc: n => '+' + n * 10 + '% de gemas de jefes y misiones' },
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
  { stat: 'catches', goal: 2, reward: 18, text: n => 'Captura ' + n + ' Pokémon salvajes' },
  { stat: 'stages', goal: 10, reward: 15, text: n => 'Supera ' + n + ' etapas' },
  { stat: 'stages', goal: 30, reward: 30, text: n => 'Supera ' + n + ' etapas' },
  { stat: 'skills', goal: 2, reward: 12, text: n => 'Usa ' + n + ' habilidades activas' },
  { stat: 'evolutions', goal: 1, reward: 20, text: n => 'Evoluciona ' + n + ' Pokémon' },
];
const WEEKLY_POOL = [
  { stat: 'kills', goal: 12000, reward: 120, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'bosses', goal: 25, reward: 120, text: n => 'Vence a ' + n + ' jefes' },
  { stat: 'pulls', goal: 40, reward: 150, text: n => 'Abre ' + n + ' Poké Balls' },
  { stat: 'taps', goal: 4000, reward: 100, text: n => 'Toca ' + n + ' veces a los enemigos' },
  { stat: 'levels', goal: 1500, reward: 130, text: n => 'Sube ' + n + ' niveles a tus Pokémon' },
  { stat: 'stages', goal: 150, reward: 140, text: n => 'Supera ' + n + ' etapas' },
  { stat: 'catches', goal: 25, reward: 120, text: n => 'Captura ' + n + ' Pokémon salvajes' },
  { stat: 'skills', goal: 20, reward: 90, text: n => 'Usa ' + n + ' habilidades activas' },
];

// Logros generados por escalones: [estadística, nombre, icono, [[objetivo, gemas], ...], plantilla]
const ACH_DEFS = [
  ['maxStage', 'Camino de la Liga', 'boot', [[10, 20], [25, 25], [50, 35], [75, 45], [100, 60], [140, 80], [200, 100], [280, 130], [350, 160], [420, 200], [460, 250], [600, 300]], n => 'Llega a la etapa ' + n],
  ['kills', 'Cazador', 'fist', [[1e3, 20], [1e4, 40], [5e4, 70], [2.5e5, 120], [1e6, 200]], n => 'Derrota ' + n + ' Pokémon'],
  ['taps', 'Dedo ágil', 'up', [[500, 15], [5e3, 30], [5e4, 80]], n => 'Toca ' + n + ' veces'],
  ['pulls', 'Lluvia de Balls', 'ball', [[10, 15], [50, 30], [100, 50], [250, 80], [500, 120], [1000, 200]], n => 'Abre ' + n + ' Poké Balls'],
  ['dex', 'Pokédex', 'book', [[10, 20], [25, 25], [50, 40], [100, 70], [150, 100], [200, 130], [250, 160], [300, 200], [386, 600]], n => 'Registra ' + n + ' Pokémon'],
  ['evolutions', 'Evolución', 'star', [[1, 15], [15, 40], [50, 70], [150, 120]], n => 'Evoluciona ' + n + ' veces'],
  ['shinies', 'Brillante', 'shiny', [[1, 50], [3, 70], [10, 120], [25, 250]], n => 'Consigue ' + n + ' shinies'],
  ['maxStars', 'Estrellas', 'star', [[1, 15], [3, 40], [5, 100]], n => 'Lleva un Pokémon a ★' + n],
  ['prestiges', 'Nuevo viaje', 'crown', [[1, 100], [3, 120], [5, 150], [10, 250], [25, 400]], n => 'Entra ' + n + ' veces en la Liga'],
  ['bosses', 'Rompe-líderes', 'trophy', [[10, 25], [50, 60], [150, 120], [500, 250]], n => 'Vence a ' + n + ' jefes'],
  ['catches', 'Cazapokémon', 'berry', [[5, 15], [25, 40], [100, 80], [500, 200]], n => 'Captura ' + n + ' Pokémon'],
  ['legends', 'Leyendas', 'trophy', [[1, 40], [5, 100], [10, 180], [21, 400]], n => 'Ten ' + n + ' legendarios'],
  ['levels', 'Entrenamiento', 'up', [[100, 15], [1000, 35], [1e4, 80], [1e5, 200]], n => 'Sube ' + n + ' niveles en total'],
  ['coinsTotal', 'Millonario', 'coin', [[1e6, 20], [1e9, 50], [1e12, 100], [1e15, 200], [1e18, 400]], n => 'Gana ' + n + ' monedas en total'],
  ['skills', 'Habilidoso', 'fist', [[10, 15], [100, 50], [500, 120]], n => 'Usa ' + n + ' habilidades'],
  ['dust', 'Polvo de estrellas', 'dust', [[100, 15], [1000, 50], [10000, 150]], n => 'Consigue ' + n + ' de polvo estelar'],
];
const abbr = n => { const S = ['', ' mil', ' M', ' mil M', ' B', ' mil B', ' T']; let i = 0; if (n >= 1e6) { n /= 1e6; i = 2; while (n >= 1000 && i < 6) { n /= 1000; i++; } } else if (n >= 1000) { n /= 1000; i = 1; } return n + S[i]; };
const ACHIEVEMENTS = [];
for (const [stat, name, icon, tiers, tpl] of ACH_DEFS) {
  tiers.forEach(([goal, reward], i) => ACHIEVEMENTS.push({ id: stat + goal, stat, goal, reward, icon, name: name + ' ' + ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i], desc: tpl(abbr(goal)) }));
}
// Logros de jefes importantes
for (const [id, name, stage, reward] of [['b130', 'Campeón de Kanto', 131, 120], ['b270', 'Campeón de Johto', 271, 160], ['b410', 'Campeón de Hoenn', 411, 220], ['b460', 'Rey del mundo', 461, 400]]) {
  ACHIEVEMENTS.push({ id, stat: 'maxStage', goal: stage, reward, icon: 'crown', name, desc: 'Vence al último jefe de la región' });
}
