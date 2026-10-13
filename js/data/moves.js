// Técnicas, cartas de mejora, objetos equipables, mejoras permanentes, logros y misiones.
'use strict';

// Clases de técnica:
// melee · dash · proj · fan · burst · beam · orbit · aura · boomerang · chain · meteor · mines · trail · turret · bomb · flash · buff
const MOVES = {
  punch: { name: 'Combo de Puños', cls: 'melee', color: '#ffffff', desc: 'Ráfaga de golpes en arco a lo que tengas delante.',
    p: { dmg: 16, cd: 0.5, range: 38, arc: 2.0, knock: 90 }, evo: { name: 'Puño del Dragón', stat: 'atk' } },
  sword: { name: 'Corte de Espada', cls: 'melee', color: '#c8e0ff', desc: 'Tajo amplio y largo con espada o ki cortante.',
    p: { dmg: 18, cd: 0.8, range: 40, arc: 2.2, knock: 40 }, evo: { name: 'Espada Espiritual', stat: 'cd' } },
  rush: { name: 'Patada Voladora', cls: 'dash', color: '#ffe080', desc: 'Te lanzas contra el enemigo y golpeas todo el camino.',
    p: { dmg: 22, cd: 1.6, dist: 80, width: 14 }, evo: { name: 'Ataque Meteoro', stat: 'spd' } },
  teleport: { name: 'Teletransportación', cls: 'dash', color: '#80e0ff', desc: 'Apareces tras el enemigo atravesando a todos.',
    p: { dmg: 26, cd: 2.0, dist: 110, width: 12 }, evo: { name: 'Kamehameha Instantáneo', stat: 'cd' } },
  kiblast: { name: 'Ráfaga de Ki', cls: 'proj', color: '#ffe060', desc: 'Esferas de ki al enemigo más cercano.',
    p: { dmg: 11, cd: 0.38, count: 1, speed: 230, size: 3, pierce: 0, life: 1.4 }, evo: { name: 'Ráfaga Infinita', stat: 'cd' } },
  sokidan: { name: 'Sokidan', cls: 'proj', color: '#80d0ff', desc: 'Esfera teledirigida que persigue a su objetivo.',
    p: { dmg: 14, cd: 0.9, count: 1, speed: 150, size: 4, pierce: 1, life: 3, homing: 1 }, evo: { name: 'Sokidan Supremo', stat: 'cd' } },
  makanko: { name: 'Makankosappo', cls: 'proj', color: '#ffff80', desc: 'Rayo en espiral rapidísimo que lo atraviesa todo.',
    p: { dmg: 30, cd: 1.5, count: 1, speed: 420, size: 2, pierce: 8, life: 1.2, spiral: 1 }, evo: { name: 'Makankosappo Definitivo', stat: 'atk' } },
  deathbeam: { name: 'Rayo Mortal', cls: 'proj', color: '#ff70ff', desc: 'Disparo con el dedo, veloz y letal.',
    p: { dmg: 22, cd: 0.7, count: 1, speed: 480, size: 2, pierce: 1, life: 0.9, thin: 1 }, evo: { name: 'Rayo Mortal Múltiple', stat: 'cd' } },
  bigbang: { name: 'Big Bang Attack', cls: 'proj', color: '#70d0ff', desc: 'Esfera que estalla en una gran explosión.',
    p: { dmg: 26, cd: 1.6, count: 1, speed: 170, size: 5, pierce: 0, life: 1.6, explode: 34 }, evo: { name: 'Final Big Bang', stat: 'atk' } },
  candy: { name: 'Rayo Caramelo', cls: 'proj', color: '#ff80c0', desc: 'Convierte en caramelo a los enemigos debilitados (<30% vida).',
    p: { dmg: 16, cd: 0.9, count: 1, speed: 180, size: 3, pierce: 0, life: 2, homing: 1, exec: 0.3 }, evo: { name: 'Lluvia de Caramelos', stat: 'mag' } },
  scatter: { name: 'Disparo Disperso', cls: 'fan', color: '#ffd080', desc: 'Lluvia de ki en abanico corto.',
    p: { dmg: 9, cd: 0.8, count: 5, speed: 220, size: 2, pierce: 0, life: 0.55, arc: 0.9 }, evo: { name: 'Lluvia Mortal', stat: 'cd' } },
  explosive: { name: 'Onda Explosiva', cls: 'burst', color: '#ffb040', desc: 'Estallido de ki en todas direcciones.',
    p: { dmg: 13, cd: 1.6, count: 8, speed: 160, size: 3, pierce: 0, life: 0.8 }, evo: { name: 'Explosión Final', stat: 'hp' } },
  kamehameha: { name: 'Kamehameha', cls: 'beam', color: '#59d6ff', desc: 'La onda vital de la Escuela Tortuga.',
    p: { dmg: 8, cd: 1.8, len: 170, width: 9, dur: 0.75 }, evo: { name: 'Kamehameha x10', stat: 'atk' } },
  galick: { name: 'Galick Gun', cls: 'beam', color: '#c070ff', desc: 'El rayo morado de Vegeta.',
    p: { dmg: 9, cd: 2.0, len: 160, width: 10, dur: 0.7 }, evo: { name: 'Final Flash', stat: 'atk' } },
  masenko: { name: 'Masenko', cls: 'beam', color: '#fff060', desc: 'Ráfaga dorada lanzada sobre la cabeza.',
    p: { dmg: 7, cd: 1.5, len: 140, width: 8, dur: 0.6 }, evo: { name: 'Masenko Definitivo', stat: 'hp' } },
  kikoho: { name: 'Kikoho', cls: 'beam', color: '#f0f070', desc: 'Rayo corto y muy ancho en forma de triángulo.',
    p: { dmg: 10, cd: 1.9, len: 90, width: 22, dur: 0.6 }, evo: { name: 'Neo Kikoho', stat: 'def' } },
  kienzan: { name: 'Kienzan', cls: 'boomerang', color: '#ffff90', desc: 'Disco cortante que va y vuelve.',
    p: { dmg: 20, cd: 1.4, count: 1, dist: 120, size: 5, speed: 220 }, evo: { name: 'Kienzan Doble', stat: 'cd' } },
  kiorbs: { name: 'Esferas de Ki', cls: 'orbit', color: '#90d8ff', desc: 'Esferas que giran a tu alrededor.',
    p: { dmg: 10, count: 3, radius: 30, rot: 3.2, size: 4, hitcd: 0.4 }, evo: { name: 'Barrera Galáctica', stat: 'rgn' } },
  aura: { name: 'Aura de Combate', cls: 'aura', color: '#ffd848', desc: 'Tu aura daña todo lo que se acerca.',
    p: { dmg: 7, radius: 30, tick: 0.45, slow: 0.25 }, evo: { name: 'Aura Divina', stat: 'def' } },
  hellzone: { name: 'Granada Infernal', cls: 'meteor', color: '#a0ff70', desc: 'Esferas que rodean y caen sobre los enemigos.',
    p: { dmg: 20, cd: 1.6, count: 3, radius: 20, delay: 0.55 }, evo: { name: 'Granada Infernal Definitiva', stat: 'cd' } },
  hakai: { name: 'Hakai', cls: 'meteor', color: '#c060ff', desc: 'Destrucción divina: borra a los debilitados (<25% vida).',
    p: { dmg: 24, cd: 2.0, count: 2, radius: 18, delay: 0.7, exec: 0.25 }, evo: { name: 'Hakai Absoluto', stat: 'atk' } },
  genkidama: { name: 'Genkidama', cls: 'bomb', color: '#70e0ff', desc: 'Una enorme esfera de energía que lo arrasa todo.',
    p: { dmg: 70, cd: 3.6, size: 10, speed: 90, radius: 60 }, evo: { name: 'Super Genkidama', stat: 'hp' } },
  taiyoken: { name: 'Taiyoken', cls: 'flash', color: '#ffffff', desc: 'Destello que ciega y paraliza a los cercanos.',
    p: { dmg: 8, cd: 3.2, radius: 90, stun: 1.6 }, evo: { name: 'Taiyoken Cegador', stat: 'mag' } },
  chain: { name: 'Relámpago de Ki', cls: 'chain', color: '#80ffff', desc: 'Un rayo que salta de enemigo en enemigo.',
    p: { dmg: 14, cd: 0.9, jumps: 3, range: 70 }, evo: { name: 'Trueno Divino', stat: 'cd' } },
  mines: { name: 'Bombas de Ki', cls: 'mines', color: '#ff9060', desc: 'Siembra minas de ki que estallan al pisarlas.',
    p: { dmg: 26, cd: 1.3, count: 2, radius: 26, life: 8 }, evo: { name: 'Campo Minado', stat: 'atk' } },
  trail: { name: 'Estela Ardiente', cls: 'trail', color: '#ff8040', desc: 'Dejas un rastro de ki ardiente al moverte.',
    p: { dmg: 6, cd: 0.18, radius: 9, life: 2.4, tick: 0.4 }, evo: { name: 'Infierno Ardiente', stat: 'spd' } },
  clone: { name: 'Multiforme', cls: 'turret', color: '#ffe0a0', desc: 'Un clon tuyo se queda disparando por ti.',
    p: { dmg: 9, cd: 4.5, dur: 7, rate: 0.5, max: 1 }, evo: { name: 'Cuatro Clones', stat: 'def' } },
  kaioken: { name: 'Kaio-ken', cls: 'buff', color: '#ff4040', desc: 'No hace daño: acumula ATAQUE mientras esté activo.',
    p: { stat: 'atk', rate: 0.02, cap: 0.6 } },
  afterimage: { name: 'Imagen Residual', cls: 'buff', color: '#a0c0ff', desc: 'No hace daño: acumula VELOCIDAD mientras esté activo.',
    p: { stat: 'spd', rate: 0.02, cap: 0.5 } },
  kidefense: { name: 'Ki Defensivo', cls: 'buff', color: '#80ff80', desc: 'No hace daño: acumula DEFENSA mientras esté activo.',
    p: { stat: 'def', rate: 0.015, cap: 0.4 } },
  meditate: { name: 'Meditación', cls: 'buff', color: '#ffe0ff', desc: 'No hace daño: acumula REGENERACIÓN mientras esté activo.',
    p: { stat: 'rgn', rate: 0.15, cap: 4 } },
};

