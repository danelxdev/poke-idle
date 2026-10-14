// Traducción al inglés de los datos del juego (nombres, descripciones, regiones, rutas, jefes, logros…).
// El juego está escrito en español; al elegir inglés, I18N.apply('en') llama a EN_APPLY y sustituye los textos
// en los objetos de datos (y los restaura al volver al español). Los textos de la interfaz usan L(es, en) en el propio código.
'use strict';

const EN_ROUTES = [["Route 1", "Pewter City Gym Leader"], ["Viridian Forest", "Cerulean City Gym Leader"], ["Mt. Moon", "Vermilion City Gym Leader"], ["Route 24", "Celadon City Gym Leader"], ["Rock Tunnel", "Fuchsia City Gym Leader"], ["Pokémon Tower", "Saffron City Gym Leader"], ["Power Plant", "Cinnabar Island Gym Leader"], ["Seafoam Islands", "Viridian City Gym Leader"], ["Cinnabar Island", "Kanto Elite Four"], ["Victory Road", "Kanto Elite Four"], ["Indigo Plateau", "Kanto Elite Four"], ["Dragon Chamber", "Kanto Elite Four"], ["Champion's Room", "Kanto Champion"], ["Cerulean Cave", "Legendary Pokémon"], ["Route 29", "Violet City Gym Leader"], ["Ilex Forest", "Azalea Town Gym Leader"], ["Moo Moo Farm", "Goldenrod City Gym Leader"], ["Burned Tower", "Ecruteak City Gym Leader"], ["Cianwood Island", "Cianwood City Gym Leader"], ["Olivine Lighthouse", "Olivine City Gym Leader"], ["Snowy Mountain", "Mahogany Town Gym Leader"], ["Dragon Road", "Blackthorn City Gym Leader"], ["Dark Cave", "Johto Elite Four"], ["Union Cave", "Johto Elite Four"], ["Mt. Mortar", "Johto Elite Four"], ["Dark Road", "Johto Elite Four"], ["Johto Hall", "Johto Champion"], ["Whirlwind Tower", "Legendary Pokémon"], ["Route 102", "Rustboro City Gym Leader"], ["Granite Cave", "Dewford Town Gym Leader"], ["Route 110", "Mauville City Gym Leader"], ["Mt. Chimney", "Lavaridge Town Gym Leader"], ["Petalburg Woods", "Petalburg City Gym Leader"], ["Route 119", "Fortree City Gym Leader"], ["Mossdeep City", "Mossdeep City Gym Leaders"], ["Sootopolis Reef", "Sootopolis City Gym Leader"], ["Dark Chamber", "Hoenn Elite Four"], ["Mt. Pyre", "Hoenn Elite Four"], ["Ice Cave", "Hoenn Elite Four"], ["Dragon Summit", "Hoenn Elite Four"], ["Hoenn Hall", "Hoenn Champion"], ["Marine Cave", "Legendary Pokémon"], ["Route 201", "Sinnoh Gym Leader"], ["Eterna Forest", "Sinnoh Gym Leader"], ["Oreburgh Mine", "Sinnoh Gym Leader"], ["Lake Verity", "Sinnoh Gym Leader"], ["Route 213", "Sinnoh Gym Leader"], ["Iron Island", "Sinnoh Gym Leader"], ["Mt. Coronet", "Sinnoh Gym Leader"], ["Voltage Plant", "Sinnoh Gym Leader"], ["Bug Hall", "Sinnoh Elite Four"], ["Ground Hall", "Sinnoh Elite Four"], ["Fire Hall", "Sinnoh Elite Four"], ["Psychic Hall", "Sinnoh Elite Four"], ["Champion's Cave", "Sinnoh Champion"], ["Spear Pillar", "Legendary Pokémon"], ["Unova Route 1", "Unova Gym Leader"], ["Pinwheel Forest", "Unova Gym Leader"], ["Crystal Tunnel", "Unova Gym Leader"], ["Electro City", "Unova Gym Leader"], ["Desert Resort", "Unova Gym Leader"], ["Skyarrow Bridge", "Unova Gym Leader"], ["Frozen Cave", "Unova Gym Leader"], ["Dragon Valley", "Unova Gym Leader"], ["Ghost Hall", "Unova Elite Four"], ["Dark Hall", "Unova Elite Four"], ["Psychic Hall (Unova)", "Unova Elite Four"], ["Fighting Hall", "Unova Elite Four"], ["N's Castle", "Unova Champion"], ["Dragonspiral Tower", "Legendary Pokémon"], ["Kalos Route 2", "Kalos Gym Leader"], ["Fossil Cave", "Kalos Gym Leader"], ["Battle Route", "Kalos Gym Leader"], ["Flower Meadow", "Kalos Gym Leader"], ["Lumiose City", "Kalos Gym Leader"], ["Fairy Garden", "Kalos Gym Leader"], ["Psychic Forest", "Kalos Gym Leader"], ["Blizzard Peak", "Kalos Gym Leader"], ["Kalos Fire Hall", "Kalos Elite Four"], ["Kalos Water Hall", "Kalos Elite Four"], ["Kalos Ghost Hall", "Kalos Elite Four"], ["Kalos Dragon Hall", "Kalos Elite Four"], ["Master Tower", "Kalos Champion"], ["Tree of Life", "Legendary Pokémon"], ["Alola Route 1", "Totem Pokémon"], ["Wailord Meadow", "Totem Pokémon"], ["Poni Island Route", "Totem Pokémon"], ["Lurantis Garden", "Totem Pokémon"], ["Tapu Power Plant", "Totem Pokémon"], ["Thrifty Mansion", "Totem Pokémon"], ["Ula'ula Cave", "Totem Pokémon"], ["Poni Beach", "Totem Pokémon"], ["Hala's Hall", "Alola Elite Four"], ["Olivia's Hall", "Alola Elite Four"], ["Acerola's Hall", "Alola Elite Four"], ["Kahili's Hall", "Alola Elite Four"], ["Poni Summit", "Alola Champion"], ["Altar of the Sunne", "Legendary Pokémon"], ["Galar Route 1", "Galar Gym Leader"], ["Turffield Coast", "Galar Gym Leader"], ["Galar Mine", "Galar Gym Leader"], ["Stow-on-Side Moor", "Galar Gym Leader"], ["Ghost Valley", "Galar Gym Leader"], ["Gordie's Quarry", "Galar Gym Leader"], ["Circhester Blizzard", "Galar Gym Leader"], ["Wyndon Stadium", "Galar Gym Leader"], ["Marnie's Hall", "Galar Elite Four"], ["Bede's Hall", "Galar Elite Four"], ["Hop's Hall", "Galar Elite Four"], ["Piers' Hall", "Galar Elite Four"], ["Final Stadium", "Galar Champion"], ["Crown Tower", "Legendary Pokémon"], ["South Meadow", "Paldea Gym Leader"], ["Cascarrafa Orchard", "Paldea Gym Leader"], ["Levincia City", "Paldea Gym Leader"], ["Glaseado Mountain", "Paldea Gym Leader"], ["Asado Desert", "Paldea Gym Leader"], ["Poison Factory", "Paldea Gym Leader"], ["Psychic Summit", "Paldea Gym Leader"], ["North Glaseado", "Paldea Gym Leader"], ["Rika's Hall", "Paldea Elite Four"], ["Poppy's Hall", "Paldea Elite Four"], ["Larry's Hall", "Paldea Elite Four"], ["Hassel's Hall", "Paldea Elite Four"], ["Naranja Academy", "Paldea Champion"], ["Area Zero", "Legendary Pokémon"], ["Mt. Silver", "The Best Trainer"], ["Ancient Cave", "Legendary Pokémon"], ["Sky Pillar", "Guardian of the Skies"], ["Deep Space", "Space Visitor"], ["Distortion World", "Lord of the Distortion World"], ["Toward Infinity", "Cosmic Threat"], ["Crown Tundra", "King of the Crown"], ["Hall of Origin", "Creator of All"]];
const EN_WHO = {"Rojo": "Red", "Azul": "Blue", "Tate y Liza": "Tate & Liza", "Larry (Alto Mando)": "Larry (Elite Four)"};
const EN_MOVES = {"placaje": "Tackle", "ataque_rapido": "Quick Attack", "hiperrayo": "Hyper Beam", "golpe_cuerpo": "Body Slam", "ascuas": "Ember", "lanzallamas": "Flamethrower", "llamarada": "Fire Blast", "pistola_agua": "Water Gun", "burbuja": "Bubble", "hidrobomba": "Hydro Pump", "surf": "Surf", "latigo_cepa": "Vine Whip", "hoja_afilada": "Razor Leaf", "drenadoras": "Leech Seed", "rayo_solar": "Solar Beam", "impactrueno": "Thunder Shock", "chispazo": "Discharge", "rayo": "Thunderbolt", "trueno": "Thunder", "rayo_hielo": "Ice Beam", "nieve_polvo": "Powder Snow", "ventisca": "Blizzard", "golpe_karate": "Karate Chop", "patada_baja": "Low Kick", "esfera_aural": "Aura Sphere", "a_bocajarro": "Close Combat", "acido": "Acid", "picotazo_ven": "Poison Sting", "puas_toxicas": "Toxic Spikes", "bomba_lodo": "Sludge Bomb", "disparo_lodo": "Mud Shot", "huesomerang": "Bonemerang", "excavar": "Dig", "terremoto": "Earthquake", "picotazo": "Peck", "tornado": "Gust", "ataque_ala": "Wing Attack", "golpe_aereo": "Aerial Ace", "confusion": "Confusion", "psicorrayo": "Psybeam", "psiquico": "Psychic", "psicocorte": "Psycho Cut", "picadura": "Bug Bite", "disparo_demora": "String Shot", "zumbido": "Bug Buzz", "tijera_x": "X-Scissor", "lanzarrocas": "Rock Throw", "avalancha": "Rock Slide", "roca_afilada": "Stone Edge", "lenguetazo": "Lick", "bola_sombra": "Shadow Ball", "tinieblas": "Night Shade", "furia_dragon": "Dragon Rage", "dragoaliento": "Dragon Breath", "cometa_draco": "Draco Meteor", "mordisco": "Bite", "pulso_umbrio": "Dark Pulse", "garra_metal": "Metal Claw", "bomba_iman": "Magnet Bomb", "cabeza_hierro": "Iron Head", "viento_feerico": "Fairy Wind", "brillo_magico": "Dazzling Gleam", "fuerza_lunar": "Moonblast", "envite_igneo": "Flare Blitz", "cascada": "Waterfall", "lluevehojas": "Leaf Storm", "voltio_cruel": "Wild Charge", "puno_dinamico": "Dynamic Punch", "lanzamugre": "Gunk Shot", "fisura": "Fissure", "pajaro_osado": "Brave Bird", "premonicion": "Future Sight", "megacuerno": "Megahorn", "tumba_rocas": "Rock Tomb", "poder_pasado": "Ancient Power", "garra_umbria": "Shadow Claw", "golpe_fantasma": "Phantom Force", "garra_dragon": "Dragon Claw", "triturar": "Crunch", "juego_sucio": "Foul Play", "vendetta": "Payback", "ala_de_acero": "Steel Wing", "beso_drenaje": "Draining Kiss", "canto_helado": "Icy Wind", "giga_impacto": "Giga Impact", "erupcion": "Eruption", "cero_absoluto": "Sheer Cold", "ultraje": "Outrage", "foco_resplandor": "Flash Cannon", "explosion_magica": "Fairy Blast"};
const EN_POKE = {"772": "Type: Null", "984": "Great Tusk", "985": "Scream Tail", "987": "Flutter Mane", "988": "Slither Wing", "989": "Sandy Shocks", "991": "Iron Bundle", "992": "Iron Hands", "994": "Iron Moth", "995": "Iron Thorns", "1005": "Roaring Moon", "1006": "Iron Valiant", "1009": "Walking Wake", "1010": "Iron Leaves"};

