// Contenido de la versión 15: más objetos, tácticas de equipo, entrenadores, el rival de la historia,
// la sala de música y el bestiario. Se carga DESPUÉS de elegir el idioma, así que usa L(es, en) directamente.
'use strict';

const pctTxt = v => Math.round(v * 100) + '%';

// ---------------- objetos nuevos ----------------
// fx: se (súper eficaz) · finish (rival con poca vida) · open (inicio del jefe) · twice (doble golpe)
//     egg · gems · time · dust (de todo el equipo)
Object.assign(HELD, {
  experto: { name: L('Cinta Experto', 'Expert Belt'), icon: 'glasses', fx: 'se', v: 0.25, desc: v => L('+' + pctTxt(v) + ' de daño en golpes súper eficaces', '+' + pctTxt(v) + ' damage on super effective hits') },
  remate: { name: L('Garra Remate', 'Finisher Claw'), icon: 'quickclaw', fx: 'finish', v: 0.5, desc: v => L('+' + pctTxt(v) + ' de daño a enemigos con menos del 30% de vida', '+' + pctTxt(v) + ' damage to enemies below 30% HP') },
  apertura: { name: L('Concha Impulso', 'Burst Shell'), icon: 'shellbell', fx: 'open', v: 0.6, desc: v => L('+' + pctTxt(v) + ' de daño en los primeros 10 s contra un jefe', '+' + pctTxt(v) + ' damage in the first 10 s against a boss') },
  doble: { name: L('Banda Doble', 'Double Band'), icon: 'up', fx: 'twice', v: 0.12, desc: v => L(pctTxt(v) + ' de probabilidad de atacar dos veces', pctTxt(v) + ' chance to attack twice') },
  cria: { name: L('Huevo Suerte', 'Lucky Egg'), icon: 'luckyegg', fx: 'egg', v: 0.15, desc: v => L('+' + pctTxt(v) + ' de velocidad de eclosión (equipo)', '+' + pctTxt(v) + ' egg hatching speed (team)') },
  gema: { name: L('Colmillo Gema', 'Gem Fang'), icon: 'gem', fx: 'gems', v: 0.1, desc: v => L('+' + pctTxt(v) + ' de gemas de los jefes (equipo)', '+' + pctTxt(v) + ' gems from bosses (team)') },
  tiempo: { name: L('Reloj de Arena', 'Hourglass'), icon: 'clock', fx: 'time', v: 1, desc: v => L('+' + v.toFixed(1) + ' s contra jefes y retos (equipo)', '+' + v.toFixed(1) + ' s against bosses and challenges (team)') },
  polvo: { name: L('Polvo Brillo', 'Shiny Dust'), icon: 'dust', fx: 'dust', v: 0.12, desc: v => L('+' + pctTxt(v) + ' de polvo estelar (equipo)', '+' + pctTxt(v) + ' stardust (team)') },
});
// grupos para los combos de objetos (hacen falta 3 distintos del mismo grupo)
const ITEM_COMBO = {
  arsenal: { ids: ['cinta', 'vidasfera', 'panuelo', 'zoom', 'experto', 'remate', 'doble'], name: L('Arsenal', 'Arsenal'), need: [3, 5], dmg: [0.1, 0.2], txt: n => L('+' + pctTxt(n) + ' de daño al equipo', '+' + pctTxt(n) + ' team damage') },
  caza: { ids: ['banda', 'apertura', 'tiempo', 'experto', 'remate'], name: L('Equipo de caza', 'Hunting party'), need: [3, 4], boss: [0.2, 0.35], txt: n => L('+' + pctTxt(n) + ' de daño contra jefes y retos', '+' + pctTxt(n) + ' damage against bosses and challenges') },
  granja: { ids: ['moneda', 'cascabel', 'cria', 'gema', 'polvo', 'guante'], name: L('Granja', 'Farm'), need: [3, 5], coins: [0.12, 0.3], txt: n => L('+' + pctTxt(n) + ' de monedas', '+' + pctTxt(n) + ' coins') },
};
const ITEM_FUSE_COST = [0, 40, 160];          // polvo para fusionar 3 objetos de esa rareza en 1 de la siguiente
const ITEM_CRAFT_COST = 600;                  // polvo para fabricar un objeto común a elección