const CLASS_NAMES = {
  melee: 'Cuerpo a cuerpo', dash: 'Embestida', proj: 'Proyectil', fan: 'Abanico', burst: 'Ráfaga', beam: 'Rayo',
  orbit: 'Órbita', aura: 'Aura', boomerang: 'Bumerán', chain: 'Cadena', meteor: 'Meteoros', mines: 'Minas',
  trail: 'Rastro', turret: 'Torreta', bomb: 'Bomba', flash: 'Destello', buff: 'Mejora',
};

const EVO_TEXT = {
  melee: '×1,9 daño, más alcance y golpea en 360°',
  dash: '×1,9 daño, más distancia y menos recarga',
  proj: '×1,8 daño, +2 proyectiles, +2 perforación y más grandes',
  fan: '×1,7 daño, +4 disparos y +1 perforación',
  burst: '+6 proyectiles, ×1,6 daño y +1 perforación',
  beam: '×1,8 daño, rayo un 50% más grueso y más largo',
  orbit: '+2 esferas, ×1,7 daño y más radio',
  aura: '×1,8 daño y un 35% más de radio',
  boomerang: '×1,8 daño, +1 disco y más alcance',
  chain: '×1,7 daño y +3 saltos',
  meteor: '×1,7 daño, +2 impactos y más radio',
  mines: '×1,8 daño, +2 minas y explosión más grande',
  trail: '×1,8 daño, rastro más grande y duradero',
  turret: '×1,8 daño, +1 clon y dispara más rápido',
  bomb: '×1,8 daño y explosión gigantesca',
  flash: '×1,7 daño, más radio y parálisis más larga',
};

