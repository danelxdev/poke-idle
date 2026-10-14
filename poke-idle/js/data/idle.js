// Datos de PokéIdle: rarezas, rutas, líderes, Poké Balls, mejoras, misiones y logros.
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
const EVO_LVL = [20, 45];                       // niveles de evolución (1.ª y 2.ª)
const RARITY_FIX = { 25: 3, 113: 3, 132: 2, 143: 4 };

// Cada ruta dura 10 etapas; la 10.ª es el jefe (líder de gimnasio, Alto Mando…)
// biome = índice de Tiles.THEMES · deco = lo que adorna el borde superior
const ROUTES = [
  { name: 'Ruta 1', types: ['normal', 'flying'], biome: 0, top: 'trees', boss: { who: 'Brock', title: 'Líder de Plateada', dex: 95 } },
  { name: 'Bosque Verde', types: ['bug', 'grass'], biome: 0, top: 'trees', boss: { who: 'Misty', title: 'Líder de Celeste', dex: 121 } },
  { name: 'Monte Moon', types: ['rock', 'ground', 'fairy'], biome: 1, top: 'rocks', boss: { who: 'Lt. Surge', title: 'Líder de Carmín', dex: 26 } },
  { name: 'Ruta 24', types: ['water', 'normal', 'poison'], biome: 2, top: 'water', boss: { who: 'Erika', title: 'Líder de Azulona', dex: 45 } },
  { name: 'Túnel Roca', types: ['rock', 'ground', 'fighting'], biome: 1, top: 'rocks', boss: { who: 'Koga', title: 'Líder de Fucsia', dex: 110 } },
  { name: 'Torre Pokémon', types: ['ghost', 'poison', 'psychic'], biome: 4, top: 'tombs', boss: { who: 'Sabrina', title: 'Líder de Azafrán', dex: 65 } },
  { name: 'Central Energía', types: ['electric', 'steel', 'normal'], biome: 3, top: 'pylons', boss: { who: 'Blaine', title: 'Líder de Canela', dex: 59 } },
  { name: 'Islas Espuma', types: ['water', 'ice'], biome: 2, top: 'water', boss: { who: 'Giovanni', title: 'Líder de Verde', dex: 112 } },
  { name: 'Isla Canela', types: ['fire', 'poison', 'normal'], biome: 5, top: 'rocks', boss: { who: 'Lorelei', title: 'Alto Mando', dex: 131 } },
  { name: 'Calle Victoria', types: ['fighting', 'rock', 'ground'], biome: 1, top: 'rocks', boss: { who: 'Bruno', title: 'Alto Mando', dex: 68 } },
  { name: 'Meseta Añil', types: ['psychic', 'ghost', 'poison'], biome: 4, top: 'tombs', boss: { who: 'Agatha', title: 'Alto Mando', dex: 94 } },
  { name: 'Sala del Dragón', types: ['dragon', 'flying', 'water'], biome: 5, top: 'crystals', boss: { who: 'Lance', title: 'Alto Mando', dex: 149 } },
  { name: 'Sala del Campeón', types: ['fire', 'water', 'grass', 'psychic'], biome: 5, top: 'crystals', boss: { who: 'Azul', title: 'Campeón', dex: 9 } },
  { name: 'Cueva Celeste', types: ['psychic', 'ice', 'electric', 'fire'], biome: 5, top: 'crystals', boss: { who: 'Mewtwo', title: 'Pokémon legendario', dex: 150 } },
];

// Poké Balls del gacha. rates = probabilidad de cada rareza (1..5)
const BALLS = {
  poke: { name: 'Poké Ball', icon: 'ball', cur: 'coins', rates: [0, 62, 28, 9, 1, 0], desc: 'Se compra con monedas. Su precio sube con tu progreso.' },
  super: { name: 'Super Ball', icon: 'ball2', cur: 'gems', price: 30, rates: [0, 30, 38, 24, 7, 1], desc: 'Más Pokémon raros y épicos.' },
  ultra: { name: 'Ultra Ball', icon: 'ball3', cur: 'gems', price: 90, rates: [0, 0, 25, 50, 21, 4], desc: 'Nunca sale un común. 4% de legendario.' },
};
const PITY = 80;      // tiradas con gemas hasta un legendario garantizado
const SHINY_RATE = 1 / 150;