// ---------------- tácticas de equipo ----------------
// dmg: siempre · wild: solo contra salvajes · boss: solo contra jefes y retos · coin: monedas · drop: tickets, huevos y polvo
const TACTIC_UNLOCK = 20;
const TACTICS = {
  bal: { name: L('Equilibrada', 'Balanced'), icon: 'shield', dmg: 0, wild: 0, boss: 0, coin: 0, drop: 0, desc: L('Sin bonus ni penalización.', 'No bonuses and no penalties.') },
  atk: { name: L('Ofensiva', 'Offensive'), icon: 'fist', dmg: 0.25, wild: 0, boss: 0, coin: -0.2, drop: 0, desc: L('+25% de daño, −20% de monedas. Ideal para superar un jefe difícil.', '+25% damage, −20% coins. Best for beating a hard boss.') },
  eco: { name: L('Economía', 'Economy'), icon: 'coin', dmg: -0.15, wild: 0, boss: 0, coin: 0.3, drop: 0, desc: L('+30% de monedas, −15% de daño. Ideal para subir niveles mientras esperas.', '+30% coins, −15% damage. Best for levelling up while you wait.') },
  boss: { name: L('Cazajefes', 'Boss hunter'), icon: 'trophy', dmg: 0, wild: -0.1, boss: 0.3, coin: 0, drop: 0, desc: L('+30% de daño a jefes y retos, −10% contra salvajes.', '+30% damage to bosses and challenges, −10% against wild Pokémon.') },
  loot: { name: L('Rastreo', 'Scavenger'), icon: 'tkSuper', dmg: -0.12, wild: 0, boss: 0, coin: 0, drop: 0.4, desc: L('+40% de tickets, huevos y polvo, −12% de daño.', '+40% tickets, eggs and stardust, −12% damage.') },
};

// ---------------- entrenadores ----------------
// De vez en cuando, en lugar de un salvaje aparece un entrenador con varios Pokémon seguidos.
const TRAINER_CHANCE = 0.03, TRAINER_MIN_STAGE = 5;
const TRAINER_CLASSES = [
  { types: ['water'], es: 'Pescador', en: 'Fisherman' }, { types: ['bug'], es: 'Cazabichos', en: 'Bug Catcher' },
  { types: ['fighting'], es: 'Karateka', en: 'Black Belt' }, { types: ['ghost', 'psychic'], es: 'Médium', en: 'Medium' },
  { types: ['grass'], es: 'Excursionista', en: 'Hiker' }, { types: ['fire'], es: 'Cocinero', en: 'Cook' },
  { types: ['electric'], es: 'Ingeniero', en: 'Engineer' }, { types: ['ice'], es: 'Esquiador', en: 'Skier' },
  { types: ['rock', 'ground'], es: 'Minero', en: 'Miner' }, { types: ['flying'], es: 'Cuidapájaros', en: 'Bird Keeper' },
  { types: ['dragon'], es: 'Domador', en: 'Tamer' }, { types: ['steel'], es: 'Mecánico', en: 'Mechanic' },
  { types: ['poison'], es: 'Químico', en: 'Chemist' }, { types: ['dark'], es: 'Rufián', en: 'Punk' },
  { types: ['fairy'], es: 'Bailarina', en: 'Dancer' }, { types: ['normal'], es: 'Joven', en: 'Youngster' },
];
const TRAINER_NAMES = ['Pablo', 'Lucía', 'Marcos', 'Irene', 'Hugo', 'Elena', 'Daniel', 'Sofía', 'Álex', 'Marta', 'Iván', 'Clara', 'Leo', 'Nora', 'Raúl', 'Vera', 'Saúl', 'Alba', 'Gael', 'Inés'];

