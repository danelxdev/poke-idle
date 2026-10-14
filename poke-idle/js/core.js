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
  const POOL = [null, [], [], [], [], []];
  for (const d of BASES) POOL[RAR[d]].push(d);

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
      v: 1, started: false, coins: 0, gems: 50, stage: 1, maxStage: 1, kills: 0, auto: true,
      team: [], slots: 1, mons: {}, seen: {},
      up: { tap: 0, train: 0, coin: 0, crit: 0, speed: 0, catch: 0 },
      medals: 0, badges: 0, bossFirst: {},
      stats: { kills: 0, taps: 0, pulls: 0, levels: 0, bosses: 0, catches: 0, evolutions: 0, shinies: 0, prestiges: 0, coinsTotal: 0, time: 0, maxStage: 1 },
      pity: 0, last: Date.now(), daily: { day: '', streak: 0, claimed: true, quests: [] }, ach: {},
      buyMul: 1, settings: { music: 0.35, sfx: 0.6, nums: true },
    };
  }
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    const f = fresh();
    if (!d || typeof d !== 'object' || d.v !== 1) d = f;
    for (const k of Object.keys(f)) if (d[k] === undefined) d[k] = f[k];
    for (const g of ['up', 'stats', 'settings']) for (const k of Object.keys(f[g])) if (d[g][k] === undefined) d[g][k] = f[g][k];
    for (const k of Object.keys(d.mons)) if (!DEX[d.mons[k].dex]) delete d.mons[k];
    d.team = d.team.map(String).filter(k => d.mons[k]);
    S = d;
    resetFight();
    return S;
  }
  function save() { if (!S) return; S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin espacio */ } }
  function wipe() { S = fresh(); resetFight(); save(); }

  // ---------------- fórmulas ----------------
  // hpG = crecimiento de PS por etapa · coinR = monedas por PS del enemigo · lvlG = crecimiento del coste de nivel
  const K = { hpB: 100, hpG: 1.18, coinR: 0.006, lvlG: 1.09 };
  const route = s => Math.floor((s - 1) / 10);
  const routeData = s => ROUTES[route(s) % ROUTES.length];
  const loopOf = s => Math.floor(route(s) / ROUTES.length);
  const isBoss = s => s % 10 === 0;
  const enemyHp = s => Math.round(K.hpB * Math.pow(K.hpG, s - 1) + 6 * s) * (isBoss(s) ? 9 : 1);
  const coinMult = () => (1 + 0.15 * S.up.coin) * (1 + 0.1 * S.medals);
  const killCoins = s => Math.ceil(((K.hpB * Math.pow(K.hpG, s - 1) + 6 * s) * K.coinR + 1 + s * 0.4) * coinMult() * (isBoss(s) ? 6 : 1));
  const dexCount = () => Object.keys(S.seen).length;
  const globalDmg = () => (1 + 0.1 * S.up.train) * (1 + 0.1 * S.medals) * (1 + 0.01 * dexCount()) * (1 + 0.05 * S.badges);
  const lvlMult = l => l * Math.pow(2, Math.floor(l / 25));
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
    return Math.min(2.5, Math.max(0.5, best));
  }
  const levelCost = (m, l) => Math.ceil(6 * RAR_COST[RAR[m.dex]] * Math.pow(K.lvlG, l - 1));
  function levelCostN(m, n) { let c = 0; for (let i = 0; i < n; i++) c += levelCost(m, m.lvl + i); return c; }
  function maxAffordable(m) { let n = 0, c = 0; while (n < 1000) { const k = levelCost(m, m.lvl + n); if (c + k > S.coins) break; c += k; n++; } return { n, c }; }
  const upCost = id => Math.ceil(UPGRADES[id].base * Math.pow(UPGRADES[id].mul, S.up[id]));
  const pokeBallPrice = () => Math.ceil(30 * Math.pow(1.2, S.maxStage - 1));
  const critChance = () => 0.03 + 0.02 * S.up.crit;
  const catchChance = () => 0.015 + 0.005 * S.up.catch;
  function teamDps(defTypes) {
    let d = 0;
    for (const k of S.team) { const m = S.mons[k]; d += monDmg(m) / monRate(m) * (defTypes ? eff(m.dex, defTypes) : 1); }
    return d * (1 + critChance() * 2);
  }
  const tapDmg = () => 1 + 3 * S.up.tap + teamDps() * (0.15 + 0.01 * S.up.tap);
  function medalGain() { return S.maxStage < 60 ? 0 : Math.floor(Math.pow((S.maxStage - 40) / 10, 1.7)); }

  // ---------------- combate ----------------
  const F = { enemy: null, timers: [], hits: [], respawn: 0, bossT: 0, failed: false };
  function pickWild(s) {
    const r = routeData(s), lp = loopOf(s), rt = route(s);
    const maxStage = lp > 0 || rt >= 7 ? 2 : rt >= 3 ? 1 : 0;
    const pool = POKEDEX.filter(p => !p.leg && p.types.some(t => r.types.includes(t)) && stageOf(p.dex) <= maxStage && (stageOf(p.dex) >= maxStage - 1 || rt < 3));
    return pool[Math.floor(rnd() * pool.length)].dex;
  }
  function spawn() {
    const s = S.stage, boss = isBoss(s);
    const r = routeData(s);
    const dex = boss ? r.boss.dex : pickWild(s);
    const golden = !boss && rnd() < 1 / 120;
    const hp = enemyHp(s) * (golden ? 3 : 1);
    F.enemy = { dex, hp, max: hp, boss, golden, types: DEX[dex].types, stage: s };
    F.bossT = boss ? 30 : 0;
    F.timers = S.team.map((k, i) => 0.2 + i * 0.13);
    F.hits = [];
    emit('spawn', F.enemy);
  }
  function resetFight() { F.enemy = null; F.respawn = 0.3; F.hits = []; F.timers = []; }

  function deal(dmg, crit, src) {
    const e = F.enemy;
    if (!e || e.hp <= 0) return;
    e.hp -= dmg;
    emit('hit', { dmg, crit, src });
    if (e.hp <= 0) kill();
  }
  function kill() {
    const e = F.enemy, s = e.stage;
    let coins = killCoins(s) * (e.golden ? 5 : 1);
    S.coins += coins; S.stats.coinsTotal += coins; S.stats.kills++;
    let gems = e.golden ? 3 : 0;
    if (e.boss) {
      S.stats.bosses++;
      if (!S.bossFirst[s]) { S.bossFirst[s] = 1; gems += 10 + 5 * Math.floor(s / 10); }
      if (s <= 80) S.badges = Math.max(S.badges, s / 10);
    }
    S.gems += gems;
    let caught = null;
    if (!e.boss && rnd() < catchChance() * (e.golden ? 10 : 1)) { caught = addMon(baseOf(e.dex), e.golden || rnd() < SHINY_RATE); S.stats.catches++; }
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
    S.stage++; S.kills = 0;
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

  function tap() {
    const e = F.enemy;
    if (!e || e.hp <= 0) return null;
    S.stats.taps++;
    const crit = rnd() < critChance();
    const dmg = tapDmg() * (crit ? 3 : 1);
    deal(dmg, crit, -1);
    return { dmg, crit };
  }

  function tick(dt) {
    if (!S || !S.started) return;
    S.stats.time += dt;
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
        const dmg = monDmg(m) * ef * (crit ? 3 : 1) * (0.9 + rnd() * 0.2);
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

  // ---------------- Pokémon ----------------
  function addMon(base, shiny) {
    let m = S.mons[base], isNew = false;
    if (!m) { m = S.mons[base] = { dex: base, lvl: 1, stars: 0, copies: 0, shiny: !!shiny }; isNew = true; }
    else { m.copies++; if (shiny && !m.shiny) { m.shiny = true; } }
    if (shiny) S.stats.shinies++;
    S.seen[base] = 1;
    if (isNew && S.team.length < S.slots) S.team.push(String(base));
    return { base, dex: m.dex, isNew, shiny: !!shiny, rar: RAR[base] };
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

  // ---------------- gacha ----------------
  function featured() {
    const pool = POOL[4].concat(POOL[5]);
    return pool[dayIndex() % pool.length];
  }
  function ballPrice(id, n) {
    const b = BALLS[id], one = b.cur === 'coins' ? pokeBallPrice() : b.price;
    return n >= 10 ? one * 9 : one * n;
  }
  function rollRarity(rates) {
    let r = rnd() * 100;
    for (let k = 1; k <= 5; k++) { r -= rates[k]; if (r < 0) return k; }
    return 1;
  }
  function pull(id, n) {
    const b = BALLS[id], cost = ballPrice(id, n);
    if (S[b.cur] < cost) return null;
    S[b.cur] -= cost;
    const out = [];
    for (let i = 0; i < n; i++) {
      let rar = rollRarity(b.rates);
      if (b.cur === 'gems') { S.pity++; if (S.pity >= PITY) rar = 5; }
      if (n >= 10 && i === n - 1 && !out.some(o => o.rar >= 3)) rar = Math.max(rar, 3);
      if (rar === 5 && b.cur === 'gems') S.pity = 0;
      const fd = featured();
      const dex = RAR[fd] === rar && rnd() < 0.5 ? fd : POOL[rar][Math.floor(rnd() * POOL[rar].length)];
      out.push(addMon(dex, rnd() < SHINY_RATE));
    }
    S.stats.pulls += n;
    return out;
  }

  // ---------------- diarias, misiones y logros ----------------
  function checkDaily() {
    const d = today();
    if (S.daily.day === d) return false;
    const prev = new Date(); prev.setDate(prev.getDate() - 1);
    const y = prev.getFullYear() + '-' + (prev.getMonth() + 1) + '-' + prev.getDate();
    S.daily.streak = S.daily.day === y ? S.daily.streak + 1 : 1;
    S.daily.day = d; S.daily.claimed = false;
    const pool = QUEST_POOL.slice(), qs = [];
    while (qs.length < 3) { const q = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; qs.push({ stat: q.stat, goal: q.goal, reward: q.reward, base: S.stats[q.stat] || 0, claimed: false, text: q.text(q.goal) }); }
    S.daily.quests = qs;
    return true;
  }
  function dailyReward() { return DAILY_REWARD[(S.daily.streak - 1) % 7]; }
  function claimDaily() { if (S.daily.claimed) return 0; S.daily.claimed = true; const g = dailyReward(); S.gems += g; return g; }
  const questProg = q => Math.min(q.goal, (S.stats[q.stat] || 0) - q.base);
  function claimQuest(i) { const q = S.daily.quests[i]; if (!q || q.claimed || questProg(q) < q.goal) return 0; q.claimed = true; S.gems += q.reward; return q.reward; }
  function achStat(a) { return a.stat === 'dex' ? dexCount() : S.stats[a.stat] || 0; }
  function claimAch(id) { const a = ACHIEVEMENTS.find(x => x.id === id); if (!a || S.ach[id] || achStat(a) < a.goal) return 0; S.ach[id] = 1; S.gems += a.reward; return a.reward; }
  function pendingRewards() {
    let n = S.daily.quests.filter(q => !q.claimed && questProg(q) >= q.goal).length;
    n += ACHIEVEMENTS.filter(a => !S.ach[a.id] && achStat(a) >= a.goal).length;
    return n;
  }

  // ---------------- Liga (prestigio) ----------------
  function prestige() {
    const g = medalGain();
    if (!g) return 0;
    S.medals += g; S.stats.prestiges++;
    S.coins = 0; S.stage = 1; S.maxStage = 1; S.kills = 0; S.badges = 0; S.auto = true; S.slots = Math.max(1, S.slots - 3);
    for (const k of Object.keys(S.up)) S.up[k] = 0;
    for (const m of Object.values(S.mons)) m.lvl = 1;
    S.team = S.team.slice(0, S.slots);
    resetFight();
    return g;
  }

  // ---------------- tiempo fuera ----------------
  function offline() {
    const secs = Math.min(8 * 3600, (Date.now() - (S.last || Date.now())) / 1000);
    S.last = Date.now();
    if (secs < 60 || !S.team.length) return null;
    const s = S.stage;
    const ttk = enemyHp(isBoss(s) ? s - 1 : s) / Math.max(1e-9, teamDps()) + 0.45;
    const kills = Math.floor(secs / ttk * 0.5);
    const coins = kills * killCoins(isBoss(s) ? s - 1 : s);
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
    K, DEX, CHILDREN, RAR, POOL, BASES, bst, baseOf, stageOf, fmt, on, emit, F,
    get S() { return S; }, load, save, wipe, fresh, setRng(f) { rnd = f; },
    route, routeData, loopOf, isBoss, enemyHp, killCoins, coinMult, globalDmg, monDmg, monRate, eff, levelCost, levelCostN, maxAffordable,
    upCost, pokeBallPrice, critChance, catchChance, teamDps, tapDmg, medalGain, dexCount,
    tick, tap, advance, goStage, fightBoss, levelUp, starUp, setTeam, buySlot, buyUp, addMon,
    featured, ballPrice, pull, checkDaily, dailyReward, claimDaily, questProg, claimQuest, achStat, claimAch, pendingRewards,
    prestige, offline, start,
  };
})();
if (typeof module !== 'undefined') module.exports = Core;
