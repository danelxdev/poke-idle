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
    RAR[p.dex] = RARITY_FIX[b] || (DEX[b].leg ? 5 : f >= 525 ? 4 : f >= 491 ? 3 : f >= 456 ? 2 : 1);
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
  let S = null;
  function fresh() {
    return {
      v: 1, started: false, coins: 0, gems: 50, dust: 0, stage: 1, maxStage: 1, kills: 0, auto: true,
      team: [], slots: 1, mons: {}, seen: {},
      up: { tap: 0, train: 0, coin: 0, crit: 0, critdmg: 0, speed: 0, catch: 0, golden: 0, bosstime: 0, type: 0, boss: 0, autotap: 0, alch: 0 },
      shop: { dmg: 0, coins: 0, lvl: 0, slots: 0, offline: 0, catch: 0, shiny: 0, gems: 0, skill: 0, dust: 0, tapd: 0, critb: 0, disc: 0, bt: 0 },
      medals: 0, mp: 0, badges: {}, bossFirst: {},
      sk: { rage: 0, gold: 0, lure: 0 },        // instante (tiempo jugado) en el que está lista cada habilidad
      skOn: { rage: 0, gold: 0, lure: 0 },      // instante en el que termina cada habilidad
      stats: { kills: 0, taps: 0, pulls: 0, levels: 0, bosses: 0, catches: 0, evolutions: 0, shinies: 0, prestiges: 0, coinsTotal: 0, time: 0, maxStage: 1, maxStars: 0, stages: 0, skills: 0, dust: 0, crits: 0, goldens: 0, dustBuys: 0, freePulls: 0, streak: 0 },
      pity: 0, pityE: 0, bannerLost: 0, freeDay: '', autoAcc: 0, last: Date.now(),
      daily: { day: '', streak: 0, claimed: true, quests: [] }, weekly: { week: -1, quests: [] }, ach: {},
      buyMul: 1, settings: { music: 0.35, sfx: 0.6, nums: true },
    };
  }
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    const f = fresh();
    if (!d || typeof d !== 'object' || d.v !== 1) d = f;
    for (const k of Object.keys(f)) if (d[k] === undefined) d[k] = f[k];
    for (const g of ['up', 'stats', 'settings', 'shop', 'sk', 'skOn']) for (const k of Object.keys(f[g])) if (d[g][k] === undefined) d[g][k] = f[g][k];
    if (typeof d.badges !== 'object' || d.badges === null) d.badges = {};
    for (const k of Object.keys(d.mons)) if (!DEX[d.mons[k].dex]) delete d.mons[k];
    // partidas antiguas: la base de algunas líneas cambió al añadir bebés (Pichu, Cleffa…)
    for (const k of Object.keys(d.mons)) {
      const b = String(baseOf(d.mons[k].dex));
      if (b !== k && !d.mons[b]) { d.mons[b] = d.mons[k]; delete d.mons[k]; d.team = d.team.map(t => String(t) === k ? b : t); }
    }
    d.team = d.team.map(String).filter((k, i, a) => d.mons[k] && a.indexOf(k) === i);
    if (d.stats.maxStage < d.maxStage) d.stats.maxStage = d.maxStage;
    S = d;
    resetFight();
    return S;
  }
  function save() { if (!S) return; S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin espacio */ } }
  function wipe() { S = fresh(); resetFight(); save(); }

  // ---------------- fórmulas ----------------
  // hpB/hpG = vida del enemigo (base y crecimiento por etapa) · coinR = monedas por vida · lvlG = crecimiento del coste de nivel
  const K = { hpB: 100, hpG: 1.17, hpL: 6, coinR: 0.0012, cd: 0.99, cf: 0.5, cs: 0.12, lvlG: 1.15, dG: 1.075 };
  const route = s => Math.floor((s - 1) / 10);
  const routeIdx = s => route(s) % ROUTES.length;
  const routeData = s => ROUTES[routeIdx(s)];
  const regionOfRoute = ri => { let r = 0; for (let i = 0; i < REGIONS.length; i++) if (ri >= REGIONS[i].first) r = i; return r; };
  const regionOf = s => regionOfRoute(routeIdx(s));
  const loopOf = s => Math.floor(route(s) / ROUTES.length);
  const isBoss = s => s % 10 === 0;
  const bossTier = s => BOSS_TIER[routeData(s).boss.tier];
  const bossTime = s => bossTier(s).time + 3 * S.up.bosstime + 2 * S.shop.bt;
  const enemyHp = s => Math.round(K.hpB * Math.pow(K.hpG, s - 1) + K.hpL * s) * (isBoss(s) ? bossTier(s).hp : 1);
  const skillOn = id => S.skOn[id] > S.stats.time;
  const medalMult = () => 1 + 0.03 * S.medals;
  const coinMult = () => (1 + 0.15 * S.up.coin) * medalMult() * (1 + 0.06 * S.shop.coins) * (skillOn('gold') ? 3 : 1);
  const killCoins = s => Math.ceil(((K.hpB * Math.pow(K.hpG, s - 1) + K.hpL * s) * K.coinR * Math.pow(K.cd, s) + K.cf + s * K.cs) * coinMult() * (isBoss(s) ? 6 : 1));
  const dexCount = () => Object.keys(S.seen).length;
  const badgeCount = () => Object.keys(S.badges).length;
  const gemMult = () => 1 + 0.1 * S.shop.gems;
  const globalDmg = () => (1 + 0.1 * S.up.train) * medalMult() * (1 + 0.06 * S.shop.dmg) * (1 + 0.01 * dexCount()) * (1 + 0.03 * badgeCount()) * (skillOn('rage') ? 3 : 1);
  const lvlMult = l => Math.pow(K.dG, l - 1) * Math.pow(2, Math.floor(l / 25));
  const power = d => Math.pow(bst(d) / 100, 2);
  function monDmg(m) { return power(m.dex) * RAR_MULT[RAR[m.dex]] * lvlMult(m.lvl) * STAR_MULT[m.stars] * (m.shiny ? 1.5 : 1) * globalDmg(); }
  function monRate(m) { const spe = DEX[m.dex].stats.spe; return Math.max(0.55, 1.25 - spe / 260) / (1 + 0.04 * S.up.speed); }
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
  const critChance = () => 0.03 + 0.02 * S.up.crit + 0.01 * S.shop.critb;
  const critMult = () => 3 + 0.25 * S.up.critdmg;
  const catchChance = () => (0.015 + 0.005 * S.up.catch + 0.004 * S.shop.catch) * (skillOn('lure') ? 6 : 1);
  const goldenChance = () => 1 / 120 + 0.002 * S.up.golden;
  const shinyRate = () => SHINY_RATE * (1 + 0.2 * S.shop.shiny);
  function teamDps(defTypes) {
    let d = 0;
    for (const k of S.team) { const m = S.mons[k]; d += monDmg(m) / monRate(m) * (defTypes ? eff(m.dex, defTypes) : 1); }
    return d * (1 + critChance() * (critMult() - 1));
  }
  const bossBonus = e => (e && e.boss ? 1 + 0.04 * S.up.boss : 1);
  const tapDmg = () => (1 + 3 * S.up.tap + teamDps() * (0.15 + 0.01 * S.up.tap)) * (1 + 0.1 * S.shop.tapd);
  const medalFor = ms => ms < 60 ? 0 : Math.max(1, Math.floor(Math.pow((ms - 45) / 12, 1.4)));
  const medalGain = () => medalFor(S.maxStage);
  const genUnlocked = g => g <= 1 || S.stats.maxStage > REGIONS[g - 1].first * 10;
  const unlockedGens = () => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(genUnlocked);

  // ---------------- combate ----------------
  const F = { enemy: null, timers: [], hits: [], respawn: 0, bossT: 0 };
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

  function deal(dmg, crit, src) {
    const e = F.enemy;
    if (!e || e.hp <= 0) return;
    e.hp -= dmg;
    if (crit) S.stats.crits++;
    emit('hit', { dmg, crit, src });
    if (e.hp <= 0) kill();
  }
  function kill() {
    const e = F.enemy, s = e.stage;
    const coins = killCoins(s) * (e.golden ? 5 : 1);
    S.coins += coins; S.stats.coinsTotal += coins; S.stats.kills++;
    let gems = e.golden ? 3 : 0;
    if (e.golden) S.stats.goldens++;
    if (e.boss) {
      S.stats.bosses++;
      const t = BOSS_TIER[e.tier];
      if (!S.bossFirst[s]) { S.bossFirst[s] = 1; gems += Math.round(t.gems * gemMult()); }
      else gems += Math.round((2 + e.tier) * gemMult());
      if (e.tier === 1) S.badges[s] = 1;
    }
    S.gems += gems;
    let caught = null;
    if (!e.boss && rnd() < catchChance() * (e.golden ? 10 : 1)) { caught = addMon(baseOf(e.dex), e.golden || rnd() < shinyRate()); S.stats.catches++; }
    emit('kill', { enemy: e, coins, gems, caught });
    F.enemy = null; F.respawn = 0.45; F.hits = [];
    if (e.boss) { advance(true); emit('bossWin', e); }
    else {
      S.kills++;
      if (S.kills >= 10 && S.auto) advance(false);
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
    S.stage = s; S.kills = 0; F.enemy = null; F.respawn = 0.3;
    emit('stage', S.stage);
  }
  function bossFail() {
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
    if (!S || !S.started) return;
    S.stats.time += dt;
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
        const crit = rnd() < critChance();
        const ef = eff(m.dex, e.types);
        const dmg = monDmg(m) * ef * (crit ? critMult() : 1) * (0.9 + rnd() * 0.2) * bossBonus(e);
        F.hits.push({ t: 0.22, dmg, crit, slot: i, eff: ef });
        emit('fire', { slot: i, dex: m.dex, delay: 0.22 });
      }
    }
    for (let j = F.hits.length - 1; j >= 0; j--) {
      const h = F.hits[j];
      h.t -= dt;
      if (h.t <= 0) { F.hits.splice(j, 1); deal(h.dmg, h.crit, h.slot); if (!F.enemy) break; }
    }
  }

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
    let m = S.mons[base], isNew = false, dust = 0;
    const rar = RAR[base];
    if (!m) { m = S.mons[base] = { dex: base, lvl: 1 + 3 * S.shop.lvl, stars: 0, copies: 0, shiny: !!shiny }; isNew = true; }
    else {
      m.copies++;
      dust = Math.round(DUST_GAIN[rar] * (1 + 0.1 * S.up.alch + 0.15 * S.shop.dust));
      S.dust += dust; S.stats.dust += dust;
      if (shiny && !m.shiny) m.shiny = true;
    }
    if (shiny) S.stats.shinies++;
    S.seen[base] = 1;
    if (isNew && S.team.length < S.slots) S.team.push(String(base));
    return { base, dex: m.dex, isNew, shiny: !!shiny, rar, dust };
  }
  function levelUp(key, n) {
    const m = S.mons[key];
    if (n === 'max') n = maxAffordable(m).n;
    if (!n) return false;
    const c = levelCostN(m, n);
    if (c > S.coins) return false;
    S.coins -= c; m.lvl += n; S.stats.levels += n;
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
  function ballPrice(id, n) {
    const b = BALLS[id], one = b.cur === 'coins' ? pokeBallPrice() : b.price;
    return n >= 10 ? one * 9 : one * n;
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
    const cost = free ? 0 : ballPrice(id, n);
    if (S[b.cur] < cost) return null;
    S[b.cur] -= cost;
    const out = [];
    for (let i = 0; i < n; i++) {
      let rar = rollRarity(b.rates);
      if (b.cur === 'gems') {
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
  function dustCost(base) { return DUST_COST[RAR[base]]; }
  function dustBuy(base) {
    if (S.mons[base] || !genUnlocked(DEX[base].gen) || baseOf(base) !== base) return null;
    const c = dustCost(base);
    if (S.dust < c) return null;
    S.dust -= c; S.stats.dustBuys++;
    return addMon(base, false);
  }

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
  function claimDaily() { if (S.daily.claimed) return 0; S.daily.claimed = true; const g = dailyReward(); S.gems += g; return g; }
  const questProg = q => Math.min(q.goal, (S.stats[q.stat] || 0) - q.base);
  function claimQuest(i, weekly) {
    const q = (weekly ? S.weekly : S.daily).quests[i];
    if (!q || q.claimed || questProg(q) < q.goal) return 0;
    q.claimed = true;
    const g = Math.round(q.reward * gemMult()); S.gems += g; return g;
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
  function claimAch(id) { const a = ACHIEVEMENTS.find(x => x.id === id); if (!a || S.ach[id] || achStat(a) < a.goal) return 0; S.ach[id] = 1; S.gems += a.reward; return a.reward; }
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
    S.coins = 0; S.stage = 1; S.maxStage = 1; S.kills = 0; S.badges = {}; S.auto = true; S.slots = Math.min(S.slots, 2 + S.shop.slots);
    for (const k of Object.keys(S.up)) S.up[k] = 0;
    for (const m of Object.values(S.mons)) m.lvl = 1 + 3 * S.shop.lvl;
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
    K, DEX, CHILDREN, RAR, POOLG, BASES, bst, baseOf, stageOf, fmt, on, emit, F,
    get S() { return S; }, load, save, wipe, fresh, setRng(f) { rnd = f; },
    route, routeIdx, routeData, regionOf, regionOfRoute, loopOf, isBoss, bossTier, bossTime, enemyHp, killCoins, coinMult, globalDmg, monDmg, monRate, eff,
    levelCost, levelCostN, maxAffordable, upCost, shopCost, pokeBallPrice, critChance, critMult, catchChance, teamDps, tapDmg, medalGain, medalFor, dexCount, badgeCount,
    genUnlocked, unlockedGens, skillOn, skillReady, useSkill, goldenChance, gemMult,
    tick, tap, advance, goStage, fightBoss, levelUp, starUp, setTeam, buySlot, buyUp, buyShop, addMon,
    featured, featuredEpic, featuredLegend, ballAvailable, ballPrice, pull, freePull, freePullReady, dustCost, dustBuy,
    checkDaily, dailyReward, claimDaily, questProg, claimQuest, achStat, claimAch, pendingRewards, legendsOwned,
    prestige, offline, start,
  };
})();
if (typeof module !== 'undefined') module.exports = Core;