const UPGRADES = {
  tap: { name: 'Golpe de Entrenador', icon: 'fist', base: 12, mul: 1.16, max: 999, desc: n => 'Cada toque hace un ' + (15 + n) + '% del daño/s del equipo' + (n ? ' +' + n * 3 : '') },
  train: { name: 'Entrenamiento', icon: 'up', base: 150, mul: 1.42, max: 999, desc: n => '+' + (n * 10) + '% de daño del equipo' },
  coin: { name: 'Moneda Amuleto', icon: 'amuletcoin', base: 120, mul: 1.55, max: 999, desc: n => '+' + (n * 15) + '% de monedas' },
  crit: { name: 'Lente Zoom', icon: 'star', base: 400, mul: 2.1, max: 20, desc: n => (3 + n * 2) + '% de críticos (x3 de daño)' },
  speed: { name: 'Garra Rápida', icon: 'quickclaw', base: 2500, mul: 2.6, max: 15, desc: n => '+' + (n * 4) + '% de velocidad de ataque' },
  catch: { name: 'Super Caña', icon: 'berry', base: 5000, mul: 2.4, max: 15, desc: n => (1.5 + n * 0.5).toFixed(1) + '% de capturar Pokémon salvajes' },
};
const SLOT_COST = [0, 100, 2500, 6e4, 2e6, 8e7];

const DAILY_REWARD = [20, 25, 30, 40, 50, 60, 120];
const QUEST_POOL = [
  { stat: 'kills', goal: 250, reward: 15, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'kills', goal: 800, reward: 30, text: n => 'Derrota ' + n + ' Pokémon salvajes' },
  { stat: 'taps', goal: 300, reward: 15, text: n => 'Toca ' + n + ' veces a los enemigos' },
  { stat: 'levels', goal: 60, reward: 20, text: n => 'Sube ' + n + ' niveles a tus Pokémon' },
  { stat: 'pulls', goal: 5, reward: 20, text: n => 'Abre ' + n + ' Poké Balls' },
  { stat: 'bosses', goal: 3, reward: 25, text: n => 'Vence a ' + n + ' jefes' },
  { stat: 'catches', goal: 3, reward: 20, text: n => 'Captura ' + n + ' Pokémon salvajes' },
];
const ACHIEVEMENTS = [
  { id: 'st10', stat: 'maxStage', goal: 10, reward: 20, name: 'Primera medalla', desc: 'Llega a la etapa 10' },
  { id: 'st25', stat: 'maxStage', goal: 25, reward: 30, name: 'Aprendiz', desc: 'Llega a la etapa 25' },
  { id: 'st50', stat: 'maxStage', goal: 50, reward: 50, name: 'Entrenador', desc: 'Llega a la etapa 50' },
  { id: 'st80', stat: 'maxStage', goal: 80, reward: 80, name: 'Ocho medallas', desc: 'Llega a la etapa 80' },
  { id: 'st130', stat: 'maxStage', goal: 130, reward: 150, name: 'Campeón', desc: 'Llega a la etapa 130' },
  { id: 'st200', stat: 'maxStage', goal: 200, reward: 250, name: 'Leyenda', desc: 'Llega a la etapa 200' },
  { id: 'dex10', stat: 'dex', goal: 10, reward: 20, name: 'Coleccionista', desc: 'Registra 10 Pokémon' },
  { id: 'dex30', stat: 'dex', goal: 30, reward: 40, name: 'Investigador', desc: 'Registra 30 Pokémon' },
  { id: 'dex60', stat: 'dex', goal: 60, reward: 70, name: 'Profesor', desc: 'Registra 60 Pokémon' },
  { id: 'dex100', stat: 'dex', goal: 100, reward: 120, name: 'Maestro Pokédex', desc: 'Registra 100 Pokémon' },
  { id: 'dex151', stat: 'dex', goal: 151, reward: 500, name: '¡Hazte con todos!', desc: 'Registra los 151 Pokémon' },
  { id: 'k1k', stat: 'kills', goal: 1000, reward: 20, name: 'Mil combates', desc: 'Derrota 1.000 Pokémon' },
  { id: 'k10k', stat: 'kills', goal: 10000, reward: 60, name: 'Imparable', desc: 'Derrota 10.000 Pokémon' },
  { id: 'p10', stat: 'pulls', goal: 10, reward: 15, name: 'Primeras capturas', desc: 'Abre 10 Poké Balls' },
  { id: 'p100', stat: 'pulls', goal: 100, reward: 60, name: 'Lluvia de Balls', desc: 'Abre 100 Poké Balls' },
  { id: 'ev1', stat: 'evolutions', goal: 1, reward: 15, name: '¿Qué? ¡Está evolucionando!', desc: 'Evoluciona a un Pokémon' },
  { id: 'ev15', stat: 'evolutions', goal: 15, reward: 50, name: 'Evolución en cadena', desc: 'Evoluciona 15 veces' },
  { id: 'sh1', stat: 'shinies', goal: 1, reward: 50, name: 'Brillante', desc: 'Consigue un Pokémon shiny' },
  { id: 'star5', stat: 'maxStars', goal: 5, reward: 80, name: 'Cinco estrellas', desc: 'Lleva un Pokémon a ★5' },
  { id: 'pr1', stat: 'prestiges', goal: 1, reward: 100, name: 'Nuevo viaje', desc: 'Entra en la Liga Pokémon por primera vez' },
];