// Cartas de estadística (al subir de nivel)
const STAT_CARDS = {
  hp: { title: 'Vigor', icon: '❤', desc: '+20 de vida máxima (y la recupera).' },
  atk: { title: 'Potencia', icon: '✊', desc: '+10% de daño con todas las técnicas.', max: 40 },
  spd: { title: 'Carrera', icon: '👟', desc: '+7% de velocidad de movimiento.', max: 8 },
  cd: { title: 'Reflejos', icon: '⏱', desc: '-8% de recarga en todas las técnicas.', max: 10 },
  def: { title: 'Coraza', icon: '🛡', desc: '+6% de reducción de daño recibido.', max: 12 },
  rgn: { title: 'Semilla del Ermitaño', icon: '🌱', desc: '+0,9 de vida regenerada por segundo.' },
  mag: { title: 'Radar del Dragón', icon: '🧲', desc: '+25% de radio de recogida.', max: 8 },
  xp: { title: 'Sabiduría', icon: '📜', desc: '+10% de experiencia.', max: 8 },
};

// Objetos equipables (sólo uno a la vez, duran la run)
const ITEMS = {
  agua: { name: 'Agua Ultra Divina', icon: '💧', desc: 'Recuperas un 1,5% de tu vida por segundo.' },
  cinturon: { name: 'Cinturón del Campeón', icon: '🥇', desc: '+40% de daño, pero no puedes cambiar de técnica.' },
  brazaletes: { name: 'Brazaletes de Kaio', icon: '⌚', desc: '-20% de recarga en todas tus técnicas.' },
  halo: { name: 'Halo del Otro Mundo', icon: '😇', desc: 'Un golpe que te dejaría KO te deja con 1 de vida (cada 60 s).' },
  cola: { name: 'Cola de Cell', icon: '🦂', desc: 'Recuperas vida con el daño que haces.' },
  tarjeta: { name: 'Tarjeta Capsule Corp.', icon: '💳', desc: '+50% de zeni al acabar la run.' },
  pergamino: { name: 'Pergamino de la Tortuga', icon: '🐢', desc: '+30% de experiencia.' },
  bandakk: { name: 'Banda Kaio-ken', icon: '🔥', desc: '+30% de daño, pero cada ataque te quita un poco de vida.' },
  nube: { name: 'Nube Kinton', icon: '☁', desc: '+35% de velocidad.' },
  pinchos: { name: 'Armadura de Pinchos', icon: '🦔', desc: 'Los que te golpean cuerpo a cuerpo reciben daño.' },
  armadura: { name: 'Armadura Saiyan', icon: '🦺', desc: '+20% de reducción de daño recibido.' },
};