const EN_TYPES = { normal: 'Normal', fire: 'Fire', water: 'Water', grass: 'Grass', electric: 'Electric', ice: 'Ice', fighting: 'Fighting', poison: 'Poison', ground: 'Ground', flying: 'Flying', psychic: 'Psychic', bug: 'Bug', rock: 'Rock', ghost: 'Ghost', dragon: 'Dragon', dark: 'Dark', steel: 'Steel', fairy: 'Fairy', stellar: 'Stellar' };
const EN_BALLS = {
  poke: ['Poké Ball', 'The most common one. Poké Tickets are bought with coins.'],
  super: ['Great Ball', 'More rare and epic Pokémon.'],
  ultra: ['Ultra Ball', 'Never a common. 4% legendary.'],
  banner: ['Featured Ball', 'Has featured Pokémon: half the time you get an epic or legendary it will be one of them. If you lose the 50/50 for a legendary, the next one is the featured one for sure.'],
  event: ['Event Ball', "Only Pokémon of the week's type. When an epic or legendary comes out, half the time it is the event's featured one."],
  master: ['Master Ball', 'Always epic or legendary: 28% legendary.'],
};
const EN_TICKETS = { poke: 'Poké Ticket', super: 'Great Ticket', ultra: 'Ultra Ticket', master: 'Master Ticket' };
const EN_UPGRADES = {
  tap: ['Trainer Strike', n => 'Each tap deals ' + (15 + n) + '% of the team damage/s' + (n ? ' +' + n * 3 : '')],
  train: ['Training', n => '+' + (n * 10) + '% team damage'],
  coin: ['Piggy Bank', n => '+' + (n * 15) + '% coins'],
  crit: ['Scope Lens', n => (3 + n * 2) + '% critical hits (x3 damage)'],
  critdmg: ['Sharp Claw', n => 'Critical hits deal x' + (3 + n * 0.25).toFixed(2) + ' damage'],
  speed: ['Quick Band', n => '+' + (n * 4) + '% attack speed'],
  catch: ['Ticket Radar', n => (1.5 + n * 0.5).toFixed(1) + '% chance for a defeated Pokémon to drop a ticket'],
  golden: ['Golden Dust', n => 'Golden Pokémon: 1 in ' + Math.round(1 / (1 / 120 + n * 0.002))],
  type: ['Type Affinity', n => 'Super effective hits deal +' + n * 4 + '% more damage'],
  boss: ['Boss Hunter', n => '+' + n * 4 + '% damage against bosses'],
  autotap: ['Auto Tap', n => n ? n * 0.5 + ' taps per second without tapping' : 'Automatic taps'],
  alch: ['Alchemy', n => '+' + n * 10 + '% stardust'],
  bosstime: ['Stopwatch', n => '+' + n * 3 + ' s to beat bosses'],
};
const EN_SKILLS = { rage: ['Rage', 'x3 team damage for 15 s.'], gold: ['Gold Rush', 'x3 coins for 20 s.'], lure: ['Ticket Rain', 'x6 chance of dropping tickets for 15 s.'] };
const EN_SHOP = {
  dmg: ['Elite Training', n => '+' + n * 6 + '% damage'],
  coins: ['Deep Pockets', n => '+' + n * 6 + '% coins'],
  lvl: ['Candy Bag', n => 'After the League you start with +' + n * 2 + ' levels'],
  slots: ["Champion's Team", n => 'After the League you keep ' + (2 + n) + ' slots'],
  offline: ['Camp', n => 'Offline gains: up to ' + (8 + n * 2) + ' h at ' + (50 + n * 5) + '%'],
  catch: ['Ticket Magnet', n => '+' + (n * 0.4).toFixed(1) + '% dropped tickets'],
  shiny: ['Eternal Shine', n => 'Shinies x' + (1 + n * 0.2).toFixed(1) + ' more common'],
  gems: ['Gem Finder', n => '+' + n * 10 + '% gems from bosses and quests'],
  skill: ['Skill Master', n => 'Skills: -' + n * 4 + '% cooldown and +' + n * 2 + ' s duration'],
  dust: ['Alchemist', n => '+' + n * 15 + '% stardust'],
  tapd: ['Iron Fist', n => '+' + n * 10 + '% tap damage'],
  critb: ['Eagle Eye', n => '+' + n + '% critical chance'],
  egg: ['Incubation Heat', n => 'Eggs need ' + n * 5 + '% fewer victories'],
  disc: ['Trainer Discount', n => 'Coin Poké Ball -' + n * 4 + '% price'],
  bt: ['Hourglass', n => '+' + n * 2 + ' s to beat bosses'],
};
const EN_QUEST = {
  kills: n => 'Defeat ' + n + ' wild Pokémon', taps: n => 'Tap enemies ' + n + ' times', levels: n => 'Level up your Pokémon ' + n + ' times', pulls: n => 'Open ' + n + ' Poké Balls',
  bosses: n => 'Beat ' + n + ' bosses', catches: n => 'Get ' + n + ' tickets in battle', stages: n => 'Clear ' + n + ' stages', skills: n => 'Use ' + n + ' active skills',
  evolutions: n => 'Evolve ' + n + ' Pokémon', crits: n => 'Land ' + n + ' critical hits', goldens: n => 'Defeat ' + n + ' golden Pokémon', dustBuys: n => 'Trade stardust for ' + n + ' ticket' + (n == 1 ? '' : 's'),
  coinsTotal: n => 'Earn ' + n + ' coins', dust: n => 'Collect ' + n + ' stardust',
};
const EN_ACH = {
  maxStage: ['League Road', n => 'Reach stage ' + n], kills: ['Hunter', n => 'Defeat ' + n + ' Pokémon'], taps: ['Quick Finger', n => 'Tap ' + n + ' times'], pulls: ['Ball Rain', n => 'Open ' + n + ' Poké Balls'],
  dex: ['Pokédex', n => 'Register ' + n + ' Pokémon'], evolutions: ['Evolution', n => 'Evolve ' + n + ' times'], shinies: ['Shiny', n => 'Get ' + n + ' shinies'], maxStars: ['Stars', n => 'Take a Pokémon to ★' + n],
  prestiges: ['New Journey', n => 'Enter the League ' + n + ' times'], bosses: ['Leader Breaker', n => 'Beat ' + n + ' bosses'], catches: ['Ticket Collector', n => 'Get ' + n + ' tickets in battle'], legends: ['Legends', n => 'Own ' + n + ' legendaries'],
  levels: ['Training', n => 'Gain ' + n + ' levels in total'], coinsTotal: ['Millionaire', n => 'Earn ' + n + ' coins in total'], skills: ['Skilled', n => 'Use ' + n + ' skills'], itemsFound: ['Item Hunter', n => 'Get ' + n + ' items'],
  dust: ['Stardust', n => 'Collect ' + n + ' stardust'], crits: ['Sure Shot', n => 'Land ' + n + ' critical hits'], goldens: ['Gold Rush', n => 'Defeat ' + n + ' golden Pokémon'], dustBuys: ['Barter', n => 'Trade stardust for ' + n + ' tickets'],
  freePulls: ['Consistency', n => 'Open ' + n + ' free daily pulls'], streak: ['Streak', n => 'Play ' + n + ' days in a row'], stars5: ['Constellation', n => 'Own ' + n + ' Pokémon with ★5'], maxLvl: ['Max Level', n => 'Take a Pokémon to Lv. ' + n],
  upMax: ['Maxed Out', n => 'Max out ' + n + ' upgrades'], shopLvl: ['League Veteran', n => 'Buy ' + n + ' levels in the League shop'], regions: ['Traveler', n => 'Open ' + n + ' regions'],
  hatched: ['Breeder', n => 'Hatch ' + n + ' eggs'], eggsFound: ['Egg Collector', n => 'Find ' + n + ' eggs'], ivGood: ['Good Potential', n => 'Own ' + n + ' Pokémon with IVs of 90% or more'],
  ivPerfect: ['Perfectionist', n => 'Own ' + n + ' Pokémon with perfect IVs (31/31/31)'], ivUps: ['Better Genes', n => 'Improve your Pokémon IVs ' + n + ' times with duplicates'],
  tower: ['Climber', n => 'Reach floor ' + n + ' of the Tower'], eventTiers: ['Event Hunter', n => 'Beat an event boss ' + n + ' times'], bred: ['Nursery', n => 'Breed ' + n + ' eggs at the Nursery'], slots: ['Full Team', n => 'Open ' + n + ' team slots'], megas: ['Mega Evolution', n => 'Unlock ' + n + ' Mega forms'],
};
const EN_BOSS_ACH = { b130: 'Kanto Champion', b270: 'Johto Champion', b410: 'Hoenn Champion', b550: 'Sinnoh Champion', b690: 'Unova Champion', b830: 'Kalos Champion', b970: 'Alola Champion', b1110: 'Galar Champion', b1250: 'Paldea Champion', b1330: 'King of the World' };
const EN_HELD = {
  cinta: ['Choice Band', v => '+' + Math.round(v * 100) + '% damage to the holder'],
  vidasfera: ['Life Orb', v => '+' + Math.round(v * 100) + '% damage, but -10% speed'],
  panuelo: ['Choice Scarf', v => '+' + Math.round(v * 100) + '% attack speed'],
  zoom: ['Zoom Lens', v => '+' + Math.round(v * 100) + '% critical chance'],
  banda: ['Focus Sash', v => '+' + Math.round(v * 100) + '% damage against bosses'],
  orbe: ['Type Orb', (v, it) => '+' + Math.round(v * 100) + '% damage if it is ' + EN_TYPES[it.type] + '-type (+' + Math.round(v * 20) + '% if not)'],
  moneda: ['Amulet Coin', v => '+' + Math.round(v * 100) + '% coins for the whole team'],
  cascabel: ['Lucky Bell', v => '+' + Math.round(v * 100) + '% dropped tickets (team)'],
  guante: ['Trainer Glove', v => '+' + Math.round(v * 100) + '% tap damage (team)'],
};
const EN_NATURES = ['Hardy', 'Lonely', 'Adamant', 'Naughty', 'Brave', 'Bold', 'Docile', 'Impish', 'Lax', 'Relaxed', 'Modest', 'Mild', 'Bashful', 'Rash', 'Quiet', 'Calm', 'Gentle', 'Careful', 'Quirky', 'Sassy', 'Timid', 'Hasty', 'Jolly', 'Naive', 'Serious'];
const EN_EGGS = [['Common Egg', 'Like a Poké Ball: mostly common or uncommon.'], ['Rare Egg', 'Never a common. IVs of at least 8.'], ['Epic Egg', 'Rare or better, IVs of at least 16.'], ['Legendary Egg', 'Epic or legendary, IVs of at least 24.']];
const EN_EVENT_BONUS = { shiny: ['Shiny Week', 'Shinies are twice as common'], eggs: ['Breeding Week', 'Eggs advance twice as fast'], coins: ['Golden Week', '+50% coins'], dust: ['Stardust Week', 'Double stardust'], tickets: ['Ticket Week', '+50% dropped tickets'] };
const EN_EVENT_TASKS = { k1: (n, t) => 'Defeat ' + n + ' ' + t + '-type Pokémon', k2: (n, t) => 'Defeat ' + n + ' ' + t + '-type Pokémon', p1: n => 'Open ' + n + ' Event Balls' };
const EN_RULES = { noitems: ['No items', 'Equipped items do not work'], nosyn: ['No synergies', 'Team synergies are disabled'], only: ['Only type', 'Pokémon of other types deal half damage'], nocrit: ['No crits', 'No critical hits'], fast: ['Time trial', 'Half the time, but 45% less HP'], armor: ['Armor', '+60% HP and +40% time'] };