// ---------------- sala de música ----------------
// req: stage (etapa máxima alcanzada) · bosses · rival (duelos ganados) · tower · event · prestige · hatched · trainers
const MUSIC_LIST = (() => {
  const out = [{ id: 'menu', name: L('Pantalla de título', 'Title screen'), req: null, hint: '' }];
  REGIONS.forEach((r, i) => out.push({ id: 'r' + i, name: r.name, req: i ? { stage: r.first * 10 + 1 } : null, hint: L('Llega a ' + r.name, 'Reach ' + r.name) }));
  out.push(
    { id: 'boss', name: L('Combate de jefe', 'Boss battle'), req: { bosses: 1 }, hint: L('Vence a tu primer jefe', 'Beat your first boss') },
    { id: 'boss2', name: L('Jefe final', 'Final boss'), req: { stage: 141 }, hint: L('Vence al legendario de Kanto (etapa 140)', 'Beat the Kanto legendary (stage 140)') },
    { id: 'rival', name: L('Nico, el rival', 'Nico, the rival'), req: { rival: 1 }, hint: L('Gana tu primer duelo contra Nico', 'Win your first duel against Nico') },
    { id: 'rival2', name: L('Nico: duelo final', 'Nico: final duel'), req: { rival: 10 }, hint: L('Gana 10 duelos contra Nico', 'Win 10 duels against Nico') },
    { id: 'trainer', name: L('Entrenadores', 'Trainers'), req: { trainers: 1 }, hint: L('Vence a un entrenador', 'Beat a trainer') },
    { id: 'tower', name: L('Torre de batalla', 'Battle Tower'), req: { tower: 1 }, hint: L('Supera un piso de la Torre', 'Clear a Tower floor') },
    { id: 'event', name: L('Evento semanal', 'Weekly event'), req: { event: 1 }, hint: L('Vence a un jefe de evento', 'Beat an event boss') },
    { id: 'league', name: L('Liga Pokémon', 'Pokémon League'), req: { prestige: 1 }, hint: L('Entra una vez en la Liga', 'Enter the League once') },
    { id: 'nest', name: L('Guardería', 'Nursery'), req: { hatched: 1 }, hint: L('Eclosiona un huevo', 'Hatch an egg') },
  );
  return out;
})();

