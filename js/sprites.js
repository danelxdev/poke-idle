// Sprites pixel-art de los personajes.
// 1) Si existe un PNG para el personaje en assets/sprites (ver assets/sprites/manifest.js), se usa ese.
// 2) Si no, se dibuja con este generador: plantillas a mano de 32 px de ancho (cara estilo anime,
//    peinados, cuerpos y poses) que se colorean según el "look" de cada personaje.
// Fotogramas: 0 reposo · 1 reposo (respira) · 2 andar A · 3 andar B · 4 ataque
'use strict';

const PX = (() => {
  const W = 34, H = 50, OX = 1, OY = 6; // filas de plantilla -6..43
  const FOOT = 41;                       // fila de los pies en la plantilla
  const OUTLINE = '#120a1a';

  // ---------------- PEINADOS (y0 = fila de la plantilla donde empiezan) ----------------
  // h = pelo · H = brillo del pelo · x = color extra (cúpula, turbante…)
  const HAIR = {
    bald: { y0: 0, rows: [] },
    goku: { y0: 0, rows: [
      '................................',
      '...........h......h.............',
      '..........hh.....hh.....h.......',
      '....h....hhh....hhh....hh.......',
      '....hh..hhhhh..hHhh...hhh.......',
      '.....hhhhhhhhhhHHhhhhhhhh.......',
      '..hhhhhhhhhhhhHHhhhhhhhhh.......',
      '...hhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhh......',
      '.hhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      '..hhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhh.hhhhhh.hhh.....',
      '.hhhhhhhhhhhhh....hhhh...hh.....',
      '..hhhhhhhhhh......hh......h.....',
      '...hhhhhhhh.....................',
      '....hhhhhh......................',
      '.....hhhh.......................',
      '......hh........................',
    ] },
    gohan: { y0: 1, rows: [
      '.............h...h..............',
      '............hh..hh...h..........',
      '..........hhhhhhhh..hh..........',
      '........hhhhhhhhhhhhhh..........',
      '.......hhhhhhhHHhhhhhhh.........',
      '......hhhhhhhHHhhhhhhhhh........',
      '.....hhhhhhhhhhhhhhhhhhhh.......',
      '.....hhhhhhhhhhhhhhhhhhhhh......',
      '.....hhhhhhhhhhhhhhhhhhhhhh.....',
      '.....hhhhhhhhhhhhhhhhhhhhhh.....',
      '.....hhhhhhhhhhh..hhhhh..hh.....',
      '.....hhhhhhhhh.....hhh....h.....',
      '......hhhhhhh.......h...........',
      '.......hhhhh....................',
      '........hhh.....................',
    ] },
    vegeta: { y0: -5, rows: [
      '..........h.....................',
      '.........hh.....................',
      '.........hhh....h...............',
      '........hhhh...hh...............',
      '........hhhhh.hhh...............',
      '.......hhhhhhhhhh...............',
      '.......hhhhhhhhhhh..h...........',
      '......hhhhhhhHhhhh.hh...........',
      '......hhhhhhHHhhhhhhh...........',
      '.....hhhhhhHHhhhhhhhhh..........',
      '.....hhhhhhhhhhhhhhhhhh.........',
      '....hhhhhhhhhhhhhhhhhhhh........',
      '....hhhhhhhhhhhhhhhhhhhhh.......',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '.....hhhhhhhhhhhhhhhhhhhhhh.....',
      '.....hhhhhhhhhhhhhhhhhhhhhh.....',
      '.....hhhhhhhhhh..hhh.....hh.....',
      '......hhhhhhh.....h.............',
      '......hhhhhh....................',
      '.......hhhh.....................',
      '.......hhh......................',
    ] },
    ssj: { y0: -5, rows: [
      '.......h.......h................',
      '.......hh.....hh.....h..........',
      '......hhh....hhh....hh..........',
      '.h....hhhh..hhhh...hhh..........',
      '.hh...hhhhhhhhhhh.hhhh...h......',
      '..hhhhhhhhhhHhhhhhhhhh..hh......',
      '..hhhhhhhhhHHhhhhhhhhhhhhh......',
      'hhhhhhhhhhHHhhhhhhhhhhhhhh......',
      '.hhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      '..hhhhhhhhhhhhhhhhhhhhhhhhhh....',
      '...hhhhhhhhhhhhhhhhhhhhhhhhh....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      '.hhhhhhhhhhhhhhhhhhhhhhhhhhh....',
      '..hhhhhhhhhhhhhhhhhhhhhhhhhh....',
      '...hhhhhhhhhhhhhhhhhhhhhhhhhh...',
      '..hhhhhhhhhhhhhhh.hhhhh.hhhh....',
      '...hhhhhhhhhhhh....hhh...hh.....',
      '....hhhhhhhhh......h......h.....',
      '.....hhhhhhh....................',
      '......hhhhh.....................',
      '.......hhh......................',
      '........h.......................',
    ] },
    ssj3: { y0: -3, rows: [
      '..........hhhh..................',
      '........hhhhhhhh................',
      '......hhhhhhhhhhhh..............',
      '.....hhhhhhhHHhhhhhh............',
      '....hhhhhhhHHhhhhhhhhh..........',
      '...hhhhhhhhhhhhhhhhhhhhh........',
      '..hhhhhhhhhhhhhhhhhhhhhhh.......',
      '..hhhhhhhhhhhhhhhhhhhhhhhh......',
      '.hhhhhhhhhhhhhhhhhhhhhhhhh......',
      '.hhhhhhhhhhhhhhhhhhhhhhhhh......',
      'hhhhhhhhhhhhhhhhhhhhhhhhh.......',
      'hhhhhhhhhhhhhhhhhhhhhhh.........',
      'hhhhhhhhhhhhhhhhhhhh............',
      'hhhhhhhhhhhh....................',
      'hhhhhhhhhh......................',
      'hhhhhhhhh.......................',
      'hhhhhhhh........................',
      'hhhhhhh.........................',
      'hhhhhhh.........................',
      'hhhhhhh.........................',
      'hhhhhhh.........................',
      'hhhhhh..........................',
      'hhhhhh..........................',
      'hhhhhh..........................',
      'hhhhhh..........................',
      'hhhhh...........................',
      'hhhhh...........................',
      'hhhhh...........................',
      '.hhhh...........................',
      '.hhhh...........................',
      '.hhh............................',
      '..hh............................',
      '..hh............................',
      '...h............................',
    ] },
    long: { y0: 0, rows: [
      '................................',
      '...........h......h.............',
      '..........hh.....hh.....h.......',
      '....h....hhh....hhh....hh.......',
      '....hh..hhhhh..hHhh...hhh.......',
      '...hhhhhhhhhhhhHHhhhhhhhh.......',
      '..hhhhhhhhhhhhHHhhhhhhhhh.......',
      '.hhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhh......',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhh.hhhhhh.hhh.....',
      'hhhhhhhhhhhhhh....hhhh...hh.....',
      'hhhhhhhhhhh.......hh......h.....',
      'hhhhhhhhhh......................',
      'hhhhhhhhh.......................',
      'hhhhhhhh........................',
      'hhhhhhhh........................',
      'hhhhhhh.........................',
      'hhhhhhh.........................',
      'hhhhhhh.........................',
      'hhhhhhh.........................',
      'hhhhhh..........................',
      'hhhhhh..........................',
      'hhhhhh..........................',
      'hhhhh...........................',
      'hhhhh...........................',
      'hhhhh...........................',
      'hhhh............................',
      'hhhh............................',
      '.hhh............................',
      '.hh.............................',
      '.h..............................',
    ] },
    bowl: { y0: 5, rows: [
      '...........hhhhhhh..............',
      '.........hhhhhhhhhhh............',
      '........hhhhhhHHhhhhhh..........',
      '.......hhhhhhHHhhhhhhhh.........',
      '......hhhhhhhhhhhhhhhhhh........',
      '......hhhhhhhhhhhhhhhhhhh.......',
      '......hhhhhhhhhhhhhhhhhhhh......',
      '......hhhhhhhhhh.hhhh.hhhh......',
      '......hhhhhhhh....hh....h.......',
      '......hhhhhhh...................',
      '......hhhhhh....................',
      '.......hhhh.....................',
      '........hh......................',
    ] },
    straight: { y0: 5, rows: [
      '...........hhhhhhh..............',
      '.........hhhhhhhhhhh............',
      '........hhhhhhHHhhhhhh..........',
      '.......hhhhhhHHhhhhhhhh.........',
      '......hhhhhhhhhhhhhhhhhh........',
      '......hhhhhhhhhhhhhhhhhhh.......',
      '.....hhhhhhhhhhhhhhhhhhhhh......',
      '.....hhhhhhhhhhhhhh.hhhhhh......',
      '.....hhhhhhhhhh.....hhh.hh......',
      '.....hhhhhhhh.......h...........',
      '.....hhhhhhh....................',
      '.....hhhhhh.....................',
      '.....hhhhhh.....................',
      '.....hhhhhh.....................',
      '......hhhhh.....................',
      '......hhhh......................',
      '.......hh.......................',
    ] },
    bob: { y0: 5, rows: [
      '...........hhhhhhh..............',
      '.........hhhhhhhhhhh............',
      '........hhhhhhHHhhhhhh..........',
      '.......hhhhhhHHhhhhhhhh.........',
      '......hhhhhhhhhhhhhhhhhh........',
      '.....hhhhhhhhhhhhhhhhhhhh.......',
      '.....hhhhhhhhhhhhhhhhhhhhh......',
      '.....hhhhhhhhhhhhhhhh.hhhh......',
      '....hhhhhhhhhh......hhh.hh......',
      '....hhhhhhhhh...................',
      '....hhhhhhhh....................',
      '....hhhhhhhh....................',
      '....hhhhhhhh....................',
      '....hhhhhhhh....................',
      '.....hhhhhh.....................',
    ] },
    twin: { y0: 5, rows: [
      '...........hhhhhhh..............',
      '.........hhhhhhhhhhh............',
      '........hhhhhhHHhhhhhh..........',
      '.......hhhhhhHHhhhhhhhh.........',
      '......hhhhhhhhhhhhhhhhhh........',
      '.....hhhhhhhhhhhhhhhhhhhh.......',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '...hhhhhhhhhhhhhhhhhh.hhhh......',
      '..hhhhhhhhhhh......hhh..h.......',
      '.hhhhhhhhh......................',
      'hhhh.hhhh.......................',
      'hhh...hh........................',
      'hhh.............................',
      'hh..............................',
      'h...............................',
    ] },
    mohawk: { y0: -3, rows: [
      '...............h................',
      '..............hhh...............',
      '.............hhhhh..............',
      '............hhhhhhh.............',
      '............hhHhhhh.............',
      '...........hhHHhhhh.............',
      '...........hhhhhhhh.............',
      '...........hhhhhhh..............',
      '............hhhhh...............',
      '............hhhh................',
      '.............hh.................',
    ] },
    afro: { y0: 2, rows: [
      '..........hhhhhhhh..............',
      '........hhhhhhhhhhhh............',
      '.......hhhhhhHHhhhhhhh..........',
      '......hhhhhhHHhhhhhhhhh.........',
      '.....hhhhhhhhhhhhhhhhhhh........',
      '.....hhhhhhhhhhhhhhhhhhhh.......',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '....hhhhhhhhhhhhhhhhhhhhh.......',
      '....hhhhhhhhhh.hhhhhh...........',
      '.....hhhhhhh....................',
      '......hhhhh.....................',
      '.......hhh......................',
    ] },
    turban: { y0: 1, rows: [
      '...........xxxxxxx..............',
      '.........xxxxxxxxxxx............',
      '........xxxxxXXxxxxxxx..........',
      '.......xxxxxXXxxxxxxxxx.........',
      '.......xxxxxxxxxxxxxxxxx........',
      '......xxxxxxxxxxxxxxxxxxx.......',
      '......xxxxxxxxxxxxxxxxxxx.......',
      '......xxxxxxxxxxxxxxxxxxxx......',
      '......hhhhhhhhhhhhhhhhhhhh......',
      '.......hhhhhhhhhhhhhhhhhh.......',
    ] },
    namek: { y0: 2, rows: [
      '...................h...h........',
      '..................h...h.........',
      '..................h...h.........',
      '.................h...h..........',
      '.................h...h..........',
      '................hh..hh..........',
      '................hh..hh..........',
    ] },
    horns: { y0: 0, rows: [
      '...h.................h..........',
      '...hh...............hh..........',
      '...hh..............hh...........',
      '....hh............hh............',
      '....hhh..........hhh............',
      '.....hhhxxxxxxxxhhh.............',
      '......hxxxxXXxxxxxh.............',
      '.......xxxxXXxxxxxxx............',
      '.......xxxxxxxxxxxxxx...........',
      '........xxxxxxxxxxxx............',
      '.........xxxxxxxxx..............',
    ] },
    dome: { y0: 6, rows: [
      '...........xxxxxxx..............',
      '.........xxxxxXXxxxx............',
      '........xxxxxXXxxxxxx...........',
      '........xxxxxxxxxxxxxx..........',
      '........xxxxxxxxxxxxxx..........',
      '.........xxxxxxxxxxx............',
    ] },
    crown: { y0: -2, rows: [
      '....hh..........................',
      '....hhh.........................',
      '.....hhh........................',
      '.....hhhh.....hh................',
      '......hhhh...hhh................',
      '......hhhhxxhhh.................',
      '.......hxxxxxxxx................',
      '......xxxxxxxxxxx...............',
      '.....xxxxxxXXxxxxxx.............',
      '.....xxxxxXXxxxxxxxxx...........',
      '......xxxxxxxxxxxxxxxx..........',
      '........xxxxxxxxxxxxx...........',
      '..........xxxxxxxxx.............',
    ] },
    antenna: { y0: -1, rows: [
      '.........hhh....................',
      '........hhhhh...................',
      '........hhhh....................',
      '.........hhh....................',
      '..........hhh...................',
      '...........hhh..................',
      '............hhh.................',
      '.............hh.................',
      '..............h.................',
    ] },
    cat: { y0: 0, rows: [
      '.........h........h.............',
      '.........hh......hh.............',
      '.........hhh....hhh.............',
      '.........hhhh..hhhh.............',
      '.........hxhh..hhxh.............',
      '.........hxhhhhhhxh.............',
      '.........hhhhhhhhhh.............',
      '..........hhhhhhhh..............',
    ] },
    tall: { y0: -6, rows: [
      '.............hhh................',
      '............hhhhh...............',
      '............hhhhh...............',
      '...........hhHhhhh..............',
      '...........hhHhhhh..............',
      '...........hHHhhhh..............',
      '..........hhhhhhhhh.............',
      '..........hhhhhhhhh.............',
      '..........hhhhhhhhh.............',
      '.........hhhhhhhhhhh............',
      '.........hhhhhhhhhhh............',
      '........hhhhhhhhhhhhh...........',
      '........hhhhhhhhhhhhh...........',
      '........hhhhhhhh................',
      '.........hhhhh..................',
    ] },
    beast: { y0: -8, rows: [
      '.....h.........h................',
      '.....hh.......hh.....h..........',
      '....hhh......hhh....hh..........',
      '....hhhh....hhhh...hhh..........',
      '...hhhhhh..hhhhh..hhhh..........',
      '...hhhhhhhhhhhhhhhhhhh..........',
      '..hhhhhhhhhhHhhhhhhhhh..h.......',
      '..hhhhhhhhhHHhhhhhhhhhhhh.......',
      '.hhhhhhhhhHHhhhhhhhhhhhhh.......',
      '.hhhhhhhhhhhhhhhhhhhhhhhhh......',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhh......',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhhh....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhhh....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhhh....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhh.....',
      'hhhhhhhhhhhhhhhhhhhhhhhhhhhh....',
      'hhhhhhhhhhhhhhhhh.hhhhh.hhhh....',
      'hhhhhhhhhhhhhhh....hhh...hh.....',
      'hhhhhhhhhhhhh......h......h.....',
      'hhhhhhhhhhh.....................',
      'hhhhhhhhh.......................',
      '.hhhhhhh........................',
      '..hhhhh.........................',
      '...hhh..........................',
    ] },
  };

  // ---------------- CARA (filas 8..20) ----------------
  // s piel · S oreja/sombra · ojos y boca se pintan aparte
  const FACE = { y0: 8, rows: [
    '...........ssssssss.............',
    '.........ssssssssssss...........',
    '........ssssssssssssss..........',
    '........sssssssssssssss.........',
    '........sssssssssssssss.........',
    '........ssssssssssssssss........',
    '.......Sssssssssssssssss........',
    '.......SSssssssssssssssss.......',
    '.......Sssssssssssssssss........',
    '........ssssssssssssssss........',
    '.........ssssssssssssss.........',
    '..........ssssssssssss..........',
    '............sssssss.............',
  ] };

  // ---------------- TORSOS (filas 21..30) ----------------
  // t arriba · T sombra arriba · u camiseta interior · s piel · w muñequeras · l cinturón · x armadura · y hombreras · g guantes
  const TORSO = {
    gi: [
      '.............sssss..............',
      '..........tttuuuuuttt...........',
      '.........ttttuuuuuttttt.........',
      '........tttttTuuuTtttttt........',
      '........tttttTTuTTttttttss......',
      '.......sstttttTTTtttttttsss.....',
      '.......ssttttttTtttttttt.sss....',
      '.......wwttttttttttttttt.www....',
      '.......ss.tttttttttttt...sss....',
      '..........llllllllllll..........',
    ],
    armor: [
      '.............ttttt..............',
      '.......yyyy.xxxxxxx.yyyy........',
      '......yyyyyxxxxxxxxxyyyyy.......',
      '......yyyyxxxxXXxxxxxyyyy.......',
      '.......ttxxxxXXxxxxxxxtttt......',
      '.......ttxxxxxxxxxxxxxxttt......',
      '.......ggxxxxxxxxxxxxx..ggg.....',
      '.......ggxxxxxxxxxxxxx..ggg.....',
      '.......gg.xxxxxxxxxxx...ggg.....',
      '.........yyy.xxxxx.yyy..........',
    ],
    bare: [
      '.............sssss..............',
      '..........sssssssssss...........',
      '.........sssssssssssss..........',
      '........ssssssSssSsssss.........',
      '........ssssssSssSsssssss.......',
      '.......ssssssssssssssssssss.....',
      '.......sssssssSSSsssssss.sss....',
      '.......wwssssssssssssss..www....',
      '.......ss.ssssssssssss...sss....',
      '..........llllllllllll..........',
    ],
  };
  // brazo extendido para el fotograma de ataque (sustituye el brazo delantero)
  const ATK_ARM = { y0: 24, rows: [
    '.......................ttttt....',
    '......................ttttttwwss',
    '.......................tttt.wwss',
  ] };

  // ---------------- PIERNAS (filas 31..41) ----------------
  const LEGS = {
    idle: [
      '.........bbbbbbbbbbbbb..........',
      '.........bbbbbbbbbbbbbb.........',
      '........bbbbbbbB.bbbbbb.........',
      '........bbbbbbB...bbbbb.........',
      '........bbbbbb....bbbbb.........',
      '........bbbbbb....bbbbb.........',
      '.........bbbb......bbbb.........',
      '.........kkkk......kkkk.........',
      '........kkkkk.....kkkkk.........',
      '........kkkkkk....kkkkkk........',
      '........kkkkkk....kkkkkk........',
    ],
    walkA: [
      '.........bbbbbbbbbbbbb..........',
      '........bbbbbbbbbbbbbbb.........',
      '.......bbbbbbbB..bbbbbbb........',
      '......bbbbbbB.....bbbbbbb.......',
      '.....bbbbbb........bbbbbb.......',
      '.....bbbbb..........bbbbb.......',
      '.....bbbb............bbbb.......',
      '....kkkk.............kkkk.......',
      '...kkkkk.............kkkkk......',
      '...kkkkk.............kkkkkk.....',
      '...kkkk..............kkkkkk.....',
    ],
    walkB: [
      '.........bbbbbbbbbbbbb..........',
      '.........bbbbbbbbbbbbbb.........',
      '.........bbbbbbbbbbbbb..........',
      '..........bbbbbbbbbbb...........',
      '..........bbbbbbbbbb............',
      '...........bbbbbbbbb............',
      '...........bbbb.bbbb............',
      '...........kkkk.kkkk............',
      '..........kkkkk.kkkkk...........',
      '..........kkkkk.kkkkkk..........',
      '..........kkkkk.kkkkkk..........',
    ],
  };
  const ROBE = [
    '.........tttttttttttttt.........',
    '........tttttttttttttttt........',
    '........ttttttttTtttttttt.......',
    '.......ttttttttTttttttttt.......',
    '.......tttttttTtttttttttt.......',
    '.......ttttttTttttttttttt.......',
    '......ttttttttttttttttttttt.....',
    '......ttttttttttttttttttttt.....',
    '......ttttttttttttttttttttt.....',
    '........kkkkk......kkkkk........',
    '.......kkkkkk......kkkkkk.......',
  ];
  const CAPE = { y0: 21, rows: [
    '.......ccc......................',
    '......cccc......................',
    '.....ccccc......................',
    '.....cccccc.....................',
    '....ccccccc.....................',
    '....ccccccc.....................',
    '...cccccccc.....................',
    '...cccccccc.....................',
    '...ccccccc......................',
    '..cccccccc......................',
    '..ccccccc.......................',
    '..cccccc........................',
    '..ccccc.........................',
    '...ccc..........................',
  ] };
  const TAIL = { y0: 26, rows: [
    '..aa............................',
    '.aa.............................',
    '.a..............................',
    '.a..............................',
    '.aa.....a.......................',
    '..aaaaaaa.......................',
  ] };
  const WINGS = { y0: 20, rows: [
    '.....ww.........................',
    '...wwwww........................',
    '..wwwwwww.......................',
    '.wwwwwwww.......................',
    'wwwwwwwww.......................',
    'wwwwwwww........................',
    '.wwwwww.........................',
    '..wwww..........................',
  ] };

  // ---------------- utilidades de color ----------------
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
      if (!look.y) L.y = shade(L.x, -0.25);
    }
    if (!L.b) L.b = L.t;
    if (!L.l) L.l = '#2a56d6';
    if (!L.k) L.k = L.l;
    if (!L.x) L.x = '#f0f0f0';
    if (!L.u) L.u = L.body === 'gi' && L.t !== L.l ? L.l : shade(L.t, -0.3);
    if (!L.w) L.w = L.l;
    // si la parte de arriba es del color de la piel, se dibuja el torso desnudo
    if (L.body === 'gi' && L.t === L.sk) L.body = 'bare';
    if (form) {
      for (const k of ['h', 'hc', 'sk', 't', 'b', 'x', 'l', 'k', 'tail']) if (form[k]) L[k] = form[k];
      if (form.ex) L.ex = (L.ex ? L.ex + ',' : '') + form.ex;
      if (form.eye) L.eye = form.eye;
    }
    if (shiny) {
      const d = shiny === true ? 150 : shiny;
      for (const k of ['t', 'b', 'l', 'x', 'y', 'u', 'w', 'cape']) if (L[k]) L[k] = hueShift(L[k], d);
      if (L.hc && L.h !== 'bald') L.hc = hueShift(L.hc, d * 0.6);
      if (look.alien) L.sk = hueShift(L.sk, d);
    }
    return L;
  }

  // pose: 0 reposo · 1 respira · 2 andar A · 3 andar B · 4 ataque
  function build(look, pose) {
    const grid = Array.from({ length: H }, () => new Array(W).fill(null));
    const hair = shade(look.hc, 0), hairHi = shade(look.hc, 0.35);
    const cols = {
      s: look.sk, S: shade(look.sk, -0.18), h: hair, H: hairHi, t: look.t, T: shade(look.t, -0.22),
      u: look.u, b: look.b, B: shade(look.b, -0.25), l: look.l, k: look.k, x: look.x, X: shade(look.x, 0.4),
      y: look.y || shade(look.x, -0.25), g: '#f4f4f4', w: look.w,
      c: look.cape || look.t, a: look.tail || look.sk,
    };
    const wingC = look.wings || '#2a2a2a';
    const bob = pose === 1 ? 1 : pose === 2 ? 1 : 0; // la parte de arriba baja 1 px al respirar/andar
    const put = (rows, y0, dy, map) => {
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          const ch = row[rx];
          if (ch === '.' || ch === ' ') continue;
          const gx = rx + OX, gy = ry + y0 + dy + OY;
          if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
          const col = (map && map[ch]) || cols[ch];
          if (col) grid[gy][gx] = col;
        }
      });
    };
    if (look.wings) put(WINGS.rows, WINGS.y0, bob, { w: wingC });
    if (look.cape) put(CAPE.rows, CAPE.y0, bob, null);
    if (look.tail) put(TAIL.rows, TAIL.y0, 0, null);
    // piernas
    if (look.body === 'robe') put(ROBE, 31, 0, null);
    else put(pose === 2 ? LEGS.walkA : pose === 3 ? LEGS.walkB : LEGS.idle, 31, 0, null);
    // torso
    const torso = TORSO[look.body === 'robe' ? 'gi' : look.body] || TORSO.gi;
    put(torso, 21, bob, null);
    if (pose === 4) {
      // borra el brazo delantero en reposo y dibuja el extendido
      for (let y = 24; y <= 29; y++) for (let x = 23; x <= 28; x++) { const gy = y + OY + bob, gx = x + OX; if (grid[gy]) grid[gy][gx] = null; }
      put(ATK_ARM.rows, ATK_ARM.y0, bob, look.body === 'armor' ? { w: '#f4f4f4', s: '#f4f4f4' } : null);
    }
    // cabeza
    put(FACE.rows, FACE.y0, bob, null);
    const hd = HAIR[look.h] || HAIR.bald;
    put(hd.rows, hd.y0, bob, null);

    const ex = (look.ex || '').split(',').filter(Boolean);
    const P = (x, y, c) => { const gx = x + OX, gy = y + OY + bob; if (gx >= 0 && gy >= 0 && gx < W && gy < H) grid[gy][gx] = c; };
    // cejas, ojos, nariz y boca
    const noHairBrow = ['bald', 'namek', 'antenna', 'cat', 'dome', 'horns', 'crown', 'turban', 'mohawk'].includes(look.h);
    const brow = noHairBrow ? shade(look.sk, -0.5) : shade(look.hc, -0.25);
    const E = OUTLINE, Wh = '#ffffff', I = look.eye || '#24203a';
    if (!ex.includes('nobrow')) { P(14, 13, brow); P(15, 13, brow); P(16, 12, brow); P(17, 12, brow); P(20, 12, brow); P(21, 13, brow); P(22, 13, brow); }
    else { P(15, 13, shade(look.sk, -0.3)); P(16, 13, shade(look.sk, -0.3)); P(21, 13, shade(look.sk, -0.3)); }
    // ojo cercano
    P(15, 14, E); P(16, 14, E); P(17, 14, E);
    P(15, 15, Wh); P(16, 15, I); P(17, 15, E);
    P(15, 16, Wh); P(16, 16, I); P(17, 16, I);
    // ojo lejano
    P(20, 14, E); P(21, 14, E);
    P(20, 15, Wh); P(21, 15, I);
    P(20, 16, Wh); P(21, 16, I);
    P(23, 16, shade(look.sk, -0.25)); // nariz
    P(18, 18, shade(look.sk, -0.4)); P(19, 18, shade(look.sk, -0.4)); P(20, 18, shade(look.sk, -0.3));
    if (pose === 4) { P(18, 18, '#6a2020'); P(19, 18, '#6a2020'); P(19, 19, '#6a2020'); }
    for (const e of ex) {
      switch (e) {
        case 'scouter':
          for (let y = 13; y <= 15; y++) { P(21, y, '#40ff70'); P(22, y, '#40ff70'); }
          P(22, 13, '#b0ffc0'); P(9, 14, '#d0d0d0'); P(10, 14, '#d0d0d0'); P(8, 15, '#a0a0a0');
          break;
        case 'beard': for (let y = 17; y <= 23; y++) for (let x = 13 + (y - 17) / 2; x <= 23 - (y - 17); x++) P(Math.round(x), y, '#f0f0f0'); break;
        case 'glasses': for (let x = 14; x <= 22; x++) P(x, 15, '#1a1a24'); for (let x = 15; x <= 17; x++) P(x, 14, '#1a1a24'); P(20, 14, '#1a1a24'); P(21, 14, '#1a1a24'); P(16, 15, '#6a6a8a'); P(21, 15, '#6a6a8a'); break;
        case 'eye3': P(18, 10, E); P(19, 10, E); P(18, 11, Wh); P(19, 11, I); break;
        case 'dots': for (const [x, y] of [[14, 9], [17, 8], [12, 11], [15, 11], [18, 10], [13, 8]]) P(x, y, '#7a4a2a'); break;
        case 'mustache': { const mc = noHairBrow ? '#3a2a1a' : look.hc; for (let x = 17; x <= 23; x++) P(x, 17, mc); P(17, 18, mc); P(23, 18, mc); break; }
        case 'halo': for (let x = 10; x <= 20; x++) { P(x, -4, '#ffe860'); } P(9, -3, '#ffe860'); P(21, -3, '#ffe860'); for (let x = 10; x <= 20; x++) P(x, -2, '#d0b030'); break;
        case 'mark': P(17, 10, '#d02040'); P(19, 10, '#d02040'); P(18, 11, '#d02040'); P(17, 11, '#d02040'); P(19, 11, '#d02040'); P(16, 10, '#d02040'); P(20, 10, '#d02040'); break;
        case 'potara': P(9, 16, '#ffd040'); P(9, 17, '#ffd040'); P(8, 17, '#ffd040'); P(9, 18, '#e0a020'); break;
        case 'headband': for (let x = 6; x <= 23; x++) { P(x, 11, '#d03030'); P(x, 12, '#d03030'); } P(5, 13, '#d03030'); P(4, 14, '#d03030'); P(3, 15, '#d03030'); P(4, 15, '#a02020'); break;
        case 'bandana': for (let x = 6; x <= 23; x++) for (let y = 8; y <= 11; y++) P(x, y, '#e07030'); P(5, 12, '#e07030'); P(4, 13, '#e07030'); break;
        case 'horns2': P(11, 6, '#f0e0c0'); P(11, 7, '#f0e0c0'); P(12, 7, '#f0e0c0'); P(19, 6, '#f0e0c0'); P(19, 7, '#f0e0c0'); P(20, 7, '#f0e0c0'); break;
        case 'spots': for (const [x, y] of [[11, 23], [15, 25], [19, 23], [12, 27], [18, 28], [16, 22], [10, 33], [19, 35], [13, 36]]) P(x, y, '#1a3a1a'); break;
        case 'chest': for (const [x, y] of [[13, 23], [14, 23], [15, 23], [16, 23], [14, 24], [15, 24], [9, 22], [10, 22], [20, 22], [21, 22], [17, 9], [18, 9], [19, 9]]) P(x, y, look.x); P(14, 23, shade(look.x, 0.4)); break;
        case 'cheeks': P(14, 17, '#ff90a0'); P(15, 17, '#ff90a0'); P(21, 17, '#ff90a0'); break;
        case 'scar': P(19, 12, '#a04040'); P(20, 13, '#a04040'); P(21, 14, '#a04040'); P(13, 16, '#a04040'); P(13, 17, '#a04040'); break;
        case 'visor': for (let x = 13; x <= 24; x++) { P(x, 14, '#202040'); P(x, 15, '#2a2a5a'); } P(13, 14, '#6a6aa0'); break;
        case 'sword': for (let i = 0; i < 6; i++) P(5 + i, 15 + i, '#7a4a2a'); P(4, 14, '#c0c8d8'); P(3, 13, '#c0c8d8'); P(2, 12, '#e0e8f8'); P(6, 18, '#e0c040'); P(8, 16, '#e0c040'); break;
        case 'gold': for (let x = 12; x <= 19; x++) { P(x, 20, '#ffd040'); P(x, 21, '#e0b020'); } P(25, 27, '#ffd040'); P(26, 27, '#ffd040'); break;
        case 'scarf': for (let x = 11; x <= 20; x++) { P(x, 20, '#e07030'); P(x, 21, '#e07030'); } P(10, 22, '#e07030'); P(9, 23, '#e07030'); P(9, 24, '#c05020'); break;
        case 'veins': P(13, 9, '#2a6a2a'); P(14, 10, '#2a6a2a'); P(19, 9, '#2a6a2a'); P(11, 12, '#2a6a2a'); break;
        case 'redeye': P(16, 15, '#ff2020'); P(16, 16, '#ff2020'); P(17, 16, '#c01010'); P(21, 15, '#ff2020'); P(21, 16, '#c01010'); break;
        case 'tealeye': P(16, 15, '#20b0a0'); P(16, 16, '#20b0a0'); P(17, 16, '#108070'); P(21, 15, '#20b0a0'); P(21, 16, '#108070'); break;
        case 'fur': for (let y = 22; y <= 29; y++) { P(8, y, '#c03030'); P(9, y, '#c03030'); } for (let y = 25; y <= 28; y++) { P(24, y, '#c03030'); P(25, y, '#c03030'); } break;
        default: break;
      }
    }

    // contorno automático y sombreado (luz de arriba a la derecha)
    const out = grid.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (grid[y][x]) continue;
      const n = (grid[y - 1] && grid[y - 1][x]) || (grid[y + 1] && grid[y + 1][x]) || grid[y][x - 1] || grid[y][x + 1];
      if (n) out[y][x] = OUTLINE;
    }
    const keep = new Set(['#ffffff', OUTLINE, I, '#ff2020', '#20b0a0']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = grid[y][x];
      if (!c || keep.has(c)) continue;
      const left = grid[y][x - 1], below = grid[y + 1] && grid[y + 1][x];
      const right = grid[y][x + 1], above = grid[y - 1] && grid[y - 1][x];
      const left2 = grid[y][x - 2];
      if (!left || !below) out[y][x] = shade(c, -0.3);
      else if (!left2) out[y][x] = shade(c, -0.12);
      else if (!right || !above) out[y][x] = shade(c, 0.2);
      // líneas internas entre zonas de color distinto (pelo/cara, ropa/piel)
      else if (left !== c && left !== OUTLINE && lum(left) > lum(c) + 40) out[y][x] = shade(c, -0.25);
    }
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (out[y][x]) { g.fillStyle = out[y][x]; g.fillRect(x, y, 1, 1); }
    }
    return cv;
  }
  const lumCache = {};
  function lum(hex) {
    if (lumCache[hex] !== undefined) return lumCache[hex];
    const [r, g, b] = hexToRgb(hex);
    return (lumCache[hex] = 0.3 * r + 0.59 * g + 0.11 * b);
  }

  // ---------------- sprites desde PNG (assets/sprites) ----------------
  // window.SPRITE_FILES = { id: { src, frames, scale } } — también 'id@forma' e 'id*' (shiny)
  const files = (typeof window !== 'undefined' && window.SPRITE_FILES) || {};
  const fileImgs = {};
  function fileSprite(key) {
    const def = files[key];
    if (!def) return null;
    let st = fileImgs[key];
    if (!st) {
      const im = new Image();
      st = fileImgs[key] = { im, ok: false, frames: null };
      im.onload = () => {
        const n = def.frames || 1, fw = Math.floor(im.width / n);
        st.frames = [];
        for (let i = 0; i < n; i++) {
          const c = document.createElement('canvas'); c.width = fw; c.height = im.height;
          c.getContext('2d').drawImage(im, i * fw, 0, fw, im.height, 0, 0, fw, im.height);
          st.frames.push(c);
        }
        while (st.frames.length < 5) st.frames.push(st.frames[st.frames.length === 4 ? 0 : st.frames.length % n]);
        st.ok = true;
        // en file:// el navegador no deja exportar el canvas: se usa el PNG tal cual
        try { st.url = st.frames[0].toDataURL(); } catch (e) { st.url = im.src; }
      };
      im.src = 'assets/sprites/' + def.src;
    }
    return st.ok ? st : null;
  }
  function fileFor(key, form, shiny) {
    const tries = [];
    if (form) { if (shiny) tries.push(key + '@' + form.key + '*'); tries.push(key + '@' + form.key); }
    if (shiny) tries.push(key + '*');
    tries.push(key);
    for (const k of tries) { const s = fileSprite(k); if (s) return { s, k, recolor: k === key && shiny }; }
    return null;
  }
  // precarga todos los PNG declarados
  Object.keys(files).forEach(fileSprite);

  const cache = new Map();
  // Devuelve { f: [5 fotogramas], sc, pad, look }
  function get(look, form, shiny, key) {
    const fs = fileFor(key, form, shiny);
    if (fs) {
      const def = files[fs.k];
      // los PNG se ajustan para que midan lo mismo que los generados (unos 44 px de alto)
      const fit = def.scale || 44 / fs.s.frames[0].height;
      return { f: fs.s.frames, fit, pad: def.pad || 0, file: true, url: fs.s.url };
    }
    const k = key + '|' + (form ? form.n : '') + '|' + (shiny ? 1 : 0);
    let v = cache.get(k);
    if (!v) {
      const L = resolveLook(look, form, shiny);
      v = { f: [0, 1, 2, 3, 4].map(p => build(L, p)), fit: 1, pad: H - (FOOT + OY) - 1, look: L };
      cache.set(k, v);
    }
    return v;
  }

  // Silueta oscura (colección: personajes que no tienes)
  const silCache = new Map();
  function silhouette(look, key) {
    if (silCache.has(key)) return silCache.get(key);
    const src = get(look, null, false, key).f[0];
    const cv = document.createElement('canvas');
    cv.width = src.width; cv.height = src.height;
    const g = cv.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#0d0a1a';
    g.fillRect(0, 0, cv.width, cv.height);
    const url = cv.toDataURL();
    silCache.set(key, url);
    return url;
  }

  const urlCache = new Map();
  function dataURL(look, form, shiny, key) {
    const s = get(look, form, shiny, key);
    if (s.file) return s.url;
    const k = key + '|' + (form ? form.n : '') + '|' + (shiny ? 1 : 0);
    if (urlCache.has(k)) return urlCache.get(k);
    const u = s.f[0].toDataURL();
    urlCache.set(k, u);
    return u;
  }

  // Cápsula Hoi-Poi pixel art (para el gacha). color = parte superior
  const capCache = new Map();
  function capsule(color, open) {
    const k = color + (open ? 'o' : '');
    if (capCache.has(k)) return capCache.get(k);
    const rows = [
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

  // distancia del centro del personaje a sus pies (en px del sprite)
  const FOOT_FROM_CENTER = 13;
  return { get, dataURL, silhouette, capsule, dragonBall, shade, hueShift, W, H, FOOT_FROM_CENTER };
})();
