// Datos del juego: técnicas por tipo, objetos, zonas y constantes.
'use strict';

const TYPE_COLORS = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', grass: '#78c850', electric: '#f8d030', ice: '#98d8d8',
  fighting: '#c03028', poison: '#a040a0', ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848', steel: '#b8b8d0', fairy: '#ee99ac',
};

// Clases: melee · dash · proj · fan · burst · beam · orbit · aura · boomerang · chain · meteor · mines
// pow = potencia (como en los juegos) · cd = recarga en segundos · cat = 'f' físico / 'e' especial
const MOVES = {
  // Normal
  placaje: { name: 'Placaje', type: 'normal', cls: 'melee', pow: 40, cd: 0.45, range: 26, arc: 1.8, cat: 'f' },
  arañazo: { name: 'Arañazo', type: 'normal', cls: 'melee', pow: 40, cd: 0.4, range: 24, arc: 1.4, cat: 'f' },
  ataque_rapido: { name: 'Ataque Rápido', type: 'normal', cls: 'dash', pow: 50, cd: 1.6, dist: 70, cat: 'f' },
  vozarron: { name: 'Vozarrón', type: 'normal', cls: 'burst', pow: 45, cd: 2.2, count: 10, speed: 140, life: 0.6, cat: 'e' },
  hiperrayo: { name: 'Hiperrayo', type: 'normal', cls: 'beam', pow: 90, cd: 4.5, len: 200, width: 12, dur: 0.6, cat: 'e' },
  golpe_cuerpo: { name: 'Golpe Cuerpo', type: 'normal', cls: 'melee', pow: 85, cd: 1.1, range: 22, arc: 1.6, cat: 'f', status: ['para', 0.25] },
  // Fuego
  ascuas: { name: 'Ascuas', type: 'fire', cls: 'proj', pow: 40, cd: 0.42, speed: 190, size: 3, life: 0.9, cat: 'e', status: ['burn', 0.1] },
  lanzallamas: { name: 'Lanzallamas', type: 'fire', cls: 'fan', pow: 35, cd: 0.9, count: 5, arc: 0.6, speed: 170, life: 0.45, cat: 'e', status: ['burn', 0.15] },
  giro_fuego: { name: 'Giro Fuego', type: 'fire', cls: 'orbit', pow: 30, cd: 4, count: 3, radius: 26, dur: 3, cat: 'e', status: ['burn', 0.2] },
  llamarada: { name: 'Llamarada', type: 'fire', cls: 'proj', pow: 110, cd: 3.2, speed: 130, size: 6, life: 1.6, explode: 30, cat: 'e', status: ['burn', 0.3] },
  // Agua
  pistola_agua: { name: 'Pistola Agua', type: 'water', cls: 'proj', pow: 40, cd: 0.45, speed: 220, size: 3, life: 0.9, pierce: 1, cat: 'e' },
  burbuja: { name: 'Burbuja', type: 'water', cls: 'fan', pow: 35, cd: 0.8, count: 4, arc: 0.7, speed: 110, life: 0.9, cat: 'e', status: ['slow', 0.5] },
  hidrobomba: { name: 'Hidrobomba', type: 'water', cls: 'beam', pow: 110, cd: 3.8, len: 170, width: 14, dur: 0.5, cat: 'e' },
  surf: { name: 'Surf', type: 'water', cls: 'burst', pow: 70, cd: 2.6, count: 14, speed: 160, life: 0.7, cat: 'e' },
  // Planta
  latigo_cepa: { name: 'Látigo Cepa', type: 'grass', cls: 'melee', pow: 45, cd: 0.5, range: 40, arc: 1.0, cat: 'f' },
  hoja_afilada: { name: 'Hoja Afilada', type: 'grass', cls: 'boomerang', pow: 55, cd: 1.0, dist: 110, speed: 200, size: 4, cat: 'f' },
  drenadoras: { name: 'Drenadoras', type: 'grass', cls: 'proj', pow: 30, cd: 1.4, speed: 120, size: 3, life: 1.5, homing: 1, drain: 0.5, cat: 'e' },
  rayo_solar: { name: 'Rayo Solar', type: 'grass', cls: 'beam', pow: 120, cd: 4.5, len: 220, width: 14, dur: 0.6, cat: 'e' },
  // Eléctrico
  impactrueno: { name: 'Impactrueno', type: 'electric', cls: 'proj', pow: 40, cd: 0.4, speed: 260, size: 2, life: 0.8, pierce: 1, cat: 'e', status: ['para', 0.1] },
  chispazo: { name: 'Chispazo', type: 'electric', cls: 'aura', pow: 40, cd: 3.5, radius: 34, dur: 2, cat: 'e', status: ['para', 0.2] },
  rayo: { name: 'Rayo', type: 'electric', cls: 'chain', pow: 70, cd: 1.6, jumps: 3, range: 70, cat: 'e', status: ['para', 0.15] },
  trueno: { name: 'Trueno', type: 'electric', cls: 'meteor', pow: 100, cd: 3.4, count: 3, radius: 18, delay: 0.6, cat: 'e', status: ['para', 0.3] },
  // Hielo
  canto_helado: { name: 'Canto Helado', type: 'ice', cls: 'proj', pow: 40, cd: 0.45, speed: 230, size: 3, life: 0.8, cat: 'f', status: ['slow', 0.4] },
  rayo_hielo: { name: 'Rayo Hielo', type: 'ice', cls: 'beam', pow: 80, cd: 2.8, len: 170, width: 9, dur: 0.5, cat: 'e', status: ['freeze', 0.15] },
  nieve_polvo: { name: 'Nieve Polvo', type: 'ice', cls: 'aura', pow: 30, cd: 3.5, radius: 38, dur: 2.2, cat: 'e', status: ['slow', 0.8] },
  ventisca: { name: 'Ventisca', type: 'ice', cls: 'meteor', pow: 100, cd: 3.8, count: 4, radius: 18, delay: 0.7, cat: 'e', status: ['freeze', 0.2] },
  // Lucha
  golpe_karate: { name: 'Golpe Kárate', type: 'fighting', cls: 'melee', pow: 50, cd: 0.45, range: 24, arc: 1.2, cat: 'f' },
  patada_baja: { name: 'Patada Baja', type: 'fighting', cls: 'melee', pow: 60, cd: 0.8, range: 30, arc: 2.4, cat: 'f', status: ['slow', 0.4] },
  esfera_aural: { name: 'Esfera Aural', type: 'fighting', cls: 'proj', pow: 80, cd: 1.6, speed: 150, size: 5, life: 1.6, homing: 1, cat: 'e' },
  a_bocajarro: { name: 'A Bocajarro', type: 'fighting', cls: 'melee', pow: 120, cd: 2.2, range: 26, arc: 1.6, cat: 'f' },
  // Veneno
  acido: { name: 'Ácido', type: 'poison', cls: 'proj', pow: 40, cd: 0.5, speed: 170, size: 3, life: 0.9, cat: 'e', status: ['poison', 0.2] },
  picotazo_ven: { name: 'Picotazo Veneno', type: 'poison', cls: 'proj', pow: 35, cd: 0.38, speed: 240, size: 2, life: 0.7, cat: 'f', status: ['poison', 0.25] },
  puas_toxicas: { name: 'Púas Tóxicas', type: 'poison', cls: 'mines', pow: 50, cd: 2.4, count: 3, radius: 22, life: 7, cat: 'f', status: ['poison', 0.6] },
  bomba_lodo: { name: 'Bomba Lodo', type: 'poison', cls: 'proj', pow: 90, cd: 2.4, speed: 140, size: 5, life: 1.3, explode: 26, cat: 'e', status: ['poison', 0.3] },
  // Tierra
  disparo_lodo: { name: 'Disparo Lodo', type: 'ground', cls: 'fan', pow: 45, cd: 0.9, count: 3, arc: 0.5, speed: 160, life: 0.7, cat: 'e', status: ['slow', 0.4] },
  huesomerang: { name: 'Huesomerang', type: 'ground', cls: 'boomerang', pow: 60, cd: 1.1, dist: 100, speed: 190, size: 4, cat: 'f' },
  excavar: { name: 'Excavar', type: 'ground', cls: 'dash', pow: 70, cd: 2.0, dist: 80, cat: 'f' },
  terremoto: { name: 'Terremoto', type: 'ground', cls: 'aura', pow: 90, cd: 4.0, radius: 60, dur: 0.6, cat: 'f' },
  // Volador
  picotazo: { name: 'Picotazo', type: 'flying', cls: 'melee', pow: 35, cd: 0.35, range: 26, arc: 0.9, cat: 'f' },
  tornado: { name: 'Tornado', type: 'flying', cls: 'orbit', pow: 40, cd: 4, count: 2, radius: 30, dur: 3.5, cat: 'e' },
  ataque_ala: { name: 'Ataque Ala', type: 'flying', cls: 'melee', pow: 60, cd: 0.7, range: 30, arc: 2.6, cat: 'f' },
  golpe_aereo: { name: 'Golpe Aéreo', type: 'flying', cls: 'dash', pow: 60, cd: 1.5, dist: 90, cat: 'f' },
  // Psíquico
  confusion: { name: 'Confusión', type: 'psychic', cls: 'proj', pow: 50, cd: 0.6, speed: 150, size: 3, life: 1.4, homing: 1, cat: 'e' },
  psicorrayo: { name: 'Psicorrayo', type: 'psychic', cls: 'beam', pow: 65, cd: 2.0, len: 150, width: 10, dur: 0.45, cat: 'e' },
  psiquico: { name: 'Psíquico', type: 'psychic', cls: 'burst', pow: 90, cd: 2.8, count: 12, speed: 150, life: 0.8, cat: 'e' },
  psicocorte: { name: 'Psicocorte', type: 'psychic', cls: 'boomerang', pow: 70, cd: 1.2, dist: 110, speed: 210, size: 4, cat: 'f' },
  // Bicho
  picadura: { name: 'Picadura', type: 'bug', cls: 'melee', pow: 50, cd: 0.42, range: 22, arc: 1.2, cat: 'f' },
  disparo_demora: { name: 'Disparo Demora', type: 'bug', cls: 'mines', pow: 20, cd: 2.0, count: 3, radius: 22, life: 7, cat: 'e', status: ['slow', 0.9] },
  zumbido: { name: 'Zumbido', type: 'bug', cls: 'burst', pow: 60, cd: 2.0, count: 10, speed: 150, life: 0.6, cat: 'e' },
  tijera_x: { name: 'Tijera X', type: 'bug', cls: 'melee', pow: 80, cd: 0.8, range: 28, arc: 2.0, cat: 'f' },
  // Roca
  lanzarrocas: { name: 'Lanzarrocas', type: 'rock', cls: 'proj', pow: 50, cd: 0.6, speed: 170, size: 4, life: 0.9, cat: 'f' },
  avalancha: { name: 'Avalancha', type: 'rock', cls: 'meteor', pow: 75, cd: 2.6, count: 4, radius: 16, delay: 0.6, cat: 'f' },
  roca_afilada: { name: 'Roca Afilada', type: 'rock', cls: 'fan', pow: 60, cd: 1.3, count: 3, arc: 0.4, speed: 200, life: 0.6, cat: 'f' },
  // Fantasma
  lenguetazo: { name: 'Lengüetazo', type: 'ghost', cls: 'melee', pow: 40, cd: 0.45, range: 22, arc: 1.2, cat: 'f', status: ['para', 0.2] },
  bola_sombra: { name: 'Bola Sombra', type: 'ghost', cls: 'proj', pow: 70, cd: 0.9, speed: 140, size: 4, life: 1.6, homing: 1, cat: 'e' },
  tinieblas: { name: 'Tinieblas', type: 'ghost', cls: 'aura', pow: 50, cd: 3.0, radius: 40, dur: 1.6, cat: 'e' },
  // Dragón
  furia_dragon: { name: 'Furia Dragón', type: 'dragon', cls: 'proj', pow: 55, cd: 0.6, speed: 180, size: 4, life: 1.0, cat: 'e' },
  dragoaliento: { name: 'Dragoaliento', type: 'dragon', cls: 'fan', pow: 55, cd: 1.0, count: 5, arc: 0.6, speed: 160, life: 0.5, cat: 'e', status: ['para', 0.15] },
  cometa_draco: { name: 'Cometa Draco', type: 'dragon', cls: 'meteor', pow: 120, cd: 4.0, count: 4, radius: 22, delay: 0.7, cat: 'e' },
  // Siniestro
  mordisco: { name: 'Mordisco', type: 'dark', cls: 'melee', pow: 60, cd: 0.55, range: 22, arc: 1.2, cat: 'f' },
  pulso_umbrio: { name: 'Pulso Umbrío', type: 'dark', cls: 'burst', pow: 80, cd: 2.4, count: 10, speed: 160, life: 0.7, cat: 'e' },
  // Acero
  garra_metal: { name: 'Garra Metal', type: 'steel', cls: 'melee', pow: 50, cd: 0.5, range: 24, arc: 1.4, cat: 'f' },
  bomba_iman: { name: 'Bomba Imán', type: 'steel', cls: 'proj', pow: 60, cd: 0.9, speed: 170, size: 3, life: 1.6, homing: 1, cat: 'f' },
  cabeza_hierro: { name: 'Cabeza de Hierro', type: 'steel', cls: 'dash', pow: 80, cd: 1.8, dist: 80, cat: 'f' },
  // Hada
  viento_feerico: { name: 'Viento Feérico', type: 'fairy', cls: 'fan', pow: 40, cd: 0.8, count: 4, arc: 0.6, speed: 160, life: 0.6, cat: 'e' },
  brillo_magico: { name: 'Brillo Mágico', type: 'fairy', cls: 'burst', pow: 80, cd: 2.4, count: 12, speed: 150, life: 0.7, cat: 'e' },
  fuerza_lunar: { name: 'Fuerza Lunar', type: 'fairy', cls: 'proj', pow: 95, cd: 2.0, speed: 160, size: 5, life: 1.4, explode: 24, cat: 'e' },
};