// ---------------- el rival de la historia: Nico ----------------
// Dos duelos por región: uno a mitad de camino (A) y otro justo antes del campeón (B).
const RIVAL_NAME = 'Nico';
const RIVAL_TYPES = [['flying', 'psychic', 'fire'], ['dark', 'electric', 'ice'], ['water', 'ground', 'dragon'], ['steel', 'ghost', 'fighting'], ['grass', 'bug', 'poison'], ['fairy', 'psychic', 'normal'], ['rock', 'water', 'fire'], ['dragon', 'dark', 'steel'], ['ice', 'ghost', 'fairy'], ['fire', 'electric', 'dragon']];
const RIVAL_HP = [7, 10], RIVAL_TIME = [40, 50], RIVAL_SPLIT = [0.28, 0.33, 0.39];
const RIVAL_TALK = [
  // [antes ES, antes EN, después ES, después EN] × (A, B) por región
  [['¡Eh, tú! Soy Nico. Dicen que en Kanto los entrenadores se hacen fuertes de verdad. ¿Probamos?', "Hey, you! I'm Nico. They say trainers get really strong in Kanto. Shall we try?", 'Nada mal para empezar. Pero no pienso quedarme atrás.', "Not bad for a start. But I'm not falling behind."],
   ['Ya tengo casi todas las medallas. Antes del Alto Mando quiero medirme contigo otra vez.', "I've got almost all the badges. Before the Elite Four I want to face you again.", 'Me has vuelto a ganar... Ve a por el campeón. Yo seguiré entrenando.', 'You beat me again... Go for the champion. I will keep training.']],
  [['¿Tú por aquí? Mi equipo ha crecido mucho desde Kanto. ¿Quieres comprobarlo?', 'You here? My team has grown a lot since Kanto. Want to check?', 'Los Pokémon de Johto son duros, pero tú lo eres más.', 'Johto Pokémon are tough, but you are tougher.'],
   ['Cada vez me cuesta más seguirte el ritmo. Por eso me alegra tanto ganarte algún día.', 'It gets harder to keep up with you. That is why beating you someday will feel great.', 'Otra derrota. Pero cada una me enseña algo nuevo.', 'Another defeat. But each one teaches me something new.']],
  [['Hoenn: sol, mar y tormentas. ¡Un sitio perfecto para un duelo!', 'Hoenn: sun, sea and storms. A perfect place for a duel!', 'Ha sido como una tormenta... y me ha arrastrado.', 'That was like a storm... and it swept me away.'],
   ['He aprendido a leer el clima, y a leer a mis rivales. ¡A ver si a ti también!', "I've learned to read the weather, and my rivals. Let's see if I can read you!", 'Tienes un don para ganar. Quizá algún día lo descubra.', 'You have a gift for winning. Maybe I will find it someday.']],
  [['Aquí hace un frío que pela. ¡Calentemos con una batalla!', "It's freezing here. Let's warm up with a battle!", 'Se me han congelado hasta las ideas. Buen combate.', 'Even my ideas froze. Good battle.'],
   ['Mi equipo ya no es el de antes. Ahora entreno con método. ¡Mira cómo he cambiado!', 'My team is not what it used to be. I train with method now. See how I have changed!', 'Con método o sin él, sigues siendo mejor. Lo reconozco.', 'Method or not, you are still better. I admit it.']],
  [['Teselia lo cambia todo: nuevos Pokémon, nuevas reglas. ¡Pero yo sigo igual de cabezota!', 'Unova changes everything: new Pokémon, new rules. But I am as stubborn as ever!', 'Nuevo sitio, mismo resultado. Me sigues ganando.', 'New place, same result. You keep beating me.'],
   ['Dicen que aquí los ideales mueven el mundo. Los míos: ¡ganarte a ti!', 'They say ideals move the world here. Mine: beating you!', 'Qué rabia... y qué gusto verte tan fuerte.', 'So annoying... and so great to see you this strong.']],
  [['En Kalos todo es elegancia y estilo. Mi equipo también tiene su toque, ¿lo ves?', 'In Kalos everything is elegance and style. My team has its own flair too, see?', 'Elegante derrota. Tomo nota.', 'An elegant defeat. Noted.'],
   ['Las leyendas de esta región me han inspirado. ¡Vamos a escribir la nuestra!', 'This region’s legends inspired me. Let us write our own!', 'Esa batalla bien merece una leyenda.', 'That battle deserves a legend of its own.']],
  [['Aquí los retos se llaman pruebas. ¿Te apuntas a una prueba conmigo?', 'Here challenges are called trials. Want to do a trial with me?', 'Prueba superada... por ti, claro.', 'Trial passed... by you, of course.'],
   ['Las islas me han enseñado a disfrutar del combate. ¡Disfruta tú también!', 'The islands taught me to enjoy battling. Enjoy it too!', 'Divertido de verdad. ¡Repetimos cuando quieras!', 'Really fun. Let us do it again anytime!']],
  [['Un estadio lleno y las cámaras encendidas. ¡Que se enteren de quién va a ganar!', 'A packed stadium and cameras rolling. Let everyone know who is going to win!', 'El público ha enloquecido. Y con razón: eres de otro nivel.', 'The crowd went wild. And rightly so: you are on another level.'],
   ['Esta vez voy en serio: llevo meses preparando este duelo.', 'This time I mean it: I have been preparing this duel for months.', 'Meses de entrenamiento... para perder con estilo. Bien jugado.', 'Months of training... to lose with style. Well played.']],
  [['Cada uno hace aquí su propio camino, pero el tuyo y el mío se cruzan siempre.', 'Everyone makes their own path here, but yours and mine always cross.', 'Mi camino sigue, pero ahora sé hacia dónde ir.', 'My path goes on, but now I know where to head.'],
   ['Ya casi no queda mapa por recorrer. Quiero darlo todo, como el primer día.', 'There is almost no map left to cover. I want to give it my all, like the first day.', 'Como el primer día... y tú ganando otra vez. Me encanta.', 'Like the first day... and you winning again. I love it.']],
  [['Más allá de todos los mapas solo quedamos tú, yo y nuestros equipos.', 'Beyond every map there is only you, me and our teams.', 'Hasta aquí hemos llegado juntos. Y todavía queda camino.', 'We have come this far together. And there is still road ahead.'],
   ['Esta es nuestra última batalla de verdad. Sin guardarme nada.', 'This is our last real battle. Holding nothing back.', 'Gracias por ser mi rival. Hasta la próxima aventura, campeón.', 'Thank you for being my rival. See you on the next adventure, champion.']],
];
// los duelos: stage = etapa que desbloquea el duelo (y a la que se escala la vida)
const RIVAL_ENC = (() => {
  const out = [];
  REGIONS.forEach((r, i) => {
    for (let m = 0; m < 2; m++) {
      const stage = r.first * 10 + (m ? 121 : 51), t = RIVAL_TALK[i][m];
      out.push({ id: 'rv' + i + 'abcd'[m], region: i, meet: m, stage, types: RIVAL_TYPES[i], pre: L(t[0], t[1]), post: L(t[2], t[3]), hp: RIVAL_HP[m], time: RIVAL_TIME[m] });
    }
  });
  return out;
})();
const RIVAL_BONUS = 0.01;                      // +1% de daño permanente por duelo ganado
const rivalReward = e => {
  const r = e.region, rew = e.meet ? { gems: 80 + 30 * r, dust: 40 + 12 * r, tk: { super: 2 }, shards: 1 + (r >= 5 ? 1 : 0), egg: r < 3 ? 1 : r < 7 ? 2 : 3, item: [20, 55, 25] } : { gems: 40 + 15 * r, dust: 20 + 8 * r, tk: { super: 1 + (r >= 3 ? 1 : 0) } };
  if (e.meet && r >= 2) rew.tk.ultra = 1;
  if (e.meet && r >= 8) rew.tk.master = 1;
  return rew;
};

