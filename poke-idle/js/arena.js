// Arena de combate en canvas: fondo pixel art de la ruta, tu equipo a la izquierda,
// el Pokémon salvaje (o el jefe) a la derecha, proyectiles, números de daño y monedas.
'use strict';

const Arena = (() => {
  const W = 240, H = 144, TS = 16;
  const POS = [[90, 104], [60, 76], [60, 132], [34, 104], [18, 70], [18, 136]];
  const EX = 178, EY = 106;
  let cv, ctx, t = 0;
  const shots = [], texts = [], fx = [], coins = [], beams = [];
  const lunge = {};          // slot -> { t0, dur, dx }
  const bgCache = new Map();
  const anim = {};           // slot -> { a: 'attack', t0 }
  let enemyAnim = { a: 'idle', t0: 0 }, enemyFlash = 0, enemyIn = 0, enemyDie = null, shake = 0;
  let onCoinFly = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function init(canvas, coinCb) {
    cv = canvas; cv.width = W; cv.height = H;
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    onCoinFly = coinCb;
    Core.on('spawn', e => { enemyIn = 0.45; enemyDie = null; enemyAnim = { a: 'walk', t0: t }; Sprites.preload(e.dex, false); });
    Core.on('fire', d => {
      anim[d.slot] = { a: 'attack', t0: t };
      const p = POS[d.slot], m = Core.S.mons[Core.S.team[d.slot]];
      if (!m) return;
      const mv = MOVES[d.move] || { cls: 'proj' }, look = VFX.forMove(d.move), big = d.tier >= 3 || m.stars >= 3;
      const sx = p[0] + 8, sy = p[1] - 12, tx = EX - 6, ty = EY - 14;
      const shot = (o) => shots.push(Object.assign({ x: sx, y: sy, tx, ty: ty + rand(-6, 6), t: 0, dur: d.delay, look, big }, o));
      switch (mv.cls) {
        case 'fan': case 'orbit': case 'aura': case 'chain': case 'mines': for (let i = -1; i <= 1; i++) shot({ ty: ty + i * 12, big: false }); break;
        case 'burst': for (let i = -2; i <= 2; i++) shot({ ty: ty + i * 8, tx: tx + rand(-6, 6), big: false, dur: d.delay * rand(0.8, 1.1) }); break;
        case 'beam': beams.push({ x: sx, y: sy, tx, ty, t: 0, dur: 0.4, look }); break;
        case 'meteor': for (let i = 0; i < 3; i++) shot({ x: tx + rand(-26, 26), y: -14 - i * 10, tx: tx + rand(-8, 8), ty: ty + rand(-4, 8), dur: d.delay * (0.7 + i * 0.15), big: true }); break;
        case 'dash': lunge[d.slot] = { t0: t, dur: 0.34, dx: Math.min(80, tx - p[0] - 14) }; fx.push({ vfx: 'impact', pal: look.pal, x: tx, y: ty, life: 0.3, max: 0.3, delay: d.delay }); break;
        case 'melee': lunge[d.slot] = { t0: t, dur: 0.3, dx: Math.min(60, tx - p[0] - 20) }; fx.push({ vfx: look.melee, pal: look.pal, x: tx - 4, y: ty, life: 0.3, max: 0.3, delay: d.delay }); break;
        default: shot({});
      }
    });
    Core.on('hit', h => {
      const e = Core.F.enemy;
      if (!e) return;
      enemyFlash = A11Y.noFlash() ? 0 : 0.08;
      enemyAnim = { a: 'hurt', t0: t };
      if (Core.S.settings.nums) {
        const cls = h.crit ? 'crit' : h.src === -1 ? 'tap' : h.ef >= 2 ? 'eff' : h.ef < 1 ? 'weak' : '';
        popup(Core.fmt(h.dmg) + (h.crit ? '!' : ''), cls, EX + rand(-16, 16), EY - 34 * (e.boss ? 1.5 : 1) + rand(-8, 4));
      }
      for (let i = 0; i < (h.crit ? 8 : 3); i++) fx.push({ x: EX + rand(-6, 6), y: EY - 14 + rand(-8, 8), vx: rand(-60, 60), vy: rand(-60, 20), life: 0.3, max: 0.3, c: h.crit ? '#ffd23f' : '#ffffff', s: rand(1, 2.5) });
      if (h.crit) shake = 0.12;
    });
    Core.on('kill', k => {
      enemyDie = { e: k.enemy, t: 0.5 };
      const n = k.coins ? Math.min(10, 2 + Math.floor(Math.log10(k.coins + 1) * 2) + (k.enemy.boss ? 8 : 0)) : 0;
      for (let i = 0; i < n; i++) coins.push({ x: EX + rand(-8, 8), y: EY - 10, vx: rand(-70, 50), vy: rand(-120, -50), t: 0, land: EY + rand(4, 16), fly: 0.55 + i * 0.03 });
      if (k.enemy.boss) shake = 0.4;
      if (Core.S.settings.nums && k.coins) popup('+' + Core.fmt(k.coins), 'coin', EX + rand(-10, 10), EY - 54);
      if (k.gems) popup('+' + k.gems + L(' gemas', ' gems'), 'gem', EX, EY - 74);
      if (k.egg !== null && k.egg !== undefined) popup('+ ' + EGGS[k.egg].name, 'tk', EX, EY - 114);
      if (k.item) popup('+ ' + HELD[k.item.id].name, 'tk', EX, EY - 130);
      if (k.tickets) { let y = 94; for (const [tk, n] of Object.entries(k.tickets)) { popup('+' + n + ' ' + TICKETS[tk].name, 'tk', EX, EY - y); y += 16; } }
    });
  }

  // ---------------- fondo de la ruta ----------------
  function background(ri) {
    if (bgCache.has(ri)) return bgCache.get(ri);
    const r = ROUTES[ri], bi = r.biome, seed = 7 + ri * 31;
    const cols = W / TS + 0, rows = H / TS;
    const water = r.top === 'water';
    const liquid = new Set();
    for (let x = 0; x < cols; x++) {
      const depth = water ? 2 + (Tiles.hash(Math.floor(x / 4), 0, seed) > 0.5 ? 1 : 0) : 0;
      for (let y = 0; y < depth; y++) liquid.add(x + ',' + y);
    }
    if (bi === 5 || bi === 3) for (const [x, y] of [[0, 8], [1, 8], [0, 7], [13, 8], [14, 8], [14, 7]]) liquid.add(x + ',' + y);
    const at = (x, y) => x < 0 || y < 0 || x >= cols || y >= rows ? 'floor' : liquid.has(x + ',' + y) ? 'liquid' : 'floor';
    const base = Tiles.paintRoom(cols, rows, at, bi, seed);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(base, 0, 0);
    const props = [];
    const H2 = (a, b) => Tiles.hash(a, b, seed + 5);
    // borde superior (árboles, rocas, tumbas…)
    if (!water) for (let x = -8; x < W + 16; x += 22) {
      const kind = r.top === 'rocks' ? (H2(x, 1) > 0.5 ? 'rock' : 'tree') : r.top === 'tombs' ? (H2(x, 1) > 0.45 ? 'tomb' : 'tree') : 'tree';
      props.push({ k: kind, x: x + Math.floor(H2(x, 2) * 8), y: 34 + Math.floor(H2(x, 3) * 8), v: Math.floor(H2(x, 4) * 3) });
    }
    // hierba y rocas sueltas, lejos de los combatientes
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(H2(i, 9) * W), y = 50 + Math.floor(H2(i, 10) * (H - 54));
      if (x > 6 && x < 104 && y > 62 && y < 140) continue;
      if (x > 146 && x < 214 && y > 66 && y < 128) continue;
      props.push({ k: H2(i, 11) > 0.25 ? 'grass' : 'rock', x, y, v: Math.floor(H2(i, 12) * 2) });
    }
    props.sort((a, b) => a.y - b.y);
    for (const p of props) {
      const img = Tiles.propSprite(bi, p.k, p.k === 'grass' ? 0 : p.v);
      g.drawImage(img, Math.round(p.x - img.width / 2), Math.round(p.y - img.height));
    }
    // viñeta suave
    const grd = g.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 165);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,10,0.45)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    const cells = [...liquid].map(k => k.split(',').map(Number));
    const out = { img: c, cells, bi };
    bgCache.set(ri, out);
    return out;
  }

  function addText(x, y, v, c, big) { popup(v, big ? 'crit' : '', x, y); }
  // números flotantes como elementos HTML: nítidos, grandes y con animación propia
  function popup(text, cls, x, y) {
    const layer = document.getElementById('dmg-layer');
    if (!layer) return;
    while (layer.childElementCount > 26) layer.firstChild.remove();
    const el = document.createElement('span');
    el.className = 'dn ' + (cls || '');
    el.textContent = text;
    el.style.left = (x / W * 100) + '%'; el.style.top = (y / H * 100) + '%';
    el.style.setProperty('--dx', Math.round(rand(-22, 22)) + 'px');
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), r, r * 0.38, 0, 0, 6.3); ctx.fill(); }

  function update(dt) {
    t += dt;
    if (enemyIn > 0) enemyIn = Math.max(0, enemyIn - dt);
    if (enemyFlash > 0) enemyFlash -= dt;
    if (shake > 0) shake -= dt;
    if (enemyDie) enemyDie.t -= dt;
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; if (s.t >= s.dur) { shots.splice(i, 1); fx.push({ vfx: 'impact', pal: s.look.pal, x: s.tx, y: s.ty, life: 0.18, max: 0.18 }); } }
    for (let i = texts.length - 1; i >= 0; i--) { texts[i].t -= dt; texts[i].y -= dt * 22; if (texts[i].t <= 0) texts.splice(i, 1); }
    for (let i = beams.length - 1; i >= 0; i--) { beams[i].t += dt; if (beams[i].t >= beams[i].dur) beams.splice(i, 1); }
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; if (f.delay > 0) { f.delay -= dt; continue; } f.life -= dt; if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 200 * dt; } if (f.life <= 0) fx.splice(i, 1); }
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]; c.t += dt;
      if (c.t < c.fly) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 380 * dt; if (c.y > c.land) { c.y = c.land; c.vy *= -0.4; c.vx *= 0.6; } }
      else { coins.splice(i, 1); if (onCoinFly) onCoinFly(c.x / W, c.y / H); }
    }
  }

  function draw() {
    const S = Core.S;
    if (!S) return;
    const ri = Core.route(S.stage) % ROUTES.length;
    const bg = background(ri);
    ctx.save();
    if (shake > 0 && S.settings.shake !== false && !A11Y.reduced()) ctx.translate(Math.round(rand(-2, 2)), Math.round(rand(-2, 2)));
    ctx.drawImage(bg.img, 0, 0);
    if (bg.cells.length) Tiles.liquidSparkles(ctx, bg.cells, bg.bi, t);
    ctx.globalAlpha = 1;

    const list = [];
    S.team.forEach((k, i) => list.push({ y: POS[i][1], f: () => drawMon(i, k) }));
    const e = Core.F.enemy;
    if (e) list.push({ y: EY, f: () => drawEnemy(e, false) });
    else if (enemyDie && enemyDie.t > 0) list.push({ y: EY, f: () => drawEnemy(enemyDie.e, true) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.f());

    for (const s of shots) {
      const k = s.t / s.dur;
      const x = s.x + (s.tx - s.x) * k, y = s.y + (s.ty - s.y) * k - Math.sin(k * Math.PI) * 10;
      const ang = Math.atan2(s.ty - s.y, s.tx - s.x);
      const sh = s.look.proj;
      VFX.draw(ctx, sh, s.look.pal, x, y, { angle: VFX.isDir(sh) ? ang : VFX.spins(sh) ? t * 12 : 0, frame: Math.floor(t * 12), scale: s.big ? 1.2 : 0.85 });
    }
    for (const bm of beams) {
      const k = 1 - bm.t / bm.dur, len = Math.hypot(bm.tx - bm.x, bm.ty - bm.y), ang = Math.atan2(bm.ty - bm.y, bm.tx - bm.x), sh = bm.look.beam;
      for (let d = 6; d < len; d += 9) VFX.draw(ctx, sh, bm.look.pal, bm.x + Math.cos(ang) * d, bm.y + Math.sin(ang) * d, { angle: VFX.isDir(sh) ? ang : 0, frame: Math.floor(t * 14 + d), scale: 0.7 + 0.25 * Math.sin(t * 30 + d), alpha: Math.min(1, k * 2) });
    }
    ctx.globalAlpha = 1;
    for (const f of fx) {
      if (f.delay > 0) continue;
      const k = f.life / f.max;
      if (f.vfx) { VFX.draw(ctx, f.vfx, f.pal, f.x, f.y, { scale: 1 + (1 - k) * 0.5, frame: Math.floor((1 - k) * 4), alpha: Math.min(1, k * 2) }); continue; }
      ctx.globalAlpha = k; ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), Math.ceil(f.s), Math.ceil(f.s));
    }
    ctx.globalAlpha = 1;
    for (const c of coins) {
      const w = Math.max(1, Math.round(Math.abs(Math.cos(t * 10 + c.x)) * 3));
      ctx.fillStyle = '#7a5a00'; ctx.fillRect(Math.round(c.x) - w, Math.round(c.y) - 3, w * 2, 6);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(Math.round(c.x) - w + 1, Math.round(c.y) - 2, Math.max(1, w * 2 - 2), 4);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawMon(i, key) {
    const m = Core.S.mons[key];
    if (!m) return;
    let [x, y] = POS[i];
    const lg = lunge[i];
    if (lg) { const k = (t - lg.t0) / lg.dur; if (k >= 1) delete lunge[i]; else x += Math.sin(k * Math.PI) * lg.dx; }
    const a = anim[i];
    let an = 'idle', at = t + i * 0.37;
    if (a && t - a.t0 < Sprites.animLen(Core.fdex(m), 'attack')) { an = 'attack'; at = t - a.t0; }
    const bob = an === 'idle' ? 0 : 0;
    shadow(x, y + 1, 7);
    if (m.stars >= 3) { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 4 + i); ctx.fillStyle = RARITY[Core.RAR[m.dex]].color; ctx.beginPath(); ctx.ellipse(x, y, 11, 4, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
    Sprites.draw(ctx, Core.fdex(m), m.shiny, an, lg ? 0 : 0, at, x, y + bob, 1, {});
    if (m.shiny && Math.sin(t * 3 + i) > 0.9) { ctx.fillStyle = '#fff6b0'; ctx.fillRect(x + 6, y - 22, 1, 3); ctx.fillRect(x + 5, y - 21, 3, 1); }
  }

  function drawEnemy(e, dying) {
    const an0 = Core.DEX[e.dex].anim, hh = (an0.idle || an0.walk).h;
    const sc = e.boss ? Math.min(BOSS_TIER[e.tier].scale, Math.max(0.8, 76 / hh)) : Math.min(1, Math.max(0.6, 62 / hh));
    const slide = enemyIn > 0 ? enemyIn / 0.45 : 0;
    const x = EX + slide * 90, y = EY;
    shadow(x, y + 1, 8 * sc);
    let alpha = 1, an = enemyAnim.a, at = t - enemyAnim.t0;
    if (dying) { alpha = Math.max(0, enemyDie.t / 0.5); an = 'hurt'; at = 0.1; }
    else if (an !== 'idle' && an !== 'walk' && at > Sprites.animLen(e.dex, an)) { an = 'idle'; at = t; }
    else if (an === 'walk' && slide === 0) { an = 'idle'; at = t; }
    if (e.boss && e.tier >= 3) { ctx.globalAlpha = 0.16 + 0.08 * Math.sin(t * 3); ctx.fillStyle = e.tier >= 5 ? '#ff5f6d' : e.tier === 4 ? '#c47bff' : '#ffd23f'; ctx.beginPath(); ctx.ellipse(x, y - 4, 26 * sc / 2, 12 * sc / 2, 0, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
    if (e.golden) { ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 6); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, y - 12, 18, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
    Sprites.draw(ctx, e.dex, !!e.golden, an, Math.PI, at, x, y - (dying ? (1 - alpha) * 8 : 0), sc, { alpha, flash: enemyFlash > 0 && !dying });
  }

  function frame(dt) { update(dt); draw(); }
  // posición (0..1) del enemigo en pantalla, para la barra de vida en HTML
  const enemyAnchor = () => ({ x: EX / W, y: (EY - 40) / H });
  return { init, frame, enemyAnchor, addText, popup, W, H };
})();