// técnicas por tipo: [básicas (ataque principal), especiales (botón 2)]
const TYPE_MOVES = {};
(function () {
  const basic = { melee: 1, proj: 1, fan: 1, boomerang: 1 };
  for (const [id, m] of Object.entries(MOVES)) {
    const t = TYPE_MOVES[m.type] || (TYPE_MOVES[m.type] = { a: [], b: [] });
    if (basic[m.cls] && m.cd <= 1.1) t.a.push(id); else t.b.push(id);
  }
  // tipos sin técnica básica propia usan una normal
  for (const t of Object.keys(TYPE_COLORS)) {
    const tm = TYPE_MOVES[t] || (TYPE_MOVES[t] = { a: [], b: [] });
    if (!tm.a.length) tm.a.push('placaje');
    if (!tm.b.length) tm.b.push('vozarron');
  }
})();

const CLASS_ES = {
  melee: 'Cuerpo a cuerpo', dash: 'Embestida', proj: 'Proyectil', fan: 'Abanico', burst: 'Ráfaga', beam: 'Rayo',
  orbit: 'Órbita', aura: 'Aura', boomerang: 'Bumerán', chain: 'Cadena', meteor: 'Meteoros', mines: 'Minas',
};
const STATUS_ES = { burn: 'Quemado', poison: 'Envenenado', para: 'Paralizado', slow: 'Ralentizado', freeze: 'Congelado' };