// ---------------- bestiario y logros nuevos ----------------
for (const [stat, name, icon, tiers, tpl] of [
  ['trainers', L('Frente a frente', 'Face to face'), 'friends', [[1, 20], [25, 60], [100, 150], [500, 400], [2500, 900]], n => L('Vence a ' + n + ' entrenadores', 'Beat ' + n + ' trainers')],
  ['rivals', L('Rivalidad', 'Rivalry'), 'crown', [[1, 40], [5, 100], [10, 200], [20, 600]], n => L('Gana ' + n + ' duelos contra Nico', 'Win ' + n + ' duels against Nico')],
  ['bestiary', L('Bestiario', 'Bestiary'), 'book', [[25, 25], [100, 70], [250, 150], [500, 300], [800, 600]], n => L('Derrota a ' + n + ' especies distintas', 'Defeat ' + n + ' different species')],
  ['fusions', L('Alquimista', 'Alchemist'), 'candy', [[1, 20], [10, 60], [50, 160]], n => L('Fusiona objetos ' + n + ' veces', 'Fuse items ' + n + ' times')],
  ['tracks', L('Melómano', 'Music lover'), 'sound', [[8, 40], [16, 150], [MUSIC_LIST.length, 400]], n => L('Desbloquea ' + n + ' pistas de la sala de música', 'Unlock ' + n + ' tracks in the music room')],
]) {
  tiers.forEach(([goal, reward], i) => ACHIEVEMENTS.push({ id: stat + goal, stat, goal, reward, icon, name: name + (tiers.length > 1 ? ' ' + ['I', 'II', 'III', 'IV', 'V'][i] : ''), desc: tpl(abbr(goal)) }));
}

