// Roster de personajes de todas las sagas de Dragon Ball.
// rareza: 1 Común · 2 Poco común · 3 Rara · 4 Épica · 5 Legendaria
'use strict';

const RARITY = [
  null,
  { id: 1, name: 'Común', color: '#b8bcc8', cap: '#e8e8f0', capName: 'Cápsula Blanca' },
  { id: 2, name: 'Poco común', color: '#5fd35f', cap: '#4fc94f', capName: 'Cápsula Verde' },
  { id: 3, name: 'Rara', color: '#4aa8ff', cap: '#3a8cff', capName: 'Cápsula Azul' },
  { id: 4, name: 'Épica', color: '#c060ff', cap: '#a040f0', capName: 'Cápsula Morada' },
  { id: 5, name: 'Legendaria', color: '#ffc830', cap: '#ffc020', capName: 'Cápsula Capsule Corp. Dorada' },
];

const SAGAS = [
  { id: 0, name: 'Dragon Ball', short: 'DB', bg: ['#4f9a3a', '#468f33', '#5aa844'], deco: 'grass', desc: 'Pilaf, Red Ribbon, los Torneos y el Rey Piccolo.' },
  { id: 1, name: 'Saga Saiyan', short: 'Saiyan', bg: ['#c9a46a', '#bf9a60', '#d4b078'], deco: 'rock', desc: 'Raditz, Nappa y Vegeta llegan a la Tierra.' },
  { id: 2, name: 'Saga de Freezer', short: 'Namek', bg: ['#6fc7a0', '#64bb94', '#7cd3ac'], deco: 'namek', desc: 'Las Fuerzas Especiales Ginyu y el emperador Freezer.' },
  { id: 3, name: 'Saga de Cell', short: 'Cell', bg: ['#a89a7e', '#9d8f73', '#b4a68a'], deco: 'rock', desc: 'Androides, Trunks del Futuro y los Juegos de Cell.' },
  { id: 4, name: 'Saga de Majin Buu', short: 'Buu', bg: ['#8fb85a', '#84ad50', '#9ac466'], deco: 'grass', desc: 'Babidi, Dabura y todas las formas de Buu.' },
  { id: 5, name: 'Películas Z', short: 'Películas', bg: ['#6a5a7a', '#5f506f', '#756586'], deco: 'hell', desc: 'Cooler, Broly, Janemba, Bojack y más.' },
  { id: 6, name: 'Dragon Ball GT', short: 'GT', bg: ['#4a6a8a', '#40607f', '#557595'], deco: 'metal', desc: 'Baby, Super 17 y los Dragones Malignos.' },
  { id: 7, name: 'Super: Dioses', short: 'Dioses', bg: ['#9fb878', '#94ad6d', '#aac383'], deco: 'grass', desc: 'Bills, Whis, Golden Freezer y el Universo 6.' },
  { id: 8, name: 'Super: Goku Black', short: 'Black', bg: ['#6a6a72', '#606068', '#75757d'], deco: 'ruins', desc: 'El futuro de Trunks, Goku Black y Zamasu.' },
  { id: 9, name: 'Torneo del Poder', short: 'Torneo', bg: ['#bcc6d8', '#b1bbcd', '#c7d1e3'], deco: 'tiles', desc: 'Jiren, Toppo, Kefla y los dioses de 8 universos.' },
  { id: 10, name: 'Super: Héroes', short: 'Héroes', bg: ['#8a8a6a', '#7f7f60', '#959575'], deco: 'metal', desc: 'Broly, Moro, Granola y la Red Ribbon resurgida.' },
  { id: 11, name: 'Dragon Ball Daima', short: 'Daima', bg: ['#7a4a8a', '#6f417f', '#855595'], deco: 'hell', desc: 'El Reino Demoníaco, Gomah y los Goku mini.' },
];

// ---- Transformaciones ----
const FORMS = {
  kaioken: { n: 'Kaio-ken', a: '#ff3030', m: 1.3 },
  ozaru: { n: 'Ōzaru', sc: 1.9, t: '#7a4a2a', b: '#7a4a2a', hc: '#7a4a2a', a: '#ffcf40', m: 1.6, ex: 'redeye' },
  max: { n: 'Máxima Potencia', sc: 1.25, a: '#ffffff', m: 1.5 },
  rage: { n: 'Furia Oculta', a: '#ffffff', m: 1.5 },
  weighted: { n: 'Sin Pesas', a: '#e0e0ff', m: 1.4 },
  young: { n: 'Rejuvenecido', a: '#c0ff80', m: 1.5 },
  zenkai: { n: 'Zenkai', a: '#80c0ff', m: 1.4 },
  unlock: { n: 'Potencial Liberado', a: '#ffffff', m: 1.4 },
  nail: { n: 'Fusión con Nail', a: '#c0ff80', m: 1.5 },
  kamifuse: { n: 'Fusión con Kami', a: '#c0ff80', m: 1.7 },
  ssj: { n: 'Super Saiyan', h: 'ssj', hc: '#ffe14a', a: '#ffe14a', m: 1.5, ex: 'tealeye' },
  fpssj: { n: 'SSJ Poder Total', h: 'ssj', hc: '#fff070', a: '#ffe14a', m: 1.7, ex: 'tealeye' },
  ussj: { n: 'Super Saiyan Fase 3', h: 'ssj', hc: '#ffe14a', a: '#ffe14a', m: 1.75, sc: 1.2, ex: 'tealeye' },
  superveg: { n: 'Super Vegeta', h: 'vegeta', hc: '#ffe14a', a: '#ffe14a', m: 1.75, sc: 1.1, ex: 'tealeye' },
  vegssj: { n: 'Super Saiyan', h: 'vegeta', hc: '#ffe14a', a: '#ffe14a', m: 1.5, ex: 'tealeye' },
  ssj2: { n: 'Super Saiyan 2', h: 'ssj', hc: '#fff070', a: '#fff070', m: 1.8, spark: 1, ex: 'tealeye' },
  vegssj2: { n: 'Super Saiyan 2', h: 'vegeta', hc: '#fff070', a: '#fff070', m: 1.8, spark: 1, ex: 'tealeye' },
  majin: { n: 'Majin Vegeta', h: 'vegeta', hc: '#ffe14a', a: '#ffe14a', m: 1.9, spark: 1, ex: 'mark,tealeye' },
  ssj3: { n: 'Super Saiyan 3', h: 'ssj3', hc: '#ffe14a', a: '#ffe14a', m: 2.0, spark: 1, ex: 'nobrow,tealeye' },
  ssj4: { n: 'Super Saiyan 4', h: 'goku', hc: '#1c1c24', t: '#c03030', a: '#ff4040', m: 2.2, ex: 'fur' },
  vegssj4: { n: 'Super Saiyan 4', h: 'vegeta', hc: '#2a1c24', t: '#c03030', a: '#ff4040', m: 2.2, ex: 'fur' },
  ssj4lim: { n: 'Limit Breaker', a: '#ff6060', m: 2.5, spark: 1 },
  god: { n: 'Super Saiyan Dios', hc: '#e8304a', a: '#ff5070', m: 2.1, ex: 'redeye' },
  blue: { n: 'Super Saiyan Blue', h: 'ssj', hc: '#3fd0ff', a: '#3fd0ff', m: 2.3 },
  vegblue: { n: 'Super Saiyan Blue', h: 'vegeta', hc: '#3fd0ff', a: '#3fd0ff', m: 2.3 },
  blueevo: { n: 'Blue Evolución', h: 'vegeta', hc: '#2a80ff', a: '#2a80ff', m: 2.5, spark: 1, sc: 1.1 },
  bluekk: { n: 'Blue Kaio-ken x20', h: 'ssj', hc: '#3fd0ff', a: '#ff3030', m: 2.5 },
  ui_sign: { n: 'Presagio del Ultra Instinto', a: '#c8d8ff', m: 2.4, eye: '#a0b0ff' },
  ui: { n: 'Ultra Instinto Dominado', h: 'goku', hc: '#e0e6ff', a: '#d0e0ff', m: 2.8, eye: '#a0b0ff' },
  ue: { n: 'Ultra Ego', h: 'vegeta', hc: '#8a50ff', a: '#a050ff', m: 2.8, sc: 1.1, ex: 'redeye' },
  rose: { n: 'Super Saiyan Rosé', h: 'ssj', hc: '#ff7ad9', a: '#ff4fd0', m: 2.4 },
  beast: { n: 'Gohan Bestia', h: 'beast', hc: '#e8e8f0', a: '#d040ff', m: 2.8, ex: 'redeye' },
  ultimate: { n: 'Definitivo', a: '#ffffff', m: 2.0 },
  potential: { n: 'Poder Despertado', a: '#ffffff', m: 1.8 },
  orange: { n: 'Piccolo Naranja', sk: '#ff8c3a', a: '#ff8c3a', m: 2.4, sc: 1.2 },
  lssj: { n: 'Super Saiyan Legendario', h: 'ssj', hc: '#b0ff40', a: '#7fff3a', m: 2.3, sc: 1.15, ex: 'nobrow' },
  wrath: { n: 'Ira', hc: '#2a4a2a', a: '#40ff40', m: 2.0, ex: 'redeye' },
  berserk: { n: 'Berserker', h: 'ssj', hc: '#b0ff40', a: '#7fff3a', m: 2.3, sc: 1.4 },
  full: { n: 'Poder al 100%', a: '#ff60ff', m: 1.8, sc: 1.1 },
  golden: { n: 'Golden', sk: '#ffd23a', t: '#ffd23a', b: '#ffd23a', l: '#ffd23a', k: '#ffd23a', tail: '#ffd23a', a: '#ffd23a', m: 2.3 },
  black: { n: 'Black Freezer', sk: '#26222e', t: '#26222e', b: '#26222e', l: '#26222e', k: '#26222e', tail: '#26222e', a: '#a040ff', m: 2.8, ex: 'redeye' },
  semi: { n: 'Semiperfecto', a: '#40ff80', m: 1.6, sc: 1.2 },
  superperfect: { n: 'Super Perfecto', a: '#ffe14a', m: 2.0, spark: 1 },
  monster: { n: 'Forma Monstruo', sc: 1.25, sk: '#5aa08a', a: '#80ff80', m: 1.5 },
  bodyswap: { n: 'Cambio de Cuerpo', a: '#c080ff', m: 1.5 },
  absorbed: { n: 'Absorción', a: '#ff80c0', m: 1.9 },
  super13: { n: 'Super 13', sk: '#6a8ae0', hc: '#e04020', sc: 1.3, a: '#ff6040', m: 1.8 },
  cooler5: { n: 'Quinta Forma', sc: 1.2, a: '#ff6060', m: 1.8 },
  giant: { n: 'Gigante', sc: 1.7, a: '#80ff60', m: 1.6 },
  superjanemba: { n: 'Super Janemba', a: '#ff40a0', m: 2.0, sc: 1.1 },
  superbaby: { n: 'Super Baby 2', hc: '#f0f0ff', a: '#ff80ff', m: 1.9 },
  superbabyape: { n: 'Gran Ōzaru Dorado', sc: 1.9, t: '#ffd23a', b: '#ffd23a', hc: '#ffd23a', a: '#ffd23a', m: 2.1 },
  destroyer: { n: 'Ira del Destructor', a: '#c060ff', m: 2.0 },
  angel: { n: 'Poder Angelical', a: '#a0e0ff', m: 2.2 },
  pure: { n: 'Asesino Puro', a: '#a060ff', m: 1.8 },
  immortal: { n: 'Inmortal', a: '#80ff80', m: 1.7 },
  corrupt: { n: 'Corrompido', sk: '#a080d0', a: '#c060ff', m: 2.3, sc: 1.2 },
  srage: { n: 'Super Saiyan Rage', h: 'ssj', hc: '#c8e8ff', a: '#80c0ff', m: 2.3 },
  fullpow: { n: 'Poder Total', a: '#ff6040', m: 2.0, sc: 1.05 },
  merged: { n: 'Fusión con el Planeta', a: '#a0ff80', m: 2.0, sc: 1.15 },
  awakened: { n: 'Despertar', a: '#60ffff', m: 2.1, sc: 1.1 },
  gasfull: { n: 'Gas Instinto', a: '#ff8030', m: 2.2, sc: 1.2 },
  thirdeye: { n: 'Tercer Ojo', a: '#a060ff', m: 2.0, ex: 'eye3' },
  dark: { n: 'Poder Oscuro', a: '#a040ff', m: 1.6 },
  majinmark: { n: 'Majin', a: '#ffe14a', m: 1.6, ex: 'mark' },
  supergarlic: { n: 'Super Garlic Jr.', sc: 1.35, a: '#a060ff', m: 1.6 },
  generic: { n: 'Ki Máximo', a: '#ffffff', m: 1.4 },
};

