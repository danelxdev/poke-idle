// Partida guardada en localStorage
'use strict';

const Save = {
  KEY: 'dbsurvivor.save.v1',
  d: null,

  fresh() {
    return {
      v: 1, created: Date.now(),
      zeni: 300,
      owned: {}, shiny: {},
      partner: null, partnerShiny: false,
      starter: null, personality: null,
      pupg: {}, forms: {},
      tickets: { t1: 5, t10: 0 },
      pity: {},
      legends: {}, arenas: {}, itemsFound: {}, evoMoves: {},
      ach: {}, missions: {},
      balls: [],
      profile: { title: '', name: 'Guerrero' },
      stats: { runs: 0, kills: 0, bosses: 0, bestTime: 0, bestLevel: 0, pulls: 0, evos: 0, rifts: 0, transforms: 0, wishes: 0, zeniEarned: 0 },
      ranking: [],
      daily: { last: '', streak: 0 },
      settings: { music: 0.4, sfx: 0.7, dmgNums: true, shake: true },
    };
  },

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { d = null; }
    const f = this.fresh();
    if (!d || typeof d !== 'object') d = f;
    for (const k of Object.keys(f)) if (d[k] === undefined) d[k] = f[k];
    for (const k of Object.keys(f.stats)) if (d.stats[k] === undefined) d.stats[k] = 0;
    for (const k of Object.keys(f.settings)) if (d.settings[k] === undefined) d.settings[k] = f.settings[k];
    // limpia ids que ya no existan
    for (const k of Object.keys(d.owned)) if (!CHAR_BY[k]) delete d.owned[k];
    for (const k of Object.keys(d.shiny)) if (!CHAR_BY[k]) delete d.shiny[k];
    if (d.partner && !CHAR_BY[d.partner]) d.partner = null;
    this.d = d;
    this.refreshMissions();
    return d;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { /* almacenamiento lleno o bloqueado */ }
  },

  reset() {
    this.d = this.fresh();
    this.refreshMissions();
    this.save();
  },

  // Añade un personaje. Devuelve {isNew, shinyNew, dupZeni}
  addChar(id, shiny) {
    const d = this.d, c = CHAR_BY[id];
    const res = { isNew: false, shinyNew: false, dupZeni: 0 };
    if (!d.owned[id]) { d.owned[id] = { at: Date.now() }; res.isNew = true; }
    if (shiny) {
      if (!d.shiny[id]) { d.shiny[id] = 1; res.shinyNew = true; }
      else res.dupZeni = [0, 30, 60, 120, 300, 800][c.r] * 3;
    } else if (!res.isNew) {
      res.dupZeni = [0, 30, 60, 120, 300, 800][c.r];
    }
    d.zeni += res.dupZeni;
    return res;
  },

  give(r) {
    if (!r) return;
    if (r.zeni) this.d.zeni += r.zeni;
    if (r.t1) this.d.tickets.t1 += r.t1;
    if (r.t10) this.d.tickets.t10 += r.t10;
  },

  rewardText(r) {
    const p = [];
    if (r.zeni) p.push(r.zeni.toLocaleString('es') + ' zeni');
    if (r.t1) p.push(r.t1 + ' ticket' + (r.t1 > 1 ? 's' : ''));
    if (r.t10) p.push(r.t10 + ' ticket' + (r.t10 > 1 ? 's' : '') + ' ×10');
    return p.join(' · ');
  },

  pupg(id) {
    if (!this.d.pupg[id]) this.d.pupg[id] = {};
    return this.d.pupg[id];
  },

  formsUnlocked(id) {
    return this.d.forms[id] || 0; // número de formas desbloqueadas (la 1ª es gratis)
  },

  // ---- misiones ----
  dayKey(t) { const d = new Date(t || Date.now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); },
  weekKey() {
    const d = new Date(); const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return 'w' + this.dayKey(d.getTime());
  },
  refreshMissions() {
    const m = this.d.missions;
    const pick = (pool, n, seed) => {
      const arr = pool.slice();
      let s = seed;
      const out = [];
      while (out.length < n && arr.length) {
        s = (s * 9301 + 49297) % 233280;
        const i = Math.floor((s / 233280) * arr.length);
        const def = arr.splice(i, 1)[0];
        const goal = def.goals[s % def.goals.length];
        out.push({ id: def.id, goal: goal * (def.mul || 1), prog: 0, claimed: false });
      }
      return out;
    };
    const dk = this.dayKey(), wk = this.weekKey();
    const seedOf = k => k.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100000, 7);
    if (m.dayKey !== dk) { m.dayKey = dk; m.daily = pick(MISSION_POOL.daily, 3, seedOf(dk)); }
    if (m.weekKey !== wk) { m.weekKey = wk; m.weekly = pick(MISSION_POOL.weekly, 3, seedOf(wk)); }
  },
  missionDef(id) {
    return MISSION_POOL.daily.find(x => x.id === id) || MISSION_POOL.weekly.find(x => x.id === id);
  },
  // Registra progreso de una estadística (acumulativa) en las misiones
  track(stat, v, best) {
    const m = this.d.missions;
    for (const list of [m.daily || [], m.weekly || []]) for (const mi of list) {
      const def = this.missionDef(mi.id);
      if (!def || def.stat !== stat) continue;
      if (def.best || best) mi.prog = Math.max(mi.prog, v);
      else mi.prog += v;
    }
  },

  // ---- logros ----
  pendingAch() {
    return ACH.filter(a => !this.d.ach[a.id] && a.value(this.d) >= a.goal);
  },

  addRanking(entry) {
    const r = this.d.ranking;
    r.push(entry);
    r.sort((a, b) => b.time - a.time || b.kills - a.kills);
    r.length = Math.min(r.length, 15);
  },
};