// ---------------- Ascensión y Duelos Maestros (contenido de final de partida) ----------------
// Ascender hace una Liga y además sube el Rango: los enemigos aguantan x1,25 por rango, pero cada Esencia
// da x1,05 de daño y x1,03 de monedas para siempre (se acumulan multiplicando, sin techo).
const ASC = { min: 500, hpRank: 1.25, dmgEss: 1.05, coinEss: 1.03, gainBase: 400, gainDiv: 50, gainExp: 1.35 };
const ascGain = ms => (ms < ASC.min ? 0 : Math.floor(Math.pow((ms - ASC.gainBase) / ASC.gainDiv, ASC.gainExp)));
// Duelos Maestros: cuando ganas los 20 duelos de Nico sigue una escalera sin fin
const MASTER = { hp: 15, g: 1.16, time: 50, bonus: 0.005 };
const MASTER_TALK = [
  ['Ya no queda nadie más fuerte que tú... salvo un rival que no se rinde. ¡Otra vez!', 'There is no one stronger than you left... except a rival who never gives up. Again!', 'Increíble. Cada derrota me hace más fuerte.', 'Incredible. Every defeat makes me stronger.'],
  ['He entrenado en cada región para este momento. ¡No me voy a contener!', 'I trained in every region for this moment. I am not holding back!', 'Aún me falta un poco... pero estoy cerca.', 'I am still a bit short... but I am close.'],
  ['Mi equipo y yo hemos cambiado la estrategia por completo. ¡Prepárate!', 'My team and I changed our strategy completely. Get ready!', 'Tu forma de combatir siempre me sorprende.', 'The way you battle always surprises me.'],
  ['Dicen que el que no se rinde acaba ganando. ¡Hoy voy a comprobarlo!', 'They say whoever never gives up ends up winning. Today I will find out!', 'Hoy no ha podido ser. Mañana, quién sabe.', 'Not today. Tomorrow, who knows.'],
  ['No me importa cuántas veces pierda: quiero ser el mejor, y para eso tengo que ganarte.', 'I do not care how many times I lose: I want to be the best, and for that I have to beat you.', 'Otra lección. Gracias por no ponérmelo fácil.', 'Another lesson. Thanks for not making it easy.'],
  ['Esta vez he traído lo mejor de cada tipo. ¡A ver cómo respondes!', 'This time I brought the best of every type. Let us see how you respond!', 'Qué batalla... me he divertido muchísimo.', 'What a battle... I had a great time.'],
];
const masterEnc = t => ({ id: 'master', master: t, region: 9, meet: 1, types: RIVAL_TYPES[(t - 1) % RIVAL_TYPES.length], pre: L(MASTER_TALK[(t - 1) % 6][0], MASTER_TALK[(t - 1) % 6][1]), post: L(MASTER_TALK[(t - 1) % 6][2], MASTER_TALK[(t - 1) % 6][3]), hp: MASTER.hp * Math.pow(MASTER.g, t - 1), time: MASTER.time });
const masterReward = t => {
  const r = { gems: 150 + 25 * t, dust: 100 + 20 * t, shards: 2, egg: 3, item: [0, 35, 65], tk: t % 5 === 0 ? { master: 1 } : { ultra: 1 } };
  if (t % 5 === 0) { r.ess = 1; r.excl = 1; }
  return r;
};
for (const [stat, name, icon, tiers, tpl] of [
  ['ascends', L('Ascensión', 'Ascension'), 'crown', [[1, 150], [3, 300], [10, 700], [25, 1500]], n => L('Asciende ' + n + ' veces', 'Ascend ' + n + ' times')],
  ['essence', L('Esencia', 'Essence'), 'star', [[10, 100], [50, 300], [200, 800], [1000, 2000]], n => L('Reúne ' + n + ' de Esencia', 'Gather ' + n + ' Essence')],
  ['rivalMaster', L('Maestro de Nico', 'Nico’s master'), 'trophy', [[1, 100], [5, 250], [10, 500], [25, 1200], [50, 3000]], n => L('Supera el nivel ' + n + ' de los Duelos Maestros', 'Clear Master Duel level ' + n)],
]) {
  tiers.forEach(([goal, reward], i) => ACHIEVEMENTS.push({ id: stat + goal, stat, goal, reward, icon, name: name + ' ' + ['I', 'II', 'III', 'IV', 'V'][i], desc: tpl(abbr(goal)) }));
}

