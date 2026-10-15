// Paisaje nocturno de la portada del juego (js/title.js) hecho determinista: todo es función del
// tiempo t, así cada fotograma del vídeo se puede volver a generar idéntico.
'use strict';

const Scenery = (() => {
  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const POP = [25, 4, 7, 1, 133, 39, 52, 54, 63, 66, 74, 92, 94, 104, 129, 143, 147, 152, 155, 158, 175, 179, 196, 197, 252, 255, 258, 280, 303, 359, 387, 390, 393, 447, 448, 570, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912];

  function make(W, H, GY, opts) {
    opts = opts || {};
    const R = rng(opts.seed || 7), rnd = (a, b) => a + R() * (b - a);
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const layers = [[4, '#1b2255', 78, 0.012, 1.6], [9, '#242c68', 60, 0.018, 2.2], [16, '#303a80', 42, 0.026, 2.8]].map(([sp, col, base, fr, amp], li) => {
      const c = mk(W * 2, H), g = c.getContext('2d'); g.fillStyle = col;
      for (let x = 0; x < W * 2; x++) {
        const xx = x % W, h = base * 0.55 + Tiles.fbm(Math.cos(xx / W * 6.283) * 3 + li * 7, Math.sin(xx / W * 6.283) * 3 + li * 11, 40 + li) * base * 0.9 * amp / 2.2;
        g.fillRect(x, GY - h, 1, h + 40);
      }
      return { c, sp };
    });
    const ground = mk(W, H - GY + 2), g = ground.getContext('2d');
    g.fillStyle = '#3f7a3a'; g.fillRect(0, 2, W, H - GY);
    g.fillStyle = '#5cb84a'; g.fillRect(0, 0, W, 3);
    g.fillStyle = '#4caa3f'; g.fillRect(0, 3, W, 2);
    for (let x = 0; x < W; x++) for (let y = 4; y < H - GY; y++) { const r = Tiles.hash(x, y, 91); if (r < 0.05) { g.fillStyle = '#2f6a2f'; g.fillRect(x, y, 1, 1); } else if (r > 0.97) { g.fillStyle = '#7ad060'; g.fillRect(x, y, 1, 1); } }
    const bushes = mk(W, 40), b = bushes.getContext('2d');
    const nb = Math.round(W / 36);
    for (let i = 0; i < nb; i++) {
      const x = Math.floor(i * (W / nb) + Tiles.hash(i, 5, 7) * 14), h = 16 + Math.floor(Tiles.hash(i, 6, 7) * 14);
      for (let k = 0; k < 4; k++) { b.fillStyle = ['#12331f', '#18482a', '#1f5c35', '#2a7444'][k]; const w = 12 - k * 2.4; b.beginPath(); b.moveTo(x, 40 - h + k * 5); b.lineTo(x + w, 40 - 4 - k * 1); b.lineTo(x - w, 40 - 4 - k * 1); b.closePath(); b.fill(); }
      b.fillStyle = '#3a2412'; b.fillRect(x - 1, 36, 2, 4);
    }
    const stars = Array.from({ length: Math.round(W * GY / 360) }, () => ({ x: rnd(0, W), y: rnd(0, GY * 0.75), p: rnd(0, 6.28), s: R() < 0.15 ? 2 : 1 }));
    const clouds = Array.from({ length: 7 }, () => ({ x: rnd(0, W), y: rnd(GY * 0.1, GY * 0.55), w: rnd(26, 52), sp: rnd(2, 6) }));
    const flies = Array.from({ length: 22 }, () => ({ x: rnd(0, W), y: rnd(GY - 40, H - 4), p: rnd(0, 6.28), sp: rnd(0.6, 1.6) }));
    // Pokémon que cruzan el camino: horario fijo
    const walkers = [];
    const list = opts.walkers || POP;
    let tt = -14, k = 0;
    while (tt < (opts.until || 40)) { const d = list[k++ % list.length]; walkers.push({ d, sh: R() < 0.1, t0: tt, y: rnd(GY + 10, H - 6), sp: rnd(18, 30) }); tt += rnd(1.6, 3.0); }
    for (const w of walkers) Sprites.preload(w.d, w.sh);
    if (opts.lineup) for (const d of opts.lineup) Sprites.preload(d, false);

    function draw(ctx, t, o) {
      o = o || {};
      const bands = ['#050a24', '#08103a', '#0d1a4e', '#16246a', '#23327f', '#35408f', '#4d4f9c', '#6e5aa0', '#9a6a9a', '#c8789a', '#f09a8a'];
      const bh = (GY + 4) / bands.length;
      for (let i = 0; i < bands.length; i++) { ctx.fillStyle = bands[i]; ctx.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1); }
      for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + s.p)); ctx.globalAlpha = a * Math.max(0, 1 - s.y / (GY * 0.8)); ctx.fillStyle = '#fff'; ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.s, s.s); }
      ctx.globalAlpha = 1;
      const mx = o.moonX || W - 62, my = o.moonY || 38;
      ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(mx, my, 24, 0, 6.3); ctx.fill(); ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(mx, my, 18, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff6d2'; ctx.beginPath(); ctx.arc(mx, my, 13, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#e6d9a8'; for (const [x, y, r] of [[-5, -4, 3], [5, 3, 2.4], [-1, 7, 1.6], [6, -6, 1.4]]) { ctx.beginPath(); ctx.arc(mx + x, my + y, r, 0, 6.3); ctx.fill(); }
      for (const sh of (o.shoot || [])) { const l = (t - sh[0]); if (l < 0 || l > 0.8) continue; const x = sh[1] - 150 * l, y = sh[2] + 70 * l; ctx.globalAlpha = 1 - l / 0.8; ctx.fillStyle = '#fff'; for (let i = 0; i < 12; i++) ctx.fillRect(Math.round(x + i * 2.2), Math.round(y - i), 1, 1); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#c9b8e8';
      for (const c of clouds) { const x = ((c.x + c.sp * t) % (W + 100)) - 60; ctx.globalAlpha = 0.16; ctx.fillRect(Math.round(x), Math.round(c.y), Math.round(c.w), 4); ctx.fillRect(Math.round(x + 6), Math.round(c.y - 3), Math.round(c.w * 0.5), 3); ctx.fillRect(Math.round(x + 4), Math.round(c.y + 4), Math.round(c.w * 0.7), 2); }
      ctx.globalAlpha = 1;
      for (const l of layers) ctx.drawImage(l.c, -((t * l.sp) % W), 0);
      const bx = -((t * 22) % W);
      for (const x of [bx, bx + W]) ctx.drawImage(bushes, Math.round(x), GY - 36);
      const gx = -((t * 30) % W);
      ctx.drawImage(ground, Math.round(gx), GY - 1); ctx.drawImage(ground, Math.round(gx + W), GY - 1);
      const vis = [];
      if (!o.noWalkers) for (const w of walkers) { const x = -40 + (t - w.t0) * w.sp; if (x > -40 && x < W + 40) vis.push({ d: w.d, sh: w.sh, x, y: w.y, sp: w.sp, t: (t - w.t0) * (w.sp / 22) }); }
      if (o.lineup) for (const m of o.lineup) vis.push(m);
      vis.sort((a, b) => a.y - b.y);
      for (const w of vis) {
        const a = Sprites.DEX[w.d].anim, hh = (a.walk || a.idle).h, sc = (w.scale || 1) * Math.min(1, 52 / hh);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(Math.round(w.x), Math.round(w.y), 8 * sc * (w.scale ? 1.4 : 1), 3 * sc, 0, 0, 6.3); ctx.fill();
        Sprites.draw(ctx, w.d, w.sh, w.anim || 'walk', w.angle === undefined ? 0 : w.angle, w.t, w.x, w.y, sc, {});
        if (w.sh && Math.sin(t * 6 + w.d) > 0.8) { ctx.fillStyle = '#fff6b0'; ctx.fillRect(Math.round(w.x + 8), Math.round(w.y - 30), 1, 3); ctx.fillRect(Math.round(w.x + 7), Math.round(w.y - 29), 3, 1); }
      }
      for (const f of flies) { const p = f.p + t * f.sp, x = f.x + Math.sin(p * 1.3) * 8, y = f.y + Math.cos(p) * 5; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(p * 1.7)); ctx.fillStyle = '#e8ff8a'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.globalAlpha *= 0.3; ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); }
      ctx.globalAlpha = 1;
    }
    return { draw, W, H, GY, walkers };
  }

  // espera a que estén cargadas las hojas de animación que se van a dibujar
  async function ready(list) {
    for (let i = 0; i < 600; i++) {
      if (list.every(([d, sh, a]) => Sprites.sheet(d, sh, a || 'walk'))) return true;
      await new Promise(r => setTimeout(r, 25));
    }
    return false;
  }
  function sheetsOf(walkersList) { return walkersList; }
  return { make, ready, rng, POP };
})();
