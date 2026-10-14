// Generación de pisos al estilo The Binding of Isaac: rejilla de salas conectadas.
'use strict';

const Dungeon = (() => {
  const GW = 9, GH = 8;
  const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
  const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };

  // Plantillas de obstáculos (17 x 9): # roca · * arbusto/obstáculo rompible · . libre
  const LAYOUTS = [
    ['.................', '.................', '.................', '.................', '.................', '.................', '.................', '.................', '.................'],
    ['.................', '..##.........##..', '..#...........#..', '.................', '.................', '.................', '..#...........#..', '..##.........##..', '.................'],
    ['.................', '.................', '....#.......#....', '....#.......#....', '....#.......#....', '....#.......#....', '....#.......#....', '.................', '.................'],
    ['.................', '.................', '.....*.....*.....', '.................', '.......###.......', '.................', '.....*.....*.....', '.................', '.................'],
    ['.................', '.#.............#.', '.................', '...#.........#...', '.................', '...#.........#...', '.................', '.#.............#.', '.................'],
    ['.................', '.................', '..****.....****..', '.................', '.................', '.................', '..****.....****..', '.................', '.................'],
    ['.................', '.....#.....#.....', '.....#.....#.....', '.................', '..#...........#..', '.................', '.....#.....#.....', '.....#.....#.....', '.................'],
    ['.................', '.................', '...##.......##...', '...#*.......*#...', '.................', '...#*.......*#...', '...##.......##...', '.................', '.................'],
    ['.................', '.*.*.*.....*.*.*.', '.................', '.................', '.................', '.................', '.................', '.*.*.*.....*.*.*.', '.................'],
    ['.................', '.................', '.......#.#.......', '......#...#......', '.................', '......#...#......', '.......#.#.......', '.................', '.................'],
    ['.................', '..#...........#..', '.................', '.....*.....*.....', '........#........', '.....*.....*.....', '.................', '..#...........#..', '.................'],
    ['.................', '.................', '..###.......###..', '.................', '.................', '.................', '..###.......###..', '.................', '.................'],
  ];

  function rnd(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function generate(floor, seed) {
    const R = rnd(seed || (Date.now() ^ (floor * 7919)));
    const target = Math.min(18, 7 + floor * 2 + Math.floor(R() * 3));
    for (let attempt = 0; attempt < 200; attempt++) {
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
      // distancias desde el inicio
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
        map[key(r.x, r.y)] = {
          x: r.x, y: r.y, key: key(r.x, r.y), type: 'fight', doors, dist: dist[key(r.x, r.y)],
          cleared: false, visited: false, seen: false, pickups: [],
          layout: null,
        };
      }
      const start = map[key(sx, sy)];
      start.type = 'start'; start.cleared = true;
      map[key(dead[0].x, dead[0].y)].type = 'boss';
      const rest = dead.slice(1).sort(() => R() - 0.5);
      map[key(rest[0].x, rest[0].y)].type = 'treasure';
      map[key(rest[1].x, rest[1].y)].type = 'shop';
      map[key(rest[2].x, rest[2].y)].type = 'heal';
      for (const r of Object.values(map)) {
        if (r.type === 'fight') {
          const L = LAYOUTS[Math.floor(R() * LAYOUTS.length)];
          r.layout = parseLayout(L, R() < 0.5, R() < 0.5);
          // 1 de cada 40 salas tiene un Pokémon singular
          r.rare = R() < 0.025;
        } else r.layout = parseLayout(LAYOUTS[0], false, false);
        if (r.type !== 'fight' && r.type !== 'boss') r.cleared = true;
      }
      start.visited = true; start.seen = true;
      return { rooms: map, start, floor, key };
    }
    throw new Error('No se pudo generar el piso');
  }

  function parseLayout(L, flipX, flipY) {
    const g = [];
    for (let y = 0; y < 9; y++) {
      const row = [];
      for (let x = 0; x < 17; x++) {
        const ch = L[flipY ? 8 - y : y][flipX ? 16 - x : x];
        row.push(ch === '#' ? 1 : ch === '*' ? 2 : 0);
      }
      g.push(row);
    }
    // pasillos de las puertas siempre libres
    for (let y = 0; y < 9; y++) for (let x = 0; x < 17; x++) {
      if ((x >= 7 && x <= 9 && (y <= 1 || y >= 7)) || (y >= 3 && y <= 5 && (x <= 1 || x >= 15))) g[y][x] = 0;
    }
    return g;
  }

  return { generate, DIRS, OPP, GW, GH };
})();
