// Lógica de PokéIdle sin DOM: estado, fórmulas, combate automático, gacha, misiones y guardado.
// Se puede ejecutar en Node (simulaciones de equilibrio) cargando antes pokedex.js e idle.js.
'use strict';

const Core = (() => {
  const _L = typeof L === 'function' ? L : es => es;      // traducción (js/i18n.js); en Node sin ella devuelve el español
  const DEX = {};
  for (const p of POKEDEX) DEX[p.dex] = p;
  const MEGA_BY_BASE = {};                           // formas Mega: están en DEX (tipos, estadísticas, sprites) pero no en POKEDEX ni en el gacha
  if (typeof MEGA_DEX !== 'undefined') for (const p of MEGA_DEX) { DEX[p.dex] = p; (MEGA_BY_BASE[p.base] = MEGA_BY_BASE[p.base] || []).push(p); }
  const CHILDREN = {};
  for (const p of POKEDEX) if (p.evo && DEX[p.evo]) (CHILDREN[p.evo] = CHILDREN[p.evo] || []).push(p.dex);
  const bst = d => { const s = DEX[d].stats; return s.hp + s.atk + s.def + s.spa + s.spd + s.spe; };
  const baseOf = d => { let p = DEX[d]; while (p.evo && DEX[p.evo]) p = DEX[p.evo]; return p.dex; };
  const stageOf = d => { let n = 0, p = DEX[d]; while (p.evo && DEX[p.evo]) { p = DEX[p.evo]; n++; } return n; };
  const finalBst = d => Math.max(bst(d), ...(CHILDREN[d] || []).map(finalBst));
  const RAR = {};
  for (const p of POKEDEX) {
    const b = baseOf(p.dex), f = finalBst(b);
    RAR[p.dex] = RARITY_FIX[b] || (DEX[b].leg ? 5 : f >= RAR_CUT[2] ? 4 : f >= RAR_CUT[1] ? 3 : f >= RAR_CUT[0] ? 2 : 1);
  }
  const BASES = POKEDEX.filter(p => baseOf(p.dex) === p.dex).map(p => p.dex);
  // POOLG[generación][rareza] = Pokémon base que se pueden conseguir en el gacha
  const POOLG = {};
  for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9]) POOLG[g] = [null, [], [], [], [], []];
  for (const d of BASES) if (POOLG[DEX[d].gen]) POOLG[DEX[d].gen][RAR[d]].push(d);

  // ---------------- utilidades ----------------
  const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function fmt(n) {
    if (n !== n) return '0';
    if (!isFinite(n)) return '∞';
    if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n));
    let e = Math.floor(Math.log10(n) / 3), v = n / Math.pow(1000, e);
    let t = v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : String(Math.round(v));
    if (+t >= 1000) { e++; v /= 1000; t = v.toFixed(2); }              // 999999.5 → 1.00M
    else if (v < 100 && +t >= 100) t = '100';                          // 99.99 → 100
    else if (v < 10 && +t >= 10) t = '10.0';
    const suf = e < SUF.length ? SUF[e] : String.fromCharCode(97 + Math.floor((e - SUF.length) / 26)) + String.fromCharCode(97 + (e - SUF.length) % 26);
    return t + suf;
  }
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
  let rnd = Math.random;

  // ---------------- eventos ----------------
  const subs = {};
  const on = (e, f) => (subs[e] = subs[e] || []).push(f);
  const emit = (e, d) => { for (const f of subs[e] || []) f(d); };

  // ---------------- estado ----------------
  const KEY = 'pokeidle.save.v1', MAX_STAGE = 20000, MAX_LVL = 3000;
  let S = null, invDirty = true, invMap = new Map();
  function fresh() {
    return {
      v: 1, started: false, coins: 0, gems: 50, dust: 0, tk: { poke: 5, super: 1, ultra: 0, master: 0 }, stage: 1, maxStage: 1, kills: 0, auto: true,
      team: [], slots: 1, mons: {}, seen: {}, eggs: [], inc: 1, shards: 0, hist: [], presets: [1, 2, 3, 4].map(i => ({ name: 'Equipo ' + i, team: [] })), event: { week: -1, kills: 0, pulls: 0, tiers: [0, 0, 0, 0], claimed: {}, free: 0 }, tower: { best: 0 }, rival: { won: {}, rem: {}, told: {}, master: 0 }, asc: { rank: 0, ess: 0 }, tactic: 'bal', foes: {}, profile: { name: '', avatar: 0, title: 'novato' }, favs: {}, ui: {}, cloud: { uid: '', rev: 0 }, cosm: { frame: 'classic', bg: 'auto' },
      up: { tap: 0, train: 0, coin: 0, crit: 0, critdmg: 0, speed: 0, catch: 0, golden: 0, bosstime: 0, type: 0, boss: 0, autotap: 0, alch: 0 },
      shop: { dmg: 0, coins: 0, lvl: 0, slots: 0, offline: 0, catch: 0, shiny: 0, gems: 0, skill: 0, dust: 0, tapd: 0, critb: 0, disc: 0, bt: 0, egg: 0 },
      medals: 0, mp: 0, badges: {}, bossFirst: {},
      sk: { rage: 0, gold: 0, lure: 0 },        // instante (tiempo jugado) en el que está lista cada habilidad
      skOn: { rage: 0, gold: 0, lure: 0 },      // instante en el que termina cada habilidad
      stats: { maxDps: 0, bestHit: 0, megas: 0, kills: 0, taps: 0, pulls: 0, levels: 0, bosses: 0, catches: 0, evolutions: 0, shinies: 0, prestiges: 0, coinsTotal: 0, time: 0, hatched: 0, eggsFound: 0, ivUps: 0, eventTiers: 0, bred: 0, maxStage: 1, maxStars: 0, stages: 0, skills: 0, dust: 0, crits: 0, goldens: 0, dustBuys: 0, trainers: 0, rivals: 0, fusions: 0, ascends: 0, freePulls: 0, streak: 0, itemsFound: 0 },
      bossFails: {}, retryT: 0, pity: 0, pityE: 0, bannerLost: 0, freeDay: '', autoAcc: 0, inv: [], uid: 1, tutDone: false, last: Date.now(),
      daily: { day: '', streak: 0, claimed: true, quests: [] }, weekly: { week: -1, quests: [] }, ach: {},
      buyMul: 1, settings: { music: 0.35, sfx: 0.6, master: 1, combat: 0.8, mstyle: 'warm', mmode: 'region', mpin: 'r0', bgmute: true, captions: false, autoTactic: false, tips: true, nums: true, shake: true, bigNums: true, autoBoss: true, notify: false, lang: null, a11y: { motion: 'auto', text: 1, nf: false, hc: false, cb: false } },
    };
  }
  const TAB = Math.random().toString(36).slice(2), OWN = 'pokeidle.owner';
  const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const clampN = (x, def, lo, hi) => Number.isFinite(+x) ? Math.min(hi, Math.max(lo, +x)) : def;
  const cleanName = (x, n) => typeof x === 'string' ? x.replace(/[<>&"'`\\]/g, '').slice(0, n) : '';
  // si la partida guardada está dañada no dejamos la página en blanco: se guarda una copia y se empieza limpio
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    try { return loadFrom(raw); } catch (e) {
      try { if (raw) localStorage.setItem(KEY + '.corrupt', raw); } catch (e2) { /* sin espacio */ }
      if (typeof console !== 'undefined') console.error('[PokéIdle] partida dañada; copia en ' + KEY + '.corrupt', e);
      return loadFrom(null);
    } finally { claim(); }
  }
  function loadFrom(raw) {
    let d = null;
    try { d = JSON.parse(raw); } catch (e) { d = null; if (raw) { try { localStorage.setItem(KEY + '.corrupt', raw); } catch (e2) { /* sin espacio */ } } }
    const f = fresh();
    const legacy = !!(d && typeof d === 'object' && d.started && d.tutDone === undefined);
    const giftEgg = !!(d && typeof d === 'object' && d.started && d.eggs === undefined);
    if (!d || typeof d !== 'object' || d.v !== 1) d = f;
    for (const k of Object.keys(f)) if (d[k] === undefined) d[k] = f[k];
    // tipos y rangos: un guardado manipulado o antiguo no puede romper el arranque
    for (const g of ['up', 'stats', 'settings', 'shop', 'sk', 'skOn', 'tk', 'mons', 'seen', 'badges', 'bossFails']) if (!isObj(d[g])) d[g] = JSON.parse(JSON.stringify(f[g]));
    for (const g of ['up', 'stats', 'shop', 'sk', 'skOn', 'tk']) for (const k of Object.keys(f[g])) d[g][k] = clampN(d[g][k], f[g][k], 0, 1e300);
    for (const k of ['coins', 'gems', 'dust', 'shards', 'mp', 'medals', 'kills', 'pity', 'pityE', 'uid']) d[k] = clampN(d[k], f[k] === undefined ? 0 : f[k], 0, 1e300);
    d.maxStage = Math.floor(clampN(d.maxStage, 1, 1, MAX_STAGE)); d.stage = Math.floor(clampN(d.stage, 1, 1, d.maxStage));
    d.slots = Math.floor(clampN(d.slots, 1, 1, 6)); d.last = clampN(d.last, Date.now(), 0, Date.now() + 864e5);
    if (!Array.isArray(d.team)) d.team = [];
    for (const k of Object.keys(d.mons)) {
      const m = d.mons[k];
      if (!/^\d+$/.test(k) || !isObj(m) || !DEX[m.dex]) { delete d.mons[k]; continue; }
      m.lvl = Math.floor(clampN(m.lvl, 1, 1, MAX_LVL)); m.stars = Math.floor(clampN(m.stars, 0, 0, 5)); m.copies = Math.floor(clampN(m.copies, 0, 0, 1e9));
    }
    for (const k of Object.keys(d.seen)) if (!/^\d+$/.test(k) || !DEX[k]) delete d.seen[k];
    if (!Array.isArray(d.inv)) d.inv = [];
    for (const it of d.inv) if (isObj(it) && it.id === 'polvo') it.id = 'moneda';       // el Polvo Brillo desaparece: pasa a ser una Moneda de la misma rareza
    d.inv = d.inv.filter(it => isObj(it) && HELD[it.id] && ITEM_RAR[it.rar] && Number.isFinite(+it.u));
    { const ids = new Set(d.inv.map(it => it.u)); for (const m of Object.values(d.mons)) if (m.item && !ids.has(m.item)) m.item = null; }
    if (!d.settings.a11y || typeof d.settings.a11y !== 'object') d.settings.a11y = Object.assign({}, f.settings.a11y);
    for (const k of Object.keys(f.settings.a11y)) if (d.settings.a11y[k] === undefined) d.settings.a11y[k] = f.settings.a11y[k];
    for (const g of ['up', 'stats', 'settings', 'shop', 'sk', 'skOn', 'tk']) for (const k of Object.keys(f[g])) if (d[g][k] === undefined) d[g][k] = f[g][k];
    if (typeof d.badges !== 'object' || d.badges === null) d.badges = {};
    if (typeof d.bossFails !== 'object' || d.bossFails === null) d.bossFails = {};
        for (const m of Object.values(d.mons)) if (m.shinyOwned === undefined) m.shinyOwned = !!m.shiny;
    // partidas anteriores a las naturalezas, los IVs y los huevos: tiran sus datos una vez y reciben un huevo de regalo
    for (const m of Object.values(d.mons)) {
      if (!Array.isArray(m.megas)) m.megas = [];
      m.megas = m.megas.filter(f => (MEGA_BY_BASE[m.dex] || []).some(e => e.form === f));
      if (!m.megas.includes(m.mf)) m.mf = null;
      if (!NATURES[m.nat]) m.nat = Math.floor(rnd() * NATURES.length);
      if (!m.iv || typeof m.iv.d !== 'number') m.iv = rollIv(8);
    }
    if (!Array.isArray(d.eggs)) d.eggs = [];
    if (giftEgg) d.eggs.push({ t: 0, p: 0 });
    d.eggs = d.eggs.filter(e => e && EGGS[e.t]).slice(0, EGG_CAP);
    if (!(d.inc >= 1)) d.inc = 1;
    if (!Array.isArray(d.hist)) d.hist = [];
    d.hist = d.hist.filter(h => Array.isArray(h) && h.length >= 5).slice(-HIST_MAX);
    if (!Array.isArray(d.presets)) d.presets = f.presets;
    d.presets = [0, 1, 2, 3].map(i => { const p = d.presets[i] || {}; return { name: typeof p.name === 'string' && cleanName(p.name, 16) ? cleanName(p.name, 16) : 'Equipo ' + (i + 1), team: Array.isArray(p.team) ? p.team.map(String).filter(k => d.mons[k]) : [] }; });
    if (!d.event || typeof d.event !== 'object') d.event = f.event;
    if (!d.tower || typeof d.tower.best !== 'number') d.tower = { best: 0 };
    if (!d.rival || typeof d.rival !== 'object') d.rival = { won: {}, rem: {}, told: {}, master: 0 };
    if (!d.rival.won || typeof d.rival.won !== 'object') d.rival.won = {};
    if (!d.rival.rem || typeof d.rival.rem !== 'object') d.rival.rem = {};
    if (!d.rival.told || typeof d.rival.told !== 'object') d.rival.told = {};
    if (!(d.rival.master >= 0)) d.rival.master = 0;
    if (!d.asc || typeof d.asc !== 'object') d.asc = { rank: 0, ess: 0 };
    d.asc.rank = Math.max(0, Math.floor(+d.asc.rank || 0)); d.asc.ess = Math.max(0, Math.floor(+d.asc.ess || 0));
    d.rival.won = Object.fromEntries(Object.keys(d.rival.won).filter(k => RIVAL_ENC.some(e => e.id === k)).map(k => [k, 1]));
    d.tactic = 'bal'; d.settings.autoTactic = false;
    if (!d.foes || typeof d.foes !== 'object' || Array.isArray(d.foes)) d.foes = {};
    if (!d.profile || typeof d.profile !== 'object') d.profile = { name: '', avatar: 0, title: 'novato' };
    d.profile.name = cleanName(d.profile.name, 14);
    if (!DEX[d.profile.avatar] || !d.mons[String(baseOf(d.profile.avatar))]) d.profile.avatar = 0;
    if (!TITLES.some(t => t.id === d.profile.title)) d.profile.title = 'novato';
    if (!d.favs || typeof d.favs !== 'object' || Array.isArray(d.favs)) d.favs = {};
    for (const k of Object.keys(d.favs)) if (!/^\d+$/.test(k) || !DEX[k]) delete d.favs[k];
    for (const k of Object.keys(d.foes)) if (!/^\d+$/.test(k) || !DEX[k]) delete d.foes[k];
    if (!d.ui || typeof d.ui !== 'object' || Array.isArray(d.ui)) d.ui = {};
    if (!d.cloud || typeof d.cloud !== 'object') d.cloud = { uid: '', rev: 0 };
    d.cloud.uid = typeof d.cloud.uid === 'string' ? d.cloud.uid : ''; d.cloud.rev = Math.max(0, Math.floor(+d.cloud.rev || 0));
    if (!d.ui.tips || typeof d.ui.tips !== 'object') d.ui.tips = {};
    if (!d.ui.biomes || typeof d.ui.biomes !== 'object') d.ui.biomes = {};
    if (!d.cosm || typeof d.cosm !== 'object') d.cosm = { frame: 'classic', bg: 'auto' };
    if (!FRAMES.some(f => f.id === d.cosm.frame)) d.cosm.frame = 'classic';
    if (d.cosm.bg !== 'auto' && !d.ui.biomes[d.cosm.bg]) d.cosm.bg = 'auto';
    if (!['warm', 'retro', 'dream'].includes(d.settings.mstyle)) d.settings.mstyle = 'warm';
    if (!['region', 'shuffle', 'pin'].includes(d.settings.mmode)) d.settings.mmode = 'region';
    if (!MUSIC_LIST.some(t => t.id === d.settings.mpin)) d.settings.mpin = 'r0';
    // partidas antiguas: la base de algunas líneas cambió al añadir bebés (Pichu, Cleffa…)
    for (const k of Object.keys(d.mons)) {
      const b = String(baseOf(d.mons[k].dex));
      if (b !== k && !d.mons[b]) { d.mons[b] = d.mons[k]; delete d.mons[k]; d.team = d.team.map(t => String(t) === k ? b : t); }
    }
    d.team = d.team.map(String).filter((k, i, a) => d.mons[k] && a.indexOf(k) === i);
    if (d.stats.maxStage < d.maxStage) d.stats.maxStage = d.maxStage;
    if (legacy) d.tutDone = true;
    if (d.started && !Object.keys(d.ui.biomes).length) { const top = Math.min(ROUTES.length - 1, Math.floor((Math.max(d.stats.maxStage, d.maxStage) - 1) / 10)); for (let i = 0; i <= top; i++) d.ui.biomes[ROUTES[i].biome] = 1; }
    invDirty = true;
    S = d;
    if (S.dust > 0) { gainDust(S.dust); }                       // el polvo estelar que tuvieras se convierte en monedas
    S.dust = 0;
    stale = false;
    chal = null;
    refreshEvent();
    resetFight();
    return S;
  }
  let frozen = false;
  const freezeSave = b => { frozen = !!b; };           // para que, al cargar otra partida, el guardado de salida no la pise
  // una sola pestaña manda sobre la partida: la última que se abre toma el relevo y las anteriores dejan de guardar
  let stale = false, saveFails = 0;
  function claim() { stale = false; try { localStorage.setItem(OWN, TAB); } catch (e) { /* sin almacenamiento */ } }
  function ownerCheck() {
    if (stale) return false;
    try { const o = localStorage.getItem(OWN); if (o && o !== TAB) { stale = true; paused = true; emit('stale'); return false; } } catch (e) { /* sin almacenamiento */ }
    return true;
  }
  function save() {
    if (!S || frozen || !ownerCheck()) return;
    S.last = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); saveFails = 0; }
    catch (e) { if (++saveFails === 3) emit('saveFail'); }
  }
  function wipe() { S = fresh(); chal = null; refreshEvent(); resetFight(); save(); }

  // ---------------- fórmulas ----------------
  // hpB/hpG = vida del enemigo (base y crecimiento por etapa) · coinR = monedas por vida · lvlG = crecimiento del coste de nivel
  const K = { hpD: 0.055, hpD0: 100, hpD1: 300, hpS: 80, hpM: 1.8, hp0: 50, bw: 0.08, bwMin: 0.35, ready: 0.95, retryMax: 600, gate: 0.6, hpB: 100, hpG: 1.17, hpL: 6, coinR: 0.0012, cd: 0.994, cdS: 150, cd2: 0.997, cf: 0.5, cs: 0.12, lvlG: 1.15, lvlS: 100, lvlG2: 1.13, dG: 1.075, eE0: 0.28, eS: 220, eP: 1.2, cE: 2.5, cES: 45 };
  const route = s => Math.floor((s - 1) / 10);
  const routeIdx = s => route(s) % ROUTES.length;
  const routeData = s => ROUTES[routeIdx(s)];
  const regionOfRoute = ri => { let r = 0; for (let i = 0; i < REGIONS.length; i++) if (ri >= REGIONS[i].first) r = i; return r; };
  const regionOf = s => regionOfRoute(routeIdx(s));
  const loopOf = s => Math.floor(route(s) / ROUTES.length);
  const isBoss = s => s % 10 === 0;
  const bossTier = s => BOSS_TIER[routeData(s).boss.tier];
  const bossTime = s => bossTier(s).time + 3 * S.up.bosstime + 2 * S.shop.bt + teamItemSum('time');
  // cada intento fallido contra un jefe lo debilita un poco, hasta un mínimo (evita muros eternos)
  const bossEase = s => (isBoss(s) ? Math.max(K.bwMin, 1 - K.bw * (S.bossFails[s] || 0)) : 1);
  const hpCurve = s => (s <= K.hp0 ? 1 : Math.pow((1 + s / K.hpS) / (1 + K.hp0 / K.hpS), K.hpM));   // endurece poco a poco el ritmo en las etapas altas
  // crecimiento de vida acumulado: el factor por etapa baja poco a poco en las regiones lejanas
  const hpTab = [1, 1];
  function hpBase(s) {
    for (let i = hpTab.length; i <= s; i++) { const k = i - 1, g = K.hpG - K.hpD * Math.max(0, Math.min(1, (k - K.hpD0) / K.hpD1)); hpTab[i] = hpTab[i - 1] * g; }
    return K.hpB * hpTab[s];
  }
  // arranque suave: en las primeras etapas los enemigos son más débiles (eE0 = factor en la etapa 0) y suben hasta la normalidad en la etapa eS
  const earlyEase = s => (s >= K.eS ? 1 : K.eE0 + (1 - K.eE0) * Math.pow(s / K.eS, K.eP));
  const enemyHp = s => Math.round((hpBase(s) + K.hpL * s) * hpCurve(s) * earlyEase(s)) * (isBoss(s) ? bossTier(s).hp * bossEase(s) : 1) * rankHp();
  // poder del equipo contra el jefe de la etapa s (1 = lo derrota justo a tiempo)
  const bossReady = s => { const r = routeData(s); return teamDps(DEX[r.boss.dex].types) * (1 + 0.04 * S.up.boss) * bossTime(s) / enemyHp(s); };
  const skillOn = id => S.skOn[id] > S.stats.time;
  const medalMult = () => 1 + 0.03 * S.medals;
  // táctica de equipo (se desbloquea en la etapa TACTIC_UNLOCK); la equilibrada no cambia nada
  const tact = () => TACTICS.bal;                       // las tácticas de equipo se retiraron: siempre la equilibrada (sin efecto)
  const tacticOpen = () => false;
  function setTactic(id) { if (!TACTICS[id] || !tacticOpen()) return false; S.tactic = id; return true; }
  const rivalWins = () => Object.keys(S.rival.won).length;
  // ascensión: el rango endurece a los enemigos y la Esencia da multiplicadores permanentes
  const rankHp = () => Math.pow(ASC.hpRank, S.asc.rank);
  const ascDmg = () => Math.pow(ASC.dmgEss, S.asc.ess);
  const ascCoin = () => Math.pow(ASC.coinEss, S.asc.ess);
  const ascOpen = () => S.stats.maxStage >= ASC.min;
  const ascReady = () => S.maxStage >= ASC.min;
  const essGain = () => ascGain(S.maxStage);
  const coinMult = () => (1 + 0.15 * S.up.coin) * medalMult() * (1 + 0.06 * S.shop.coins) * (skillOn('gold') ? 3 : 1) * (1 + teamItemSum('coins') + synergies().coins + teamNat('coin')) * (evBonus('coins') ? 1.5 : 1) * (1 + tact().coin) * ascCoin();
  // las monedas por vida bajan con la etapa; pasada la etapa cdS bajan más despacio para que el tramo largo no se estanque
  const coinDecay = s => Math.pow(K.cd, Math.min(s, K.cdS)) * Math.pow(K.cd2, Math.max(0, s - K.cdS));
  const killCoins = s => Math.ceil(((hpBase(s) + K.hpL * s) * K.coinR * coinDecay(s) + K.cf + s * K.cs) * (1 + K.cE * Math.exp(-s / K.cES)) * coinMult() * (isBoss(s) ? 6 : 1));
  // el polvo estelar se retiró: sus fuentes dan monedas y sus gastos cuestan monedas.
  // Una «unidad» (lo que antes era 1 de polvo) = 3 derrotas del tramo actual, así que siempre está a la escala de tu partida
  const coinsPerDust = () => { let st = Math.max(1, S.maxStage - 1); if (isBoss(st)) st--; return Math.max(1, killCoins(Math.max(1, st))) * 3; };
  const dc = n => Math.max(1, Math.round(n * coinsPerDust()));
  // las fuentes (repetidos, huevos de sobra, reciclar, recompensas) pagan menos que lo que cuestan los gastos: así el gacha no infla la economía
  const SRC_RATE = 0.15 / 3;
  const srcCoins = n => Math.max(1, Math.round(n * coinsPerDust() * SRC_RATE));
  const gainDust = n => { const c = srcCoins(n); S.coins += c; S.stats.coinsTotal += c; return c; };
  const dexCount = () => Object.keys(S.seen).length;                                   // especies obtenidas (dan +1% de daño cada una)
  const isReg = d => !!(S.seen[d] || S.foes[d]);
  const regCount = () => { const u = new Set(Object.keys(S.seen)); for (const k of Object.keys(S.foes)) if (DEX[k]) u.add(k); return u.size; };      // registradas: obtenidas o vistas en combate
  const badgeCount = () => Object.keys(S.badges).length;
  const gemMult = () => 1 + 0.1 * S.shop.gems;
  const globalDmg = () => (1 + 0.1 * S.up.train) * (1 + TOWER_BONUS * S.tower.best) * medalMult() * (1 + 0.06 * S.shop.dmg) * (1 + 0.01 * dexCount()) * (1 + 0.03 * badgeCount()) * (1 + RIVAL_BONUS * rivalWins()) * (1 + MASTER.bonus * S.rival.master) * ascDmg() * (skillOn('rage') ? 3 : 1);
  const lvlMult = l => Math.pow(K.dG, l - 1) * Math.pow(2, Math.floor(l / 25));
  const power = d => Math.pow(bst(d) / 100, 2);
  // ---------------- objetos equipables ----------------
  function invLookup(u) {
    if (invDirty) { invMap = new Map(S.inv.map(i => [i.u, i])); invDirty = false; }
    return invMap.get(u);
  }
  const itemOf = m => (m && m.item && !chalRule('noitems') ? invLookup(m.item) : null);
  const itemVal = it => HELD[it.id].v * ITEM_RAR[it.rar].mult;
  function itemDmg(m, it) {
    it = it || itemOf(m); if (!it) return 0;
    const fx = HELD[it.id].fx, v = itemVal(it);
    if (fx === 'dmg' || fx === 'dmgslow') return v;
    if (fx === 'type') return DEX[fdex(m)].types.includes(it.type) ? v : v * 0.2;
    if (fx === 'chal') return chal ? v : 0;
    if (fx === 'rank') return Math.min(1, v * S.asc.rank);
    return 0;
  }
  function itemSpd(m) { const it = itemOf(m); if (!it) return 0; const fx = HELD[it.id].fx; return fx === 'spd' ? itemVal(it) : fx === 'dmgslow' ? -0.1 : 0; }
  function itemCrit(m) { const it = itemOf(m); return it && HELD[it.id].fx === 'crit' ? itemVal(it) : 0; }
  function itemBoss(m) { const it = itemOf(m); return it && HELD[it.id].fx === 'boss' ? itemVal(it) : 0; }
  function teamItemSum(fx) { let x = 0; for (const k of S.team) { const it = itemOf(S.mons[k]); if (it && HELD[it.id].fx === fx) x += itemVal(it); } return x; }

  // ---------------- sinergias de equipo ----------------
  function synergies() {
    if (chalRule('nosyn')) return { type: {}, dmg: 0, coins: 0, boss: 0, list: [] };
    const team = S.team.map(k => S.mons[k]).filter(Boolean), out = { type: {}, dmg: 0, coins: 0, boss: 0, list: [] };
    const cnt = {};
    for (const m of team) for (const t of DEX[fdex(m)].types) cnt[t] = (cnt[t] || 0) + 1;
    for (const t of Object.keys(cnt)) if (cnt[t] >= 2) { out.type[t] = TYPE_SYN[Math.min(6, cnt[t])]; out.list.push({ id: 'type:' + t, name: _L('Afinidad ', 'Affinity: ') + TYPE_NAMES[t] + ' (' + cnt[t] + ')', txt: '+' + Math.round(out.type[t] * 100) + _L('% de daño a los de ese tipo', '% damage to that type') }); }
    const prim = new Set(team.map(m => DEX[fdex(m)].types[0])).size;
    if (prim >= 6) { out.dmg += 0.3; out.list.push({ id: 'div', name: _L('Diversidad total', 'Total diversity'), txt: _L('+30% de daño al equipo', '+30% team damage') }); }
    else if (prim >= 4) { out.dmg += 0.15; out.list.push({ id: 'div', name: _L('Diversidad', 'Diversity'), txt: _L('+15% de daño al equipo', '+15% team damage') }); }
    const leg = team.filter(m => RAR[m.dex] === 5).length;
    if (leg >= 4) { out.dmg += 0.5; out.list.push({ id: 'leg', name: _L('Panteón legendario', 'Legendary pantheon'), txt: _L('+50% de daño al equipo', '+50% team damage') }); }
    else if (leg >= 2) { out.dmg += 0.2; out.list.push({ id: 'leg', name: _L('Élite legendaria', 'Legendary elite'), txt: _L('+20% de daño al equipo', '+20% team damage') }); }
    const sh = team.filter(m => m.shiny).length;
    if (sh >= 4) { out.coins += 0.25; out.list.push({ id: 'sh', name: _L('Constelación shiny', 'Shiny constellation'), txt: _L('+25% de monedas', '+25% coins') }); }
    else if (sh >= 2) { out.coins += 0.1; out.list.push({ id: 'sh', name: _L('Brillo compartido', 'Shared shine'), txt: _L('+10% de monedas', '+10% coins') }); }
    const cmb = itemCombos(team);
    out.dmg += cmb.dmg; out.coins += cmb.coins; out.boss = cmb.boss; out.list.push(...cmb.list);
    if (team.length >= 3 && team.every(m => m.stars >= 3)) { out.dmg += 0.25; out.list.push({ id: 'vet', name: _L('Equipo veterano', 'Veteran team'), txt: _L('+25% de daño (todos con ★3 o más)', '+25% damage (all with ★3 or more)') }); }
    return out;
  }
  // combos de objetos: 3 (o más) objetos distintos de un mismo grupo en el equipo
  function itemCombos(team) {
    const out = { dmg: 0, coins: 0, boss: 0, list: [] }, ids = new Set();
    for (const m of team) { const it = itemOf(m); if (it) ids.add(it.id); }
    if (ids.size < 3) return out;
    for (const [id, c] of Object.entries(ITEM_COMBO)) {
      const n = c.ids.filter(x => ids.has(x)).length;
      let lv = -1; for (let i = 0; i < c.need.length; i++) if (n >= c.need[i]) lv = i;
      if (lv < 0) continue;
      const key = c.dmg ? 'dmg' : c.boss ? 'boss' : 'coins', val = c[key][lv];
      out[key] += val; out.list.push({ id: 'item:' + id, name: c.name + ' (' + n + ')', txt: c.txt(val) });
    }
    return out;
  }
  function synMult(m) {
    const sy = synergies(); let tb = 0;
    for (const t of DEX[fdex(m)].types) tb = Math.max(tb, sy.type[t] || 0);
    return 1 + sy.dmg + tb;
  }

  // ---------------- naturalezas e IVs ----------------
  const natOf = m => NATURES[m.nat] || NATURES[0];
  const natVal = (m, ax) => { const n = natOf(m); return n.up === ax ? NAT_GAIN[ax] : n.down === ax ? -NAT_GAIN[ax] / 2 : 0; };
  const teamNat = ax => { let x = 0; for (const k of S.team) if (S.mons[k]) x += natVal(S.mons[k], ax); return x; };
  const ivSum = m => m.iv.d + m.iv.s + m.iv.c;
  const ivPct = m => ivSum(m) / (3 * IV_MAX);
  const ivGrade = m => { const p = ivPct(m); for (const g of IV_GRADES) if (p >= g[0]) return g; return IV_GRADES[IV_GRADES.length - 1]; };
  const ivBonus = (m, k) => IV_EFF[k] * m.iv[k] / IV_MAX;
  function rollIv(floor) { const r = () => Math.min(IV_MAX, floor + Math.floor(rnd() * (IV_MAX + 1 - floor))); return { d: r(), s: r(), c: r() }; }

  // ---------------- eventos semanales ----------------
  let curEv = null, evT = 0, chal = null, histT = 0;
  // historial para las estadísticas: una muestra por minuto jugado; al llenarse se queda con una de cada dos
  const HIST_STEP = 60, HIST_MAX = 240;
  function sample() {
    if (!S.team.length) return;
    const d = teamDps();
    if (d > S.stats.maxDps) S.stats.maxDps = d;
    S.hist.push([Math.round(S.stats.time), S.maxStage, Math.round(S.stats.coinsTotal), S.stats.kills, Math.round(d)]);
    if (S.hist.length > HIST_MAX) S.hist = S.hist.filter((_, i) => i % 2 === 1 || i === S.hist.length - 1);
  }
  const evBonus = id => !!(curEv && curEv.bonus === id);
  function eventDef(w) {
    const type = EVENT_TYPES[w % EVENT_TYPES.length], cycle = Math.floor(w / EVENT_TYPES.length);
    const cands = POKEDEX.filter(p => p.types.includes(type) && !CHILDREN[p.dex]).sort((a, b) => bst(b.dex) - bst(a.dex) || a.dex - b.dex).slice(0, 8);
    return { w, type, bonus: EVENT_BONUS_ORDER[w % EVENT_BONUS_ORDER.length], boss: cands[cycle % cands.length].dex };
  }
  function refreshEvent() {
    const w = weekIdx();
    if (!curEv || curEv.w !== w) curEv = eventDef(w);
    if (S && S.event && S.event.week !== w) S.event = { week: w, kills: 0, pulls: 0, tiers: [0, 0, 0, 0], claimed: {}, free: 0 };
  }
  const eventDaysLeft = () => 7 - (dayIndex() + 3) % 7;
  const eventPool = (rar) => { const out = []; for (const g of unlockedGens()) for (const d of POOLG[g][rar]) if (DEX[d].types.includes(curEv.type)) out.push(d); return out; };
  // destacado del evento (épico o legendario del tipo de la semana, fijo durante el ciclo)
  function eventFeat(rar) {
    const l = eventPool(rar);
    return l.length ? l[Math.floor(curEv.w / EVENT_TYPES.length) % l.length] : null;
  }
  const chalRule = id => !!(chal && chal.rule && chal.rule.id === id);

  const tierOf = lvl => { let t = 0; for (let i = 0; i < TIER_LV.length; i++) if (lvl >= TIER_LV[i]) t = i; return t; };
  // forma con la que combate un Pokémon: la Mega activa o su especie normal
  const megaOf = m => (m.mf ? (MEGA_BY_BASE[m.dex] || []).find(e => e.form === m.mf) : null);
  const fdex = m => { const e = megaOf(m); return e ? e.dex : m.dex; };
  const moveOf = m => MOVE_TIERS[DEX[fdex(m)].types[0]][tierOf(m.lvl)];
  function monDmg(m) { return power(fdex(m)) * RAR_MULT[RAR[m.dex]] * lvlMult(m.lvl) * STAR_MULT[m.stars] * (m.shiny ? 1.5 : 1) * TIER_MULT[tierOf(m.lvl)] * globalDmg() * (1 + itemDmg(m)) * synMult(m) * (1 + natVal(m, 'dmg')) * (1 + ivBonus(m, 'd')) * (curEv && DEX[fdex(m)].types.includes(curEv.type) ? 1 + EVENT_DMG : 1) * (chalRule('only') && !DEX[fdex(m)].types.includes(chal.rule.only) ? 0.5 : 1) * (1 + tact().dmg); }
  function monRate(m) { const spe = DEX[fdex(m)].stats.spe; return Math.max(0.55, 1.25 - spe / 260) / ((1 + 0.04 * S.up.speed) * (1 + itemSpd(m)) * (1 + natVal(m, 'spd')) * (1 + ivBonus(m, 's'))); }
  function typeEff(at, defTypes) {
    let e = 1;
    for (const t of defTypes) { const f = TYPE_CHART[at] && TYPE_CHART[at][t]; if (f !== undefined) e *= f; }
    return e;
  }
  // multiplicador de daño del Pokémon contra un enemigo: usa su mejor tipo. Resistido ×0,5 (inmune ×0,35), eficaz ×2 o más
  function eff(dex, defTypes) {
    let best = 0;
    for (const at of DEX[dex].types) best = Math.max(best, typeEff(at, defTypes));
    const b = Math.min(2.5, Math.max(best === 0 ? 0.35 : 0.5, best));
    return b >= 2 ? b * (1 + 0.04 * S.up.type) : b;
  }
  // enemigos de una etapa como listas de tipos: el jefe, o los tipos que salen en la ruta
  const routeFoes = s => { const r = routeData(s); return isBoss(s) ? [DEX[r.boss.dex].types] : r.types.map(t => [t]); };
  const matchupAvg = (m, foes) => foes.reduce((a, t) => a + eff(fdex(m), t), 0) / foes.length;
  // los mejores Pokémon para una etapa (daño real contra sus enemigos, no solo contra uno)
  function bestTeam(s, n) {
    const foes = routeFoes(s);
    return Object.keys(S.mons).map(k => { const m = S.mons[k]; return { k, v: monDmg(m) / monRate(m) * matchupAvg(m, foes) * (1 + critChance(m) * (critMult() - 1)) }; })
      .sort((a, b) => b.v - a.v).slice(0, n || S.slots).map(o => o.k);
  }
  // los tipos que mejor golpean a los enemigos de la etapa
  function strongTypes(s) {
    const foes = routeFoes(s);
    return Object.keys(TYPE_NAMES).map(t => ({ t, v: foes.reduce((a, d) => a + Math.min(2, Math.max(0.5, typeEff(t, d))), 0) / foes.length }))
      .filter(o => o.v >= 1.25).sort((a, b) => b.v - a.v).slice(0, 4);
  }
  // el coste de nivel crece 15% por nivel hasta el nivel lvlS y más despacio después, para que subir de nivel siga compensando en el tramo largo
  const levelCost = (m, l) => Math.ceil(6 * RAR_COST[RAR[m.dex]] * Math.pow(K.lvlG, Math.min(l - 1, K.lvlS)) * Math.pow(K.lvlG2, Math.max(0, l - 1 - K.lvlS)));
  function levelCostN(m, n) { let c = 0; for (let i = 0; i < n; i++) c += levelCost(m, m.lvl + i); return c; }
  function maxAffordable(m) { let n = 0, c = 0; while (n < 1000) { const k = levelCost(m, m.lvl + n); if (c + k > S.coins) break; c += k; n++; } return { n, c }; }
  const upCost = id => Math.ceil(UPGRADES[id].base * Math.pow(UPGRADES[id].mul, S.up[id]));
  const shopCost = id => Math.ceil(LEAGUE_SHOP[id].base * Math.pow(LEAGUE_SHOP[id].mul, S.shop[id]));
  const pokeBallPrice = () => Math.ceil((1 - 0.04 * S.shop.disc) * 30 * Math.pow(1.2, Math.min(S.stats.maxStage, 140) - 1) * Math.pow(1.05, Math.max(0, S.stats.maxStage - 140)));
  const critChance = m => chalRule('nocrit') ? 0 : Math.max(0, 0.03 + 0.02 * S.up.crit + 0.01 * S.shop.critb + (m ? itemCrit(m) + natVal(m, 'crit') + ivBonus(m, 'c') : 0));
  const critMult = () => 3 + 0.25 * S.up.critdmg;
  const catchChance = () => (0.015 + 0.005 * S.up.catch + 0.004 * S.shop.catch) * (skillOn('lure') ? 6 : 1) * (1 + teamItemSum('drop') + tact().drop) * (evBonus('tickets') ? 1.5 : 1);
  const goldenChance = () => 1 / 120 + 0.002 * S.up.golden;
  const shinyRate = () => SHINY_RATE * (1 + 0.2 * S.shop.shiny) * (evBonus('shiny') ? 2 : 1);
  function teamDps(defTypes) {
    let d = 0;
    for (const k of S.team) { const m = S.mons[k]; d += monDmg(m) / monRate(m) * (defTypes ? eff(fdex(m), defTypes) : 1) * (1 + critChance(m) * (critMult() - 1)); }
    return d;
  }
  const bossBonus = (e, m) => (e && e.boss ? (1 + 0.04 * S.up.boss) * (1 + (m ? itemBoss(m) + natVal(m, 'boss') : 0)) * (1 + synergies().boss) * (1 + tact().boss) : 1 + tact().wild);
  const tapDmg = () => (1 + 3 * S.up.tap + teamDps() * (0.15 + 0.02 * S.up.tap)) * (1 + 0.1 * S.shop.tapd) * (1 + teamItemSum('tap'));
  // vista previa del efecto de la siguiente mejora (toque, monedas, daño del equipo) para que se vea cuánto sube de verdad
  function previewUp(id, k) {
    if (!['tap', 'coin', 'train'].includes(id) || S.up[id] >= UPGRADES[id].max) return null;
    const f = id === 'tap' ? tapDmg : id === 'coin' ? () => killCoins(Math.max(1, S.stage - (isBoss(S.stage) ? 1 : 0))) : () => teamDps();
    const o = S.up[id], a = f(); S.up[id] = Math.min(UPGRADES[id].max, o + (k || 1));
    let b; try { b = f(); } finally { S.up[id] = o; }
    return { a, b };
  }
  const medalFor = ms => ms < 60 ? 0 : Math.max(1, Math.floor(Math.pow((ms - 45) / 12, 1.4)));
  const medalGain = () => medalFor(S.maxStage);
  const genUnlocked = g => g <= 1 || S.stats.maxStage > REGIONS[g - 1].first * 10;
  const unlockedGens = () => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(genUnlocked);

  // ---------------- combate ----------------
  const F = { enemy: null, timers: [], hits: [], respawn: 0, bossT: 0, bossT0: 0, trainer: null };
  let paused = false;
  const setPaused = b => { paused = !!b; };
  const wildCache = {};
  function wildPool(ri, maxEvo, rr) {
    const key = ri + '/' + maxEvo;
    if (wildCache[key]) return wildCache[key];
    const r = ROUTES[ri];
    return (wildCache[key] = POKEDEX.filter(p => !p.leg && r.gens.includes(p.gen) && p.types.some(t => r.types.includes(t)) && stageOf(p.dex) <= maxEvo && (stageOf(p.dex) >= maxEvo - 1 || rr < 3)).map(p => p.dex));
  }
  function pickWild(s) {
    const ri = routeIdx(s), reg = regionOfRoute(ri), rr = ri - REGIONS[reg].first;
    const maxEvo = loopOf(s) > 0 || reg === 3 || rr >= 7 ? 2 : rr >= 3 ? 1 : 0;
    let pool = wildPool(ri, maxEvo, rr);
    if (!pool.length) pool = wildPool(ri, 2, 9);
    return pool[Math.floor(rnd() * pool.length)];
  }
  function spawn() {
    if (chal) {
      const pa = chal.party, p = pa ? pa[chal.pi || 0] : null, dex = p ? p.dex : chal.dex, hp = p ? p.hp : chal.hp;
      F.enemy = { dex, hp, max: hp, boss: true, golden: false, tier: chal.tier, types: DEX[dex].types, stage: 0, chal: true, part: p ? { i: (chal.pi || 0) + 1, n: pa.length } : null };
      if (!p || !chal.pi) F.bossT = F.bossT0 = chal.time;
      F.timers = S.team.map((k, i) => 0.2 + i * 0.13); F.hits = [];
      emit('spawn', F.enemy);
      return;
    }
    const s = S.stage, boss = isBoss(s);
    const r = routeData(s);
    if (!boss && !F.trainer && s >= TRAINER_MIN_STAGE && S.kills <= 7 && rnd() < TRAINER_CHANCE) startTrainer(s);
    const dex = boss ? r.boss.dex : pickWild(s);
    const golden = !boss && !F.trainer && rnd() < goldenChance();
    const hp = enemyHp(s) * (golden ? 3 : 1);
    const tr = F.trainer ? { name: F.trainer.name, cls: F.trainer.cls, i: F.trainer.n - F.trainer.left + 1, n: F.trainer.n } : null;
    F.enemy = { dex, hp, max: hp, boss, golden, tier: boss ? r.boss.tier : 0, types: DEX[dex].types, stage: s, trainer: tr, aura: boss ? null : rollAura(s) };
    F.bossT = F.bossT0 = boss ? bossTime(s) : 0;
    F.timers = S.team.map((k, i) => 0.2 + i * 0.13);
    F.hits = [];
    emit('spawn', F.enemy);
  }
  function rollAura(s) {
    if (s < AURA.min || !(rnd() < Math.min(AURA.max, AURA.base + (s - AURA.min) * AURA.slope))) return null;
    const ids = Object.keys(AURAS), tw = ids.reduce((a, k) => a + AURAS[k].w, 0);
    let r = rnd() * tw, id = ids[0];
    for (const k of ids) { r -= AURAS[k].w; if (r < 0) { id = k; break; } }
    return { id, type: id === 'ward' ? Object.keys(TYPE_NAMES)[Math.floor(rnd() * Object.keys(TYPE_NAMES).length)] : null };
  }
  function resetFight() { F.enemy = null; F.respawn = 0.3; F.hits = []; F.timers = []; F.trainer = null; }
  // entrenadores: varios Pokémon seguidos; al derrotar al último dan un extra
  function startTrainer(s) {
    const types = ROUTES[routeIdx(s)].types, cands = TRAINER_CLASSES.filter(c => c.types.some(t => types.includes(t)));
    const cls = cands.length ? cands[Math.floor(rnd() * cands.length)] : TRAINER_CLASSES[TRAINER_CLASSES.length - 1], n = s >= 60 ? 3 : 2;
    F.trainer = { name: TRAINER_NAMES[Math.floor(rnd() * TRAINER_NAMES.length)], cls: _L(cls.es, cls.en), n, left: n };
    emit('trainerStart', F.trainer);
  }
  function trainerWin(s) {
    const t = F.trainer, coins = Math.ceil(killCoins(s) * t.n * 0.6);
    S.coins += coins; S.stats.coinsTotal += coins; S.stats.trainers++;
    const gems = rnd() < 0.15 ? 1 + Math.floor(s / 60) : 0;
    S.gems += gems;
    const tickets = rnd() < 0.15 ? (rnd() < 0.12 ? { super: 1 } : { poke: 1 }) : null;
    if (tickets) giveTickets(tickets);
    const item = rnd() < 0.03 ? dropItem(ITEM_DROPS[0]) : null;
    emit('trainerWin', { trainer: t, coins, gems, tickets, item });
    F.trainer = null;
  }

  function deal(dmg, crit, src, ef) {
    const e = F.enemy;
    if (!e || e.hp <= 0) return;
    if (e.aura) {
      if (e.aura.id === 'thick') dmg *= AURA.thick;
      else if (e.aura.id === 'ward' && src >= 0) { const m = S.mons[S.team[src]]; if (m && DEX[fdex(m)].types.includes(e.aura.type)) dmg *= AURA.ward; }
    }
    e.hp -= dmg;
    if (dmg > S.stats.bestHit) S.stats.bestHit = dmg;
    if (crit) S.stats.crits++;
    emit('hit', { dmg, crit, src, ef: ef || 1 });
    if (e.hp <= 0) kill();
  }
  function kill() {
    const e = F.enemy, s = e.stage;
    S.foes[e.dex] = (S.foes[e.dex] || 0) + 1;
    if (e.chal) return chalWin(e);
    const coins = killCoins(s) * (e.golden ? 5 : 1) * (e.aura ? AURA.coins : 1);
    S.coins += coins; S.stats.coinsTotal += coins; S.stats.kills++;
    let gems = e.golden ? 3 : 0, firstKill = false;
    if (e.golden) S.stats.goldens++;
    if (e.boss) {
      S.stats.bosses++;
      const t = BOSS_TIER[e.tier];
      if (!S.bossFirst[s]) { S.bossFirst[s] = 1; firstKill = true; gems += Math.round(t.gems * gemMult() * (1 + teamItemSum('gems'))); }
      else gems += Math.round((1 + e.tier) * gemMult() * (1 + teamItemSum('gems')));
      if (e.tier === 1) S.badges[s] = 1;
    }
    S.gems += gems;
    let tickets = null;
    if (e.boss) tickets = firstKill ? Object.assign({}, BOSS_TICKETS[e.tier]) : (rnd() < 0.5 ? { poke: 1 } : null);   // los tickets grandes solo la primera vez
    if (!e.boss && rnd() < catchChance() * (e.golden ? 10 : 1)) { tickets = rnd() < 0.1 ? { super: 1 } : { poke: 1 }; S.stats.catches++; }
    if (e.golden && rnd() < 0.3) tickets = Object.assign(tickets || {}, { super: ((tickets && tickets.super) || 0) + 1 });
    if (tickets) giveTickets(tickets);
    let item = null;
    if (e.boss && (firstKill || rnd() < 0.3)) item = dropItem(ITEM_DROPS[e.tier]);
    else if (rnd() < (e.golden ? 0.06 : 0.006)) item = dropItem(ITEM_DROPS[0]);
    let egg = null;
    if (e.boss && firstKill && EGG_BOSS[e.tier] !== undefined && EGG_BOSS[e.tier] !== null) egg = EGG_BOSS[e.tier];
    else if (!e.boss && rnd() < EGG_WILD_DROP * (e.golden ? 10 : 1)) { let r = rnd() * 100; egg = 0; for (let t = 0; t < EGG_WILD_TIER.length; t++) { r -= EGG_WILD_TIER[t]; if (r < 0) { egg = t; break; } } }
    if (egg !== null) giveEgg(egg);
    eggProgress(e.boss ? 5 : e.golden ? 3 : 1);
    if (curEv && e.types.includes(curEv.type)) S.event.kills++;
    emit('kill', { enemy: e, coins, gems, tickets, item, egg });
    F.enemy = null; F.respawn = 0.45; F.hits = [];
    if (e.trainer && F.trainer && --F.trainer.left <= 0) trainerWin(s);
    if (e.boss) { delete S.bossFails[s]; advance(true); emit('bossWin', e); }
    else {
      S.kills++;
      if (S.kills >= 10 && S.auto) { if (isBoss(S.stage + 1) && bossReady(S.stage + 1) < K.gate) { S.auto = false; S.retryT = 0; emit('bossWait', S.stage + 1); } else advance(false); }
    }
  }
  const trackBiome = () => { const b = routeData(S.stage).biome; if (!S.ui.biomes[b]) S.ui.biomes[b] = 1; };
  function advance(force) {
    if (!force && S.stage >= S.maxStage && S.kills < 10) return;
    S.stage++; S.kills = 0; S.stats.stages++;
    if (S.stage > S.maxStage) { S.maxStage = S.stage; S.stats.maxStage = Math.max(S.stats.maxStage, S.maxStage); }
    if (!S.auto && !force) S.auto = true;
    F.enemy = null; F.respawn = 0.6; F.trainer = null; trackBiome();
    for (const e of RIVAL_ENC) if (e.stage === S.stats.maxStage && !S.rival.won[e.id] && !S.rival.told[e.id]) { S.rival.told[e.id] = 1; emit('rivalReady', e); }
    emit('stage', S.stage);
  }
  function goStage(s) {
    if (chal || s < 1 || s > S.maxStage) return;
    S.stage = s; S.kills = 0; S.retryT = 0; F.enemy = null; F.respawn = 0.3; F.trainer = null; trackBiome();
    if (s >= S.maxStage) S.auto = true;           // al volver a la etapa más alta, el juego sigue avanzando solo
    emit('stage', S.stage);
  }
  function bossFail() {
    S.bossFails[S.stage] = (S.bossFails[S.stage] || 0) + 1;
    S.retryT = 0;
    S.stage = Math.max(1, S.stage - 1); S.kills = 10; S.auto = false;
    F.enemy = null; F.respawn = 0.6; F.trainer = null;
    emit('bossFail'); emit('stage', S.stage);
  }
  function fightBoss() { if (!chal && !isBoss(S.stage) && S.kills >= 10) { S.auto = true; advance(true); } }

  function tap(auto) {
    const e = F.enemy;
    if (!e || e.hp <= 0) return null;
    if (!auto) S.stats.taps++;
    const crit = rnd() < critChance();
    const dmg = tapDmg() * (crit ? critMult() : 1) * bossBonus(e);
    deal(dmg, crit, -1);
    return { dmg, crit };
  }

  function tick(dt) {
    if (!S || !S.started || paused) return;
    S.stats.time += dt;
    evT += dt; if (evT > 20) { evT = 0; refreshEvent(); if (checkDaily()) emit('newDay'); }
    histT += dt; if (histT >= HIST_STEP) { histT = 0; sample(); }
    if (S.retryT >= 0 && !S.auto) { S.retryT += dt; if (S.settings.autoBoss && S.kills >= 10 && !isBoss(S.stage) && isBoss(S.stage + 1) && S.retryT >= 12 && (bossReady(S.stage + 1) >= K.ready || S.retryT >= K.retryMax)) fightBoss(); }
    if (S.up.autotap) { S.autoAcc += dt * 0.5 * S.up.autotap; while (S.autoAcc >= 1) { S.autoAcc -= 1; if (F.enemy) tap(true); } }
    if (!F.enemy) { F.respawn -= dt; if (F.respawn <= 0) spawn(); return; }
    const e = F.enemy;
    if (e.aura && e.aura.id === 'regen' && e.hp > 0) e.hp = Math.min(e.max, e.hp + e.max * AURA.regen * dt);
    if (e.boss) { F.bossT -= dt; if (F.bossT <= 0 && e.hp > 0) { if (e.chal) chalFail(); else bossFail(); return; } }
    for (let i = 0; i < S.team.length; i++) {
      const m = S.mons[S.team[i]];
      if (F.timers[i] === undefined) F.timers[i] = 0.3;
      F.timers[i] -= dt;
      if (F.timers[i] <= 0) {
        F.timers[i] += monRate(m);
        const crit = rnd() < critChance(m);
        const ef = eff(fdex(m), e.types);
        let dmg = monDmg(m) * ef * (crit ? critMult() : 1) * (0.9 + rnd() * 0.2) * bossBonus(e, m);
        const it = itemOf(m), fx = it ? HELD[it.id].fx : '';
        if (fx === 'se' && ef >= 2) dmg *= 1 + itemVal(it);
        else if (fx === 'finish' && e.hp < e.max * 0.3) dmg *= 1 + itemVal(it);
        else if (fx === 'open' && e.boss && F.bossT0 - F.bossT < 10) dmg *= 1 + itemVal(it);
        F.hits.push({ t: 0.22, dmg, crit, slot: i, eff: ef });
        if (fx === 'twice' && rnd() < itemVal(it)) F.hits.push({ t: 0.36, dmg, crit, slot: i, eff: ef });
        emit('fire', { slot: i, dex: fdex(m), delay: 0.22, move: moveOf(m), tier: tierOf(m.lvl) });
      }
    }
    for (let j = F.hits.length - 1; j >= 0; j--) {
      const h = F.hits[j];
      h.t -= dt;
      if (h.t <= 0) { F.hits.splice(j, 1); deal(h.dmg, h.crit, h.slot, h.eff); if (!F.enemy) break; }
    }
  }

  function dropItem(table) {
    let r = rnd() * 100, rar = 1;
    for (let k = 0; k < 3; k++) { r -= table[k]; if (r < 0) { rar = k + 1; break; } }
    const ids = Object.keys(HELD).filter(k => !HELD[k].excl), id = ids[Math.floor(rnd() * ids.length)];
    const it = { u: S.uid++, id, rar };
    if (id === 'orbe') { const ts = Object.keys(TYPE_NAMES); it.type = ts[Math.floor(rnd() * ts.length)]; }
    S.inv.push(it); invDirty = true; S.stats.itemsFound++;
    emit('item', it);
    return it;
  }
  function equip(key, u) {
    const m = S.mons[key]; if (!m || !invLookup(u)) return false;
    for (const o of Object.values(S.mons)) if (o.item === u) o.item = null;
    m.item = u; return true;
  }
  function unequip(key) { const m = S.mons[key]; if (m) m.item = null; }
  function recycleItem(u) {
    const it = invLookup(u); if (!it) return 0;
    for (const o of Object.values(S.mons)) if (o.item === u) o.item = null;
    S.inv = S.inv.filter(i => i.u !== u); invDirty = true;
    return gainDust(ITEM_RAR[it.rar].dust);
  }
  function recycleSpare() { // reciclar todos los comunes que nadie lleva
    const worn = new Set(Object.values(S.mons).map(m => m.item)); let n = 0, d = 0;
    for (const it of S.inv.slice()) if (it.rar === 1 && !worn.has(it.u)) { d += recycleItem(it.u); n++; }
    return { n, d };
  }
  function buyItem() {
    const c = dc(ITEM_DUST_COST); if (S.coins < c) return null;
    S.coins -= c; return dropItem([60, 32, 8]);
  }
  function giveTickets(t) { for (const k of Object.keys(t)) S.tk[k] = (S.tk[k] || 0) + t[k]; emit('tickets', t); }

  // ---------------- habilidades ----------------
  const skillReady = id => S.sk[id] <= S.stats.time;
  function useSkill(id) {
    const k = SKILLS[id];
    if (!k || !skillReady(id)) return false;
    S.skOn[id] = S.stats.time + k.dur + 2 * S.shop.skill; S.sk[id] = S.stats.time + k.cd * (1 - 0.04 * S.shop.skill); S.stats.skills++;
    emit('skill', id);
    return true;
  }

  // ---------------- megaevolución ----------------
  const megaForms = m => MEGA_BY_BASE[m.dex] || [];
  const megaCost = m => MEGA_COST[RAR[m.dex]];
  const megaCan = (m, form) => !m.megas.includes(form) && m.lvl >= MEGA_LV && S.shards >= megaCost(m);
  function megaUnlock(key, form) {
    const m = S.mons[key];
    if (!m || !megaForms(m).some(e => e.form === form) || !megaCan(m, form)) return false;
    S.shards -= megaCost(m); m.megas.push(form); S.stats.megas++;
    megaSet(key, form);
    emit('mega', { key, from: m.dex, to: fdex(m) });
    return true;
  }
  // activa una forma (o la desactiva con null); solo MEGA_ACTIVE Pokémon a la vez
  function megaSet(key, form) {
    const m = S.mons[key];
    if (!m || (form && !m.megas.includes(form))) return false;
    if (form) { const act = Object.values(S.mons).filter(o => o.mf && o !== m); while (act.length >= MEGA_ACTIVE) act.shift().mf = null; }
    m.mf = form || null;
    return true;
  }

  // ---------------- Pokémon ----------------
  function addMon(base, shiny, floor, bred) {
    let m = S.mons[base], isNew = false, dust = 0, newShiny = false, ivUp = null;
    const rar = RAR[base];
    floor = floor || 0;
    if (!m) { m = S.mons[base] = { dex: base, lvl: 1 + 2 * S.shop.lvl, stars: 0, copies: 0, shiny: !!shiny, shinyOwned: !!shiny, megas: [], mf: null, nat: bred ? bred.nat : Math.floor(rnd() * NATURES.length), iv: bred ? Object.assign({}, bred.iv) : rollIv(floor) }; isNew = true; }
    else {
      m.copies++;
      const cand = bred ? null : rollIv(floor);             // cada copia repetida tira unos IVs nuevos y te quedas con los mejores
      if (cand && cand.d + cand.s + cand.c > ivSum(m)) { ivUp = { from: ivPct(m), to: (cand.d + cand.s + cand.c) / (3 * IV_MAX) }; m.iv = cand; S.stats.ivUps++; }
      dust = gainDust(Math.round(DUST_GAIN[rar] * (shiny ? 2 : 1)));                 // repetido: monedas
      if (shiny && !m.shinyOwned) { m.shinyOwned = true; m.shiny = true; newShiny = true; }
    }
    if (shiny) S.stats.shinies++;
    S.seen[base] = 1;
    if (isNew && S.team.length < S.slots) S.team.push(String(base));
    return { base, dex: m.dex, isNew, shiny: !!shiny, newShiny: newShiny || (isNew && !!shiny), rar, dust, ivUp, nat: m.nat, grade: ivGrade(m) };
  }
  function toggleShiny(key) { const m = S.mons[key]; if (!m || !m.shinyOwned) return false; m.shiny = !m.shiny; return true; }
  function levelUp(key, n) {
    const m = S.mons[key];
    if (n === 'max') n = maxAffordable(m).n;
    if (!n) return false;
    const c = levelCostN(m, n);
    if (c > S.coins) return false;
    const t0 = tierOf(m.lvl), mv0 = moveOf(m);
    S.coins -= c; m.lvl += n; S.stats.levels += n;
    if (tierOf(m.lvl) > t0) emit('moveLearn', { key, dex: m.dex, from: mv0, to: moveOf(m), tier: tierOf(m.lvl) });
    checkEvo(key);
    return true;
  }
  function checkEvo(key) {
    const m = S.mons[key];
    const st = stageOf(m.dex), kids = CHILDREN[m.dex];
    if (kids && kids.length && st < EVO_LVL.length && m.lvl >= EVO_LVL[st]) {
      const from = m.dex, fresh = kids.filter(k => !S.seen[k] && !S.foes[k]), pool = fresh.length ? fresh : kids, to = pool[Math.floor(rnd() * pool.length)];
      m.dex = to; m.mf = null; m.megas = []; S.seen[to] = 1; S.stats.evolutions++;
      emit('evolve', { key, from, to });
      checkEvo(key);
    }
  }
  function starUp(key) {
    const m = S.mons[key];
    if (m.stars >= 5 || m.copies < STAR_COPIES[m.stars]) return false;
    m.copies -= STAR_COPIES[m.stars]; m.stars++;
    S.stats.maxStars = Math.max(S.stats.maxStars || 0, m.stars);
    return true;
  }
  function setTeam(slot, key) {
    key = String(key);
    if (slot >= S.slots || !S.mons[key]) return;
    const at = S.team.indexOf(key);
    if (at >= 0) { if (slot < S.team.length) S.team[at] = S.team[slot]; else S.team.splice(at, 1); }
    if (slot < S.team.length) S.team[slot] = key; else S.team.push(key);
    S.team = S.team.filter((k, i, a) => k && a.indexOf(k) === i);
    F.timers = S.team.map(() => 0.3);
  }
  function setTeamList(keys) { S.team = keys.slice(0, S.slots); F.timers = S.team.map(() => 0.3); }
  // equipos guardados: se guardan las especies, así que sobreviven a la Liga y a las evoluciones
  function savePreset(i) { const p = S.presets[i]; if (!p || !S.team.length) return false; p.team = S.team.slice(); return true; }
  function loadPreset(i) {
    const p = S.presets[i]; if (!p || !p.team.length) return null;
    const keys = p.team.filter((k, j, a) => S.mons[k] && a.indexOf(k) === j);
    if (!keys.length) return null;
    const lost = p.team.length - keys.length, cut = Math.max(0, keys.length - S.slots);
    setTeamList(keys);
    return { lost, cut };
  }
  function renamePreset(i, name) { const p = S.presets[i]; if (p) p.name = String(name).trim().slice(0, 16) || 'Equipo ' + (i + 1); }
  function unsetTeam(slot) { if (S.team.length > 1 && S.team[slot]) { S.team.splice(slot, 1); F.timers = S.team.map(() => 0.3); return true; } return false; }
  function buySlot() {
    if (S.slots >= 6) return false;
    const c = SLOT_COST[S.slots];
    if (S.coins < c) return false;
    S.coins -= c; S.slots++;
    return true;
  }
  // comprar varios niveles de una mejora de golpe: n = 1, 10, 25 o 'max' (todos los que alcance el dinero)
  function upPlan(id, n) {
    const u = UPGRADES[id], lvl = S.up[id], limit = n === 'max' ? 1000 : Math.max(1, +n || 1);
    let k = 0, c = 0, left = S.coins;
    while (k < limit && lvl + k < u.max) {
      const cc = Math.ceil(u.base * Math.pow(u.mul, lvl + k));
      if (n === 'max' && cc > left) break;
      c += cc; left -= cc; k++;
    }
    return { n: k, c };
  }
  function buyUpN(id, n) {
    const p = upPlan(id, n);
    if (!p.n || S.coins < p.c) return 0;
    S.coins -= p.c; S.up[id] += p.n;
    return p.n;
  }
  function buyUp(id) {
    const u = UPGRADES[id];
    if (S.up[id] >= u.max) return false;
    const c = upCost(id);
    if (S.coins < c) return false;
    S.coins -= c; S.up[id]++;
    return true;
  }
  function buyShop(id) {
    const u = LEAGUE_SHOP[id];
    if (S.shop[id] >= u.max) return false;
    const c = shopCost(id);
    if (S.mp < c) return false;
    S.mp -= c; S.shop[id]++;
    return true;
  }

  // ---------------- retos: jefe del evento y Torre de batalla ----------------
  // Un reto sustituye al combate normal: un solo enemigo con vida y tiempo fijos. No se guarda: si recargas, se pierde el intento.
  const chalBase = () => { let s = Math.max(10, S.maxStage); if (isBoss(s)) s--; return enemyHp(s); };
  const chalTime = t => t + 3 * S.up.bosstime + 2 * S.shop.bt + teamItemSum('time');
  const towerUnlocked = () => S.stats.maxStage >= TOWER_UNLOCK;
  const towerTypeOf = f => EVENT_TYPES[(f - 1) % EVENT_TYPES.length];
  function towerSpec(f) {
    const boss = f % 5 === 0, type = towerTypeOf(f);
    let list = POKEDEX.filter(p => p.types.includes(type) && (boss ? !CHILDREN[p.dex] && bst(p.dex) >= 450 : !p.leg && (!CHILDREN[p.dex] || stageOf(p.dex) >= 1) )).sort((a, b) => a.dex - b.dex);
    if (boss) list = list.sort((a, b) => bst(b.dex) - bst(a.dex)).slice(0, 10);
    if (!list.length) list = POKEDEX.filter(p => p.types.includes(type));
    const pick = list[(boss ? Math.floor(f / 5) : f * 7919) % list.length];
    let rule = boss ? Object.assign({}, TOWER_RULES[(f / 5 - 1) % TOWER_RULES.length]) : null;
    if (rule && rule.id === 'only') rule.only = type;
    const hp = chalBase() * TOWER_HP0 * Math.pow(TOWER_G, f - 1) * (boss ? TOWER_BOSS_X : 1) * (rule && rule.hp || 1);
    const time = chalTime(TOWER_TIME) * (rule && rule.time || 1);
    return { kind: 'tower', floor: f, dex: pick.dex, hp, time, rule, type, boss, tier: f < 10 ? (boss ? 2 : 1) : f < 30 ? 3 : f < 60 ? 4 : 5, label: _L('Torre · Piso ', 'Tower · Floor ') + f };
  }
  function eventSpec(tier) {
    const T = EVENT_TIERS[tier];
    return { kind: 'event', tier: 2 + tier, dex: curEv.boss, hp: chalBase() * T.hp, time: chalTime(T.time), rule: null, type: curEv.type, boss: true, evTier: tier, label: _L('Evento · Jefe ' + T.name.toLowerCase(), 'Event · ' + T.name + ' boss') };
  }
  // poder del equipo contra el reto (≥1: lo vence a tiempo)
  function chalReady(spec) {
    const prev = chal; chal = spec;
    try {
      if (spec.party) { let need = 0.8 * spec.party.length; for (const p of spec.party) need += p.hp / Math.max(1e-9, teamDps(DEX[p.dex].types)); return spec.time / need; }
      return teamDps(DEX[spec.dex].types) * spec.time / spec.hp;
    } finally { chal = prev; }
  }
  const towerStarts = () => { const out = []; for (let c = 1; c - 1 <= S.tower.best; c += 5) out.push(c); return out; };
  function startChal(spec) {
    if (chal || !S.started || !S.team.length) return false;
    chal = spec; F.enemy = null; F.respawn = 0.8; F.hits = []; F.timers = []; F.trainer = null;
    emit('chalStart', spec);
    return true;
  }
  function startTower(f) { return towerUnlocked() && towerStarts().includes(f) && startChal(towerSpec(f)); }
  function startEvent(tier) { return towerUnlocked() && !!EVENT_TIERS[tier] && startChal(eventSpec(tier)); }
  function endChal(info) { const c = chal; chal = null; F.enemy = null; F.respawn = 0.8; F.hits = []; emit('chalEnd', Object.assign({ kind: c && c.kind }, info)); }
  function abortChal() { if (chal) endChal({ aborted: true }); }
  function giveReward(r) {
    if (!r) return;
    if (r.gems) S.gems += r.gems;
    if (r.dust) r.coins = gainDust(r.dust);
    if (r.shards) S.shards += r.shards;
    if (r.tk) giveTickets(r.tk);
    if (r.egg !== undefined) giveEgg(r.egg);
    if (r.item) dropItem(r.item);
    if (r.ess) S.asc.ess += r.ess;
    if (r.excl) { const ids = Object.keys(HELD).filter(k => HELD[k].excl), it = { u: S.uid++, id: ids[Math.floor(rnd() * ids.length)], rar: 3 }; S.inv.push(it); invDirty = true; S.stats.itemsFound++; emit('item', it); }
  }
  function towerReward(f) {
    const r = { gems: 3 + Math.floor(f / 2), dust: 5 + 2 * f };
    if (f % 5 === 0) r.shards = 1 + (f >= 50 ? 1 : 0) + (f >= 100 ? 1 : 0);
    if (f % 5 === 0) r.tk = f <= 10 ? { super: 1 } : f <= 25 ? { super: 2 } : f <= 50 ? { ultra: 1 } : f <= 100 ? { ultra: 2 } : f % 10 === 0 ? { master: 1 } : { ultra: 2 };
    if (f % 10 === 0) r.egg = f <= 20 ? 1 : f < 60 ? 2 : 3;
    return r;
  }
  function chalWin(e) {
    const c = chal;
    if (c.party && (c.pi || 0) < c.party.length - 1) {      // quedan Pokémon del rival
      c.pi = (c.pi || 0) + 1;
      emit('kill', { enemy: e, coins: 0, gems: 0, tickets: null, item: null, egg: null, chal: true, part: true });
      F.enemy = null; F.hits = []; F.respawn = 0.8;
      return;
    }
    emit('kill', { enemy: e, coins: 0, gems: 0, tickets: null, item: null, egg: null, chal: true });
    F.enemy = null; F.hits = []; F.respawn = 1.4;
    if (c.kind === 'tower') {
      const first = c.floor > S.tower.best;
      let rew = null;
      if (first) { S.tower.best = c.floor; rew = towerReward(c.floor); giveReward(rew); }
      emit('chalWin', { kind: 'tower', floor: c.floor, first, rew });
      chal = towerSpec(c.floor + 1);                    // la Torre sigue hasta que caigas
    } else if (c.kind === 'rival' && c.master) {
      const first = c.master > S.rival.master;
      let rew = null;
      if (first) { S.rival.master = c.master; S.stats.rivalMaster = c.master; rew = masterReward(c.master); giveReward(rew); }
      emit('chalWin', { kind: 'rival', id: 'master', master: c.master, enc: c.enc, first, rew });
      endChal({ won: true });
    } else if (c.kind === 'rival') {
      const e = c.enc, first = !S.rival.won[c.id];
      let rew = null;
      if (first) { S.rival.won[c.id] = 1; S.stats.rivals = rivalWins(); rew = rivalReward(e); giveReward(rew); }
      else if (S.rival.rem[c.id] !== dayIndex()) { S.rival.rem[c.id] = dayIndex(); rew = { gems: 5 + 2 * e.region, dust: 10 + 4 * e.region }; giveReward(rew); }
      emit('chalWin', { kind: 'rival', id: c.id, enc: e, first, rew });
      endChal({ won: true });
    } else {
      const first = !S.event.tiers[c.evTier], rew = first ? EVENT_TIERS[c.evTier].rew : null;
      if (first) { S.event.tiers[c.evTier] = 1; S.stats.eventTiers++; giveReward(rew); }
      emit('chalWin', { kind: 'event', tier: c.evTier, first, rew });
      endChal({ won: true });
    }
  }
  function chalFail() {
    const c = chal;
    emit('chalFail', { kind: c.kind, floor: c.floor, tier: c.evTier, best: S.tower.best, id: c.id, enc: c.enc });
    endChal({ won: false });
  }
  function claimEventTask(i) {
    const t = EVENT_TASKS[i];
    if (!t || S.event.claimed[t.id] || S.event[t.stat] < t.goal) return false;
    S.event.claimed[t.id] = 1; giveReward(t.rew); return true;
  }
  // ---------------- el rival: Nico ----------------
  const rivalCache = {};
  const masterCache = {};
  function masterTeam(t) {
    const types = RIVAL_TYPES[(t - 1) % RIVAL_TYPES.length], used = new Set(), out = [], k = Math.floor((t - 1) / RIVAL_TYPES.length);
    for (const ty of types) {
      const c = POKEDEX.filter(p => !p.leg && p.types.includes(ty) && !used.has(p.dex)).sort((a, b) => bst(b.dex) - bst(a.dex) || a.dex - b.dex);
      const pick = c[k % Math.min(6, c.length)]; used.add(pick.dex); out.push(pick.dex);
    }
    return out;
  }
  function rivalTeam(e) {
    if (e.master) return masterCache[e.master] || (masterCache[e.master] = masterTeam(e.master));
    if (rivalCache[e.id]) return rivalCache[e.id];
    const g = REGIONS[e.region].gen, used = new Set(), out = [];
    for (const t of e.types) {
      let c = POKEDEX.filter(p => !p.leg && p.types.includes(t) && (!g || p.gen === g) && !used.has(p.dex) && (e.meet || stageOf(p.dex) >= 1 || !CHILDREN[p.dex]));
      if (!c.length) c = POKEDEX.filter(p => !p.leg && p.types.includes(t) && !used.has(p.dex));
      c.sort((a, b) => bst(b.dex) - bst(a.dex) || a.dex - b.dex);
      const pick = c[e.meet ? 0 : Math.min(c.length - 1, 2)];
      used.add(pick.dex); out.push(pick.dex);
    }
    return (rivalCache[e.id] = out);
  }
  const rivalOpen = e => S.stats.maxStage >= e.stage;
  const rivalNext = () => RIVAL_ENC.find(e => !S.rival.won[e.id]) || null;
  const masterOpen = () => rivalWins() >= RIVAL_ENC.length;
  function masterSpec(t) {
    const e = masterEnc(t), team = rivalTeam(e), base = enemyHp(Math.max(100, S.stats.maxStage)) * e.hp;
    return { kind: 'rival', id: 'master', master: t, enc: e, dex: team[0], party: team.map((d, i) => ({ dex: d, hp: base * RIVAL_SPLIT[i] })), pi: 0, hp: base, time: chalTime(e.time), rule: null, type: e.types[0], boss: true, tier: 5,
      label: RIVAL_NAME + ' · ' + _L('Maestro ', 'Master ') + t };
  }
  function startMaster() { return masterOpen() && towerUnlocked() && startChal(masterSpec(S.rival.master + 1)); }
  function rivalSpec(id) {
    if (id === 'master') return masterSpec(S.rival.master + 1);
    const e = RIVAL_ENC.find(x => x.id === id); if (!e) return null;
    const base = enemyHp(e.stage) * e.hp, team = rivalTeam(e);
    return { kind: 'rival', id, enc: e, dex: team[0], party: team.map((d, i) => ({ dex: d, hp: base * RIVAL_SPLIT[i] })), pi: 0, hp: base, time: chalTime(e.time), rule: null, type: e.types[0], boss: true, tier: 2 + e.meet,
      label: RIVAL_NAME + ' · ' + REGIONS[e.region].name + (e.meet ? ' II' : ' I') };
  }
  function startRival(id) { const e = RIVAL_ENC.find(x => x.id === id); return !!e && towerUnlocked() && rivalOpen(e) && startChal(rivalSpec(id)); }

  // ---------------- objetos: fusión y taller ----------------
  const wornSet = () => new Set(Object.values(S.mons).map(m => m.item));
  function fuseGroups() {
    const worn = wornSet(), g = {};
    for (const it of S.inv) if (!worn.has(it.u) && it.rar < 3) (g[it.id + ':' + it.rar + ':' + (it.type || '')] = g[it.id + ':' + it.rar + ':' + (it.type || '')] || []).push(it);
    return Object.values(g).filter(a => a.length >= 3).map(a => ({ id: a[0].id, rar: a[0].rar, type: a[0].type || '', n: a.length, cost: dc(ITEM_FUSE_COST[a[0].rar]) }));
  }
  function fuseItem(id, rar, type) {
    const cost = dc(ITEM_FUSE_COST[rar] || 0); if (!HELD[id] || !(rar >= 1 && rar < 3) || S.coins < cost) return null;
    const worn = wornSet(), pool = S.inv.filter(it => it.id === id && it.rar === rar && (it.type || '') === (type || '') && !worn.has(it.u));
    if (pool.length < 3) return null;
    const rm = new Set(pool.slice(0, 3).map(i => i.u));
    S.inv = S.inv.filter(i => !rm.has(i.u)); S.coins -= cost; S.stats.fusions++;
    const it = { u: S.uid++, id, rar: rar + 1 }; if (id === 'orbe') it.type = type || 'normal';
    S.inv.push(it); invDirty = true; S.stats.itemsFound++;
    emit('item', it);
    return it;
  }
  function craftItem(id, type) {
    const cc = dc(ITEM_CRAFT_COST); if (!HELD[id] || S.coins < cc) return null;
    S.coins -= cc;
    const it = { u: S.uid++, id, rar: 1 }; if (id === 'orbe') it.type = TYPE_NAMES[type] ? type : 'normal';
    S.inv.push(it); invDirty = true; S.stats.itemsFound++;
    emit('item', it);
    return it;
  }

  // ---------------- sala de música, bestiario y Pokédex ----------------
  function musicUnlocked(t) {
    const q = t.req; if (!q) return true;
    if (q.stage) return S.stats.maxStage >= q.stage;
    if (q.bosses) return S.stats.bosses >= q.bosses;
    if (q.rival) return rivalWins() >= q.rival;
    if (q.trainers) return S.stats.trainers >= q.trainers;
    if (q.tower) return S.tower.best >= q.tower;
    if (q.event) return S.stats.eventTiers >= q.event;
    if (q.prestige) return S.stats.prestiges >= q.prestige;
    if (q.hatched) return S.stats.hatched >= q.hatched;
    return false;
  }
  // ---------------- perfil: nombre, avatar y títulos ----------------
  const titleOpen = t => { try { return !!t.test(S); } catch (e) { return false; } };
  const titlesOpen = () => TITLES.filter(titleOpen);
  function setTitle(id) { const t = TITLES.find(x => x.id === id); if (!t || !titleOpen(t)) return false; S.profile.title = id; return true; }
  function setAvatar(dex) { if (!DEX[dex] || !S.mons[String(baseOf(dex))]) return false; S.profile.avatar = +dex; return true; }
  function setName(n) { S.profile.name = String(n || '').replace(/[<>&"]/g, '').trim().slice(0, 14); }
  const toggleFav = d => { if (S.favs[d]) delete S.favs[d]; else S.favs[d] = 1; return !!S.favs[d]; };

  // ---------------- cosméticos ----------------
  const frameOpen = f => { try { return !!f.test(S); } catch (e) { return false; } };
  const framesOpen = () => FRAMES.filter(frameOpen);
  function setFrame(id) { const f = FRAMES.find(x => x.id === id); if (!f || !frameOpen(f)) return false; S.cosm.frame = id; return true; }
  const biomesSeen = () => Object.keys(S.ui.biomes).map(Number).filter(i => Tiles.THEMES[i]).sort((a, b) => a - b);
  function setBg(v) { if (v !== 'auto' && !S.ui.biomes[v]) return false; S.cosm.bg = v === 'auto' ? 'auto' : String(v); return true; }
  const biomeOverride = () => (S.cosm.bg !== 'auto' && S.ui.biomes[S.cosm.bg] ? +S.cosm.bg : null);

  // ---------------- consejos de novedades (una sola vez cada uno) ----------------
  function nextTip() {
    if (!S.started || !S.tutDone || S.settings.tips === false) return null;
    return TIPS.find(t => !S.ui.tips[t.id] && t.when(S)) || null;
  }
  function seenTip(id) { S.ui.tips[id] = 1; }
  function resetTips() { S.ui.tips = {}; }

  // ---------------- resumen al volver ----------------
  // Foto de contadores: al volver se compara con la de la visita anterior
  function snap() {
    return { maxStage: S.stats.maxStage, bosses: S.stats.bosses, dex: dexCount(), mons: Object.keys(S.mons).length, shinies: S.stats.shinies, hatched: S.stats.hatched, medals: S.medals, ess: S.asc.ess, rank: S.asc.rank, tower: S.tower.best,
      rivals: rivalWins(), master: S.rival.master, trainers: S.stats.trainers, levels: S.stats.levels, kills: S.stats.kills, ach: Object.keys(S.ach).length, items: S.stats.itemsFound, evolutions: S.stats.evolutions, pulls: S.stats.pulls, time: Math.floor(S.stats.time), titles: titlesOpen().length, frames: framesOpen().length, tracks: tracksUnlocked(), week: S.event.week };
  }
  function recap() {
    const now = snap(), old = S.ui.snap;
    S.ui.snap = now;
    if (!old) return null;
    const d = k => (now[k] || 0) - (old[k] || 0);
    const rows = [['maxStage', _L('Etapa máxima', 'Max stage')], ['bosses', _L('Jefes vencidos', 'Bosses beaten')], ['trainers', _L('Entrenadores vencidos', 'Trainers beaten')], ['dex', _L('Pokémon registrados', 'Pokémon registered')], ['shinies', 'Shinies'], ['hatched', _L('Huevos eclosionados', 'Eggs hatched')], ['evolutions', _L('Evoluciones', 'Evolutions')], ['levels', _L('Niveles subidos', 'Levels gained')], ['medals', _L('Medallas', 'Medals')], ['ess', _L('Esencia', 'Essence')], ['rank', _L('Rango', 'Rank')], ['tower', _L('Pisos de la Torre', 'Tower floors')], ['rivals', _L('Duelos de Nico', 'Duels vs Nico')], ['master', _L('Niveles maestros', 'Master levels')], ['ach', _L('Logros', 'Achievements')], ['items', _L('Objetos', 'Items')], ['titles', _L('Títulos', 'Titles')], ['frames', _L('Marcos', 'Frames')], ['tracks', _L('Pistas de música', 'Music tracks')]]
      .map(([k, name]) => ({ k, name, v: d(k) })).filter(r => r.v > 0);
    return { rows, kills: d('kills'), time: d('time'), weekChanged: old.week !== undefined && old.week !== now.week };
  }

  // ---------------- consejos: «¿qué hago ahora?» ----------------
  // Devuelve, por prioridad, lo más útil que puedes hacer en este momento: { p, icon, tab, text }
  function advice() {
    const out = [], add = (p, icon, tab, text) => out.push({ p, icon, tab, text });
    if (!S.started) return out;
    const best = S.team.map(k => S.mons[k]).filter(Boolean);
    if (!S.daily.claimed) add(1, 'gem', 'quests', _L('Recoge la recompensa diaria.', 'Claim your daily reward.'));
    const pr = pendingRewards();
    if (pr) add(2, 'trophy', 'quests', _L(`Tienes ${pr} recompensa${pr > 1 ? 's' : ''} de misiones o logros por recoger.`, `You have ${pr} quest or achievement reward${pr > 1 ? 's' : ''} to claim.`));
    if (eggsReady()) add(2, 'egg0', 'gacha', _L(`Tienes ${eggsReady()} huevo${eggsReady() > 1 ? 's' : ''} listo${eggsReady() > 1 ? 's' : ''} para eclosionar.`, `You have ${eggsReady()} egg${eggsReady() > 1 ? 's' : ''} ready to hatch.`));
    if (freePullReady()) add(3, 'ball', 'gacha', _L('Tienes una tirada diaria gratis.', 'You have a free daily pull.'));
    if (best.length < S.slots) add(2, 'friends', 'team', _L('Tienes huecos de equipo libres: pon a combatir a más Pokémon.', 'You have free team slots: put more Pokémon to fight.'));
    if (S.slots < 6 && S.coins >= SLOT_COST[S.slots]) add(3, 'friends', 'team', _L('Puedes desbloquear otro hueco de equipo.', 'You can unlock another team slot.'));
    const waiting = !S.auto && S.kills >= 10 && !isBoss(S.stage) && isBoss(S.stage + 1);
    if (waiting) {
      const rd = bossReady(S.stage + 1);
      if (rd < 0.95) {
        add(2, 'fist', 'team', _L(`Tu equipo tiene el ${Math.round(rd * 100)}% del poder para el próximo jefe: sube de nivel, usa «Mejor equipo» o prueba la táctica Ofensiva.`, `Your team has ${Math.round(rd * 100)}% of the power needed for the next boss: level up, use “Best team” or try the Offensive tactic.`));
        if (maxAffordable(S.mons[S.team[0]] || { dex: 1, lvl: 1 }).n > 0 && best.length) add(1, 'up', 'team', _L('Tienes monedas para subir niveles ahora mismo.', 'You have coins to level up right now.'));
      } else add(1, 'crown', 'team', _L('Tu equipo está listo para el jefe: ¡púlsalo!', 'Your team is ready for the boss: challenge it!'));
    } else if (best.length) {
      const m = best.slice().sort((a, b) => levelCost(a, a.lvl) - levelCost(b, b.lvl))[0];
      if (m && S.coins >= levelCost(m, m.lvl) * 5) add(4, 'up', 'team', _L('Tienes monedas de sobra: sube de nivel a tus Pokémon.', 'You have coins to spare: level up your Pokémon.'));
    }
    if (S.tk.poke + S.tk.super + S.tk.ultra + S.tk.master >= 10) add(4, 'ticket', 'gacha', _L('Tienes muchos tickets sin usar: abre Poké Balls.', 'You have lots of unused tickets: open Poké Balls.'));
    const nx = rivalNext();
    if (nx && rivalOpen(nx) && towerUnlocked()) add(3, 'crown', 'chal', _L(`Nico te espera en ${REGIONS[nx.region].name}: acepta el duelo.`, `Nico is waiting in ${REGIONS[nx.region].name}: accept the duel.`));
    else if (!nx && masterOpen() && towerUnlocked() && chalReady(masterSpec(S.rival.master + 1)) >= 0.9) add(3, 'crown', 'chal', _L(`Puedes con el Duelo Maestro ${S.rival.master + 1}.`, `You can take Master Duel ${S.rival.master + 1}.`));
    if (towerUnlocked()) {
      if (chalReady(towerSpec(S.tower.best + 1)) >= 1.1) add(4, 'crown', 'chal', _L(`La Torre está a tu alcance: puedes superar el piso ${S.tower.best + 1}.`, `The Tower is within reach: you can clear floor ${S.tower.best + 1}.`));
    }
    if (fuseGroups().length) add(4, 'candy', 'team', _L('Tienes objetos iguales que puedes fusionar (Mochila).', 'You have identical items you can fuse (Bag).'));
    const free = Object.values(S.mons).filter(m => !m.item).length, worn = wornSet(), spare = S.inv.filter(it => !worn.has(it.u)).length;
    if (best.some(m => !m.item) && spare) add(3, 'choiceband', 'team', _L('Tienes objetos sin equipar y Pokémon del equipo sin objeto.', 'You have unequipped items and team Pokémon without one.'));
    if (best.some(m => megaForms(m).some(f => megaCan(m, f.form)))) add(3, 'star', 'team', _L('Puedes desbloquear una forma Mega.', 'You can unlock a Mega form.'));
    // Liga y Ascensión
    if (ascReady() && essGain() >= Math.max(2, 0.3 * S.asc.ess)) add(2, 'crown', 'league', _L(`Ascender ahora te da +${essGain()} de Esencia (×${Math.pow(ASC.dmgEss, essGain()).toFixed(2)} de daño).`, `Ascending now gives you +${essGain()} Essence (×${Math.pow(ASC.dmgEss, essGain()).toFixed(2)} damage).`));
    else if (medalGain() >= Math.max(3, S.medals * 0.5) && S.maxStage >= 60) add(2, 'crown', 'league', _L(`Entrar en la Liga ahora te da +${medalGain()} medallas (${S.medals ? Math.round(medalGain() / S.medals * 100) + '% más de las que tienes' : 'tu primera vez'}).`, `Entering the League now gives you +${medalGain()} medals (${S.medals ? Math.round(medalGain() / S.medals * 100) + '% on top of what you have' : 'your first time'}).`));
    else if (S.maxStage >= 60 && !S.stats.prestiges) add(3, 'crown', 'league', _L('Ya puedes entrar en la Liga: reinicias a cambio de medallas permanentes.', 'You can enter the League now: restart in exchange for permanent medals.'));
    if (!out.length) add(9, 'sprout', 'team', _L('Todo al día. Deja que tu equipo siga combatiendo: vuelve más tarde.', 'All caught up. Let your team keep fighting and come back later.'));
    return out.sort((a, b) => a.p - b.p).slice(0, 6);
  }
  const tracksUnlocked = () => MUSIC_LIST.filter(musicUnlocked).length;
  const musicIds = () => MUSIC_LIST.filter(musicUnlocked).map(t => t.id);
  const foeKills = d => S.foes[d] || 0;
  // rutas de la primera vuelta en las que aparece como enemigo salvaje
  const appearCache = {};
  function appearsIn(dex) {
    if (appearCache[dex]) return appearCache[dex];
    const out = [];
    if (!DEX[dex].leg) for (let ri = 0; ri < ROUTES.length; ri++) {
      const reg = regionOfRoute(ri), rr = ri - REGIONS[reg].first, maxEvo = reg === 3 || rr >= 7 ? 2 : rr >= 3 ? 1 : 0;
      if (wildPool(ri, maxEvo, rr).includes(+dex)) out.push(ri);
    }
    return (appearCache[dex] = out);
  }
  function eventFreePull() { if (S.event.free) return null; S.event.free = 1; return pull('event', 1, true); }

  // ---------------- huevos ----------------
  // los huevos de las primeras S.inc posiciones se incuban: cada victoria suma progreso (un jefe, 5; un dorado, 3) y también el tiempo fuera
  const eggNeed = e => Math.ceil(EGGS[e.t].need * (1 - 0.05 * S.shop.egg));
  const eggReady = e => e.p >= eggNeed(e);
  const eggsReady = () => S.eggs.filter(eggReady).length;
  function giveEgg(t) {
    if (S.eggs.length >= EGG_CAP) { const d = gainDust(EGGS[t].dust); emit('egg', { t, full: true, coins: d }); return null; }
    const e = { t, p: 0 };
    S.eggs.push(e); S.stats.eggsFound++;
    emit('egg', { t, egg: e });
    return e;
  }
  function eggProgress(n) {
    if (evBonus('eggs')) n *= 2;
    n *= 1 + teamItemSum('egg') + tact().drop;
    for (let i = 0; i < Math.min(S.inc, S.eggs.length); i++) {
      const e = S.eggs[i];
      if (eggReady(e)) continue;
      e.p += n;
      if (eggReady(e)) { e.p = eggNeed(e); emit('eggReady', e); }
    }
  }
  function hatch(i) {
    const e = S.eggs[i];
    if (!e || !eggReady(e)) return null;
    S.eggs.splice(i, 1);
    const d = EGGS[e.t];
    S.stats.hatched++;
    if (e.bred) {
      const b = e.bred, res = addMon(b.base, rnd() < shinyRate() * EGG_SHINY * (b.shiny ? 2 : 1), 0, b);
      res.egg = e.t; res.genes = { iv: b.iv, nat: b.nat };
      return res;
    }
    const dex = pickFrom({}, rollRarity(d.rates));
    const res = addMon(dex, rnd() < shinyRate() * EGG_SHINY, d.floor);
    res.egg = e.t;
    return res;
  }
  // ---- guardería ----
  const breedRar = (a, b) => Math.max(RAR[S.mons[a].dex], RAR[S.mons[b].dex]);
  const breedCost = (a, b) => dc(BREED_COST[breedRar(a, b)]);
  function breedOk(a, b) { return !!(a && b && a !== b && S.mons[a] && S.mons[b] && S.eggs.length < EGG_CAP && S.coins >= breedCost(a, b)); }
  // IVs esperados de la cría (porcentaje medio)
  function breedExpect(a, b) {
    const A = S.mons[a].iv, B = S.mons[b].iv;
    return ['d', 's', 'c'].reduce((x, k) => x + Math.min(IV_MAX, BREED_HI * Math.max(A[k], B[k]) + (1 - BREED_HI) * Math.min(A[k], B[k]) + BREED_BONUS / 2), 0) / (3 * IV_MAX);
  }
  function breed(a, b, natFrom) {
    if (!breedOk(a, b)) return null;
    const A = S.mons[a], B = S.mons[b], iv = {};
    for (const k of ['d', 's', 'c']) {
      const hi = Math.max(A.iv[k], B.iv[k]), lo = Math.min(A.iv[k], B.iv[k]);
      iv[k] = Math.min(IV_MAX, (rnd() < BREED_HI ? hi : lo) + Math.floor(rnd() * (BREED_BONUS + 1)));
    }
    S.coins -= breedCost(a, b);
    const e = giveEgg(BREED_EGG[breedRar(a, b)]);
    if (!e) return null;
    e.bred = { base: +a, iv, nat: natFrom === 'b' ? B.nat : A.nat, shiny: !!(A.shinyOwned || B.shinyOwned) };
    S.stats.bred++;
    return e;
  }
  // el huevo criado ya sumó copia y polvo; los genes nuevos solo se aplican si el jugador quiere
  function applyGenes(key, genes) { const m = S.mons[key]; if (!m) return false; m.iv = Object.assign({}, genes.iv); m.nat = genes.nat; return true; }
  function moveEgg(i) { if (S.eggs[i] && i > 0) S.eggs.unshift(S.eggs.splice(i, 1)[0]); }
  function buyEgg(t) {
    const c = EGGS[t].gems;
    if (S.gems < c || S.eggs.length >= EGG_CAP) return false;
    S.gems -= c; giveEgg(t); return true;
  }
  const incCost = () => (S.inc < INC_COST.length - 1 ? INC_COST[S.inc + 1] : 0);
  function buyInc() { const c = incCost(); if (!c || S.gems < c) return false; S.gems -= c; S.inc++; return true; }

  // ---------------- entrenamiento de IVs y naturalezas (polvo estelar) ----------------
  function trainIv(key, ax) {
    const m = S.mons[key];
    if (!m || m.iv[ax] >= IV_MAX) return false;
    const c = dc(ivTrainCost(m.iv[ax]));
    if (S.coins < c) return false;
    S.coins -= c; m.iv[ax] = Math.min(IV_MAX, m.iv[ax] + IV_TRAIN_STEP);
    return true;
  }
  function rerollNat(key) {
    const m = S.mons[key];
    const rc = dc(NAT_REROLL_COST); if (!m || S.coins < rc) return false;
    S.coins -= rc;
    let n; do { n = Math.floor(rnd() * NATURES.length); } while (n === m.nat);
    m.nat = n; return true;
  }
  function setNat(key, id) {
    const m = S.mons[key];
    const nc = dc(NAT_CHOOSE_COST); if (!m || !NATURES[id] || id === m.nat || S.coins < nc) return false;
    S.coins -= nc; m.nat = id; return true;
  }

  // ---------------- gacha ----------------
  // destacados rotativos: un épico cada 3 días y un legendario cada semana (solo de regiones desbloqueadas)
  function featuredList(rar) {
    const out = [];
    for (const g of unlockedGens()) out.push(...POOLG[g][rar]);
    return out;
  }
  const featuredEpic = () => { const l = featuredList(4); return l[Math.floor(dayIndex() / 3) % l.length]; };
  const featuredLegend = () => { const l = featuredList(5); return l[Math.floor(dayIndex() / 7) % l.length]; };
  const featured = () => featuredEpic();
  function ballAvailable(id) { const b = BALLS[id]; return !b.gen || genUnlocked(b.gen); }
  const ticketCost = n => (n >= 10 ? n - 1 : n);                 // x10 cuesta 9 tickets
  function ticketPrice(t) { return t === 'poke' ? pokeBallPrice() : TICKETS[t].gems; }
  function buyTicket(t, n) {
    const cur = TICKETS[t].cur, cost = ticketPrice(t) * ticketCost(n);
    if (S[cur] < cost) return false;
    S[cur] -= cost; giveTickets({ [t]: n });
    return true;
  }
  function rollRarity(rates) {
    let r = rnd() * 100;
    for (let k = 1; k <= 5; k++) { r -= rates[k]; if (r < 0) return k; }
    return 1;
  }
  function pickFrom(b, rar) {
    let list = [];
    for (const g of b.gen ? [b.gen] : unlockedGens()) list = list.concat(POOLG[g][rar]);
    if (b.event) { const t = list.filter(d => DEX[d].types.includes(curEv.type)); if (t.length) list = t; }
    if (!list.length) return pickFrom(b, rar - 1);
    return list[Math.floor(rnd() * list.length)];
  }
  function pull(id, n, free) {
    const b = BALLS[id];
    if (!ballAvailable(id)) return null;
    const cost = free ? 0 : ticketCost(n);
    if (S.tk[b.ticket] < cost) return null;
    S.tk[b.ticket] -= cost;
    const out = [];
    for (let i = 0; i < n; i++) {
      let rar = rollRarity(b.rates);
      if (b.ticket !== 'poke') {
        S.pity++; S.pityE++;
        if (S.pity >= PITY) rar = 5; else if (S.pityE >= PITY_EPIC && rar < 4) rar = 4;
      }
      if (n >= 10 && i === n - 1 && !out.some(o => o.rar >= 3)) rar = Math.max(rar, 3);
      if (rar === 5) S.pity = 0;
      if (rar >= 4) S.pityE = 0;
      let dex = null;
      if (b.banner && rar >= 4) {
        const fe = rar === 5 ? featuredLegend() : featuredEpic();
        if (rar === 5) {
          if (S.bannerLost || rnd() < 0.5) { dex = fe; S.bannerLost = 0; }
          else { dex = pickFrom(b, 5); if (dex === fe) S.bannerLost = 0; else S.bannerLost = 1; }
        } else if (rnd() < 0.5) dex = fe;
      }
      if (dex === null && b.event && rar >= 4) { const f = eventFeat(rar); if (f && rnd() < 0.5) dex = f; }
      if (dex === null) dex = pickFrom(b, rar);
      out.push(addMon(dex, rnd() < shinyRate(), IV_FLOOR[b.ticket] || 0));
    }
    S.stats.pulls += n;
    if (b.event) S.event.pulls += n;
    return out;
  }
  const freePullReady = () => S.freeDay !== today();
  function freePull() { if (!freePullReady()) return null; S.freeDay = today(); S.stats.freePulls++; return pull('poke', 1, true); }

  // ---------------- diarias, semanales y logros ----------------
  function makeQuests(pool, n) {
    const p = pool.filter(q => !q.req || q.req()), qs = [], stats = {};
    while (qs.length < n && p.length) {
      const q = p.splice(Math.floor(rnd() * p.length), 1)[0];
      if (stats[q.stat]) continue;
      stats[q.stat] = 1;
      qs.push({ stat: q.stat, goal: q.goal, reward: q.reward, base: S.stats[q.stat] || 0, claimed: false, text: q.text(fmt(q.goal)) });
    }
    return qs;
  }
  const weekIdx = () => Math.floor((Date.now() / 864e5 + 3) / 7);      // semana en UTC (lunes 00:00 UTC): igual para todos y coincide con la del ranking semanal
  function checkDaily() {
    let changed = false;
    const d = today();
    if (S.daily.day !== d) {
      const prev = new Date(); prev.setDate(prev.getDate() - 1);
      const y = prev.getFullYear() + '-' + (prev.getMonth() + 1) + '-' + prev.getDate();
      S.daily.streak = S.daily.day === y ? S.daily.streak + 1 : 1;
      S.daily.day = d; S.daily.claimed = false;
      S.stats.streak = Math.max(S.stats.streak, S.daily.streak);
      S.daily.quests = makeQuests(QUEST_POOL, 4);
      changed = true;
    }
    if (S.weekly.week !== weekIdx()) { S.weekly.week = weekIdx(); S.weekly.quests = makeQuests(WEEKLY_POOL, 3); changed = true; }
    return changed;
  }
  function dailyReward() { return Math.round(DAILY_REWARD[(S.daily.streak - 1) % 7] * gemMult()); }
  function claimDaily() { if (S.daily.claimed) return 0; S.daily.claimed = true; const g = dailyReward(); S.gems += g; giveTickets(DAILY_TICKETS[(S.daily.streak - 1) % 7]); if ((S.daily.streak - 1) % 7 === 6) giveEgg(1); return g; }
  // el texto de la misión se calcula al mostrarla (no se guarda) para que cambie con el idioma
  const questText = q => { const d = (q.weekly ? WEEKLY_POOL : QUEST_POOL).concat(QUEST_POOL, WEEKLY_POOL).find(p => p.stat === q.stat && p.goal === q.goal); return d ? d.text(fmt(q.goal)) : q.text; };
  const questProg = q => Math.min(q.goal, (S.stats[q.stat] || 0) - q.base);
  function claimQuest(i, weekly) {
    const q = (weekly ? S.weekly : S.daily).quests[i];
    if (!q || q.claimed || questProg(q) < q.goal) return 0;
    q.claimed = true;
    const g = Math.round(q.reward * gemMult()); S.gems += g; giveTickets(weekly ? { super: 2 } : { poke: 1 }); if (weekly) giveEgg(0); return g;
  }
  const legendsOwned = () => Object.values(S.mons).filter(m => RAR[m.dex] === 5).length;
  function achStat(a) {
    const st = a.stat;
    if (st === 'dex') return regCount();
    if (st === 'legends') return legendsOwned();
    if (st === 'tower') return S.tower.best;
    if (st === 'megas') return S.stats.megas;
    if (st === 'bestiary') return Object.keys(S.foes).length;
    if (st === 'tracks') return tracksUnlocked();
    if (st === 'rivals') return rivalWins();
    if (st === 'essence') return S.asc.ess;
    if (st === 'rivalMaster') return S.rival.master;
    if (st === 'ivGood') return Object.values(S.mons).filter(m => ivPct(m) >= 0.9).length;
    if (st === 'ivPerfect') return Object.values(S.mons).filter(m => m.iv.d === IV_MAX && m.iv.s === IV_MAX && m.iv.c === IV_MAX).length;
    if (st === 'stars5') return Object.values(S.mons).filter(m => m.stars >= 5).length;
    if (st === 'maxLvl') return Object.values(S.mons).reduce((x, m) => Math.max(x, m.lvl), 0);
    if (st === 'upMax') return Object.keys(UPGRADES).filter(k => S.up[k] >= UPGRADES[k].max).length;
    if (st === 'shopLvl') return Object.values(S.shop).reduce((x, n) => x + n, 0);
    if (st === 'regions') return unlockedGens().length;
    if (st === 'slots') return S.slots;
    if (st.startsWith('type:')) { const t = st.slice(5); return Object.values(S.mons).filter(m => DEX[m.dex].types.includes(t)).length; }
    if (st.startsWith('regionDex:')) { const g = +st.slice(10); return POKEDEX.filter(p => p.gen === g && isReg(p.dex)).length; }
    return S.stats[st] || 0;
  }
  function claimAch(id) { const a = ACHIEVEMENTS.find(x => x.id === id); if (!a || S.ach[id] || achStat(a) < a.goal) return 0; S.ach[id] = 1; S.gems += a.reward; giveTickets({ poke: Math.ceil(a.reward / 50) }); return a.reward; }
  let prT = 0, prV = 0;
  function pendingRewards() {
    const now = Date.now();
    if (now - prT < 500) return prV;
    prT = now; prV = pendingRewards0(); return prV;
  }
  function pendingRewards0() {
    let n = S.daily.quests.filter(q => !q.claimed && questProg(q) >= q.goal).length;
    n += S.weekly.quests.filter(q => !q.claimed && questProg(q) >= q.goal).length;
    n += ACHIEVEMENTS.filter(a => !S.ach[a.id] && achStat(a) >= a.goal).length;
    return n;
  }

  // ---------------- Liga (prestigio) ----------------
  function prestige() {
    const g = medalGain();
    if (!g) return 0;
    chal = null;
    S.medals += g; S.mp += g; S.stats.prestiges++;
    S.coins = 0; S.stage = 1; S.maxStage = 1; S.kills = 0; S.badges = {}; S.bossFails = {}; S.retryT = 0; S.auto = true; S.slots = Math.min(S.slots, 2 + S.shop.slots);
    for (const k of Object.keys(S.up)) S.up[k] = 0;
    for (const m of Object.values(S.mons)) m.lvl = 1 + 2 * S.shop.lvl;
    S.team = S.team.slice(0, S.slots);
    resetFight();
    return g;
  }

  // ---------------- tiempo fuera ----------------
  function ascend() {
    if (!ascReady()) return null;
    const ess = essGain(), medals = prestige();
    if (!medals) return null;
    S.asc.rank++; S.asc.ess += ess; S.stats.ascends++;
    emit('ascend', { ess, medals, rank: S.asc.rank });
    return { ess, medals };
  }
  const offlineCapSecs = () => (8 + 2 * S.shop.offline) * 3600;
  function offlineKps() {
    if (!S.team.length) return 0;
    const s = isBoss(S.stage) ? S.stage - 1 : S.stage, ttk = enemyHp(s) / Math.max(1e-9, teamDps()) + 0.45;
    return (1 / ttk) * (0.5 + 0.05 * S.shop.offline);
  }
  // segundos (sin conexión) hasta que eclosione el próximo huevo de una incubadora
  function nextEggEta() {
    const kps = offlineKps() * (evBonus('eggs') ? 2 : 1);
    if (!kps) return null;
    let best = null;
    for (let i = 0; i < Math.min(S.inc, S.eggs.length); i++) { const e = S.eggs[i]; if (eggReady(e)) continue; const t = (eggNeed(e) - e.p) / kps; if (best === null || t < best) best = t; }
    return best;
  }
  function offline() {
    const away = (Date.now() - (S.last || Date.now())) / 1000, cap = (8 + 2 * S.shop.offline) * 3600, secs = Math.min(cap, away);
    if (secs < 60 || !S.team.length) { if (secs < 0 || !S.team.length) S.last = Date.now(); return null; }       // las ausencias cortas se acumulan hasta llegar a 1 minuto
    S.last = Date.now();
    S.skOn.rage = S.skOn.gold = S.skOn.lure = 0;          // las habilidades no cuentan sin conexión (el reloj de juego no avanzó)
    const s = isBoss(S.stage) ? S.stage - 1 : S.stage;
    const kills = Math.floor(secs * offlineKps());
    const coins = kills * killCoins(s);
    S.coins += coins; S.stats.coinsTotal += coins;
    const eggsBefore = S.eggs.map(e => e.p);
    eggProgress(kills);
    return { secs, away, capped: away > cap, cap, kills, coins, perHour: coins / (secs / 3600), eggs: S.eggs.slice(0, S.inc).map((e, i) => ({ t: e.t, from: eggsBefore[i], to: e.p, need: eggNeed(e) })) };
  }

  function start(starter) {
    S.started = true; trackBiome();
    addMon(starter, false);
    S.team = [String(starter)];
    S.coins = 20;
    giveEgg(0);
    checkDaily();
    save();
  }

  return {
    K, hpTab, DEX, CHILDREN, RAR, POOLG, BASES, bst, baseOf, stageOf, fmt, on, emit, F,
    get S() { return S; }, load, save, freezeSave, eventWeek: () => weekIdx(), wipe, fresh, setRng(f) { rnd = f; },
    route, routeIdx, routeData, regionOf, regionOfRoute, loopOf, isBoss, bossTier, bossTime, enemyHp, killCoins, coinMult, globalDmg, monDmg, monRate, eff,
    upPlan, buyUpN, coinsPerDust, dc, srcCoins, previewUp, regCount, isReg, ownerCheck, isStale: () => stale, claim,
    levelCost, levelCostN, maxAffordable, upCost, shopCost, pokeBallPrice, critChance, critMult, catchChance, teamDps, tapDmg, medalGain, medalFor, dexCount, badgeCount,
    genUnlocked, unlockedGens, skillOn, skillReady, useSkill, goldenChance, gemMult,
    tick, tap, advance, goStage, fightBoss, bossEase, bossReady, levelUp, starUp, setTeam, buySlot, buyUp, buyShop, addMon,
    featured, featuredEpic, featuredLegend, ballAvailable, ticketCost, ticketPrice, buyTicket, giveTickets, pull, freePull, freePullReady, toggleShiny, moveOf, tierOf, unsetTeam, setPaused, itemOf, itemVal, itemDmg, equip, unequip, recycleItem, recycleSpare, buyItem, synergies, synMult, teamItemSum,
    checkDaily, dailyReward, claimDaily, questText, questProg, claimQuest, achStat, claimAch, pendingRewards, legendsOwned,
    prestige, offline, start,
    sample, megaOf, fdex, megaForms, megaCost, megaCan, megaUnlock, megaSet, MEGA_BY_BASE,
    natOf, natVal, ivSum, ivPct, ivGrade, ivBonus, trainIv, rerollNat, setNat, breedCost, breedOk, breedExpect, breed, applyGenes,
    eggNeed, eggReady, eggsReady, giveEgg, hatch, moveEgg, buyEgg, incCost, buyInc,
    typeEff, routeFoes, matchupAvg, bestTeam, strongTypes, setTeamList, savePreset, loadPreset, renamePreset,
    offlineCapSecs, nextEggEta, refreshEvent, eventDaysLeft, eventFeat, eventPool, evBonus, towerUnlocked, towerSpec, eventSpec, chalReady, towerStarts, towerReward, startTower, startEvent, abortChal, claimEventTask, eventFreePull,
    rankHp, ascDmg, ascCoin, ascOpen, ascReady, essGain, ascend, masterOpen, masterSpec, startMaster,
    tact, tacticOpen, setTactic, rivalWins, itemCombos, rivalTeam, rivalOpen, rivalNext, rivalSpec, startRival, fuseGroups, fuseItem, craftItem,
    frameOpen, framesOpen, setFrame, biomesSeen, setBg, biomeOverride, nextTip, seenTip, resetTips, snap, recap,
    titleOpen, titlesOpen, setTitle, setAvatar, setName, toggleFav, advice,
    musicUnlocked, tracksUnlocked, musicIds, foeKills, appearsIn, wildPool,
    get ev() { return curEv; }, get chal() { return chal; }, inChal: () => !!chal,
  };
})();
if (typeof module !== 'undefined') module.exports = Core;
