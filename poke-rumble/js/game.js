// Motor: salas, combate twin-stick, amigos, objetos, pisos y jefes.
'use strict';

const Game = (() => {
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const d2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

  const X0 = WALL, Y0 = WALL_TOP, X1 = WALL + COLS * T, Y1 = WALL_TOP + ROWS * T;
  const CX = (X0 + X1) / 2, CY = (Y0 + Y1) / 2;
  const DOOR = 8;          // media anchura del hueco de la puerta (1 baldosa)
  const SPD = 0.85;        // escala de velocidades al tamaño de la sala

  let cv, ctx, G = null, running = false, raf = 0, last = 0, uid = 1;
  let lightCv = null, lightCtx = null;
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
    if (parent) return 34;
    if (grand) return 16;
    return 25;
  }
  function rollMoves(dex) {
    const ts = DEX[dex].types;
    const ta = Math.random() < 0.7 ? ts[0] : pick(ts);
    const a = pick(TYPE_MOVES[ta].a);
    let b = pick(TYPE_MOVES[pick(ts)].b);
    if (Math.random() < 0.25) b = pick(TYPE_MOVES[pick(ts)].b);
    return [a, b];
  }
  function power(m) { return Math.round(BST(m.dex) * m.lvl / 12); }
  const expFor = l => Math.round(l * l * l * 0.8);
  function makeMon(dex, lvl, opts) {
    const m = Object.assign({ id: uid++, dex, lvl, exp: 0, moves: rollMoves(dex), shiny: false, fainted: false }, opts || {});
    m.exp = expFor(m.lvl);
    m.power = power(m);
    m.hp = maxHp(m);
    return m;
  }
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
  const hasType = (m, t) => DEX[m.dex].types.includes(t);
  const floats = m => hasType(m, 'flying') || hasType(m, 'ghost') || [92, 93, 94, 109, 110, 81, 82, 100, 101, 120, 121, 137].includes(m.dex);

  // ---------------- inicio ----------------
  function start(leader) {
    Audio8.resume();
    const m = makeMon(leader.dex, 5, { moves: leader.moves.slice(), shiny: leader.shiny });
    G = {
      floor: 0, party: [m], active: 0, coins: 0, items: {}, t: 0, kills: 0, friends: [], over: false, paused: false,
      enemies: [], shots: [], fx: [], texts: [], zones: [], orbs: [], bolts: [], amb: [], shake: 0, flash: 0,
      trans: null, modal: null, focusUsed: false, stairs: null, intro: 0,
    };
    G.p = { x: CX, y: CY + 40, r: 6, face: Math.PI / 2, aim: Math.PI / 2, anim: 'idle', animT: 0, atkT: 0, inv: 1, swapCd: 0, cdA: 0, cdB: 0, side: 'p', status: {} };
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
    G.liquid = Tiles.THEMES[f].liquid;
    G.dun = Dungeon.generate(f);
    G.pools = buildPools(f);
    G.stairs = null;
    G.amb = [];
    enterRoom(G.dun.start);
    G.p.x = CX; G.p.y = CY + 24;
    G.intro = 2.6;
    Audio8.music('battle');
    for (const m of G.party) Sprites.preload(m.dex, m.shiny);
    preloadPool();
    UI.hudFull();
  }

  function preloadPool() { for (const d of G.pools.all.slice(0, 40)) Sprites.preload(d, false); Sprites.preload(G.zone.boss, false); Sprites.preload(113, false); Sprites.preload(52, false); }

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

  // ---------------- sala: datos ----------------
  function prepRoom(room) {
    if (room.ready) return;
    room.ready = true;
    for (const p of room.props) {
      p.x = X0 + p.tx * T + T / 2;
      p.y = Y0 + p.ty * T + T - 2;
      p.solid = !!{ tree: 1, rock: 1, tomb: 1 }[p.type];
    }
    room.liquidCells = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (room.grid[y][x] === 3) room.liquidCells.push([x + 1, y + 2]);
    room.solidMap = room.grid.map(r => r.map(v => v === 1));
    for (const p of room.props) if (p.solid) room.solidMap[p.ty][p.tx] = true;
  }
  function roomImage(room) {
    prepRoom(room);
    if (room.img) return room.img;
    const MX = Math.floor(FULL_W / 2), MY = 2 + Math.floor(ROWS / 2);
    const at = (fx, fy) => {
      if (fx < 0 || fy < 0 || fx >= FULL_W || fy >= FULL_H) return 'void';
      const ix = fx - 1, iy = fy - 2;
      if (ix >= 0 && iy >= 0 && ix < COLS && iy < ROWS) { const v = room.grid[iy][ix]; return v === 1 ? 'wall' : v === 3 ? 'liquid' : 'floor'; }
      if (fx === MX && fy <= 1 && room.doors.n) return 'floor';
      if (fx === MX && fy === FULL_H - 1 && room.doors.s) return 'floor';
      if (fy === MY && fx === 0 && room.doors.w) return 'floor';
      if (fy === MY && fx === FULL_W - 1 && room.doors.e) return 'floor';
      return 'border';
    };
    room.img = Tiles.paintRoom(FULL_W, FULL_H, at, G.floor, room.seed);
    return room.img;
  }

  // ---------------- entrada en una sala ----------------
  function enterRoom(room) {
    G.room = room;
    prepRoom(room);
    roomImage(room);
    G.enemies = []; G.shots = []; G.zones = []; G.orbs = []; G.focusUsed = false;
    revealAround(room);
    if (!room.cleared && room.type === 'fight') spawnWave(room);
    if (!room.cleared && room.type === 'boss') spawnBoss(room);
    if (room.type === 'treasure' && !room.stocked) {
      room.stocked = true;
      room.pickups.push({ type: 'item', id: pick(POOL_TREASURE), x: CX, y: CY + 2, altar: true });
    }
    if (room.type === 'shop' && !room.stocked) {
      room.stocked = true;
      const pool = Object.keys(ITEMS).filter(k => k !== 'revivir').sort(() => Math.random() - 0.5).slice(0, 2);
      room.npc = { dex: 52, x: CX, y: Y0 + 22, text: '¡Bienvenido a la tienda de Meowth!' };
      const xs = [CX - 48, CX, CX + 48];
      room.props.push(...xs.map(x => ({ type: 'pedestal', x, y: CY + 12, tx: Math.floor((x - X0) / T), ty: 4 })));
      room.pickups.push({ type: 'item', id: pool[0], x: xs[0], y: CY + 4, price: ITEMS[pool[0]].price });
      room.pickups.push({ type: 'item', id: pool[1], x: xs[1], y: CY + 4, price: ITEMS[pool[1]].price });
      room.pickups.push({ type: 'item', id: 'revivir', x: xs[2], y: CY + 4, price: ITEMS.revivir.price });
    }
    if (room.type === 'heal' && !room.stocked) { room.stocked = true; room.npc = { dex: 113, x: CX, y: Y0 + 30, text: '¡Toca el manantial para curar a tu equipo!' }; }
    UI.hudFull();
  }

  function tileAt(x, y) {
    const tx = Math.floor((x - X0) / T), ty = Math.floor((y - Y0) / T);
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return -1;
    return G.room.grid[ty][tx];
  }
  function freeSpot(minDist) {
    const room = G.room;
    for (let i = 0; i < 80; i++) {
      const tx = randi(1, COLS - 2), ty = randi(1, ROWS - 2);
      if (room.solidMap[ty][tx] || room.grid[ty][tx] === 3) continue;
      if (room.traps.some(t => t.tx === tx && t.ty === ty)) continue;
      const x = X0 + tx * T + T / 2, y = Y0 + ty * T + T / 2 + 4;
      if (d2(x, y, G.p.x, G.p.y) < minDist * minDist) continue;
      return [x, y];
    }
    return [CX + rand(-50, 50), CY + rand(-20, 20)];
  }

  function spawnWave(room) {
    const f = G.floor;
    const n = 3 + Math.floor(f * 0.7) + randi(0, 2);
    for (let i = 0; i < n; i++) {
      const dex = Math.random() < 0.6 - f * 0.08 ? pick(G.pools.weak) : pick(G.pools.all);
      const lvl = Math.max(2, G.zone.lvl + randi(-2, 1) + (CHILDREN[dex] ? 0 : 1));
      const [x, y] = freeSpot(70);
      addEnemy(makeMon(dex, lvl, { shiny: Math.random() < 1 / 400, wild: true }), x, y);
    }
    if (room.rare) {
      const dex = pick([151, 143, 131, 132, 137, 133]);
      const [x, y] = freeSpot(80);
      addEnemy(makeMon(dex, G.zone.lvl + 3, { shiny: Math.random() < 1 / 100, wild: true }), x, y, { rare: true });
      UI.banner('¡Un ' + DEX[dex].name + ' salvaje!', 'Pokémon poco común: derrótalo y quizá se haga tu amigo', '#ffd23f');
    }
    room.locked = true;
    Audio8.play('door');
  }

  function spawnBoss(room) {
    const dex = G.zone.boss;
    const m = makeMon(dex, G.zone.lvl + 2 + G.floor, { boss: true, shiny: Math.random() < 1 / 50 });
    m.hp = maxHp(m) * (11 + G.floor * 4);
    const e = addEnemy(m, CX, CY - 12, { boss: true, scale: 2 });
    e.maxHp = m.hp;
    e.appear = 1.4;
    room.locked = true;
    UI.banner('¡' + DEX[dex].name + ' gigante!', 'Jefe del piso · ' + G.zone.name, '#ff5050');
    Audio8.play('boss');
    Audio8.music('boss');
    G.shake = 4;
  }

  function addEnemy(m, x, y, o) {
    o = o || {};
    Sprites.preload(m.dex, m.shiny);
    const p = DEX[m.dex];
    const e = {
      id: uid++, side: 'e', mon: m, x, y, r: o.boss ? 11 : 6, scale: o.scale || 1, boss: !!o.boss, rare: !!o.rare,
      maxHp: m.hp, face: Math.PI / 2, anim: 'idle', animT: rand(0, 1), atkT: 0, appear: 0.7,
      cdA: rand(1, 2.5), cdB: rand(3, 6), status: {}, kx: 0, ky: 0, flash: 0, wander: rand(0, 6.28), patT: 2, pat: 0,
      spd: (24 + Math.min(62, p.stats.spe * 0.32)) * SPD, floats: floats(m),
      ranged: ['proj', 'fan', 'beam', 'burst', 'meteor', 'chain', 'mines', 'boomerang'].includes(MOVES[m.moves[0]].cls),
    };
    e.st = stats(m);
    G.enemies.push(e);
    return e;
  }

  // ---------------- bucle ----------------
  function loop(ts) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.max(0, Math.min(0.05, (ts - last) / 1000));
    last = ts;
    if (!G.paused && !G.over && !G.modal) update(dt);
    else if (G) G.tv = (G.tv || 0) + dt * 0.2;
    render();
    UI.hud(G);
  }

  function update(dt) {
    G.t += dt;
    if (G.intro > 0) G.intro -= dt;
    if (G.trans) {
      G.trans.t += dt / 0.4;
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
    updateTraps(dt);
    updatePickups(dt);
    updateFx(dt);
    updateAmbient(dt);
    const room = G.room;
    if (room.locked && !G.enemies.some(e => !e.dead)) {
      room.locked = false; room.cleared = true;
      Audio8.play('door');
      G.fx.push({ doors: 1, life: 0.5, max: 0.5 });
      if (room.type === 'fight') roomReward();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3);
  }

  function roomReward() {
    const r = Math.random();
    if (r < 0.3) { G.room.props.push({ type: 'chest', x: CX, y: CY + 8, tx: 8, ty: 4, variant: 0 }); G.fx.push({ ring: 1, x: CX, y: CY, r: 2, r1: 20, life: 0.4, max: 0.4, color: '#ffd23f' }); Audio8.play('item'); }
    else if (r < 0.55) dropPickup('coin', CX, CY, randi(1, 3));
    else if (r < 0.72) dropPickup('berry', CX, CY, 0.25);
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
  function speedOf(m) { return (55 + Math.min(70, DEX[m.dex].stats.spe * 0.4)) * (G.items.panuelo_eleccion ? 1.3 : 1) * (1 + 0.12 * (G.items.carburante || 0)); }

  // efectos del terreno líquido bajo los pies
  function liquidUnder(u, m) {
    if (floats(m) || tileAt(u.x, u.y) !== 3) return null;
    const L = G.liquid;
    if (L === 'water' && hasType(m, 'water')) return null;
    if (L === 'lava' && (hasType(m, 'fire') || hasType(m, 'dragon'))) return null;
    if (L === 'poison' && (hasType(m, 'poison') || hasType(m, 'steel'))) return null;
    if (L === 'spark' && (hasType(m, 'electric') || hasType(m, 'ground'))) return null;
    return L;
  }
  function liquidEffect(u, m, dt, isP) {
    const L = liquidUnder(u, m);
    u.inLiquid = L;
    if (!L) return 1;
    u.liqT = (u.liqT || 0) - dt;
    if (Math.random() < dt * 6) G.fx.push({ x: u.x + rand(-5, 5), y: u.y - 1, vx: rand(-10, 10), vy: rand(-25, -10), life: 0.3, max: 0.3, size: 1, color: Tiles.BIOMES[G.floor].foam });
    if (u.liqT <= 0) {
      u.liqT = 0.8;
      if (L === 'lava') { hurtFlat(u, m, isP, 0.05, '#ff8040'); applyStatus(u, 'burn'); }
      if (L === 'poison') applyStatus(u, 'poison');
      if (L === 'spark') { hurtFlat(u, m, isP, 0.03, '#ffe060'); if (Math.random() < 0.4) applyStatus(u, 'para'); }
    }
    return L === 'water' ? 0.6 : 0.75;
  }
  function hurtFlat(u, m, isP, frac, color) {
    const mh = isP ? maxHp(m, G.items) : u.maxHp;
    const d = Math.max(1, Math.round(mh * frac * (u.boss ? 0.1 : 1)));
    m.hp -= d;
    addText(u.x, u.y - 22, d, color);
    if (m.hp <= 0) { if (isP) playerDown(); else killEnemy(u); }
  }

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
    const terrain = liquidEffect(p, m, dt, true);
    if (p.dash) {
      const d = p.dash;
      d.t += dt;
      moveUnit(p, d.vx * dt, d.vy * dt, true);
      hitArc(p, d.move, p.x, p.y - 8, 13, 0, Math.PI * 2, d.hit);
      if (Math.random() < 0.6) G.fx.push({ ghost: 1, x: p.x, y: p.y, dex: m.dex, shiny: m.shiny, a: p.face, life: 0.2, max: 0.2 });
      if (d.t >= d.dur) p.dash = null;
    } else {
      const [mx, my] = inputMove();
      let sp = speedOf(m) * SPD * terrain * (p.status.slow > 0 ? 0.55 : 1) * (p.status.para > 0 ? 0.7 : 1);
      if (p.status.freeze > 0) sp = 0;
      let vx = mx * sp, vy = my * sp;
      // ayuda para entrar por las puertas
      if (!G.room.locked) {
        const D = G.room.doors;
        if (my < -0.3 && D.n && p.y < Y0 + 18 && Math.abs(p.x - CX) < 18) vx += (CX - p.x) * 6;
        if (my > 0.3 && D.s && p.y > Y1 - 18 && Math.abs(p.x - CX) < 18) vx += (CX - p.x) * 6;
        if (mx < -0.3 && D.w && p.x < X0 + 18 && Math.abs(p.y - CY) < 18) vy += (CY - p.y) * 6;
        if (mx > 0.3 && D.e && p.x > X1 - 18 && Math.abs(p.y - CY) < 18) vy += (CY - p.y) * 6;
      }
      moveUnit(p, vx * dt, vy * dt, true);
      p.moving = Math.hypot(mx, my) > 0.1;
      if (p.moving && p.atkT <= 0) p.face = Math.atan2(my, mx);
      if (p.moving && Math.random() < dt * 5 && !p.inLiquid) G.fx.push({ x: p.x + rand(-3, 3), y: p.y, vx: 0, vy: -6, life: 0.3, max: 0.3, size: 1, color: 'rgba(255,255,255,0.35)' });
    }
    const aim = inputAim();
    if (aim !== null) { p.aim = aim; if (p.cdA <= 0) { useMove(p, m, m.moves[0], aim); p.cdA = MOVES[m.moves[0]].cd * cdMul; } }
    if ((keys.Space || mouse.right || sticks.b || debug.b) && p.cdB <= 0) {
      const a = aim !== null ? aim : (nearestEnemyAngle(p) ?? p.face);
      useMove(p, m, m.moves[1], a);
      p.cdB = MOVES[m.moves[1]].cd * cdMul * 1.4;
    }
    if (G.items.restos) m.hp = Math.min(maxHp(m, G.items), m.hp + maxHp(m, G.items) * 0.01 * G.items.restos * dt);
    p.anim = p.atkT > 0 ? 'attack' : p.moving ? 'walk' : 'idle';
    checkDoors();
    interact();
  }

  function interact() {
    const p = G.p, room = G.room;
    for (const pr of room.props) {
      if (pr.type === 'spring' && !pr.used && d2(p.x, p.y, pr.x, pr.y - 4) < 20 * 20) {
        pr.used = true; pr.variant = 1;
        for (const q of G.party) { q.fainted = false; q.hp = maxHp(q, G.items); }
        p.status = {};
        UI.banner('¡Tus Pokémon están como nuevos!', 'El manantial del Centro Pokémon cura y revive a tu equipo', '#ff9ed8');
        Audio8.play('heal');
        for (let i = 0; i < 20; i++) G.fx.push({ x: pr.x + rand(-14, 14), y: pr.y - 4, vx: rand(-10, 10), vy: rand(-50, -20), life: 0.8, max: 0.8, size: 2, color: pick(['#ff9ed8', '#ffffff', '#ffe0f4']) });
        UI.hudFull();
      }
      if (pr.type === 'chest' && !pr.variant && d2(p.x, p.y, pr.x, pr.y) < 16 * 16) {
        pr.variant = 1;
        Audio8.play('item');
        const r = Math.random();
        for (let i = 0; i < randi(2, 5); i++) dropPickup('coin', pr.x, pr.y - 4, 1);
        if (r < 0.15) room.pickups.push({ type: 'item', id: pick(POOL_TREASURE), x: pr.x, y: pr.y + 14 });
        else if (r < 0.45) dropPickup('potion', pr.x, pr.y, 0.5);
        else if (r < 0.75) dropPickup('berry', pr.x, pr.y, 0.25);
      }
    }
    if (room.npc && !room.npc.said && d2(p.x, p.y, room.npc.x, room.npc.y) < 40 * 40) { room.npc.said = true; addText(room.npc.x, room.npc.y - 30, room.npc.text, '#ffffff'); }
    if (G.stairs && d2(p.x, p.y, G.stairs.x, G.stairs.y) < 12 * 12) nextFloor();
  }

  function nearestEnemyAngle(u) {
    let best = null, bd = 1e9;
    for (const e of G.enemies) { if (e.dead || e.appear > 0) continue; const dd = d2(u.x, u.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; } }
    return best ? Math.atan2(best.y - u.y, best.x - u.x) : null;
  }

  // ¿es sólido este punto? (paredes, columnas, árboles, rocas; las puertas abiertas dejan pasar al jugador)
  function solidAt(x, y, isPlayer) {
    if (x >= X0 && y >= Y0 && x < X1 && y < Y1) {
      const tx = Math.floor((x - X0) / T), ty = Math.floor((y - Y0) / T);
      return G.room.solidMap[ty][tx];
    }
    if (isPlayer && !G.room.locked) {
      const D = G.room.doors;
      if (D.n && y < Y0 && Math.abs(x - CX) < DOOR) return false;
      if (D.s && y >= Y1 && Math.abs(x - CX) < DOOR) return false;
      if (D.w && x < X0 && Math.abs(y - CY) < DOOR) return false;
      if (D.e && x >= X1 && Math.abs(y - CY) < DOOR) return false;
    }
    return true;
  }
  function moveUnit(u, dx, dy, isPlayer) {
    const r = u.r;
    const ok = (nx, ny) => {
      const pts = [[nx - r, ny - r * 0.6], [nx + r, ny - r * 0.6], [nx - r, ny + 1], [nx + r, ny + 1]];
      return !pts.some(([x, y]) => solidAt(x, y, isPlayer));
    };
    if (ok(u.x + dx, u.y)) u.x += dx;
    if (ok(u.x, u.y + dy)) u.y += dy;
  }

  function checkDoors() {
    const p = G.p, room = G.room;
    if (room.locked) return;
    let dir = null;
    if (p.y < Y0 - 6 && room.doors.n) dir = 'n';
    else if (p.y > Y1 + 8 && room.doors.s) dir = 's';
    else if (p.x < X0 - 6 && room.doors.w) dir = 'w';
    else if (p.x > X1 + 6 && room.doors.e) dir = 'e';
    if (!dir) return;
    const [dx, dy] = Dungeon.DIRS[dir];
    const to = G.dun.rooms[(room.x + dx) + ',' + (room.y + dy)];
    if (!to) return;
    roomImage(to);
    const px = dir === 'w' ? X1 - 10 : dir === 'e' ? X0 + 10 : CX;
    const py = dir === 'n' ? Y1 - 6 : dir === 's' ? Y0 + 14 : CY + 4;
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
    const spdMul = (isP ? 1 : 0.7) * SPD;
    const col = TYPE_COLORS[mv.type];
    if (isP && G.items.vidasfera) m.hp = Math.max(1, m.hp - maxHp(m, G.items) * 0.015);
    const sc = u.scale || 1;
    const ox = u.x + Math.cos(ang) * 6 * sc, oy = u.y - 9 * sc + Math.sin(ang) * 4 * sc;
    switch (mv.cls) {
      case 'melee': {
        const rr = mv.range * 0.85 * sc;
        hitArc(u, moveId, u.x, u.y - 8 * sc, rr, ang, mv.arc, null);
        G.fx.push({ slash: 1, x: u.x, y: u.y - 8 * sc, a: ang, arc: mv.arc, r: rr, life: 0.16, max: 0.16, color: col, pal: VFX.forMove(moveId).pal });
        G.fx.push({ vfx: VFX.forMove(moveId).melee, pal: VFX.forMove(moveId).pal, x: u.x + Math.cos(ang) * rr * 0.8, y: u.y - 8 * sc + Math.sin(ang) * rr * 0.8, life: 0.2, max: 0.2, a: ang });
        Audio8.play('slash');
        break;
      }
      case 'dash': {
        const dur = 0.18, sp = mv.dist * SPD / dur;
        if (isP) { u.dash = { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t: 0, dur, move: moveId, hit: new Set() }; u.inv = Math.max(u.inv, 0.25); }
        else u.charge = { vx: Math.cos(ang) * sp * 0.8, vy: Math.sin(ang) * sp * 0.8, t: 0, dur: dur * 1.3, move: moveId, hit: false };
        Audio8.play('dash');
        break;
      }
      case 'proj': shot(u, moveId, ox, oy, ang, mv.speed * spdMul, mv); Audio8.play('shoot'); break;
      case 'fan':
        for (let i = 0; i < mv.count; i++) {
          const a = ang + (mv.count > 1 ? (i / (mv.count - 1) - 0.5) * mv.arc : 0);
          shot(u, moveId, ox, oy, a, mv.speed * spdMul * rand(0.9, 1.1), mv);
        }
        Audio8.play('shoot');
        break;
      case 'burst': {
        const n = isP ? mv.count : Math.ceil(mv.count * 0.7);
        for (let i = 0; i < n; i++) shot(u, moveId, u.x, u.y - 9 * sc, ang + (i / n) * Math.PI * 2, mv.speed * spdMul, mv);
        G.fx.push({ ring: 1, x: u.x, y: u.y - 9 * sc, r: 4, r1: 22, life: 0.25, max: 0.25, color: col });
        Audio8.play('shoot');
        break;
      }
      case 'beam':
        G.zones.push({ kind: 'beam', side: u.side, owner: u, move: moveId, a: ang, len: mv.len * 0.85, w: mv.width * 0.8, t: 0, charge: isP ? 0.15 : 0.6, dur: mv.dur, tick: 0, color: col, mon: m, look: VFX.forMove(moveId) });
        Audio8.play('charge');
        break;
      case 'orbit':
        G.orbs.push({ owner: u, move: moveId, mon: m, side: u.side, count: mv.count, radius: mv.radius * 0.85, t: mv.dur, ang: 0, color: col, hits: new Map(), look: VFX.forMove(moveId) });
        break;
      case 'aura':
        G.zones.push({ kind: 'aura', side: u.side, owner: u, move: moveId, mon: m, r: mv.radius * 0.85 * sc, t: mv.dur, tick: 0, color: col, look: VFX.forMove(moveId) });
        Audio8.play('shoot');
        break;
      case 'boomerang':
        G.shots.push({ id: uid++, side: u.side, owner: u, mon: m, move: moveId, x: ox, y: oy, vx: Math.cos(ang) * mv.speed * spdMul, vy: Math.sin(ang) * mv.speed * spdMul, r: mv.size, color: col, boom: { out: mv.dist * SPD, trav: 0, back: false }, life: 4, pierce: 99, hit: new Set(), spin: 0, look: VFX.forMove(moveId), born: G.t });
        Audio8.play('shoot');
        break;
      case 'chain': {
        const targets = isP ? G.enemies.filter(e => !e.dead && e.appear <= 0) : [G.p];
        let src = { x: ox, y: oy };
        const hit = new Set();
        for (let j = 0; j <= mv.jumps; j++) {
          let best = null, bd = (j === 0 ? 160 : mv.range) ** 2;
          for (const t of targets) { if (hit.has(t)) continue; const dd = d2(src.x, src.y, t.x, t.y); if (dd < bd) { bd = dd; best = t; } }
          if (!best) break;
          hit.add(best);
          G.bolts.push({ pts: zig(src.x, src.y, best.x, best.y - 8), life: 0.18, color: col });
          damage(u, m, moveId, best, 1);
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
          const x = t ? t.x + rand(-10, 10) : u.x + rand(-70, 70), y = t ? t.y + rand(-8, 8) : u.y + rand(-40, 40);
          G.zones.push({ kind: 'meteor', side: u.side, owner: u, move: moveId, mon: m, x, y, r: mv.radius * 0.85, t: 0, delay: mv.delay + i * 0.12 + (isP ? 0 : 0.3), color: col, look: VFX.forMove(moveId) });
        }
        break;
      }
      case 'mines':
        for (let i = 0; i < mv.count; i++) {
          const a = rand(0, 6.28), r = rand(12, 34);
          G.zones.push({ kind: 'mine', side: u.side, owner: u, move: moveId, mon: m, x: clamp(u.x + Math.cos(a) * r, X0 + 6, X1 - 6), y: clamp(u.y + Math.sin(a) * r, Y0 + 6, Y1 - 6), r: mv.radius * 0.85, t: mv.life, arm: 0.5, color: col, look: VFX.forMove(moveId) });
        }
        break;
      default: break;
    }
  }

  function shot(u, moveId, x, y, a, speed, mv) {
    G.shots.push({
      id: uid++, side: u.side, owner: u, mon: u.side === 'p' ? active() : u.mon, move: moveId, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, spd: speed,
      r: (mv.size || 3) * 0.9, color: TYPE_COLORS[mv.type], life: mv.life || 1, pierce: mv.pierce || 0, homing: mv.homing, explode: mv.explode, hit: new Set(),
      look: VFX.forMove(moveId), big: (mv.size || 3) >= 5, born: G.t,
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
    if (u.side === 'p') hitProps(x + Math.cos(ang) * range * 0.6, y + 8 + Math.sin(ang) * range * 0.6, range * 0.7, arc >= 6.2 ? 1 : 1);
  }

  // los ataques del jugador cortan hierba y rompen rocas
  function hitProps(x, y, r) {
    const room = G.room;
    let changed = false;
    for (const pr of room.props) {
      if (pr.gone || (pr.type !== 'grass' && pr.type !== 'rock')) continue;
      if (d2(x, y, pr.x, pr.y - 6) > (r + 8) * (r + 8)) continue;
      if (pr.hitT && pr.hitT > G.t) continue;
      pr.hitT = G.t + 0.25;
      if (pr.type === 'grass') {
        pr.gone = true;
        for (let i = 0; i < 8; i++) G.fx.push({ x: pr.x + rand(-6, 6), y: pr.y - rand(2, 10), vx: rand(-40, 40), vy: rand(-60, -10), life: 0.5, max: 0.5, size: 2, color: pick(Tiles.BIOMES[G.floor].grass), grav: 1 });
        if (Math.random() < 0.12) dropPickup(Math.random() < 0.7 ? 'coin' : 'berry', pr.x, pr.y - 4, Math.random() < 0.7 ? 1 : 0.25);
        Audio8.play('break');
      } else {
        pr.hp--;
        pr.variant = pr.hp <= 1 ? 1 : 0;
        pr.shake = 0.15;
        Audio8.play('break');
        if (pr.hp <= 0) {
          pr.gone = true; changed = true;
          for (let i = 0; i < 12; i++) G.fx.push({ x: pr.x + rand(-6, 6), y: pr.y - rand(2, 10), vx: rand(-60, 60), vy: rand(-70, -10), life: 0.5, max: 0.5, size: rand(1, 3), color: pick(Tiles.BIOMES[G.floor].rock), grav: 1 });
          if (Math.random() < 0.3) dropPickup(Math.random() < 0.75 ? 'coin' : 'berry', pr.x, pr.y - 4, Math.random() < 0.75 ? randi(1, 2) : 0.25);
        }
      }
    }
    if (changed) { room.props = room.props.filter(p => !p.gone); room.solidMap = room.grid.map(r => r.map(v => v === 1)); for (const p of room.props) if (p.solid) room.solidMap[p.ty][p.tx] = true; }
    else room.props = room.props.filter(p => !p.gone);
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
    } else dmg *= 0.6 + 0.05 * G.floor; // los salvajes pegan menos al principio (estilo Rumble)
    if (eff === 0) { addText(t.x, t.y - 24, 'No afecta', '#9090a0'); return; }
    dmg = Math.max(1, Math.round(dmg));
    tm.hp -= dmg;
    const look = VFX.forMove(moveId);
    G.fx.push({ vfx: 'impact', pal: look.pal, x: t.x + rand(-3, 3), y: t.y - 10 * (t.scale || 1) + rand(-3, 3), life: 0.14, max: 0.14, sc: eff > 1 ? 1 : 0.7 });
    if (t.side === 'e') {
      t.flash = 0.1;
      if (!t.boss) { const a = ang ?? Math.atan2(t.y - src.y, t.x - src.x); t.kx += Math.cos(a) * 80; t.ky += Math.sin(a) * 80; }
      if (isP && G.items.cascabel_concha) m.hp = Math.min(maxHp(m, G.items), m.hp + dmg * 0.12);
      if (mv.drain && isP) m.hp = Math.min(maxHp(m, G.items), m.hp + dmg * mv.drain);
    } else {
      t.inv = 1.0;
      G.shake = Math.min(5, G.shake + 2.5);
      Audio8.play('hurt');
      if (G.items.casco_dentado && src.side === 'e' && (mv.cls === 'melee' || mv.cls === 'dash')) { src.mon.hp -= Math.round(src.maxHp * 0.15); src.flash = 0.1; if (src.mon.hp <= 0) killEnemy(src); }
    }
    if (mv.status && Math.random() < mv.status[1]) applyStatus(t, mv.status[0]);
    if (Save.d.settings.dmgNums || t.side === 'p') addText(t.x + rand(-4, 4), t.y - 20 * (t.scale || 1), dmg, t.side === 'p' ? '#ff6060' : eff > 1 ? '#ffd23f' : eff < 1 ? '#a0a0b0' : '#ffffff', crit || eff > 1);
    if (eff > 1 && isP && Math.random() < 0.3) addText(t.x, t.y - 32, '¡Es muy eficaz!', '#ffd23f');
    if (t.side === 'e') Audio8.play('hit');
    if (tm.hp <= 0) { if (t.side === 'e') killEnemy(t); else playerDown(); }
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
      if (Math.random() < dt * 8) G.fx.push({ x: u.x + rand(-5, 5), y: u.y - rand(4, 16), vx: 0, vy: -20, life: 0.4, max: 0.4, size: 1, color: st.burn > 0 ? '#ff8040' : '#c060ff' });
      if (u.dot >= 0.5) {
        u.dot = 0;
        const mh = isP ? maxHp(m, G.items) : u.maxHp;
        const d = Math.max(1, Math.round(mh * (u.boss ? 0.004 : 0.03)));
        m.hp -= d;
        addText(u.x, u.y - 20, d, st.burn > 0 ? '#ff8040' : '#c060ff');
        if (m.hp <= 0) { if (isP) m.hp = 1; else killEnemy(u); }
      }
    }
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true; e.fade = 0.4;
    G.kills++;
    Save.d.seen[e.mon.dex] = 1;
    Audio8.play('faint');
    for (let i = 0; i < 10; i++) G.fx.push({ x: e.x, y: e.y - 8, vx: rand(-50, 50), vy: rand(-70, 10), life: 0.4, max: 0.4, size: rand(1, 3), color: pick(['#ffffff', '#ffd23f', TYPE_COLORS[DEX[e.mon.dex].types[0]]]) });
    G.fx.push({ vfx: 'star', pal: DEX[e.mon.dex].types[0], x: e.x, y: e.y - 12, life: 0.3, max: 0.3 });
    const gain = Math.round(BST(e.mon.dex) / 4 * e.mon.lvl / 7 * 1.6 * (e.boss ? 4 : 1) * (G.items.huevo_suerte ? 1.5 : 1));
    G.party.forEach((q, i) => { if (!q.fainted) giveExp(q, Math.round((i === G.active ? gain : gain / 2) * clamp(Math.pow(e.mon.lvl / q.lvl, 1.6), 0.15, 1.8))); });
    const coins = (Math.random() < 0.3 ? 1 : 0) * (G.items.moneda_amuleto ? 2 : 1) + (e.boss ? 8 : e.rare ? 4 : 0);
    if (coins) dropPickup('coin', e.x, e.y, coins);
    if (Math.random() < 0.04) dropPickup('berry', e.x, e.y, 0.25);
    const chance = (e.boss ? 0.5 : e.rare ? 0.5 : 0.1) * (G.items.cascabel_amistad ? 2 : 1) + (e.mon.shiny ? 1 : 0);
    if (Math.random() < chance) {
      const fm = makeMon(e.mon.dex, e.mon.lvl, { shiny: e.mon.shiny, moves: e.mon.moves.slice() });
      delete fm.wild;
      G.room.pickups.push({ type: 'friend', mon: fm, x: e.x, y: e.y, t: 0 });
      addText(e.x, e.y - 32, '¡Quiere ser tu amigo!', '#7ff0a0');
    }
    if (e.boss) {
      Save.d.stats.bosses++;
      Audio8.music('battle');
      G.room.pickups.push({ type: 'item', id: pick(POOL_TREASURE), x: CX - 36, y: CY + 26 });
      G.stairs = { x: CX + 36, y: CY + 26 };
      G.flash = 0.8; G.shake = 6;
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
      if (m === active()) { addText(G.p.x, G.p.y - 36, '¡Nivel ' + m.lvl + '!', '#7fd0ff'); Audio8.play('levelup'); G.fx.push({ ring: 1, x: G.p.x, y: G.p.y - 8, r: 4, r1: 20, life: 0.4, max: 0.4, color: '#7fd0ff' }); }
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
      for (let i = 0; i < 30; i++) G.fx.push({ x: G.p.x, y: G.p.y - 10, vx: rand(-80, 80), vy: rand(-80, 40), life: 0.7, max: 0.7, size: 2, color: pick(['#ffffff', '#7ff0a0', '#ffd23f']) });
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
    for (let k = 0; k < 10; k++) G.fx.push({ x: G.p.x + rand(-8, 8), y: G.p.y - rand(0, 20), vx: 0, vy: -30, life: 0.4, max: 0.4, size: 1, color: '#ffffff' });
    Audio8.play('swap');
    UI.hudFull();
  }

  function gameOver() { G.over = true; Audio8.play('lose'); Audio8.music(null); finishRun(false); }
  function win() { G.over = true; Save.d.stats.wins++; Audio8.play('win'); Audio8.music(null); finishRun(true); }
  function finishRun(won) {
    const st = Save.d.stats;
    st.bestFloor = Math.max(st.bestFloor, G.floor + 1);
    Save.save();
    const res = { won, floor: G.floor + 1, zone: G.zone.name, kills: G.kills, time: G.t, friends: G.friends.slice(), party: G.party.slice(), items: Object.assign({}, G.items) };
    const g = G;
    setTimeout(() => { if (G === g) UI.runOver(res); }, 900);
  }

  // ---------------- enemigos ----------------
  function updateEnemies(dt) {
    const p = G.p;
    for (const e of G.enemies) {
      if (e.dead) { e.fade -= dt; continue; }
      e.animT += dt;
      if (e.appear > 0) { e.appear -= dt; if (Math.random() < dt * 30) G.fx.push({ x: e.x + rand(-8, 8), y: e.y - rand(0, 16), vx: 0, vy: -20, life: 0.3, max: 0.3, size: 1, color: '#ffffff' }); continue; }
      if (e.flash > 0) e.flash -= dt;
      if (e.atkT > 0) e.atkT -= dt;
      tickStatus(e, e.mon, dt, false);
      if (e.dead) continue;
      const terrain = e.boss ? 1 : liquidEffect(e, e.mon, dt, false);
      if (e.dead) continue;
      moveUnit(e, e.kx * dt, e.ky * dt, false);
      e.kx *= Math.pow(0.002, dt); e.ky *= Math.pow(0.002, dt);
      if (e.status.freeze > 0) continue;
      const slow = (e.status.slow > 0 ? 0.5 : 1) * (e.status.para > 0 ? 0.6 : 1) * terrain;
      const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx);
      if (e.charge) {
        e.charge.t += dt;
        moveUnit(e, e.charge.vx * dt, e.charge.vy * dt, false);
        if (Math.random() < 0.5) G.fx.push({ ghost: 1, x: e.x, y: e.y, dex: e.mon.dex, shiny: e.mon.shiny, a: e.face, sc: e.scale, life: 0.2, max: 0.2 });
        if (!e.charge.hit && d2(e.x, e.y, p.x, p.y) < (e.r + p.r + 4) ** 2) { e.charge.hit = true; damage(e, e.mon, e.charge.move, p, 1); }
        if (e.charge.t >= e.charge.dur) e.charge = null;
        e.anim = 'walk';
        continue;
      }
      if (e.boss) bossAI(e, dt, ang, dist);
      else {
        let mx, my;
        if (e.ranged) {
          const want = 80;
          const s = dist > want + 20 ? 1 : dist < want - 20 ? -1 : 0;
          e.wander += dt * 0.8;
          mx = dx / dist * s + Math.cos(e.wander) * 0.5; my = dy / dist * s + Math.sin(e.wander) * 0.5;
        } else { mx = dx / dist; my = dy / dist; }
        const l = Math.hypot(mx, my) || 1;
        const sp = e.spd * slow;
        const bx = e.x, by = e.y;
        moveUnit(e, mx / l * sp * dt, my / l * sp * dt, false);
        // si choca con un obstáculo, rodea
        if (Math.abs(e.x - bx) + Math.abs(e.y - by) < sp * dt * 0.3) { e.wander += 1.5; moveUnit(e, Math.cos(e.wander) * sp * dt, Math.sin(e.wander) * sp * dt, false); }
        if (e.atkT <= 0) e.face = Math.atan2(my, mx);
        e.cdA -= dt * slow; e.cdB -= dt * slow;
        const mvA = MOVES[e.mon.moves[0]];
        const reach = mvA.cls === 'melee' ? mvA.range + 8 : mvA.cls === 'dash' ? 80 : 150;
        if (e.cdA <= 0 && dist < reach && !e.tele) e.tele = 0.35;
        if (e.tele) {
          e.tele -= dt;
          if (e.tele <= 0) { e.tele = null; useMove(e, e.mon, e.mon.moves[0], ang); e.cdA = mvA.cd * 2.6 + rand(0.3, 1.2); }
        } else if (e.cdB <= 0 && dist < 140 && G.floor >= 1) {
          useMove(e, e.mon, e.mon.moves[1], ang);
          e.cdB = MOVES[e.mon.moves[1]].cd * 3 + rand(1, 3);
        }
        if (d2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2 * 0.8 && p.inv <= 0) damage(e, e.mon, 'placaje', p, 0.6);
      }
      e.anim = e.atkT > 0 ? 'attack' : 'walk';
      for (const o of G.enemies) {
        if (o === e || o.dead) continue;
        const ddx = e.x - o.x, ddy = e.y - o.y, dd = ddx * ddx + ddy * ddy, rr = e.r + o.r;
        if (dd < rr * rr && dd > 0.01 && !e.boss) { const l2 = Math.sqrt(dd), push = (rr - l2) * 0.5; moveUnit(e, ddx / l2 * push, ddy / l2 * push, false); }
      }
    }
    G.enemies = G.enemies.filter(e => !e.dead || e.fade > 0);
  }

  function bossAI(e, dt, ang, dist) {
    const p = G.p;
    const hpk = e.mon.hp / e.maxHp;
    const sp = e.spd * 0.6 * (hpk < 0.5 ? 1.3 : 1);
    if (dist > 40) moveUnit(e, Math.cos(ang) * sp * dt, Math.sin(ang) * sp * dt, false);
    if (e.atkT <= 0) e.face = ang;
    if (d2(e.x, e.y, p.x, p.y) < (e.r + p.r) ** 2 && p.inv <= 0) damage(e, e.mon, 'golpe_cuerpo', p, 0.7);
    if (hpk < 0.5 && !e.enraged) { e.enraged = true; UI.banner('¡' + DEX[e.mon.dex].name + ' se enfurece!', 'Sus ataques son más rápidos', '#ff8040'); G.shake = 5; Audio8.play('boss'); }
    e.patT -= dt;
    if (e.patT > 0) return;
    const pats = ['a', 'a', 'b', 'ring', 'a', 'charge', 'b', 'summon'];
    const pat = pats[e.pat++ % pats.length];
    const fast = hpk < 0.5 ? 0.7 : 1;
    switch (pat) {
      case 'a': useMove(e, e.mon, e.mon.moves[0], ang); e.patT = 0.9 * fast; break;
      case 'b': useMove(e, e.mon, e.mon.moves[1], ang); e.patT = 1.6 * fast; break;
      case 'ring': {
        const base = MOVES[e.mon.moves[0]], n = 14;
        const proto = Object.assign({}, base, { size: 4, life: 2.5, pierce: 0, homing: 0, explode: 0 });
        for (let i = 0; i < n; i++) shot(e, e.mon.moves[0], e.x, e.y - 16, (i / n) * Math.PI * 2 + G.t, 70, proto);
        e.atkT = 0.4;
        e.patT = 1.4 * fast;
        break;
      }
      case 'charge':
        G.zones.push({ kind: 'warn', x: e.x, y: e.y, a: ang, len: 130, w: e.r * 2, t: 0, delay: 0.6, line: 1 });
        later(0.6, () => { if (!e.dead) e.charge = { vx: Math.cos(ang) * 240, vy: Math.sin(ang) * 240, t: 0, dur: 0.5, move: 'golpe_cuerpo', hit: false }; });
        e.patT = 1.8 * fast;
        break;
      case 'summon':
        if (G.enemies.filter(x => !x.dead).length < 5) for (let i = 0; i < 2; i++) { const [x, y] = freeSpot(50); addEnemy(makeMon(pick(G.pools.weak), G.zone.lvl - 1, { wild: true }), x, y); }
        e.patT = 1.2;
        break;
      default: e.patT = 1;
    }
  }

  const timers = [];
  function later(sec, fn) { timers.push({ t: sec, fn, g: G }); }

  // ---------------- trampas ----------------
  function updateTraps(dt) {
    const room = G.room;
    for (const tr of room.traps) {
      if (tr.used) continue;
      const x = X0 + tr.tx * T + T / 2, y = Y0 + tr.ty * T + T / 2;
      const units = [G.p, ...G.enemies.filter(e => !e.dead && e.appear <= 0 && !e.boss)];
      for (const u of units) {
        const m = u === G.p ? active() : u.mon;
        if (floats(m) || d2(u.x, u.y, x, y + 4) > 7 * 7) continue;
        tr.used = true;
        Audio8.play('zap');
        if (tr.variant === 0) { applyStatus(u, 'poison'); addText(x, y - 14, '¡Trampa venenosa!', '#c060ff'); }
        else if (tr.variant === 1) { applyStatus(u, 'slow'); u.status.slow = 3; addText(x, y - 14, '¡Trampa pegajosa!', '#9ae060'); }
        else {
          G.zones.push({ kind: 'warn', x, y: y + 4, r: 22, t: 0, delay: 0.5 });
          later(0.5, () => {
            G.fx.push({ ring: 1, x, y, r: 3, r1: 26, life: 0.35, max: 0.35, color: '#ff8040' });
            burst(x, y, '#ff8040', 16); Audio8.play('boom'); G.shake = 4;
            for (const v of [G.p, ...G.enemies]) {
              if (v.dead || d2(v.x, v.y, x, y) > 26 * 26) continue;
              hurtFlat(v, v === G.p ? active() : v.mon, v === G.p, 0.12, '#ff8040');
            }
          });
        }
        break;
      }
    }
  }

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
      if (s.side === 'p') hitPropsShot(s);
      if (!s.boom && solidAt(s.x, s.y + 8, false)) {
        if (s.explode) explode(s);
        s.dead = true; burst(s.x, s.y, s.color, 4);
        continue;
      }
      if (s.x < X0 - 8 || s.x > X1 + 8 || s.y < Y0 - 16 || s.y > Y1 + 8) { s.dead = true; continue; }
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
      } else if (p.inv <= 0 && d2(s.x, s.y, p.x, p.y - 8) < (s.r + p.r - 1) ** 2) {
        if (s.explode) explode(s); else damage(s.owner, s.mon, s.move, p, 1);
        s.dead = true;
      }
    }
    G.shots = G.shots.filter(s => !s.dead);
  }
  function hitPropsShot(s) {
    for (const pr of G.room.props) {
      if (pr.gone || (pr.type !== 'grass' && pr.type !== 'rock')) continue;
      if (d2(s.x, s.y + 8, pr.x, pr.y - 4) < 9 * 9) { hitProps(pr.x, pr.y - 4, 2); if (pr.type === 'rock' && !s.boom) s.life = 0; return; }
    }
  }

  function explode(s) {
    const r = s.explode * 0.85;
    G.fx.push({ ring: 1, x: s.x, y: s.y, r: 3, r1: r, life: 0.3, max: 0.3, color: s.color });
    G.fx.push({ vfx: 'impact', pal: s.look.pal, x: s.x, y: s.y, life: 0.25, max: 0.25, sc: 1.6 });
    burst(s.x, s.y, s.color, 12);
    Audio8.play('boom');
    const targets = s.side === 'p' ? G.enemies : [G.p];
    for (const t of targets) if (!t.dead && t.appear <= 0 && d2(s.x, s.y, t.x, t.y - 8) < (r + t.r) ** 2) damage(s.owner, s.mon, s.move, t, 1);
    if (s.side === 'p') hitProps(s.x, s.y + 8, r);
  }
  function burst(x, y, c, n) { for (let i = 0; i < n; i++) G.fx.push({ x, y, vx: rand(-60, 60), vy: rand(-60, 60), life: 0.25, max: 0.25, size: rand(1, 2.5), color: pick([c, '#ffffff']) }); }

  function zoneTargets(z) { return z.side === 'p' ? G.enemies.filter(e => !e.dead && e.appear <= 0) : [G.p]; }

  function updateZones(dt) {
    for (const z of G.zones) {
      switch (z.kind) {
        case 'beam': {
          const o = z.owner;
          if (o.dead) { z.dead = true; break; }
          z.x = o.x + Math.cos(z.a) * 6 * (o.scale || 1); z.y = o.y - 9 * (o.scale || 1) + Math.sin(z.a) * 4;
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
            if (z.side === 'p') for (let k = 20; k < z.len; k += 16) hitProps(z.x + ca * k, z.y + sa * k + 8, z.w / 2);
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
            if (z.side === 'p') hitProps(o.x, o.y, z.r);
          }
          if (Math.random() < dt * 20) { const a = rand(0, 6.28); G.fx.push({ vfx: z.look.proj, pal: z.look.pal, x: o.x + Math.cos(a) * z.r * 0.8, y: o.y - 6 + Math.sin(a) * z.r * 0.6, life: 0.3, max: 0.3, sc: 0.6 }); }
          if (z.t <= 0 || o.dead) z.dead = true;
          break;
        }
        case 'meteor':
          z.t += dt;
          if (z.t >= z.delay) {
            G.fx.push({ ring: 1, x: z.x, y: z.y, r: 2, r1: z.r, life: 0.3, max: 0.3, color: z.color });
            G.fx.push({ vfx: 'impact', pal: z.look.pal, x: z.x, y: z.y - 4, life: 0.25, max: 0.25, sc: 1.4 });
            burst(z.x, z.y, z.color, 10);
            Audio8.play('boom');
            for (const t of zoneTargets(z)) if (d2(z.x, z.y, t.x, t.y) < (z.r + t.r) ** 2) damage(z.owner, z.mon, z.move, t, 1);
            if (z.side === 'p') hitProps(z.x, z.y, z.r);
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
        case 'warn': z.t += dt; if (z.t >= z.delay + 0.1) z.dead = true; break;
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
      // las monedas se acercan solas si estás cerca
      if (q.type === 'coin' && d2(p.x, p.y, q.x, q.y) < 30 * 30 && q.t > 0.4) { q.x += (p.x - q.x) * dt * 6; q.y += (p.y - q.y) * dt * 6; }
      if (q.t < 0.3) continue;
      const near = d2(p.x, p.y, q.x, q.y) < 12 * 12;
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
        case 'item': takeItem(q.id); if (q.altar) for (const pr of G.room.props) if (pr.type === 'altar') pr.variant = 1; break;
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
          for (let i = 0; i < 12; i++) G.fx.push({ vfx: 'heart', pal: 'fairy', x: q.x + rand(-10, 10), y: q.y - rand(4, 20), vy: -20, life: 0.6, max: 0.6, sc: 0.8 });
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
    if (id === 'caramelo_raro') giveExp(m, expFor(m.lvl + 2) - m.exp);
    else if (id === 'revivir') {
      const f = G.party.find(q => q.fainted);
      if (f) { f.fainted = false; f.hp = Math.round(maxHp(f, G.items) / 2); }
      else m.hp = maxHp(m, G.items);
    } else {
      const prev = Object.assign({}, G.items);
      G.items[id] = (G.items[id] || 0) + 1;
      for (const q of G.party) if (!q.fainted) q.hp += maxHp(q, G.items) - maxHp(q, prev);
    }
    UI.banner(it.name, it.desc, '#ffd23f');
    Audio8.play('item');
    UI.hudFull();
  }

  function addText(x, y, v, color, big) {
    if (G.texts.length > 40) G.texts.shift();
    G.texts.push({ x, y, v, color, t: 0.8, big });
  }
  function updateFx(dt) {
    for (const f of G.fx) {
      f.life -= dt;
      if (f.ring || f.slash || f.doors) continue;
      if (f.vx) f.x += f.vx * dt;
      if (f.vy) f.y += f.vy * dt;
      if (f.grav) f.vy += 220 * dt;
    }
    G.fx = G.fx.filter(f => f.life > 0);
    if (G.fx.length > 500) G.fx.splice(0, G.fx.length - 500);
    for (const t of G.texts) { t.t -= dt; t.y -= 16 * dt; }
    G.texts = G.texts.filter(t => t.t > 0);
    for (const b of G.bolts) b.life -= dt;
    G.bolts = G.bolts.filter(b => b.life > 0);
  }

  // ---------------- ambiente ----------------
  function updateAmbient(dt) {
    const f = G.floor, A = G.amb;
    const spawn = (o) => { if (A.length < 40) A.push(Object.assign({ t: 0 }, o)); };
    const r = Math.random();
    if (f === 0 && r < dt * 1.2) spawn({ k: 'leaf', x: rand(X0, X1), y: Y0 - 10, vx: rand(5, 15), vy: rand(10, 18), life: 12, ph: rand(0, 6) });
    if (f === 0 && r > 1 - dt * 0.8) spawn({ k: 'fly', x: rand(X0, X1), y: rand(Y0, Y1), vx: 0, vy: 0, life: 6, ph: rand(0, 6) });
    if (f === 1 && r < dt * 2) spawn({ k: 'spark', x: rand(X0, X1), y: rand(Y0, Y1), vx: 0, vy: -3, life: 2, ph: rand(0, 6) });
    if (f === 2 && r < dt * 3 && G.room.liquidCells.length) { const [tx, ty] = pick(G.room.liquidCells); spawn({ k: 'bubble', x: tx * T + rand(2, 14), y: ty * T + rand(4, 14), vx: 0, vy: -8, life: 1.4, ph: 0 }); }
    if (f === 3 && r < dt * 2) spawn({ k: 'zap', x: rand(X0, X1), y: rand(Y0, Y1), vx: 0, vy: 0, life: 0.25, ph: 0 });
    if (f === 4 && r < dt * 1.5) spawn({ k: 'wisp', x: rand(X0, X1), y: rand(Y0, Y1), vx: rand(-6, 6), vy: rand(-8, -2), life: 4, ph: rand(0, 6) });
    if (f === 5 && r < dt * 3) spawn({ k: 'ember', x: rand(X0, X1), y: Y1 + 4, vx: rand(-4, 4), vy: rand(-26, -14), life: 6, ph: rand(0, 6) });
    for (const a of A) {
      a.t += dt;
      a.x += (a.vx + (a.k === 'leaf' ? Math.sin(a.t * 2 + a.ph) * 12 : a.k === 'fly' ? Math.sin(a.t * 1.3 + a.ph) * 10 : 0)) * dt;
      a.y += (a.vy + (a.k === 'fly' ? Math.cos(a.t * 1.7 + a.ph) * 8 : 0)) * dt;
    }
    G.amb = A.filter(a => a.t < a.life && a.y < Y1 + 20 && a.y > Y0 - 20);
  }

  // ---------------- dibujo ----------------
  function render() {
    if (!G) return;
    ctx.fillStyle = '#05050c';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    let sx = 0, sy = 0;
    if (G.shake > 0 && Save.d.settings.shake) { sx = rand(-G.shake, G.shake); sy = rand(-G.shake, G.shake); }
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    if (G.trans) {
      const k = G.trans.t, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const [dx, dy] = Dungeon.DIRS[G.trans.dir];
      const ox = -dx * VIEW_W * e, oy = -dy * VIEW_H * e;
      drawRoomStatic(G.trans.from, Math.round(ox), Math.round(oy));
      drawRoomStatic(G.trans.to, Math.round(ox + dx * VIEW_W), Math.round(oy + dy * VIEW_H));
      ctx.restore();
      return;
    }
    drawRoomStatic(G.room, 0, 0);
    drawWorld();
    ctx.restore();
    drawLighting();
    if (G.flash > 0) { ctx.globalAlpha = Math.min(0.8, G.flash); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); ctx.globalAlpha = 1; }
    const m = active();
    if (m && m.hp < maxHp(m, G.items) * 0.25 && !G.over) { ctx.fillStyle = 'rgba(255,0,0,' + (0.06 + 0.05 * Math.sin(G.t * 8)) + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    if (G.intro > 0) drawIntro();
  }

  // suelo, paredes y puertas (lo que no se mueve)
  function drawRoomStatic(room, ox, oy) {
    ctx.drawImage(roomImage(room), ox, oy);
    ctx.save(); ctx.translate(ox, oy);
    if (room === G.room) Tiles.liquidSparkles(ctx, room.liquidCells, G.floor, G.t);
    drawTorches(0, 0);
    for (const [d, [dx, dy]] of Object.entries(Dungeon.DIRS)) {
      if (!room.doors[d]) continue;
      const to = G.dun.rooms[(room.x + dx) + ',' + (room.y + dy)];
      const closed = room === G.room && room.locked;
      const img = Tiles.doorSprite(G.floor, d, to.seen || to.type === 'boss' ? to.type : 'fight', !closed);
      let x, y;
      if (d === 'n') { x = CX - img.width / 2; y = Y0 - img.height + 2; }
      else if (d === 's') { x = CX - img.width / 2; y = Y1 - 2; }
      else if (d === 'w') { x = X0 - img.width + 2; y = CY - img.height / 2; }
      else { x = X1 - 2; y = CY - img.height / 2; }
      if (d === 's') { ctx.save(); ctx.translate(CX, Y1 + img.height / 2 - 2); ctx.scale(1, -1); ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore(); }
      else if (d === 'e') { ctx.save(); ctx.translate(x + img.width / 2, y + img.height / 2); ctx.scale(-1, 1); ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore(); }
      else ctx.drawImage(img, Math.round(x), Math.round(y));
    }
    ctx.restore();
  }

  const TORCHES = [[CX - 88, Y0 - 12], [CX + 88, Y0 - 12]];
  function drawTorches(ox, oy) {
    for (const [tx, ty] of TORCHES) {
      const x = ox + tx, y = oy + ty;
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 2, y, 5, 6);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 1, y + 1, 3, 4);
      ctx.fillStyle = '#8a8a9a'; ctx.fillRect(x - 3, y - 1, 7, 2);
      const fl = Math.sin(G.t * 13 + tx) * 0.5 + Math.sin(G.t * 7.3 + tx) * 0.5;
      ctx.globalAlpha = 0.18 + 0.05 * fl; ctx.fillStyle = '#ffb040'; circ(x, y - 4, 14 + fl * 2); ctx.globalAlpha = 1;
      VFX.draw(ctx, 'fire', 'fire', x, y - 5, { angle: -Math.PI / 2, frame: Math.floor(G.t * 10 + tx), scale: 0.7 });
    }
  }
  function shadowAt(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.4, 0, 0, 6.3); ctx.fill(); }
  function circ(x, y, r) { ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), Math.max(0.5, r), 0, 6.3); ctx.fill(); }

  function drawProp(pr) {
    if (pr.gone) return;
    let variant = pr.variant || 0;
    if (pr.type === 'grass') {
      const near = d2(G.p.x, G.p.y, pr.x, pr.y) < 14 * 14 || G.enemies.some(e => !e.dead && d2(e.x, e.y, pr.x, pr.y) < 12 * 12);
      variant = near || Math.sin(G.t * 2.4 + pr.wig) > 0.6 ? 1 : 0;
    }
    const img = Tiles.propSprite(G.floor, pr.type === 'tree' ? 'tree' : pr.type, variant);
    const shake = pr.shake > 0 ? rand(-1, 1) : 0;
    if (pr.shake > 0) pr.shake -= 1 / 60;
    if (pr.type !== 'grass' && pr.type !== 'pedestal') shadowAt(pr.x, pr.y, pr.type === 'tree' ? 11 : pr.type === 'spring' ? 16 : 8);
    const oy = pr.type === 'grass' ? 3 : pr.type === 'spring' ? 6 : 2;
    ctx.drawImage(img, Math.round(pr.x - img.width / 2 + shake), Math.round(pr.y - img.height + oy));
  }

  function drawWorld() {
    const p = G.p, m = active();
    const room = G.room;
    // trampas y marcas del suelo
    for (const tr of room.traps) {
      if (tr.used) continue;
      const img = Tiles.propSprite(G.floor, 'trap', tr.variant);
      ctx.drawImage(img, X0 + tr.tx * T + 1, Y0 + tr.ty * T + 1);
    }
    for (const z of G.zones) {
      if (z.kind === 'meteor') {
        const k = Math.min(1, z.t / z.delay);
        ctx.fillStyle = z.side === 'e' ? 'rgba(255,40,40,0.22)' : 'rgba(255,255,255,0.12)'; circ(z.x, z.y, z.r);
        ctx.strokeStyle = z.side === 'e' ? 'rgba(255,60,60,0.7)' : z.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * k, 0, 6.3); ctx.stroke();
        VFX.draw(ctx, z.look.proj, z.look.pal, z.x, z.y - (1 - k) * 90, { angle: Math.PI / 2, frame: Math.floor(G.t * 10), scale: 1.2 });
      } else if (z.kind === 'mine') {
        VFX.draw(ctx, z.look.proj === 'web' ? 'web' : 'star', z.look.pal, z.x, z.y, { scale: 0.7, frame: Math.floor(G.t * 4), alpha: z.arm > 0 ? 0.5 : 1 });
      } else if (z.kind === 'aura') {
        const o = z.owner;
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(G.t * 16); ctx.fillStyle = z.color; circ(o.x, o.y - 6, z.r); ctx.globalAlpha = 1;
        ctx.strokeStyle = z.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(o.x, o.y - 6, z.r, 0, 6.3); ctx.stroke();
      } else if (z.kind === 'warn') {
        if (z.line) { ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a); ctx.fillStyle = 'rgba(255,40,40,0.25)'; ctx.fillRect(0, -z.w / 2, z.len, z.w); ctx.restore(); }
        else { ctx.fillStyle = 'rgba(255,40,40,0.25)'; circ(z.x, z.y, z.r); }
      } else if (z.kind === 'beam' && z.t < z.charge && z.side === 'e') {
        ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
        ctx.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.3 * z.t / z.charge) + ')'; ctx.fillRect(0, -z.w / 2, z.len, z.w);
        ctx.restore();
      }
    }
    if (G.stairs) {
      const img = Tiles.propSprite(G.floor, 'stairs', 0);
      ctx.drawImage(img, Math.round(G.stairs.x - img.width / 2), Math.round(G.stairs.y - img.height / 2));
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(G.t * 4); ctx.fillStyle = '#ffd23f'; circ(G.stairs.x, G.stairs.y, 16); ctx.globalAlpha = 1;
    }
    // objetos que van en el suelo (no ordenados)
    for (const q of room.pickups) if (q.type !== 'friend' && q.type !== 'item') drawPickup(q);
    // todo lo que tiene profundidad, ordenado por Y
    const list = [];
    for (const pr of room.props) if (pr.type !== 'pedestal') list.push({ y: pr.y, prop: pr });
    for (const pr of room.props) if (pr.type === 'pedestal') list.push({ y: pr.y - 20, prop: pr });
    for (const q of room.pickups) if (q.type === 'friend' || q.type === 'item') list.push({ y: q.y + (q.altar ? 1 : 0), pick: q });
    for (const e of G.enemies) list.push({ y: e.y, en: e });
    if (room.npc) list.push({ y: room.npc.y, npc: room.npc });
    if (m && !G.over) list.push({ y: p.y, player: true });
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.prop) drawProp(o.prop);
      else if (o.pick) drawPickup(o.pick);
      else if (o.npc) { shadowAt(o.npc.x, o.npc.y, 8); Sprites.draw(ctx, o.npc.dex, false, 'idle', Math.PI / 2, G.t, o.npc.x, o.npc.y, 1, {}); }
      else if (o.player) drawPlayer();
      else drawEnemy(o.en);
    }
    // órbitas, proyectiles y rayos
    for (const o of G.orbs) if (o.pts) for (const [x, y] of o.pts) VFX.draw(ctx, o.look.proj, o.look.pal, x, y, { frame: Math.floor(G.t * 10), angle: G.t * 6 });
    for (const s of G.shots) drawShot(s);
    for (const z of G.zones) if (z.kind === 'beam' && z.t >= z.charge) drawBeam(z);
    for (const b of G.bolts) {
      ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.beginPath(); b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    // partículas
    for (const f of G.fx) {
      const k = f.life / f.max;
      if (f.doors) continue;
      if (f.vfx) { VFX.draw(ctx, f.vfx, f.pal, f.x, f.y, { angle: f.a || 0, scale: (f.sc || 1) * (f.vfx === 'impact' ? 1 + (1 - k) * 0.4 : 1), frame: Math.floor((1 - k) * 4), alpha: Math.min(1, k * 2) }); continue; }
      if (f.ghost) { Sprites.draw(ctx, f.dex, f.shiny, 'walk', f.a, 0, f.x, f.y, f.sc || 1, { alpha: k * 0.5, flash: true }); continue; }
      if (f.ring) { ctx.strokeStyle = f.color; ctx.globalAlpha = k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r + (f.r1 - f.r) * (1 - k), 0, 6.3); ctx.stroke(); ctx.globalAlpha = 1; continue; }
      if (f.slash) {
        const pal = VFX.PAL[f.pal] || VFX.PAL.normal;
        ctx.globalAlpha = k; ctx.lineWidth = 3; ctx.strokeStyle = pal[2];
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.1 - 0.3 * k), f.a - f.arc / 2, f.a + f.arc / 2); ctx.stroke();
        ctx.strokeStyle = pal[4]; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = Math.min(1, k * 1.5); ctx.fillStyle = f.color;
      const s = Math.max(1, Math.round(f.size));
      ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s);
      ctx.globalAlpha = 1;
    }
    drawAmbient();
    // textos
    ctx.textAlign = 'center';
    for (const t of G.texts) {
      ctx.globalAlpha = Math.min(1, t.t * 3);
      ctx.font = (t.big ? 'bold 9px' : '8px') + ' "Pixelify Sans", monospace';
      ctx.fillStyle = '#000'; ctx.fillText(t.v, Math.round(t.x) + 1, Math.round(t.y) + 1);
      ctx.fillStyle = t.color; ctx.fillText(t.v, Math.round(t.x), Math.round(t.y));
    }
    ctx.globalAlpha = 1;
  }

  function statusTint(st, tele) {
    return st.burn > 0 ? 'rgba(255,100,40,0.35)' : st.poison > 0 ? 'rgba(160,60,200,0.35)' : st.para > 0 ? 'rgba(255,230,60,0.3)' : st.freeze > 0 ? 'rgba(160,220,255,0.55)' : tele ? 'rgba(255,60,60,0.45)' : null;
  }
  function drawPlayer() {
    const p = G.p, m = active();
    const blink = p.inv > 0 && Math.floor(G.t * 16) % 2 === 0;
    const sink = p.inLiquid ? 3 : 0;
    shadowAt(p.x, p.y, 7);
    if (!blink) {
      if (sink) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VIEW_W, p.y - 2); ctx.clip(); }
      Sprites.draw(ctx, m.dex, m.shiny, p.anim, p.face, p.atkT > 0 ? Math.max(0, 0.35 - p.atkT) : p.animT, p.x, p.y + sink, 1, { tint: statusTint(p.status) });
      if (sink) ctx.restore();
    }
    // indicador de puntería
    ctx.globalAlpha = 0.5;
    VFX.draw(ctx, 'arrow', 'normal', p.x + Math.cos(p.aim) * 16, p.y - 8 + Math.sin(p.aim) * 12, { angle: p.aim + Math.PI / 2, scale: 0.6 });
    ctx.globalAlpha = 1;
  }
  function drawEnemy(e) {
    const sc = e.scale;
    if (e.appear > 0) {
      const k = 1 - e.appear / (e.boss ? 1.4 : 0.7);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - k)) + ')'; circ(e.x, e.y - 8 * sc, 14 * sc * k);
      Sprites.draw(ctx, e.mon.dex, e.mon.shiny, 'idle', Math.PI / 2, 0, e.x, e.y, sc * Math.max(0.1, k), { alpha: k, flash: true });
      return;
    }
    shadowAt(e.x, e.y, 7 * sc);
    if (e.rare || e.mon.shiny) { ctx.globalAlpha = 0.2 + 0.1 * Math.sin(G.t * 8); ctx.fillStyle = '#ffe860'; circ(e.x, e.y - 10 * sc, 13 * sc); ctx.globalAlpha = 1; }
    const alpha = e.dead ? Math.max(0, e.fade / 0.4) : 1;
    const sink = e.inLiquid ? 3 : 0;
    if (sink) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VIEW_W, e.y - 2); ctx.clip(); }
    Sprites.draw(ctx, e.mon.dex, e.mon.shiny, e.dead ? 'hurt' : e.anim, e.face, e.dead ? 0.1 : e.atkT > 0 ? Math.max(0, 0.35 - e.atkT) : e.animT, e.x, e.y + sink, sc, { flash: e.flash > 0, alpha, tint: statusTint(e.status, e.tele) });
    if (sink) ctx.restore();
    if (e.mon.shiny && Math.random() < 0.08) G.fx.push({ vfx: 'star', pal: 'electric', x: e.x + rand(-8, 8), y: e.y - rand(4, 24), vy: -10, life: 0.4, max: 0.4, sc: 0.4 });
    if (!e.dead && !e.boss && e.mon.hp < e.maxHp) {
      const w = 16, x = Math.round(e.x - w / 2), y = Math.round(e.y - 28 * sc);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 4);
      const k = Math.max(0, e.mon.hp / e.maxHp);
      ctx.fillStyle = k > 0.5 ? '#5fe08a' : k > 0.2 ? '#ffd23f' : '#ff5050'; ctx.fillRect(x, y, Math.round(w * k), 2);
    }
    if (e.tele) VFX.draw(ctx, 'arrow', 'fire', e.x, e.y - 30 * sc, { angle: Math.PI, scale: 0.7 });
  }
  function drawShot(s) {
    const L = s.look;
    const shape = s.boom ? (L.proj === 'leaf' ? 'leaf' : 'crescent') : L.proj;
    const ang = VFX.isDir(shape) ? Math.atan2(s.vy, s.vx) : VFX.spins(shape) || s.boom ? (G.t - s.born) * 14 : 0;
    if (s.side === 'e') { ctx.globalAlpha = 0.45; ctx.fillStyle = '#ff2040'; circ(s.x, s.y, s.r + 4); ctx.globalAlpha = 1; }
    VFX.draw(ctx, shape, L.pal, s.x, s.y, { angle: ang, frame: Math.floor((G.t - s.born) * 12), scale: s.big ? 1.3 : 0.9 });
  }
  function drawBeam(z) {
    const pal = VFX.PAL[z.look.pal] || VFX.PAL.normal;
    const rem = (z.charge + z.dur - z.t) / z.dur, w = Math.max(2, z.w * Math.min(1, rem * 4) * (1 + Math.sin(G.t * 50) * 0.08));
    ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a);
    ctx.fillStyle = pal[0]; ctx.fillRect(2, -w / 2 - 1, z.len, w + 2);
    ctx.fillStyle = pal[2]; ctx.fillRect(2, -w / 2, z.len, w);
    ctx.fillStyle = pal[3]; ctx.fillRect(2, -w / 4, z.len, w / 2);
    ctx.fillStyle = pal[4]; ctx.fillRect(2, -1, z.len, 2);
    ctx.restore();
    const ca = Math.cos(z.a), sa = Math.sin(z.a);
    for (let k = ((G.t * 160) % 22); k < z.len; k += 22) VFX.draw(ctx, z.look.beam, z.look.pal, z.x + ca * k, z.y + sa * k, { angle: z.a, frame: Math.floor(G.t * 10), scale: 0.8 });
    VFX.draw(ctx, 'impact', z.look.pal, z.x, z.y, { frame: Math.floor(G.t * 12), scale: 0.8 });
  }

  function drawPickup(q) {
    const x = Math.round(q.x), y = Math.round(q.y - (q.z || 0)), bob = Math.round(Math.sin(G.t * 4 + q.x) * 1.5);
    switch (q.type) {
      case 'coin': {
        shadowAt(x, q.y + 3, 3);
        const w = Math.max(1, Math.round(Math.abs(Math.cos(G.t * 4 + q.x)) * 4));
        ctx.fillStyle = '#7a5a00'; ctx.fillRect(x - w, y - 4 + bob, w * 2, 8);
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - w + 1, y - 3 + bob, Math.max(1, w * 2 - 2), 6);
        ctx.fillStyle = '#fff6b0'; ctx.fillRect(x - w + 1, y - 3 + bob, 1, 2);
        if (q.val > 1) { ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillText('x' + q.val, x + 8, y - 4); }
        break;
      }
      case 'berry':
        shadowAt(x, q.y + 3, 4);
        ctx.fillStyle = '#1a2a70'; circ(x, y + bob, 5); ctx.fillStyle = '#3a6ad0'; circ(x, y + bob, 4); ctx.fillStyle = '#8ab0ff'; ctx.fillRect(x - 2, y - 3 + bob, 2, 2);
        ctx.fillStyle = '#3a8a2a'; ctx.fillRect(x - 1, y - 7 + bob, 3, 2); ctx.fillRect(x + 1, y - 8 + bob, 2, 1);
        break;
      case 'potion':
        shadowAt(x, q.y + 4, 4);
        Icons.draw(ctx, 'potion', x, y - 2 + bob);
        break;
      case 'item': {
        const hy = q.altar ? -24 : q.price ? -14 : -8;
        if (!q.altar && !q.price) shadowAt(x, q.y + 3, 6);
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(G.t * 4); ctx.fillStyle = '#ffd23f'; circ(x, y + hy - 4 + bob, 10); ctx.globalAlpha = 1;
        Icons.draw(ctx, Icons.item(q.id), x, y + hy - 4 + bob);
        if (Math.random() < 0.05) G.fx.push({ vfx: 'star', pal: 'electric', x: x + rand(-8, 8), y: y + hy - rand(0, 10), vy: -10, life: 0.4, max: 0.4, sc: 0.4 });
        break;
      }
      case 'friend': {
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(G.t * 6); ctx.fillStyle = q.mon.shiny ? '#ffe860' : '#7ff0a0'; circ(x, y - 8, 12); ctx.globalAlpha = 1;
        shadowAt(x, q.y, 7);
        Sprites.draw(ctx, q.mon.dex, q.mon.shiny, 'idle', Math.PI / 2, G.t, x, y + bob, 1, {});
        VFX.draw(ctx, 'heart', 'fairy', x, y - 30 + bob, { scale: 0.8 });
        break;
      }
      default: break;
    }
    if (q.price) {
      ctx.font = '8px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#000'; ctx.fillText(q.price + ' ₽', x + 1, y + 23);
      ctx.fillStyle = G.coins >= q.price ? '#ffd23f' : '#ff8080'; ctx.fillText(q.price + ' ₽', x, y + 22);
    }
  }

  function drawAmbient() {
    const B = Tiles.BIOMES[G.floor];
    for (const a of G.amb) {
      const k = Math.min(1, a.t * 2, (a.life - a.t) * 2);
      ctx.globalAlpha = Math.max(0, k);
      switch (a.k) {
        case 'leaf': VFX.draw(ctx, 'leaf', 'grass', a.x, a.y, { angle: a.t * 3 + a.ph, scale: 0.55 }); break;
        case 'fly': ctx.fillStyle = Math.sin(a.t * 6 + a.ph) > 0 ? '#fff6a0' : '#a0c040'; ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1); ctx.globalAlpha *= 0.3; circ(a.x, a.y, 3); break;
        case 'spark': ctx.fillStyle = B.leaf[3]; ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1); if (Math.sin(a.t * 8 + a.ph) > 0.7) { ctx.fillRect(Math.round(a.x) - 1, Math.round(a.y), 3, 1); ctx.fillRect(Math.round(a.x), Math.round(a.y) - 1, 1, 3); } break;
        case 'bubble': ctx.strokeStyle = B.foam; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(a.x, a.y, 1.5 + a.t, 0, 6.3); ctx.stroke(); break;
        case 'zap': VFX.draw(ctx, 'bolt', 'electric', a.x, a.y, { angle: a.ph, scale: 0.5, frame: Math.floor(a.t * 20) }); break;
        case 'wisp': ctx.fillStyle = '#a080e0'; ctx.globalAlpha *= 0.6; circ(a.x, a.y, 2); ctx.globalAlpha *= 0.4; circ(a.x, a.y, 4); break;
        case 'ember': ctx.fillStyle = Math.sin(a.t * 5 + a.ph) > 0 ? '#c9a6ff' : '#7b5cff'; ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 2); break;
        default: break;
      }
    }
    ctx.globalAlpha = 1;
  }

  // oscuridad de la Torre Pokémon y viñeta en todos los pisos
  function drawLighting() {
    const dark = G.floor === 4 ? 0.82 : G.floor === 1 || G.floor === 5 ? 0.35 : 0;
    if (dark > 0) {
      if (!lightCv) { lightCv = document.createElement('canvas'); lightCv.width = VIEW_W; lightCv.height = VIEW_H; lightCtx = lightCv.getContext('2d'); }
      const L = lightCtx;
      L.globalCompositeOperation = 'source-over';
      L.clearRect(0, 0, VIEW_W, VIEW_H);
      L.fillStyle = 'rgba(4,2,12,' + dark + ')';
      L.fillRect(0, 0, VIEW_W, VIEW_H);
      L.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r, a) => {
        const g = L.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.6, 'rgba(0,0,0,' + a * 0.6 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
        L.fillStyle = g; L.beginPath(); L.arc(x, y, r, 0, 6.3); L.fill();
      };
      hole(G.p.x, G.p.y - 10, 78 + Math.sin(G.t * 3) * 2, 1);
      for (const [tx, ty] of TORCHES) hole(tx, ty - 4, 46 + Math.sin(G.t * 9 + tx) * 3, 0.9);
      for (const s of G.shots) hole(s.x, s.y, 22, 0.8);
      for (const z of G.zones) if (z.kind === 'beam' && z.t >= z.charge) for (let k = 0; k < z.len; k += 20) hole(z.x + Math.cos(z.a) * k, z.y + Math.sin(z.a) * k, 18, 0.7);
      for (const a of G.amb) if (a.k === 'wisp' || a.k === 'ember') hole(a.x, a.y, 12, 0.5);
      for (const e of G.enemies) if (e.boss || e.mon.shiny) hole(e.x, e.y - 10, 30, 0.6);
      for (const [tx, ty] of G.room.liquidCells) hole(tx * T + 8, ty * T + 8, 12, 0.25);
      ctx.drawImage(lightCv, 0, 0);
    }
    const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function drawIntro() {
    const k = G.intro;
    const a = Math.min(1, k * 2, (2.6 - k) * 4);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(5,5,16,0.75)'; ctx.fillRect(0, VIEW_H / 2 - 22, VIEW_W, 44);
    ctx.fillStyle = Tiles.BIOMES[G.floor].leaf[2]; ctx.fillRect(0, VIEW_H / 2 - 22, VIEW_W, 1); ctx.fillRect(0, VIEW_H / 2 + 21, VIEW_W, 1);
    ctx.textAlign = 'center';
    ctx.font = '8px "Pixelify Sans", monospace'; ctx.fillStyle = '#9aa6d8'; ctx.fillText('PISO ' + (G.floor + 1) + ' DE ' + ZONES.length, VIEW_W / 2, VIEW_H / 2 - 7);
    ctx.font = 'bold 16px "Pixelify Sans", monospace'; ctx.fillStyle = '#000'; ctx.fillText(G.zone.name, VIEW_W / 2 + 1, VIEW_H / 2 + 11);
    ctx.fillStyle = '#ffd23f'; ctx.fillText(G.zone.name, VIEW_W / 2, VIEW_H / 2 + 10);
    ctx.globalAlpha = 1;
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
    _enter(room) { enterRoom(room); G.p.x = CX; G.p.y = CY + 40; if (G.room.solidMap[Math.floor((G.p.y - Y0) / T)][Math.floor((G.p.x - X0) / T)]) G.p.y = Y1 - 6; },
    _floor(f) { newFloor(f); },
    step(n, dt) { for (let i = 0; i < n && G && !G.over; i++) if (!G.paused && !G.modal) update(dt || 1 / 60); },
  };
})();