// colores comunes
const SKIN = '#f5c08f', NAMEK = '#6cc24a', FROST = '#f4eef6', BUU = '#f7a1c8', BLK = '#1c1c24', WHT = '#f0f0f0';
const GOKU_OR = '#f7841b', BLUE = '#2a56d6', PURP = '#5a2a8a', RED = '#d03030';
const LAV = '#c0a0f0', YEL = '#ffe14a';

const gokuL = (o) => Object.assign({ h: 'goku', t: GOKU_OR, l: BLUE, k: BLUE }, o);
const vegL = (o) => Object.assign({ h: 'vegeta', body: 'armor', t: '#2a3a8a', x: WHT, k: WHT }, o);
const picL = (o) => Object.assign({ h: 'turban', hc: '#7a3aa0', x: WHT, sk: NAMEK, t: PURP, b: PURP, l: '#3a8ad0', k: '#7a4a2a', cape: WHT }, o);
const friL = (o) => Object.assign({ h: 'dome', x: '#a050c0', sk: FROST, t: FROST, b: FROST, l: FROST, k: FROST, ex: 'chest', tail: FROST, alien: 1 }, o);
const armL = (o) => Object.assign({ body: 'armor', t: '#2a2a3a', x: '#e8e0c8', k: WHT }, o);
const buuL = (o) => Object.assign({ h: 'antenna', hc: BUU, sk: BUU, t: BUU, b: WHT, l: BLK, k: '#ffd040', alien: 1 }, o);
const cellL = (o) => Object.assign({ h: 'crown', hc: BLK, x: '#2a7a2a', sk: '#e8e8e0', t: '#5aa04a', b: '#5aa04a', l: '#5aa04a', k: '#2a2a2a', wings: '#2a2a2a', ex: 'spots', alien: 1 }, o);
const angelL = (o) => Object.assign({ h: 'tall', hc: WHT, sk: '#9ab0e0', body: 'robe', t: '#b04a7a', l: BLK, k: BLK, alien: 1 }, o);
const vegitoL = (o) => Object.assign({ h: 'goku', t: '#e08030', b: '#2a3a8a', l: '#e0c040', k: WHT, ex: 'potara' }, o);
const gogetaL = (o) => Object.assign({ h: 'goku', t: '#3a5ab0', b: WHT, l: '#e0c040', k: '#3a3a3a' }, o);
const kaiL = (o) => Object.assign({ h: 'mohawk', hc: WHT, sk: '#a070d0', body: 'robe', t: '#3a3a8a', l: '#e0c040', k: '#7a4a2a', ex: 'potara', alien: 1 }, o);
const catL = (o) => Object.assign({ h: 'cat', hc: '#8a6aa0', sk: '#8a6aa0', t: '#1a1a24', b: '#e8e0c8', l: '#c03030', k: '#1a1a24', ex: 'gold', alien: 1 }, o);
const prideL = (o) => Object.assign({ t: RED, b: '#2a2a2a', l: '#2a2a2a', k: WHT }, o);