// Mejoras permanentes por personaje (se compran con zeni)
const PUPGRADES = [
  { id: 'hp', name: 'Vitalidad', icon: '❤', unit: '+8 vida', max: 10, base: 60, grow: 1.38 },
  { id: 'atk', name: 'Fuerza', icon: '✊', unit: '+4% daño', max: 10, base: 80, grow: 1.38 },
  { id: 'spd', name: 'Zancada', icon: '👟', unit: '+3% velocidad', max: 8, base: 70, grow: 1.4 },
  { id: 'cd', name: 'Reflejos', icon: '⏱', unit: '-3% recarga', max: 8, base: 90, grow: 1.42 },
  { id: 'def', name: 'Coraza', icon: '🛡', unit: '+2% defensa', max: 8, base: 80, grow: 1.4 },
  { id: 'regen', name: 'Regeneración', icon: '🌱', unit: '+0,2 vida/s', max: 5, base: 120, grow: 1.5 },
  { id: 'magnet', name: 'Imán', icon: '🧲', unit: '+12% recogida', max: 5, base: 70, grow: 1.4 },
  { id: 'xp', name: 'Sabiduría', icon: '📜', unit: '+5% experiencia', max: 8, base: 100, grow: 1.42 },
  { id: 'coins', name: 'Fortuna', icon: '💰', unit: '+8% zeni', max: 8, base: 120, grow: 1.45 },
  { id: 'crit', name: 'Golpe Crítico', icon: '⭐', unit: '+3% críticos (x1,5)', max: 5, base: 150, grow: 1.5 },
  { id: 'ki', name: 'Control del Ki', icon: '🔥', unit: '+10% carga de transformación', max: 5, base: 110, grow: 1.45 },
  { id: 'moves', name: 'Repertorio', icon: '🃏', unit: 'Empiezas con 2 técnicas', max: 1, base: 1500, grow: 1 },
  { id: 'reroll', name: 'Cambio de Cartas', icon: '🔄', unit: '+1 cambio de cartas por run', max: 3, base: 300, grow: 2 },
];
// Coste de desbloquear cada transformación (índice de forma) según rareza
const FORM_COST = (rar, idx) => Math.round([0, 600, 900, 1400, 2200, 3200][rar] * [1, 3, 7][idx]);