// ---------------- v17: misiones nuevas, auras, objetos exclusivos, títulos ----------------
// misiones con requisito (solo salen si las puedes cumplir)
QUEST_POOL.push(
  { stat: 'trainers', goal: 4, reward: 22, text: n => L('Vence a ' + n + ' entrenadores', 'Beat ' + n + ' trainers'), req: () => Core.S.stats.maxStage >= TRAINER_MIN_STAGE },
  { stat: 'fusions', goal: 1, reward: 25, text: n => L('Fusiona ' + n + ' vez objetos', 'Fuse items ' + n + ' time'), req: () => Core.fuseGroups().length > 0 },
);
WEEKLY_POOL.push(
  { stat: 'trainers', goal: 40, reward: 130, text: n => L('Vence a ' + n + ' entrenadores', 'Beat ' + n + ' trainers'), req: () => Core.S.stats.maxStage >= TRAINER_MIN_STAGE },
  { stat: 'ascends', goal: 1, reward: 160, text: n => L('Asciende ' + n + ' vez', 'Ascend ' + n + ' time'), req: () => Core.ascOpen() },
  { stat: 'rivalMaster', goal: 2, reward: 150, text: n => L('Supera ' + n + ' niveles de los Duelos Maestros', 'Clear ' + n + ' levels of the Master Duels'), req: () => Core.masterOpen() },
  { stat: 'fusions', goal: 4, reward: 110, text: n => L('Fusiona objetos ' + n + ' veces', 'Fuse items ' + n + ' times'), req: () => Core.S.stats.itemsFound > 6 },
  { stat: 'tower', goal: 3, reward: 130, text: n => L('Sube ' + n + ' pisos nuevos de la Torre', 'Climb ' + n + ' new Tower floors'), req: () => Core.towerUnlocked() },
);

// auras: algunos enemigos salvajes (a partir de la etapa AURA.min) llevan una; dan +50 % de monedas
const AURA = { min: 150, base: 0.08, slope: 1 / 2000, max: 0.35, coins: 1.5, regen: 0.02, thick: 0.8, ward: 0.5 };
const AURAS = {
  thick: { name: L('Aura férrea', 'Iron aura'), desc: L('−20% de daño recibido', '−20% damage taken'), w: 3 },
  regen: { name: L('Aura vital', 'Vital aura'), desc: L('recupera 2% de vida por segundo', 'recovers 2% HP per second'), w: 3 },
  ward: { name: L('Aura de protección', 'Ward aura'), desc: type => L('los Pokémon de tipo ' + TYPE_NAMES[type] + ' hacen −50% de daño', TYPE_NAMES[type] + '-type Pokémon deal −50% damage'), w: 4 },
};
const auraText = a => AURAS[a.id].name + (a.type ? ' · ' + TYPE_NAMES[a.type] : '') + ': ' + (typeof AURAS[a.id].desc === 'function' ? AURAS[a.id].desc(a.type) : AURAS[a.id].desc);

// objetos exclusivos de los Duelos Maestros (siempre épicos; no caen al azar)
Object.assign(HELD, {
  insignia: { name: L('Insignia de Nico', "Nico's Badge"), icon: 'trophy', fx: 'chal', excl: true, v: 0.16, desc: v => L('+' + pctTxt(v) + ' de daño en duelos, Torre y eventos', '+' + pctTxt(v) + ' damage in duels, the Tower and events') },
  cristal: { name: L('Cristal de Esencia', 'Essence Crystal'), icon: 'star', fx: 'rank', excl: true, v: 0.01, desc: v => L('+' + pctTxt(v) + ' de daño por Rango de Ascensión (máx. +100%)', '+' + pctTxt(v) + ' damage per Ascension Rank (max +100%)') },
  eterno: { name: L('Reloj Eterno', 'Eternal Clock'), icon: 'boot', fx: 'time', excl: true, v: 1.2, desc: v => L('+' + v.toFixed(1) + ' s contra jefes y retos (equipo)', '+' + v.toFixed(1) + ' s against bosses and challenges (team)') },
});

