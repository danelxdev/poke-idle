// Generación de pisos al estilo The Binding of Isaac y diseño de cada sala.
'use strict';

const Dungeon = (() => {
  const GW = 9, GH = 8;
  const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
  const IW = COLS, IH = ROWS;            // sala interior 17 x 9
  const MIDX = (IW - 1) / 2, MIDY = (IH - 1) / 2;

  function rnd(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  // ---------------- piso ----------------
  function generate(floor, seed) {
    const R = rnd(seed || ((Date.now() ^ (floor * 7919)) >>> 0));
    const target = Math.min(18, 7 + floor * 2 + Math.floor(R() * 3));
    for (let attempt = 0; attempt < 300; attempt++) {
      const grid = {};
      const key = (x, y) => x + ',' + y;
      const sx = 4, sy = 4;
      grid[key(sx, sy)] = { x: sx, y: sy };
      const q = [[sx, sy]];
      let count = 1;
      const neigh = (x, y) => Object.values(DIRS).filter(([dx, dy]) => grid[key(x + dx, y + dy)]).length;
      while (q.length && count < target) {
        const [x, y] = q.shift();
        for (const [dx, dy] of Object.values(DIRS).sort(() => R() - 0.5)) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH || grid[key(nx, ny)]) continue;
          if (count >= target || neigh(nx, ny) > 1 || R() < 0.5) continue;
          grid[key(nx, ny)] = { x: nx, y: ny };
          q.push([nx, ny]);
          count++;
        }
        if (!q.length && count < target) q.push(...Object.values(grid).map(r => [r.x, r.y]).sort(() => R() - 0.5).slice(0, 1));
      }
      if (count < target) continue;
      const rooms = Object.values(grid);
      const dist = { [key(sx, sy)]: 0 };
      const bq = [[sx, sy]];
      while (bq.length) {
        const [x, y] = bq.shift();
        for (const [dx, dy] of Object.values(DIRS)) {
          const k = key(x + dx, y + dy);
          if (grid[k] && dist[k] === undefined) { dist[k] = dist[key(x, y)] + 1; bq.push([x + dx, y + dy]); }
        }
      }
      const dead = rooms.filter(r => !(r.x === sx && r.y === sy) && neigh(r.x, r.y) === 1).sort((a, b) => dist[key(b.x, b.y)] - dist[key(a.x, a.y)]);
      if (dead.length < 4) continue;
      const map = {};
      for (const r of rooms) {
        const doors = {};
        for (const [d, [dx, dy]] of Object.entries(DIRS)) if (grid[key(r.x + dx, r.y + dy)]) doors[d] = true;
        map[key(r.x, r.y)] = { x: r.x, y: r.y, key: key(r.x, r.y), type: 'fight', doors, dist: dist[key(r.x, r.y)], cleared: false, visited: false, seen: false, pickups: [] };
      }
      const start = map[key(sx, sy)];
      start.type = 'start';
      map[key(dead[0].x, dead[0].y)].type = 'boss';
      const rest = dead.slice(1).sort(() => R() - 0.5);
      map[key(rest[0].x, rest[0].y)].type = 'treasure';
      map[key(rest[1].x, rest[1].y)].type = 'shop';
      map[key(rest[2].x, rest[2].y)].type = 'heal';
      for (const r of Object.values(map)) {
        Object.assign(r, design(r, floor, R));
        r.seed = Math.floor(R() * 100000);
        if (r.type !== 'fight' && r.type !== 'boss') r.cleared = true;
        if (r.type === 'fight') r.rare = R() < 0.03;
      }
      start.visited = true; start.seen = true;
      return { rooms: map, start, floor };
    }
    throw new Error('No se pudo generar el piso');
  }

  // ---------------- diseño de una sala ----------------
  // grid: 0 suelo · 1 pared/columna · 3 líquido. props: árboles, rocas, hierba, lápidas…
  const SHAPES = ['open', 'pillars', 'pond', 'twinponds', 'river', 'corners', 'cross', 'grove', 'ring', 'columns', 'lake', 'islands'];

  function design(room, floor, R) {
    const type = room.type;
    for (let attempt = 0; attempt < 40; attempt++) {
      const g = Array.from({ length: IH }, () => new Array(IW).fill(0));
      const props = [], traps = [];
      const setSym = (x, y, v, quad) => {
        const pts = quad ? [[x, y], [IW - 1 - x, y], [x, IH - 1 - y], [IW - 1 - x, IH - 1 - y]] : [[x, y], [IW - 1 - x, y]];
        for (const [a, b] of pts) if (a >= 0 && b >= 0 && a < IW && b < IH) g[b][a] = v;
      };
      const ellipse = (cx, cy, rx, ry, v) => { for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) g[y][x] = v; };
      let shape = 'open';
      if (type === 'fight') {
        // en pisos con líquido dañino, sólo charcas pequeñas
        const harmful = ['lava', 'poison', 'spark'].includes(Tiles.THEMES[floor].liquid);
        const pool = harmful ? SHAPES.filter(x => !['lake', 'islands', 'river'].includes(x)) : SHAPES;
        shape = pool[Math.floor(R() * pool.length)];
      }
      if (type === 'boss') shape = 'bossarena';
      switch (shape) {
        case 'pillars': for (const [x, y] of [[3, 2], [4, 2], [3, 3], [4, 3]]) setSym(x, y, 1, true); break;
        case 'pond': ellipse(MIDX, MIDY, 3 + Math.floor(R() * 2), 1.6 + R() * 0.6, 3); break;
        case 'twinponds': ellipse(3.5, MIDY, 2, 2.2, 3); ellipse(IW - 4.5, MIDY, 2, 2.2, 3); break;
        case 'lake': ellipse(MIDX, MIDY, 6.5, 3.2, 3); ellipse(MIDX, MIDY, 2.5, 1.2, 0); break;
        case 'river': {
          if (R() < 0.5) { for (let y = 0; y < IH; y++) for (let x = 6; x <= 10; x++) if (Math.abs(x - MIDX - Math.sin(y) * 0.8) < 1.6) g[y][x] = 3; }
          else for (let x = 0; x < IW; x++) for (let y = 2; y <= 6; y++) if (Math.abs(y - MIDY - Math.sin(x * 0.7) * 0.7) < 1.2) g[y][x] = 3;
          break;
        }
        case 'corners': for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) if (x + y < 4) setSym(x, y, 3, true); break;
        case 'cross':
          for (let x = 4; x <= 6; x++) setSym(x, MIDY, 1, false);
          for (let y = 1; y <= 2; y++) setSym(MIDX, y, 1, true);
          break;
        case 'ring':
          for (let x = 5; x <= 11; x++) { g[2][x] = 1; g[6][x] = 1; }
          for (let y = 2; y <= 6; y++) { g[y][5] = 1; g[y][11] = 1; }
          g[2][8] = 0; g[6][8] = 0; g[4][5] = 0; g[4][11] = 0; g[2][7] = 0; g[2][9] = 0; g[6][7] = 0; g[6][9] = 0;
          break;
        case 'columns': for (let x = 2; x < IW; x += 4) for (const y of [2, 6]) setSym(x, y, 1, false); break;
        case 'islands': ellipse(MIDX, MIDY, 8.6, 4.6, 3); for (const [x, y, r] of [[3, 2, 1.3], [13, 2, 1.3], [3, 6, 1.3], [13, 6, 1.3], [8, 4, 2.2]]) ellipse(x, y, r + 0.4, r, 0); break;
        case 'grove': {
          const n = 3 + Math.floor(R() * 3);
          for (let i = 0; i < n; i++) {
            const x = 1 + Math.floor(R() * 6), y = 1 + Math.floor(R() * 7);
            props.push({ type: 'tree', tx: x, ty: y }); props.push({ type: 'tree', tx: IW - 1 - x, ty: y });
          }
          break;
        }
        case 'bossarena': for (const [x, y] of [[2, 1], [2, 7]]) { setSym(x, y, 1, false); } break;
        default: break;
      }
      // pasillos de las puertas y el centro siempre transitables
      const clearAt = (x, y) => { if (x >= 0 && y >= 0 && x < IW && y < IH) g[y][x] = g[y][x] === 1 ? 0 : g[y][x]; };
      for (let y = 0; y < 2; y++) { clearAt(MIDX, y); clearAt(MIDX, IH - 1 - y); }
      for (let x = 0; x < 2; x++) { clearAt(x, MIDY); clearAt(IW - 1 - x, MIDY); }
      for (const [x, y] of [[MIDX, 0], [MIDX, 1], [MIDX, IH - 1], [MIDX, IH - 2], [0, MIDY], [1, MIDY], [IW - 1, MIDY], [IW - 2, MIDY]]) if (g[y][x] === 3 && type !== 'fight') g[y][x] = 0;
      // salas especiales
      if (type === 'treasure') { props.push({ type: 'altar', tx: MIDX, ty: MIDY }); for (let i = 0; i < 6; i++) props.push({ type: 'grass', tx: Math.floor(R() * IW), ty: Math.floor(R() * IH) }); }
      if (type === 'heal') { props.push({ type: 'spring', tx: MIDX, ty: MIDY }); }
      if (type === 'shop') { /* los pedestales los pone el juego */ }
      if (type === 'start') { for (let i = 0; i < 5; i++) props.push({ type: 'grass', tx: Math.floor(R() * IW), ty: Math.floor(R() * IH) }); }
      // decoración de las salas de combate
      if (type === 'fight' || type === 'boss') {
        const nGrass = type === 'boss' ? 2 : 3 + Math.floor(R() * 8);
        for (let i = 0; i < nGrass; i++) props.push({ type: 'grass', tx: Math.floor(R() * IW), ty: Math.floor(R() * IH) });
        if (type === 'fight') {
          const nRock = Math.floor(R() * 4);
          for (let i = 0; i < nRock; i++) { const x = 1 + Math.floor(R() * 6), y = Math.floor(R() * IH); props.push({ type: 'rock', tx: x, ty: y }); if (R() < 0.6) props.push({ type: 'rock', tx: IW - 1 - x, ty: y }); }
          if (floor >= 4 && R() < 0.6) for (let i = 0; i < 2; i++) props.push({ type: 'tomb', tx: 1 + Math.floor(R() * (IW - 2)), ty: Math.floor(R() * IH) });
          if (floor >= 1) { const nt = Math.floor(R() * (1 + Math.min(3, floor))); for (let i = 0; i < nt; i++) traps.push({ tx: 2 + Math.floor(R() * (IW - 4)), ty: 1 + Math.floor(R() * (IH - 2)), variant: Math.floor(R() * 3) }); }
        }
      }
      // limpia props imposibles (sobre paredes/líquido/puertas/centro de salas especiales)
      const blocked = new Set();
      const okProps = [];
      for (const p of props) {
        const k = p.tx + ',' + p.ty;
        if (p.tx < 0 || p.ty < 0 || p.tx >= IW || p.ty >= IH || blocked.has(k) || g[p.ty][p.tx] !== 0) continue;
        const nearDoor = (Math.abs(p.tx - MIDX) <= 1 && (p.ty <= 1 || p.ty >= IH - 2)) || (Math.abs(p.ty - MIDY) <= 1 && (p.tx <= 1 || p.tx >= IW - 2));
        if (nearDoor && p.type !== 'grass') continue;
        if ((type === 'treasure' || type === 'heal') && p.type === 'grass' && Math.abs(p.tx - MIDX) <= 2 && Math.abs(p.ty - MIDY) <= 1) continue;
        blocked.add(k);
        okProps.push(p);
      }
      const okTraps = traps.filter(t => g[t.ty][t.tx] === 0 && !blocked.has(t.tx + ',' + t.ty) && Math.hypot(t.tx - MIDX, t.ty - MIDY) > 1.5);
      if (!connected(g, okProps)) continue;
      return { grid: g, props: okProps.map(p => Object.assign(p, { hp: p.type === 'rock' ? 3 : 1, variant: 0, wig: R() * 6 })), traps: okTraps };
    }
    return { grid: Array.from({ length: IH }, () => new Array(IW).fill(0)), props: [], traps: [] };
  }

  const SOLID_PROPS = { tree: 1, rock: 1, tomb: 1, altar: 1, spring: 0 };
  // todas las puertas y la mayor parte del suelo deben poder alcanzarse
  function connected(g, props) {
    const solid = Array.from({ length: IH }, (_, y) => g[y].map(v => v === 1));
    for (const p of props) if (SOLID_PROPS[p.type]) solid[p.ty][p.tx] = true;
    const starts = [[MIDX, 0], [MIDX, IH - 1], [0, MIDY], [IW - 1, MIDY]];
    const seen = new Set([MIDX + ',' + 0]);
    const q = [[MIDX, 0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= IW || ny >= IH || seen.has(k) || solid[ny][nx]) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    if (!starts.every(([x, y]) => seen.has(x + ',' + y))) return false;
    let open = 0;
    for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) if (!solid[y][x]) open++;
    return seen.size >= open * 0.9;
  }

  return { generate, DIRS, OPP, GW, GH, SOLID_PROPS };
})();