// ---- Objetos pasivos (se acumulan durante la run, como en Isaac) ----
const ITEMS = {
  restos: { name: 'Restos', icon: '🍎', desc: 'Recuperas un 1% de PS por segundo.', price: 15 },
  cinta_eleccion: { name: 'Cinta Elección', icon: '🎀', desc: '+40% de daño físico.', price: 15 },
  gafas_eleccion: { name: 'Gafas Elección', icon: '👓', desc: '+40% de daño especial.', price: 15 },
  panuelo_eleccion: { name: 'Pañuelo Elección', icon: '🧣', desc: '+30% de velocidad.', price: 12 },
  garra_rapida: { name: 'Garra Rápida', icon: '🦅', desc: '-20% de recarga en tus técnicas.', price: 15 },
  banda_focus: { name: 'Banda Focus', icon: '🎗', desc: 'Un golpe que te debilitaría te deja con 1 PS (una vez por sala).', price: 12 },
  cascabel_concha: { name: 'Cascabel Concha', icon: '🐚', desc: 'Recuperas PS con el daño que haces.', price: 15 },
  moneda_amuleto: { name: 'Moneda Amuleto', icon: '🪙', desc: 'Los enemigos sueltan el doble de monedas.', price: 10 },
  huevo_suerte: { name: 'Huevo Suerte', icon: '🥚', desc: '+50% de experiencia.', price: 12 },
  vidasfera: { name: 'Vidasfera', icon: '🔮', desc: '+30% de daño, pero cada ataque te quita un poco de PS.', price: 12 },
  casco_dentado: { name: 'Casco Dentado', icon: '🪖', desc: 'Quien te golpea cuerpo a cuerpo recibe daño.', price: 12 },
  chaleco_asalto: { name: 'Chaleco Asalto', icon: '🦺', desc: '+25% de defensa especial y física.', price: 12 },
  cascabel_amistad: { name: 'Cascabel Amistad', icon: '🔔', desc: 'Los Pokémon derrotados se hacen tus amigos el doble de a menudo.', price: 14 },
  lente_zoom: { name: 'Lente Zoom', icon: '🔍', desc: 'Tus ataques tienen +20% de críticos.', price: 12 },
  polvo_brillo: { name: 'Polvo Brillo', icon: '✨', desc: 'Los ataques enemigos fallan un 15% de las veces.', price: 12 },
  piedra_eterna: { name: 'Piedra Eterna', icon: '🪨', desc: '+20% de PS máximos.', price: 10 },
  proteina: { name: 'Proteína', icon: '💪', desc: '+15% de Ataque.', price: 8 },
  hierro: { name: 'Hierro', icon: '⚙', desc: '+15% de Defensa.', price: 8 },
  calcio: { name: 'Calcio', icon: '🧪', desc: '+15% de Ataque Especial.', price: 8 },
  zinc: { name: 'Zinc', icon: '🔷', desc: '+15% de Defensa Especial.', price: 8 },
  carburante: { name: 'Carburante', icon: '⛽', desc: '+12% de velocidad.', price: 8 },
  mas_ps: { name: 'Más PS', icon: '❤', desc: '+15% de PS máximos.', price: 8 },
  pp_max: { name: 'PP Máximos', icon: '🔋', desc: '-10% de recarga.', price: 8 },
  caramelo_raro: { name: 'Caramelo Raro', icon: '🍬', desc: 'Tu Pokémon sube 2 niveles.', price: 10, instant: 1 },
  revivir: { name: 'Revivir', icon: '💎', desc: 'Revive a un Pokémon debilitado de tu equipo con la mitad de PS.', price: 8, instant: 1 },
};
const POOL_TREASURE = Object.keys(ITEMS).filter(k => !ITEMS[k].instant || k === 'caramelo_raro');