// perfil: títulos que se desbloquean jugando
const TITLES = (() => {
  const T = [{ id: 'novato', name: L('Novato', 'Rookie'), hint: '', test: () => true }];
  const stage = (id, name, ms, hint) => T.push({ id, name, hint: hint || L('Llega a la etapa ' + ms, 'Reach stage ' + ms), test: S => S.stats.maxStage >= ms });
  stage('aprendiz', L('Aprendiz', 'Apprentice'), 50); stage('promesa', L('Promesa de la Liga', 'League hopeful'), 100);
  REGIONS.forEach((r, i) => { if (r.gen) stage('camp' + r.gen, L('Campeón de ' + r.name, 'Champion of ' + r.name), r.first * 10 + 131, L('Vence al campeón de ' + r.name, 'Beat the champion of ' + r.name)); });
  stage('viajero', L('Viajero de Más allá', 'Traveller of Beyond'), 1270, L('Llega a Más allá', 'Reach Beyond'));
  const stat = (id, name, f, hint) => T.push({ id, name, hint, test: f });
  stat('coleccionista', L('Coleccionista', 'Collector'), S => Object.keys(S.seen).length >= 100, L('Registra 100 Pokémon', 'Register 100 Pokémon'));
  stat('sabio', L('Sabio de la Pokédex', 'Pokédex sage'), S => Object.keys(S.seen).length >= 500, L('Registra 500 Pokémon', 'Register 500 Pokémon'));
  stat('maestrodex', L('Maestro de la Pokédex', 'Pokédex master'), S => Object.keys(S.seen).length >= POKEDEX.length, L('Completa la Pokédex', 'Complete the Pokédex'));
  stat('brillante', L('Cazador de shinies', 'Shiny hunter'), S => S.stats.shinies >= 10, L('Consigue 10 shinies', 'Get 10 shinies'));
  stat('criador', L('Criador', 'Breeder'), S => S.stats.hatched >= 50, L('Eclosiona 50 huevos', 'Hatch 50 eggs'));
  stat('torre', L('Escalador de la Torre', 'Tower climber'), S => S.tower.best >= 50, L('Llega al piso 50 de la Torre', 'Reach Tower floor 50'));
  stat('naturalista', L('Naturalista', 'Naturalist'), S => Object.keys(S.foes).length >= 500, L('Derrota a 500 especies', 'Defeat 500 species'));
  stat('domador', L('Terror de entrenadores', 'Trainer terror'), S => S.stats.trainers >= 100, L('Vence a 100 entrenadores', 'Beat 100 trainers'));
  stat('veterano', L('Veterano de la Liga', 'League veteran'), S => S.stats.prestiges >= 10, L('Entra 10 veces en la Liga', 'Enter the League 10 times'));
  stat('mega', L('Megaevolucionista', 'Mega evolver'), S => S.stats.megas >= 15, L('Desbloquea 15 formas Mega', 'Unlock 15 Mega forms'));
  stat('rival', L('Rival de Nico', "Nico's rival"), S => Object.keys(S.rival.won).length >= RIVAL_ENC.length, L('Gana los 20 duelos de Nico', "Win Nico's 20 duels"));
  stat('maestronico', L('Maestro de Nico', "Nico's master"), S => S.rival.master >= 10, L('Supera el nivel 10 de los Duelos Maestros', 'Clear Master Duel level 10'));
  stat('ascendido', L('Ascendido', 'Ascended'), S => S.asc.rank >= 1, L('Asciende una vez', 'Ascend once'));
  stat('ascsup', L('Ascendido supremo', 'Supreme ascended'), S => S.asc.rank >= 10, L('Llega al Rango 10', 'Reach Rank 10'));
  stat('melomano', L('Melómano', 'Music lover'), S => Core.tracksUnlocked() >= MUSIC_LIST.length, L('Desbloquea toda la sala de música', 'Unlock the whole music room'));
  stat('leyenda', L('Leyenda viva', 'Living legend'), S => S.stats.maxStage >= 2000 || S.asc.rank >= 30, L('Llega a la etapa 2000 o al Rango 30', 'Reach stage 2000 or Rank 30'));
  return T;
})();
