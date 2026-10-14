// Fondo animado de la pantalla de inicio: cielo estrellado, luna, montañas con parallax,
// luciérnagas y Pokémon que pasean por el camino (todo a resolución de arte y escalado pixelado).
'use strict';

const TitleFX = (() => {
  const W = 320, H = 180, GY = 160;
  let cv, ctx, raf = 0, t = 0, last = 0;
  let layers = [], ground = null, stars = [], clouds = [], flies = [], walkers = [], shoot = null, nextWalker = 0, bushes = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const POP = [25, 4, 7, 1, 133, 39, 52, 54, 63, 66, 74, 92, 94, 104, 129, 143, 147, 152, 155, 158, 175, 179, 196, 197, 252, 255, 258, 280, 303, 359, 387, 390, 393, 447, 448, 570, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912];

  function build() {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // montañas (3 capas) en lienzos de 2×ancho para desplazarlas sin cortes
    layers = [[4, '#1b2255', 78, 0.012, 1.6], [9, '#242c68', 60, 0.018, 2.2], [16, '#303a80', 42, 0.026, 2.8]].map(([sp, col, base, fr, amp], li) => {
      const c = mk(W * 2, H), g = c.getContext('2d');
      g.fillStyle = col;
      for (let x = 0; x < W * 2; x++) {
        const xx = x % W, h = base * 0.55 + Tiles.fbm(Math.cos(xx / W * 6.283) * 3 + li * 7, Math.sin(xx / W * 6.283) * 3 + li * 11, 40 + li) * base * 0.9 * amp / 2.2;
        g.fillRect(x, GY - h, 1, h + 40);
      }
      return { c, sp };
    });
    // suelo con hierba
    ground = mk(W, H - GY + 2); const g = ground.getContext('2d');
    g.fillStyle = '#3f7a3a'; g.fillRect(0, 2, W, H - GY);
    g.fillStyle = '#5cb84a'; g.fillRect(0, 0, W, 3);
    g.fillStyle = '#4caa3f'; g.fillRect(0, 3, W, 2);
    for (let x = 0; x < W; x++) for (let y = 4; y < H - GY; y++) { const r = Tiles.hash(x, y, 91); if (r < 0.05) { g.fillStyle = '#2f6a2f'; g.fillRect(x, y, 1, 1); } else if (r > 0.97) { g.fillStyle = '#7ad060'; g.fillRect(x, y, 1, 1); } }
    for (let x = 0; x < W; x += 5) { const r = Tiles.hash(x, 3, 92); if (r > 0.45) { g.fillStyle = '#6ad058'; g.fillRect(x, 0, 1, 1 - (r > 0.8 ? 1 : 0)); g.fillRect(x + 1, -1 + 0, 1, 1); } }
    // arbustos y pinos al fondo del suelo
    bushes = mk(W, 40); const b = bushes.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(i * (W / 9) + Tiles.hash(i, 5, 7) * 14), h = 16 + Math.floor(Tiles.hash(i, 6, 7) * 14);
      for (let k = 0; k < 4; k++) { b.fillStyle = ['#12331f', '#18482a', '#1f5c35', '#2a7444'][k]; const w = 12 - k * 2.4; b.beginPath(); b.moveTo(x, 40 - h + k * 5); b.lineTo(x + w, 40 - 4 - k * 1); b.lineTo(x - w, 40 - 4 - k * 1); b.closePath(); b.fill(); }
      b.fillStyle = '#3a2412'; b.fillRect(x - 1, 36, 2, 4);
    }
    stars = Array.from({ length: 90 }, () => ({ x: rnd(0, W), y: rnd(0, 100), p: rnd(0, 6.28), s: Math.random() < 0.15 ? 2 : 1 }));
    clouds = Array.from({ length: 6 }, () => ({ x: rnd(0, W), y: rnd(14, 74), w: rnd(26, 52), sp: rnd(2, 6) }));
    flies = Array.from({ length: 18 }, () => ({ x: rnd(0, W), y: rnd(GY - 40, H - 4), p: rnd(0, 6.28), sp: rnd(0.6, 1.6) }));
  }

  function spawnWalker(initial) {
    const d = POP[Math.floor(Math.random() * POP.length)];
    if (!Sprites.DEX[d]) return;
    const sh = Math.random() < 0.12;
    Sprites.preload(d, sh);
    const a = Sprites.DEX[d].anim, hh = (a.walk || a.idle).h;
    walkers.push({ d, sh, x: initial ? rnd(-10, W) : -50, y: rnd(GY + 8, H - 6), sp: rnd(16, 34), sc: Math.min(1, 52 / hh) });
  }

  function frame(now) {
    const scr = document.getElementById('scr-title');
    if (!scr || !scr.classList.contains('active')) { raf = 0; return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; t += dt;
    // cielo
    const bands = ['#050a24', '#08103a', '#0d1a4e', '#16246a', '#23327f', '#35408f', '#4d4f9c', '#6e5aa0', '#9a6a9a', '#c8789a', '#f09a8a'];
    const bh = (GY + 4) / bands.length;
    for (let i = 0; i < bands.length; i++) { ctx.fillStyle = bands[i]; ctx.fillRect(0, Math.floor(i * bh), W, Math.ceil(bh) + 1); }
    for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + s.p)); ctx.globalAlpha = a * (1 - s.y / 130); ctx.fillStyle = '#fff'; ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.s, s.s); }
    ctx.globalAlpha = 1;
    // luna
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(258, 38, 24, 0, 6.3); ctx.fill(); ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(258, 38, 18, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6d2'; ctx.beginPath(); ctx.arc(258, 38, 13, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#e6d9a8'; for (const [x, y, r] of [[253, 34, 3], [263, 41, 2.4], [257, 45, 1.6], [264, 32, 1.4]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill(); }
    // estrella fugaz
    if (!shoot && Math.random() < dt * 0.12) shoot = { x: rnd(60, 240), y: rnd(4, 40), l: 0.8 };
    if (shoot) { shoot.l -= dt; shoot.x -= 150 * dt; shoot.y += 70 * dt; ctx.globalAlpha = Math.max(0, shoot.l); ctx.fillStyle = '#fff'; for (let i = 0; i < 9; i++) ctx.fillRect(Math.round(shoot.x + i * 2.2), Math.round(shoot.y - i), 1, 1); ctx.globalAlpha = 1; if (shoot.l <= 0) shoot = null; }
    // nubes
    ctx.fillStyle = '#c9b8e8';
    for (const c of clouds) { c.x += c.sp * dt; if (c.x > W + 40) c.x = -60; ctx.globalAlpha = 0.16; ctx.fillRect(Math.round(c.x), Math.round(c.y), Math.round(c.w), 4); ctx.fillRect(Math.round(c.x + 6), Math.round(c.y - 3), Math.round(c.w * 0.5), 3); ctx.fillRect(Math.round(c.x + 4), Math.round(c.y + 4), Math.round(c.w * 0.7), 2); }
    ctx.globalAlpha = 1;
    // montañas
    for (const l of layers) ctx.drawImage(l.c, -((t * l.sp) % W), 0);
    // pinos
    const bx = -((t * 22) % W);
    for (const x of [bx, bx + W]) ctx.drawImage(bushes, Math.round(x), GY - 36);
    // suelo
    const gx = -((t * 30) % W);
    ctx.drawImage(ground, Math.round(gx), GY - 1); ctx.drawImage(ground, Math.round(gx + W), GY - 1);
    // Pokémon caminando (ordenados por profundidad)
    nextWalker -= dt; if (nextWalker <= 0) { spawnWalker(false); nextWalker = rnd(2.2, 4.2); }
    walkers.sort((a, b) => a.y - b.y);
    for (let i = walkers.length - 1; i >= 0; i--) {
      const w = walkers[i]; w.x += w.sp * dt;
      if (w.x > W + 50) { walkers.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(Math.round(w.x), Math.round(w.y), 8 * w.sc, 3 * w.sc, 0, 0, 6.3); ctx.fill();
      Sprites.draw(ctx, w.d, w.sh, 'walk', 0, t * (w.sp / 22), w.x, w.y, w.sc, {});
      if (w.sh && Math.sin(t * 6 + w.d) > 0.8) { ctx.fillStyle = '#fff6b0'; ctx.fillRect(Math.round(w.x + 8), Math.round(w.y - 30), 1, 3); ctx.fillRect(Math.round(w.x + 7), Math.round(w.y - 29), 3, 1); }
    }
    // luciérnagas
    for (const f of flies) { f.p += dt * f.sp; const x = f.x + Math.sin(f.p * 1.3) * 8, y = f.y + Math.cos(f.p) * 5; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(f.p * 1.7)); ctx.fillStyle = '#e8ff8a'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.globalAlpha *= 0.3; ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  function start(canvas) {
    cv = canvas; cv.width = W; cv.height = H; ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    if (!layers.length) build();
    if (!walkers.length) for (let i = 0; i < 5; i++) spawnWalker(true);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  return { start };
})();