const abbrEN = n => { const S = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = 0; while (n >= 1000 && i < S.length - 1) { n /= 1000; i++; } return n + S[i]; };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];

function EN_APPLY(set) {
  REGIONS.forEach((r, i) => set(r, 'name', ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea', 'Beyond'][i]));
  ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].forEach((n, i) => { if (n) set(RARITY[i], 'name', n); });
  ['', 'Leader', 'Elite Four', 'Champion', 'Legendary', 'Final boss'].forEach((n, i) => { if (n) set(BOSS_TIER[i], 'name', n); });
  ['', 'Common', 'Rare', 'Epic'].forEach((n, i) => { if (n) set(ITEM_RAR[i], 'name', n); });
  ROUTES.forEach((r, i) => {
    set(r, 'name', EN_ROUTES[i][0]);
    set(r.boss, 'title', EN_ROUTES[i][1]);
    set(r.boss, 'who', EN_WHO[r.boss.who] || r.boss.who.replace(/^(.*) Tótem$/, 'Totem $1'));
  });
  for (const t of Object.keys(TYPE_NAMES)) set(TYPE_NAMES, t, EN_TYPES[t]);
  for (const t of Object.keys(TYPE_ES)) set(TYPE_ES, t, EN_TYPES[t] || TYPE_ES[t]);
  for (const [id, n] of Object.entries(EN_MOVES)) if (MOVES[id]) set(MOVES[id], 'name', n);
  if (typeof EN_FORMS !== 'undefined') for (const [d, n] of Object.entries(EN_FORMS)) { const p = POKEDEX.find(x => x.dex === +d) || MEGA_DEX.find(x => x.dex === +d); if (p) set(p, 'name', n); }
  for (const [d, n] of Object.entries(EN_POKE)) { const p = POKEDEX.find(x => x.dex === +d); if (p) set(p, 'name', n); }
  for (const [id, [n, d]] of Object.entries(EN_BALLS)) { set(BALLS[id], 'name', n); set(BALLS[id], 'desc', d); }
  for (const r of REGIONS) if (r.gen) { const b = BALLS['region' + r.gen]; set(b, 'name', r.name + ' Ball'); set(b, 'desc', 'Only Pokémon from ' + r.name + '.'); }
  for (const [id, n] of Object.entries(EN_TICKETS)) set(TICKETS[id], 'name', n);
  for (const [id, [n, d]] of Object.entries(EN_UPGRADES)) { set(UPGRADES[id], 'name', n); set(UPGRADES[id], 'desc', d); }
  for (const [id, [n, d]] of Object.entries(EN_SKILLS)) { set(SKILLS[id], 'name', n); set(SKILLS[id], 'desc', d); }
  for (const [id, [n, d]] of Object.entries(EN_SHOP)) { set(LEAGUE_SHOP[id], 'name', n); set(LEAGUE_SHOP[id], 'desc', d); }
  for (const q of QUEST_POOL.concat(WEEKLY_POOL)) set(q, 'text', EN_QUEST[q.stat]);
  for (const [id, [n, d]] of Object.entries(EN_HELD)) { set(HELD[id], 'name', n); set(HELD[id], 'desc', d); }
  NATURES.forEach((n, i) => set(n, 'name', EN_NATURES[i]));
  set(NAT_AXES, 'dmg', 'Damage'); set(NAT_AXES, 'spd', 'Speed'); set(NAT_AXES, 'crit', 'Crit'); set(NAT_AXES, 'coin', 'Loot'); set(NAT_AXES, 'boss', 'Bosses');
  set(NAT_SHORT, 'dmg', 'Dmg'); set(NAT_SHORT, 'spd', 'Spd'); set(NAT_SHORT, 'crit', 'Crit'); set(NAT_SHORT, 'coin', 'Loot'); set(NAT_SHORT, 'boss', 'Boss');
  set(IV_NAMES, 'd', 'Damage'); set(IV_NAMES, 's', 'Speed'); set(IV_NAMES, 'c', 'Crit');
  ['Perfect', 'Excellent', 'Very good', 'Good', 'Average', 'Low'].forEach((n, i) => set(IV_GRADES[i], 1, n));
  EN_EGGS.forEach(([n, d], i) => { set(EGGS[i], 'name', n); set(EGGS[i], 'desc', d); });
  for (const [id, [n, t]] of Object.entries(EN_EVENT_BONUS)) { set(EVENT_BONUS[id], 'name', n); set(EVENT_BONUS[id], 'txt', t); }
  ['Easy', 'Normal', 'Hard', 'Extreme'].forEach((n, i) => set(EVENT_TIERS[i], 'name', n));
  for (const t of EVENT_TASKS) set(t, 'text', EN_EVENT_TASKS[t.id]);
  for (const r of TOWER_RULES) { set(r, 'name', EN_RULES[r.id][0]); set(r, 'desc', EN_RULES[r.id][1]); }
  // logros: se reconstruyen con las plantillas en inglés
  const count = {}, seen = {};
  for (const a of ACHIEVEMENTS) if (!/^b\d/.test(a.id)) count[a.stat] = (count[a.stat] || 0) + 1;
  for (const a of ACHIEVEMENTS) {
    if (EN_BOSS_ACH[a.id]) { set(a, 'name', EN_BOSS_ACH[a.id]); set(a, 'desc', 'Beat the last boss of the region'); continue; }
    const i = seen[a.stat] = (seen[a.stat] === undefined ? 0 : seen[a.stat] + 1), suffix = count[a.stat] > 1 ? ' ' + ROMAN[i] : '';
    let name, tpl;
    if (a.stat.startsWith('type:')) { const t = TYPE_NAMES[a.stat.slice(5)]; name = 'Master of ' + t; tpl = n => 'Own ' + n + ' ' + t + '-type Pokémon'; }
    else if (a.stat.startsWith('regionDex:')) { const r = REGIONS.find(x => x.gen === +a.stat.slice(10)); name = r.name + ' Pokédex'; tpl = n => 'Register all ' + n + ' Pokémon of ' + r.name; }
    else [name, tpl] = EN_ACH[a.stat];
    set(a, 'name', name + suffix); set(a, 'desc', tpl(abbrEN(a.goal)));
  }
}