// ---- Zonas (un piso cada una) ----
const ZONES = [
  { name: 'Bosque Verde', types: ['bug', 'grass', 'normal', 'flying'], lvl: 4, floor: ['#5a9a48', '#528f42', '#62a450'], wall: '#2f5a2a', rock: 'bush', boss: 15, music: 'forest' },
  { name: 'Monte Moon', types: ['rock', 'ground', 'poison', 'fairy'], lvl: 9, floor: ['#8a7a68', '#7f705f', '#958573'], wall: '#4a3f36', rock: 'rock', boss: 95, music: 'cave' },
  { name: 'Islas Espuma', types: ['water', 'ice'], lvl: 15, floor: ['#7ab0c8', '#70a5bd', '#86bcd3'], wall: '#3a5a7a', rock: 'ice', boss: 144, music: 'sea' },
  { name: 'Central Energía', types: ['electric', 'steel', 'normal'], lvl: 21, floor: ['#9a9aa8', '#8f8f9d', '#a6a6b4'], wall: '#4a4a5a', rock: 'metal', boss: 145, music: 'power' },
  { name: 'Torre Pokémon', types: ['ghost', 'psychic', 'poison'], lvl: 27, floor: ['#6a5a7a', '#5f506f', '#756586'], wall: '#3a2a4a', rock: 'tomb', boss: 94, music: 'tower' },
  { name: 'Cueva Celeste', types: ['psychic', 'dragon', 'fire', 'fighting', 'ice'], lvl: 33, floor: ['#5a6a9a', '#50608f', '#6474a5'], wall: '#2a3060', rock: 'crystal', boss: 150, music: 'final' },
];

// Constantes de la sala (estilo Isaac): interior de 17 x 9 baldosas de 16 px.
// Pared de 1 baldosa a los lados y abajo, y de 2 arriba (se ve su cara frontal).
const T = 16, COLS = 17, ROWS = 9, WALL = 16, WALL_TOP = 32;
const VIEW_W = COLS * T + WALL * 2, VIEW_H = ROWS * T + WALL_TOP + WALL; // 304 x 192
const FULL_W = COLS + 2, FULL_H = ROWS + 3;                               // 19 x 12 baldosas