// [id, nombre, saga, rareza, movimiento inicial, look, formas, extra]
const CHAR_LIST = [
  // ---------------- 0 · Dragon Ball ----------------
  ['goku_kid', 'Goku (Niño)', 0, 3, 'kamehameha', gokuL({ sc: 0.85, tail: '#7a4a2a' }), ['ozaru'], { starter: 1, saiyan: 1 }],
  ['krillin_db', 'Krilin (Niño)', 0, 2, 'kiblast', { h: 'bald', ex: 'dots', t: GOKU_OR, l: BLUE, k: BLUE, sc: 0.8 }, ['generic'], { starter: 1 }],
  ['yamcha_db', 'Yamcha (Bandido)', 0, 2, 'punch', { h: 'long', t: '#d0a050', b: '#4a7a3a', l: RED, k: '#7a4a2a' }, ['generic'], { starter: 1 }],
  ['bulma', 'Bulma', 0, 1, 'kiblast', { h: 'twin', hc: '#2fb5a8', t: '#e04a8a', b: '#3a6ad0', l: '#e04a8a', k: '#a03030' }, [], {}],
  ['roshi', 'Maestro Roshi', 0, 4, 'kamehameha', { h: 'bald', ex: 'beard,glasses', t: '#e8a050', b: '#e8a050', l: '#4a3a2a', k: '#4a3a2a' }, ['max'], {}],
  ['launch', 'Lunch', 0, 2, 'scatter', { h: 'straight', hc: '#ffd84a', t: RED, b: '#3a3a8a', l: '#3a3a8a', k: BLK }, [], {}],
  ['pilaf', 'Emperador Pilaf', 0, 1, 'kiblast', { h: 'bald', sk: '#7a9ae8', t: '#f0e0c0', b: '#a03030', l: '#a03030', k: '#a03030', sc: 0.75, alien: 1 }, [], {}],
  ['chichi_db', 'Chi-Chi (Niña)', 0, 1, 'kienzan', { h: 'bob', t: '#7a3aa0', b: '#7a3aa0', l: '#ff70a0', k: '#ff70a0', sc: 0.8 }, [], {}],
  ['grandpa', 'Abuelo Gohan', 0, 2, 'punch', { h: 'bald', ex: 'beard', t: '#3a6a3a', b: '#3a6a3a', l: '#e0c040', k: '#7a4a2a' }, [], {}],
  ['blue_gen', 'General Blue', 0, 2, 'kiblast', { h: 'bowl', hc: '#ffd84a', t: '#3a5ab0', b: '#3a5ab0', l: BLK, k: BLK }, [], {}],
  ['red_cmd', 'Comandante Red', 0, 1, 'kiblast', { h: 'bowl', hc: '#c03030', t: '#a03030', b: '#a03030', l: BLK, k: BLK, sc: 0.75 }, [], {}],
  ['android8', 'Androide 8', 0, 2, 'punch', { h: 'bald', sk: '#e8b080', t: '#4a8a3a', b: '#4a8a3a', l: '#3a3a3a', k: '#3a3a3a', sc: 1.35 }, [], {}],
  ['taopaipai', 'Tao Pai Pai', 0, 3, 'deathbeam', { h: 'bald', ex: 'mustache', t: '#e88aa0', b: '#e88aa0', l: '#a03030', k: BLK }, ['generic'], {}],
  ['tien_db', 'Ten Shin Han (Joven)', 0, 3, 'kikoho', { h: 'bald', ex: 'eye3', t: '#3a8a5a', b: WHT, l: RED, k: BLK }, ['generic'], { starter: 1 }],
  ['chiaotzu', 'Chaoz', 0, 2, 'explosive', { h: 'bald', sk: '#f8f0f0', ex: 'cheeks', t: '#3a8a5a', b: WHT, l: RED, k: BLK, sc: 0.7 }, [], {}],
  ['kingpiccolo', 'Rey Piccolo', 0, 4, 'explosive', { h: 'namek', hc: NAMEK, sk: NAMEK, t: WHT, b: '#4a2a7a', body: 'robe', l: '#3a8ad0', k: '#7a4a2a', cape: '#4a2a7a', alien: 1 }, ['young'], {}],
  ['tambourine', 'Tambourine', 0, 2, 'sokidan', { h: 'bald', sk: NAMEK, t: NAMEK, b: NAMEK, l: NAMEK, k: '#3a6a3a', wings: '#3a6a3a', alien: 1 }, [], {}],
  ['piccolo_jr', 'Piccolo Jr.', 0, 3, 'makanko', picL({}), ['weighted'], { starter: 1 }],
  ['yajirobe', 'Yajirobe', 0, 1, 'sword', { h: 'afro', t: '#d0a050', b: '#3a3a6a', l: '#7a4a2a', k: '#7a4a2a', ex: 'sword' }, [], {}],
  ['kami', 'Kami-sama', 0, 3, 'kiorbs', { h: 'namek', hc: NAMEK, sk: NAMEK, t: WHT, b: WHT, body: 'robe', ex: 'beard', l: '#e03030', k: '#7a4a2a', cape: '#3a3a6a', alien: 1 }, [], {}],
  ['popo', 'Mr. Popo', 0, 1, 'aura', { h: 'turban', hc: '#ffd84a', x: WHT, sk: '#30304a', t: '#c03030', b: WHT, l: '#ffd84a', k: '#7a4a2a' }, [], {}],
  ['nam', 'Nam', 0, 1, 'rush', { h: 'turban', hc: '#e0c040', x: WHT, sk: '#a06a4a', t: WHT, b: WHT, l: '#3a6ad0', k: '#7a4a2a' }, [], {}],

  // ---------------- 1 · Saga Saiyan ----------------
  ['goku_z', 'Goku (Saga Saiyan)', 1, 3, 'kamehameha', gokuL({}), ['kaioken'], { saiyan: 1 }],
  ['gohan_kid', 'Gohan (Niño)', 1, 3, 'masenko', { h: 'goku', sc: 0.75, t: PURP, b: PURP, l: RED, k: '#7a4a2a', tail: '#7a4a2a' }, ['rage', 'ozaru'], { starter: 1, saiyan: 1 }],
  ['piccolo', 'Piccolo', 1, 4, 'makanko', picL({}), ['weighted'], {}],
  ['krillin', 'Krilin', 1, 2, 'kienzan', { h: 'bald', ex: 'dots', t: GOKU_OR, l: BLUE, k: BLUE, sc: 0.85 }, ['generic'], {}],
  ['yamcha', 'Yamcha', 1, 2, 'sokidan', { h: 'bowl', ex: 'scar', t: GOKU_OR, l: BLUE, k: BLUE }, ['generic'], {}],
  ['tien', 'Ten Shin Han', 1, 3, 'kikoho', { h: 'bald', ex: 'eye3', t: SKIN, b: '#3a8a5a', l: RED, k: BLK }, ['generic'], {}],
  ['chiaotzu_z', 'Chaoz (Z)', 1, 1, 'explosive', { h: 'bald', sk: '#f8f0f0', ex: 'cheeks', t: '#3a8a5a', b: WHT, l: RED, k: BLK, sc: 0.7 }, [], {}],
  ['raditz', 'Raditz', 1, 3, 'kiblast', armL({ h: 'long', ex: 'scouter', tail: '#3a2a1a' }), ['ozaru'], { saiyan: 1 }],
  ['nappa', 'Nappa', 1, 3, 'explosive', armL({ h: 'bald', ex: 'mustache,scouter', sc: 1.3, tail: '#3a2a1a' }), ['ozaru'], { saiyan: 1 }],
  ['vegeta_s', 'Vegeta (Saga Saiyan)', 1, 4, 'galick', vegL({ ex: 'scouter', tail: '#3a2a1a' }), ['ozaru'], { saiyan: 1 }],
  ['saibaman', 'Saibaman', 1, 1, 'punch', { h: 'bald', sk: '#4a9a3a', t: '#4a9a3a', b: '#4a9a3a', l: '#4a9a3a', k: '#3a7a2a', sc: 0.8, ex: 'veins', alien: 1 }, [], {}],
  ['kingkai', 'Kaio del Norte', 1, 2, 'aura', { h: 'namek', hc: '#2a2a2a', sk: '#4a7ae0', t: '#2a2a2a', b: '#d0a050', l: '#d0a050', k: '#2a2a2a', ex: 'glasses', sc: 0.85, alien: 1 }, [], {}],

  // ---------------- 2 · Saga de Freezer ----------------
  ['goku_namek', 'Goku (Namek)', 2, 4, 'genkidama', gokuL({}), ['kaioken', 'ssj'], { saiyan: 1 }],
  ['vegeta_namek', 'Vegeta (Namek)', 2, 3, 'kiblast', vegL({}), ['zenkai'], { saiyan: 1 }],
  ['gohan_namek', 'Gohan (Namek)', 2, 2, 'masenko', armL({ h: 'goku', sc: 0.75, t: '#2a3a8a', x: WHT }), ['rage'], { saiyan: 1 }],
  ['krillin_namek', 'Krilin (Namek)', 2, 2, 'kienzan', armL({ h: 'bald', ex: 'dots', t: '#2a3a8a', x: WHT, sc: 0.85 }), ['unlock'], {}],
  ['piccolo_namek', 'Piccolo (Fusión con Nail)', 2, 4, 'makanko', picL({}), ['nail'], {}],
  ['nail', 'Nail', 2, 2, 'punch', { h: 'namek', hc: NAMEK, sk: NAMEK, t: WHT, b: '#c03030', l: '#3a8ad0', k: '#7a4a2a', alien: 1 }, [], {}],
  ['dende', 'Dende', 2, 2, 'kiorbs', { h: 'namek', hc: NAMEK, sk: NAMEK, body: 'robe', t: WHT, l: '#3a8ad0', k: '#7a4a2a', sc: 0.7, alien: 1 }, [], {}],
  ['frieza1', 'Freezer (1ª Forma)', 2, 4, 'deathbeam', armL({ h: 'horns', hc: '#2a2a2a', x: '#a070c0', sk: FROST, t: '#5a2a6a', tail: FROST, alien: 1 }), ['full'], {}],
  ['frieza_final', 'Freezer (Forma Final)', 2, 5, 'deathbeam', friL({}), ['full'], {}],
  ['zarbon', 'Zarbon', 2, 3, 'kamehameha', armL({ h: 'long', hc: '#2a7a3a', sk: '#9ad0e0', cape: WHT }), ['monster'], {}],
  ['dodoria', 'Dodoria', 2, 2, 'kikoho', armL({ h: 'bald', sk: '#f080b0', sc: 1.3, alien: 1 }), [], {}],
  ['ginyu', 'Capitán Ginyu', 2, 3, 'kiblast', armL({ h: 'horns', hc: '#2a2a2a', x: '#a070c0', sk: '#a070c0', alien: 1 }), ['bodyswap'], {}],
  ['recoome', 'Recoome', 2, 3, 'kamehameha', armL({ h: 'afro', hc: '#e04020', sc: 1.3 }), ['generic'], {}],
  ['burter', 'Burter', 2, 2, 'rush', armL({ h: 'bald', sk: '#4a7ae0', sc: 1.15, alien: 1 }), [], {}],
  ['jeice', 'Jeice', 2, 2, 'bigbang', armL({ h: 'bob', hc: WHT, sk: '#e05050', alien: 1 }), [], {}],
  ['guldo', 'Guldo', 2, 1, 'taiyoken', armL({ h: 'bald', sk: '#6aaa5a', sc: 0.75, ex: 'eye3', alien: 1 }), [], {}],
  ['cui', 'Kiwi', 2, 1, 'kiblast', armL({ h: 'bald', sk: '#a070c0', ex: 'scouter', alien: 1 }), [], {}],
  ['appule', 'Appule', 2, 1, 'kiblast', armL({ h: 'bald', sk: '#c070d0', ex: 'dots', alien: 1 }), [], {}],
  ['bardock', 'Bardock', 2, 4, 'bigbang', armL({ h: 'goku', x: '#3a6a3a', ex: 'headband,scar', tail: '#3a2a1a' }), ['ssj'], { saiyan: 1 }],
  ['gine', 'Gine', 2, 2, 'punch', armL({ h: 'bob', x: '#c03030', tail: '#3a2a1a' }), [], { saiyan: 1 }],

  // ---------------- 3 · Saga de Cell ----------------
  ['goku_ssj', 'Goku (Super Saiyan)', 3, 4, 'kamehameha', gokuL({}), ['ssj', 'fpssj'], { saiyan: 1 }],
  ['future_trunks', 'Trunks del Futuro', 3, 4, 'sword', { h: 'bowl', hc: LAV, t: '#3a3a6a', b: '#4a4a4a', l: '#c08030', k: '#c08030', ex: 'sword' }, ['ssj', 'ussj'], { saiyan: 1 }],
  ['vegeta_cell', 'Vegeta (Super Saiyan)', 3, 4, 'galick', vegL({}), ['vegssj', 'superveg'], { saiyan: 1 }],
  ['gohan_cell', 'Gohan (Juegos de Cell)', 3, 5, 'kamehameha', { h: 'bowl', t: PURP, b: PURP, l: RED, k: '#7a4a2a', sc: 0.85 }, ['ssj', 'ssj2'], { saiyan: 1 }],
  ['piccolo_cell', 'Piccolo (Fusión con Kami)', 3, 3, 'hellzone', picL({}), ['kamifuse'], {}],
  ['android16', 'Androide 16', 3, 4, 'kamehameha', { h: 'mohawk', hc: '#e04020', t: '#3a6a3a', b: '#5a5a3a', l: '#3a3a3a', k: '#3a3a3a', sc: 1.3 }, ['generic'], {}],
  ['android17', 'Androide 17', 3, 3, 'explosive', { h: 'straight', t: '#2a2a3a', b: '#3a5ab0', l: '#2a2a3a', k: '#5a3a2a', ex: 'scarf' }, ['generic'], {}],
  ['android18', 'Androide 18', 3, 3, 'kiblast', { h: 'bob', hc: '#ffe080', t: '#2a2a3a', b: '#3a5ab0', l: '#2a2a3a', k: '#5a3a2a' }, ['generic'], {}],
  ['android19', 'Androide 19', 3, 2, 'aura', { h: 'bald', sk: WHT, t: '#e0d8d8', b: '#e0d8d8', l: '#3a3a3a', k: '#3a3a3a', sc: 1.2, alien: 1 }, [], {}],
  ['drgero', 'Dr. Gero', 3, 2, 'aura', { h: 'long', hc: WHT, sk: WHT, t: '#e0d8d8', b: '#e0d8d8', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, [], {}],
  ['cell_imperfect', 'Cell Imperfecto', 3, 3, 'kamehameha', cellL({ sk: '#5aa04a', x: '#2a7a2a', tail: '#2a5a2a' }), ['semi'], {}],
  ['cell_perfect', 'Cell Perfecto', 3, 5, 'kamehameha', cellL({}), ['superperfect'], {}],
  ['celljr', 'Cell Jr.', 3, 2, 'punch', cellL({ sk: '#7ab0f0', t: '#7ab0f0', b: '#7ab0f0', l: '#7ab0f0', x: '#3a60b0', wings: null, sc: 0.7 }), [], {}],
  ['mechafrieza', 'Mecha Freezer', 3, 3, 'deathbeam', friL({ sk: '#c0c0d0', t: '#c0c0d0', b: '#c0c0d0', l: '#c0c0d0', k: '#c0c0d0', tail: '#c0c0d0' }), ['generic'], {}],
  ['kingcold', 'Rey Cold', 3, 3, 'deathbeam', armL({ h: 'horns', hc: '#2a2a2a', x: '#a070c0', sk: FROST, sc: 1.4, cape: '#3a3a6a', alien: 1 }), [], {}],

  // ---------------- 4 · Saga de Majin Buu ----------------
  ['goku_ssj3', 'Goku (Saga Buu)', 4, 5, 'kamehameha', gokuL({ ex: 'halo' }), ['ssj', 'ssj2', 'ssj3'], { saiyan: 1 }],
  ['vegeta_majin', 'Majin Vegeta', 4, 4, 'explosive', vegL({}), ['majin'], { saiyan: 1 }],
  ['gohan_ultimate', 'Gohan Definitivo', 4, 4, 'kamehameha', { h: 'goku', t: '#3a4a9a', b: '#3a4a9a', l: RED, k: '#7a4a2a' }, ['ultimate'], { saiyan: 1 }],
  ['saiyaman', 'Gran Saiyaman', 4, 2, 'kiblast', { h: 'bowl', t: '#2a7a3a', b: '#2a7a3a', l: '#3a3a3a', k: '#3a3a3a', cape: RED, ex: 'visor' }, ['ssj'], { saiyan: 1 }],
  ['goten', 'Goten', 4, 3, 'kamehameha', gokuL({ sc: 0.7 }), ['ssj'], { saiyan: 1 }],
  ['trunks_kid', 'Trunks (Niño)', 4, 3, 'bigbang', { h: 'bowl', hc: LAV, sc: 0.7, t: '#4aa04a', b: '#e0a030', l: '#e0a030', k: '#e0a030' }, ['ssj'], { saiyan: 1 }],
  ['gotenks', 'Gotenks', 4, 4, 'sokidan', { h: 'goku', hc: '#5a3a7a', t: '#3a5ab0', b: WHT, l: '#e0c040', k: '#3a3a3a', sc: 0.8 }, ['ssj', 'ssj3'], { saiyan: 1 }],
  ['vegito', 'Vegetto', 4, 5, 'sword', vegitoL({}), ['ssj'], { saiyan: 1 }],
  ['majinbuu', 'Majin Buu', 4, 3, 'candy', buuL({ t: '#4a2a7a', cape: '#4a2a7a', sc: 1.4 }), ['generic'], {}],
  ['superbuu', 'Super Buu', 4, 4, 'sokidan', buuL({ cape: '#4a2a7a', sc: 1.15, ex: 'redeye' }), ['absorbed'], {}],
  ['kidbuu', 'Kid Buu', 4, 5, 'explosive', buuL({ sc: 0.85, ex: 'redeye' }), ['generic'], {}],
  ['babidi', 'Babidi', 4, 2, 'kiblast', { h: 'bald', sk: '#e0c8a0', ex: 'mark', body: 'robe', t: '#5a5ab0', l: '#c03030', k: '#5a5ab0', sc: 0.65, alien: 1 }, [], {}],
  ['dabura', 'Dabura', 4, 3, 'makanko', { h: 'bald', sk: '#d03040', ex: 'horns2', t: '#2a2a3a', b: '#2a2a3a', l: '#c0a040', k: '#2a2a3a', cape: WHT, sc: 1.1, alien: 1 }, ['dark'], {}],
  ['spopovich', 'Spopovich', 4, 1, 'punch', { h: 'bald', ex: 'mark', t: RED, b: RED, l: '#3a3a3a', k: '#3a3a3a', sc: 1.3 }, ['majinmark'], {}],
  ['puipui', 'Pui Pui', 4, 1, 'kiblast', armL({ h: 'bald', ex: 'mark', x: '#5a5ab0' }), [], {}],
  ['yakon', 'Yakon', 4, 2, 'aura', { h: 'bald', sk: '#f0e060', t: '#f0e060', b: '#f0e060', l: '#3a3a3a', k: '#3a3a3a', ex: 'mark', sc: 1.2, alien: 1 }, [], {}],
  ['videl', 'Videl', 4, 2, 'rush', { h: 'twin', t: WHT, b: '#2a2a2a', l: '#2a2a2a', k: '#e04040' }, [], {}],
  ['hercule', 'Mr. Satán', 4, 1, 'punch', { h: 'afro', ex: 'mustache', t: WHT, b: WHT, l: '#e0c040', k: '#7a4a2a', cape: '#c03030' }, [], {}],
  ['kibitoshin', 'Kibito-shin', 4, 3, 'kiorbs', kaiL({ t: '#c03030' }), [], {}],
  ['supremekai', 'Kaio-shin', 4, 2, 'taiyoken', kaiL({}), [], {}],
  ['elderkai', 'Rō Kaio-shin', 4, 4, 'aura', kaiL({ h: 'bald', ex: 'beard,potara', sk: '#d0a0e0', t: '#d03030', sc: 0.8 }), [], {}],
  ['uub', 'Uub', 4, 3, 'kiblast', { h: 'mohawk', sk: '#7a4a2a', t: '#e0d0a0', b: '#e0d0a0', l: '#3a6ad0', k: '#3a3a3a' }, ['potential'], {}],

  // ---------------- 5 · Películas Z ----------------
  ['garlicjr', 'Garlic Jr.', 5, 3, 'hellzone', { h: 'bald', sk: '#e0c8f0', t: '#3a3a3a', b: '#3a3a3a', l: '#c03030', k: '#3a3a3a', cape: '#c03030', sc: 0.75, alien: 1 }, ['supergarlic'], {}],
  ['turles', 'Turles', 5, 4, 'genkidama', armL({ h: 'goku', sk: '#a06a4a', x: '#3a3a3a', ex: 'scouter', tail: '#3a2a1a' }), ['generic'], { saiyan: 1 }],
  ['slug', 'Lord Slug', 5, 4, 'explosive', armL({ h: 'namek', hc: NAMEK, sk: NAMEK, x: '#3a3a3a', cape: '#3a3a3a', sc: 1.1, alien: 1 }), ['giant'], {}],
  ['cooler', 'Cooler', 5, 4, 'deathbeam', friL({ x: '#5a3ab0' }), ['cooler5'], {}],
  ['metacooler', 'Meta-Cooler', 5, 3, 'kamehameha', friL({ x: '#7a6a9a', sk: '#a0a0b8', t: '#a0a0b8', b: '#a0a0b8', l: '#a0a0b8', k: '#a0a0b8', tail: '#a0a0b8' }), [], {}],
  ['android13', 'Androide 13', 5, 4, 'explosive', { h: 'bowl', hc: '#e08030', t: '#4a4a4a', b: '#3a5ab0', l: '#4a4a4a', k: '#3a3a3a' }, ['super13'], {}],
  ['broly_z', 'Broly (Z)', 5, 5, 'genkidama', armL({ h: 'goku', x: '#e0c040', t: WHT, sc: 1.25 }), ['lssj'], { saiyan: 1 }],
  ['paragus', 'Paragus', 5, 2, 'aura', armL({ h: 'long', ex: 'beard', cape: WHT }), [], { saiyan: 1 }],
  ['bojack', 'Bojack', 5, 4, 'sokidan', { h: 'long', hc: '#d03030', sk: '#7ab0c0', t: '#3a3a6a', b: '#3a3a6a', l: '#e0c040', k: '#3a3a3a', cape: WHT, alien: 1 }, ['fullpow'], {}],
  ['zangya', 'Zangya', 5, 3, 'kiblast', { h: 'long', hc: '#e07030', sk: '#7ab0c0', t: '#4a4a8a', b: '#4a4a8a', l: '#e0c040', k: '#3a3a3a', alien: 1 }, [], {}],
  ['janemba', 'Janemba', 5, 5, 'sword', { h: 'horns', hc: '#e0d040', x: '#d03040', sk: '#d03040', t: '#d03040', b: '#d03040', l: '#e0d040', k: '#3a3a3a', sc: 1.2, tail: '#d03040', alien: 1 }, ['superjanemba'], {}],
  ['gogeta_ssj', 'Gogeta', 5, 5, 'genkidama', gogetaL({}), ['ssj'], { saiyan: 1 }],
  ['hirudegarn', 'Hirudegarn', 5, 4, 'explosive', { h: 'crown', hc: '#3a2a2a', x: '#8a5aa0', sk: '#8a5aa0', t: '#8a5aa0', b: '#8a5aa0', l: '#8a5aa0', k: '#3a2a2a', sc: 1.7, alien: 1 }, [], {}],
  ['tapion', 'Tapion', 5, 3, 'sword', { h: 'bowl', hc: '#e08030', sk: '#c0b090', t: '#3a7a6a', b: '#3a7a6a', l: '#6a4a2a', k: '#6a4a2a', cape: '#6a4a2a', ex: 'sword' }, [], {}],
  ['wheelo', 'Dr. Wheelo', 5, 3, 'kamehameha', { h: 'bald', sk: '#c0c0d0', sc: 1.5, t: '#7a7a8a', b: '#7a7a8a', l: '#4a4a5a', k: '#4a4a5a', alien: 1 }, [], {}],
  ['pikkon', 'Pikkon', 5, 3, 'sokidan', { h: 'turban', hc: WHT, x: WHT, sk: '#5ab04a', t: WHT, b: WHT, l: '#3a6ad0', k: '#7a4a2a', ex: 'halo', alien: 1 }, [], {}],

  // ---------------- 6 · Dragon Ball GT ----------------
  ['goku_gt', 'Goku (GT)', 6, 4, 'kamehameha', gokuL({ sc: 0.75, t: '#3a5ab0', b: WHT, l: '#e0a030', k: '#7a4a2a', tail: '#7a4a2a' }), ['ssj', 'ssj3', 'ssj4'], { saiyan: 1 }],
  ['goku_ssj4', 'Goku (SSJ4)', 6, 5, 'kamehameha', { h: 'goku', t: '#c03030', b: WHT, l: '#3a5ab0', k: '#3a3a3a', tail: '#c03030', ex: 'fur' }, ['ssj4lim'], { saiyan: 1 }],
  ['vegeta_gt', 'Vegeta (GT)', 6, 4, 'galick', vegL({ ex: 'mustache' }), ['vegssj', 'vegssj4'], { saiyan: 1 }],
  ['gogeta_ssj4', 'Gogeta SSJ4', 6, 5, 'kamehameha', { h: 'long', hc: '#7a1a2a', t: '#c03030', b: WHT, l: '#3a5ab0', k: '#3a3a3a', tail: '#c03030', ex: 'fur' }, ['ssj4lim'], { saiyan: 1 }],
  ['pan', 'Pan', 6, 2, 'kiblast', { h: 'bob', ex: 'bandana', t: RED, b: WHT, l: '#3a3a3a', k: '#e08030', sc: 0.8 }, ['generic'], { saiyan: 1 }],
  ['trunks_gt', 'Trunks (GT)', 6, 3, 'kiblast', { h: 'bowl', hc: LAV, t: '#3a3a3a', b: '#4a4a8a', l: '#3a3a3a', k: '#3a3a3a' }, ['ssj'], { saiyan: 1 }],
  ['baby', 'Baby Vegeta', 6, 4, 'genkidama', vegL({ hc: WHT, sk: '#e0d8d0', x: '#3a5ab0', ex: 'redeye' }), ['superbaby', 'superbabyape'], {}],
  ['super17', 'Super 17', 6, 4, 'explosive', { h: 'straight', t: '#2a2a3a', b: '#2a2a3a', l: '#e07030', k: '#3a3a3a', ex: 'bandana' }, ['generic'], {}],
  ['myuu', 'Dr. Myuu', 6, 2, 'kiblast', { h: 'bald', ex: 'glasses', sk: '#a0c0e0', body: 'robe', t: WHT, l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, [], {}],
  ['rilldo', 'General Rilldo', 6, 3, 'scatter', { h: 'bald', sk: '#c0c0c0', t: '#8a8a8a', b: '#8a8a8a', l: '#5a5a5a', k: '#5a5a5a', sc: 1.2, alien: 1 }, [], {}],
  ['omega', 'Omega Shenron', 6, 5, 'genkidama', { h: 'ssj', hc: WHT, sk: '#e0e8f0', t: WHT, b: WHT, l: '#e0e8f0', k: '#e0e8f0', ex: 'redeye', tail: '#e0e8f0', alien: 1 }, ['generic'], {}],
  ['nuova', 'Nuova Shenron', 6, 3, 'genkidama', { h: 'bald', sk: '#f08030', t: '#2a2a3a', b: '#2a2a3a', l: '#f0c030', k: '#2a2a3a', alien: 1 }, [], {}],
  ['eis', 'Eis Shenron', 6, 3, 'scatter', { h: 'straight', hc: '#e0f0ff', sk: '#a0c0e0', t: '#3a5ab0', b: '#3a5ab0', l: '#2a2a3a', k: '#2a2a3a', alien: 1 }, [], {}],
  ['haze', 'Haze Shenron', 6, 2, 'aura', { h: 'antenna', hc: '#5a8a3a', sk: '#5a8a3a', t: '#3a5a2a', b: '#3a5a2a', l: '#2a2a2a', k: '#2a2a2a', alien: 1 }, [], {}],
  ['rage_sh', 'Rage Shenron', 6, 2, 'chain', { h: 'bald', sk: '#4a7ae0', sc: 1.2, t: '#2a2a3a', b: '#2a2a3a', l: '#f0c030', k: '#2a2a3a', alien: 1 }, [], {}],
  ['oceanus', 'Oceanus Shenron', 6, 2, 'sokidan', { h: 'twin', hc: '#3a6ae0', t: '#a03030', b: '#a03030', l: '#3a6ae0', k: '#3a3a3a' }, [], {}],
  ['naturon', 'Naturon Shenron', 6, 1, 'punch', { h: 'bald', sk: '#3a4a3a', t: '#3a4a3a', b: '#3a4a3a', l: '#5a5a3a', k: '#2a2a2a', alien: 1 }, [], {}],
  ['majuub', 'Majuub', 6, 3, 'kamehameha', { h: 'mohawk', sk: '#7a4a2a', t: '#c0a050', b: '#c0a050', l: '#3a3a3a', k: '#3a3a3a' }, ['potential'], {}],
  ['gohan_gt', 'Gohan (GT)', 6, 3, 'masenko', { h: 'bowl', t: '#e0b030', b: '#3a3a6a', l: '#3a3a3a', k: '#3a3a3a' }, ['ultimate'], { saiyan: 1 }],

  // ---------------- 7 · Super: Dioses ----------------
  ['beerus', 'Bills', 7, 5, 'hakai', catL({}), ['destroyer'], {}],
  ['whis', 'Whis', 7, 5, 'kiorbs', angelL({}), ['angel'], {}],
  ['goku_god', 'Goku (SSJ Dios)', 7, 4, 'kamehameha', gokuL({}), ['god', 'blue'], { saiyan: 1 }],
  ['vegeta_blue', 'Vegeta (SSJ Blue)', 7, 4, 'galick', vegL({}), ['god', 'vegblue'], { saiyan: 1 }],
  ['golden_frieza', 'Golden Freezer', 7, 5, 'deathbeam', friL({}), ['golden'], {}],
  ['tagoma', 'Tagoma', 7, 2, 'kiblast', armL({ h: 'bald', sk: '#d0a0a0', alien: 1 }), [], {}],
  ['sorbet', 'Sorbet', 7, 1, 'deathbeam', armL({ h: 'bald', sk: '#4a7ae0', sc: 0.7, alien: 1 }), [], {}],
  ['shisami', 'Shisami', 7, 2, 'rush', armL({ h: 'bald', sk: '#7ab0c0', alien: 1 }), [], {}],
  ['champa', 'Champa', 7, 4, 'hakai', catL({ sk: '#a8a0b8', hc: '#a8a0b8', sc: 1.35 }), ['destroyer'], {}],
  ['vados', 'Vados', 7, 5, 'kiorbs', angelL({ sk: '#7ab0f0', t: '#3a5ab0' }), ['angel'], {}],
  ['hit', 'Hit', 7, 4, 'deathbeam', { h: 'bald', ex: 'horns2', sk: '#a070d0', body: 'robe', t: '#d8d0c0', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, ['pure'], {}],
  ['cabba', 'Cabba', 7, 3, 'kiblast', vegL({ t: '#3a3a6a', x: '#6a8ad0' }), ['vegssj', 'vegssj2'], { saiyan: 1 }],
  ['frost', 'Frost', 7, 3, 'deathbeam', friL({ sk: WHT, x: '#3a8ad0' }), ['full'], {}],
  ['magetta', 'Magetta', 7, 2, 'explosive', { h: 'bald', sk: '#6a6a7a', sc: 1.4, t: '#6a6a7a', b: '#6a6a7a', l: '#4a4a5a', k: '#4a4a5a', alien: 1 }, [], {}],
  ['botamo', 'Botamo', 7, 1, 'aura', catL({ sk: '#e0b060', hc: '#e0b060', t: '#3a5ab0', sc: 1.35, ex: '' }), [], {}],
  ['monaka', 'Monaka', 7, 2, 'punch', { h: 'bald', sk: '#4a7ae0', sc: 0.8, t: '#3a3a3a', b: '#3a3a3a', l: '#e0c040', k: '#3a3a3a', alien: 1 }, [], {}],
  ['jaco', 'Jaco', 7, 2, 'kiblast', { h: 'bald', sk: '#9a9ab0', t: '#3a3a3a', b: WHT, l: '#e0c040', k: '#3a3a3a', sc: 0.85, alien: 1 }, [], {}],

  // ---------------- 8 · Super: Goku Black ----------------
  ['goku_black', 'Goku Black', 8, 5, 'sword', { h: 'goku', t: '#2a2a3a', b: '#2a2a3a', l: '#c03030', k: '#3a3a3a', ex: 'potara' }, ['rose'], {}],
  ['zamasu', 'Zamasu', 8, 4, 'kiorbs', kaiL({ sk: '#7adc7a', t: '#4a3a7a' }), ['immortal'], {}],
  ['fused_zamasu', 'Zamasu Fusionado', 8, 5, 'hellzone', kaiL({ sk: '#7adc7a', t: '#d8d0f0', ex: 'potara,halo' }), ['corrupt'], {}],
  ['trunks_super', 'Trunks (Super)', 8, 4, 'sword', { h: 'bowl', hc: LAV, t: '#3a3a6a', b: '#4a4a4a', l: '#c08030', k: '#c08030', ex: 'sword' }, ['ssj', 'srage'], { saiyan: 1 }],
  ['mai_future', 'Mai (Futuro)', 8, 1, 'scatter', { h: 'bob', t: '#5a6a3a', b: '#3a3a3a', l: '#3a3a3a', k: '#3a3a3a' }, [], {}],
  ['vegito_blue', 'Vegetto Blue', 8, 5, 'sword', vegitoL({}), ['blue'], { saiyan: 1 }],
  ['goku_bluekk', 'Goku (Blue Kaio-ken)', 8, 4, 'kamehameha', gokuL({}), ['blue', 'bluekk'], { saiyan: 1 }],
  ['gowasu', 'Gowasu', 8, 2, 'aura', kaiL({ h: 'bald', ex: 'beard,potara', sk: '#7adc7a', sc: 0.8 }), [], {}],

  // ---------------- 9 · Torneo del Poder ----------------
  ['goku_ui', 'Goku (Ultra Instinto)', 9, 5, 'kamehameha', gokuL({}), ['blue', 'ui_sign', 'ui'], { saiyan: 1 }],
  ['jiren', 'Jiren', 9, 5, 'bigbang', prideL({ h: 'bald', sk: '#d8a0a0', sc: 1.25, alien: 1 }), ['fullpow'], {}],
  ['toppo', 'Toppo', 9, 4, 'hakai', prideL({ h: 'bald', ex: 'mustache', sk: '#e0c0a0', sc: 1.35 }), ['destroyer'], {}],
  ['dyspo', 'Dyspo', 9, 3, 'rush', prideL({ h: 'cat', hc: '#a070d0', sk: '#a070d0', sc: 0.8, alien: 1 }), [], {}],
  ['kefla', 'Kefla', 9, 4, 'sokidan', { h: 'twin', t: RED, b: '#e0d0a0', l: '#3a3a3a', k: '#3a3a3a', ex: 'potara' }, ['ssj', 'ssj2'], { saiyan: 1 }],
  ['caulifla', 'Caulifla', 9, 3, 'kiblast', { h: 'vegeta', t: RED, b: '#e0d0a0', l: '#3a3a3a', k: '#3a3a3a' }, ['vegssj', 'vegssj2'], { saiyan: 1 }],
  ['kale', 'Kale', 9, 4, 'genkidama', { h: 'twin', t: RED, b: '#e0d0a0', l: '#3a3a3a', k: '#3a3a3a' }, ['berserk'], { saiyan: 1 }],
  ['a17_super', 'Androide 17 (Super)', 9, 4, 'explosive', { h: 'straight', t: '#3a7a3a', b: '#5a5a3a', l: '#3a3a3a', k: '#5a3a2a', ex: 'scarf' }, ['generic'], {}],
  ['a18_super', 'Androide 18 (Super)', 9, 3, 'kienzan', { h: 'bob', hc: '#ffe080', t: '#3a5ab0', b: '#3a3a6a', l: '#3a3a3a', k: '#3a3a3a' }, ['generic'], {}],
  ['gohan_super', 'Gohan (Super)', 9, 4, 'masenko', { h: 'bowl', t: PURP, b: PURP, l: RED, k: '#7a4a2a' }, ['ultimate'], { saiyan: 1 }],
  ['frieza_top', 'Freezer (Torneo)', 9, 4, 'deathbeam', friL({}), ['golden'], {}],
  ['ribrianne', 'Ribrianne', 9, 2, 'sokidan', { h: 'twin', hc: '#ff80c0', t: '#ff80c0', b: '#ff80c0', l: WHT, k: WHT }, [], {}],
  ['anilaza', 'Anilaza', 9, 4, 'explosive', { h: 'bald', sk: '#6a6a9a', sc: 1.7, t: '#5a5a7a', b: '#5a5a7a', l: '#3a3a5a', k: '#3a3a5a', alien: 1 }, [], {}],
  ['vegeta_top', 'Vegeta (Torneo)', 9, 4, 'galick', vegL({}), ['vegblue', 'blueevo'], { saiyan: 1 }],
  ['belmod', 'Belmod', 9, 4, 'hakai', { h: 'bald', sk: '#e0c0f0', t: '#3a3a3a', b: '#3a3a3a', l: '#c03030', k: '#3a3a3a', ex: 'mustache', alien: 1 }, ['destroyer'], {}],
  ['zeno', 'Zeno-sama', 9, 5, 'hakai', { h: 'bald', sk: '#9ab0e0', body: 'robe', t: '#e0c040', l: '#3a3a8a', k: '#3a3a8a', sc: 0.7, alien: 1 }, ['generic'], {}],
  ['grandpriest', 'Gran Sacerdote', 9, 5, 'kiorbs', angelL({ sk: '#7ab0f0', t: '#2a2a3a', ex: 'eye3' }), ['angel'], {}],

  // ---------------- 10 · Super: Héroes ----------------
  ['broly_super', 'Broly (Super)', 10, 5, 'explosive', { h: 'long', t: SKIN, b: WHT, l: '#3a3a3a', k: '#3a3a3a', sc: 1.3 }, ['wrath', 'lssj'], { saiyan: 1 }],
  ['gogeta_blue', 'Gogeta Blue', 10, 5, 'kamehameha', gogetaL({}), ['blue'], { saiyan: 1 }],
  ['cheelai', 'Cheelai', 10, 1, 'kiblast', { h: 'bob', hc: WHT, sk: '#6aca7a', t: '#6a3a6a', b: '#6a3a6a', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, [], {}],
  ['lemo', 'Lemo', 10, 1, 'kiblast', { h: 'bald', sk: '#8a7a6a', t: '#6a3a6a', b: '#6a3a6a', l: '#3a3a3a', k: '#3a3a3a', sc: 0.85, alien: 1 }, [], {}],
  ['moro', 'Moro', 10, 4, 'aura', { h: 'bald', ex: 'horns2,beard', sk: '#d8c8a0', body: 'robe', t: '#4a3a6a', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, ['merged'], {}],
  ['seven_three', '73 (Seven-Three)', 10, 3, 'punch', { h: 'bald', sk: '#4a4a8a', t: '#2a2a3a', b: '#2a2a3a', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, [], {}],
  ['merus', 'Merus', 10, 4, 'kiorbs', { h: 'mohawk', hc: WHT, t: '#2a2a3a', b: '#2a2a3a', l: '#3a6ad0', k: '#3a3a3a' }, ['ui_sign'], {}],
  ['granolah', 'Granola', 10, 4, 'deathbeam', { h: 'straight', hc: WHT, t: '#3a3a3a', b: '#3a3a3a', l: '#c03030', k: '#3a3a3a' }, ['awakened'], {}],
  ['gas', 'Gas', 10, 4, 'punch', { h: 'bald', sk: '#6a8ad0', sc: 1.25, t: '#3a3a3a', b: '#3a3a3a', l: '#c03030', k: '#3a3a3a', alien: 1 }, ['gasfull'], {}],
  ['elec', 'Elec', 10, 3, 'kiblast', { h: 'bald', sk: '#6a8ad0', t: '#3a3a3a', b: '#3a3a3a', l: '#c03030', k: '#3a3a3a', alien: 1 }, [], {}],
  ['gohan_beast', 'Gohan (Super Hero)', 10, 5, 'makanko', { h: 'bowl', t: PURP, b: PURP, l: RED, k: '#7a4a2a', ex: 'glasses' }, ['potential', 'beast'], { saiyan: 1 }],
  ['orange_piccolo', 'Piccolo (Super Hero)', 10, 4, 'makanko', picL({}), ['potential', 'orange'], {}],
  ['gamma1', 'Gamma 1', 10, 3, 'kiblast', { h: 'bowl', hc: '#2a2a3a', sk: '#e0e0e0', t: RED, b: '#2a2a2a', l: '#2a2a2a', k: '#2a2a2a', cape: RED }, [], {}],
  ['gamma2', 'Gamma 2', 10, 3, 'scatter', { h: 'bowl', hc: '#e07030', sk: '#e0e0e0', t: '#3a8ad0', b: '#2a2a2a', l: '#2a2a2a', k: '#2a2a2a', cape: '#3a8ad0' }, [], {}],
  ['cell_max', 'Cell Max', 10, 5, 'explosive', cellL({ sk: '#a0d080', t: '#a0d080', b: '#a0d080', l: '#a0d080', x: '#e06020', sc: 1.7, ex: 'spots,redeye' }), [], {}],
  ['magenta', 'Magenta', 10, 1, 'kiblast', { h: 'bald', ex: 'mustache', t: '#ff60c0', b: '#3a3a3a', l: '#3a3a3a', k: '#3a3a3a' }, [], {}],
  ['carmine', 'Carmine', 10, 1, 'kiblast', { h: 'bob', hc: '#c03030', t: '#2a2a2a', b: '#2a2a2a', l: '#3a3a3a', k: '#3a3a3a' }, [], {}],
  ['vegeta_ue', 'Vegeta (Ultra Ego)', 10, 5, 'punch', vegL({}), ['vegblue', 'ue'], { saiyan: 1 }],
  ['black_frieza', 'Black Freezer', 10, 5, 'deathbeam', friL({}), ['golden', 'black'], {}],

  // ---------------- 11 · Dragon Ball Daima ----------------
  ['goku_mini', 'Goku (Mini)', 11, 4, 'kamehameha', gokuL({ sc: 0.7, t: '#3a5ab0', b: GOKU_OR, l: '#3a3a3a', k: '#7a4a2a' }), ['ssj', 'ssj3', 'ssj4'], { saiyan: 1 }],
  ['vegeta_mini', 'Vegeta (Mini)', 11, 3, 'galick', vegL({ sc: 0.7 }), ['vegssj', 'vegssj2'], { saiyan: 1 }],
  ['piccolo_daima', 'Piccolo (Daima)', 11, 3, 'makanko', picL({}), ['weighted'], {}],
  ['glorio', 'Glorio', 11, 3, 'kiblast', { h: 'bowl', hc: '#3a8ad0', sk: '#7ab0f0', t: '#3a3a6a', b: '#3a3a6a', l: '#e0c040', k: '#3a3a3a', alien: 1 }, [], {}],
  ['panzy', 'Panzy', 11, 2, 'kiorbs', { h: 'twin', hc: '#ff80c0', sk: '#e0c0f0', t: '#e04a8a', b: '#e04a8a', l: WHT, k: WHT, sc: 0.8, alien: 1 }, [], {}],
  ['kaioshin_mini', 'Kaio-shin (Mini)', 11, 2, 'taiyoken', kaiL({ sc: 0.7 }), [], {}],
  ['gomah', 'Gomah', 11, 4, 'hellzone', { h: 'horns', hc: '#f0e0a0', x: '#4a3a8a', sk: '#4a5ab0', body: 'robe', t: '#7a3aa0', l: '#e0c040', k: '#3a3a3a', alien: 1 }, ['thirdeye'], {}],
  ['degesu', 'Degesu', 11, 3, 'rush', armL({ h: 'bowl', hc: WHT, sk: '#5a7ad0', x: '#c0a040', alien: 1 }), [], {}],
  ['arinsu', 'Dra. Arinsu', 11, 2, 'sokidan', { h: 'long', hc: '#f0a0f0', sk: '#f0b0e0', t: '#7a3aa0', b: '#7a3aa0', l: '#e0c040', k: '#3a3a3a', alien: 1 }, [], {}],
  ['tamagami', 'Tamagami', 11, 3, 'punch', { h: 'bald', sk: '#d0a040', sc: 1.4, t: '#d0a040', b: '#d0a040', l: '#7a4a2a', k: '#7a4a2a', alien: 1 }, [], {}],
  ['kuu', 'Majin Kuu', 11, 3, 'candy', buuL({ sk: '#f0a0c8', t: '#f0a0c8', sc: 0.8 }), [], {}],
  ['duu', 'Majin Duu', 11, 3, 'kiblast', buuL({ sk: '#7ab0f0', hc: '#7ab0f0', t: '#7ab0f0', sc: 0.85 }), [], {}],
  ['neva', 'Neva', 11, 2, 'aura', { h: 'tall', hc: '#c0c0f0', sk: '#e0e0f0', body: 'robe', t: '#3a3a6a', l: '#e0c040', k: '#3a3a3a', alien: 1 }, [], {}],
];

const CHARS = [];
const CHAR_BY = {};
(function buildChars() {
  // Estadísticas base por rareza (vida, ataque, velocidad)
  const BASE = [null, { hp: 110, atk: 0.9 }, { hp: 118, atk: 1.0 }, { hp: 126, atk: 1.1 }, { hp: 136, atk: 1.22 }, { hp: 150, atk: 1.36 }];
  const PL = [0, 1200, 9000, 180000, 3.5e6, 1.5e8];
  const SAGA_PL = [0.02, 0.15, 3, 20, 120, 150, 400, 4000, 6000, 30000, 50000, 60000];
  let hash = 7;
  for (const [id, name, saga, r, move, look, forms, extra] of CHAR_LIST) {
    hash = (hash * 31 + id.length * 17 + saga) % 997;
    const b = BASE[r];
    const sc = look.sc || 1;
    const c = {
      id, name, saga, r, move, look,
      forms: forms.map(f => Object.assign({ key: f }, FORMS[f])),
      hp: Math.round(b.hp * (sc > 1.2 ? 1.15 : sc < 0.8 ? 0.9 : 1)),
      atk: +(b.atk * (1 + (hash % 9) / 100)).toFixed(2),
      spd: Math.round(100 * (sc > 1.2 ? 0.9 : sc < 0.8 ? 1.1 : 1) + (hash % 7) - 3),
      pl: Math.round(PL[r] * SAGA_PL[saga] * (1 + (hash % 50) / 100)) || 5,
      starter: !!extra.starter,
      saiyan: !!extra.saiyan,
    };
    if (!c.forms.length) c.forms = [Object.assign({ key: 'generic' }, FORMS.generic)];
    CHARS.push(c);
    CHAR_BY[id] = c;
  }
})();

// ---- Enemigos (esbirros) por saga: [nombre, look, comportamiento] ----
// comportamientos: chase · fast · tank · ranged · fan · beamer · healer · shielder · summoner · bomber · jumper · thief
const MINIONS = [
  [
    ['Soldado Red Ribbon', { h: 'bowl', hc: '#3a3a3a', t: '#8a8a5a', b: '#8a8a5a', l: '#c03030', k: BLK }, 'chase'],
    ['Lobo Salvaje', { h: 'cat', hc: '#8a8a9a', sk: '#8a8a9a', t: '#8a8a9a', b: '#8a8a9a', l: '#6a6a7a', k: '#6a6a7a', sc: 0.85, alien: 1 }, 'fast'],
    ['Robot Red Ribbon', { h: 'dome', x: '#8a8a9a', sk: '#a0a0b0', t: '#8a8a9a', b: '#8a8a9a', l: '#c03030', k: '#5a5a6a', sc: 1.3, alien: 1 }, 'tank'],
    ['Francotirador RR', { h: 'bowl', hc: '#3a3a3a', t: '#5a7a4a', b: '#5a7a4a', l: '#c03030', k: BLK }, 'ranged'],
    ['Demonio de Piccolo', { h: 'bald', sk: NAMEK, t: NAMEK, b: NAMEK, l: '#3a6a3a', k: '#3a6a3a', wings: '#3a6a3a', alien: 1 }, 'jumper'],
  ],
  [
    ['Saibaman', { h: 'bald', sk: '#4a9a3a', t: '#4a9a3a', b: '#4a9a3a', l: '#4a9a3a', k: '#3a7a2a', sc: 0.8, ex: 'veins', alien: 1 }, 'chase'],
    ['Saibaman Kamikaze', { h: 'bald', sk: '#8ac03a', t: '#8ac03a', b: '#8ac03a', l: '#8ac03a', k: '#5a8a2a', sc: 0.8, ex: 'veins', alien: 1 }, 'bomber'],
    ['Saibaman Ácido', { h: 'bald', sk: '#3a8a6a', t: '#3a8a6a', b: '#3a8a6a', l: '#3a8a6a', k: '#2a6a4a', sc: 0.8, ex: 'veins', alien: 1 }, 'ranged'],
    ['Guerrero Saiyan', armL({ h: 'goku', tail: '#3a2a1a', ex: 'scouter' }), 'tank'],
    ['Saibaman Curandero', { h: 'bald', sk: '#7ad06a', t: '#7ad06a', b: '#7ad06a', l: '#7ad06a', k: '#4a8a3a', sc: 0.8, ex: 'veins', alien: 1 }, 'healer'],
  ],
  [
    ['Soldado de Freezer', armL({ h: 'bald', sk: '#8a6ab0', ex: 'scouter', alien: 1 }), 'chase'],
    ['Tirador de Freezer', armL({ h: 'bowl', hc: '#3a3a3a', sk: '#d0a080', ex: 'scouter' }), 'ranged'],
    ['Bruto de Freezer', armL({ h: 'bald', sk: '#6a8a4a', sc: 1.3, alien: 1 }), 'tank'],
    ['Escudero de Freezer', armL({ h: 'dome', x: '#c050a0', sk: '#c0a0e0', alien: 1 }), 'shielder'],
    ['Explorador Veloz', armL({ h: 'bald', sk: '#4a7ae0', sc: 0.85, alien: 1 }), 'fast'],
  ],
  [
    ['Cell Jr.', cellL({ sk: '#7ab0f0', t: '#7ab0f0', b: '#7ab0f0', l: '#7ab0f0', x: '#3a60b0', wings: null, sc: 0.7 }), 'fast'],
    ['Androide Prototipo', { h: 'bald', sk: '#c0c0c8', t: '#3a6a3a', b: '#5a5a3a', l: '#3a3a3a', k: '#3a3a3a', sc: 1.25, alien: 1 }, 'tank'],
    ['Dron de Gero', { h: 'dome', x: '#d04040', sk: '#a0a0b0', t: '#7a7a8a', b: '#7a7a8a', l: '#3a3a3a', k: '#3a3a3a', sc: 0.8, alien: 1 }, 'beamer'],
    ['Cell Jr. Saltarín', cellL({ sk: '#90c0ff', t: '#90c0ff', b: '#90c0ff', l: '#90c0ff', x: '#4a70c0', wings: null, sc: 0.7 }), 'jumper'],
    ['Androide Tirador', { h: 'straight', t: '#2a2a3a', b: '#3a5ab0', l: '#2a2a3a', k: '#5a3a2a' }, 'ranged'],
  ],
  [
    ['Soldado de Babidi', { h: 'bald', ex: 'mark', t: '#7a5a3a', b: '#7a5a3a', l: '#3a3a3a', k: '#3a3a3a' }, 'chase'],
    ['Mini Buu', buuL({ sc: 0.6 }), 'fast'],
    ['Demonio Majin', { h: 'bald', ex: 'mark,horns2', sk: '#c04040', t: '#3a3a3a', b: '#3a3a3a', l: '#3a3a3a', k: '#3a3a3a', sc: 1.3, alien: 1 }, 'tank'],
    ['Hechicero de Babidi', { h: 'bald', sk: '#e0c8a0', ex: 'mark', body: 'robe', t: '#5a5ab0', l: '#c03030', k: '#5a5ab0', sc: 0.8, alien: 1 }, 'summoner'],
    ['Buu de Chicle', buuL({ sc: 0.7, sk: '#ff80b0', t: '#ff80b0' }), 'bomber'],
  ],
  [
    ['Bioguerrero', { h: 'bald', sk: '#6a8a5a', t: '#4a4a3a', b: '#4a4a3a', l: '#3a3a3a', k: '#3a3a3a', ex: 'veins', alien: 1 }, 'chase'],
    ['Fantasma de Janemba', { h: 'horns', hc: '#e0d040', x: '#a03040', sk: '#a03040', t: '#a03040', b: '#a03040', l: '#e0d040', k: '#3a3a3a', sc: 0.7, alien: 1 }, 'fast'],
    ['Dron Meta-Cooler', friL({ x: '#7a6a9a', sk: '#a0a0b8', t: '#a0a0b8', b: '#a0a0b8', l: '#a0a0b8', k: '#a0a0b8', tail: '#a0a0b8', sc: 0.9 }), 'beamer'],
    ['Pirata Galáctico', { h: 'long', hc: '#d03030', sk: '#7ab0c0', t: '#3a3a6a', b: '#3a3a6a', l: '#e0c040', k: '#3a3a3a', alien: 1 }, 'fan'],
    ['Monstruo de Hera', { h: 'bald', sk: '#7a5aa0', t: '#7a5aa0', b: '#7a5aa0', l: '#5a3a7a', k: '#5a3a7a', sc: 1.35, alien: 1 }, 'tank'],
  ],
  [
    ['Mutante Máquina', { h: 'bald', sk: '#a0a0a0', t: '#6a6a6a', b: '#6a6a6a', l: '#c03030', k: '#3a3a3a', alien: 1 }, 'chase'],
    ['Tsufur Parásito', { h: 'bald', sk: '#e0d8d0', t: '#3a5ab0', b: '#3a5ab0', l: '#3a3a3a', k: '#3a3a3a', ex: 'redeye', sc: 0.7, alien: 1 }, 'fast'],
    ['Androide de Myuu', { h: 'dome', x: '#c0c0c0', sk: '#8a8a8a', t: '#6a6a7a', b: '#6a6a7a', l: '#3a3a3a', k: '#3a3a3a', sc: 1.3, alien: 1 }, 'tank'],
    ['Esbirro Sombrío', { h: 'antenna', hc: '#3a3a5a', sk: '#3a3a5a', t: '#2a2a3a', b: '#2a2a3a', l: '#a040ff', k: '#2a2a3a', alien: 1 }, 'summoner'],
    ['Cañón Mutante', { h: 'bald', sk: '#a0a0a0', t: '#6a6a6a', b: '#6a6a6a', l: '#3a6ad0', k: '#3a3a3a', alien: 1 }, 'beamer'],
  ],
  [
    ['Soldado Fuerza Freezer', armL({ h: 'bald', sk: '#c08060', alien: 1 }), 'chase'],
    ['Tirador del Universo 6', armL({ h: 'vegeta', t: '#3a3a6a', x: '#6a8ad0' }), 'ranged'],
    ['Gólem de Magma', { h: 'bald', sk: '#6a6a7a', sc: 1.35, t: '#6a6a7a', b: '#6a6a7a', l: '#d06030', k: '#4a4a5a', alien: 1 }, 'tank'],
    ['Ojos de Bills', catL({ sc: 0.7, ex: '' }), 'fast'],
    ['Sacerdote Menor', angelL({ sc: 0.8 }), 'healer'],
  ],
  [
    ['Clon de Zamasu', kaiL({ sk: '#7adc7a', t: '#4a3a7a', sc: 0.9 }), 'chase'],
    ['Sombra de Black', { h: 'goku', t: '#2a2a3a', b: '#2a2a3a', l: '#c03030', k: '#3a3a3a', sc: 0.9 }, 'fast'],
    ['Juez de Zamasu', kaiL({ sk: '#7adc7a', t: '#d8d0f0' }), 'beamer'],
    ['Mano Divina', kaiL({ sk: '#9aec9a', t: '#f0e0ff', sc: 1.3 }), 'tank'],
    ['Profeta de Zamasu', kaiL({ sk: '#7adc7a', t: '#7a3aa0' }), 'shielder'],
  ],
  [
    ['Guerrero del U-3', { h: 'dome', x: '#a0a0b0', sk: '#c0c0c8', t: '#6a6a7a', b: '#6a6a7a', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, 'chase'],
    ['Tropa del Orgullo', prideL({ h: 'bowl', hc: '#3a3a3a' }), 'ranged'],
    ['Gigante del U-4', { h: 'bald', sk: '#6a6a9a', sc: 1.4, t: '#5a5a7a', b: '#5a5a7a', l: '#3a3a5a', k: '#3a3a5a', alien: 1 }, 'tank'],
    ['Velocista del U-11', prideL({ h: 'cat', hc: '#a070d0', sk: '#a070d0', sc: 0.75, alien: 1 }), 'fast'],
    ['Hechicera del U-2', { h: 'twin', hc: '#ff80c0', t: '#ff80c0', b: '#ff80c0', l: WHT, k: WHT }, 'fan'],
  ],
  [
    ['Prisionero Galáctico', { h: 'bald', sk: '#8a7aa0', t: '#d07030', b: '#d07030', l: '#3a3a3a', k: '#3a3a3a', alien: 1 }, 'chase'],
    ['Androide Red Ribbon', { h: 'bowl', hc: '#2a2a3a', sk: '#e0e0e0', t: RED, b: '#2a2a2a', l: '#2a2a2a', k: '#2a2a2a', cape: RED }, 'ranged'],
    ['Bruto Saiyan', { h: 'long', t: SKIN, b: WHT, l: '#3a3a3a', k: '#3a3a3a', sc: 1.3 }, 'tank'],
    ['Heeter Veloz', { h: 'bald', sk: '#6a8ad0', t: '#3a3a3a', b: '#3a3a3a', l: '#c03030', k: '#3a3a3a', sc: 0.85, alien: 1 }, 'fast'],
    ['Científico RR', { h: 'bald', ex: 'glasses', t: WHT, b: '#3a3a3a', body: 'robe', l: RED, k: '#3a3a3a' }, 'summoner'],
  ],
  [
    ['Demonio Menor', { h: 'horns', hc: '#f0e0a0', x: '#4a3a8a', sk: '#4a5ab0', t: '#3a3a3a', b: '#3a3a3a', l: '#3a3a3a', k: '#3a3a3a', sc: 0.8, alien: 1 }, 'chase'],
    ['Guardia de Gomah', armL({ h: 'bowl', hc: WHT, sk: '#5a7ad0', x: '#c0a040', alien: 1 }), 'ranged'],
    ['Tamagami Menor', { h: 'bald', sk: '#d0a040', sc: 1.35, t: '#d0a040', b: '#d0a040', l: '#7a4a2a', k: '#7a4a2a', alien: 1 }, 'tank'],
    ['Diablillo Volador', { h: 'cat', hc: '#a040ff', sk: '#a040ff', t: '#3a3a3a', b: '#3a3a3a', l: '#3a3a3a', k: '#3a3a3a', sc: 0.6, wings: '#3a3a3a', alien: 1 }, 'jumper'],
    ['Bruja Demoníaca', { h: 'long', hc: '#f0a0f0', sk: '#f0b0e0', t: '#7a3aa0', b: '#7a3aa0', l: '#e0c040', k: '#3a3a3a', alien: 1 }, 'healer'],
  ],
];

// Jefes de cada saga: [mini jefe, jefe final de la saga]
const SAGA_BOSSES = [
  ['taopaipai', 'kingpiccolo'],
  ['nappa', 'vegeta_s'],
  ['ginyu', 'frieza_final'],
  ['cell_imperfect', 'cell_perfect'],
  ['dabura', 'kidbuu'],
  ['cooler', 'janemba'],
  ['super17', 'omega'],
  ['hit', 'beerus'],
  ['goku_black', 'fused_zamasu'],
  ['toppo', 'jiren'],
  ['moro', 'cell_max'],
  ['tamagami', 'gomah'],
];

// Legendarios de las grietas temporales y su arena
const ARENAS = [
  { id: 'namek', name: 'Namek en Llamas', bg: ['#3a8a6a', '#2f7f5f', '#459575'], hazard: 'lava', legends: ['frieza_final', 'golden_frieza', 'black_frieza', 'cooler'] },
  { id: 'cellring', name: 'Ring de los Juegos de Cell', bg: ['#d8d0c0', '#ccc4b4', '#e4dccc'], hazard: 'none', legends: ['cell_perfect', 'cell_max', 'android16'] },
  { id: 'kaiplanet', name: 'Planeta de los Kaio-shin', bg: ['#7fbf5f', '#74b454', '#8aca6a'], hazard: 'none', legends: ['kidbuu', 'superbuu', 'janemba'] },
  { id: 'hell', name: 'Infierno', bg: ['#6a2a3a', '#5f1f2f', '#753545'], hazard: 'lava', legends: ['janemba', 'kingpiccolo', 'bojack'] },
  { id: 'timechamber', name: 'Habitación del Tiempo', bg: ['#f0f0f8', '#e6e6ee', '#fafaff'], hazard: 'gravity', legends: ['gohan_cell', 'vegito', 'gogeta_ssj'] },
  { id: 'glacier', name: 'Glaciar del Norte', bg: ['#a0d0f0', '#94c4e4', '#acdcfc'], hazard: 'ice', legends: ['broly_z', 'broly_super', 'gogeta_blue'] },
  { id: 'beerusplanet', name: 'Planeta de Bills', bg: ['#a0a878', '#959d6d', '#abb383'], hazard: 'none', legends: ['beerus', 'whis', 'champa', 'vados'] },
  { id: 'nullrealm', name: 'Mundo del Vacío', bg: ['#2a2a4a', '#20203f', '#353555'], hazard: 'gravity', legends: ['jiren', 'goku_ui', 'toppo', 'kefla'] },
  { id: 'futureruins', name: 'Ruinas del Futuro', bg: ['#6a6a72', '#606068', '#75757d'], hazard: 'none', legends: ['goku_black', 'fused_zamasu', 'vegito_blue'] },
  { id: 'netherworld', name: 'Abismo de los Dragones', bg: ['#3a2a4a', '#30203f', '#453555'], hazard: 'ice', legends: ['omega', 'baby', 'gogeta_ssj4', 'goku_ssj4'] },
  { id: 'redribbon', name: 'Base Red Ribbon', bg: ['#8a8a6a', '#7f7f60', '#959575'], hazard: 'none', legends: ['gohan_beast', 'orange_piccolo', 'vegeta_ue'] },
  { id: 'demonrealm', name: 'Reino Demoníaco', bg: ['#7a4a8a', '#6f417f', '#855595'], hazard: 'lava', legends: ['gomah', 'goku_mini', 'gas', 'moro'] },
];
const LEGENDS = [...new Set(ARENAS.flatMap(a => a.legends))];
