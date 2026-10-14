// Lógica de PokéIdle sin DOM: estado, fórmulas, combate automático, gacha, misiones y guardado.
// Se puede ejecutar en Node (simulaciones de equilibrio) cargando antes pokedex.js e idle.js.
'use strict';

const Core = (() => {
  const DEX = {};
  for (const p of POKEDEX) DEX[p.dex] = p;
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
    if (!isFinite(n)) return '∞';
    if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n));
    const e = Math.floor(Math.log10(n) / 3);
    const suf = e < SUF.length ? SUF[e] : String.fromCharCode(97 + Math.floor((e - SUF.length) / 26)) + String.fromCharCode(97 + (e - SUF.length) % 26);
    const v = n / Math.pow(1000, e);
    return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + suf;
  }
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
  let rnd = Math.random;

  // ---------------- eventos ----------------
  const subs = {};
  const on = (e, f) => (subs[e] = subs[e] || []).push(f);
  const emit = (e, d) => { for (const f of subs[e] || []) f(d); };

  // ---------------- estado ----------------
  const KEY = 'pokeidle.save.v1';
  let S = null, invDirty = true, invMap = new Map();
  function fresh() {
    return {
      v: 1, started: false, coins: 0, gems: 50, dust: 0, tk: { poke: 5, super: 1, ultra: 0, master: 0 }, stage: 1, maxStage: 1, kills: 0, auto: true,
      team: [], slots: 1, mons: {}, seen: {},
      up: { tap: 0, train: 0, coin: 0, crit: 0, critdmg: 0, speed: 0, catch: 0, golden: 0, bosstime: 0, type: 0, boss: 0, autotap: 0, alch: 0 },
      shop: { dmg: 0, coins: 0, lvl: 0, slots: 0, offline: 0, catch: 0, shiny: 0, gems: 0, skill: 0, dust: 0, tapd: 0, critb: 0, disc: 0, bt: 0 },
      medals: 0, mp: 0, badges: {}, bossFirst: {},
      sk: { rage: 0, gold: 0, lure: 0 },        // instante (tiempo jugado) en el que está lista cada habilidad
      skOn: { rage: 0, gold: 0, lure: 0 },      // instante en el que termina cada habilidad
      stats: { kills: 0, taps: 0, pulls: 0, levels: 0, bosses: 0, catches: 0, evolutions: 0, shinies: 0, prestiges: 0, coinsTotal: 0, time: 0, maxStage: 1, maxStars: 0, stages: 0, skills: 0, dust: 0, crits: 0, goldens: 0, dustBuys: 0, freePulls: 0, streak: 0, itemsFound: 0 },
      bossFails: {}, retryT: 0, pity: 0, pityE: 0, bannerLost: 0, freeDay: '', autoAcc: 0, inv: [], uid: 1, tutDone: false, last: Date.now(),
      daily: { day: '', streak: 0, claimed: true, quests: [] }, weekly: { week: -1, quests: [] }, ach: {},
      buyMul: 1, settings: { music: 0.35, sfx: 0.6, nums: true, shake: true, bigNums: true, autoBoss: true },
    };
  }
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    const f = fresh();
    const legacy = !!(d && typeof d === 'object' && d.started && d.tutDone === undefined);
    if (!d || typeof d !== 'object' || d.v !== 1) d = f;
    for (const k of Object.keys(f)) if (d[k] === undefined) d[k] = f[k];
    for (const g of ['up', 'stats', 'settings', 'shop', 'sk', 'skOn', 'tk']) for (const k of Object.keys(f[g])) if (d[g][k] === undefined) d[g][k] = f[g][k];
    if (typeof d.badges !== 'object' || d.badges === null) d.badges = {};
    if (typeof d.bossFails !== 'object' || d.bossFails === null) d.bossFails = {};
    for (const k of Object.keys(d.mons)) if (!DEX[d.mons[k].dex]) delete d.mons[k];
    for (const m of Object.values(d.mons)) if (m.shinyOwned === undefined) m.shinyOwned = !!m.shiny;
    // partidas antiguas: la base de algunas líneas cambió al añadir bebés (Pichu, Cleffa…)
    for (const k of Object.keys(d.mons)) {
      const b = String(baseOf(d.mons[k].dex));
      if (b !== k && !d.mons[b]) { d.mons[b] = d.mons[k]; delete d.mons[k]; d.team = d.team.map(t => String(t) === k ? b : t); }
    }
    d.team = d.team.map(String).filter((k, i, a) => d.mons[k] && a.indexOf(k) === i);
    if (d.stats.maxStage < d.maxStage) d.stats.maxStage = d.maxStage;
    if (legacy) d.tutDone = true;
    if (!Array.isArray(d.inv)) d.inv = [];
    invDirty = true;
    S = d;
    resetFight();
    return S;
  }
  function save() { if (!S) return; S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin espacio */ } }
  function wipe() { S = fresh(); resetFight(); save(); }

  // ---------------- fórmulas ----------------
  // hpB/hpG = vida del enemigo (base y crecimiento por etapa) · coinR = monedas por vida · lvlG = crecimiento del coste de nivel
  const K = { hpD: 0.055, hpD0: 100, hpD1: 300, hpS: 80, hpM: 1.8, hp0: 50, bw: 0.08, bwMin: 0.35, ready: 0.95, retryMax: 600, gate: 0.6, hpB: 100, hpG: 1.17, hpL: 6, coinR: 0.0012, cd: 0.994, cf: 0.5, cs: 0.12, lvlG: 1.15, dG: 1.075 };
  const route = s => Math.floor((s - 1) / 10);
  const routeIdx = s => route(s) % ROUTES.length;
  const routeData = s => ROUTES[routeIdx(s)];
  const regionOfRoute = ri => { let r = 0; for (let i = 0; i < REGIONS.length; i++) if (ri >= REGIONS[i].first) r = i; return r; };
  const regionOf = s => regionOfRoute(routeIdx(s));
  const loopOf = s => Math.floor(route(s) / ROUTES.length);
  const isBoss = s => s % 10 === 0;
  const bossTier = s => BOSS_TIER[routeData(s).boss.tier];
  const bossTime = s => bossTier(s).time + 3 * S.up.bosstime + 2 * S.shop.bt;
  // cada intento fallido contra un jefe lo debilita un poco, hasta un mínimo (evita muros eternos)
  const bossEase = s => (isBoss(s) ? Math.max(K.bwMin, 1 - K.bw * (S.bossFails[s] || 0)) : 1);
  const hpCurve = s => (s <= K.hp0 ? 1 : Math.pow((1 + s / K.hpS) / (1 + K.hp0 / K.hpS), K.hpM));   // endurece poco a poco el ritmo en las etapas altas
  // crecimiento de vida acumulado: el factor por etapa baja poco a poco en las regiones lejanas
  const hpTab = [1, 1];
  function hpBase(s) {
    for (let i = hpTab.length; i <= s; i++) { const k = i - 1, g = K.hpG - K.hpD * Math.max(0, Math.min(1, (k - K.hpD0) / K.hpD1)); hpTab[i] = hpTab[i - 1] * g; }
    return K.hpB * hpTab[s];
  }
  const enemyHp = s => Math.round((hpBase(s) + K.hpL * s) * hpCurve(s)) * (isBoss(s) ? bossTier(s).hp * bossEase(s) : 1);
  // poder del equipo contra el jefe de la etapa s (1 = lo derrota justo a tiempo)
  const bossReady = s => { const r = routeData(s); return teamDps(DEX[r.boss.dex].types) * (1 + 0.04 * S.up.boss) * bossTime(s) / enemyHp(s); };
  const skillOn = id => S.skOn[id] > S.stats.time;
  const medalMult = () => 1 + 0.03 * S.medals;
  const coinMult = () => (1 + 0.15 * S.up.coin) * medalMult() * (1 + 0.06 * S.shop.coins) * (skillOn('gold') ? 3 : 1) * (1 + teamItemSum('coins') + synergies().coins);
  const killCoins = s => Math.ceil(((hpBase(s) + K.hpL * s) * K.coinR * Math.pow(K.cd, s) + K.cf + s * K.cs) * coinMult() * (isBoss(s) ? 6 : 1));
  const dexCount = () => Object.keys(S.seen).length;
  const badgeCount = () => Object.keys(S.badges).length;
  const gemMult = () => 1 + 0.1 * S.shop.gems;
  const globalDmg = () => (1 + 0.1 * S.up.train) * medalMult() * (1 + 0.06 * S.shop.dmg) * (1 + 0.01 * dexCount()) * (1 + 0.03 * badgeCount()) * (skillOn('rage') ? 3 : 1);
  const lvlMult = l => Math.pow(K.dG, l - 1) * Math.pow(2, Math.floor(l / 25));
  const power = d => Math.pow(bst(d) / 100, 2);
  // ---------------- objetos equipables ----------------
  function invLookup(u) {
    if (invDirty) { invMap = new Map(S.inv.map(i => [i.u, i])); invDirty = false; }
    return invMap.get(u);
  }
  const itemOf = m => (m && m.item ? invLookup(m.item) : null);
  const itemVal = it => HELD[it.id].v * ITEM_RAR[it.rar].mult;
  function itemDmg(m, it) {
    it = it || itemOf(m); if (!it) return 0;
    const fx = HELD[it.id].fx, v = itemVal(it);
    if (fx === 'dmg' || fx === 'dmgslow') return v;
    if (fx === 'type') return DEX[m.dex].types.includes(it.type) ? v : v * 0.2;
    return 0;
  }
  function itemSpd(m) { const it = itemOf(m); if (!it) return 0; const fx = HELD[it.id].fx; return fx === 'spd' ? itemVal(it) : fx === 'dmgslow' ? -0.1 : 0; }
  function itemCrit(m) { const it = itemOf(m); return it && HELD[it.id].fx === 'crit' ? itemVal(it) : 0; }
  function itemBoss(m) { const it = itemOf(m); return it && HELD[it.id].fx === 'boss' ? itemVal(it) : 0; }
  function teamItemSum(fx) { let x = 0; for (const k of S.team) { const it = itemOf(S.mons[k]); if (it && HELD[it.id].fx === fx) x += itemVal(it); } return x; }

  // ---------------- sinergias de equipo ----------------
  function synergies() {
    const team = S.team.map(k => S.mons[k]).filter(Boolean), out = { type: {}, dmg: 0, coins: 0, list: [] };
    const cnt = {};
    for (const m of team) for (const t of DEX[m.dex].types) cnt[t] = (cnt[t] || 0) + 1;
    for (const t of Object.keys(cnt)) if (cnt[t] >= 2) { out.type[t] = TYPE_SYN[Math.min(6, cnt[t])]; out.list.push({ id: 'type:' + t, name: 'Afinidad ' + TYPE_NAMES[t] + ' (' + cnt[t] + ')', txt: '+' + Math.round(out.type[t] * 100) + '% de daño a los de ese tipo' }); }
    const prim = new Set(team.map(m => DEX[m.dex].types[0])).size;
    if (prim >= 6) { out.dmg += 0.3; out.list.push({ id: 'div', name: 'Diversidad total', txt: '+30% de daño al equipo' }); }
    else if (prim >= 4) { out.dmg += 0.15; out.list.push({ id: 'div', name: 'Diversidad', txt: '+15% de daño al equipo' }); }
    const leg = team.filter(m => RAR[m.dex] === 5).length;
    if (leg >= 4) { out.dmg += 0.5; out.list.push({ id: 'leg', name: 'Panteón legendario', txt: '+50% de daño al equipo' }); }
    else if (leg >= 2) { out.dmg += 0.2; out.list.push({ id: 'leg', name: 'Élite legendaria', txt: '+20% de daño al equipo' }); }
    const sh = team.filter(m => m.shiny).length;
    if (sh >= 4) { out.coins += 0.25; out.list.push({ id: 'sh', name: 'Constelación shiny', txt: '+25% de monedas' }); }
    else if (sh >= 2) { out.coins += 0.1; out.list.push({ id: 'sh', name: 'Brillo compartido', txt: '+10% de monedas' }); }
    if (team.length >= 3 && team.every(m => m.stars >= 3)) { out.dmg += 0.25; out.list.push({ id: 'vet', name: 'Equipo veterano', txt: '+25% de daño (todos con ★3 o más)' }); }
    return out;
  }
  function synMult(m) {
    const sy = synergies(); let tb = 0;
    for (const t of DEX[m.dex].types) tb = Math.max(tb, sy.type[t] || 0);
    return 1 + sy.dmg + tb;
  }

  const tierOf = lvl => { let t = 0; for (let i = 0; i < TIER_LV.length; i++) if (lvl >= TIER_LV[i]) t = i; return t; };
  const moveOf = m => MOVE_TIERS[DEX[m.dex].types[0]][tierOf(m.lvl)];
  function monDmg(m) { return power(m.dex) * RAR_MULT[RAR[m.dex]] * lvlMult(m.lvl) * STAR_MULT[m.stars] * (m.shiny ? 1.5 : 1) * TIER_MULT[tierOf(m.lvl)] * globalDmg() * (1 + itemDmg(m)) * synMult(m); }
  function monRate(m) { const spe = DEX[m.dex].stats.spe; return Math.max(0.55, 1.25 - spe / 260) / ((1 + 0.04 * S.up.speed) * (1 + itemSpd(m))); }
  function eff(dex, defTypes) {
    let best = 0;
    for (const at of DEX[dex].types) {
      let e = 1;
      for (const t of defTypes) { const f = TYPE_CHART[at] && TYPE_CHART[at][t]; if (f !== undefined) e *= f; }
      best = Math.max(best, e);
    }
    const b = Math.min(2.5, Math.max(0.5, best));
    return b >= 2 ? b * (1 + 0.04 * S.up.type) : b;
  }
  const levelCost = (m, l) => Math.ceil(6 * RAR_COST[RAR[m.dex]] * Math.pow(K.lvlG, l - 1));
  function levelCostN(m, n) { let c = 0; for (let i = 0; i < n; i++) c += levelCost(m, m.lvl + i); return c; }
  function maxAffordable(m) { let n = 0, c = 0; while (n < 1000) { const k = levelCost(m, m.lvl + n); if (c + k > S.coins) break; c += k; n++; } return { n, c }; }
  const upCost = id => Math.ceil(UPGRADES[id].base * Math.pow(UPGRADES[id].mul, S.up[id]));
  const shopCost = id => Math.ceil(LEAGUE_SHOP[id].base * Math.pow(LEAGUE_SHOP[id].mul, S.shop[id]));
  const pokeBallPrice = () => Math.ceil((1 - 0.04 * S.shop.disc) * 30 * Math.pow(1.2, Math.min(S.stats.maxStage, 140) - 1) * Math.pow(1.05, Math.max(0, S.stats.maxStage - 140)));
  const critChance = m => 0.03 + 0.02 * S.up.crit + 0.01 * S.shop.critb + (m ? itemCrit(m) : 0);
  const critMult = () => 3 + 0.25 * S.up.critdmg;
  const catchChance = () => (0.015 + 0.005 * S.up.catch + 0.004 * S.shop.catch) * (skillOn('lure') ? 6 : 1) * (1 + teamItemSum('drop'));
  const goldenChance = () => 1 / 120 + 0.002 * S.up.golden;
  const shinyRate = () => SHINY_RATE * (1 + 0.2 * S.shop.shiny);
  function teamDps(defTypes) {
    let d = 0;
    for (const k of S.team) { const m = S.mons[k]; d += monDmg(m) / monRate(m) * (defTypes ? eff(m.dex, defTypes) : 1) * (1 + critChance(m) * (critMult() - 1)); }
    return d;
  }
  const bossBonus = (e, m) => (e && e.boss ? (1 + 0.04 * S.up.boss) * (1 + (m ? itemBoss(m) : 0)) : 1);
  const tapDmg = () => (1 + 3 * S.up.tap + teamDps() * (0.15 + 0.01 * S.up.tap)) * (1 + 0.1 * S.shop.tapd) * (1 + teamItemSum('tap'));
  const medalFor = ms => ms < 60 ? 0 : Math.max(1, Math.floor(Math.pow((ms - 45) / 12, 1.4)));
  const medalGain = () => medalFor(S.maxStage);
  const genUnlocked = g => g <= 1 || S.stats.maxStage > REGIONS[g - 1].first * 10;
  const unlockedGens = () => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(genUnlocked);

  // ---------------- combate ----------------
  const F = { enemy: null, timers: [], hits: [], respawn: 0, bossT: 0 };
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
    const s = S.stage, boss = isBoss(s);
    const r = routeData(s);
    const dex = boss ? r.boss.dex : pickWild(s);
    const golden = !boss && rnd() < goldenChance();
    const hp = enemyHp(s) * (golden ? 3 : 1);
    F.enemy = { dex, hp, max: hp, boss, golden, tier: boss ? r.boss.tier : 0, types: DEX[dex].types, stage: s };
    F.bossT = boss ? bossTime(s) : 0;
    F.timers = S.team.map((k, i) => 0.2 + i * 0.13);
    F.hits = [];
    emit('spawn', F.enemy);
  }
  function resetFight() { F.enemy = null; F.respawn = 0.3; F.hits = []; F.timers = []; }

  function deal(dmg, crit, src, ef) {
    const e = F.enemy;
    if (!e || e.hp <= 0) return;
    e.hp -= dmg;
    if (crit) S.stats.crits++;
    emit('hit', { dmg, crit, src, ef: ef || 1 });
    if (e.hp <= 0) kill();
  }
  function kill() {
    const e = F.enemy, s = e.stage;
    const coins = killCoins(s) * (e.golden ? 5 : 1);
    S.coins += coins; S.stats.coinsTotal += coins; S.stats.kills++;
    let gems = e.golden ? 3 : 0, firstKill = false;
    if (e.golden) S.stats.goldens++;
    if (e.boss) {
      S.stats.bosses++;
      const t = BOSS_TIER[e.tier];
      if (!S.bossFirst[s]) { S.bossFirst[s] = 1; firstKill = true; gems += Math.round(t.gems * gemMult()); }
      else gems += Math.round((1 + e.tier) * gemMult());
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
    emit('kill', { enemy: e, coins, gems, tickets, item });
    F.enemy = null; F.respawn = 0.45; F.hits = [];
    if (e.boss) { delete S.bossFails[s]; advance(true); emit('bossWin', e); }
    else {
      S.kills++;
      if (S.kills >= 10 && S.auto) { if (isBoss(S.stage + 1) && bossReady(S.stage + 1) < K.gate) { S.auto = false; S.retryT = 0; emit('bossWait', S.stage + 1); } else advance(false); }
    }
  }
  function advance(force) {
    if (!force && S.stage >= S.maxStage && S.kills < 10) return;
    S.stage++; S.kills = 0; S.stats.stages++;
    if (S.stage > S.maxStage) { S.maxStage = S.stage; S.stats.maxStage = Math.max(S.stats.maxStage, S.maxStage); }
    if (!S.auto && !force) S.auto = true;
    F.enemy = null; F.respawn = 0.6;
    emit('stage', S.stage);
  }
  function goStage(s) {
    if (s < 1 || s > S.maxStage) return;
    S.stage = s; S.kills = 0; S.retryT = 0; F.enemy = null; F.respawn = 0.3;
    emit('stage', S.stage);
  }
  function bossFail() {
    S.bossFails[S.stage] = (S.bossFails[S.stage] || 0) + 1;
    S.retryT = 0;
    S.stage = Math.max(1, S.stage - 1); S.kills = 10; S.auto = false;
    F.enemy = null; F.respawn = 0.6;
    emit('bossFail'); emit('stage', S.stage);
  }
  function fightBoss() { if (!isBoss(S.stage) && S.kills >= 10) { S.auto = true; advance(true); } }

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
    if (S.retryT >= 0 && !S.auto) { S.retryT += dt; if (S.settings.autoBoss && S.kills >= 10 && !isBoss(S.stage) && isBoss(S.stage + 1) && S.retryT >= 12 && (bossReady(S.stage + 1) >= K.ready || S.retryT >= K.retryMax)) fightBoss(); }
    if (S.up.autotap) { S.autoAcc += dt * 0.5 * S.up.autotap; while (S.autoAcc >= 1) { S.autoAcc -= 1; if (F.enemy) tap(true); } }
    if (!F.enemy) { F.respawn -= dt; if (F.respawn <= 0) spawn(); return; }
    const e = F.enemy;
    if (e.boss) { F.bossT -= dt; if (F.bossT <= 0 && e.hp > 0) { bossFail(); return; } }
    for (let i = 0; i < S.team.length; i++) {
      const m = S.mons[S.team[i]];
      if (F.timers[i] === undefined) F.timers[i] = 0.3;
      F.timers[i] -= dt;
      if (F.timers[i] <= 0) {
        F.timers[i] += monRate(m);
        const crit = rnd() < critChance(m);
        const ef = eff(m.dex, e.types);
        const dmg = monDmg(m) * ef * (crit ? critMult() : 1) * (0.9 + rnd() * 0.2) * bossBonus(e, m);
        F.hits.push({ t: 0.22, dmg, crit, slot: i, eff: ef });
        emit('fire', { slot: i, dex: m.dex, delay: 0.22, move: moveOf(m), tier: tierOf(m.lvl) });
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
    const ids = Object.keys(HELD), id = ids[Math.floor(rnd() * ids.length)];
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
    const d = ITEM_RAR[it.rar].dust; S.dust += d; S.stats.dust += d; return d;
  }
  function recycleSpare() { // reciclar todos los comunes que nadie lleva
    const worn = new Set(Object.values(S.mons).map(m => m.item)); let n = 0, d = 0;
    for (const it of S.inv.slice()) if (it.rar === 1 && !worn.has(it.u)) { d += recycleItem(it.u); n++; }
    return { n, d };
  }
  function buyItem() {
    if (S.dust < ITEM_DUST_COST) return null;
    S.dust -= ITEM_DUST_COST; return dropItem([60, 32, 8]);
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

  // ---------------- Pokémon ----------------
  function addMon(base, shiny) {
    let m = S.mons[base], isNew = false, dust = 0, newShiny = false;
    const rar = RAR[base];
    if (!m) { m = S.mons[base] = { dex: base, lvl: 1 + 2 * S.shop.lvl, stars: 0, copies: 0, shiny: !!shiny, shinyOwned: !!shiny }; isNew = true; }
    else {
      m.copies++;
      dust = Math.round(DUST_GAIN[rar] * (1 + 0.1 * S.up.alch + 0.15 * S.shop.dust) * (shiny ? 2 : 1));
      S.dust += dust; S.stats.dust += dust;
      if (shiny && !m.shinyOwned) { m.shinyOwned = true; m.shiny = true; newShiny = true; }
    }
    if (shiny) S.stats.shinies++;
    S.seen[base] = 1;
    if (isNew && S.team.length < S.slots) S.team.push(String(base));
    return { base, dex: m.dex, isNew, shiny: !!shiny, newShiny: newShiny || (isNew && !!shiny), rar, dust };
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
      const from = m.dex, to = kids[Math.floor(rnd() * kids.length)];
      m.dex = to; S.seen[to] = 1; S.stats.evolutions++;
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
  function unsetTeam(slot) { if (S.team.length > 1 && S.team[slot]) { S.team.splice(slot, 1); F.timers = S.team.map(() => 0.3); return true; } return false; }
  function buySlot() {
    if (S.slots >= 6) return false;
    const c = SLOT_COST[S.slots];
    if (S.coins < c) return false;
    S.coins -= c; S.slots++;
    return true;
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
  function dustTicket(t) {
    const c = TICKET_DUST[t];
    if (S.dust < c) return false;
    S.dust -= c; S.stats.dustBuys++; giveTickets({ [t]: 1 });
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
      if (dex === null) dex = pickFrom(b, rar);
      out.push(addMon(dex, rnd() < shinyRate()));
    }
    S.stats.pulls += n;
    return out;
  }
  const freePullReady = () => S.freeDay !== today();
  function freePull() { if (!freePullReady()) return null; S.freeDay = today(); S.stats.freePulls++; return pull('poke', 1, true); }

  // ---------------- diarias, semanales y logros ----------------
  function makeQuests(pool, n) {
    const p = pool.slice(), qs = [], stats = {};
    while (qs.length < n && p.length) {
      const q = p.splice(Math.floor(rnd() * p.length), 1)[0];
      if (stats[q.stat]) continue;
      stats[q.stat] = 1;
      qs.push({ stat: q.stat, goal: q.goal, reward: q.reward, base: S.stats[q.stat] || 0, claimed: false, text: q.text(fmt(q.goal)) });
    }
    return qs;
  }
  const weekIdx = () => Math.floor((dayIndex() + 3) / 7);
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
  function claimDaily() { if (S.daily.claimed) return 0; S.daily.claimed = true; const g = dailyReward(); S.gems += g; giveTickets(DAILY_TICKETS[(S.daily.streak - 1) % 7]); return g; }
  const questProg = q => Math.min(q.goal, (S.stats[q.stat] || 0) - q.base);
  function claimQuest(i, weekly) {
    const q = (weekly ? S.weekly : S.daily).quests[i];
    if (!q || q.claimed || questProg(q) < q.goal) return 0;
    q.claimed = true;
    const g = Math.round(q.reward * gemMult()); S.gems += g; giveTickets(weekly ? { super: 2 } : { poke: 1 }); return g;
  }
  const legendsOwned = () => Object.values(S.mons).filter(m => RAR[m.dex] === 5).length;
  function achStat(a) {
    const st = a.stat;
    if (st === 'dex') return dexCount();
    if (st === 'legends') return legendsOwned();
    if (st === 'stars5') return Object.values(S.mons).filter(m => m.stars >= 5).length;
    if (st === 'maxLvl') return Object.values(S.mons).reduce((x, m) => Math.max(x, m.lvl), 0);
    if (st === 'upMax') return Object.keys(UPGRADES).filter(k => S.up[k] >= UPGRADES[k].max).length;
    if (st === 'shopLvl') return Object.values(S.shop).reduce((x, n) => x + n, 0);
    if (st === 'regions') return unlockedGens().length;
    if (st === 'slots') return S.slots;
    if (st.startsWith('type:')) { const t = st.slice(5); return Object.values(S.mons).filter(m => DEX[m.dex].types.includes(t)).length; }
    if (st.startsWith('regionDex:')) { const g = +st.slice(10); return Object.keys(S.seen).filter(d => DEX[d] && DEX[d].gen === g).length; }
    return S.stats[st] || 0;
  }
  function claimAch(id) { const a = ACHIEVEMENTS.find(x => x.id === id); if (!a || S.ach[id] || achStat(a) < a.goal) return 0; S.ach[id] = 1; S.gems += a.reward; giveTickets({ poke: Math.ceil(a.reward / 50) }); return a.reward; }
  function pendingRewards() {
    let n = S.daily.quests.filter(q => !q.claimed && questProg(q) >= q.goal).length;
    n += S.weekly.quests.filter(q => !q.claimed && questProg(q) >= q.goal).length;
    n += ACHIEVEMENTS.filter(a => !S.ach[a.id] && achStat(a) >= a.goal).length;
    return n;
  }

  // ---------------- Liga (prestigio) ----------------
  function prestige() {
    const g = medalGain();
    if (!g) return 0;
    S.medals += g; S.mp += g; S.stats.prestiges++;
    S.coins = 0; S.stage = 1; S.maxStage = 1; S.kills = 0; S.badges = {}; S.bossFails = {}; S.retryT = 0; S.auto = true; S.slots = Math.min(S.slots, 2 + S.shop.slots);
    for (const k of Object.keys(S.up)) S.up[k] = 0;
    for (const m of Object.values(S.mons)) m.lvl = 1 + 2 * S.shop.lvl;
    S.team = S.team.slice(0, S.slots);
    resetFight();
    return g;
  }

  // ---------------- tiempo fuera ----------------
  function offline() {
    const secs = Math.min((8 + 2 * S.shop.offline) * 3600, (Date.now() - (S.last || Date.now())) / 1000);
    S.last = Date.now();
    if (secs < 60 || !S.team.length) return null;
    const s = isBoss(S.stage) ? S.stage - 1 : S.stage;
    const ttk = enemyHp(s) / Math.max(1e-9, teamDps()) + 0.45;
    const kills = Math.floor(secs / ttk * (0.5 + 0.05 * S.shop.offline));
    const coins = kills * killCoins(s);
    S.coins += coins; S.stats.coinsTotal += coins;
    return { secs, kills, coins };
  }

  function start(starter) {
    S.started = true;
    addMon(starter, false);
    S.team = [String(starter)];
    S.coins = 20;
    checkDaily();
    save();
  }

  return {
    K, hpTab, DEX, CHILDREN, RAR, POOLG, BASES, bst, baseOf, stageOf, fmt, on, emit, F,
    get S() { return S; }, load, save, wipe, fresh, setRng(f) { rnd = f; },
    route, routeIdx, routeData, regionOf, regionOfRoute, loopOf, isBoss, bossTier, bossTime, enemyHp, killCoins, coinMult, globalDmg, monDmg, monRate, eff,
    levelCost, levelCostN, maxAffordable, upCost, shopCost, pokeBallPrice, critChance, critMult, catchChance, teamDps, tapDmg, medalGain, medalFor, dexCount, badgeCount,
    genUnlocked, unlockedGens, skillOn, skillReady, useSkill, goldenChance, gemMult,
    tick, tap, advance, goStage, fightBoss, bossEase, bossReady, levelUp, starUp, setTeam, buySlot, buyUp, buyShop, addMon,
    featured, featuredEpic, featuredLegend, ballAvailable, ticketCost, ticketPrice, buyTicket, dustTicket, giveTickets, pull, freePull, freePullReady, toggleShiny, moveOf, tierOf, unsetTeam, setPaused, itemOf, itemVal, itemDmg, equip, unequip, recycleItem, recycleSpare, buyItem, synergies, synMult, teamItemSum,
    checkDaily, dailyReward, claimDaily, questProg, claimQuest, achStat, claimAch, pendingRewards, legendsOwned,
    prestige, offline, start,
  };
})();
if (typeof module !== 'undefined') module.exports = Core;