// ---- Logros ----
// value(save) devuelve el progreso; goal la meta; reward {zeni, t1, t10}
const ACH = [];
(function buildAch() {
  const A = (id, cat, name, desc, value, goal, reward, title) => ACH.push({ id, cat, name, desc, value, goal, reward, title });
  const owned = s => Object.keys(s.owned).length;
  const shinies = s => Object.keys(s.shiny).length;
  const st = k => s => s.stats[k] || 0;
  A('own1', 'Colección', 'Primer guerrero', 'Ten 1 personaje.', owned, 1, { t1: 3 });
  A('own10', 'Colección', 'Pequeño equipo', 'Ten 10 personajes.', owned, 10, { t1: 5 });
  A('own30', 'Colección', 'Guerreros Z', 'Ten 30 personajes.', owned, 30, { t10: 1 }, 'Guerrero Z');
  A('own75', 'Colección', 'Ejército de Freezer', 'Ten 75 personajes.', owned, 75, { t10: 1 });
  A('own120', 'Colección', 'Multiverso', 'Ten 120 personajes.', owned, 120, { t10: 2 }, 'Viajero del Multiverso');
  A('ownall', 'Colección', 'Gran Kaio-shin', 'Ten todos los personajes del juego.', owned, CHARS.length, { t10: 5 }, 'Gran Kaio-shin');
  A('shiny1', 'Colección', 'Algo brilla', 'Consigue 1 shiny.', shinies, 1, { t1: 5 }, 'Brillante');
  A('shiny5', 'Colección', 'Ojo para el brillo', 'Consigue 5 shinies.', shinies, 5, { t10: 1 });
  A('shiny20', 'Colección', 'Cazashinies', 'Consigue 20 shinies.', shinies, 20, { t10: 2 }, 'Cazashinies');
  A('pulls100', 'Colección', 'Tragaperras', 'Haz 100 tiradas en el gacha.', st('pulls'), 100, { t10: 1 }, 'Afortunado');
  A('legend1', 'Colección', 'Poder legendario', 'Consigue un personaje Legendario.', s => Object.keys(s.owned).filter(id => CHAR_BY[id] && CHAR_BY[id].r === 5).length, 1, { t1: 5 });
  A('time5', 'Supervivencia', 'Calentando', 'Aguanta 5 minutos.', st('bestTime'), 300, { t1: 3 });
  A('time10', 'Supervivencia', 'Duro de pelar', 'Aguanta 10 minutos.', st('bestTime'), 600, { t1: 5 });
  A('time15', 'Supervivencia', 'Resistente', 'Aguanta 15 minutos.', st('bestTime'), 900, { t10: 1 });
  A('time20', 'Supervivencia', 'Superviviente', 'Aguanta 20 minutos.', st('bestTime'), 1200, { t10: 1 }, 'Superviviente');
  A('time30', 'Supervivencia', 'Ante Zeno-sama', 'Llega al Borrado de Zeno-sama (minuto 30).', st('bestTime'), 1800, { t10: 2 }, 'Juzgado por Zeno');
  A('time31', 'Supervivencia', 'Indestructible', 'Aguanta 1 minuto ante Zeno-sama.', st('bestTime'), 1860, { t10: 3 }, 'Elegido de Zeno');
  A('lvl15', 'Supervivencia', 'Creciendo', 'Llega al nivel 15 en una run.', st('bestLevel'), 15, { t1: 3 });
  A('lvl30', 'Supervivencia', 'Imparable', 'Llega al nivel 30 en una run.', st('bestLevel'), 30, { t10: 1 }, 'Imparable');
  A('runs50', 'Supervivencia', 'Explorador', 'Juega 50 runs.', st('runs'), 50, { t10: 1 }, 'Explorador');
  A('kills1k', 'Combate', 'Primeros combates', 'Derrota a 1.000 enemigos.', st('kills'), 1000, { t1: 5 });
  A('kills10k', 'Combate', 'Veterano', 'Derrota a 10.000 enemigos.', st('kills'), 10000, { t10: 1 }, 'Veterano');
  A('kills100k', 'Combate', 'Leyenda viva', 'Derrota a 100.000 enemigos.', st('kills'), 100000, { t10: 3 }, 'Leyenda viva');
  A('boss1', 'Combate', 'Matagigantes', 'Derrota a un jefe.', st('bosses'), 1, { t1: 3 });
  A('boss25', 'Combate', 'Cazajefes', 'Derrota a 25 jefes.', st('bosses'), 25, { t10: 1 }, 'Cazajefes');
  A('boss100', 'Combate', 'Terror de los jefes', 'Derrota a 100 jefes.', st('bosses'), 100, { t10: 2 });
  A('evo1', 'Combate', 'Evolución', 'Evoluciona una técnica.', st('evos'), 1, { t1: 3 });
  A('evo25', 'Combate', 'Evolucionista', 'Evoluciona 25 técnicas.', st('evos'), 25, { t10: 1 }, 'Evolucionista');
  A('evoall', 'Combate', 'Maestro de técnicas', 'Evoluciona todas las técnicas distintas.', s => Object.keys(s.evoMoves).length, Object.values(MOVES).filter(m => m.evo).length, { t10: 3 }, 'Maestro de técnicas');
  A('items5', 'Combate', 'Bolsa llena', 'Encuentra 5 objetos distintos.', s => Object.keys(s.itemsFound).length, 5, { t1: 5 });
  A('itemsall', 'Combate', 'Coleccionista de cápsulas', 'Encuentra los 11 objetos.', s => Object.keys(s.itemsFound).length, 11, { t10: 1 }, 'Anticuario');
  A('transf1', 'Combate', '¡Transformación!', 'Transfórmate por primera vez.', st('transforms'), 1, { t1: 3 });
  A('transf100', 'Combate', 'Más allá del límite', 'Transfórmate 100 veces.', st('transforms'), 100, { t10: 1 }, 'Super Guerrero');
  A('rift1', 'Grietas', 'Al otro lado', 'Gana tu primera pelea en una grieta temporal.', st('rifts'), 1, { t1: 5 }, 'Valiente');
  A('rift10', 'Grietas', 'Saltagrietas', 'Gana 10 peleas en grietas.', st('rifts'), 10, { t10: 1 });
  A('riftall', 'Grietas', 'Patrulla del Tiempo', 'Gana en las 12 arenas.', s => Object.keys(s.arenas).length, ARENAS.length, { t10: 2 }, 'Patrulla del Tiempo');
  A('leg10', 'Legendarios', 'Cazalegendarios', 'Vence a 10 legendarios distintos.', s => Object.keys(s.legends).length, 10, { t10: 1 }, 'Cazalegendarios');
  A('legall', 'Legendarios', 'Leyenda', 'Vence a todos los legendarios.', s => Object.keys(s.legends).length, LEGENDS.length, { t10: 3 }, 'Leyenda');
  for (const id of LEGENDS) {
    const c = CHAR_BY[id];
    A('leg_' + id, 'Legendarios', 'Vence a ' + c.name, 'Derrota a ' + c.name + ' en una grieta.', s => (s.legends[id] ? 1 : 0), 1, { t1: 2 });
  }
  A('balls7', 'Bolas de Dragón', '¡Sal, Shenlong!', 'Reúne las 7 Bolas de Dragón.', st('wishes'), 1, { t10: 1 }, 'Elegido de Shenlong');
  A('balls3', 'Bolas de Dragón', 'Coleccionista de deseos', 'Invoca a Shenlong 3 veces.', st('wishes'), 3, { t10: 2 });
})();

