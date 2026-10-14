// Motor de combate: run tipo "survivor" con hordas, jefes, grietas y transformaciones.
'use strict';

const Game = (() => {
  // ---------- utilidades ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const d2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  let cv, ctx, VW = 400, VH = 240, SCALE = 3;
  let running = false, lastTs = 0, rafId = 0;
  let G = null; // estado de la run
  const keys = {};
  const joy = { active: false, id: null, sx: 0, sy: 0, x: 0, y: 0 };
  let uid = 1;
  const debug = {};

  // ---------- sprites con destello blanco ----------
  const whiteCache = new WeakMap();
  function whiteOf(c) {
    let w = whiteCache.get(c);
    if (!w) {
      w = document.createElement('canvas'); w.width = c.width; w.height = c.height;
      const g = w.getContext('2d'); g.drawImage(c, 0, 0);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, w.width, w.height);
      whiteCache.set(c, w);
    }
    return w;
  }
  const goldCache = new WeakMap();
  function goldOf(c) {
    let w = goldCache.get(c);
    if (!w) {
      w = document.createElement('canvas'); w.width = c.width; w.height = c.height;
      const g = w.getContext('2d'); g.drawImage(c, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,200,40,0.55)'; g.fillRect(0, 0, w.width, w.height);
      goldCache.set(c, w);
    }
    return w;
  }

  // ---------- rejilla espacial de enemigos ----------
  const CELL = 32;
  const grid = new Map();
  function gridBuild() {
    grid.clear();
    for (const e of G.enemies) {
      if (e.dead) continue;
      const k = ((Math.floor(e.x / CELL) + 5000) * 10000) + (Math.floor(e.y / CELL) + 5000);
      let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(e);
    }
  }
  function query(x, y, r, cb) {
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
    const y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const a = grid.get(((gx + 5000) * 10000) + (gy + 5000));
      if (!a) continue;
      for (const e of a) if (!e.dead) { if (cb(e) === false) return; }
    }
  }
  function nearest(x, y, maxR, exclude) {
    let best = null, bd = maxR * maxR;
    for (const e of G.enemies) {
      if (e.dead || (exclude && exclude.has(e.id))) continue;
      const dd = d2(x, y, e.x, e.y);
      if (dd < bd) { bd = dd; best = e; }
    }
    return best;
  }
  function onScreen(x, y, m) {
    m = m || 0;
    return x > G.cam.x - m && x < G.cam.x + VW + m && y > G.cam.y - m && y < G.cam.y + VH + m;
  }

  // ---------- jugador ----------
  function makePlayer(charId, shiny) {
    const c = CHAR_BY[charId];
    const up = Save.pupg(charId);
    const p = {
      x: 0, y: 0, r: 8, char: c, shiny, atkT: 0,
      face: 1, aim: 0, animT: 0, moving: false, vx: 0, vy: 0,
      slots: [], active: 0,
      statTaken: { hp: 0, atk: 0, spd: 0, cd: 0, def: 0, rgn: 0, mag: 0, xp: 0 },
      buffs: { atk: 0, spd: 0, def: 0, rgn: 0 },
      up, item: null, haloCd: 0, inv: 1.5,
      lvl: 1, xp: 0, xpNext: 5,
      rerolls: 1 + (up.reroll || 0),
      ki: 0, form: null, formT: 0, formIdx: -1,
      dash: null, lifeStealPool: 0, kkCost: 0,
    };
    p.slots.push([{ id: c.move, lvl: 1, evo: false, t: 0.3 }]);
    if (up.moves) {
      const pool = Object.keys(MOVES).filter(m => m !== c.move && MOVES[m].cls !== 'buff');
      p.slots.push([{ id: pick(pool), lvl: 1, evo: false, t: 0.5 }]);
    }
    recalc(p);
    p.hp = p.maxHp;
    return p;
  }
  function recalc(p) {
    const up = p.up, c = p.char, st = p.statTaken;
    const it = p.item;
    const formM = p.form ? p.form.m : 1;
    const moon = G && G.weather === 'moon' && c.saiyan ? 1.25 : 1;
    p.maxHp = Math.round(c.hp + 8 * (up.hp || 0) + 20 * st.hp);
    p.dmgMul = c.atk * (1 + 0.04 * (up.atk || 0)) * Math.pow(1.1, st.atk) * (1 + p.buffs.atk) * formM * moon *
      (it === 'cinturon' ? 1.4 : 1) * (it === 'bandakk' ? 1.3 : 1);
    p.cdMul = (1 - 0.03 * (up.cd || 0)) * Math.pow(0.92, st.cd) * (it === 'brazaletes' ? 0.8 : 1) * (p.form ? 0.85 : 1);
    p.speed = c.spd * 0.72 * (1 + 0.03 * (up.spd || 0)) * Math.pow(1.07, st.spd) * (1 + p.buffs.spd) *
      (it === 'nube' ? 1.35 : 1) * (G && G.weather === 'gravity' ? 0.82 : 1) * (p.form ? 1 + (formM - 1) * 0.2 : 1) *
      (G && G.arena && G.arena.hazard === 'gravity' ? 0.85 : 1);
    p.dr = Math.min(0.75, 0.02 * (up.def || 0) + 0.06 * st.def + p.buffs.def + (it === 'armadura' ? 0.2 : 0) + (p.form ? 0.1 : 0));
    p.regen = 0.2 * (up.regen || 0) + 0.9 * st.rgn + p.buffs.rgn;
    p.magnet = 40 * (1 + 0.12 * (up.magnet || 0)) * (1 + 0.25 * st.mag);
    p.xpMul = (1 + 0.05 * (up.xp || 0)) * (1 + 0.1 * st.xp) * (it === 'pergamino' ? 1.3 : 1);
    p.crit = 0.05 + 0.03 * (up.crit || 0);
    p.kiMul = 1 + 0.1 * (up.ki || 0);
    if (p.hp > p.maxHp) p.hp = p.maxHp;
  }
  function ownedMoveIds(p) { return p.slots.flat().map(m => m.id); }

  // Parámetros efectivos de una técnica según nivel y evolución
  function moveStats(inst) {
    const def = MOVES[inst.id];
    const q = Object.assign({}, def.p);
    const L = inst.lvl - 1;
    const cls = def.cls;
    if (cls !== 'buff') {
      q.dmg *= 1 + 0.25 * L;
      if (q.cd) q.cd *= 1 - 0.06 * L;
    }
    switch (cls) {
      case 'proj': q.count += Math.floor(L / 2); if (inst.lvl >= 4) q.pierce += 1; break;
      case 'fan': q.count += L; break;
      case 'burst': q.count += 2 * L; break;
      case 'beam': q.width *= 1 + 0.08 * L; q.len *= 1 + 0.06 * L; break;
      case 'orbit': q.count += Math.floor(L / 2); q.radius += 2 * L; break;
      case 'aura': q.radius *= 1 + 0.08 * L; break;
      case 'boomerang': if (inst.lvl >= 4) q.count += 1; q.dist *= 1 + 0.06 * L; break;
      case 'chain': q.jumps += L; break;
      case 'meteor': q.count += Math.floor(L / 2); break;
      case 'mines': q.count += Math.floor(L / 2); break;
      case 'turret': if (inst.lvl >= 4) q.max += 1; break;
      case 'bomb': q.radius *= 1 + 0.08 * L; q.size += L; break;
      case 'flash': q.radius *= 1 + 0.07 * L; q.stun += 0.15 * L; break;
      case 'melee': q.range *= 1 + 0.05 * L; break;
      case 'dash': q.dist *= 1 + 0.05 * L; break;
      case 'buff': q.cap *= 1 + 0.15 * L; q.rate *= 1 + 0.15 * L; break;
      default: break;
    }
    if (inst.evo) {
      switch (cls) {
        case 'melee': q.dmg *= 1.9; q.range *= 1.3; q.arc = Math.PI * 2; break;
        case 'dash': q.dmg *= 1.9; q.dist *= 1.4; q.cd *= 0.7; break;
        case 'proj': q.dmg *= 1.8; q.count += 2; q.pierce += 2; q.size += 2; if (q.explode) q.explode *= 1.4; break;
        case 'fan': q.dmg *= 1.7; q.count += 4; q.pierce += 1; break;
        case 'burst': q.dmg *= 1.6; q.count += 6; q.pierce += 1; break;
        case 'beam': q.dmg *= 1.8; q.width *= 1.5; q.len *= 1.5; break;
        case 'orbit': q.dmg *= 1.7; q.count += 2; q.radius *= 1.3; break;
        case 'aura': q.dmg *= 1.8; q.radius *= 1.35; break;
        case 'boomerang': q.dmg *= 1.8; q.count += 1; q.dist *= 1.3; break;
        case 'chain': q.dmg *= 1.7; q.jumps += 3; break;
        case 'meteor': q.dmg *= 1.7; q.count += 2; q.radius *= 1.3; break;
        case 'mines': q.dmg *= 1.8; q.count += 2; q.radius *= 1.4; break;
        case 'trail': q.dmg *= 1.8; q.radius *= 1.5; q.life *= 1.5; break;
        case 'turret': q.dmg *= 1.8; q.max += 1; q.rate *= 0.65; break;
        case 'bomb': q.dmg *= 1.8; q.radius *= 1.6; q.size *= 1.5; break;
        case 'flash': q.dmg *= 1.7; q.radius *= 1.4; q.stun *= 1.4; break;
        default: break;
      }
    }
    if (cls !== 'buff') {
      q.dmg *= G.player.dmgMul;
      if (q.cd) q.cd *= G.player.cdMul;
    }
    return q;
  }
  function moveName(inst) {
    const def = MOVES[inst.id];
    return inst.evo && def.evo ? def.evo.name : def.name;
  }

  // ---------- inicio de run ----------
  function start(charId, shiny) {
    Audio8.resume();
    G = {
      t: 0, phase: -1, kills: 0, bosses: 0, zeni: 0, t1: 0, t10: 0, balls: [], evos: 0, transforms: 0, riftsWon: 0,
      enemies: [], pbul: [], ebul: [], beams: [], fx: [], texts: [], pickups: [], zones: [], turrets: [], props: [], bolts: [],
      cam: { x: 0, y: 0 }, shake: 0, flash: 0, flashColor: '#fff',
      spawnT: 1, eliteT: 60, propT: 20, thiefT: 90, riftT: 150, rift: null, arena: null, mapSave: null,
      weather: null, banner: null, bossRef: null, bossesSpawned: {}, zenoT: 0, paused: false,
      pendingLevels: 0, itemOffer: null, over: false, newShiny: [],
      itemsFound: {}, legendsBeaten: [], timers: [],
    };
    G.player = makePlayer(charId, shiny);
    recalc(G.player);
    G.player.hp = G.player.maxHp;
    resize();
    setPhase(0);
    running = true;
    lastTs = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
    UI.hud.show(G);
    Audio8.music('battle');
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
    G = null;
  }

  function setPhase(ph) {
    if (ph === G.phase) return;
    G.phase = ph;
    const s = SAGAS[ph];
    G.bg = s;
    const w = Math.random();
    G.weather = ph === 0 ? null : (w < 0.2 ? 'moon' : w < 0.35 ? 'gravity' : w < 0.5 ? 'storm' : null);
    recalc(G.player);
    const wtxt = { moon: '🌕 Luna llena: los Saiyan hacen +25% de daño', gravity: '⚖ Gravedad aumentada: todos van más lentos', storm: '⚡ Tormenta de ki: caen rayos sobre los enemigos' }[G.weather];
    showBanner(s.name, wtxt || s.desc);
  }
  function showBanner(title, sub, color) {
    G.banner = { title, sub, t: 3.2, color: color || '#ffd848' };
    UI.hud.banner(title, sub, color);
  }

  // ---------- bucle ----------
  function loop(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    let dt = Math.max(0, (ts - lastTs) / 1000);
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    if (!G.paused && !G.over) update(dt);
    render();
    UI.hud.update(G);
  }

  function pause(v) {
    if (!G || G.over) return;
    G.paused = v;
    if (v) Object.keys(keys).forEach(k => (keys[k] = false));
  }

  function later(sec, fn) { G.timers.push({ t: sec, fn }); }

  function update(dt) {
    const p = G.player;
    G.t += dt;
    if (G.timers.length) {
      for (const tm of G.timers) { tm.t -= dt; if (tm.t <= 0 && !tm.done) { tm.done = true; tm.fn(); } }
      if (G && G.timers) G.timers = G.timers.filter(tm => !tm.done);
    }
    if (!G.arena) {
      const ph = clamp(Math.floor(G.t / 150), 0, 11);
      if (ph !== G.phase) setPhase(ph);
      spawner(dt);
      events(dt);
    }
    updatePlayer(dt);
    gridBuild();
    updateMoves(dt);
    updateEnemies(dt);
    gridBuild();
    updateProjectiles(dt);
    updateBeams(dt);
    updateZones(dt);
    updateTurrets(dt);
    updateEnemyBullets(dt);
    updatePickups(dt);
    updateProps(dt);
    updateFx(dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 12);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    // cámara
    G.cam.x = p.x - VW / 2;
    G.cam.y = p.y - VH / 2;
    if (p.hp <= 0) onPlayerDown();
  }

  // ---------- jugador ----------
  function updatePlayer(dt) {
    const p = G.player;
    let mx = 0, my = 0;
    if (keys.KeyW || keys.ArrowUp) my -= 1;
    if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (joy.active) {
      const dx = joy.x - joy.sx, dy = joy.y - joy.sy, l = Math.hypot(dx, dy);
      if (l > 6) { mx = dx / Math.max(l, 40); my = dy / Math.max(l, 40); }
    }
    if (debug.move) { mx = debug.move[0]; my = debug.move[1]; }
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    p.moving = ml > 0.1;
    if (p.dash) {
      const d = p.dash;
      d.t += dt;
      p.x += d.vx * dt; p.y += d.vy * dt;
      query(p.x, p.y, d.w + 20, e => {
        if (!d.hit.has(e.id) && d2(p.x, p.y, e.x, e.y) < (d.w + e.r) * (d.w + e.r)) {
          d.hit.add(e.id); hitEnemy(e, d.dmg, { kx: d.vx * 0.3, ky: d.vy * 0.3 });
        }
      });
      if (G.fx.length < 600) G.fx.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: 6, color: d.color, ghost: 1, face: p.face });
      if (d.t >= d.dur) p.dash = null;
    } else {
      const ice = G.arena && G.arena.hazard === 'ice';
      const tx = mx * p.speed, ty = my * p.speed;
      if (ice) { p.vx += (tx - p.vx) * Math.min(1, dt * 2.5); p.vy += (ty - p.vy) * Math.min(1, dt * 2.5); }
      else { p.vx = tx; p.vy = ty; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    if (G.arena) { // límites de la arena
      const a = G.arena, dx = p.x - a.cx, dy = p.y - a.cy, l = Math.hypot(dx, dy);
      if (l > a.R - 6) { p.x = a.cx + dx / l * (a.R - 6); p.y = a.cy + dy / l * (a.R - 6); }
    }
    if (Math.abs(mx) > 0.1) p.face = mx > 0 ? 1 : -1;
    p.animT += dt * (p.moving ? 1 : 0.3);
    if (p.inv > 0) p.inv -= dt;
    if (p.atkT > 0) p.atkT -= dt;
    if (p.haloCd > 0) p.haloCd -= dt;
    // regeneración
    let reg = p.regen;
    if (p.item === 'agua') reg += p.maxHp * 0.015;
    if (reg > 0 && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + reg * dt);
    if (p.lifeStealPool > 0) { const h = Math.min(p.lifeStealPool, 6 * dt); p.hp = Math.min(p.maxHp, p.hp + h); p.lifeStealPool -= h; }
    // transformación
    if (p.form) {
      p.formT -= dt;
      p.ki = Math.max(0, (p.formT / 20) * 100);
      if (p.formT <= 0) { p.form = null; p.ki = 0; recalc(p); }
    }
    if (p.form) {
      if (Math.random() < dt * 30) {
        G.fx.push({ x: p.x + rand(-7, 7), y: p.y + rand(-2, 12), vx: 0, vy: rand(-50, -25), life: 0.4, max: 0.4, size: rand(1, 3), color: p.form.a });
      }
      if (p.form.spark && Math.random() < dt * 4) G.bolts.push({ pts: zigzag(p.x + rand(-10, 10), p.y - 14, p.x + rand(-10, 10), p.y + 6, 4), life: 0.12, color: '#9ff' });
    }
    // lava
    if (G.arena && G.arena.hazard === 'lava') {
      for (const z of G.zones) if (z.kind === 'lava' && d2(p.x, p.y, z.x, z.y) < z.r * z.r) damagePlayer(10 * dt * (1 + G.t / 600), null, true);
    }
  }

  function damagePlayer(dmg, src, silent, label) {
    const p = G.player;
    if (p.hp <= 0) return;
    if (!silent && (p.inv > 0 || p.dash)) return;
    dmg *= 1 - p.dr;
    if (debug.dmgLog) { const k = label || (src ? 'contact:' + src.beh : 'other'); debug.dmgLog[k] = (debug.dmgLog[k] || 0) + dmg; }
    if (p.form) p.ki = Math.max(0, p.ki);
    else p.ki = Math.min(100, p.ki + dmg * 0.4 * p.kiMul);
    p.hp -= dmg;
    if (!silent) {
      p.inv = 0.6;
      Audio8.play('hurt');
      if (Save.d.settings.shake) G.shake = Math.min(4, G.shake + 2);
      addText(p.x, p.y - 30, Math.round(dmg), '#ff5050');
      if (src && p.item === 'pinchos') hitEnemy(src, 20 * p.dmgMul, {});
    }
    if (p.hp <= 0 && p.item === 'halo' && p.haloCd <= 0) {
      p.hp = 1; p.haloCd = 60; p.inv = 1.5;
      addText(p.x, p.y - 24, '¡HALO!', '#ffe860');
      G.flash = 0.6; G.flashColor = '#ffe860';
    }
  }

  function onPlayerDown() {
    if (G.arena) { // caes en la grieta: vuelves al mapa
      leaveArena(false);
      return;
    }
    endRun(false);
  }

  // ---------- técnicas ----------
  function updateMoves(dt) {
    const p = G.player;
    if (p.hp <= 0) return;
    const slot = p.slots[p.active];
    // los buffs acumulan mientras están activos
    for (let si = 0; si < p.slots.length; si++) {
      for (const inst of p.slots[si]) {
        const def = MOVES[inst.id];
        if (si !== p.active) { if (inst.t > 0 && def.cls !== 'buff') inst.t = Math.max(inst.t, 0.15); continue; }
        if (def.cls === 'buff') {
          const q = moveStats(inst);
          const prev = p.buffs[q.stat];
          p.buffs[q.stat] = Math.min(q.cap, p.buffs[q.stat] + q.rate * dt);
          if (p.buffs[q.stat] !== prev && Math.floor(prev * 50) !== Math.floor(p.buffs[q.stat] * 50)) recalc(p);
          continue;
        }
        fireMove(inst, dt);
      }
    }
    if (!slot) p.active = 0;
  }

  function aimTarget(range) {
    const p = G.player;
    const e = nearest(p.x, p.y, range || 260);
    if (e) { p.aim = Math.atan2(e.y - p.y, e.x - p.x); p.face = e.x >= p.x ? 1 : -1; }
    return e;
  }

  function fireMove(inst, dt) {
    const p = G.player, def = MOVES[inst.id], cls = def.cls;
    const q = moveStats(inst);
    const col = def.color;
    // clases continuas
    if (cls === 'orbit') return orbitTick(inst, q, dt);
    if (cls === 'aura') return auraTick(inst, q, dt);
    if (cls === 'trail') {
      inst.t -= dt;
      if (inst.t <= 0 && p.moving) {
        inst.t = q.cd;
        G.zones.push({ kind: 'trail', x: p.x, y: p.y + 6, r: q.radius, t: q.life, max: q.life, dmg: q.dmg, tick: q.tick, tt: 0, color: col });
      }
      return;
    }
    inst.t -= dt;
    if (inst.t > 0) return;
    const range = cls === 'beam' ? q.len : cls === 'melee' ? q.range + 30 : 250;
    const tgt = aimTarget(range);
    if (!tgt && cls !== 'mines' && cls !== 'turret' && cls !== 'flash' && cls !== 'burst') { inst.t = 0.1; return; }
    inst.t = q.cd;
    p.atkT = 0.22;
    if (p.item === 'bandakk') { p.hp = Math.max(1, p.hp - p.maxHp * 0.006); }
    const a = p.aim;
    switch (cls) {
      case 'melee': {
        const arc = q.arc;
        query(p.x, p.y, q.range + 12, e => {
          const dist = Math.sqrt(d2(p.x, p.y, e.x, e.y));
          if (dist > q.range + e.r) return;
          if (arc < 6.2 && Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) > arc / 2) return;
          const [nx, ny] = norm(e.x - p.x, e.y - p.y);
          hitEnemy(e, q.dmg, { kx: nx * q.knock, ky: ny * q.knock });
        });
        G.fx.push({ slash: 1, x: p.x, y: p.y, a, arc: Math.min(arc, Math.PI * 2), r: q.range, life: 0.18, max: 0.18, color: col });
        Audio8.play('slash');
        break;
      }
      case 'dash': {
        const sp = q.dist / 0.2;
        p.dash = { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, dur: 0.2, dmg: q.dmg, w: q.width, hit: new Set(), color: col };
        p.inv = Math.max(p.inv, 0.3);
        Audio8.play('dash');
        break;
      }
      case 'proj': {
        const n = q.count;
        for (let i = 0; i < n; i++) {
          let ang = a + (n > 1 ? (i - (n - 1) / 2) * 0.16 : 0);
          let target = tgt;
          if (q.homing && n > 1) { const others = G.enemies.filter(e => !e.dead && onScreen(e.x, e.y)); if (others.length) target = pick(others); }
          G.pbul.push(mkBullet(p.x, p.y - 4, ang, q, col, target));
        }
        Audio8.play('shoot');
        break;
      }
      case 'fan': {
        for (let i = 0; i < q.count; i++) {
          const ang = a + (q.count > 1 ? (i / (q.count - 1) - 0.5) * q.arc : 0) + rand(-0.05, 0.05);
          const b = mkBullet(p.x, p.y - 4, ang, q, col, null); b.vx *= rand(0.85, 1.15); b.vy *= rand(0.85, 1.15);
          G.pbul.push(b);
        }
        Audio8.play('shoot');
        break;
      }
      case 'burst': {
        const off = rand(0, Math.PI * 2);
        for (let i = 0; i < q.count; i++) G.pbul.push(mkBullet(p.x, p.y - 4, off + (i / q.count) * Math.PI * 2, q, col, null));
        G.fx.push({ ring: 1, x: p.x, y: p.y, r: 4, r1: 30, life: 0.3, max: 0.3, color: col });
        Audio8.play('shoot');
        break;
      }
      case 'beam': {
        G.beams.push({ x: p.x, y: p.y - 6, a, len: q.len, w: q.width, t: 0, dur: q.dur, charge: 0.18, dmg: q.dmg, tickT: 0, color: col, follow: true });
        Audio8.play('charge');
        setTimeout(() => Audio8.play('beam'), 150);
        break;
      }
      case 'boomerang': {
        for (let i = 0; i < q.count; i++) {
          const ang = a + (i - (q.count - 1) / 2) * 0.5;
          G.pbul.push({ id: uid++, x: p.x, y: p.y - 4, vx: Math.cos(ang) * q.speed, vy: Math.sin(ang) * q.speed, dmg: q.dmg, r: q.size, color: col,
            boom: 1, out: q.dist, trav: 0, back: false, life: 6, pierce: 999, hit: new Set(), spin: 0 });
        }
        Audio8.play('shoot');
        break;
      }
      case 'chain': {
        const hit = new Set();
        let src = { x: p.x, y: p.y - 4 }, cur = tgt;
        for (let j = 0; j <= q.jumps && cur; j++) {
          hit.add(cur.id);
          G.bolts.push({ pts: zigzag(src.x, src.y, cur.x, cur.y, 5), life: 0.15, color: col });
          hitEnemy(cur, q.dmg * (j === 0 ? 1 : 0.85), {});
          src = cur;
          cur = nearest(cur.x, cur.y, q.range, hit);
        }
        Audio8.play('shoot');
        break;
      }
      case 'meteor': {
        const cands = G.enemies.filter(e => !e.dead && onScreen(e.x, e.y));
        for (let i = 0; i < q.count; i++) {
          const e = cands.length ? pick(cands) : null;
          const x = e ? e.x + rand(-6, 6) : p.x + rand(-80, 80), y = e ? e.y + rand(-6, 6) : p.y + rand(-60, 60);
          G.zones.push({ kind: 'meteor', x, y, r: q.radius, t: 0, delay: q.delay + i * 0.06, dmg: q.dmg, exec: q.exec, color: col, sx: p.x, sy: p.y - 30 });
        }
        break;
      }
      case 'mines': {
        for (let i = 0; i < q.count; i++) {
          const ang = rand(0, Math.PI * 2), r = rand(15, 55);
          G.zones.push({ kind: 'mine', x: p.x + Math.cos(ang) * r, y: p.y + Math.sin(ang) * r, r: q.radius, t: q.life, max: q.life, dmg: q.dmg, color: col, arm: 0.4 });
        }
        break;
      }
      case 'turret': {
        const mine = G.turrets.filter(tu => tu.inst === inst);
        if (mine.length >= q.max) { mine[0].t = q.dur; inst.t = q.cd * 0.5; break; }
        G.turrets.push({ inst, x: p.x + rand(-20, 20), y: p.y + rand(-14, 14), t: q.dur, rate: q.rate, ft: 0, dmg: q.dmg, color: col });
        Audio8.play('select');
        break;
      }
      case 'bomb': {
        const b = mkBullet(p.x, p.y - 20, a, { speed: q.speed, size: q.size, dmg: q.dmg, pierce: 0, life: 4 }, col, tgt);
        b.bomb = q.radius; b.growT = 0.5;
        G.pbul.push(b);
        G.flash = 0.25; G.flashColor = col;
        Audio8.play('charge');
        break;
      }
      case 'flash': {
        query(p.x, p.y, q.radius, e => {
          if (d2(p.x, p.y, e.x, e.y) < q.radius * q.radius) { e.stun = Math.max(e.stun, e.boss ? q.stun * 0.3 : q.stun); hitEnemy(e, q.dmg, {}); }
        });
        G.flash = 0.7; G.flashColor = '#ffffff';
        G.fx.push({ ring: 1, x: p.x, y: p.y, r: 6, r1: q.radius, life: 0.35, max: 0.35, color: '#ffffff' });
        Audio8.play('select');
        break;
      }
      default: break;
    }
  }

  function mkBullet(x, y, ang, q, col, target) {
    return {
      id: uid++, x, y, vx: Math.cos(ang) * q.speed, vy: Math.sin(ang) * q.speed, dmg: q.dmg, r: q.size, color: col,
      pierce: q.pierce || 0, life: q.life || 1.5, homing: q.homing, target, spiral: q.spiral, thin: q.thin,
      explode: q.explode, exec: q.exec, hit: new Set(), spd: q.speed,
    };
  }

  function orbitTick(inst, q, dt) {
    const p = G.player;
    inst.ang = (inst.ang || 0) + q.rot * dt;
    inst.orbs = [];
    for (let i = 0; i < q.count; i++) {
      const a = inst.ang + (i / q.count) * Math.PI * 2;
      const ox = p.x + Math.cos(a) * q.radius, oy = p.y + Math.sin(a) * q.radius * 0.8;
      inst.orbs.push([ox, oy]);
      query(ox, oy, q.size + 10, e => {
        if (d2(ox, oy, e.x, e.y) < (q.size + e.r) * (q.size + e.r) && (e.orbT || 0) <= G.t) {
          e.orbT = G.t + q.hitcd;
          const [nx, ny] = norm(e.x - p.x, e.y - p.y);
          hitEnemy(e, q.dmg, { kx: nx * 40, ky: ny * 40 });
        }
      });
    }
    inst.q = q;
  }
  function auraTick(inst, q, dt) {
    const p = G.player;
    inst.tt = (inst.tt || 0) - dt;
    inst.q = q;
    query(p.x, p.y, q.radius, e => { if (d2(p.x, p.y, e.x, e.y) < q.radius * q.radius) e.slowT = 0.3, e.slowF = q.slow; });
    if (inst.tt > 0) return;
    inst.tt = q.tick * G.player.cdMul;
    query(p.x, p.y, q.radius + 8, e => {
      if (d2(p.x, p.y, e.x, e.y) < (q.radius + e.r) * (q.radius + e.r)) hitEnemy(e, q.dmg, {});
    });
  }

  function zigzag(x0, y0, x1, y1, n) {
    const pts = [[x0, y0]];
    for (let i = 1; i < n; i++) {
      const t = i / n;
      pts.push([x0 + (x1 - x0) * t + rand(-5, 5), y0 + (y1 - y0) * t + rand(-5, 5)]);
    }
    pts.push([x1, y1]);
    return pts;
  }

  // ---------- daño a enemigos ----------
  function hitEnemy(e, dmg, o) {
    if (e.dead) return;
    const p = G.player;
    let crit = Math.random() < p.crit;
    if (crit) dmg *= 1.5;
    dmg *= rand(0.9, 1.1);
    if (o.exec && !e.boss && e.hp / e.maxHp < o.exec) { dmg = e.hp + 1; crit = true; }
    if (e.shield > 0) {
      const s = Math.min(e.shield, dmg);
      e.shield -= s; dmg -= s;
      if (dmg <= 0) { addText(e.x, e.y - 10, 'ESCUDO', '#80c0ff'); return; }
    }
    e.hp -= dmg;
    e.flash = 0.08;
    if (o.kx && !e.boss) { e.kx += o.kx / (e.mass || 1); e.ky += o.ky / (e.mass || 1); }
    if (p.item === 'cola') p.lifeStealPool += dmg * 0.025;
    if (Save.d.settings.dmgNums) addText(e.x + rand(-4, 4), e.y - 26 * (e.sc || 1), Math.round(dmg), crit ? '#ffd040' : '#ffffff', crit);
    Audio8.play('hit');
    if (e.hp <= 0) killEnemy(e);
  }

  function addText(x, y, v, color, big) {
    if (G.texts.length > 70) G.texts.shift();
    G.texts.push({ x, y, v, color, t: 0.7, big });
  }

  // ---------- enemigos ----------
  const BEH = {
    chase: { hp: 14, spd: 32, dmg: 5, xp: 1 },
    fast: { hp: 9, spd: 46, dmg: 4, xp: 1 },
    tank: { hp: 55, spd: 22, dmg: 9, xp: 4, mass: 4 },
    ranged: { hp: 16, spd: 30, dmg: 5, xp: 2 },
    fan: { hp: 18, spd: 28, dmg: 6, xp: 2 },
    beamer: { hp: 22, spd: 26, dmg: 10, xp: 3 },
    healer: { hp: 20, spd: 30, dmg: 5, xp: 3 },
    shielder: { hp: 24, spd: 30, dmg: 6, xp: 3 },
    summoner: { hp: 24, spd: 26, dmg: 6, xp: 3 },
    bomber: { hp: 10, spd: 50, dmg: 22, xp: 2 },
    jumper: { hp: 18, spd: 32, dmg: 8, xp: 2 },
    swarm: { hp: 5, spd: 48, dmg: 4, xp: 1 },
    thief: { hp: 120, spd: 70, dmg: 0, xp: 5 },
  };
  function diff() { const m = G.t / 60; return { hp: 1 + 0.35 * m + 0.022 * m * m, dmg: 1 + 0.1 * m }; }

  function spawnPos(margin) {
    const p = G.player;
    const side = randi(0, 3), m = margin || 20;
    let x, y;
    if (side === 0) { x = G.cam.x + rand(-m, VW + m); y = G.cam.y - m; }
    else if (side === 1) { x = G.cam.x + rand(-m, VW + m); y = G.cam.y + VH + m; }
    else if (side === 2) { x = G.cam.x - m; y = G.cam.y + rand(-m, VH + m); }
    else { x = G.cam.x + VW + m; y = G.cam.y + rand(-m, VH + m); }
    if (!G.cam.x && !G.cam.y) { const a = rand(0, 6.28); x = p.x + Math.cos(a) * 240; y = p.y + Math.sin(a) * 160; }
    return [x, y];
  }

  function spawnMinion(sagaIdx, idx, x, y, opts) {
    const m = MINIONS[sagaIdx][idx];
    const beh = (opts && opts.beh) || m[2];
    const b = BEH[beh];
    const df = diff();
    const look = m[1];
    const sc = (look.sc || 1) * ((opts && opts.scale) || 1);
    const e = {
      id: uid++, x, y, name: m[0], look, key: 'm' + sagaIdx + '_' + idx, beh, sc,
      r: 8 * sc, hp: b.hp * df.hp, spd: b.spd * 1.12 * rand(0.9, 1.1), dmg: b.dmg * df.dmg, xp: b.xp, mass: b.mass || 1,
      t: rand(0, 2), cd: rand(1, 3), stun: 0, slowT: 0, slowF: 0, kx: 0, ky: 0, flash: 0, shield: 0, anim: rand(0, 2), face: 1,
    };
    if (opts) Object.assign(e, opts.extra || {});
    e.maxHp = e.hp;
    G.enemies.push(e);
    return e;
  }

  function spawnBoss(charId, kind) {
    const c = CHAR_BY[charId];
    const df = diff();
    const [x, y] = spawnPos(30);
    const legend = kind === 'legend', final = kind === 'final';
    const base = legend ? 1400 : final ? 700 : 320;
    const hp = base * df.hp * (legend ? 1 + G.t / 900 : 1);
    const e = {
      id: uid++, x: legend ? G.arena.cx + 120 : x, y: legend ? G.arena.cy : y, name: c.name, look: c.look, key: c.id, char: c, beh: 'boss',
      sc: Math.min(2.6, (c.look.sc || 1) * (legend ? 2.1 : final ? 2 : 1.7)), boss: true, legend, final,
      hp, maxHp: hp, spd: legend ? 40 : 30, dmg: (legend ? 18 : final ? 14 : 10) * df.dmg, xp: legend ? 120 : final ? 80 : 40, mass: 99,
      t: 0, cd: 2.5, pat: 0, stun: 0, slowT: 0, slowF: 0, kx: 0, ky: 0, flash: 0, shield: 0, anim: 0, face: -1,
      form: null,
    };
    e.r = 9 * e.sc;
    G.enemies.push(e);
    G.bossRef = e;
    Audio8.play('boss');
    Audio8.music('boss');
    showBanner('¡' + c.name + '!', legend ? 'Legendario · ' + G.arena.name : final ? 'Jefe de la ' + SAGAS[G.phase].name : 'Ha aparecido un jefe', '#ff5050');
    return e;
  }

  function spawner(dt) {
    const p = G.player, m = G.t / 60;
    // jefes de la saga
    const ph = G.phase, local = G.t - ph * 150;
    if (local >= (ph === 0 ? 95 : 75) && !G.bossesSpawned[ph + '_0']) { G.bossesSpawned[ph + '_0'] = 1; spawnBoss(SAGA_BOSSES[ph][0], 'mini'); }
    if (local >= 140 && !G.bossesSpawned[ph + '_1']) { G.bossesSpawned[ph + '_1'] = 1; spawnBoss(SAGA_BOSSES[ph][1], 'final'); }
    // Borrado de Zeno-sama en el minuto 30
    if (G.t >= 1800) {
      if (!G.zeno) { G.zeno = true; showBanner('¡ZENO-SAMA!', '¡Va a borrar el universo entero! Aguanta todo lo que puedas', '#c8a0ff'); Audio8.play('erase'); }
      G.zenoT -= dt;
      if (G.zenoT <= 0) {
        G.zenoT = Math.max(0.35, 1.6 - (G.t - 1800) / 60);
        const n = 2 + Math.floor((G.t - 1800) / 15);
        for (let i = 0; i < n; i++) G.zones.push({ kind: 'warn', x: p.x + rand(-120, 120), y: p.y + rand(-80, 80), r: rand(26, 44), t: 0, delay: 1.1, dmg: 40 * Math.pow(1.08, G.t - 1800), color: '#c8a0ff', erase: 1 });
      }
    }
    G.spawnT -= dt;
    const alive = G.enemies.length;
    const cap = Math.min(300, 40 + m * 12);
    if (G.spawnT <= 0 && alive < cap) {
      G.spawnT = Math.max(0.12, 0.95 - m * 0.035);
      const group = 1 + Math.floor(m / 2.5) + (Math.random() < 0.3 ? 1 : 0);
      const [x, y] = spawnPos();
      for (let i = 0; i < group; i++) {
        const r = Math.random();
        // al principio sólo salen los tipos sencillos; el resto se van sumando
        const types = G.t < 150 ? Math.min(5, 2 + Math.floor(G.t / 30)) : 5;
        const idx = r < 0.45 || types <= 1 ? 0 : randi(1, types - 1);
        const e = spawnMinion(ph, idx, x + rand(-14, 14), y + rand(-14, 14));
        // guerrero shiny salvaje (1 entre 1500)
        if (Math.random() < 1 / 1500) makeWildShiny(e);
      }
      // oleada en anillo de vez en cuando
      if (Math.random() < 0.012 + m * 0.001) {
        const n = 10 + Math.floor(m * 1.5);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          spawnMinion(ph, 0, p.x + Math.cos(a) * 230, p.y + Math.sin(a) * 160);
        }
      }
    }
    // élite
    G.eliteT -= dt;
    if (G.eliteT <= 0) {
      G.eliteT = 55;
      const [x, y] = spawnPos();
      const e = spawnMinion(ph, randi(0, 4), x, y, { scale: 1.6, extra: { elite: true } });
      e.hp *= 9; e.maxHp = e.hp; e.dmg *= 1.5; e.xp = 20; e.r *= 1.2; e.mass = 6;
    }
  }

  function makeWildShiny(e) {
    const pool = CHARS.filter(c => c.saga === G.phase && c.r <= 4);
    const c = pick(pool);
    Object.assign(e, { name: c.name, look: c.look, key: c.id, char: c, wildShiny: true, sc: c.look.sc || 1, beh: 'fast', spd: 40 });
    e.hp *= 12; e.maxHp = e.hp; e.r = 9;
    showBanner('✨ ¡' + c.name + ' shiny salvaje!', 'Derrótalo para que se una a tu equipo', '#ffe860');
    Audio8.play('rare');
  }

  function events(dt) {
    const p = G.player;
    // cápsulas de suministros en el mapa
    G.propT -= dt;
    if (G.propT <= 0) {
      G.propT = rand(22, 35);
      const a = rand(0, 6.28);
      G.props.push({ x: p.x + Math.cos(a) * rand(90, 160), y: p.y + Math.sin(a) * rand(70, 120), t: 60 });
    }
    // ladrón dorado
    G.thiefT -= dt;
    if (G.thiefT <= 0) {
      G.thiefT = rand(100, 160);
      if (Math.random() < 0.6) {
        const [x, y] = spawnPos();
        const big = Math.random() < 0.3;
        const e = spawnMinion(G.phase, 0, x, y, { beh: 'thief', extra: { golden: true, life: 20, loot: big ? 't10' : 'zeni' } });
        e.hp = 60 * diff().hp; e.maxHp = e.hp;
        showBanner(big ? '¡Un ' + e.name + ' con un ticket ×10!' : '¡Un ' + e.name + ' cargado de zeni!', '¡Atrápalo antes de que huya!', '#ffd040');
        Audio8.play('rare');
      }
    }
    // grieta temporal
    G.riftT -= dt;
    if (G.riftT <= 0 && !G.rift) {
      G.riftT = rand(200, 280);
      const a = rand(0, 6.28);
      const arena = pick(ARENAS);
      G.rift = { x: p.x + Math.cos(a) * 140, y: p.y + Math.sin(a) * 100, t: 30, arena };
      showBanner('¡Se ha abierto una grieta temporal!', 'Entra para luchar contra un legendario en ' + arena.name, '#a0e0ff');
      Audio8.play('rift');
    }
    if (G.rift) {
      G.rift.t -= dt;
      if (G.rift.t <= 0) G.rift = null;
      else if (d2(p.x, p.y, G.rift.x, G.rift.y) < 16 * 16) enterArena(G.rift);
    }
    // tormenta de ki
    if (G.weather === 'storm' && Math.random() < dt * 0.8) {
      const c = G.enemies.filter(e => !e.dead && onScreen(e.x, e.y));
      if (c.length) {
        const e = pick(c);
        G.bolts.push({ pts: zigzag(e.x + rand(-20, 20), e.y - 200, e.x, e.y, 7), life: 0.2, color: '#c0f0ff' });
        hitEnemy(e, 30 * diff().hp * 0.5, {});
      }
    }
  }

  function updateEnemies(dt) {
    const p = G.player;
    for (const e of G.enemies) {
      if (e.dead) { e.fade -= dt; continue; }
      e.anim += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.atkT > 0) e.atkT -= dt;
      if (e.slowT > 0) e.slowT -= dt;
      // retroceso
      e.x += e.kx * dt; e.y += e.ky * dt;
      e.kx *= Math.pow(0.001, dt); e.ky *= Math.pow(0.001, dt);
      if (e.stun > 0) { e.stun -= dt; continue; }
      const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist, ny = dy / dist;
      let spd = e.spd * (e.slowT > 0 ? 1 - e.slowF : 1) * (G.weather === 'gravity' ? 0.85 : 1);
      e.face = dx >= 0 ? 1 : -1;
      // despawn si se queda muy lejos (no jefes)
      if (!e.boss && !e.elite && !e.wildShiny && dist > 520) { e.dead = true; e.fade = 0; e.silent = true; continue; }
      if (e.boss) { bossAI(e, dt, nx, ny, dist); }
      else switch (e.beh) {
        case 'ranged': case 'fan': case 'beamer': case 'healer': case 'summoner': case 'shielder': {
          const want = e.beh === 'healer' || e.beh === 'shielder' ? 70 : 100;
          const s = dist > want + 15 ? 1 : dist < want - 15 ? -0.8 : 0;
          e.x += nx * spd * s * dt; e.y += ny * spd * s * dt;
          e.cd -= dt;
          if (e.cd <= 0 && dist < 260) enemyAct(e, nx, ny, dist);
          break;
        }
        case 'bomber': {
          if (e.fuse !== undefined) {
            e.fuse -= dt; e.flash = Math.sin(e.fuse * 40) > 0 ? 0.05 : 0;
            if (e.fuse <= 0) {
              explodeAt(e.x, e.y, 30, '#ff8030');
              if (d2(p.x, p.y, e.x, e.y) < 32 * 32) damagePlayer(e.dmg, null, false, 'bomber');
              e.dead = true; e.fade = 0.2; e.silent = true;
            }
          } else {
            e.x += nx * spd * dt; e.y += ny * spd * dt;
            if (dist < 24) e.fuse = 0.75;
          }
          break;
        }
        case 'jumper': {
          if (e.jump) {
            e.jump.t += dt;
            const k = Math.min(1, e.jump.t / e.jump.dur);
            e.x = e.jump.x0 + (e.jump.x1 - e.jump.x0) * k; e.y = e.jump.y0 + (e.jump.y1 - e.jump.y0) * k;
            e.hop = Math.sin(k * Math.PI) * 26;
            if (k >= 1) {
              e.jump = null; e.hop = 0;
              explodeAt(e.x, e.y, 22, '#d0b080', true);
              if (d2(p.x, p.y, e.x, e.y) < 26 * 26) damagePlayer(e.dmg, e, false, 'jump');
            }
          } else {
            e.x += nx * spd * dt; e.y += ny * spd * dt;
            e.cd -= dt;
            if (e.cd <= 0 && dist < 150) {
              e.cd = rand(2.5, 4);
              const tx = p.x + rand(-8, 8), ty = p.y + rand(-8, 8);
              e.jump = { x0: e.x, y0: e.y, x1: tx, y1: ty, t: 0, dur: 0.85 };
              G.zones.push({ kind: 'warn', x: tx, y: ty, r: 22, t: 0, delay: 0.85, dmg: 0, color: '#ff4040', visual: 1 });
            }
          }
          break;
        }
        case 'thief': {
          e.life -= dt;
          const fx = -nx, fy = -ny;
          e.zig = (e.zig || 0) + dt * 3;
          const wob = Math.sin(e.zig) * 0.7;
          e.x += (fx * Math.cos(wob) - fy * Math.sin(wob)) * spd * (dist < 200 ? 1 : 0.4) * dt;
          e.y += (fy * Math.cos(wob) + fx * Math.sin(wob)) * spd * (dist < 200 ? 1 : 0.4) * dt;
          if (Math.random() < dt * 8) G.fx.push({ x: e.x + rand(-5, 5), y: e.y + rand(-8, 8), vx: 0, vy: -10, life: 0.5, max: 0.5, size: 1, color: '#ffe860' });
          if (e.life <= 0) { e.dead = true; e.fade = 0.3; e.silent = true; addText(e.x, e.y - 12, '¡Ha huido!', '#ffd040'); }
          break;
        }
        case 'fast': case 'swarm': case 'chase': case 'tank': default: {
          e.x += nx * spd * dt; e.y += ny * spd * dt;
        }
      }
      // separación suave
      query(e.x, e.y, e.r * 2, o => {
        if (o === e || o.boss) return;
        const ddx = e.x - o.x, ddy = e.y - o.y, dd = ddx * ddx + ddy * ddy, rr = (e.r + o.r) * 0.8;
        if (dd < rr * rr && dd > 0.01) {
          const l = Math.sqrt(dd), push = (rr - l) * 0.5;
          e.x += ddx / l * push * (e.boss ? 0 : 1); e.y += ddy / l * push * (e.boss ? 0 : 1);
        }
      });
      // contacto con el jugador
      const cr = (e.r + p.r) * 0.7;
      if (e.beh !== 'thief' && d2(p.x, p.y, e.x, e.y) < cr * cr && !(e.hop > 4)) {
        if (p.inv <= 0 && !p.dash) { damagePlayer(e.dmg, e); if (!e.boss) { e.kx -= nx * 110; e.ky -= ny * 110; } }
      }
      if (G.arena) { const a = G.arena, ddx = e.x - a.cx, ddy = e.y - a.cy, l = Math.hypot(ddx, ddy); if (l > a.R - 8) { e.x = a.cx + ddx / l * (a.R - 8); e.y = a.cy + ddy / l * (a.R - 8); } }
    }
    // limpieza
    G.enemies = G.enemies.filter(e => !e.dead || e.fade > 0);
    if (G.bossRef && G.bossRef.dead) {
      G.bossRef = null;
      if (!G.enemies.some(e => e.boss && !e.dead)) Audio8.music('battle');
    }
  }

  function enemyAct(e, nx, ny, dist) {
    const p = G.player;
    e.atkT = 0.3;
    switch (e.beh) {
      case 'ranged':
        e.cd = rand(1.8, 2.6);
        G.ebul.push({ x: e.x, y: e.y - 4, vx: nx * 85, vy: ny * 85, r: 3, dmg: e.dmg, life: 3.2, color: '#ff6060' });
        break;
      case 'fan':
        e.cd = rand(2.4, 3.2);
        for (let i = -1; i <= 1; i++) { const a = Math.atan2(ny, nx) + i * 0.3; G.ebul.push({ x: e.x, y: e.y - 4, vx: Math.cos(a) * 85, vy: Math.sin(a) * 85, r: 3, dmg: e.dmg, life: 3, color: '#ff9040' }); }
        break;
      case 'beamer': {
        e.cd = rand(3.5, 4.5);
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        G.zones.push({ kind: 'wline', x: e.x, y: e.y, a, len: 220, w: 10, t: 0, delay: 0.9, dmg: e.dmg, color: '#ff4040', owner: e });
        break;
      }
      case 'healer': {
        e.cd = 3;
        let healed = false;
        query(e.x, e.y, 70, o => { if (o !== e && !o.boss && o.hp < o.maxHp) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.3); healed = true; G.fx.push({ x: o.x, y: o.y - 8, vx: 0, vy: -20, life: 0.6, max: 0.6, size: 2, color: '#60ff80', plus: 1 }); } });
        if (healed) G.fx.push({ ring: 1, x: e.x, y: e.y, r: 5, r1: 70, life: 0.4, max: 0.4, color: '#60ff80' });
        break;
      }
      case 'shielder': {
        e.cd = 4.5;
        query(e.x, e.y, 70, o => { if (!o.boss) o.shield = Math.max(o.shield, o.maxHp * 0.5); });
        G.fx.push({ ring: 1, x: e.x, y: e.y, r: 5, r1: 70, life: 0.4, max: 0.4, color: '#80c0ff' });
        break;
      }
      case 'summoner': {
        e.cd = 5.5;
        for (let i = 0; i < 3; i++) {
          const s = spawnMinion(G.phase, 0, e.x + rand(-16, 16), e.y + rand(-16, 16), { beh: 'swarm', scale: 0.7 });
          s.hp *= 0.5; s.maxHp = s.hp;
        }
        G.fx.push({ ring: 1, x: e.x, y: e.y, r: 4, r1: 30, life: 0.4, max: 0.4, color: '#c080ff' });
        break;
      }
      default: break;
    }
  }

  function bossAI(e, dt, nx, ny, dist) {
    const p = G.player;
    if (e.charge) {
      e.charge.t += dt;
      if (e.charge.t > 0.6) { e.x += e.charge.vx * dt; e.y += e.charge.vy * dt; }
      if (e.charge.t > 1.25) e.charge = null;
      return;
    }
    if (e.jump) {
      e.jump.t += dt;
      const k = Math.min(1, e.jump.t / e.jump.dur);
      e.x = e.jump.x0 + (e.jump.x1 - e.jump.x0) * k; e.y = e.jump.y0 + (e.jump.y1 - e.jump.y0) * k;
      e.hop = Math.sin(k * Math.PI) * 50;
      if (k >= 1) {
        e.jump = null; e.hop = 0;
        explodeAt(e.x, e.y, 45, '#ffb060', true);
        if (d2(p.x, p.y, e.x, e.y) < 48 * 48) damagePlayer(e.dmg * 1.5, e);
      }
      return;
    }
    if (dist > 40) { e.x += nx * e.spd * dt; e.y += ny * e.spd * dt; }
    // al 50% de vida el jefe se transforma
    if (!e.form && e.hp < e.maxHp * 0.5 && e.char && e.char.forms.length) {
      e.form = e.char.forms[e.char.forms.length - 1];
      e.spd *= 1.25; e.dmg *= 1.2;
      G.flash = 0.5; G.flashColor = e.form.a || '#fff';
      showBanner(e.name + ': ¡' + e.form.n + '!', '¡Su poder ha aumentado!', '#ff8040');
      Audio8.play('transform');
    }
    e.cd -= dt;
    if (e.cd > 0) return;
    const fast = e.legend ? 0.7 : e.final ? 0.85 : 1;
    const pats = ['burst', 'aim', 'beam', 'slam', e.legend || e.final ? 'charge' : 'aim', 'summon'];
    const pat = pats[e.pat++ % pats.length];
    e.atkT = 0.4;
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    const col = (e.form && e.form.a) || '#ff5050';
    switch (pat) {
      case 'burst': {
        const n = e.legend ? 22 : 16, waves = e.legend || e.final ? 2 : 1;
        for (let w = 0; w < waves; w++) later(w * 0.35, () => {
          if (e.dead) return;
          for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + w * 0.15; G.ebul.push({ x: e.x, y: e.y - 6, vx: Math.cos(an) * 80, vy: Math.sin(an) * 80, r: 4, dmg: e.dmg * 0.7, life: 4, color: col }); }
        });
        e.cd = 2.6 * fast;
        break;
      }
      case 'aim': {
        for (let i = -2; i <= 2; i++) { const an = a + i * 0.18; G.ebul.push({ x: e.x, y: e.y - 6, vx: Math.cos(an) * 110, vy: Math.sin(an) * 110, r: 4, dmg: e.dmg * 0.7, life: 3.5, color: col }); }
        e.cd = 2.0 * fast;
        break;
      }
      case 'beam': {
        const n = e.legend ? 3 : 1;
        for (let i = 0; i < n; i++) G.zones.push({ kind: 'wline', x: e.x, y: e.y, a: a + (i - (n - 1) / 2) * 0.5, len: 320, w: 16, t: 0, delay: 1.0, dmg: e.dmg * 1.3, color: col, owner: e });
        e.cd = 2.6 * fast;
        break;
      }
      case 'slam': {
        e.jump = { x0: e.x, y0: e.y, x1: p.x, y1: p.y, t: 0, dur: 1.0 };
        G.zones.push({ kind: 'warn', x: p.x, y: p.y, r: 45, t: 0, delay: 1.0, dmg: 0, color: '#ff4040', visual: 1 });
        e.cd = 2.4 * fast;
        break;
      }
      case 'charge': {
        e.charge = { t: 0, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260 };
        G.zones.push({ kind: 'wline', x: e.x, y: e.y, a, len: 170, w: e.r * 2, t: 0, delay: 0.6, dmg: 0, color: '#ff4040', visual: 1 });
        e.cd = 2.2 * fast;
        break;
      }
      case 'summon': {
        if (!G.arena) for (let i = 0; i < 5; i++) spawnMinion(G.phase, randi(0, 4), e.x + rand(-30, 30), e.y + rand(-30, 30));
        else for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; G.ebul.push({ x: e.x, y: e.y - 6, vx: Math.cos(an) * 60, vy: Math.sin(an) * 60, r: 5, dmg: e.dmg * 0.8, life: 5, color: col, homing: 1 }); }
        e.cd = 2.4 * fast;
        break;
      }
      default: e.cd = 1;
    }
  }

  function explodeAt(x, y, r, color, dust) {
    G.fx.push({ ring: 1, x, y, r: 3, r1: r, life: 0.35, max: 0.35, color });
    for (let i = 0; i < (dust ? 10 : 16); i++) {
      const a = rand(0, 6.28), s = rand(20, 90);
      G.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.2, 0.5), max: 0.5, size: rand(1, 3), color: dust ? '#c8b090' : pick([color, '#ffffff', '#ffe060']) });
    }
    if (Save.d.settings.shake && !dust) G.shake = Math.min(5, G.shake + 1.5);
    Audio8.play('explode');
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true; e.fade = 0.25;
    const p = G.player;
    G.kills++;
    if (!p.form) p.ki = Math.min(100, p.ki + 0.7 * p.kiMul);
    Audio8.play('kill');
    for (let i = 0; i < 5; i++) G.fx.push({ x: e.x, y: e.y, vx: rand(-40, 40), vy: rand(-50, 10), life: 0.35, max: 0.35, size: rand(1, 2.5), color: pick(['#ffffff', '#ffe060', e.look.t || '#fff']) });
    // botín
    dropXp(e.x, e.y, e.xp);
    if (Math.random() < 0.06) G.pickups.push(mkPickup('coin', e.x + rand(-4, 4), e.y, randi(1, 3)));
    if (Math.random() < 0.0035) G.pickups.push(mkPickup('ticket', e.x, e.y, 1));
    if (Math.random() < 0.004) G.pickups.push(mkPickup('senzu', e.x, e.y, 1));
    if (e.elite) {
      G.pickups.push(mkPickup('item', e.x, e.y, rollItem()));
      for (let i = 0; i < 6; i++) G.pickups.push(mkPickup('coin', e.x + rand(-16, 16), e.y + rand(-10, 10), 3));
      if (Math.random() < 0.5) G.pickups.push(mkPickup(pick(['senzu', 'magnet', 'bomb']), e.x + 10, e.y, 1));
      if (Math.random() < 0.1) dropBall(e.x - 10, e.y);
    }
    if (e.golden) {
      if (e.loot === 't10') G.pickups.push(mkPickup('ticket10', e.x, e.y - 10, 1));
      for (let i = 0; i < 20; i++) G.pickups.push(mkPickup('coin', e.x + rand(-30, 30), e.y + rand(-20, 20), 5));
      explodeAt(e.x, e.y, 30, '#ffd040');
    }
    if (e.wildShiny) {
      G.newShiny.push(e.char.id);
      Save.addChar(e.char.id, true);
      Save.save();
      showBanner('✨ ¡' + e.char.name + ' shiny se une a tu equipo!', 'Ya lo tienes en tu colección', '#ffe860');
      Audio8.play('legend');
    }
    if (e.boss) {
      G.bosses++;
      explodeAt(e.x, e.y, 60, '#ffe060');
      G.flash = 0.5; G.flashColor = '#ffffff';
      const n = randi(1, 3);
      for (let i = 0; i < n; i++) G.pickups.push(mkPickup('ticket', e.x + rand(-20, 20), e.y + rand(-14, 14), 1));
      if (Math.random() < (e.legend ? 0.5 : 1 / 3)) G.pickups.push(mkPickup('ticket10', e.x, e.y - 12, 1));
      if (Math.random() < 0.5 || e.final) G.pickups.push(mkPickup('item', e.x + 14, e.y - 14, rollItem()));
      for (let i = 0; i < 12; i++) G.pickups.push(mkPickup('coin', e.x + rand(-26, 26), e.y + rand(-18, 18), 4));
      G.pickups.push(mkPickup('senzu', e.x + 20, e.y, 1));
      G.pickups.push(mkPickup('magnet', e.x - 20, e.y, 1));
      if (Math.random() < (e.legend ? 0.5 : e.final ? 0.3 : 0.12)) dropBall(e.x, e.y + 14);
      if (e.legend) winArena(e);
    }
  }

  function rollItem() { return pick(Object.keys(ITEMS)); }
  function dropBall(x, y) {
    const have = new Set([...Save.d.balls, ...G.balls]);
    const missing = [1, 2, 3, 4, 5, 6, 7].filter(n => !have.has(n));
    if (!missing.length) return;
    G.pickups.push(mkPickup('ball', x, y, pick(missing)));
  }
  function dropXp(x, y, v) {
    while (v > 0) {
      const val = v >= 25 ? 25 : v >= 5 ? 5 : 1;
      v -= val;
      G.pickups.push(mkPickup('xp', x + rand(-5, 5), y + rand(-5, 5), val));
    }
    // fusiona gemas si hay demasiadas
    const gems = G.pickups.filter(q => q.type === 'xp');
    if (gems.length > 400) {
      let sum = 0;
      for (let i = 0; i < 150; i++) { sum += gems[i].val; gems[i].gone = true; }
      G.pickups = G.pickups.filter(q => !q.gone);
      G.pickups.push(mkPickup('xp', G.player.x + rand(-60, 60), G.player.y + rand(-60, 60), sum));
    }
  }
  function mkPickup(type, x, y, val) { return { type, x, y, val, t: 0, mag: false, vy: -40, z: 0, bounce: type !== 'xp' }; }

  // ---------- proyectiles ----------
  function updateProjectiles(dt) {
    for (const b of G.pbul) {
      b.life -= dt;
      if (b.life <= 0) { if (b.bomb) bombExplode(b); else if (b.explode) projExplode(b); b.dead = true; continue; }
      if (b.growT > 0) { b.growT -= dt; b.y -= 10 * dt; continue; }
      if (b.homing && b.target) {
        if (b.target.dead) b.target = nearest(b.x, b.y, 200, b.hit);
        if (b.target) {
          const a = Math.atan2(b.target.y - b.y, b.target.x - b.x), cur = Math.atan2(b.vy, b.vx);
          const na = cur + clamp(angDiff(a, cur), -5 * dt, 5 * dt);
          b.vx = Math.cos(na) * b.spd; b.vy = Math.sin(na) * b.spd;
        }
      }
      if (b.boom) {
        const p = G.player;
        b.spin += dt * 20;
        if (!b.back) {
          b.trav += Math.hypot(b.vx, b.vy) * dt;
          if (b.trav >= b.out) { b.back = true; b.hit.clear(); }
        } else {
          const [nx, ny] = norm(p.x - b.x, p.y - b.y - 4), sp = Math.hypot(b.vx, b.vy);
          b.vx = nx * sp; b.vy = ny * sp;
          if (d2(b.x, b.y, p.x, p.y) < 100) { b.dead = true; continue; }
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.spiral && Math.random() < 0.8) G.fx.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.18, max: 0.18, size: 1, color: b.color });
      const rr = b.r + 8;
      query(b.x, b.y, rr, e => {
        if (b.dead || b.hit.has(e.id)) return;
        if (d2(b.x, b.y, e.x, e.y - (e.hop || 0)) > (b.r + e.r) * (b.r + e.r)) return;
        b.hit.add(e.id);
        if (b.bomb) { bombExplode(b); b.dead = true; return false; }
        if (b.explode) { projExplode(b); b.dead = true; return false; }
        hitEnemy(e, b.dmg, { kx: b.vx * 0.15, ky: b.vy * 0.15, exec: b.exec });
        if (b.pierce-- <= 0) { b.dead = true; return false; }
      });
    }
    G.pbul = G.pbul.filter(b => !b.dead);
  }
  function projExplode(b) {
    explodeAt(b.x, b.y, b.explode, b.color);
    query(b.x, b.y, b.explode + 10, e => { if (d2(b.x, b.y, e.x, e.y) < (b.explode + e.r) * (b.explode + e.r)) hitEnemy(e, b.dmg, {}); });
  }
  function bombExplode(b) {
    explodeAt(b.x, b.y, b.bomb, b.color);
    G.flash = 0.5; G.flashColor = b.color;
    if (Save.d.settings.shake) G.shake = 6;
    query(b.x, b.y, b.bomb + 10, e => {
      if (d2(b.x, b.y, e.x, e.y) < (b.bomb + e.r) * (b.bomb + e.r)) { const [nx, ny] = norm(e.x - b.x, e.y - b.y); hitEnemy(e, b.dmg, { kx: nx * 150, ky: ny * 150 }); }
    });
  }

  function updateBeams(dt) {
    const p = G.player;
    for (const bm of G.beams) {
      bm.t += dt;
      if (bm.follow) { bm.x = p.x; bm.y = p.y - 6; }
      if (bm.t < bm.charge) continue;
      bm.tickT -= dt;
      if (bm.tickT <= 0) {
        bm.tickT = 0.1;
        const ca = Math.cos(bm.a), sa = Math.sin(bm.a);
        const mx = bm.x + ca * bm.len / 2, my = bm.y + sa * bm.len / 2;
        query(mx, my, bm.len / 2 + bm.w, e => {
          const dx = e.x - bm.x, dy = e.y - bm.y;
          const along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
          if (along > -e.r && along < bm.len + e.r && perp < bm.w / 2 + e.r) hitEnemy(e, bm.dmg, { kx: ca * 25, ky: sa * 25 });
        });
      }
      if (bm.t >= bm.charge + bm.dur) bm.dead = true;
    }
    G.beams = G.beams.filter(b => !b.dead);
  }

  function updateZones(dt) {
    const p = G.player;
    for (const z of G.zones) {
      switch (z.kind) {
        case 'trail':
          z.t -= dt; z.tt -= dt;
          if (z.tt <= 0) { z.tt = z.tick; query(z.x, z.y, z.r + 8, e => { if (d2(z.x, z.y, e.x, e.y) < (z.r + e.r) * (z.r + e.r)) hitEnemy(e, z.dmg, {}); }); }
          if (z.t <= 0) z.dead = true;
          break;
        case 'mine':
          z.t -= dt; z.arm -= dt;
          if (z.arm <= 0) {
            let boom = false;
            query(z.x, z.y, 14, e => { if (d2(z.x, z.y, e.x, e.y) < (8 + e.r) * (8 + e.r)) { boom = true; return false; } });
            if (boom || z.t <= 0) {
              explodeAt(z.x, z.y, z.r, z.color);
              query(z.x, z.y, z.r + 8, e => { if (d2(z.x, z.y, e.x, e.y) < (z.r + e.r) * (z.r + e.r)) hitEnemy(e, z.dmg, {}); });
              z.dead = true;
            }
          }
          break;
        case 'meteor':
          z.t += dt;
          if (z.t >= z.delay) {
            explodeAt(z.x, z.y, z.r, z.color);
            query(z.x, z.y, z.r + 8, e => { if (d2(z.x, z.y, e.x, e.y) < (z.r + e.r) * (z.r + e.r)) hitEnemy(e, z.dmg, { exec: z.exec }); });
            z.dead = true;
          }
          break;
        case 'warn':
          z.t += dt;
          if (z.t >= z.delay) {
            if (!z.visual) {
              explodeAt(z.x, z.y, z.r, z.color);
              if (d2(p.x, p.y, z.x, z.y) < z.r * z.r) damagePlayer(z.dmg, null, !!z.erase);
            }
            z.dead = true;
          }
          break;
        case 'wline':
          z.t += dt;
          if (z.owner && !z.owner.dead && z.t < z.delay && !z.visual) { z.x = z.owner.x; z.y = z.owner.y; }
          if (z.t >= z.delay && !z.fired) {
            z.fired = true;
            if (!z.visual) {
              const ca = Math.cos(z.a), sa = Math.sin(z.a), dx = p.x - z.x, dy = p.y - z.y;
              const along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
              if (along > 0 && along < z.len && perp < z.w / 2 + p.r) damagePlayer(z.dmg, null, false, 'beam');
              Audio8.play('beam');
            }
          }
          if (z.t >= z.delay + 0.3) z.dead = true;
          break;
        case 'lava': break;
        default: break;
      }
    }
    G.zones = G.zones.filter(z => !z.dead);
  }

  function updateTurrets(dt) {
    for (const tu of G.turrets) {
      tu.t -= dt; tu.ft -= dt;
      if (tu.ft <= 0) {
        const e = nearest(tu.x, tu.y, 200);
        if (e) {
          tu.ft = tu.rate;
          const a = Math.atan2(e.y - tu.y, e.x - tu.x);
          tu.face = e.x >= tu.x ? 1 : -1;
          G.pbul.push(mkBullet(tu.x, tu.y - 4, a, { speed: 220, size: 3, dmg: tu.dmg, pierce: 0, life: 1.2 }, tu.color, e));
        }
      }
      if (tu.t <= 0) tu.dead = true;
    }
    G.turrets = G.turrets.filter(t => !t.dead);
  }

  function updateEnemyBullets(dt) {
    const p = G.player;
    for (const b of G.ebul) {
      b.life -= dt;
      if (b.homing) {
        const a = Math.atan2(p.y - b.y, p.x - b.x), cur = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
        const na = cur + clamp(angDiff(a, cur), -1.2 * dt, 1.2 * dt);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (d2(b.x, b.y, p.x, p.y - 2) < (b.r + p.r - 1) * (b.r + p.r - 1)) { damagePlayer(b.dmg, null, false, 'bullet'); b.life = 0; }
    }
    G.ebul = G.ebul.filter(b => b.life > 0);
  }

  function updatePickups(dt) {
    const p = G.player;
    for (const q of G.pickups) {
      q.t += dt;
      if (q.bounce && q.z >= 0) { q.vy += 200 * dt; q.z -= q.vy * dt; if (q.z < 0) { q.z = 0; q.bounce = false; } }
      const dd = d2(q.x, q.y, p.x, p.y);
      const magR = q.type === 'xp' ? p.magnet : Math.max(22, p.magnet * 0.7);
      if (!q.mag && dd < magR * magR && q.t > 0.25) q.mag = true;
      if (q.mag) {
        const [nx, ny] = norm(p.x - q.x, p.y - q.y);
        const sp = 140 + q.t * 60;
        q.x += nx * sp * dt; q.y += ny * sp * dt;
        if (dd < 64) { collect(q); q.gone = true; }
      }
    }
    G.pickups = G.pickups.filter(q => !q.gone);
  }

  function collect(q) {
    const p = G.player;
    switch (q.type) {
      case 'xp': {
        p.xp += q.val * p.xpMul;
        Audio8.play('xp');
        while (p.xp >= p.xpNext) {
          p.xp -= p.xpNext;
          p.lvl++;
          p.xpNext = Math.floor(6 + p.lvl * 3.2 + Math.pow(p.lvl, 1.55));
          G.pendingLevels++;
        }
        if (G.pendingLevels > 0 && !G.paused) openLevelUp();
        break;
      }
      case 'coin': G.zeni += q.val; Audio8.play('coin'); break;
      case 'ticket': G.t1 += 1; Save.d.tickets.t1 += 1; Save.save(); addText(p.x, p.y - 20, '+1 ticket', '#ffd040'); Audio8.play('ticket'); break;
      case 'ticket10': G.t10 += 1; Save.d.tickets.t10 += 1; Save.save(); showBanner('¡Ticket ×10!', 'Úsalo en el gacha de cápsulas', '#c47bff'); Audio8.play('legend'); break;
      case 'senzu': p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.35); addText(p.x, p.y - 20, '¡Semilla!', '#60ff80'); Audio8.play('levelup'); break;
      case 'magnet': for (const o of G.pickups) if (o.type === 'xp') o.mag = true; Audio8.play('select'); break;
      case 'bomb': {
        G.flash = 0.6; G.flashColor = '#ffb040';
        for (const e of G.enemies) if (!e.dead && onScreen(e.x, e.y)) hitEnemy(e, e.boss ? e.maxHp * 0.05 : 9999, {});
        Audio8.play('explode');
        break;
      }
      case 'ball':
        if (!G.balls.includes(q.val)) G.balls.push(q.val);
        Save.d.balls = [...new Set([...Save.d.balls, q.val])];
        Save.save();
        showBanner('¡Bola de Dragón de ' + q.val + ' estrella' + (q.val > 1 ? 's' : '') + '!', 'Llevas ' + Save.d.balls.length + ' de 7', '#ffa020');
        Audio8.play('legend');
        break;
      case 'item':
        G.itemsFound[q.val] = 1;
        Save.d.itemsFound[q.val] = 1;
        if (!p.item) { equipItem(q.val); }
        else if (p.item !== q.val) { G.paused = true; UI.itemChoice(p.item, q.val); }
        break;
      default: break;
    }
  }

  function equipItem(id) {
    const p = G.player;
    p.item = id;
    recalc(p);
    showBanner(ITEMS[id].icon + ' ' + ITEMS[id].name, ITEMS[id].desc, '#ffd848');
    Audio8.play('select');
  }

  function updateProps(dt) {
    const p = G.player;
    for (const pr of G.props) {
      pr.t -= dt;
      if (d2(pr.x, pr.y, p.x, p.y) < 14 * 14) {
        pr.dead = true;
        explodeAt(pr.x, pr.y, 16, '#ffffff', true);
        Audio8.play('pop');
        const r = Math.random();
        const type = r < 0.35 ? 'senzu' : r < 0.6 ? 'magnet' : r < 0.8 ? 'bomb' : 'coin';
        if (type === 'coin') for (let i = 0; i < 8; i++) G.pickups.push(mkPickup('coin', pr.x + rand(-12, 12), pr.y + rand(-8, 8), 2));
        else G.pickups.push(mkPickup(type, pr.x, pr.y, 1));
      }
      if (pr.t <= 0) pr.dead = true;
    }
    G.props = G.props.filter(x => !x.dead);
  }

  function updateFx(dt) {
    for (const f of G.fx) {
      f.life -= dt;
      if (!f.ring && !f.slash) { f.x += f.vx * dt; f.y += f.vy * dt; }
    }
    G.fx = G.fx.filter(f => f.life > 0);
    if (G.fx.length > 700) G.fx.splice(0, G.fx.length - 700);
    for (const t of G.texts) { t.t -= dt; t.y -= 18 * dt; }
    G.texts = G.texts.filter(t => t.t > 0);
    for (const b of G.bolts) b.life -= dt;
    G.bolts = G.bolts.filter(b => b.life > 0);
  }

  // ---------- subir de nivel: cartas ----------
  function buildCards() {
    const p = G.player;
    const owned = p.slots.flat();
    const ids = new Set(owned.map(m => m.id));
    const evo = [], ups = [], news = [], stats = [], links = [];
    for (const m of owned) {
      const def = MOVES[m.id];
      if (m.lvl < 5) ups.push({ type: 'up', inst: m });
      else if (!m.evo && def.evo && p.statTaken[def.evo.stat] > 0) evo.push({ type: 'evo', inst: m });
    }
    if (p.slots.length < 4) {
      for (const id of Object.keys(MOVES)) if (!ids.has(id)) news.push({ type: 'new', id });
    }
    for (const k of Object.keys(STAT_CARDS)) {
      const sc = STAT_CARDS[k];
      if (sc.max && p.statTaken[k] >= sc.max) continue;
      stats.push({ type: 'stat', id: k });
    }
    const singles = p.slots.map((s, i) => ({ s, i })).filter(o => o.s.length === 1 && o.s[0].lvl >= 3 && MOVES[o.s[0].id].cls !== 'buff');
    if (singles.length >= 2 && Math.random() < (p.slots.length >= 4 ? 0.45 : 0.15)) links.push({ type: 'link' });
    const cards = [];
    if (evo.length) cards.push(evo[0]);
    const pool = [];
    const shuffle = a => a.sort(() => Math.random() - 0.5);
    shuffle(ups); shuffle(news); shuffle(stats);
    // pesos: mejorar técnicas y aprender nuevas son lo más común
    pool.push(...ups.slice(0, 3).map(c => [c, 3]), ...news.slice(0, 3).map(c => [c, p.slots.length < 2 ? 4 : 2]), ...stats.slice(0, 4).map(c => [c, 1.6]), ...links.map(c => [c, 3]));
    while (cards.length < 3 && pool.length) {
      const tot = pool.reduce((a, b) => a + b[1], 0);
      let r = Math.random() * tot, i = 0;
      for (; i < pool.length; i++) { r -= pool[i][1]; if (r <= 0) break; }
      cards.push(pool.splice(Math.min(i, pool.length - 1), 1)[0][0]);
    }
    while (cards.length < 3) cards.push({ type: 'zeni' });
    return cards;
  }

  function openLevelUp() {
    if (G.pendingLevels <= 0 || G.over) return;
    G.paused = true;
    Audio8.play('levelup');
    UI.levelUp(G.player.lvl - G.pendingLevels + 1, buildCards(), G.player.rerolls);
  }

  function chooseCard(card, extra) {
    const p = G.player;
    switch (card.type) {
      case 'up': card.inst.lvl++; break;
      case 'evo':
        card.inst.evo = true;
        G.evos++;
        Save.d.evoMoves[card.inst.id] = 1;
        showBanner('¡' + MOVES[card.inst.id].evo.name + '!', 'Tu técnica ha evolucionado', '#ffd848');
        break;
      case 'new':
        p.slots.push([{ id: card.id, lvl: 1, evo: false, t: 0.2 }]);
        p.active = p.slots.length - 1;
        break;
      case 'stat':
        p.statTaken[card.id]++;
        recalc(p);
        if (card.id === 'hp') p.hp = Math.min(p.maxHp, p.hp + 20);
        break;
      case 'link': {
        const [a, b] = extra;
        const merged = p.slots[a].concat(p.slots[b]);
        p.slots = p.slots.filter((s, i) => i !== a && i !== b);
        p.slots.push(merged);
        p.active = p.slots.length - 1;
        showBanner('¡Vínculo!', 'Las técnicas unidas se lanzan a la vez', '#80e0ff');
        break;
      }
      case 'zeni': G.zeni += 25; break;
      default: break;
    }
    G.pendingLevels--;
    if (G.pendingLevels > 0) openLevelUp();
    else { G.paused = false; }
  }

  function reroll() {
    const p = G.player;
    if (p.rerolls <= 0) return null;
    p.rerolls--;
    return buildCards();
  }

  // ---------- transformación ----------
  function transform() {
    const p = G.player;
    if (!G || G.paused || p.form || p.ki < 100) return;
    const unlocked = 1 + Save.formsUnlocked(p.char.id);
    const forms = p.char.forms;
    const f = forms[Math.min(forms.length, unlocked) - 1];
    p.form = f; p.formT = 20;
    p.formIdx = forms.indexOf(f);
    recalc(p);
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2);
    G.transforms++;
    G.flash = 1; G.flashColor = f.a || '#fff';
    if (Save.d.settings.shake) G.shake = 6;
    for (let i = 0; i < 40; i++) { const a = rand(0, 6.28), s = rand(40, 160); G.fx.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, max: 0.6, size: rand(1, 3), color: f.a }); }
    G.fx.push({ ring: 1, x: p.x, y: p.y, r: 5, r1: 80, life: 0.5, max: 0.5, color: f.a });
    // la onda de la transformación empuja y daña
    query(p.x, p.y, 80, e => { if (!e.boss) { const [nx, ny] = norm(e.x - p.x, e.y - p.y); hitEnemy(e, 30 * p.dmgMul, { kx: nx * 200, ky: ny * 200 }); } });
    showBanner('¡' + f.n.toUpperCase() + '!', p.char.name + ' libera todo su poder', f.a);
    Audio8.play('transform');
  }

  function setActive(i) {
    const p = G && G.player;
    if (!p || i < 0 || i >= p.slots.length) return;
    if (p.item === 'cinturon' && p.active !== i) { addText(p.x, p.y - 20, 'Cinturón: no puedes cambiar', '#ff8080'); Audio8.play('error'); return; }
    if (p.active !== i) Audio8.play('click');
    p.active = i;
  }
  function cycle(d) { const p = G && G.player; if (!p) return; setActive((p.active + d + p.slots.length) % p.slots.length); }

  // ---------- grietas / arenas ----------
  function enterArena(rift) {
    const p = G.player;
    const ar = rift.arena;
    G.rift = null;
    G.mapSave = { enemies: G.enemies, pbul: G.pbul, ebul: G.ebul, zones: G.zones, pickups: G.pickups, props: G.props, turrets: G.turrets, beams: G.beams, x: p.x, y: p.y, weather: G.weather };
    const cx = 100000, cy = 100000;
    G.arena = { def: ar, name: ar.name, hazard: ar.hazard, cx, cy, R: 190, bg: ar.bg };
    G.enemies = []; G.pbul = []; G.ebul = []; G.zones = []; G.pickups = []; G.props = []; G.turrets = []; G.beams = [];
    G.weather = null;
    p.x = cx - 100; p.y = cy;
    p.inv = 2;
    if (ar.hazard === 'lava') for (let i = 0; i < 6; i++) { const a = rand(0, 6.28), r = rand(50, 150); G.zones.push({ kind: 'lava', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r: rand(14, 24) }); }
    recalc(p);
    G.flash = 1; G.flashColor = '#a0e0ff';
    Audio8.play('rift');
    G.cam.x = p.x - VW / 2; G.cam.y = p.y - VH / 2;
    spawnBoss(pick(ar.legends), 'legend');
  }
  function winArena(e) {
    const id = e.char.id;
    G.riftsWon++;
    G.legendsBeaten.push(id);
    Save.d.legends[id] = (Save.d.legends[id] || 0) + 1;
    Save.d.arenas[G.arena.def.id] = 1;
    later(2.5, () => { if (G.arena) leaveArena(true); });
    showBanner('¡Has vencido a ' + e.char.name + '!', 'La grieta se cierra… vuelves a tu época', '#80ff80');
    Audio8.play('win');
  }
  function leaveArena(won) {
    const p = G.player, s = G.mapSave;
    // recoge lo que quedase en la arena
    for (const q of G.pickups) if (q.type !== 'xp') collect(q); else p.xp += q.val * p.xpMul;
    G.arena = null;
    Object.assign(G, { enemies: s.enemies, pbul: [], ebul: [], zones: s.zones.filter(z => z.kind === 'mine'), pickups: s.pickups, props: s.props, turrets: [], beams: [], weather: s.weather });
    p.x = s.x; p.y = s.y;
    p.inv = 2;
    if (!won) {
      p.hp = Math.max(1, p.maxHp * 0.35);
      showBanner('La grieta te ha expulsado…', 'Vuelves al mapa sin premio', '#ff8080');
    }
    G.mapSave = null;
    G.bossRef = null;
    recalc(p);
    Audio8.music('battle');
    if (G.pendingLevels > 0) openLevelUp();
  }

  // ---------- fin de la run ----------
  function endRun(quit) {
    if (G.over) return;
    G.over = true;
    const p = G.player, sv = Save.d, up = p.up;
    const coinMul = (1 + 0.08 * (up.coins || 0)) * (p.item === 'tarjeta' ? 1.5 : 1);
    const zeni = Math.round((G.zeni + Math.floor(G.t / 10) + G.kills * 0.2) * coinMul);
    sv.zeni += zeni;
    const st = sv.stats;
    const newRecord = G.t > st.bestTime;
    st.runs++; st.kills += G.kills; st.bosses += G.bosses; st.evos += G.evos; st.rifts += G.riftsWon; st.transforms += G.transforms; st.zeniEarned += zeni;
    st.bestTime = Math.max(st.bestTime, G.t);
    st.bestLevel = Math.max(st.bestLevel, p.lvl);
    Save.track('kills', G.kills); Save.track('bosses', G.bosses); Save.track('evos', G.evos); Save.track('rifts', G.riftsWon);
    Save.track('transforms', G.transforms); Save.track('zeniEarned', zeni); Save.track('runs', 1); Save.track('runTime', G.t, true);
    Save.addRanking({ time: Math.floor(G.t), kills: G.kills, lvl: p.lvl, char: p.char.id, shiny: !!p.shiny, at: Date.now() });
    Save.save();
    Audio8.play('death');
    Audio8.music(null);
    const summary = {
      time: G.t, lvl: p.lvl, kills: G.kills, bosses: G.bosses, zeni, t1: G.t1, t10: G.t10, balls: G.balls.slice(), newRecord, quit,
      moves: p.slots.flat().map(m => ({ name: moveName(m), lvl: m.lvl, evo: m.evo, id: m.id })), shinies: G.newShiny.slice(), legends: G.legendsBeaten.slice(),
      char: p.char,
    };
    const g = G;
    setTimeout(() => { if (G === g) UI.runOver(summary); }, quit ? 0 : 900);
  }

  // ---------- render ----------
  function resize() {
    if (!cv) return;
    const w = window.innerWidth, h = window.innerHeight;
    SCALE = Math.max(1, Math.round(h / 340));
    VW = Math.ceil(w / SCALE); VH = Math.ceil(h / SCALE);
    cv.width = VW; cv.height = VH;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.imageSmoothingEnabled = false;
  }

  function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0); }

  function drawBg(ox, oy) {
    const T = 16;
    const bg = G.arena ? G.arena.bg : G.bg.bg;
    const deco = G.arena ? (G.arena.hazard === 'ice' ? 'ice' : G.arena.hazard === 'lava' ? 'hell' : 'tiles') : G.bg.deco;
    const x0 = Math.floor(G.cam.x / T) - 1, y0 = Math.floor(G.cam.y / T) - 1;
    const x1 = x0 + Math.ceil(VW / T) + 2, y1 = y0 + Math.ceil(VH / T) + 2;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const h = hash(tx, ty);
      ctx.fillStyle = bg[h % 3 === 0 ? 1 : h % 7 === 0 ? 2 : 0];
      const sx = tx * T - ox, sy = ty * T - oy;
      ctx.fillRect(sx, sy, T, T);
      const r = (h >> 4) % 100;
      if (deco === 'tiles' || deco === 'metal') {
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(sx, sy, T, 1); ctx.fillRect(sx, sy, 1, T);
        if (deco === 'metal' && r < 15) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(sx + 3, sy + 3, 1, 1); ctx.fillRect(sx + 12, sy + 12, 1, 1); }
      } else if (deco === 'grass') {
        if (r < 18) { ctx.fillStyle = 'rgba(0,60,0,0.35)'; ctx.fillRect(sx + (h % 11), sy + (h % 13), 1, 3); ctx.fillRect(sx + (h % 11) + 2, sy + (h % 13) + 1, 1, 2); }
        if (r === 50) { ctx.fillStyle = '#ffe060'; ctx.fillRect(sx + 6, sy + 6, 2, 2); }
        if (r === 51) { ctx.fillStyle = '#ff80c0'; ctx.fillRect(sx + 9, sy + 4, 2, 2); }
      } else if (deco === 'rock') {
        if (r < 6) { ctx.fillStyle = 'rgba(80,60,40,0.55)'; ctx.fillRect(sx + 4, sy + 6, 7, 4); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(sx + 5, sy + 6, 4, 1); }
        else if (r < 14) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(sx + (h % 12), sy + (h % 9), 3, 1); }
      } else if (deco === 'namek') {
        if (r < 3) { ctx.fillStyle = '#3a6ad0'; ctx.fillRect(sx + 4, sy + 2, 8, 6); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(sx + 7, sy + 8, 2, 7); }
        else if (r < 15) { ctx.fillStyle = 'rgba(0,80,60,0.3)'; ctx.fillRect(sx + (h % 11), sy + (h % 13), 1, 2); }
      } else if (deco === 'hell') {
        if (r < 7) { ctx.fillStyle = 'rgba(255,80,40,0.35)'; ctx.fillRect(sx + 2, sy + (h % 12), 9, 1); ctx.fillRect(sx + 8, sy + (h % 12) + 1, 4, 1); }
      } else if (deco === 'ruins') {
        if (r < 5) { ctx.fillStyle = 'rgba(40,40,48,0.6)'; ctx.fillRect(sx + 2, sy + 4, 11, 8); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sx + 2, sy + 4, 11, 1); }
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(sx, sy + 8, T, 1);
      } else if (deco === 'ice') {
        if (r < 10) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(sx + (h % 10), sy + (h % 10), 4, 1); }
      }
    }
  }

  function drawSprite(look, form, shiny, key, x, y, sc, face, frame, opts) {
    const s = PX.get(look, form, shiny, key);
    const img = s.f[frame % s.f.length];
    sc *= s.fit;
    const w = img.width * sc, h = img.height * sc;
    const dx = Math.round(x - w / 2), dy = Math.round(y + PX.FOOT_FROM_CENTER * sc / s.fit - (img.height - s.pad) * sc - (opts && opts.hop || 0));
    let src = img;
    if (opts && opts.white) src = whiteOf(img);
    else if (opts && opts.gold) src = goldOf(img);
    if (opts && opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (face < 0) {
      ctx.save(); ctx.translate(dx + w, dy); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0, w, h); ctx.restore();
    } else ctx.drawImage(src, dx, dy, w, h);
    ctx.globalAlpha = 1;
  }

  function shadow(x, y, r) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }

  function render() {
    if (!G) return;
    const p = G.player;
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = rand(-G.shake, G.shake); sy = rand(-G.shake, G.shake); }
    const ox = Math.round(G.cam.x + sx), oy = Math.round(G.cam.y + sy);
    drawBg(ox, oy);
    ctx.save();
    ctx.translate(-ox, -oy);

    // arena: borde
    if (G.arena) {
      const a = G.arena;
      ctx.strokeStyle = '#a0e0ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(a.cx, a.cy, a.R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(10,10,30,0.85)';
      ctx.beginPath(); ctx.rect(ox - 10, oy - 10, VW + 20, VH + 20); ctx.arc(a.cx, a.cy, a.R + 2, 0, Math.PI * 2, true); ctx.fill('evenodd');
    }

    // zonas en el suelo
    for (const z of G.zones) {
      if (z.kind === 'trail') { ctx.globalAlpha = 0.5 * (z.t / z.max); ctx.fillStyle = z.color; circle(z.x, z.y, z.r * (0.7 + 0.3 * Math.sin(G.t * 20 + z.x))); ctx.globalAlpha = 1; }
      else if (z.kind === 'lava') { ctx.fillStyle = '#e04020'; circle(z.x, z.y, z.r); ctx.fillStyle = '#ff9030'; circle(z.x, z.y, z.r * 0.6 + Math.sin(G.t * 3) * 2); }
      else if (z.kind === 'mine') {
        const blink = Math.sin(G.t * 10 + z.x) > 0;
        ctx.fillStyle = '#2a2a3a'; circle(z.x, z.y, 4); ctx.fillStyle = blink ? z.color : '#ffffff'; circle(z.x, z.y, 2);
      } else if (z.kind === 'meteor') {
        const k = z.t / z.delay;
        ctx.strokeStyle = z.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        const bx = z.sx + (z.x - z.sx) * k, by = z.sy + (z.y - z.sy) * k - Math.sin(k * Math.PI) * 40;
        ctx.fillStyle = z.color; circle(bx, by, 4); ctx.fillStyle = '#ffffff'; circle(bx, by, 2);
      } else if (z.kind === 'warn') {
        const k = Math.min(1, z.t / z.delay);
        ctx.fillStyle = z.erase ? 'rgba(200,160,255,0.25)' : 'rgba(255,40,40,0.18)'; circle(z.x, z.y, z.r);
        ctx.fillStyle = z.erase ? 'rgba(200,160,255,0.45)' : 'rgba(255,40,40,0.35)'; circle(z.x, z.y, z.r * k);
      } else if (z.kind === 'wline') {
        const k = Math.min(1, z.t / z.delay);
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
        if (!z.fired) {
          ctx.fillStyle = 'rgba(255,40,40,0.18)'; ctx.fillRect(0, -z.w / 2, z.len, z.w);
          ctx.fillStyle = 'rgba(255,40,40,0.4)'; ctx.fillRect(0, -z.w / 2, z.len * k, z.w);
        } else if (!z.visual) {
          ctx.fillStyle = z.color; ctx.fillRect(0, -z.w / 2, z.len, z.w);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -z.w / 5, z.len, z.w / 2.5);
        }
        ctx.restore();
      }
    }

    // grieta
    if (G.rift) {
      const r = G.rift;
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = ['#a0e0ff', '#c080ff', '#ffffff', '#60a0ff'][i];
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, 10 + i * 3 + Math.sin(G.t * 5 + i) * 2, 16 + i * 3, G.t * (i % 2 ? 1 : -1), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#10102a'; ctx.beginPath(); ctx.ellipse(r.x, r.y, 8, 13, 0, 0, Math.PI * 2); ctx.fill();
    }

    // cápsulas de suministros
    for (const pr of G.props) {
      const bob = Math.sin(G.t * 3 + pr.x) * 1.5;
      shadow(pr.x, pr.y + 6, 6);
      const img = capImg('#e04040');
      if (img) ctx.drawImage(img, Math.round(pr.x - 7), Math.round(pr.y - 10 + bob), 14, 14);
    }

    // objetos en el suelo
    for (const q of G.pickups) drawPickup(q);

    // entidades ordenadas por y
    const ents = [];
    for (const e of G.enemies) ents.push(e);
    for (const t of G.turrets) ents.push({ turret: t, y: t.y });
    ents.push({ isPlayer: true, y: p.y });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.isPlayer) drawPlayer();
      else if (e.turret) {
        const t = e.turret;
        shadow(t.x, t.y + 12, 7);
        drawSprite(p.char.look, p.form, p.shiny, p.char.id, t.x, t.y, 1, t.face || 1, 0, { alpha: 0.55 + 0.2 * Math.sin(G.t * 10) });
      } else drawEnemy(e);
    }

    // órbitas
    const slot = p.slots[p.active] || [];
    for (const inst of slot) {
      const def = MOVES[inst.id];
      if (def.cls === 'orbit' && inst.orbs) {
        for (const [x, y] of inst.orbs) {
          ctx.fillStyle = def.color; circle(x, y - 4, inst.q.size); ctx.fillStyle = '#ffffff'; circle(x - 1, y - 5, inst.q.size * 0.45);
        }
      }
      if (def.cls === 'aura' && inst.q) {
        ctx.globalAlpha = 0.18 + 0.06 * Math.sin(G.t * 8);
        ctx.fillStyle = def.color; circle(p.x, p.y, inst.q.radius);
        ctx.globalAlpha = 0.5; ctx.strokeStyle = def.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, inst.q.radius, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // proyectiles del jugador
    for (const b of G.pbul) {
      if (b.boom) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin);
        ctx.fillStyle = b.color; ctx.fillRect(-b.r - 2, -1, (b.r + 2) * 2, 2); ctx.fillRect(-1, -b.r - 2, 2, (b.r + 2) * 2);
        ctx.fillStyle = '#fff'; ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
        continue;
      }
      if (b.thin) {
        ctx.strokeStyle = b.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
        continue;
      }
      if (b.bomb) {
        const r = b.r * (b.growT > 0 ? 1 - b.growT : 1) + Math.sin(G.t * 20) * 1;
        ctx.globalAlpha = 0.35; ctx.fillStyle = b.color; circle(b.x, b.y, r + 4); ctx.globalAlpha = 1;
        ctx.fillStyle = b.color; circle(b.x, b.y, r); ctx.fillStyle = '#ffffff'; circle(b.x - r * 0.25, b.y - r * 0.25, r * 0.5);
        continue;
      }
      ctx.globalAlpha = 0.4; ctx.fillStyle = b.color; circle(b.x - b.vx * 0.02, b.y - b.vy * 0.02, b.r * 0.8); ctx.globalAlpha = 1;
      ctx.fillStyle = b.color; circle(b.x, b.y, b.r);
      ctx.fillStyle = '#ffffff'; circle(b.x, b.y, Math.max(1, b.r * 0.45));
    }

    // rayos
    for (const bm of G.beams) drawBeam(bm, p);

    // balas enemigas
    for (const b of G.ebul) {
      ctx.fillStyle = '#2a0a10'; circle(b.x, b.y, b.r + 1);
      ctx.fillStyle = b.color; circle(b.x, b.y, b.r);
      ctx.fillStyle = '#ffe0e0'; circle(b.x, b.y, b.r * 0.4);
    }

    // relámpagos
    for (const bo of G.bolts) {
      ctx.strokeStyle = bo.color; ctx.lineWidth = 2; ctx.globalAlpha = Math.min(1, bo.life * 10);
      ctx.beginPath(); bo.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // partículas
    for (const f of G.fx) {
      const k = f.life / f.max;
      if (f.ring) {
        ctx.strokeStyle = f.color; ctx.globalAlpha = k; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r + (f.r1 - f.r) * (1 - k), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (f.slash) {
        ctx.strokeStyle = f.color; ctx.globalAlpha = k; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(f.x, f.y - 4, f.r * (1.1 - 0.3 * k), f.a - f.arc / 2, f.a + f.arc / 2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
      } else if (f.ghost) {
        drawSprite(p.char.look, p.form, p.shiny, p.char.id, f.x, f.y, p.form && p.form.sc || p.char.look.sc || 1, f.face, 0, { alpha: k * 0.4, white: true });
      } else {
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.fillStyle = f.color;
        const s = Math.max(1, Math.round(f.size));
        if (f.plus) { ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y), 5, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y) - 2, 1, 5); }
        else ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s);
        ctx.globalAlpha = 1;
      }
    }

    // textos flotantes
    ctx.textAlign = 'center';
    for (const t of G.texts) {
      ctx.globalAlpha = Math.min(1, t.t * 3);
      ctx.font = (t.big ? '10' : '8') + 'px "Press Start 2P", monospace';
      ctx.fillStyle = '#000';
      ctx.fillText(t.v, Math.round(t.x) + 1, Math.round(t.y) + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.v, Math.round(t.x), Math.round(t.y));
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // flecha hacia la grieta si está fuera de pantalla
    if (G.rift && !onScreen(G.rift.x, G.rift.y, -10)) edgeArrow(G.rift.x, G.rift.y, '#a0e0ff');
    for (const e of G.enemies) if ((e.boss || e.golden || e.wildShiny) && !e.dead && !onScreen(e.x, e.y, -10)) edgeArrow(e.x, e.y, e.golden || e.wildShiny ? '#ffd040' : '#ff4040');

    // noche / luna llena
    if (G.weather === 'moon') { ctx.fillStyle = 'rgba(20,10,60,0.25)'; ctx.fillRect(0, 0, VW, VH); }
    if (G.zeno) { ctx.fillStyle = 'rgba(160,120,255,' + (0.1 + 0.05 * Math.sin(G.t * 4)) + ')'; ctx.fillRect(0, 0, VW, VH); }
    if (p.hp < p.maxHp * 0.25) { ctx.fillStyle = 'rgba(255,0,0,' + (0.08 + 0.06 * Math.sin(G.t * 8)) + ')'; ctx.fillRect(0, 0, VW, VH); }
    if (G.flash > 0) { ctx.globalAlpha = Math.min(0.8, G.flash); ctx.fillStyle = G.flashColor; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
  }

  const capImgs = {};
  function capImg(color) {
    if (capImgs[color]) return capImgs[color].complete ? capImgs[color] : null;
    const im = new Image(); im.src = PX.capsule(color); capImgs[color] = im; return null;
  }
  const ballImgs = {};
  function ballImg(n) {
    if (ballImgs[n]) return ballImgs[n].complete ? ballImgs[n] : null;
    const im = new Image(); im.src = PX.dragonBall(n); ballImgs[n] = im; return null;
  }

  function circle(x, y, r) { ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), Math.max(0.5, r), 0, Math.PI * 2); ctx.fill(); }

  function edgeArrow(x, y, color) {
    const cx = VW / 2, cy = VH / 2;
    const a = Math.atan2(y - (G.cam.y + cy), x - (G.cam.x + cx));
    const ex = clamp(cx + Math.cos(a) * VW, 10, VW - 10), ey = clamp(cy + Math.sin(a) * VH, 22, VH - 30);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.fill();
    ctx.restore();
  }

  function drawPickup(q) {
    const x = Math.round(q.x), y = Math.round(q.y - q.z);
    const bob = Math.round(Math.sin(G.t * 4 + q.x) * 1);
    switch (q.type) {
      case 'xp': {
        const c = q.val >= 25 ? '#ff4060' : q.val >= 5 ? '#40e070' : '#40b0ff';
        ctx.fillStyle = '#10102a'; ctx.fillRect(x - 2, y - 3 + bob, 5, 6);
        ctx.fillStyle = c; ctx.fillRect(x - 1, y - 2 + bob, 3, 4);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 2 + bob, 1, 1);
        break;
      }
      case 'coin':
        ctx.fillStyle = '#7a5a00'; ctx.fillRect(x - 3, y - 3 + bob, 6, 6);
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 2, y - 2 + bob, 4, 4);
        ctx.fillStyle = '#fff6b0'; ctx.fillRect(x - 1, y - 2 + bob, 1, 2);
        break;
      case 'ticket': case 'ticket10': {
        const c = q.type === 'ticket' ? '#ffd23f' : '#c47bff';
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(G.t * 6); ctx.fillStyle = c; circle(x, y + bob, 8); ctx.globalAlpha = 1;
        ctx.fillStyle = '#2a1a00'; ctx.fillRect(x - 5, y - 4 + bob, 10, 8);
        ctx.fillStyle = c; ctx.fillRect(x - 4, y - 3 + bob, 8, 6);
        ctx.fillStyle = '#2a1a00'; ctx.fillRect(x - 1, y - 3 + bob, 1, 6);
        break;
      }
      case 'senzu':
        ctx.fillStyle = '#1a3a10'; ctx.fillRect(x - 3, y - 2 + bob, 7, 5);
        ctx.fillStyle = '#5fe08a'; ctx.fillRect(x - 2, y - 1 + bob, 5, 3);
        ctx.fillStyle = '#c0ffc0'; ctx.fillRect(x - 1, y - 1 + bob, 2, 1);
        break;
      case 'magnet':
        ctx.fillStyle = '#ff4060'; ctx.fillRect(x - 4, y - 4 + bob, 3, 7); ctx.fillRect(x + 1, y - 4 + bob, 3, 7); ctx.fillRect(x - 4, y + 1 + bob, 8, 2);
        ctx.fillStyle = '#e0e0f0'; ctx.fillRect(x - 4, y - 4 + bob, 3, 2); ctx.fillRect(x + 1, y - 4 + bob, 3, 2);
        break;
      case 'bomb':
        ctx.fillStyle = '#202030'; circle(x, y + bob, 4); ctx.fillStyle = '#ff7b3d'; ctx.fillRect(x, y - 6 + bob, 2, 2); ctx.fillStyle = '#ffe060'; ctx.fillRect(x + 1, y - 7 + bob, 1, 1);
        break;
      case 'item': {
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(G.t * 5); ctx.fillStyle = '#ffd23f'; circle(x, y + bob, 10); ctx.globalAlpha = 1;
        const img = capImg('#ffc020'); if (img) ctx.drawImage(img, x - 7, y - 8 + bob, 14, 14);
        break;
      }
      case 'ball': {
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(G.t * 5); ctx.fillStyle = '#ffa020'; circle(x, y + bob, 10); ctx.globalAlpha = 1;
        const img = ballImg(q.val); if (img) ctx.drawImage(img, x - 6, y - 6 + bob, 12, 12);
        break;
      }
      default: break;
    }
  }

  function drawPlayer() {
    const p = G.player;
    const sc = (p.form && p.form.sc) || p.char.look.sc || 1;
    shadow(p.x, p.y + 12 * sc, 8 * sc);
    if (p.form) { // aura
      const a = p.form.a;
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin(G.t * 20);
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 8 * sc, 15 * sc, 24 * sc + Math.sin(G.t * 25) * 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const blink = p.inv > 0 && !p.dash && Math.floor(G.t * 20) % 2 === 0;
    const fr = p.atkT > 0 ? 4 : p.moving ? 2 + (Math.floor(p.animT * 8) % 2) : Math.floor(G.t * 2) % 2;
    if (!blink) drawSprite(p.char.look, p.form, p.shiny, p.char.id, p.x, p.y, sc, p.face, fr, {});
    // escudo de ki defensivo
    if (p.buffs.def > 0.05) { ctx.strokeStyle = 'rgba(120,255,140,' + Math.min(0.6, p.buffs.def) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y - 6, 18 * sc, 0, Math.PI * 2); ctx.stroke(); }
  }

  function drawEnemy(e) {
    const sc = (e.form && e.form.sc ? e.form.sc / ((e.char && e.char.look.sc) || 1) : 1) * e.sc;
    const alpha = e.dead ? Math.max(0, e.fade / 0.25) : 1;
    if (!e.dead || alpha > 0) {
      shadow(e.x, e.y + 12 * sc, 7 * sc * (e.hop ? 0.7 : 1));
      if (e.boss || e.elite || e.wildShiny) {
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(G.t * 10);
        ctx.fillStyle = e.wildShiny ? '#ffe860' : e.elite ? '#ffd040' : (e.form && e.form.a) || '#ff4040';
        ctx.beginPath(); ctx.ellipse(e.x, e.y - 8 * sc, 14 * sc, 22 * sc, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      const frame = e.atkT > 0 ? 4 : e.stun > 0 ? 0 : 2 + (Math.floor(e.anim * 6) % 2);
      drawSprite(e.look, e.form, !!e.wildShiny, e.key, e.x, e.y, sc, e.face, frame, {
        white: e.flash > 0 || e.dead, gold: e.golden, alpha, hop: e.hop,
      });
      if (e.shield > 0) { ctx.strokeStyle = 'rgba(120,180,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x, e.y - 8 * sc, e.r + 8, 0, Math.PI * 2); ctx.stroke(); }
      if (e.stun > 0) { ctx.fillStyle = '#ffff80'; for (let i = 0; i < 3; i++) { const a = G.t * 6 + i * 2.1; ctx.fillRect(Math.round(e.x + Math.cos(a) * 8), Math.round(e.y - 34 * sc + Math.sin(a) * 2), 2, 2); } }
      if (e.wildShiny && Math.random() < 0.3) G.fx.push({ x: e.x + rand(-8, 8), y: e.y + rand(-14, 6), vx: 0, vy: -15, life: 0.5, max: 0.5, size: 1, color: '#ffffff', plus: 1 });
      // barra de vida (élite / no jefes heridos)
      if (!e.boss && !e.dead && (e.elite || e.wildShiny || e.golden) && e.hp < e.maxHp) {
        const w = 20 * sc, x = Math.round(e.x - w / 2), y = Math.round(e.y - 38 * sc);
        ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 4);
        ctx.fillStyle = e.wildShiny ? '#ffe860' : '#ff5050'; ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), 2);
      }
    }
  }

  function drawBeam(bm, p) {
    const k = bm.t / bm.charge;
    ctx.save(); ctx.translate(bm.x, bm.y); ctx.rotate(bm.a);
    if (bm.t < bm.charge) {
      ctx.fillStyle = bm.color; circle(6, 0, 2 + k * bm.w * 0.4);
      ctx.fillStyle = '#ffffff'; circle(6, 0, 1 + k * bm.w * 0.2);
    } else {
      const rem = (bm.charge + bm.dur - bm.t) / bm.dur;
      const w = bm.w * Math.min(1, rem * 4) * (1 + Math.sin(G.t * 40) * 0.08);
      ctx.globalAlpha = 0.35; ctx.fillStyle = bm.color; ctx.fillRect(4, -w * 0.75, bm.len, w * 1.5);
      ctx.globalAlpha = 1; ctx.fillStyle = bm.color; ctx.fillRect(4, -w / 2, bm.len, w);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(4, -w / 5, bm.len, w / 2.5);
      ctx.fillStyle = bm.color; circle(6, 0, w * 0.75); circle(bm.len + 4, 0, w * 0.6);
      ctx.fillStyle = '#ffffff'; circle(6, 0, w * 0.4);
    }
    ctx.restore();
    void p;
  }

  // ---------- entrada ----------
  function bindInput(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => {
      if (!G) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { if (!G.over) UI.togglePause(); e.preventDefault(); return; }
      if (G.paused) { UI.keyInModal(e); return; }
      keys[e.code] = true;
      if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 4) setActive(n - 1); }
      if (e.code === 'KeyQ') cycle(-1);
      if (e.code === 'KeyE') cycle(1);
      if (e.code === 'Space') { transform(); e.preventDefault(); }
      if (e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', () => { Object.keys(keys).forEach(k => (keys[k] = false)); if (G && !G.paused && !G.over) UI.togglePause(); });
    const area = document.getElementById('touch');
    area.addEventListener('pointerdown', e => {
      if (!G || G.paused) return;
      joy.active = true; joy.id = e.pointerId; joy.sx = joy.x = e.clientX; joy.sy = joy.y = e.clientY;
      area.setPointerCapture(e.pointerId);
      UI.hud.joy(joy);
    });
    area.addEventListener('pointermove', e => {
      if (!joy.active || e.pointerId !== joy.id) return;
      joy.x = e.clientX; joy.y = e.clientY;
      const dx = joy.x - joy.sx, dy = joy.y - joy.sy, l = Math.hypot(dx, dy);
      if (l > 50) { joy.sx = joy.x - dx / l * 50; joy.sy = joy.y - dy / l * 50; }
      UI.hud.joy(joy);
    });
    const end = e => { if (e.pointerId === joy.id) { joy.active = false; UI.hud.joy(joy); } };
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', end);
  }

  return {
    bindInput, start, stop, pause, transform, setActive, cycle, chooseCard, reroll, endRun, equipItem,
    moveStats: inst => moveStats(inst), moveName,
    get state() { return G; },
    debug,
    // avanza la simulación sin dibujar (pruebas de equilibrio)
    step(n, dt) { for (let i = 0; i < n && G && !G.over; i++) { if (!G.paused) update(dt || 1 / 60); } },
    resumeAfterItem() { if (G) { G.paused = false; if (G.pendingLevels > 0) openLevelUp(); } },
  };
})();
