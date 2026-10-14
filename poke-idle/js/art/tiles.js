/* ============ tiles.js — pixel art de la mazmorra, pintado en código ============
 * Adaptado de PokéSurvivor (https://github.com/JPTER78/pokesurvivor), © 2026 JPTER78,
 * licencia MIT (ver LICENSE-POKESURVIVOR.txt). Cambios: salas cerradas al estilo
 * Isaac, biomas por piso, puertas, escaleras, lápidas, pedestales y alfombras.
 *
 * Todo se pinta a resolución de ARTE (16 px por tile) escribiendo en un ImageData,
 * con el mismo tamaño de píxel que los sprites de Mundo Misterioso.
 * Autotiling: cada tile mira a sus vecinos (cara frontal de las paredes, esquinas
 * redondeadas, orilla y espuma de los líquidos...).
 */
'use strict';

const Tiles = (() => {
  const TS = 16;

  // ---------------- utilidades ----------------
  function hash(x, y, seed) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const H = hash;
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = H(xi, yi, s), b = H(xi + 1, yi, s), c = H(xi, yi + 1, s), d = H(xi + 1, yi + 1, s);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  const fbm = (x, y, s) => vnoise(x, y, s) * 0.65 + vnoise(x * 2.13 + 17, y * 2.13 - 9, s + 1) * 0.35;

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function pack(hex, a = 255) { const [r, g, b] = rgb(hex); return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; }
  function mixPack(h1, h2, t) {
    const a = rgb(h1), b = rgb(h2);
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
  }
  function shade(hex, k) {
    const c = rgb(hex).map(v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)));
    return '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }
  function Pix(w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    const img = c.createImageData(w, h);
    const buf = new Uint32Array(img.data.buffer);
    return {
      w, h,
      set(x, y, col) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) buf[y * w + x] = col; },
      get(x, y) { return buf[y * w + x]; },
      canvas() { c.putImageData(img, 0, 0); return cv; },
    };
  }

  // ---------------- biomas (uno por piso) ----------------
  // liquid: water (frena) · swamp (frena más) · lava (quema) · poison (envenena) · spark (paraliza)
  const THEMES = [
    { name: 'Bosque Verde', floor: '#3f7a3a', wall: '#56704a', liquid: 'water', liq: '#3b7fc6', foam: '#b3defa', prop: 'tree',
      leaf: '#3f9a3a', trunk: '#5b3b22', flowers: ['#f4d65c', '#f39ac0', '#eef2ff'], grass: '#4caa3f', rock: '#6f7880', dirt: '#7d6742' },
    { name: 'Monte Moon', floor: '#4d5778', wall: '#5f5089', liquid: 'water', liq: '#2a9cab', foam: '#aaf4f7', prop: 'crystal',
      leaf: '#8fe7f5', trunk: '#3a4a78', flowers: ['#8fe3ff', '#c9a6ff', '#ffe0f4'], grass: '#5a86c0', rock: '#737c9c' },
    { name: 'Islas Espuma', floor: '#7fa8b8', wall: '#4a6a88', liquid: 'water', liq: '#2f86d6', foam: '#e6f8ff', prop: 'crystal',
      leaf: '#bfe8ff', trunk: '#4a6f98', flowers: ['#ffffff', '#9fe0ff', '#ff9ec4'], grass: '#7fb0c0', rock: '#8fa8c0', dirt: '#c8b88a' },
    { name: 'Central Energía', floor: '#5a5a62', wall: '#3a3e4c', liquid: 'spark', liq: '#e8c020', foam: '#fff6c0', prop: 'pylon',
      leaf: '#ffd23f', trunk: '#5d6773', flowers: ['#ffe14d', '#7fd0ff', '#ffffff'], grass: '#8a8a60', rock: '#8a92a0' },
    { name: 'Torre Pokémon', floor: '#3c3549', wall: '#2a2236', liquid: 'poison', liq: '#7a3fa0', foam: '#e0a6ff', prop: 'tomb',
      leaf: '#5a4a6a', trunk: '#3a2f45', flowers: ['#9a8ad0', '#5fe0c0', '#c9cfdc'], grass: '#5a5470', rock: '#6a6680' },
    { name: 'Cueva Celeste', floor: '#363a5e', wall: '#2a2a58', liquid: 'lava', liq: '#7b5cff', foam: '#c9a6ff', prop: 'crystal',
      leaf: '#b39cff', trunk: '#2a2a5a', flowers: ['#7b5cff', '#ffd23f', '#ffffff'], grass: '#5a5a9a', rock: '#5a5a8a' },
    { name: 'Desierto', floor: '#c9a867', wall: '#a07a48', liquid: 'water', liq: '#3ba6a0', foam: '#c8f4e8', prop: 'tomb',
      leaf: '#7a9a3a', trunk: '#8a6a3a', flowers: ['#ff9a5a', '#ffe38a', '#e8785a'], grass: '#a8a050', rock: '#a08a68', dirt: '#b08a50' },
    { name: 'Nieve', floor: '#dce8f4', wall: '#7a98c0', liquid: 'water', liq: '#6aa8e0', foam: '#ffffff', prop: 'crystal',
      leaf: '#d8f4ff', trunk: '#8aa8c8', flowers: ['#ffffff', '#b8e0ff', '#ffc8e8'], grass: '#b8d0e0', rock: '#9ab0c8', dirt: '#c0d0e0' },
    { name: 'Playa', floor: '#e4d29a', wall: '#6a8a9a', liquid: 'water', liq: '#2fb0e0', foam: '#f4ffff', prop: 'tree',
      leaf: '#3aa84a', trunk: '#8a5a32', flowers: ['#ff7a9a', '#ffe14d', '#ffffff'], grass: '#7ab050', rock: '#9a9a8a', dirt: '#d0b878' },
    { name: 'Selva', floor: '#2f6a3a', wall: '#2a4a2e', liquid: 'poison', liq: '#4a8a4a', foam: '#b8f0a0', prop: 'tree',
      leaf: '#2a8a3a', trunk: '#4a3220', flowers: ['#ff5a8a', '#ffd23f', '#a8f0ff'], grass: '#3a9a3a', rock: '#5a6a58', dirt: '#5a4a2a' },
    { name: 'Volcán', floor: '#4a3a3a', wall: '#2e2226', liquid: 'lava', liq: '#ff6a1f', foam: '#ffd070', prop: 'crystal',
      leaf: '#ff8a3a', trunk: '#3a2a2a', flowers: ['#ff5a2a', '#ffb22e', '#ffe08a'], grass: '#6a4a3a', rock: '#6a5a58', dirt: '#3a2a28' },
    { name: 'Cielo', floor: '#9ab8e8', wall: '#5a78b8', liquid: 'water', liq: '#7ab8ff', foam: '#ffffff', prop: 'crystal',
      leaf: '#ffffff', trunk: '#8aa8d8', flowers: ['#ffffff', '#ffe38a', '#ffb8e0'], grass: '#8ac8e0', rock: '#a8b8d8', dirt: '#b0c4e4' },
    { name: 'Pradera', floor: '#6fb858', wall: '#4a7a3a', liquid: 'water', liq: '#4a9ae0', foam: '#d8f4ff', prop: 'tree',
      leaf: '#4aaa3a', trunk: '#6a4a2a', flowers: ['#ff9ac0', '#ffe14d', '#ffffff'], grass: '#5ab848', rock: '#8a9088', dirt: '#a08a52' },
    { name: 'Ciudad', floor: '#6a6e7c', wall: '#3a3e50', liquid: 'spark', liq: '#4a7ae0', foam: '#b8d8ff', prop: 'pylon',
      leaf: '#8ab8ff', trunk: '#5a6070', flowers: ['#ffd23f', '#7fd0ff', '#ffffff'], grass: '#7a8a70', rock: '#8a92a0' },
    { name: 'Otoño', floor: '#9a7a4a', wall: '#6a4a2e', liquid: 'water', liq: '#4a8ab8', foam: '#e0f0ff', prop: 'tree',
      leaf: '#d8742a', trunk: '#5a3a22', flowers: ['#ffb02e', '#ff6a3a', '#ffe08a'], grass: '#a8883a', rock: '#8a7a6a', dirt: '#8a6a3a' },
    { name: 'Tropical', floor: '#e8d890', wall: '#4a8a6a', liquid: 'water', liq: '#20c8d8', foam: '#ffffff', prop: 'tree',
      leaf: '#2aa84a', trunk: '#8a5a32', flowers: ['#ff5a9a', '#ffe14d', '#ff9a3a'], grass: '#58b048', rock: '#a8a090', dirt: '#d8c078' },
    { name: 'Páramo', floor: '#5a7a58', wall: '#4a5a4a', liquid: 'water', liq: '#4a7a9a', foam: '#d0e8f0', prop: 'tomb',
      leaf: '#6a8a5a', trunk: '#4a4a3a', flowers: ['#c8a0ff', '#ffe0a0', '#ffffff'], grass: '#4a8a4a', rock: '#7a8078', dirt: '#6a6a4a' },
  ];
  function makeBiome(th) {
    const f = th.floor, w = th.wall, L = th.liq, D = th.dirt || shade(f, -0.16);
    return {
      name: th.name, liquid: th.liquid, prop: th.prop,
      floor: [f, shade(f, 0.05), shade(f, -0.06)], dirt: [D, shade(D, 0.05), shade(D, -0.06)],
      speck: shade(f, -0.25), light: shade(f, 0.22), flowers: th.flowers,
      wallTop: [w, shade(w, 0.07), shade(w, -0.07)], wallLight: shade(w, 0.32), wallEdge: shade(w, -0.7),
      wallFace: [shade(w, -0.3), shade(w, -0.38)], wallFaceDark: shade(w, -0.55),
      liq: L, liqDeep: shade(L, -0.22), foam: th.foam || shade(L, 0.55), shore: shade(f, -0.32),
      leaf: [shade(th.leaf, -0.35), shade(th.leaf, -0.15), th.leaf, shade(th.leaf, 0.3)],
      trunk: [shade(th.trunk, -0.2), th.trunk],
      rock: [shade(th.rock, -0.2), th.rock, shade(th.rock, 0.22)],
      grass: [shade(th.grass, -0.28), th.grass, shade(th.grass, 0.28)],
      raw: th,
    };
  }
  const BIOMES = THEMES.map(makeBiome);

  // ---------------- sala completa ----------------
  // at(tx, ty) -> 'floor' | 'wall' | 'liquid' | 'void' (fuera de la sala, negro)
  function paintRoom(cols, rows, at, bi, seed) {
    const B = BIOMES[bi];
    const P = Pix(cols * TS, rows * TS);
    const C = {};
    for (const k of ['floor', 'dirt', 'wallTop', 'wallFace', 'flowers', 'grass']) C[k] = B[k].map(h => pack(h));
    for (const k of ['speck', 'light', 'wallLight', 'wallEdge', 'wallFaceDark', 'liq', 'liqDeep', 'foam', 'shore']) C[k] = pack(B[k]);
    C.liqLight = mixPack(B.liq, B.foam, 0.28);
    C.void = pack('#06060c');
    const dirtAt = (gx, gy) => {
      const v = fbm(gx / 34, gy / 34, seed + 303) + (H(gx >> 1, gy >> 1, seed + 9) - 0.5) * 0.05;
      return v > 0.64;
    };
    for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const kind = at(tx, ty);
      const ox = tx * TS, oy = ty * TS;
      if (kind === 'void') { for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) P.set(ox + x, oy + y, C.void); continue; }
      if (kind === 'border') { paintBorder(P, C, ox, oy, tx, ty, cols, rows, at, seed); continue; }
      paintFloor(P, C, ox, oy, tx, ty, dirtAt, at, seed);
      if (kind === 'wall') paintWall(P, C, ox, oy, tx, ty, at, seed);
      else if (kind === 'liquid') paintLiquid(P, C, ox, oy, tx, ty, at, seed);
    }
    return P.canvas();
  }

  function paintFloor(P, C, ox, oy, tx, ty, dirtAt, at, seed) {
    let dirtCount = 0;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const gx = tx * TS + x, gy = ty * TS + y;
      const dirt = dirtAt(gx, gy);
      if (dirt) dirtCount++;
      const pal = dirt ? C.dirt : C.floor;
      const band = H(gx >> 3, gy >> 3, 11 + seed) * 0.7 + H(gx >> 1, gy >> 1, 12) * 0.5;
      let col = pal[Math.min(pal.length - 1, Math.floor(band * pal.length / 1.2))];
      const r = H(gx, gy, 13 + seed);
      if (r < 0.018) col = C.speck;
      else if (r > 0.992) col = C.light;
      if (dirt && !dirtAt(gx, gy - 1)) col = C.speck;
      else if (!dirt && dirtAt(gx, gy - 1) && r < 0.5) col = C.light;
      P.set(ox + x, oy + y, col);
    }
    const dirt = dirtCount > TS * TS / 2;
    if (at(tx, ty - 1) === 'wall' || at(tx, ty - 1) === 'border') {
      for (let x = 0; x < TS; x++) { P.set(ox + x, oy, C.wallFaceDark); if ((x + ty) % 2) P.set(ox + x, oy + 1, C.speck); }
    }
    if (at(tx - 1, ty) === 'wall' || at(tx - 1, ty) === 'border') for (let y = 0; y < TS; y++) { P.set(ox, oy + y, C.speck); if ((y + tx) % 2) P.set(ox + 1, oy + y, C.speck); }
    if (at(tx + 1, ty) === 'border') for (let y = 0; y < TS; y++) if ((y + tx) % 2) P.set(ox + TS - 1, oy + y, C.speck);
    const d = H(tx, ty, 14 + seed);
    const dx = ox + 3 + Math.floor(H(tx, ty, 15 + seed) * 10), dy = oy + 4 + Math.floor(H(tx, ty, 16 + seed) * 9);
    if (dirt) {
      if (d < 0.22) { P.set(dx, dy, C.light); P.set(dx + 1, dy, C.light); P.set(dx, dy + 1, C.speck); P.set(dx + 1, dy + 1, C.speck); }
      return;
    }
    if (d < 0.18) {
      P.set(dx, dy, C.light); P.set(dx - 1, dy - 1, C.light); P.set(dx + 1, dy - 1, C.light);
      P.set(dx, dy - 2, C.light); P.set(dx, dy + 1, C.speck);
    } else if (d < 0.26) {
      const fc = C.flowers[Math.floor(H(tx, ty, 17 + seed) * C.flowers.length)];
      P.set(dx, dy - 1, fc); P.set(dx - 1, dy, fc); P.set(dx + 1, dy, fc); P.set(dx, dy + 1, fc);
      P.set(dx, dy, C.light);
    } else if (d < 0.32) {
      P.set(dx, dy, C.light); P.set(dx + 1, dy, C.light); P.set(dx, dy + 1, C.speck); P.set(dx + 1, dy + 1, C.speck);
    }
  }

  // Muro exterior de la sala: sillares de piedra con relieve y cara frontal con altura
  function paintBorder(P, C, ox, oy, tx, ty, cols, rows, at, seed) {
    const inner = k => k === 'floor' || k === 'liquid' || k === 'wall';
    const faceBelow = inner(at(tx, ty + 1));             // el muro de arriba enseña su cara
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const gx = tx * TS + x, gy = ty * TS + y;
      let col;
      if (faceBelow && y >= TS - 10) {
        // cara frontal: piedras verticales, más oscuras abajo
        const fy = y - (TS - 10);
        const bw = 8, off = (Math.floor(fy / 5) % 2) * 4;
        const bx = (gx + off) % bw;
        col = fy < 5 ? C.wallFace[0] : C.wallFace[1];
        if (bx === 0 || fy === 5) col = C.wallFaceDark;
        else if (bx === 1 && fy < 9) col = C.wallLight;
        if (fy === 0) col = C.wallEdge;
        if (fy === 9) col = C.wallFaceDark;
        if (H(gx, gy, 41 + seed) < 0.05) col = C.wallFaceDark;
      } else {
        // sillares vistos desde arriba
        const rowH = 6, row = Math.floor(gy / rowH), off = (row % 2) * 5;
        const bw = 10, bx = (gx + off) % bw, by = gy % rowH;
        const shadeIdx = Math.floor(H(Math.floor((gx + off) / bw), row, 43 + seed) * 3);
        col = C.wallTop[shadeIdx];
        if (by === 0) col = C.wallLight;
        else if (by === rowH - 1 || bx === bw - 1) col = C.wallEdge;
        else if (bx === 0) col = C.wallLight;
        else if (H(gx >> 1, gy >> 1, 44 + seed) < 0.06) col = C.wallFace[0];
      }
      // sombra junto al interior (lados y abajo)
      if (!faceBelow) {
        if (inner(at(tx + 1, ty)) && x >= TS - 2) col = C.wallEdge;
        if (inner(at(tx - 1, ty)) && x <= 1) col = C.wallEdge;
        if (inner(at(tx, ty - 1)) && y <= 1) col = C.wallLight;
      }
      P.set(ox + x, oy + y, col);
    }
  }

  function paintWall(P, C, ox, oy, tx, ty, at, seed) {
    const W = (x, y) => { const k = at(x, y); return k === 'wall' || k === 'void' || k === 'border'; };
    const n = W(tx, ty - 1), s = W(tx, ty + 1), w = W(tx - 1, ty), e = W(tx + 1, ty);
    const FACE = s ? 0 : 6;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      if (!n && !w && x + y < 3) continue;
      if (!n && !e && (TS - 1 - x) + y < 3) continue;
      if (!s && !w && x + (TS - 1 - y) < 2) continue;
      if (!s && !e && (TS - 1 - x) + (TS - 1 - y) < 2) continue;
      const gx = tx * TS + x, gy = ty * TS + y;
      let col;
      if (y >= TS - FACE) {
        const fy = y - (TS - FACE);
        col = C.wallFace[(x + (H(gx, 0, 21 + seed) < 0.5 ? 0 : 1)) % 3 === 0 ? 1 : 0];
        if (fy === 0) col = C.wallEdge;
        else if (y === TS - 1) col = C.wallFaceDark;
        else if (H(gx, gy, 22 + seed) < 0.08) col = C.wallFaceDark;
      } else {
        col = C.wallTop[Math.floor(H(gx >> 2, gy >> 2, 23 + seed) * 2.2 + H(gx >> 1, gy >> 1, 24) * 0.8) % C.wallTop.length];
        if (H(gx, gy, 25 + seed) < 0.05) col = C.wallLight;
        if (!n && y === 0) col = C.wallEdge;
        else if (!n && y === 1) col = C.wallLight;
        if (!w && x === 0) col = C.wallEdge;
        if (!e && x === TS - 1) col = C.wallEdge;
      }
      P.set(ox + x, oy + y, col);
    }
  }

  function paintLiquid(P, C, ox, oy, tx, ty, at, seed) {
    const L = (x, y) => at(x, y) === 'liquid';
    const n = L(tx, ty - 1), s = L(tx, ty + 1), w = L(tx - 1, ty), e = L(tx + 1, ty);
    const nw = L(tx - 1, ty - 1), ne = L(tx + 1, ty - 1), sw = L(tx - 1, ty + 1), se = L(tx + 1, ty + 1);
    const BIG = 99;
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      if (!n && !w && x + y < 3) continue;
      if (!n && !e && (TS - 1 - x) + y < 3) continue;
      if (!s && !w && x + (TS - 1 - y) < 3) continue;
      if (!s && !e && (TS - 1 - x) + (TS - 1 - y) < 3) continue;
      let d = Math.min(n ? BIG : y, s ? BIG : TS - 1 - y, w ? BIG : x, e ? BIG : TS - 1 - x);
      if (n && w && !nw) d = Math.min(d, Math.hypot(x, y) - 0.5);
      if (n && e && !ne) d = Math.min(d, Math.hypot(TS - 1 - x, y) - 0.5);
      if (s && w && !sw) d = Math.min(d, Math.hypot(x, TS - 1 - y) - 0.5);
      if (s && e && !se) d = Math.min(d, Math.hypot(TS - 1 - x, TS - 1 - y) - 0.5);
      const gx = tx * TS + x, gy = ty * TS + y;
      const r = H(gx, gy, 31 + seed);
      let col;
      if (d < 1) col = C.shore;
      else if (d < 2) col = C.foam;
      else if (d < 4) col = C.liqLight;
      else if (d < 6) col = r < 0.5 ? C.liq : C.liqLight;
      else col = d < 8 && r < 0.5 ? C.liq : C.liqDeep;
      if (d >= 6 && d < BIG && r < 0.08) col = C.liq;
      if (d >= 3 && H(gx >> 2, gy, 33 + seed) < 0.045 && (gx & 3) !== 3) col = C.liqLight;
      if (d >= 3 && H(gx, gy, 34 + seed) < 0.004) col = C.foam;
      P.set(ox + x, oy + y, col);
    }
  }

  // Brillos animados encima del líquido (se pintan cada fotograma, muy baratos)
  function liquidSparkles(ctx, cells, bi, t) {
    const B = BIOMES[bi];
    ctx.fillStyle = B.foam;
    for (const [tx, ty] of cells) {
      for (let i = 0; i < 2; i++) {
        const ph = H(tx, ty, 77 + i) * 6.28;
        const k = Math.sin(t * 2.2 + ph);
        if (k < 0.75) continue;
        const x = tx * TS + 3 + Math.floor(H(tx, ty, 78 + i) * 10), y = ty * TS + 4 + Math.floor(H(tx, ty, 79 + i) * 8);
        ctx.globalAlpha = (k - 0.75) * 4 * 0.8;
        ctx.fillRect(x, y, 3, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------------- objetos del escenario ----------------
  const propCache = new Map();
  function propSprite(bi, type, variant = 0) {
    const k = bi + '/' + type + '/' + variant;
    let cv = propCache.get(k);
    if (!cv) { cv = PAINT[type](BIOMES[bi], variant); propCache.set(k, cv); }
    return cv;
  }
  function disc(P, cx, cy, r, colFn) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) { const c = colFn(x, y, d / r); if (c != null) P.set(x, y, c); }
      }
  }
  function outline(P, col) {
    const marks = [];
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
      if (P.get(x, y) >>> 24) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
        const xx = x + a, yy = y + b;
        return xx >= 0 && yy >= 0 && xx < P.w && yy < P.h && (P.get(xx, yy) >>> 24);
      });
      if (near) marks.push([x, y]);
    }
    for (const [x, y] of marks) P.set(x, y, col);
  }

  const PAINT = {
    tree(B) {
      if (B.prop === 'crystal') return PAINT.crystal(B);
      if (B.prop === 'tomb') return PAINT.deadtree(B);
      if (B.prop === 'pylon') return PAINT.pylon(B);
      const P = Pix(30, 40);
      const L = B.leaf.map(h => pack(h)), Tr = B.trunk.map(h => pack(h));
      for (let y = 26; y < 38; y++) for (let x = 13; x < 18; x++) P.set(x, y, Tr[x === 13 || x === 17 ? 0 : 1]);
      P.set(12, 37, Tr[0]); P.set(18, 37, Tr[0]); P.set(11, 38, Tr[0]); P.set(19, 38, Tr[0]);
      const blobs = [[15, 20, 10], [9, 16, 7], [21, 16, 7], [15, 10, 8], [10, 23, 6], [20, 23, 6]];
      for (const [bx, by, br] of blobs) {
        disc(P, bx, by, br, (x, y) => {
          const lit = ((x - bx) * -0.6 + (y - by) * -0.8) / br;
          const idx = lit > 0.45 ? 3 : lit > 0.05 ? 2 : lit > -0.45 ? 1 : 0;
          return (H(x, y, 41) < 0.12 && idx > 0) ? L[idx - 1] : L[idx];
        });
      }
      // algunas bayas
      [[8, 14], [21, 19], [14, 8]].forEach(([x, y]) => { P.set(x, y, pack('#e04050')); P.set(x + 1, y, pack('#ff8090')); });
      outline(P, pack('#14200f'));
      return P.canvas();
    },
    crystal(B) {
      const P = Pix(26, 40);
      const L = B.leaf.map(h => pack(h)), D = B.trunk.map(h => pack(h));
      const spires = [[13, 2, 5, 38], [7, 14, 4, 38], [19, 12, 4, 38]];
      for (const [cx, top, half, bot] of spires) {
        for (let y = top; y <= bot; y++) {
          const t = Math.min(1, (y - top) / 8);
          const hw = Math.round(half * t);
          for (let x = cx - hw; x <= cx + hw; x++) {
            const side = x < cx ? (x === cx - hw ? 3 : 2) : x === cx ? 1 : 0;
            P.set(x, y, side >= 2 ? L[side] : y > bot - 4 ? D[1] : L[side]);
          }
        }
      }
      outline(P, D[0]);
      return P.canvas();
    },
    deadtree(B) {
      const P = Pix(28, 40);
      const Tr = B.trunk.map(h => pack(h)), L = B.leaf.map(h => pack(h));
      for (let y = 12; y < 38; y++) for (let x = 12; x < 16; x++) P.set(x, y, Tr[x < 14 ? 0 : 1]);
      const branch = (x0, y0, dx, len) => { for (let i = 0; i < len; i++) { P.set(x0 + dx * i, y0 - i, L[1]); P.set(x0 + dx * i, y0 - i + 1, L[0]); } };
      branch(12, 20, -1, 9); branch(15, 17, 1, 10); branch(13, 13, -1, 7); branch(14, 12, 1, 6);
      outline(P, pack('#0f0b09'));
      return P.canvas();
    },
    // torre de alta tensión pequeña (Central Energía)
    pylon(B) {
      const P = Pix(22, 40);
      const M = B.rock.map(h => pack(h)), Y = pack('#ffd23f'), Yd = pack('#c08a10');
      for (let y = 6; y < 38; y++) { const hw = Math.round(2 + (y - 6) / 32 * 6); P.set(11 - hw, y, M[0]); P.set(11 + hw, y, M[1]); if (y % 6 === 0) for (let x = 11 - hw; x <= 11 + hw; x++) P.set(x, y, M[2]); if (y % 6 === 3) { P.set(11 - hw + 1, y, M[1]); P.set(11 + hw - 1, y, M[0]); } }
      for (let x = 3; x <= 19; x++) P.set(x, 9, M[2]);
      for (let y = 2; y <= 8; y++) { P.set(11, y, M[1]); }
      disc(P, 11, 3, 2.2, () => Y); P.set(10, 2, pack('#ffffff'));
      [[3, 10], [19, 10]].forEach(([x, y]) => { P.set(x, y, Y); P.set(x, y + 1, Yd); });
      outline(P, pack('#14161c'));
      return P.canvas();
    },
    rock(B, variant) {
      const P = Pix(22, 17);
      const R = B.rock.map(h => pack(h));
      for (let y = 2; y <= 15; y++) for (let x = 1; x <= 20; x++) {
        const nx = (x - 10.5) / 9.5, ny = (y - 9.5) / 7;
        const d = nx * nx + ny * ny + (H(x, y, 61) - 0.5) * 0.08;
        if (d > 1) continue;
        const lit = -nx * 0.55 - ny * 0.85 + (H(x, y, 62) - 0.5) * 0.25;
        let c = R[lit > 0.4 ? 2 : lit > -0.15 ? 1 : 0];
        if (y >= 14) c = R[0];
        P.set(x, y, c);
      }
      [[6, 5], [7, 5], [6, 6], [8, 4]].forEach(([x, y]) => P.set(x, y, pack('#ffffff')));
      [[13, 8], [14, 9], [9, 11], [16, 11], [11, 7]].forEach(([x, y]) => P.set(x, y, R[0]));
      if (variant === 1) {
        const dark = pack('#1b1d22');
        [[9, 4], [10, 5], [10, 6], [11, 7], [10, 8], [12, 8], [13, 9], [8, 9], [7, 10]].forEach(([x, y]) => P.set(x, y, dark));
      }
      outline(P, pack('#17191d'));
      return P.canvas();
    },
    grass(B, variant) {
      const P = Pix(20, 17);
      const Gc = B.grass.map(h => pack(h));
      const dark = pack(B.speck);
      const sway = variant === 1 ? 1.2 : 0;
      const blades = 11;
      for (let pass = 0; pass < 2; pass++) {
        for (let b = pass; b < blades; b += 2) {
          const t = b / (blades - 1);
          const x0 = 3 + t * 13 + (H(b, 7, 52) - 0.5) * 2;
          const hgt = 8 + Math.floor(H(b, 3, 51) * 6) + (Math.abs(t - 0.5) < 0.25 ? 3 : 0);
          const lean = (t - 0.5) * 7 + sway * (0.6 + H(b, 1, 53));
          for (let i = 0; i <= hgt; i++) {
            const k = i / hgt;
            const x = Math.round(x0 + lean * k * k);
            const y = 16 - i;
            let c = k > 0.78 ? Gc[2] : k > 0.25 ? Gc[1] : Gc[0];
            if (pass === 0 && k <= 0.78) c = Gc[0];
            P.set(x, y, c);
            if (i < hgt * 0.45) P.set(x + 1, y, k < 0.15 ? dark : Gc[0]);
          }
        }
      }
      outline(P, pack('#0e1d0c'));
      return P.canvas();
    },
    tomb(B, variant) {
      const P = Pix(16, 20);
      const R = B.rock.map(h => pack(h));
      for (let y = 3; y < 19; y++) for (let x = 2; x < 14; x++) {
        if (y < 6 && ((x - 7.5) ** 2) / 36 + ((y - 6) ** 2) / 9 > 1) continue;
        P.set(x, y, x === 2 ? R[2] : x >= 12 ? R[0] : y >= 17 ? R[0] : R[1]);
      }
      const cross = pack(shade(B.raw.rock, -0.45));
      for (let y = 7; y < 14; y++) P.set(7, y, cross), P.set(8, y, cross);
      for (let x = 5; x < 11; x++) P.set(x, 9, cross);
      if (variant) [[4, 12], [5, 13], [11, 6], [10, 7]].forEach(([x, y]) => P.set(x, y, R[0]));
      outline(P, pack('#0e0a14'));
      return P.canvas();
    },
    // altar con el objeto del tesoro (orbe dorado)
    altar(B, variant) {
      const P = Pix(18, 27);
      const R = B.rock.map(h => pack(h));
      const O = (variant ? ['#6b7380', '#4a505c', '#9aa2ae'] : ['#ffd23f', '#c08a10', '#fff3b0']).map(h => pack(h));
      for (let y = 21; y <= 25; y++) for (let x = 1; x <= 16; x++) P.set(x, y, R[y === 21 ? 2 : y >= 24 ? 0 : 1]);
      for (let y = 12; y <= 20; y++) for (let x = 5; x <= 12; x++) P.set(x, y, R[x === 5 ? 2 : x >= 11 ? 0 : 1]);
      for (let y = 10; y <= 11; y++) for (let x = 3; x <= 14; x++) P.set(x, y, R[y === 10 ? 2 : 1]);
      [[7, 14], [8, 15], [10, 14], [9, 17], [7, 18], [10, 18]].forEach(([x, y]) => P.set(x, y, O[1]));
      outline(P, pack('#120e1a'));
      return P.canvas();
    },
    pedestal(B) {
      const P = Pix(18, 14);
      const R = B.rock.map(h => pack(h));
      for (let y = 4; y <= 12; y++) for (let x = 2; x <= 15; x++) P.set(x, y, R[y === 4 ? 2 : y >= 11 ? 0 : x === 2 ? 2 : x === 15 ? 0 : 1]);
      for (let x = 4; x <= 13; x++) P.set(x, 7, pack(shade(B.raw.rock, -0.35)));
      outline(P, pack('#120e1a'));
      return P.canvas();
    },
    spring(B, variant) {
      const P = Pix(34, 16);
      const R = B.rock.map(h => pack(h));
      const W = (variant ? ['#2f5f68', '#3a6f7a', '#4f8a92'] : ['#e05aa8', '#ff9ed8', '#ffe0f4']).map(h => pack(h));
      for (let y = 0; y < 16; y++) for (let x = 0; x < 34; x++) {
        const nx = (x - 16.5) / 16.5, ny = (y - 8) / 7.5;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        if (d > 0.62) { P.set(x, y, R[(H(x, y, 71) < 0.5 ? 1 : 0) + (ny < -0.2 ? 1 : 0)]); continue; }
        const wave = Math.sin(x * 0.7 + y * 1.3) > 0.6;
        P.set(x, y, d < 0.18 ? W[2] : wave ? W[2] : d < 0.4 ? W[1] : W[0]);
      }
      if (!variant) [[10, 6], [11, 5], [22, 9], [23, 8], [16, 11]].forEach(([x, y]) => P.set(x, y, pack('#ffffff')));
      outline(P, pack('#14161c'));
      return P.canvas();
    },
    chest(B, variant) {
      const P = Pix(16, 14);
      const gold = pack('#f2c443'), goldD = pack('#b5832a'), wood = pack('#8a4f2a'), woodD = pack('#5e3418');
      const lid = pack('#c4662e');
      for (let y = 2; y < 13; y++) for (let x = 1; x < 15; x++) {
        if (variant && y < 6) continue;
        let c = y < 6 ? lid : wood;
        if (y === 6) c = goldD;
        if (x === 1 || x === 14) c = woodD;
        if ((x === 4 || x === 11) && y > 1) c = y < 6 ? gold : goldD;
        if (y === 12) c = woodD;
        P.set(x, y, c);
      }
      if (variant) { for (let x = 2; x < 14; x++) { P.set(x, 6, pack('#2a160a')); P.set(x, 5, lid); } }
      else for (let x = 6; x < 10; x++) for (let y = 5; y < 9; y++) P.set(x, y, (x + y) % 3 ? gold : goldD);
      outline(P, pack('#2a160a'));
      return P.canvas();
    },
    trap(B, variant) {
      const P = Pix(14, 14);
      const COL = [['#b45ec4', '#e6a3f0'], ['#8bd94a', '#d2ff9a'], ['#ff7b3d', '#ffd08a']][variant];
      const c = pack(COL[0]), l = pack(COL[1]);
      const base = pack('#2a2238'), baseL = pack('#3b3150');
      for (let y = 1; y < 13; y++) for (let x = 1; x < 13; x++) {
        const edge = x === 1 || y === 1 || x === 12 || y === 12;
        P.set(x, y, edge ? c : (x + y) % 2 ? base : baseL);
      }
      const sym = [
        [[5, 4], [6, 4], [7, 4], [8, 4], [4, 5], [9, 5], [4, 6], [6, 6], [7, 6], [9, 6], [5, 7], [8, 7], [5, 8], [6, 8], [7, 8], [8, 8], [5, 9], [8, 9]],
        [[4, 4], [4, 5], [3, 6], [5, 6], [4, 7], [8, 5], [8, 6], [7, 7], [9, 7], [8, 8], [6, 9], [5, 10], [7, 10], [6, 11]],
        [[6, 3], [7, 3], [5, 4], [8, 4], [4, 5], [9, 5], [4, 6], [6, 6], [7, 6], [9, 6], [4, 7], [6, 7], [7, 7], [9, 7], [4, 8], [9, 8], [5, 9], [8, 9], [6, 10], [7, 10]],
      ][variant];
      for (const [x, y] of sym) P.set(x, y, l);
      outline(P, pack('#0c0812'));
      return P.canvas();
    },
    // escalera de bajada (agujero con peldaños)
    stairs(B) {
      const P = Pix(28, 24);
      const R = B.rock.map(h => pack(h)), dark = pack('#08060c');
      for (let y = 1; y < 23; y++) for (let x = 1; x < 27; x++) {
        const nx = (x - 13.5) / 12.5, ny = (y - 11.5) / 10.5;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        P.set(x, y, d > 0.72 ? R[ny < 0 ? 2 : 0] : dark);
      }
      for (let i = 0; i < 4; i++) for (let x = 8 + i * 2; x < 20 - i * 2; x++) { P.set(x, 7 + i * 3, R[1]); P.set(x, 8 + i * 3, R[0]); }
      outline(P, pack('#0c0812'));
      return P.canvas();
    },
  };

  // ---------------- puertas ----------------
  // tipo de sala destino -> color del marco e icono
  const DOOR_STYLE = {
    fight: ['#8a7a6a', null], start: ['#8a7a6a', null], boss: ['#c03030', 'skull'], treasure: ['#e0b030', 'star'],
    shop: ['#3a9ae0', 'coin'], heal: ['#ff70b8', 'heart'],
  };
  const doorCache = new Map();
  // dir: n s e w · open: puerta abierta o cerrada (rejas)
  function doorSprite(bi, dir, type, open) {
    const k = bi + dir + type + open;
    if (doorCache.has(k)) return doorCache.get(k);
    const B = BIOMES[bi];
    const vertical = dir === 'n' || dir === 's';
    const w = vertical ? 30 : 18, h = vertical ? 30 : 30;
    const P = Pix(w, h);
    const [frameHex, icon] = DOOR_STYLE[type] || DOOR_STYLE.fight;
    const F = [pack(shade(frameHex, -0.45)), pack(shade(frameHex, -0.15)), pack(frameHex), pack(shade(frameHex, 0.35))];
    const dark = pack('#05040a'), dark2 = pack('#100c18');
    const bar = pack('#7a6a58'), barL = pack('#b0a088');
    if (vertical) {
      // arco: columnas laterales + dintel, hueco oscuro
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const inArch = x >= 7 && x <= 22 && (y >= 8 || Math.hypot(x - 14.5, y - 8) <= 7.6);
        const frame = x >= 3 && x <= 26 && (y >= 6 || Math.hypot(x - 14.5, y - 8) <= 11.5);
        if (inArch) P.set(x, y, y > h - 6 ? dark2 : dark);
        else if (frame) {
          const edge = x === 3 || x === 26 || (y < 8 && Math.hypot(x - 14.5, y - 8) > 10.5);
          P.set(x, y, edge ? F[0] : (x < 7 ? (x === 4 ? F[3] : F[2]) : F[1]));
          if (y % 6 === 0 && !edge) P.set(x, y, F[0]);
        }
      }
      if (!open) for (let x = 9; x <= 21; x += 3) for (let y = 1; y < h; y++) if (x >= 7 && (y >= 8 || Math.hypot(x - 14.5, y - 8) <= 7.6)) { P.set(x, y, bar); P.set(x + 1, y, barL); }
    } else {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const inArch = y >= 5 && y <= 26 && x >= 3 && x <= 14;
        const frame = y >= 1 && y <= 29 && x >= 0 && x <= 17;
        if (inArch) P.set(x, y, dark);
        else if (frame) P.set(x, y, (y === 1 || y === 29 || x === 0 || x === 17) ? F[0] : y < 5 ? F[3] : F[1]);
      }
      if (!open) for (let y = 7; y <= 25; y += 3) for (let x = 3; x <= 14; x++) { P.set(x, y, bar); P.set(x, y + 1, barL); }
    }
    // icono sobre el marco
    const ic = { skull: [[0, 0], [1, 0], [2, 0], [-1, 1], [3, 1], [-1, 2], [0, 2], [2, 2], [3, 2], [0, 3], [1, 3], [2, 3], [0, 4], [2, 4]],
      star: [[1, 0], [1, 1], [0, 2], [1, 2], [2, 2], [-1, 2], [3, 2], [0, 3], [2, 3], [-1, 4], [3, 4]],
      coin: [[0, 0], [1, 0], [2, 0], [-1, 1], [3, 1], [-1, 2], [1, 2], [3, 2], [-1, 3], [3, 3], [0, 4], [1, 4], [2, 4]],
      heart: [[0, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [1, 3]] }[icon];
    if (ic) {
      const ix = vertical ? 13 : 7, iy = vertical ? 1 : 0;
      const icCol = pack(icon === 'skull' ? '#ffffff' : icon === 'heart' ? '#ffd0e8' : '#fff3b0');
      for (const [x, y] of ic) P.set(ix + x, iy + y, icCol);
    }
    const cv = P.canvas();
    doorCache.set(k, cv);
    return cv;
  }

  function clearCaches() { propCache.clear(); doorCache.clear(); }

  return { TS, BIOMES, THEMES, hash, fbm, shade, paintRoom, liquidSparkles, propSprite, doorSprite, clearCaches };
})();