// ---- Misiones diarias y semanales ----
const MISSION_POOL = {
  daily: [
    { id: 'd_kills', desc: 'Derrota a {g} enemigos', stat: 'kills', goals: [300, 500, 800], reward: { zeni: 150, t1: 1 } },
    { id: 'd_time', desc: 'Aguanta {g} minutos en una run', stat: 'runTime', best: 1, goals: [5, 8, 10], fmt: v => Math.floor(v / 60), mul: 60, reward: { zeni: 200, t1: 2 } },
    { id: 'd_boss', desc: 'Derrota a {g} jefes', stat: 'bosses', goals: [1, 2, 3], reward: { zeni: 200, t1: 1 } },
    { id: 'd_pulls', desc: 'Haz {g} tiradas en el gacha', stat: 'pulls', goals: [3, 5], reward: { zeni: 150 } },
    { id: 'd_evo', desc: 'Evoluciona {g} técnica', stat: 'evos', goals: [1], reward: { zeni: 200, t1: 2 } },
    { id: 'd_transf', desc: 'Transfórmate {g} veces', stat: 'transforms', goals: [2, 4], reward: { zeni: 150, t1: 1 } },
    { id: 'd_zeni', desc: 'Gana {g} zeni en runs', stat: 'zeniEarned', goals: [300, 600], reward: { t1: 2 } },
    { id: 'd_runs', desc: 'Juega {g} runs', stat: 'runs', goals: [2, 3], reward: { zeni: 150 } },
  ],
  weekly: [
    { id: 'w_kills', desc: 'Derrota a {g} enemigos', stat: 'kills', goals: [5000], reward: { zeni: 1000, t10: 1 } },
    { id: 'w_boss', desc: 'Derrota a {g} jefes', stat: 'bosses', goals: [15], reward: { zeni: 800, t1: 5 } },
    { id: 'w_rift', desc: 'Gana {g} peleas en grietas', stat: 'rifts', goals: [3], reward: { t10: 1 } },
    { id: 'w_time', desc: 'Aguanta {g} minutos en una run', stat: 'runTime', best: 1, goals: [15], fmt: v => Math.floor(v / 60), mul: 60, reward: { t10: 1 } },
  ],
};

