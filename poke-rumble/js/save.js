// Partida guardada (colección de Pokémon amigos, estadísticas y ajustes)
'use strict';

const Save = {
  KEY: 'pokemazmorra.save.v1',
  d: null,
  fresh() {
    return {
      v: 1,
      collection: {},   // clave dex(+s) -> { dex, shiny, moves, power, lvl, count }
      seen: {},         // dex -> 1
      leader: null,     // clave de la colección
      stats: { runs: 0, wins: 0, bestFloor: 0, befriended: 0, kills: 0, shinies: 0, bosses: 0 },
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
    for (const k of Object.keys(d.collection)) if (!Sprites.DEX[d.collection[k].dex]) delete d.collection[k];
    if (d.leader && !d.collection[d.leader]) d.leader = Object.keys(d.collection)[0] || null;
    this.d = d;
    return d;
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) { /* sin espacio */ } },
  reset() { this.d = this.fresh(); this.save(); },
  keyOf(m) { return m.dex + (m.shiny ? 's' : ''); },
  // Añade un amigo a la colección. Devuelve { isNew, better }
  addFriend(m) {
    const k = this.keyOf(m), c = this.d.collection[k];
    this.d.seen[m.dex] = 1;
    if (!c) {
      this.d.collection[k] = { dex: m.dex, shiny: !!m.shiny, moves: m.moves.slice(), power: m.power, lvl: m.lvl, count: 1 };
      return { isNew: true, better: true };
    }
    c.count++;
    if (m.power > c.power) { c.power = m.power; c.moves = m.moves.slice(); c.lvl = m.lvl; return { isNew: false, better: true }; }
    return { isNew: false, better: false };
  },
};
