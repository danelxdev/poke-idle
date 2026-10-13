// Generador de sprites pixel-art procedurales (sin imágenes externas).
// Cada personaje se describe con un "look" (peinado, colores, cuerpo, accesorios)
// y aquí se compone un mapa de píxeles 20x26 con contorno y sombreado automáticos.
'use strict';

const PX = (() => {
  const W = 20, H = 27, OX = 2, OY = 4; // OY deja sitio para peinados altos
  const OUTLINE = '#140c1c';

  // Peinados. y0 = fila de la cara donde empieza la plantilla (negativo = por encima).
  // h = pelo, x = color extra (cúpula, turbante...), s = piel.
  const HAIR = {
    bald: { y0: 0, rows: [] },
    goku: { y0: -1, rows: [
      '...h...hh.h.....',
      '..hh..hhhhhh.h..',
      '.hhhh.hhhhhhhh..',
      'hhhhhhhhhhhhhhh.',
      'hhhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhh.',
      'hhhhhhhhh.hh.h..',
      '.hhhhhh.........',
      '..hhhh..........',
      '...hh...........',
    ] },
    vegeta: { y0: -3, rows: [
      '......hh........',
      '.....hhhh.......',
      '.....hhhhh......',
      '....hhhhhhh.....',
      '...hhhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hhhhhhhhhhh..',
      '...hhhhhhhhhhh..',
      '...hhhhhh.h.....',
      '...hhhh.........',
      '....hh..........',
    ] },
    ssj: { y0: -3, rows: [
      '...h...hh..h....',
      '..hh..hhh.hh....',
      '.hhh.hhhhhhh.h..',
      '.hhhhhhhhhhhhh..',
      'hhhhhhhhhhhhhhh.',
      'hhhhhhhhhhhhhhh.',
      '.hhhhhhhhhhhhhh.',
      '..hhhhhhhhhhhh..',
      '..hhhhhhh.hh.h..',
      '..hhhhh.........',
      '...hhh..........',
    ] },
    ssj3: { y0: -2, rows: [
      '......hhh.......',
      '....hhhhhh......',
      '..hhhhhhhhhh....',
      '.hhhhhhhhhhhh...',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhhhhhh...',
      'hhhhhhhh........',
      'hhhhhh..........',
      'hhhhh...........',
      'hhhh............',
      'hhhh............',
      'hhh.............',
      'hhh.............',
      'hhh.............',
      'hh..............',
      'hh..............',
      'hh..............',
      '.h..............',
      '.h..............',
    ] },
    long: { y0: -1, rows: [
      '...h.hh.........',
      '..hhhhhhh.h.....',
      '.hhhhhhhhhhh....',
      'hhhhhhhhhhhhh...',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhh.hh....',
      'hhhhhh..........',
      'hhhhh...........',
      'hhhhh...........',
      'hhhh............',
      'hhhh............',
      'hhhh............',
      'hhh.............',
      'hhh.............',
      'hhh.............',
      'hh..............',
      'hh..............',
      'h...............',
    ] },
    bowl: { y0: 1, rows: [
      '......hhhh......',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hhhhhhhhhhh..',
      '...hhhhhhh.hh...',
      '...hhhh.........',
      '...hhh..........',
      '....hh..........',
    ] },
    straight: { y0: 1, rows: [
      '......hhhh......',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hhhhhhhhhhh..',
      '...hhhhhhhh.hh..',
      '...hhhhh........',
      '...hhhh.........',
      '...hhhh.........',
      '...hhh..........',
      '...hhh..........',
      '....h...........',
    ] },
    bob: { y0: 1, rows: [
      '......hhhh......',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..',
      '..hhhhhhh.hhh...',
      '..hhhhh.........',
      '..hhhh..........',
      '..hhhh..........',
      '..hhhh..........',
    ] },
    twin: { y0: 1, rows: [
      '......hhhh......',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..',
      '.hhhhhhhhh.hh...',
      'hhhhhhh.........',
      'hh.hhh..........',
      'h...............',
    ] },
    mohawk: { y0: -2, rows: [
      '.......hh.......',
      '......hhhh......',
      '......hhhhh.....',
      '.....hhhhhh.....',
      '.....hhhhh......',
      '......hh........',
    ] },
    afro: { y0: 0, rows: [
      '.....hhhhh......',
      '...hhhhhhhhh....',
      '..hhhhhhhhhhh...',
      '..hhhhhhhhhhh...',
      '..hhhhhhh.hh....',
      '..hhhhh.........',
      '...hhh..........',
    ] },
    turban: { y0: -1, rows: [
      '......xxxx......',
      '.....xxxxxxx....',
      '....xxxxxxxxx...',
      '....xxxxxxxxxx..',
      '....xxxxxxxxxx..',
      '....hhhhhhhhhh..',
    ] },
    namek: { y0: -2, rows: [
      '.........h.h....',
      '..........h.h...',
      '..........h.h...',
      '...........hh...',
    ] },
    horns: { y0: -2, rows: [
      '...h.......h....',
      '..hh......hh....',
      '..hh.....hh.....',
      '...hhxxxxhh.....',
      '....xxxxxxxx....',
      '....xxxxxxxxx...',
    ] },
    dome: { y0: 1, rows: [
      '......xxxx......',
      '.....xxxxxxx....',
      '....xxxxxxxxx...',
      '....xxxxxx......',
    ] },
    crown: { y0: -2, rows: [
      '...hh....h......',
      '...hhh..hh......',
      '....hhxxhh......',
      '....hxxxxxx.....',
      '....xxxxxxxx....',
      '....xxxxxxxxx...',
    ] },
    antenna: { y0: -3, rows: [
      '........hh......',
      '.......hh.......',
      '......hhh.......',
      '......hh........',
      '.......h........',
    ] },
    cat: { y0: -2, rows: [
      '....h.....h.....',
      '....hh...hh.....',
      '....hhhhhhh.....',
    ] },
    tall: { y0: -4, rows: [
      '.......hhh......',
      '......hhhhh.....',
      '......hhhhh.....',
      '.....hhhhhhh....',
      '.....hhhhhhh....',
      '.....hhhhhhh....',
      '....hhhhhhhhh...',
      '....hhhhh.......',
    ] },
    beast: { y0: -4, rows: [
      '..h..hhh..h.....',
      '.hh.hhhhhhh.....',
      '.hhhhhhhhhhh....',
      'hhhhhhhhhhhhh...',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhh.hh....',
      'hhhhhh..........',
      'hhhhh...........',
      'hhhh............',
      'hhh.............',
      'hh..............',
    ] },
  };

  // Cara base (filas 0..10). Ojos y boca se pintan después.
  const FACE = [
    '................',
    '................',
    '................',
    '......ssssss....',
    '.....ssssssss...',
    '.....sssssssss..',
    '.....sssssssss..',
    '.....ssssssssss.',
    '.....sssssssss..',
    '......ssssssss..',
    '.......sssss....',
  ];

  // Cuerpos (filas 11..21). t = parte de arriba, b = abajo, l = cinturón, k = botas, s = piel, x = armadura
  const BODY = {
    gi: [
      '.......sss......',
      '.....tttttt.....',
      '....tttttttss...',
      '...stttttttsss..',
      '...sstttttt.ss..',
      '....llllllll....',
      '....bbbbbbbb....',
    ],
    armor: [
      '.......ttt......',
      '...xxxxxxxxxx...',
      '...xxxxxxxxxtt..',
      '...ttxxxxxxxtts.',
      '...ss.xxxxxx.ss.',
      '....xxxxxxxx....',
      '....bbbbbbbb....',
    ],
    robe: [
      '.......sss......',
      '.....tttttt.....',
      '....tttttttss...',
      '...stttttttsss..',
      '...stttttttt.ss.',
      '....llllllll....',
      '...tttttttttt...',
    ],
  };
  const LEGS = {
    gi: [[
      '....bbbb.bbbb...',
      '....bbb...bbb...',
      '....kkk...kkk...',
      '...kkkk..kkkk...',
    ], [
      '....bbbbbbbb....',
      '...bbb....bbb...',
      '...kkk....kkk...',
      '..kkkk...kkkk...',
    ]],
    robe: [[
      '...tttttttttt...',
      '...tttttttttt...',
      '...tttttttttt...',
      '...kkk....kkk...',
    ], [
      '...tttttttttt...',
      '...tttttttttt...',
      '...tttttttttt...',
      '....kkk..kkk....',
    ]],
  };
  const CAPE = [
    '....cc..........',
    '...ccc..........',
    '..cccc..........',
    '..cccc..........',
    '.ccccc..........',
    '.ccccc..........',
    '.ccccc..........',
    '.cccc...........',
    '.cccc...........',
    '..cc............',
  ];
  const TAIL = [
    '.a..............',
    'a...............',
    'a...............',
    '.aaa............',
  ];
  const WINGS = [
    '..ww............',
    '.www............',
    'wwww............',
    'wwww............',
    '.www............',
    '..ww............',
  ];

  // ---- utilidades de color ----
  function hexToRgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function shade(hex, f) {
    const [r, g, b] = hexToRgb(hex);
    if (f < 0) return rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f));
    return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const hue = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
  }
  function hueShift(hex, deg) {
    const [h, s, l] = rgbToHsl(...hexToRgb(hex));
    const [r, g, b] = hslToRgb((h + deg / 360 + 1) % 1, Math.min(1, s * 1.1 + 0.05), l);
    return rgbToHex(r, g, b);
  }

  // Aplica una forma (transformación) y la variante shiny sobre el look base
  function resolveLook(look, form, shiny) {
    const L = Object.assign({ h: 'bald', hc: '#1c1c24', sk: '#f5c08f', t: '#f7841b', body: 'gi', ex: '' }, look);
    if (L.body === 'armor') {
      if (!look.x) L.x = '#e8e0c8';
      if (!look.b) L.b = L.t;
      if (!look.k) L.k = '#f0f0f0';
    }
    if (!L.b) L.b = L.t;
    if (!L.l) L.l = '#2a56d6';
    if (!L.k) L.k = L.l;
    if (!L.x) L.x = '#f0f0f0';
    if (form) {
      for (const k of ['h', 'hc', 'sk', 't', 'b', 'x', 'l', 'k', 'tail']) if (form[k]) L[k] = form[k];
      if (form.ex) L.ex = (L.ex ? L.ex + ',' : '') + form.ex;
      if (form.eye) L.eye = form.eye;
    }
    if (shiny) {
      const d = shiny === true ? 150 : shiny;
      for (const k of ['t', 'b', 'l', 'x', 'cape']) if (L[k]) L[k] = hueShift(L[k], d);
      if (L.hc && L.h !== 'bald') L.hc = hueShift(L.hc, d * 0.6);
      if (look.alien) L.sk = hueShift(L.sk, d);
    }
    return L;
  }

  function build(look, frame) {
    const grid = Array.from({ length: H }, () => new Array(W).fill(null));
    const cols = {
      s: look.sk, h: look.hc, t: look.t, b: look.b, l: look.l, k: look.k, x: look.x,
      c: look.cape || look.t, a: look.tail || look.sk, w: look.wings || '#2a2a2a',
    };
    const put = (rows, y0, map) => {
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          const ch = row[rx];
          if (ch === '.' || ch === ' ') continue;
          const gx = rx + OX, gy = ry + y0 + OY;
          if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
          const col = (map && map[ch]) || cols[ch];
          if (col) grid[gy][gx] = col;
        }
      });
    };
    const body = BODY[look.body] || BODY.gi;
    const legs = (LEGS[look.body === 'robe' ? 'robe' : 'gi'])[frame % 2];
    if (look.cape) put(CAPE, 12, null);
    if (look.wings) put(WINGS, 11, null);
    if (look.tail) put(TAIL, 15, null);
    put(body, 11, null);
    put(legs, 18, null);
    put(FACE, 0, null);
    const hair = HAIR[look.h] || HAIR.bald;
    put(hair.rows, hair.y0, null);

    const ex = (look.ex || '').split(',').filter(Boolean);
    const P = (x, y, c) => { const gx = x + OX, gy = y + OY; if (gx >= 0 && gy >= 0 && gx < W && gy < H) grid[gy][gx] = c; };
    // cejas + ojos + boca
    const brow = look.h === 'bald' || look.h === 'namek' || look.h === 'antenna' || look.h === 'cat' || look.h === 'dome' || look.h === 'horns' || look.h === 'crown'
      ? shade(look.sk, -0.45) : shade(look.hc, -0.3);
    if (!ex.includes('nobrow')) { P(11, 5, brow); P(12, 5, brow); }
    P(11, 6, '#ffffff'); P(12, 6, look.eye || OUTLINE);
    P(12, 9, shade(look.sk, -0.4));
    for (const e of ex) {
      switch (e) {
        case 'scouter': P(13, 5, '#40ff70'); P(13, 6, '#40ff70'); P(14, 5, '#30c050'); P(9, 6, '#d0d0d0'); P(10, 6, '#d0d0d0'); break;
        case 'beard': for (let x = 8; x <= 13; x++) { P(x, 9, '#f0f0f0'); P(x, 10, '#f0f0f0'); } P(9, 11, '#f0f0f0'); P(10, 11, '#f0f0f0'); P(11, 11, '#f0f0f0'); P(10, 12, '#f0f0f0'); break;
        case 'glasses': P(10, 6, '#20202a'); P(11, 6, '#20202a'); P(12, 6, '#20202a'); P(13, 6, '#20202a'); break;
        case 'eye3': P(11, 3, '#ffffff'); P(12, 3, OUTLINE); break;
        case 'dots': P(8, 3, '#7a4a2a'); P(10, 3, '#7a4a2a'); P(9, 2, '#7a4a2a'); break;
        case 'mustache': P(10, 8, look.h === 'bald' ? '#3a2a1a' : look.hc); P(11, 8, look.h === 'bald' ? '#3a2a1a' : look.hc); P(12, 8, look.h === 'bald' ? '#3a2a1a' : look.hc); P(13, 8, look.h === 'bald' ? '#3a2a1a' : look.hc); break;
        case 'halo': for (let x = 6; x <= 11; x++) P(x, -3, '#ffe860'); P(5, -2, '#ffe860'); P(12, -2, '#ffe860'); break;
        case 'mark': P(10, 4, '#d02040'); P(11, 4, '#d02040'); P(12, 4, '#d02040'); P(10, 3, '#d02040'); P(12, 3, '#d02040'); break;
        case 'potara': P(8, 8, '#ffd040'); P(8, 9, '#ffd040'); break;
        case 'headband': for (let x = 5; x <= 13; x++) P(x, 4, '#d03030'); P(4, 5, '#d03030'); P(3, 6, '#d03030'); break;
        case 'bandana': for (let x = 5; x <= 13; x++) P(x, 3, '#e07030'); for (let x = 5; x <= 13; x++) P(x, 4, '#e07030'); break;
        case 'horns2': P(7, 1, '#f0e0c0'); P(7, 2, '#f0e0c0'); P(11, 1, '#f0e0c0'); P(11, 2, '#f0e0c0'); break;
        case 'spots': P(6, 13, '#203020'); P(9, 14, '#203020'); P(11, 13, '#203020'); P(7, 17, '#203020'); P(10, 16, '#203020'); break;
        case 'chest': P(7, 13, look.x); P(8, 13, look.x); P(9, 13, look.x); P(8, 14, look.x); P(5, 12, look.x); P(11, 12, look.x); P(8, 4, look.x); break;
        case 'cheeks': P(11, 8, '#ff90a0'); P(12, 8, '#ff90a0'); break;
        case 'scar': P(12, 4, '#a04040'); P(13, 5, '#a04040'); P(10, 8, '#a04040'); break;
        case 'visor': for (let x = 9; x <= 14; x++) P(x, 6, '#202040'); P(14, 5, '#202040'); break;
        case 'sword': P(4, 9, '#7a4a2a'); P(5, 10, '#7a4a2a'); P(3, 8, '#c0c8d8'); P(2, 7, '#c0c8d8'); break;
        case 'gold': for (let x = 6; x <= 11; x++) P(x, 11, '#ffd040'); P(13, 14, '#ffd040'); P(13, 15, '#ffd040'); break;
        case 'scarf': for (let x = 6; x <= 11; x++) P(x, 11, '#e07030'); P(5, 12, '#e07030'); P(4, 13, '#e07030'); break;
        case 'veins': P(9, 3, '#2a6a2a'); P(11, 4, '#2a6a2a'); P(8, 5, '#2a6a2a'); break;
        case 'redeye': P(12, 6, '#ff2020'); break;
        case 'tealeye': P(12, 6, '#20b0a0'); break;
        case 'fur': for (let y = 12; y <= 15; y++) { P(4, y, '#c03030'); P(12, y, '#c03030'); } break;
        default: break;
      }
    }

    // contorno automático y sombreado (luz arriba-derecha)
    const out = grid.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (grid[y][x]) continue;
      const n = (grid[y - 1] && grid[y - 1][x]) || (grid[y + 1] && grid[y + 1][x]) || grid[y][x - 1] || grid[y][x + 1];
      if (n) out[y][x] = OUTLINE;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = grid[y][x];
      if (!c || c === '#ffffff' || c === OUTLINE) continue;
      const left = grid[y][x - 1], below = grid[y + 1] && grid[y + 1][x];
      const right = grid[y][x + 1], above = grid[y - 1] && grid[y - 1][x];
      if (!left || !below) out[y][x] = shade(c, -0.28);
      else if (!right || !above) out[y][x] = shade(c, 0.18);
    }
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (out[y][x]) { g.fillStyle = out[y][x]; g.fillRect(x, y, 1, 1); }
    }
    return cv;
  }

  const cache = new Map();
  // Devuelve {c0, c1} (dos fotogramas) para un personaje/forma/shiny
  function get(look, form, shiny, key) {
    const k = key + '|' + (form ? form.n : '') + '|' + (shiny ? 1 : 0);
    let v = cache.get(k);
    if (!v) {
      const L = resolveLook(look, form, shiny);
      v = { f: [build(L, 0), build(L, 1)], sc: (form && form.sc) || look.sc || 1, look: L };
      cache.set(k, v);
    }
    return v;
  }

  // Silueta negra (para la colección de personajes que no tienes)
  const silCache = new Map();
  function silhouette(look, key) {
    if (silCache.has(key)) return silCache.get(key);
    const src = get(look, null, false, key).f[0];
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#0d0a1a';
    g.fillRect(0, 0, W, H);
    const url = cv.toDataURL();
    silCache.set(key, url);
    return url;
  }

  const urlCache = new Map();
  function dataURL(look, form, shiny, key) {
    const k = key + '|' + (form ? form.n : '') + '|' + (shiny ? 1 : 0);
    if (urlCache.has(k)) return urlCache.get(k);
    const u = get(look, form, shiny, key).f[0].toDataURL();
    urlCache.set(k, u);
    return u;
  }

  // Cápsula Hoi-Poi pixel art (para el gacha). color = parte superior
  const capCache = new Map();
  function capsule(color, open) {
    const k = color + (open ? 'o' : '');
    if (capCache.has(k)) return capCache.get(k);
    const rows = open ? [
      '....tttttt....',
      '...tttttttt...',
      '..tttttttttt..',
      '..ttTTTTTTtt..',
      '..............',
      '..............',
      '..............',
      '..oooooooooo..',
      '..wwwwwwwwww..',
      '..wwwwwwwwww..',
      '..wwwwwwwwww..',
      '..wwwwwwwwww..',
      '...wwwwwwww...',
      '....wwwwww....',
    ] : [
      '.....bbbb.....',
      '....tttttt....',
      '...tttttttt...',
      '..ttthhttttt..',
      '..tthhtttttt..',
      '..tttttttttt..',
      '..TTTTTTTTTT..',
      '..oooooooooo..',
      '..wwwwwwwwww..',
      '..wwCCwwwwww..',
      '..wwCCwwwwww..',
      '..wwwwwwwwww..',
      '...wwwwwwww...',
      '....wwwwww....',
    ];
    const map = { t: color, T: shade(color, -0.3), h: shade(color, 0.6), b: '#5a5a6a', o: '#2a2a3a', w: '#f4f4f8', C: '#2a56d6' };
    const cv = document.createElement('canvas');
    cv.width = 14; cv.height = 14;
    const g = cv.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = map[r[x]]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } } });
    // contorno
    const img = g.getImageData(0, 0, 14, 14);
    const a = (x, y) => (x < 0 || y < 0 || x > 13 || y > 13) ? 0 : img.data[(y * 14 + x) * 4 + 3];
    g.fillStyle = OUTLINE;
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
      if (a(x, y)) continue;
      if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) g.fillRect(x, y, 1, 1);
    }
    const url = cv.toDataURL();
    capCache.set(k, url);
    return url;
  }

  // Bola de dragón (n estrellas)
  const ballCache = new Map();
  function dragonBall(n, dim) {
    const k = n + (dim ? 'd' : '');
    if (ballCache.has(k)) return ballCache.get(k);
    const cv = document.createElement('canvas');
    cv.width = 12; cv.height = 12;
    const g = cv.getContext('2d');
    const rows = [
      '....oooo....',
      '..oo1111oo..',
      '.o11122111o.',
      '.o11221111o.',
      'o1111111111o',
      'o1111111111o',
      'o1111111111o',
      'o1111111113o',
      '.o11111133o.',
      '.o11111333o.',
      '..oo3333oo..',
      '....oooo....',
    ];
    const map = dim ? { o: '#2a2a3a', 1: '#4a4a5a', 2: '#7a7a8a', 3: '#3a3a4a' } : { o: '#5a2a00', 1: '#ffa020', 2: '#fff0a0', 3: '#d06a10' };
    rows.forEach((r, y) => { for (let x = 0; x < 12; x++) { const c = map[r[x]]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } } });
    g.fillStyle = dim ? '#2a2a3a' : '#d02020';
    const pos = [[5, 5], [4, 4], [6, 6], [6, 4], [4, 6], [5, 3], [5, 7]];
    const sets = { 1: [0], 2: [1, 2], 3: [0, 1, 2], 4: [1, 2, 3, 4], 5: [0, 1, 2, 3, 4], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
    for (const i of sets[n]) g.fillRect(pos[i][0], pos[i][1], 1, 1);
    const url = cv.toDataURL();
    ballCache.set(k, url);
    return url;
  }

  return { get, dataURL, silhouette, capsule, dragonBall, shade, hueShift, W, H };
})();