// Recompensas de conexión diaria (7 días)
const DAILY_REWARDS = [
  { zeni: 200 }, { t1: 2 }, { zeni: 400 }, { t1: 3 }, { zeni: 700 }, { t1: 5 }, { t10: 1 },
];

// Deseos de Shenlong
const WISHES = [
  { id: 'legend', name: 'Quiero un guerrero legendario', desc: 'Un personaje Legendario que no tengas (si los tienes todos, uno shiny).' },
  { id: 'tickets', name: 'Quiero poder para invocar', desc: '3 tickets ×10 para el gacha.' },
  { id: 'zeni', name: 'Quiero ser rico', desc: '15.000 zeni.' },
  { id: 'shiny', name: 'Que brille mi compañero', desc: 'Tu compañero actual pasa a tener su versión shiny.' },
];

// Quiz de personalidad para elegir el primer compañero
const QUIZ = [
  { q: 'Un enemigo muy fuerte aparece. ¿Qué haces?', a: [
    ['¡Me emociono y voy a por él!', 'goku_kid'], ['Lo estudio antes de actuar', 'piccolo_jr'], ['Busco a mis amigos para luchar juntos', 'krillin_db']] },
  { q: '¿Cuál es tu mayor virtud?', a: [
    ['Mi constancia entrenando', 'tien_db'], ['Mi astucia', 'yamcha_db'], ['Mi corazón puro', 'gohan_kid']] },
  { q: 'Tienes las 7 Bolas de Dragón. Pides...', a: [
    ['Un rival todavía más fuerte', 'goku_kid'], ['Proteger a quien quiero', 'gohan_kid'], ['Ser el más fuerte del universo', 'piccolo_jr']] },
  { q: '¿Dónde entrenarías?', a: [
    ['En la Kame House con el Maestro Roshi', 'krillin_db'], ['Solo, en las montañas', 'tien_db'], ['En el desierto, de noche', 'yamcha_db']] },
];
const PERSONALITIES = {
  goku_kid: 'Valiente y alegre: siempre buscas superarte.',
  krillin_db: 'Leal y bondadoso: tus amigos lo son todo.',
  yamcha_db: 'Astuto y con estilo: nunca te rindes.',
  gohan_kid: 'Tranquilo con un poder oculto enorme.',
  tien_db: 'Disciplinado y orgulloso: el entrenamiento es tu camino.',
  piccolo_jr: 'Frío y calculador, pero de gran corazón.',
};
