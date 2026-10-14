// Motor: salas, combate twin-stick, amigos, objetos, pisos y jefes.
'use strict';

const Game = (() => {
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const d2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

  const X0 = WALL, Y0 = WALL, X1 = WALL + COLS * T, Y1 = WALL + ROWS * T;
  const CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
  const DOOR = 16; // media anchura del hueco de la puerta

  let cv, ctx, G = null, running = false, raf = 0, last = 0, uid = 1;
  const keys = {};
  const mouse = { x: 0, y: 0, down: false, right: false };
  const sticks = { move: { on: false, x: 0, y: 0 }, aim: { on: false, x: 0, y: 0 } };
  const debug = {};

  // ---------------- Pokémon ----------------
  const DEX = Sprites.DEX;
  const BST = d => { const s = DEX[d].stats; return s.hp + s.atk + s.def + s.spa + s.spd + s.spe; };
  const CHILDREN = {};
  for (const p of POKEDEX) if (p.evo && DEX[p.evo]) (CHILDREN[p.evo] = CHILDREN[p.evo] || []).push(p.dex);
  function evoLevel(dex) {
    const kids = CHILDREN[dex];
    if (!kids) return 0;
    const p = DEX[dex];
    const parent = p.evo && DEX[p.evo];
    const grand = kids.some(k => CHILDREN[k]);
    if (parent) return 34;      // fase intermedia
    if (grand) return 16;       // primera fase de una línea de tres
    return 25;                  // línea de dos fases (piedras incluidas)
  }

  function rollMoves(dex) {
    const ts = DEX[dex].types;
    const ta = Math.random() < 0.7 ? ts[0] : pick(ts);
    const tb = pick(ts);
    const a = pick(TYPE_MOVES[ta].a);
    let b = pick(TYPE_MOVES[tb].b);
    if (Math.random() < 0.25) b = pick(TYPE_MOVES[pick(ts)].b);
    return [a, b];
  }
  function power(m) { return Math.round(BST(m.dex) * m.lvl / 12); }
  function makeMon(dex, lvl, opts) {
    const m = Object.assign({ id: uid++, dex, lvl, exp: 0, moves: rollMoves(dex), shiny: false, fainted: false }, opts || {});
    m.exp = expFor(m.lvl);
    m.power = power(m);
    m.hp = maxHp(m);
    return m;
  }
  const expFor = l => Math.round(l * l * l * 0.8);
  function stat(base, lvl) { return Math.floor((2 * base + 15) * lvl / 100) + 5; }
  function maxHp(m, items) {
    let h = (Math.floor((2 * DEX[m.dex].stats.hp + 15) * m.lvl / 100) + m.lvl + 10) * (m.boss ? 1 : m.wild ? 2.2 : 4);
    if (items) h *= (1 + 0.15 * (items.mas_ps || 0)) * (1 + 0.2 * (items.piedra_eterna || 0));
    return Math.round(h);
  }
  function stats(m, items) {
    const b = DEX[m.dex].stats, L = m.lvl, it = items || {};
    return {
      atk: stat(b.atk, L) * (1 + 0.15 * (it.proteina || 0)),
      def: stat(b.def, L) * (1 + 0.15 * (it.hierro || 0)) * (it.chaleco_asalto ? 1.25 : 1),
      spa: stat(b.spa, L) * (1 + 0.15 * (it.calcio || 0)),
      spd: stat(b.spd, L) * (1 + 0.15 * (it.zinc || 0)) * (it.chaleco_asalto ? 1.25 : 1),
      spe: b.spe,
    };
  }
  function typeEff(mt, defTypes) {
    let e = 1;
    for (const t of defTypes) { const f = TYPE_CHART[mt] && TYPE_CHART[mt][t]; if (f !== undefined) e *= f; }
    return e;
  }

  // ---------------- inicio ----------------
  function start(leader) {
    Audio8.resume();
    const m = makeMon(leader.dex, 5, { moves: leader.moves.slice(), shiny: leader.shiny });
    G = {
      floor: 0, party: [m], active: 0, coins: 0, items: {}, t: 0, kills: 0, friends: [], over: false, paused: false,
      enemies: [], shots: [], fx: [], texts: [], zones: [], orbs: [], bolts: [], banner: null, shake: 0, flash: 0,
      trans: null, modal: null, focusUsed: false, bossDead: false, stairs: null,
    };
    G.p = { x: CX, y: CY + 40, r: 7, face: Math.PI / 2, aim: Math.PI / 2, anim: 'idle', animT: 0, atkT: 0, inv: 1, swapCd: 0, cdA: 0, cdB: 0, vx: 0, vy: 0, side: 'p', status: {} };
    newFloor(0);
    running = true;
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    Save.d.stats.runs++;
    Save.save();
  }

  function newFloor(f) {
    G.floor = f;
    G.zone = ZONES[f];
    G.dun = Dungeon.generate(f);
    G.pools = buildPools(f);
    G.room = G.dun.start;
    G.p.x = CX; G.p.y = CY + 30;
    G.enemies = []; G.shots = []; G.zones = []; G.orbs = [];
    G.stairs = null; G.bossDead = false;
    revealAround(G.room);
    UI.banner('Piso ' + (f + 1) + ' · ' + G.zone.name, f === 0 ? 'Limpia las salas y busca al jefe' : '¡Los Pokémon son más fuertes!');
    Audio8.music('battle');
    for (const m of G.party) Sprites.preload(m.dex, m.shiny);
    UI.hudFull();
  }

  function buildPools(f) {
    const z = ZONES[f];
    const cap = [330, 410, 470, 500, 520, 999][f];
    const pool = POKEDEX.filter(p => !p.leg && p.dex !== 132 && p.types.some(t => z.types.includes(t)) && BST(p.dex) <= cap);
    const weak = pool.filter(p => BST(p.dex) <= cap - 120);
    return { all: pool.map(p => p.dex), weak: (weak.length >= 4 ? weak : pool).map(p => p.dex) };
  }

  function revealAround(room) {
    room.visited = true; room.seen = true;
    for (const [d, [dx, dy]] of Object.entries(Dungeon.DIRS)) {
      if (!room.doors[d]) continue;
      const r = G.dun.rooms[(room.x + dx) + ',' + (room.y + dy)];
      if (r) r.seen = true;
    }
  }

  // ---------------- entrada en una sala ----------------
  function enterRoom(room) {
    G.room = room;
    G.enemies = []; G.shots = []; G.zones = []; G.orbs = []; G.focusUsed = false;
    revealAround(room);
    if (!room.cleared && room.type === 'fight') spawnWave(room);
    if (!room.cleared && room.type === 'boss') spawnBoss(room);
    if (room.type === 'treasure' && !room.stocked) {
      room.stocked = true;
      room.pickups.push({ type: 'item', id: pick(POOL_TREASURE), x: CX, y: CY, ped: true });
    }
    if (room.type === 'shop' && !room.stocked) {
      room.stocked = true;
      const pool = Object.keys(ITEMS).sort(() => Math.random() - 0.5).slice(0, 2);
      room.pickups.push({ type: 'item', id: pool[0], x: CX - 60, y: CY + 10, price: ITEMS[pool[0]].price, ped: true });
      room.pickups.push({ type: 'item', id: pool[1], x: CX, y: CY + 10, price: ITEMS[pool[1]].price, ped: true });
      room.pickups.push({ type: 'potion', x: CX + 60, y: CY + 10, price: 5, ped: true, val: 0.5 });
    }
    if (room.type === 'heal' && !room.stocked) { room.stocked = true; room.nurse = { x: CX, y: CY - 30, used: false }; }
    if (room.type === 'boss' && room.cleared && G.stairs) { /* escalera ya puesta */ }
    UI.hudFull();
  }

  function freeSpot(minDist) {
    for (let i = 0; i < 60; i++) {
      const tx = randi(1, COLS - 2), ty = randi(1, ROWS - 2);
      if (G.room.layout[ty][tx]) continue;
      const x = X0 + tx * T + T / 2, y = Y0 + ty * T + T / 2;
      if (d2(x, y, G.p.x, G.p.y) < minDist * minDist) continue;
      return [x, y];
    }
    return [CX + rand(-60, 60), CY + rand(-30, 30)];
  }

  function spawnWave(room) {
    const f = G.floor;
    const n = 3 + Math.floor(f * 0.7) + randi(0, 2);
    for (let i = 0; i < n; i++) {
      const dex = Math.random() < 0.6 - f * 0.08 ? pick(G.pools.weak) : pick(G.pools.all);
      const lvl = Math.max(2, G.zone.lvl + randi(-2, 1) + (dex && CHILDREN[dex] ? 0 : 1));
      const [x, y] = freeSpot(80);
      addEnemy(makeMon(dex, lvl, { shiny: Math.random() < 1 / 400, wild: true }), x, y);
    }
    if (room.rare) {
      const dex = pick([151, 143, 131, 132, 137, 133]);
      const [x, y] = freeSpot(90);
      addEnemy(makeMon(dex, G.zone.lvl + 3, { shiny: Math.random() < 1 / 100, wild: true }), x, y, { rare: true });
      UI.banner('¡Un ' + DEX[dex].name + ' salvaje!', 'Pokémon poco común: derrótalo y quizá se haga tu amigo', '#ffd23f');
    }
    room.locked = true;
  }

  function spawnBoss(room) {
    const dex = G.zone.boss;
    const m = makeMon(dex, G.zone.lvl + 2 + G.floor, { boss: true, shiny: Math.random() < 1 / 50 });
    m.hp = maxHp(m) * (11 + G.floor * 3);
    const e = addEnemy(m, CX, CY - 20, { boss: true, scale: 1.8 });
    e.maxHp = m.hp;
    room.locked = true;
    UI.banner('¡' + DEX[dex].name + ' gigante!', 'Jefe del piso · ' + G.zone.name, '#ff5050');
    Audio8.play('boss');
    Audio8.music('boss');
  }

  function addEnemy(m, x, y, o) {
    o = o || {};
    Sprites.preload(m.dex, m.shiny);
    const p = DEX[m.dex];
    const e = {
      id: uid++, side: 'e', mon: m, x, y, r: o.boss ? 13 : 7, scale: o.scale || 1, boss: !!o.boss, rare: !!o.rare,
      maxHp: m.hp, face: Math.PI / 2, anim: 'idle', animT: rand(0, 1), atkT: 0, appear: 0.6,
      cdA: rand(1, 2.5), cdB: rand(3, 6), status: {}, kx: 0, ky: 0, flash: 0, wander: rand(0, 6.28), patT: 2, pat: 0,
      spd: 26 + Math.min(70, p.stats.spe * 0.35),
      ranged: ['proj', 'fan', 'beam', 'burst', 'meteor', 'chain', 'mines', 'boomerang'].includes(MOVES[m.moves[0]].cls),
    };
    e.st = stats(m);
    G.enemies.push(e);
    G.fx.push({ ring: 1, x, y: y - 8, r: 2, r1: 16, life: 0.4, max: 0.4, color: '#ffffff' });
    return e;
  }

  // ---------------- bucle ----------------
  function loop(ts) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    let dt = Math.max(0, Math.min(0.05, (ts - last) / 1000));
    last = ts;
    if (!G.paused && !G.over && !G.modal) update(dt);
    render();
    UI.hud(G);
  }

  function update(dt) {
    G.t += dt;
    if (G.trans) {
      G.trans.t += dt / 0.35;
      if (G.trans.t >= 1) {
        const tr = G.trans;
        G.trans = null;
        enterRoom(tr.to);
        G.p.x = tr.px; G.p.y = tr.py;
        G.p.inv = Math.max(G.p.inv, 0.6);
      }
      return;
    }
    updatePlayer(dt);
    updateEnemies(dt);
    updateShots(dt);
    updateZones(dt);
    updateOrbs(dt);
    updatePickups(dt);
    updateFx(dt);
    // sala limpia
    const room = G.room;
    if (room.locked && !G.enemies.some(e => !e.dead)) {
      room.locked = false; room.cleared = true;
      Audio8.play('door');
      if (room.type === 'fight') roomReward();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3);
  }

  function roomReward() {
    const r = Math.random();
    if (r < 0.35) dropPickup('coin', CX, CY, randi(1, 3));
    else if (r < 0.55) dropPickup('berry', CX, CY, 0.25);
    else if (r < 0.62) dropPickup('potion', CX, CY, 0.5);
  }

  // ---------------- jugador ----------------
  function active() { return G.party[G.active]; }

  function inputMove() {
    let mx = 0, my = 0;
    if (keys.KeyW) my -= 1; if (keys.KeyS) my += 1; if (keys.KeyA) mx -= 1; if (keys.KeyD) mx += 1;
    if (sticks.move.on) { mx = sticks.move.x; my = sticks.move.y; }
    if (debug.move) { mx = debug.move[0]; my = debug.move[1]; }
    const l = Math.hypot(mx, my);
    if (l > 1) { mx /= l; my /= l; }
    return [mx, my];
  }
  function inputAim() {
    let ax = 0, ay = 0;
    if (keys.ArrowUp) ay -= 1; if (keys.ArrowDown) ay += 1; if (keys.ArrowLeft) ax -= 1; if (keys.ArrowRight) ax += 1;
    if (ax || ay) return Math.atan2(ay, ax);
    if (sticks.aim.on && Math.hypot(sticks.aim.x, sticks.aim.y) > 0.3) return Math.atan2(sticks.aim.y, sticks.aim.x);
    if (mouse.down) { const [wx, wy] = toWorld(mouse.x, mouse.y); return Math.atan2(wy - (G.p.y - 8), wx - G.p.x); }
    if (debug.aim !== undefined && debug.aim !== null) return debug.aim;
    return null;
  }

  function speedOf(m) { return (62 + Math.min(80, DEX[m.dex].stats.spe * 0.45)) * (1 + 0.3 * (G.items.panuelo_eleccion ? 1 : 0)) * (1 + 0.12 * (G.items.carburante || 0)); }

  function updatePlayer(dt) {
    const p = G.p, m = active();
    p.animT += dt;
    if (p.inv > 0) p.inv -= dt;
    if (p.atkT > 0) p.atkT -= dt;
    if (p.swapCd > 0) p.swapCd -= dt;
    const cdMul = Math.pow(0.8, G.items.garra_rapida || 0) * Math.pow(0.9, G.items.pp_max || 0);
    p.cdA -= dt; p.cdB -= dt;
    tickStatus(p, m, dt, true);
    if (m.hp <= 0) return;
    if (p.dash) {
      const d = p.dash;
      d.t += dt;
      moveUnit(p, d.vx * dt, d.vy * dt, true);
      hitArc(p, d.move, p.x, p.y, 14, 0, Math.PI * 2, d.hit);
      if (d.t >= d.dur) p.dash = null;
    } else {
      const [mx, my] = inputMove();
      let sp = speedOf(m) * (p.status.slow > 0 ? 0.55 : 1) * (p.status.para > 0 ? 0.7 : 1);
      if (p.status.freeze > 0) sp = 0;
      moveUnit(p, mx * sp * dt, my * sp * dt, true);
      p.moving = Math.hypot(mx, my) > 0.1;
      if (p.moving && p.atkT <= 0) p.face = Math.atan2(my, mx);
    }
    const aim = inputAim();
    if (aim !== null) { p.aim = aim; if (p.cdA <= 0) { useMove(p, m, m.moves[0], aim); p.cdA = MOVES[m.moves[0]].cd * cdMul; } }
    if ((keys.Space || mouse.right || sticks.b || debug.b) && p.cdB <= 0) {
      const a = aim !== null ? aim : (nearestEnemyAngle(p) ?? p.face);
      useMove(p, m, m.moves[1], a);
      p.cdB = MOVES[m.moves[1]].cd * cdMul * 1.4;
    }
    // regeneración por Restos
    if (G.items.restos) m.hp = Math.min(maxHp(m, G.items), m.hp + maxHp(m, G.items) * 0.01 * G.items.restos * dt);
    p.anim = p.atkT > 0 ? 'attack' : p.moving ? 'walk' : 'idle';
    // puertas
    checkDoors();
    // enfermera
    const n = G.room.nurse;
    if (n && !n.used && d2(p.x, p.y, n.x, n.y) < 22 * 22) {
      n.used = true;
      for (const q of G.party) { q.fainted = false; q.hp = maxHp(q, G.items); }
      UI.banner('¡Tus Pokémon están como nuevos!', 'Centro Pokémon', '#ff9ed8');
      Audio8.play('heal');
    }
    // escalera al siguiente piso
    if (G.stairs && d2(p.x, p.y, G.stairs.x, G.stairs.y) < 14 * 14) nextFloor();
  }

  function nearestEnemyAngle(u) {
    let best = null, bd = 1e9;
    for (const e of G.enemies) { if (e.dead || e.appear > 0) continue; const dd = d2(u.x, u.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
    return best ? Math.atan2(best.y - u.y, best.x - u.x) : null;
  }

  function solidAt(x, y) {
    if (x < X0 || y < Y0 || x >= X1 || y >= Y1) return true;
    const tx = Math.floor((x - X0) / T), ty = Math.floor((y - Y0) / T);
    return !!G.room.layout[ty][tx];
  }

  // Mueve una unidad respetando paredes, rocas y huecos de puerta
  function moveUnit(u, dx, dy, isPlayer) {
    const r = u.r;
    const doorOpen = isPlayer && !G.room.locked;
    const tryAxis = (nx, ny) => {
      // dentro del hueco de una puerta abierta se puede salir del recinto
      if (doorOpen) {
        const D = G.room.doors;
        if ((D.n && ny - r < Y0 && Math.abs(nx - CX) < DOOR - 2) || (D.s && ny + r > Y1 && Math.abs(nx - CX) < DOOR - 2) ||
          (D.w && nx - r < X0 && Math.abs(ny - CY) < DOOR - 2) || (D.e && nx + r > X1 && Math.abs(ny - CY) < DOOR - 2)) {
          return Math.abs(nx - CX) < X1 && Math.abs(ny - CY) < Y1;
        }
      }
      const pts = [[nx - r, ny - r * 0.5], [nx + r, ny - r * 0.5], [nx - r, ny + r * 0.6], [nx + r, ny + r * 0.6]];
      return !pts.some(([x, y]) => solidAt(x, y));
    };
    if (tryAxis(u.x + dx, u.y)) u.x += dx;
    if (tryAxis(u.x, u.y + dy)) u.y += dy;
  }

  function checkDoors() {
    const p = G.p, room = G.room;
    if (room.locked) return;
    let dir = null;
    if (p.y < Y0 - 4 && room.doors.n) dir = 'n';
    else if (p.y > Y1 + 4 && room.doors.s) dir = 's';
    else if (p.x < X0 - 4 && room.doors.w) dir = 'w';
    else if (p.x > X1 + 4 && room.doors.e) dir = 'e';
    if (!dir) return;
    const [dx, dy] = Dungeon.DIRS[dir];
    const to = G.dun.rooms[(room.x + dx) + ',' + (room.y + dy)];
    if (!to) return;
    const px = dir === 'w' ? X1 - 14 : dir === 'e' ? X0 + 14 : CX;
    const py = dir === 'n' ? Y1 - 14 : dir === 's' ? Y0 + 18 : CY;
    // guarda los objetos que queden en el suelo
    G.trans = { dir, t: 0, from: room, to, px, py };
    Audio8.play('step');
  }

  function nextFloor() {
    if (G.floor >= ZONES.length - 1) return win();
    G.stairs = null;
    Audio8.play('stairs');
    G.flash = 1;
    newFloor(G.floor + 1);
  }

  // ---------------- técnicas ----------------
  function useMove(u, m, moveId, ang) {
    const mv = MOVES[moveId];
    const isP = u.side === 'p';
    u.atkT = Math.min(0.35, Sprites.animLen(m.dex, 'attack'));
    u.animT = 0;
    u.face = ang;
    const spdMul = isP ? 1 : 0.7;
    const col = TYPE_COLORS[mv.type];
    if (isP && G.items.vidasfera) m.hp = Math.max(1, m.hp - maxHp(m, G.items) * 0.015);
    const ox = u.x, oy = u.y - 8 * (u.scale || 1);
    switch (mv.cls) {
      case 'melee':
        hitArc(u, moveId, ox, oy, mv.range * (u.scale || 1), ang, mv.arc, null);
        G.fx.push({ slash: 1, x: ox, y: oy, a: ang, arc: mv.arc, r: mv.range * (u.scale || 1), life: 0.16, max: 0.16, color: col });
        Audio8.play('slash');
        break;
      case 'dash': {
        const dur = 0.18, sp = mv.dist / dur;
        if (isP) { u.dash = { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t: 0, dur, move: moveId, hit: new Set() }; u.inv = Math.max(u.inv, 0.25); }
        else { u.charge = { vx: Math.cos(ang) * sp * 0.8, vy: Math.sin(ang) * sp * 0.8, t: 0, dur: dur * 1.3, move: moveId, hit: false }; }
        Audio8.play('dash');
        break;
      }
      case 'proj': {
        shot(u, moveId, ox, oy, ang, mv.speed * spdMul, mv);
        Audio8.play('shoot');
        break;
      }
      case 'fan':
        for (let i = 0; i < mv.count; i++) {
          const a = ang + (mv.count > 1 ? (i / (mv.count - 1) - 0.5) * mv.arc : 0);
          shot(u, moveId, ox, oy, a, mv.speed * spdMul * rand(0.9, 1.1), mv);
        }
        Audio8.play('shoot');
        break;
      case 'burst': {
        const n = isP ? mv.count : Math.ceil(mv.count * 0.7);
        for (let i = 0; i < n; i++) shot(u, moveId, ox, oy, ang + (i / n) * Math.PI * 2, mv.speed * spdMul, mv);
        G.fx.push({ ring: 1, x: ox, y: oy, r: 4, r1: 24, life: 0.25, max: 0.25, color: col });
        Audio8.play('shoot');
        break;
      }
      case 'beam':
        G.zones.push({ kind: 'beam', side: u.side, owner: u, move: moveId, a: ang, len: mv.len, w: mv.width, t: 0, charge: isP ? 0.15 : 0.6, dur: mv.dur, tick: 0, color: col, mon: m });
        Audio8.play('charge');
        break;
      case 'orbit':
        G.orbs.push({ owner: u, move: moveId, mon: m, side: u.side, count: mv.count, radius: mv.radius, t: mv.dur, ang: 0, color: col, hits: new Map() });
        break;
      case 'aura':
        G.zones.push({ kind: 'aura', side: u.side, owner: u, move: moveId, mon: m, r: mv.radius * (u.scale || 1), t: mv.dur, tick: 0, color: col });
        Audio8.play('shoot');
        break;
      case 'boomerang':
        G.shots.push({ id: uid++, side: u.side, owner: u, mon: m, move: moveId, x: ox, y: oy, vx: Math.cos(ang) * mv.speed * spdMul, vy: Math.sin(ang) * mv.speed * spdMul, r: mv.size, color: col, boom: { out: mv.dist, trav: 0, back: false }, life: 4, pierce: 99, hit: new Set(), spin: 0 });
        Audio8.play('shoot');
        break;
      case 'chain': {
        const targets = isP ? G.enemies.filter(e => !e.dead && e.appear <= 0) : [G.p];
        let src = { x: ox, y: oy };
        const hit = new Set();
        for (let j = 0; j <= mv.jumps; j++) {
          let best = null, bd = (j === 0 ? 180 : mv.range) ** 2;
          for (const t of targets) { if (hit.has(t)) continue; const dd = d2(src.x, src.y, t.x, t.y); if (dd < bd) { bd = dd; best = t; } }
          if (!best) break;
          hit.add(best);
          G.bolts.push({ pts: zig(src.x, src.y, best.x, best.y - 8), life: 0.15, color: col });
          if (isP) damage(u, m, moveId, best, 1); else damage(u, m, moveId, best, 1);
          src = { x: best.x, y: best.y - 8 };
          if (!isP) break;
        }
        Audio8.play('zap');
        break;
      }
      case 'meteor': {
        const tg = isP ? G.enemies.filter(e => !e.dead && e.appear <= 0) : [G.p];
        for (let i = 0; i < (isP ? mv.count : Math.max(2, mv.count - 1)); i++) {
          const t = tg.length ? pick(tg) : null;
          const x = t ? t.x + rand(-10, 10) : u.x + rand(-80, 80), y = t ? t.y + rand(-8, 8) : u.y + rand(-50, 50);
          G.zones.push({ kind: 'meteor', side: u.side, owner: u, move: moveId, mon: m, x, y, r: mv.radius, t: 0, delay: mv.delay + i * 0.12 + (isP ? 0 : 0.3), color: col });
        }
        break;
      }
      case 'mines':
        for (let i = 0; i < mv.count; i++) {
          const a = rand(0, 6.28), r = rand(14, 40);
          G.zones.push({ kind: 'mine', side: u.side, owner: u, move: moveId, mon: m, x: clamp(u.x + Math.cos(a) * r, X0 + 6, X1 - 6), y: clamp(u.y + Math.sin(a) * r, Y0 + 6, Y1 - 6), r: mv.radius, t: mv.life, arm: 0.5, color: col });
        }
        break;
      default: break;
    }
  }

  function shot(u, moveId, x, y, a, speed, mv) {
    G.shots.push({
      id: uid++, side: u.side, owner: u, mon: u.side === 'p' ? active() : u.mon, move: moveId, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, spd: speed,
      r: mv.size || 3, color: TYPE_COLORS[mv.type], life: mv.life || 1, pierce: mv.pierce || 0, homing: mv.homing, explode: mv.explode, hit: new Set(),
    });
  }

  function zig(x0, y0, x1, y1) {
    const pts = [[x0, y0]];
    for (let i = 1; i < 5; i++) pts.push([x0 + (x1 - x0) * i / 5 + rand(-4, 4), y0 + (y1 - y0) * i / 5 + rand(-4, 4)]);
    pts.push([x1, y1]);
    return pts;
  }

  function hitArc(u, moveId, x, y, range, ang, arc, hitSet) {
    const m = u.side === 'p' ? active() : u.mon;
    const targets = u.side === 'p' ? G.enemies : [G.p];
    for (const t of targets) {
      if (t.dead || t.appear > 0 || (hitSet && hitSet.has(t))) continue;
      const ty = t.y - 8 * (t.scale || 1);
      const dd = Math.sqrt(d2(x, y, t.x, ty));
      if (dd > range + t.r) continue;
      if (arc < 6.2 && dd > t.r && Math.abs(angDiff(Math.atan2(ty - y, t.x - x), ang)) > arc / 2) continue;
      if (hitSet) hitSet.add(t);
      damage(u, m, moveId, t, 1, Math.atan2(ty - y, t.x - x));
    }
    // romper arbustos con ataques del jugador
    if (u.side === 'p') breakBushes(x + Math.cos(ang) * range * 0.6, y + Math.sin(ang) * range * 0.6, range * 0.6);
  }

  function breakBushes(x, y, r) {
    const L = G.room.layout;
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
      if (L[ty][tx] !== 2) continue;
      const cx = X0 + tx * T + T / 2, cy = Y0 + ty * T + T / 2;
      if (d2(x, y, cx, cy) < (r + 10) * (r + 10)) {
        L[ty][tx] = 0;
        for (let i = 0; i < 8; i++) G.fx.push({ x: cx, y: cy, vx: rand(-50, 50), vy: rand(-60, 10), life: 0.4, max: 0.4, size: 2, color: G.zone.rock === 'bush' ? '#3a7a2a' : '#8a8a9a' });
        if (Math.random() < 0.15) dropPickup(Math.random() < 0.7 ? 'coin' : 'berry', cx, cy, Math.random() < 0.7 ? 1 : 0.25);
        Audio8.play('break');
      }
    }
  }

  // ---------------- daño ----------------
  function damage(src, m, moveId, t, mult, ang) {
    const mv = MOVES[moveId];
    const isP = src.side === 'p';
    const tm = t.side === 'p' ? active() : t.mon;
    if (!tm || tm.hp <= 0) return;
    if (t.side === 'p' && (t.inv > 0 || t.dash)) return;
    if (t.side === 'p' && G.items.polvo_brillo && Math.random() < 0.15) { addText(t.x, t.y - 24, 'Falló', '#c0c0ff'); return; }
    const as = isP ? stats(m, G.items) : (src.st || stats(m));
    const ds = t.side === 'p' ? stats(tm, G.items) : (t.st || stats(tm));
    const A = mv.cat === 'f' ? as.atk : as.spa, D = mv.cat === 'f' ? ds.def : ds.spd;
    const eff = typeEff(mv.type, DEX[tm.dex].types);
    const stab = DEX[m.dex].types.includes(mv.type) ? 1.5 : 1;
    const crit = Math.random() < (isP ? 0.06 + 0.2 * (G.items.lente_zoom ? 1 : 0) : 0.04);
    let dmg = ((2 * m.lvl / 5 + 2) * mv.pow * A / Math.max(1, D) / 50 + 2) * stab * eff * rand(0.85, 1) * (crit ? 1.5 : 1) * (mult || 1);
    if (isP) {
      if (mv.cat === 'f' && G.items.cinta_eleccion) dmg *= 1.4;
      if (mv.cat === 'e' && G.items.gafas_eleccion) dmg *= 1.4;
      if (G.items.vidasfera) dmg *= 1.3;
    } else dmg *= 0.6; // los salvajes pegan algo menos (estilo Rumble)
    if (eff === 0) { addText(t.x, t.y - 24, 'No afecta', '#9090a0'); return; }
    dmg = Math.max(1, Math.round(dmg));
    tm.hp -= dmg;
    if (t.side === 'e') {
      t.flash = 0.1;
      if (!t.boss) { const a = ang ?? Math.atan2(t.y - src.y, t.x - src.x); t.kx += Math.cos(a) * 90; t.ky += Math.sin(a) * 90; }
      if (isP && G.items.cascabel_concha) m.hp = Math.min(maxHp(m, G.items), m.hp + dmg * 0.12);
      if (mv.drain && isP) m.hp = Math.min(maxHp(m, G.items), m.hp + dmg * mv.drain);
    } else {
      t.inv = 1.0;
      G.shake = Math.min(5, G.shake + 2.5);
      Audio8.play('hurt');
      if (G.items.casco_dentado && src.side === 'e' && (mv.cls === 'melee' || mv.cls === 'dash')) { src.mon.hp -= Math.round(src.maxHp * 0.15); src.flash = 0.1; if (src.mon.hp <= 0) killEnemy(src); }
    }
    if (mv.status && Math.random() < mv.status[1]) applyStatus(t, mv.status[0]);
    if (Save.d.settings.dmgNums || t.side === 'p') addText(t.x + rand(-4, 4), t.y - 18 * (t.scale || 1), dmg, t.side === 'p' ? '#ff6060' : eff > 1 ? '#ffd23f' : eff < 1 ? '#a0a0b0' : '#ffffff', crit || eff > 1);
    if (eff > 1 && isP && Math.random() < 0.3) addText(t.x, t.y - 30, '¡Es muy eficaz!', '#ffd23f');
    if (t.side === 'e') Audio8.play('hit');
    if (tm.hp <= 0) {
      if (t.side === 'e') killEnemy(t);
      else playerDown();
    }
  }

  function applyStatus(t, s) {
    const dur = { burn: 3, poison: 4, para: 2, slow: 2, freeze: 1.2 }[s];
    if (t.boss && s === 'freeze') return;
    t.status[s] = Math.max(t.status[s] || 0, t.boss ? dur * 0.4 : dur);
  }
  function tickStatus(u, m, dt, isP) {
    const st = u.status;
    for (const k of Object.keys(st)) if (st[k] > 0) st[k] -= dt;
    if ((st.burn > 0 || st.poison > 0) && m.hp > 0) {
      u.dot = (u.dot || 0) + dt;
      if (u.dot >= 0.5) {
        u.dot = 0;
        const mh = isP ? maxHp(m, G.items) : u.maxHp;
        const d = Math.max(1, Math.round(mh * (u.boss ? 0.004 : 0.03)));
        m.hp -= d;
        addText(u.x, u.y - 20, d, st.burn > 0 ? '#ff8040' : '#c060ff');
        if (m.hp <= 0) { if (isP) { m.hp = 1; } else killEnemy(u); }
      }
    }
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true; e.fade = 0.35;
    G.kills++;
    Save.d.seen[e.mon.dex] = 1;
    Audio8.play('faint');
    for (let i = 0; i < 10; i++) G.fx.push({ x: e.x, y: e.y - 8, vx: rand(-50, 50), vy: rand(-70, 10), life: 0.4, max: 0.4, size: rand(1, 3), color: pick(['#ffffff', '#ffd23f', TYPE_COLORS[DEX[e.mon.dex].types[0]]]) });
    // experiencia para el equipo (los demás reciben la mitad)
    const gain = Math.round(BST(e.mon.dex) / 4 * e.mon.lvl / 7 * 1.6 * (e.boss ? 4 : 1) * (G.items.huevo_suerte ? 1.5 : 1));
    // la experiencia depende de la diferencia de nivel: los rezagados se ponen al día
    G.party.forEach((q, i) => { if (!q.fainted) giveExp(q, Math.round((i === G.active ? gain : gain / 2) * clamp(Math.pow(e.mon.lvl / q.lvl, 1.6), 0.15, 1.8))); });
    // monedas y objetos
    const coins = (Math.random() < 0.3 ? 1 : 0) * (G.items.moneda_amuleto ? 2 : 1) + (e.boss ? 8 : e.rare ? 4 : 0);
    if (coins) dropPickup('coin', e.x, e.y, coins);
    if (Math.random() < 0.04) dropPickup('berry', e.x, e.y, 0.25);
    // ¡se hace tu amigo! (estilo Rumble)
    const chance = (e.boss ? 0.5 : e.rare ? 0.5 : 0.1) * (G.items.cascabel_amistad ? 2 : 1) + (e.mon.shiny ? 1 : 0);
    if (Math.random() < chance) {
      const fm = makeMon(e.mon.dex, e.mon.lvl, { shiny: e.mon.shiny, moves: e.mon.moves.slice() });
      delete fm.wild;
      G.room.pickups.push({ type: 'friend', mon: fm, x: e.x, y: e.y, t: 0 });
      addText(e.x, e.y - 30, '¡Quiere ser tu amigo!', '#7ff0a0');
    }
    if (e.boss) {
      G.bossDead = true;
      Save.d.stats.bosses++;
      Audio8.music('battle');
      G.room.pickups.push({ type: 'item', id: pick(POOL_TREASURE), x: CX - 40, y: CY + 30, ped: true });
      G.stairs = { x: CX + 40, y: CY + 30 };
      UI.banner(G.floor >= ZONES.length - 1 ? '¡Has vencido a ' + DEX[e.mon.dex].name + '!' : '¡Jefe derrotado!', G.floor >= ZONES.length - 1 ? 'Baja por la escalera para terminar la aventura' : 'Baja por la escalera al siguiente piso', '#7ff0a0');
    }
    Save.d.stats.kills++;
  }

  function giveExp(m, n) {
    if (m.lvl >= 100) return;
    m.exp += n;
    let up = false;
    while (m.lvl < 100 && m.exp >= expFor(m.lvl + 1)) {
      const oldMax = maxHp(m, G.items);
      m.lvl++;
      m.hp += maxHp(m, G.items) - oldMax;
      up = true;
    }
    if (up) {
      m.power = power(m);
      if (m === active()) { addText(G.p.x, G.p.y - 34, '¡Nivel ' + m.lvl + '!', '#7fd0ff'); Audio8.play('levelup'); }
      const el = evoLevel(m.dex);
      if (el && m.lvl >= el && !G.modal) evolve(m);
    }
  }

  function evolve(m) {
    const kids = CHILDREN[m.dex];
    if (!kids) return;
    const finish = to => {
      const from = DEX[m.dex].name;
      const oldMax = maxHp(m, G.items);
      m.dex = to;
      m.hp += maxHp(m, G.items) - oldMax;
      m.power = power(m);
      Sprites.preload(m.dex, m.shiny);
      G.modal = null;
      Save.d.seen[to] = 1;
      UI.banner('¡' + from + ' ha evolucionado en ' + DEX[to].name + '!', 'Sus estadísticas han mejorado', '#7ff0a0');
      Audio8.play('evolve');
      G.flash = 1;
      UI.hudFull();
    };
    if (kids.length === 1) return finish(kids[0]);
    G.modal = 'evo';
    UI.evolveChoice(m, kids, finish);
  }

  function playerDown() {
    const m = active();
    m.hp = 0;
    if (G.items.banda_focus && !G.focusUsed) { G.focusUsed = true; m.hp = 1; G.p.inv = 1.5; addText(G.p.x, G.p.y - 30, '¡Banda Focus!', '#ffd23f'); return; }
    m.fainted = true;
    Audio8.play('faint');
    addText(G.p.x, G.p.y - 30, '¡' + DEX[m.dex].name + ' se ha debilitado!', '#ff6060');
    const next = G.party.findIndex(q => !q.fainted && q.hp > 0);
    if (next < 0) return gameOver();
    swapTo(next, true);
  }

  function swapTo(i, forced) {
    if (!G || i === G.active || i < 0 || i >= G.party.length) return;
    const q = G.party[i];
    if (q.fainted) { Audio8.play('error'); return; }
    if (G.p.swapCd > 0 && !forced) return;
    G.active = i;
    G.p.swapCd = 1;
    G.p.inv = Math.max(G.p.inv, forced ? 1.5 : 0.4);
    G.p.status = {};
    G.p.cdA = 0.2; G.p.cdB = Math.max(G.p.cdB, 0.5);
    G.fx.push({ ring: 1, x: G.p.x, y: G.p.y - 8, r: 4, r1: 22, life: 0.35, max: 0.35, color: '#ffffff' });
    Audio8.play('swap');
    UI.hudFull();
  }

  function gameOver() {
    G.over = true;
    Audio8.play('lose');
    Audio8.music(null);
    finishRun(false);
  }
  function win() {
    G.over = true;
    Save.d.stats.wins++;
    Audio8.play('win');
    Audio8.music(null);
    finishRun(true);
  }
  function finishRun(won) {
    const st = Save.d.stats;
    st.bestFloor = Math.max(st.bestFloor, G.floor + 1);
    Save.save();
    const res = { won, floor: G.floor + 1, zone: G.zone.name, kills: G.kills, time: G.t, friends: G.friends.slice(), party: G.party.slice(), items: Object.assign({}, G.items) };
    setTimeout(() => UI.runOver(res), 900);
  }

  // ---------------- enemigos ----------------
  function updateEnemies(dt) {
    const p = G.p;
    for (const e of G.enemies) {
      if (e.dead) { e.fade -= dt; continue; }
      e.animT += dt;
      if (e.appear > 0) { e.appear -= dt; continue; }
      if (e.flash > 0) e.flash -= dt;
      if (e.atkT > 0) e.atkT -= dt;
      tickStatus(e, e.mon, dt, false);
      if (e.dead) continue;
      e.x += e.kx * dt; e.y += e.ky * dt;
      e.kx *= Math.pow(0.002, dt); e.ky *= Math.pow(0.002, dt);
      moveUnit(e, 0, 0, false);
      if (e.status.freeze > 0) continue;
      const slow = (e.status.slow > 0 ? 0.5 : 1) * (e.status.para > 0 ? 0.6 : 1);
      const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy - 0, dx);
      if (e.charge) {
        e.charge.t += dt;
        moveUnit(e, e.charge.vx * dt, e.charge.vy * dt, false);
        if (!e.charge.hit && d2(e.x, e.y, p.x, p.y) < (e.r + p.r + 4) ** 2) { e.charge.hit = true; damage(e, e.mon, e.charge.move, p, 1); }
        if (e.charge.t >= e.charge.dur) e.charge = null;
        e.anim = 'walk';
        continue;
      }
      if (e.boss) bossAI(e, dt, ang, dist);
      else {
        let mx = 0, my = 0;
        if (e.ranged) {
          const want = 90;
          const s = dist > want + 20 ? 1 : dist < want - 20 ? -1 : 0;
          e.wander += dt * 0.8;
          mx = dx / dist * s + Math.cos(e.wander) * 0.5; my = dy / dist * s + Math.sin(e.wander) * 0.5;
        } else { mx = dx / dist; my = dy / dist; }
        const l = Math.hypot(mx, my) || 1;
        const sp = e.spd * slow;
        moveUnit(e, mx / l * sp * dt, my / l * sp * dt, false);
        if (e.atkT <= 0) e.face = Math.atan2(my, mx);
        e.moving = l > 0.2;
        // ataques
        e.cdA -= dt * slow; e.cdB -= dt * slow;
        const mvA = MOVES[e.mon.moves[0]];
        const reach = mvA.cls === 'melee' ? mvA.range + 10 : mvA.cls === 'dash' ? 90 : 170;
        if (e.cdA <= 0 && dist < reach) {
          if (!e.tele) { e.tele = 0.35; }
        }
        if (e.tele !== undefined && e.tele !== null) {
          e.tele -= dt;
          if (e.tele <= 0) { e.tele = null; useMove(e, e.mon, e.mon.moves[0], ang); e.cdA = mvA.cd * 2.6 + rand(0.3, 1.2); }
        } else if (e.cdB <= 0 && dist < 160 && G.floor >= 1) {
          useMove(e, e.mon, e.mon.moves[1], ang);
          e.cdB = MOVES[e.mon.moves[1]].cd * 3 + rand(1, 3);
        }
        // contacto
        if (d2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2 * 0.8 && p.inv <= 0) damage(e, e.mon, 'placaje', p, 0.6);
      }
      e.anim = e.atkT > 0 ? 'attack' : 'walk';
      // separación
      for (const o of G.enemies) {
        if (o === e || o.dead) continue;
        const ddx = e.x - o.x, ddy = e.y - o.y, dd = ddx * ddx + ddy * ddy, rr = e.r + o.r;
        if (dd < rr * rr && dd > 0.01) { const l2 = Math.sqrt(dd), push = (rr - l2) * 0.5; if (!e.boss) moveUnit(e, ddx / l2 * push, ddy / l2 * push, false); }
      }
    }
    G.enemies = G.enemies.filter(e => !e.dead || e.fade > 0);
  }

  function bossAI(e, dt, ang, dist) {
    const p = G.p;
    const hpk = e.mon.hp / e.maxHp;
    const sp = e.spd * 0.6 * (hpk < 0.5 ? 1.3 : 1);
    if (dist > 50) moveUnit(e, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt, false);
    if (e.atkT <= 0) e.face = ang;
    if (d2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2 && p.inv <= 0) damage(e, e.mon, 'golpe_cuerpo', p, 0.7);
    e.patT -= dt;
    if (e.patT > 0) return;
    const pats = ['a', 'a', 'b', 'ring', 'a', 'charge', 'b', 'summon'];
    const pat = pats[e.pat++ % pats.length];
    const fast = hpk < 0.5 ? 0.7 : 1;
    switch (pat) {
      case 'a': useMove(e, e.mon, e.mon.moves[0], ang); e.patT = 0.9 * fast; break;
      case 'b': useMove(e, e.mon, e.mon.moves[1], ang); e.patT = 1.6 * fast; break;
      case 'ring': {
        const mv = MOVES[e.mon.moves[0]], n = 14;
        const proto = { size: 4, life: 2.5, type: mv.type };
        for (let i = 0; i < n; i++) shot(e, e.mon.moves[0], e.x, e.y - 18, (i / n) * Math.PI * 2 + G.t, 80, Object.assign({}, MOVES[e.mon.moves[0]], proto, { pierce: 0, homing: 0, explode: 0 }));
        e.atkT = 0.4;
        e.patT = 1.4 * fast;
        break;
      }
      case 'charge':
        e.tele = 0.6;
        G.zones.push({ kind: 'warn', x: e.x, y: e.y, a: ang, len: 150, w: e.r * 2, t: 0, delay: 0.6, line: 1 });
        setTimeoutGame(0.6, () => { if (!e.dead) { e.charge = { vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280, t: 0, dur: 0.5, move: 'golpe_cuerpo', hit: false }; } });
        e.patT = 1.8 * fast;
        break;
      case 'summon':
        if (G.enemies.filter(x => !x.dead).length < 5) for (let i = 0; i < 2; i++) { const [x, y] = freeSpot(60); addEnemy(makeMon(pick(G.pools.weak), G.zone.lvl - 1, { wild: true }), x, y); }
        e.patT = 1.2;
        break;
      default: e.patT = 1;
    }
  }

  const timers = [];
  function setTimeoutGame(sec, fn) { timers.push({ t: sec, fn, g: G }); }

  // ---------------- proyectiles y zonas ----------------
  function updateShots(dt) {
    for (let i = timers.length - 1; i >= 0; i--) { const tm = timers[i]; if (tm.g !== G) { timers.splice(i, 1); continue; } tm.t -= dt; if (tm.t <= 0) { timers.splice(i, 1); tm.fn(); } }
    const p = G.p;
    for (const s of G.shots) {
      s.life -= dt;
      if (s.life <= 0) { if (s.explode) explode(s); s.dead = true; continue; }
      if (s.homing) {
        let tg = null;
        if (s.side === 'p') { let bd = 1e9; for (const e of G.enemies) { if (e.dead || e.appear > 0) continue; const dd = d2(s.x, s.y, e.x, e.y); if (dd < bd) { bd = dd; tg = e; } } }
        else tg = p;
        if (tg) {
          const a = Math.atan2(tg.y - 8 - s.y, tg.x - s.x), cur = Math.atan2(s.vy, s.vx);
          const na = cur + clamp(angDiff(a, cur), -(s.side === 'p' ? 4 : 1.5) * dt, (s.side === 'p' ? 4 : 1.5) * dt);
          s.vx = Math.cos(na) * s.spd; s.vy = Math.sin(na) * s.spd;
        }
      }
      if (s.boom) {
        s.spin += dt * 18;
        const b = s.boom;
        if (!b.back) { b.trav += Math.hypot(s.vx, s.vy) * dt; if (b.trav >= b.out) { b.back = true; s.hit.clear(); } }
        else {
          const o = s.owner, a = Math.atan2(o.y - 8 - s.y, o.x - s.x), sp = Math.hypot(s.vx, s.vy);
          s.vx = Math.cos(a) * sp; s.vy = Math.sin(a) * sp;
          if (d2(s.x, s.y, o.x, o.y - 8) < 100 || o.dead) { s.dead = true; continue; }
        }
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      // rocas y paredes
      if (!s.boom && solidAt(s.x, s.y + 6)) {
        if (s.side === 'p') breakBushes(s.x, s.y + 6, 4);
        if (s.explode) explode(s);
        s.dead = true; burst(s.x, s.y, s.color, 4);
        continue;
      }
      if (s.x < X0 - 10 || s.x > X1 + 10 || s.y < Y0 - 10 || s.y > Y1 + 10) { s.dead = true; continue; }
      if (s.side === 'p') {
        for (const e of G.enemies) {
          if (e.dead || e.appear > 0 || s.hit.has(e.id)) continue;
          const rr = s.r + e.r;
          if (d2(s.x, s.y, e.x, e.y - 8 * e.scale) < rr * rr) {
            s.hit.add(e.id);
            if (s.explode) { explode(s); s.dead = true; break; }
            damage(s.owner, s.mon, s.move, e, 1, Math.atan2(s.vy, s.vx));
            if (s.pierce-- <= 0) { s.dead = true; break; }
          }
        }
      } else if (p.inv <= 0 && d2(s.x, s.y, p.x, p.y - 8) < (s.r + p.r - 2) ** 2) {
        if (s.explode) explode(s); else damage(s.owner, s.mon, s.move, p, 1);
        s.dead = true;
      }
    }
    G.shots = G.shots.filter(s => !s.dead);
  }

  function explode(s) {
    const r = s.explode;
    G.fx.push({ ring: 1, x: s.x, y: s.y, r: 3, r1: r, life: 0.3, max: 0.3, color: s.color });
    burst(s.x, s.y, s.color, 12);
    Audio8.play('boom');
    const targets = s.side === 'p' ? G.enemies : [G.p];
    for (const t of targets) if (!t.dead && t.appear <= 0 && d2(s.x, s.y, t.x, t.y - 8) < (r + t.r) ** 2) damage(s.owner, s.mon, s.move, t, 1);
  }
  function burst(x, y, c, n) { for (let i = 0; i < n; i++) G.fx.push({ x, y, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.25, max: 0.25, size: rand(1, 2.5), color: pick([c, '#ffffff']) }); }

  function zoneTargets(z) { return z.side === 'p' ? G.enemies.filter(e => !e.dead && e.appear <= 0) : [G.p]; }

  function updateZones(dt) {
    for (const z of G.zones) {
      switch (z.kind) {
        case 'beam': {
          const o = z.owner;
          if (o.dead) { z.dead = true; break; }
          z.x = o.x; z.y = o.y - 8 * (o.scale || 1);
          z.t += dt;
          if (z.t < z.charge) break;
          z.tick -= dt;
          if (z.tick <= 0) {
            z.tick = 0.12;
            const ca = Math.cos(z.a), sa = Math.sin(z.a);
            for (const t of zoneTargets(z)) {
              const dx = t.x - z.x, dy = t.y - 8 - z.y, along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
              if (along > 0 && along < z.len && perp < z.w / 2 + t.r) damage(o, z.mon, z.move, t, 0.35);
            }
          }
          if (z.t >= z.charge + z.dur) z.dead = true;
          break;
        }
        case 'aura': {
          const o = z.owner;
          z.t -= dt; z.tick -= dt;
          if (z.tick <= 0) {
            z.tick = 0.4;
            for (const t of zoneTargets(z)) if (d2(o.x, o.y - 6, t.x, t.y - 6) < (z.r + t.r) ** 2) damage(o, z.mon, z.move, t, 0.45);
          }
          if (z.t <= 0 || o.dead) z.dead = true;
          break;
        }
        case 'meteor':
          z.t += dt;
          if (z.t >= z.delay) {
            G.fx.push({ ring: 1, x: z.x, y: z.y, r: 2, r1: z.r, life: 0.3, max: 0.3, color: z.color });
            burst(z.x, z.y, z.color, 10);
            Audio8.play('boom');
            for (const t of zoneTargets(z)) if (d2(z.x, z.y, t.x, t.y) < (z.r + t.r) ** 2) damage(z.owner, z.mon, z.move, t, 1);
            z.dead = true;
          }
          break;
        case 'mine': {
          z.t -= dt; z.arm -= dt;
          if (z.arm > 0) break;
          let boom = z.t <= 0;
          for (const t of zoneTargets(z)) if (d2(z.x, z.y, t.x, t.y) < (8 + t.r) ** 2) boom = true;
          if (boom) {
            G.fx.push({ ring: 1, x: z.x, y: z.y, r: 2, r1: z.r, life: 0.3, max: 0.3, color: z.color });
            for (const t of zoneTargets(z)) if (d2(z.x, z.y, t.x, t.y) < (z.r + t.r) ** 2) damage(z.owner, z.mon, z.move, t, 1);
            z.dead = true;
          }
          break;
        }
        case 'warn':
          z.t += dt;
          if (z.t >= z.delay + 0.1) z.dead = true;
          break;
        default: break;
      }
    }
    G.zones = G.zones.filter(z => !z.dead);
  }

  function updateOrbs(dt) {
    for (const o of G.orbs) {
      o.t -= dt; o.ang += dt * 4;
      if (o.t <= 0 || o.owner.dead) { o.dead = true; continue; }
      o.pts = [];
      for (let i = 0; i < o.count; i++) {
        const a = o.ang + i / o.count * Math.PI * 2;
        const x = o.owner.x + Math.cos(a) * o.radius, y = o.owner.y - 8 + Math.sin(a) * o.radius * 0.8;
        o.pts.push([x, y]);
        const targets = o.side === 'p' ? G.enemies : [G.p];
        for (const t of targets) {
          if (t.dead || t.appear > 0) continue;
          if (d2(x, y, t.x, t.y - 8) < (5 + t.r) ** 2 && (o.hits.get(t) || 0) <= G.t) { o.hits.set(t, G.t + 0.5); damage(o.owner, o.mon, o.move, t, 1); }
        }
      }
    }
    G.orbs = G.orbs.filter(o => !o.dead);
  }

  // ---------------- objetos en el suelo ----------------
  function dropPickup(type, x, y, val) {
    G.room.pickups.push({ type, x: clamp(x + rand(-6, 6), X0 + 8, X1 - 8), y: clamp(y + rand(-6, 6), Y0 + 8, Y1 - 8), val, t: 0, z: 8, vz: -60 });
  }
  function updatePickups(dt) {
    const p = G.p, m = active();
    for (const q of G.room.pickups) {
      q.t = (q.t || 0) + dt;
      if (q.z > 0 || q.vz) { q.vz = (q.vz || 0) + 300 * dt; q.z = Math.max(0, (q.z || 0) - q.vz * dt); if (q.z === 0) q.vz = 0; }
      if (q.t < 0.3) continue;
      const near = d2(p.x, p.y, q.x, q.y) < 14 * 14;
      if (!near) { q.shown = false; continue; }
      if (q.price) {
        if (G.coins < q.price) { if (!q.shown) { q.shown = true; addText(q.x, q.y - 24, 'Necesitas ' + q.price + ' ₽', '#ff8080'); Audio8.play('error'); } continue; }
        G.coins -= q.price;
      }
      switch (q.type) {
        case 'coin': G.coins += q.val; Audio8.play('coin'); break;
        case 'berry': case 'potion': {
          const mh = maxHp(m, G.items);
          if (m.hp >= mh && !q.price) continue;
          m.hp = Math.min(mh, m.hp + mh * q.val);
          addText(p.x, p.y - 30, q.type === 'berry' ? 'Baya Aranja' : 'Poción', '#7ff0a0');
          Audio8.play('heal');
          break;
        }
        case 'item': takeItem(q.id); break;
        case 'friend': {
          const fm = q.mon;
          const res = Save.addFriend(fm);
          G.friends.push(fm);
          Save.d.stats.befriended++;
          if (fm.shiny) Save.d.stats.shinies++;
          Save.save();
          if (G.party.length < 6) {
            fm.hp = maxHp(fm, G.items);
            G.party.push(fm);
            Sprites.preload(fm.dex, fm.shiny);
            UI.banner((fm.shiny ? '✨ ' : '') + '¡' + DEX[fm.dex].name + ' se une a tu equipo!', (res.isNew ? '¡Nuevo en tu colección! ' : '') + 'Pulsa ' + G.party.length + ' o Q/E para cambiar', '#7ff0a0');
          } else UI.banner('¡' + DEX[fm.dex].name + ' se ha hecho tu amigo!', 'Tu equipo está lleno: lo encontrarás en tu colección', '#7ff0a0');
          Audio8.play('friend');
          UI.hudFull();
          break;
        }
        default: break;
      }
      q.gone = true;
    }
    G.room.pickups = G.room.pickups.filter(q => !q.gone);
  }

  function takeItem(id) {
    const it = ITEMS[id];
    const m = active();
    if (id === 'caramelo_raro') { giveExp(m, expFor(m.lvl + 2) - m.exp); }
    else if (id === 'revivir') {
      const f = G.party.find(q => q.fainted);
      if (f) { f.fainted = false; f.hp = Math.round(maxHp(f, G.items) / 2); }
      else m.hp = maxHp(m, G.items);
    } else {
      const before = maxHp(m, G.items);
      G.items[id] = (G.items[id] || 0) + 1;
      const after = maxHp(m, G.items);
      for (const q of G.party) if (!q.fainted) q.hp += maxHp(q, G.items) - maxHp(q, Object.assign({}, G.items, { [id]: G.items[id] - 1 }));
      void before; void after;
    }
    UI.banner(it.icon + ' ' + it.name, it.desc, '#ffd23f');
    Audio8.play('item');
    UI.hudFull();
  }

  function addText(x, y, v, color, big) {
    if (G.texts.length > 40) G.texts.shift();
    G.texts.push({ x, y, v, color, t: 0.8, big });
  }
  function updateFx(dt) {
    for (const f of G.fx) { f.life -= dt; if (!f.ring && !f.slash) { f.x += f.vx * dt; f.y += f.vy * dt; } }
    G.fx = G.fx.filter(f => f.life > 0);
    for (const t of G.texts) { t.t -= dt; t.y -= 16 * dt; }
    G.texts = G.texts.filter(t => t.t > 0);
    for (const b of G.bolts) b.life -= dt;
    G.bolts = G.bolts.filter(b => b.life > 0);
  }

  // ---------------- dibujo ----------------
  function hash(x, y) { let h = x * 374761393 + y * 668265263 + G.floor * 9973; h = (h ^ (h >> 13)) * 1274126177; return (h ^ (h >> 16)) >>> 0; }

  function drawRoom(room, ox, oy) {
    const z = ZONES[G.floor];
    // suelo
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
      const h = hash(tx + room.x * 17, ty + room.y * 9);
      ctx.fillStyle = z.floor[h % 5 === 0 ? 1 : h % 7 === 0 ? 2 : 0];
      const x = ox + X0 + tx * T, y = oy + Y0 + ty * T;
      ctx.fillRect(x, y, T, T);
      const r = (h >> 5) % 100;
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      if (r < 20) ctx.fillRect(x + (h % 13) + 2, y + (h % 11) + 3, 2, 2);
      if (r > 94) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + (h % 9) + 4, y + (h % 7) + 6, 3, 1); }
    }
    // sombra interior
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(ox + X0, oy + Y0, COLS * T, 5);
    ctx.fillRect(ox + X0, oy + Y0, 4, ROWS * T);
    // paredes
    const wc = z.wall;
    ctx.fillStyle = wc;
    ctx.fillRect(ox, oy, VIEW_W, WALL); ctx.fillRect(ox, oy + Y1, VIEW_W, WALL);
    ctx.fillRect(ox, oy, WALL, VIEW_H); ctx.fillRect(ox + X1, oy, WALL, VIEW_H);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = 0; x < VIEW_W; x += 16) { ctx.fillRect(ox + x, oy + 6 + ((x / 16) % 2) * 7, 14, 1); ctx.fillRect(ox + x, oy + Y1 + 6 + ((x / 16) % 2) * 7, 14, 1); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(ox + X0 - 2, oy + Y0 - 2, COLS * T + 4, 2); ctx.fillRect(ox + X0 - 2, oy + Y1, COLS * T + 4, 2);
    ctx.fillRect(ox + X0 - 2, oy + Y0, 2, ROWS * T); ctx.fillRect(ox + X1, oy + Y0, 2, ROWS * T);
    // puertas
    for (const [d, [dx, dy]] of Object.entries(Dungeon.DIRS)) {
      if (!room.doors[d]) continue;
      const to = G.dun.rooms[(room.x + dx) + ',' + (room.y + dy)];
      const frame = to.type === 'boss' ? '#c03030' : to.type === 'treasure' ? '#e0b030' : to.type === 'shop' ? '#40a0e0' : to.type === 'heal' ? '#ff80c0' : '#8a7a6a';
      let x, y, w, h;
      if (d === 'n') { x = CX - DOOR; y = 0; w = DOOR * 2; h = WALL; }
      else if (d === 's') { x = CX - DOOR; y = Y1; w = DOOR * 2; h = WALL; }
      else if (d === 'w') { x = 0; y = CY - DOOR; w = WALL; h = DOOR * 2; }
      else { x = X1; y = CY - DOOR; w = WALL; h = DOOR * 2; }
      ctx.fillStyle = frame; ctx.fillRect(ox + x - 3, oy + y - 3, w + 6, h + 6);
      ctx.fillStyle = '#0a0a14'; ctx.fillRect(ox + x, oy + y, w, h);
      if (room.locked && room === G.room) {
        ctx.fillStyle = '#6a5a4a';
        if (d === 'n' || d === 's') for (let i = 3; i < w; i += 6) ctx.fillRect(ox + x + i, oy + y, 2, h);
        else for (let i = 3; i < h; i += 6) ctx.fillRect(ox + x, oy + y + i, w, 2);
      }
    }
    // obstáculos
    for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
      const v = room.layout[ty][tx];
      if (!v) continue;
      drawObstacle(ox + X0 + tx * T, oy + Y0 + ty * T, v, z.rock, hash(tx, ty));
    }
  }

  function drawObstacle(x, y, v, kind, h) {
    if (v === 2) { // rompible
      const c = kind === 'bush' ? ['#2f6a28', '#3f8a34', '#5aaa48'] : kind === 'ice' ? ['#6aa0c0', '#9ad0f0', '#d0f0ff'] : kind === 'tomb' ? ['#5a4a6a', '#7a6a8a', '#9a8aaa'] : ['#6a5a4a', '#8a7a5a', '#aa9a7a'];
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, y + 14, 16, 5);
      ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(x + 10, y + 10, 8, 0, 6.3); ctx.fill();
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(x + 9, y + 9, 6, 0, 6.3); ctx.fill();
      ctx.fillStyle = c[2]; ctx.fillRect(x + 6, y + 5, 3, 2); ctx.fillRect(x + 11, y + 8, 2, 2);
      return;
    }
    const pal = {
      bush: ['#4a4a40', '#6a6a5a', '#8a8a78'], rock: ['#4a3f36', '#6a5a4a', '#8a7a68'], ice: ['#4a7a9a', '#7ab0d0', '#c0e8ff'],
      metal: ['#3a3a4a', '#6a6a7a', '#a0a0b0'], tomb: ['#3a3a44', '#6a6a78', '#9a9aa8'], crystal: ['#3a3a8a', '#6a6ad0', '#c0c0ff'],
    }[kind] || ['#444', '#666', '#888'];
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 1, y + 15, 19, 5);
    if (kind === 'tomb') {
      ctx.fillStyle = pal[0]; ctx.fillRect(x + 3, y + 2, 14, 17);
      ctx.fillStyle = pal[1]; ctx.fillRect(x + 4, y + 3, 12, 15);
      ctx.fillStyle = pal[2]; ctx.fillRect(x + 9, y + 6, 2, 8); ctx.fillRect(x + 7, y + 8, 6, 2);
      return;
    }
    if (kind === 'metal') {
      ctx.fillStyle = pal[0]; ctx.fillRect(x + 1, y + 1, 18, 18);
      ctx.fillStyle = pal[1]; ctx.fillRect(x + 2, y + 2, 16, 16);
      ctx.fillStyle = pal[2]; ctx.fillRect(x + 3, y + 3, 2, 2); ctx.fillRect(x + 15, y + 3, 2, 2); ctx.fillRect(x + 3, y + 15, 2, 2); ctx.fillRect(x + 15, y + 15, 2, 2);
      ctx.fillStyle = pal[0]; ctx.fillRect(x + 2, y + 9, 16, 2);
      return;
    }
    ctx.fillStyle = pal[0];
    ctx.beginPath(); ctx.moveTo(x + 2, y + 18); ctx.lineTo(x + 1, y + 9); ctx.lineTo(x + 6, y + 2); ctx.lineTo(x + 14, y + 1); ctx.lineTo(x + 19, y + 8); ctx.lineTo(x + 18, y + 18); ctx.fill();
    ctx.fillStyle = pal[1];
    ctx.beginPath(); ctx.moveTo(x + 3, y + 16); ctx.lineTo(x + 3, y + 9); ctx.lineTo(x + 7, y + 4); ctx.lineTo(x + 13, y + 3); ctx.lineTo(x + 17, y + 9); ctx.lineTo(x + 16, y + 16); ctx.fill();
    ctx.fillStyle = pal[2]; ctx.fillRect(x + 7, y + 5, 4, 2); ctx.fillRect(x + 5, y + 8, 2, 3);
    if (h % 3 === 0) { ctx.fillStyle = pal[0]; ctx.fillRect(x + 10, y + 10, 4, 1); }
  }

  function shadowAt(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.4, 0, 0, 6.3); ctx.fill(); }
  function circ(x, y, r) { ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), Math.max(0.5, r), 0, 6.3); ctx.fill(); }

  function render() {
    if (!G) return;
    ctx.fillStyle = '#05050c';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    let sx = 0, sy = 0;
    if (G.shake > 0 && Save.d.settings.shake) { sx = rand(-G.shake, G.shake); sy = rand(-G.shake, G.shake); }
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    if (G.trans) {
      const k = G.trans.t, [dx, dy] = Dungeon.DIRS[G.trans.dir];
      const ox = -dx * VIEW_W * k, oy = -dy * VIEW_H * k;
      drawRoom(G.trans.from, Math.round(ox), Math.round(oy));
      drawRoom(G.trans.to, Math.round(ox + dx * VIEW_W), Math.round(oy + dy * VIEW_H));
      ctx.restore();
      return;
    }
    drawRoom(G.room, 0, 0);
    drawWorld();
    ctx.restore();
    if (G.flash > 0) { ctx.globalAlpha = Math.min(0.8, G.flash); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1; }
    const m = active();
    if (m && m.hp < maxHp(m, G.items) * 0.25 && !G.over) { ctx.fillStyle = 'rgba(255,0,0,' + (0.06 + 0.05 * Math.sin(G.t * 8)) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }

  function drawWorld() {
    const p = G.p, m = active();
    // zonas en el suelo
    for (const z of G.zones) {
      if (z.kind === 'meteor') {
        const k = Math.min(1, z.t / z.delay);
        ctx.fillStyle = z.side === 'e' ? 'rgba(255,40,40,0.25)' : 'rgba(255,255,255,0.15)'; circ(z.x, z.y, z.r);
        ctx.fillStyle = z.side === 'e' ? 'rgba(255,40,40,0.35)' : z.color; ctx.globalAlpha = 0.5; circ(z.x, z.y, z.r * k); ctx.globalAlpha = 1;
        ctx.fillStyle = z.color; circ(z.x, z.y - (1 - k) * 80, 4);
      } else if (z.kind === 'mine') {
        ctx.fillStyle = '#20202a'; circ(z.x, z.y, 4);
        ctx.fillStyle = Math.sin(G.t * 10 + z.x) > 0 ? z.color : '#ffffff'; circ(z.x, z.y, 2);
      } else if (z.kind === 'aura') {
        const o = z.owner;
        ctx.globalAlpha = 0.22 + 0.08 * Math.sin(G.t * 16); ctx.fillStyle = z.color; circ(o.x, o.y - 6, z.r); ctx.globalAlpha = 1;
      } else if (z.kind === 'warn' && z.line) {
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
        ctx.fillStyle = 'rgba(255,40,40,0.25)'; ctx.fillRect(0, -z.w / 2, z.len, z.w);
        ctx.restore();
      } else if (z.kind === 'beam' && z.t < z.charge && z.side === 'e') {
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
        ctx.fillStyle = 'rgba(255,40,40,' + (0.15 + 0.3 * z.t / z.charge) + ')'; ctx.fillRect(0, -z.w / 2, z.len, z.w);
        ctx.restore();
      }
    }
    // escalera y enfermera
    if (G.stairs) {
      const s = G.stairs;
      ctx.fillStyle = '#1a1a24'; ctx.fillRect(s.x - 11, s.y - 9, 22, 18);
      ctx.fillStyle = '#6a6a7a'; for (let i = 0; i < 4; i++) ctx.fillRect(s.x - 9 + i * 2, s.y - 7 + i * 4, 18 - i * 4, 2);
      ctx.fillStyle = '#ffd23f'; ctx.globalAlpha = 0.4 + 0.3 * Math.sin(G.t * 5); ctx.fillRect(s.x - 12, s.y - 10, 24, 1); ctx.globalAlpha = 1;
    }
    // objetos del suelo
    for (const q of G.room.pickups) drawPickup(q);
    // entidades ordenadas por profundidad
    const list = [];
    for (const e of G.enemies) list.push(e);
    if (G.room.nurse) list.push({ nurse: true, x: G.room.nurse.x, y: G.room.nurse.y });
    if (m && !G.over) list.push(p);
    list.sort((a, b) => a.y - b.y);
    for (const u of list) {
      if (u.nurse) {
        shadowAt(u.x, u.y, 9);
        Sprites.draw(ctx, 113, false, 'idle', Math.PI / 2, G.t, u.x, u.y, 1, { alpha: G.room.nurse.used ? 0.6 : 1 });
        if (!G.room.nurse.used) { ctx.fillStyle = '#ff9ed8'; ctx.font = '8px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('¡Cúrate aquí!', u.x, u.y - 32); }
        continue;
      }
      if (u === p) {
        const blink = p.inv > 0 && Math.floor(G.t * 16) % 2 === 0;
        shadowAt(p.x, p.y, 8);
        const ang = p.atkT > 0 ? p.face : p.moving ? p.face : p.face;
        if (!blink) Sprites.draw(ctx, m.dex, m.shiny, p.anim, ang, p.atkT > 0 ? Math.max(0, 0.35 - p.atkT) : p.animT, p.x, p.y, 1, { tint: p.status.burn > 0 ? 'rgba(255,100,40,0.35)' : p.status.poison > 0 ? 'rgba(160,60,200,0.35)' : p.status.para > 0 ? 'rgba(255,230,60,0.3)' : p.status.freeze > 0 ? 'rgba(160,220,255,0.5)' : null });
        continue;
      }
      const e = u;
      const sc = e.scale;
      if (e.appear > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.6 - e.appear) + ')'; circ(e.x, e.y - 8, 10 * (1 - e.appear));
        continue;
      }
      shadowAt(e.x, e.y, 7 * sc);
      if (e.rare || e.mon.shiny) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(G.t * 8); ctx.fillStyle = '#ffe860'; circ(e.x, e.y - 10 * sc, 13 * sc); ctx.globalAlpha = 1; }
      const alpha = e.dead ? Math.max(0, e.fade / 0.35) : 1;
      const tint = e.status.burn > 0 ? 'rgba(255,100,40,0.35)' : e.status.poison > 0 ? 'rgba(160,60,200,0.35)' : e.status.para > 0 ? 'rgba(255,230,60,0.3)' : e.status.freeze > 0 ? 'rgba(160,220,255,0.5)' : e.tele ? 'rgba(255,60,60,0.45)' : null;
      Sprites.draw(ctx, e.mon.dex, e.mon.shiny, e.dead ? 'hurt' : e.anim, e.face, e.dead ? 0.1 : e.atkT > 0 ? Math.max(0, 0.35 - e.atkT) : e.animT, e.x, e.y, sc, { flash: e.flash > 0, alpha, tint });
      if (e.mon.shiny && Math.random() < 0.1) G.fx.push({ x: e.x + rand(-8, 8), y: e.y - rand(4, 24), vx: 0, vy: -10, life: 0.4, max: 0.4, size: 1, color: '#ffffff', star: 1 });
      // barra de vida
      if (!e.dead && !e.boss && e.mon.hp < e.maxHp) {
        const w = 18, x = Math.round(e.x - w / 2), y = Math.round(e.y - 28 * sc);
        ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 4);
        const k = Math.max(0, e.mon.hp / e.maxHp);
        ctx.fillStyle = k > 0.5 ? '#5fe08a' : k > 0.2 ? '#ffd23f' : '#ff5050'; ctx.fillRect(x, y, Math.round(w * k), 2);
      }
      if (e.tele) { ctx.fillStyle = '#ff4040'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', e.x, e.y - 30 * sc); }
    }
    // órbitas
    for (const o of G.orbs) if (o.pts) for (const [x, y] of o.pts) { ctx.fillStyle = o.color; circ(x, y, 4); ctx.fillStyle = '#fff'; circ(x - 1, y - 1, 1.5); }
    // proyectiles
    for (const s of G.shots) {
      if (s.boom) {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin);
        ctx.fillStyle = s.color; ctx.fillRect(-5, -1, 10, 3); ctx.fillRect(-1, -5, 3, 10);
        ctx.restore();
        continue;
      }
      if (s.side === 'e') { ctx.fillStyle = '#200008'; circ(s.x, s.y, s.r + 1.5); }
      ctx.globalAlpha = 0.4; ctx.fillStyle = s.color; circ(s.x - s.vx * 0.02, s.y - s.vy * 0.02, s.r); ctx.globalAlpha = 1;
      ctx.fillStyle = s.color; circ(s.x, s.y, s.r);
      ctx.fillStyle = s.side === 'e' ? '#ffd0d0' : '#ffffff'; circ(s.x, s.y, Math.max(1, s.r * 0.45));
    }
    // rayos
    for (const z of G.zones) {
      if (z.kind !== 'beam' || z.t < z.charge) continue;
      const rem = (z.charge + z.dur - z.t) / z.dur, w = z.w * Math.min(1, rem * 4);
      ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
      ctx.globalAlpha = 0.35; ctx.fillStyle = z.color; ctx.fillRect(2, -w * 0.75, z.len, w * 1.5); ctx.globalAlpha = 1;
      ctx.fillStyle = z.color; ctx.fillRect(2, -w / 2, z.len, w);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(2, -w / 5, z.len, w / 2.5);
      ctx.restore();
    }
    for (const b of G.bolts) {
      ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.beginPath(); b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    // partículas
    for (const f of G.fx) {
      const k = f.life / f.max;
      if (f.ring) { ctx.strokeStyle = f.color; ctx.globalAlpha = k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r + (f.r1 - f.r) * (1 - k), 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (f.slash) { ctx.strokeStyle = f.color; ctx.globalAlpha = k; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.1 - 0.3 * k), f.a - f.arc / 2, f.a + f.arc / 2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1; }
      else { ctx.globalAlpha = Math.min(1, k * 1.5); ctx.fillStyle = f.color; const s = Math.max(1, Math.round(f.size)); if (f.star) { ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y), 3, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 3); } else ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s); ctx.globalAlpha = 1; }
    }
    // textos
    ctx.textAlign = 'center';
    for (const t of G.texts) {
      ctx.globalAlpha = Math.min(1, t.t * 3);
      ctx.font = (t.big ? 'bold 10px' : '9px') + ' "Pixelify Sans", monospace';
      ctx.fillStyle = '#000'; ctx.fillText(t.v, Math.round(t.x) + 1, Math.round(t.y) + 1);
      ctx.fillStyle = t.color; ctx.fillText(t.v, Math.round(t.x), Math.round(t.y));
    }
    ctx.globalAlpha = 1;
  }

  function drawPickup(q) {
    const x = Math.round(q.x), y = Math.round(q.y - (q.z || 0)), bob = Math.round(Math.sin(G.t * 4 + q.x) * 1.5);
    if (q.ped) { ctx.fillStyle = '#3a3040'; ctx.fillRect(x - 9, y + 2, 18, 7); ctx.fillStyle = '#6a5a70'; ctx.fillRect(x - 8, y + 2, 16, 3); }
    switch (q.type) {
      case 'coin':
        ctx.fillStyle = '#7a5a00'; circ(x, y + bob, 4); ctx.fillStyle = '#ffd23f'; circ(x, y + bob, 3); ctx.fillStyle = '#fff6b0'; ctx.fillRect(x - 1, y - 2 + bob, 1, 2);
        if (q.val > 1) { ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillText('x' + q.val, x + 7, y - 4); }
        break;
      case 'berry':
        ctx.fillStyle = '#2a4aa0'; circ(x, y + bob, 4); ctx.fillStyle = '#5a8af0'; circ(x - 1, y - 1 + bob, 2.5); ctx.fillStyle = '#3a8a2a'; ctx.fillRect(x - 1, y - 6 + bob, 3, 2);
        break;
      case 'potion':
        ctx.fillStyle = '#5a2a8a'; ctx.fillRect(x - 4, y - 6 + bob, 8, 10); ctx.fillStyle = '#c070ff'; ctx.fillRect(x - 3, y - 3 + bob, 6, 6); ctx.fillStyle = '#e0e0e0'; ctx.fillRect(x - 2, y - 8 + bob, 4, 2);
        break;
      case 'item': {
        ctx.globalAlpha = 0.3 + 0.15 * Math.sin(G.t * 4); ctx.fillStyle = '#ffd23f'; circ(x, y - 6 + bob, 10); ctx.globalAlpha = 1;
        ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.fillText(ITEMS[q.id].icon, x, y - 2 + bob);
        break;
      }
      case 'friend': {
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(G.t * 6); ctx.fillStyle = q.mon.shiny ? '#ffe860' : '#7ff0a0'; circ(x, y - 8, 12); ctx.globalAlpha = 1;
        Sprites.draw(ctx, q.mon.dex, q.mon.shiny, 'idle', Math.PI / 2, G.t, x, y + bob, 1, { tint: 'rgba(255,255,255,0.15)' });
        ctx.fillStyle = '#7ff0a0'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('♥', x, y - 26 + bob);
        break;
      }
      default: break;
    }
    if (q.price) {
      ctx.font = '8px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText(q.price + ' ₽', x + 1, y + 17);
      ctx.fillStyle = G.coins >= q.price ? '#ffd23f' : '#ff8080'; ctx.fillText(q.price + ' ₽', x, y + 16);
    }
  }

  // ---------------- entrada ----------------
  function toWorld(cx, cy) {
    const r = cv.getBoundingClientRect();
    return [(cx - r.left) / r.width * VIEW_W, (cy - r.top) / r.height * VIEW_H];
  }
  function bind(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    cv.width = VIEW_W; cv.height = VIEW_H;
    ctx.imageSmoothingEnabled = false;
    window.addEventListener('keydown', e => {
      if (!G) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { if (!G.over) UI.togglePause(); e.preventDefault(); return; }
      if (G.paused || G.modal) return;
      keys[e.code] = true;
      if (e.code.startsWith('Digit')) swapTo(+e.code.slice(5) - 1);
      if (e.code === 'KeyQ') cycle(-1);
      if (e.code === 'KeyE') cycle(1);
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; mouse.down = mouse.right = false; if (G && !G.over && !G.paused) UI.togglePause(); });
    cv.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    cv.addEventListener('mousedown', e => { mouse.x = e.clientX; mouse.y = e.clientY; if (e.button === 2) mouse.right = true; else mouse.down = true; });
    window.addEventListener('mouseup', e => { if (e.button === 2) mouse.right = false; else mouse.down = false; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  function cycle(d) {
    if (!G || G.party.length < 2) return;
    let i = G.active;
    for (let k = 0; k < G.party.length; k++) { i = (i + d + G.party.length) % G.party.length; if (!G.party[i].fainted) break; }
    swapTo(i);
  }
  function stop() { running = false; cancelAnimationFrame(raf); G = null; }

  return {
    bind, start, stop, swapTo, cycle, sticks, debug, keys,
    makeMon, maxHp, stats, power, rollMoves, typeEff, evoLevel,
    get state() { return G; },
    pause(v) { if (G) { G.paused = v; if (v) for (const k of Object.keys(keys)) keys[k] = false; } },
    _enter(room) { enterRoom(room); G.p.x = CX; G.p.y = CY + 40; },
    _floor(f) { newFloor(f); },
    step(n, dt) { for (let i = 0; i < n && G && !G.over; i++) if (!G.paused && !G.modal) update(dt || 1 / 60); },
  };
})();
