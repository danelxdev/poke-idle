// Carga y dibuja las hojas de animación de PMD SpriteCollab.
// Cada hoja tiene 8 filas (direcciones) y N columnas (fotogramas). El centro del fotograma es el
// punto de anclaje y los pies quedan unos 6 px por debajo.
'use strict';

const Sprites = (() => {
  const DEX = {};
  for (const p of POKEDEX) DEX[p.dex] = p;
  if (typeof MEGA_DEX !== 'undefined') for (const p of MEGA_DEX) DEX[p.dex] = p;
  const imgs = new Map();
  // fila de la hoja según el octante del ángulo (0 = derecha, sentido horario en pantalla)
  const ROW_OF_OCT = [2, 1, 0, 7, 6, 5, 4, 3];
  const FOOT = 6;

  function path(dex, shiny, file) { return 'assets/pokemon/' + dex + '/' + (shiny ? 's/' : '') + file; }

  function sheet(dex, shiny, anim) {
    const p = DEX[dex];
    if (!p) return null;
    if (!p.anim[anim]) anim = 'walk';
    const key = dex + (shiny ? 's' : '') + anim;
    let s = imgs.get(key);
    if (!s) {
      const img = new Image();
      s = { img, ok: false, meta: p.anim[anim] };
      img.onload = () => { s.ok = true; };
      img.onerror = () => { if (shiny) { s.fallback = sheet(dex, false, anim); } };
      img.src = path(dex, shiny, anim + '.png');
      s.total = s.meta.d.reduce((a, b) => a + b, 0);
      imgs.set(key, s);
    }
    if (!s.ok && s.fallback) return s.fallback.ok ? s.fallback : null;
    return s.ok ? s : null;
  }

  function preload(dex, shiny) { for (const a of ['walk', 'idle', 'attack', 'hurt']) sheet(dex, shiny, a); }

  // fotograma según el tiempo (t en segundos); loop=false se queda en el último
  function frameAt(meta, t, loop) {
    const total = meta.d.reduce((a, b) => a + b, 0);
    let f = t * 60;
    if (loop) f %= total; else if (f >= total) return meta.d.length - 1;
    for (let i = 0; i < meta.d.length; i++) { f -= meta.d[i]; if (f < 0) return i; }
    return meta.d.length - 1;
  }
  function animLen(dex, anim) { const p = DEX[dex]; const m = p && (p.anim[anim] || p.anim.walk); return m ? m.d.reduce((a, b) => a + b, 0) / 60 : 0.5; }

  function rowFor(angle) {
    let a = Math.atan2(Math.sin(angle), Math.cos(angle));
    let o = Math.round(a / (Math.PI / 4));
    o = ((o % 8) + 8) % 8;
    return ROW_OF_OCT[o];
  }

  const tmp = document.createElement('canvas');
  const tctx = tmp.getContext('2d');

  // Dibuja un Pokémon con los pies en (x, y)
  function draw(ctx, dex, shiny, anim, angle, t, x, y, scale, opts) {
    opts = opts || {};
    let s = sheet(dex, shiny, anim);
    let loop = anim === 'walk' || anim === 'idle';
    if (!s) { s = sheet(dex, shiny, 'walk'); loop = true; if (!s) return false; }
    const m = s.meta;
    const fi = frameAt(m, t, loop);
    const row = rowFor(angle);
    const sx = fi * m.w, sy = row * m.h;
    const w = m.w * scale, h = m.h * scale;
    const dx = Math.round(x - w / 2), dy = Math.round(y - FOOT * scale - h / 2);
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    if (opts.flash || opts.tint) {
      if (tmp.width < m.w || tmp.height < m.h) { tmp.width = Math.max(tmp.width, m.w); tmp.height = Math.max(tmp.height, m.h); }
      tctx.clearRect(0, 0, tmp.width, tmp.height);
      tctx.globalCompositeOperation = 'source-over';
      tctx.drawImage(s.img, sx, sy, m.w, m.h, 0, 0, m.w, m.h);
      tctx.globalCompositeOperation = 'source-atop';
      tctx.fillStyle = opts.flash ? 'rgba(255,255,255,0.85)' : opts.tint;
      tctx.fillRect(0, 0, m.w, m.h);
      tctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmp, 0, 0, m.w, m.h, dx, dy, w, h);
    } else {
      ctx.drawImage(s.img, sx, sy, m.w, m.h, dx, dy, w, h);
    }
    ctx.globalAlpha = 1;
    return true;
  }

  function portrait(dex, shiny) { return path(dex, shiny, 'portrait.png'); }

  // Imagen estática para menús: primer fotograma de reposo mirando abajo (vía CSS sprite)
  function idleStyle(dex, shiny, px) {
    const p = DEX[dex];
    const m = p.anim.idle || p.anim.walk;
    const k = px / m.h;
    return `width:${Math.round(m.w * k)}px;height:${px}px;background:url('${path(dex, shiny, (p.anim.idle ? 'idle' : 'walk') + '.png')}') 0 0 / ${Math.round(m.w * m.d.length * k)}px ${px * 8}px no-repeat;image-rendering:pixelated`;
  }

  // El propio Pokémon como elemento HTML: la hoja de animación recorrida con CSS (mirando al frente).
  // animated=false → solo el primer fotograma (barato: para listas largas como la Pokédex).
  function html(dex, shiny, px, animated, cls) {
    const p = DEX[dex];
    if (!p || !p.anim) return '';
    const a = p.anim.idle ? 'idle' : 'walk', m = p.anim[a] || p.anim.walk;
    if (!m) return '';
    const n = m.d.length, dur = (m.d.reduce((x, y) => x + y, 0) / 60).toFixed(2), img = path(dex, shiny, a + '.png');
    const bb = typeof SPR_BOX !== 'undefined' ? SPR_BOX[dex] : null, play = animated && n > 1 ? 'play' : '';
    if (bb) {
      // caja cuadrada de px: el dibujo del Pokémon (recuadro real, no el fotograma) queda centrado y ocupa ~88 % de la caja
      const bw = bb[2] - bb[0], bh = bb[3] - bb[1], k = px * 0.88 / Math.max(bw, bh), fw = m.w * k;
      const ox = (px / 2 - (bb[0] + bw / 2) * k).toFixed(2), oy = (px / 2 - (bb[1] + bh / 2) * k).toFixed(2);
      return `<i class="spr ${play} ${cls || ''}" role="img" style="width:${px}px;height:${px}px;background-image:url('${img}');background-size:${(fw * n).toFixed(2)}px ${(m.h * k * 8).toFixed(2)}px;background-position:${ox}px ${oy}px;--ox:${ox}px;--sw:${(fw * n).toFixed(2)}px;--n:${n};--dur:${dur}s"></i>`;
    }
    const k = px / m.h, w = Math.round(m.w * k);
    return `<i class="spr ${play} ${cls || ''}" role="img" style="width:${w}px;height:${px}px;background-image:url('${img}');background-size:${w * n}px ${px * 8}px;--ox:0px;--sw:${w * n}px;--n:${n};--dur:${dur}s"></i>`;
  }

  return { DEX, sheet, preload, draw, frameAt, animLen, rowFor, portrait, idleStyle, html, FOOT };
})();
