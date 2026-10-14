// Modo manual (opcional): controlas al Pokémon líder y esquivas los ataques del rival.
// Mientras no te alcancen, un combo sube el daño de todo el equipo (hasta +60%).
// Si te hieren 3 veces quedas aturdido unos segundos y el juego vuelve a ser automático.
'use strict';

const Manual = (() => {
  const W = 240, X0 = 12, X1 = 226, Y0 = 62, Y1 = 138;
  const MAX_HP = 3, COMBO_STEP = 3, COMBO_MAX = 5, COMBO_BONUS = 0.12, STUN = 12;
  const st = { on: false, x: 60, y: 104, hp: MAX_HP, inv: 0, dash: 0, dashCd: 0, dashDir: [1, 0], combo: 0, stunT: 0, enemy: null, cd: 1, pat: 0 };
  let bullets = [], keys = {}, target = null, el = null, lastHud = '';
  const $ = s => document.querySelector(s);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const level = () => Math.min(COMBO_MAX, Math.floor(st.combo / COMBO_STEP));
  const mult = () => 1 + COMBO_BONUS * level();

  function set(on) {
    if (on && st.stunT > 0) return false;
    st.on = on;
    bullets = []; target = null; keys = {};
    if (on) { st.hp = MAX_HP; st.combo = 0; st.inv = 0.8; st.x = 60; st.y = 104; }
    else Core.setExtMult(1);
    paintHud(true);
    return on;
  }

  // ---- ataques del rival ----
  function shoot(x, y, ang, sp, col, r) { if (bullets.length < 90) bullets.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, col, r: r || 3, g: false }); }
  function attack(e) {
    const ox = Arena.EX - 6, oy = Arena.EY - 16, col = TYPE_COLORS[e.types[0]] || '#ffffff';
    const aim = Math.atan2(st.y - 10 - oy, st.x - ox), sp = 46 + (e.boss ? 5 * e.tier : 0);
    if (!e.boss) {                                         // salvajes: un disparo, a veces abanico
      st.pat++;
      if (st.pat % 4 === 0) for (let i = -1; i <= 1; i++) shoot(ox, oy, aim + i * 0.28, sp, col);
      else shoot(ox, oy, aim, sp, col);
      st.cd = 1.7; return;
    }
    const k = st.pat++ % 4, T = e.tier;
    if (k === 0) { const n = 2 + Math.min(3, T); for (let i = 0; i < n; i++) shoot(ox, oy, aim + (i - (n - 1) / 2) * 0.22, sp + 8, col, 3.5); }
    else if (k === 1) { const n = 8 + 2 * T, off = rnd(0, 6.28); for (let i = 0; i < n; i++) shoot(ox, oy, off + i / n * 6.283, sp - 6, col, 3); }
    else if (k === 2) { const gap = rnd(Y0 + 8, Y1 - 8); for (let y = Y0 - 4; y <= Y1 + 8; y += 11) if (Math.abs(y - gap) > 14) shoot(W + 4, y, Math.PI, sp - 8, col, 3); }
    else { for (let i = 0; i < 5; i++) setTimeout(() => { if (st.on && Core.F.enemy === e) shoot(ox, oy, Math.atan2(st.y - 10 - oy, st.x - ox) + rnd(-0.1, 0.1), sp + 18, col, 3); }, i * 170); }
    st.cd = Math.max(0.85, 1.6 - 0.12 * T);
  }

  function hurt() {
    st.hp--; st.combo = 0; st.inv = 1.3;
    Audio8.play('death');
    if (st.hp <= 0) { set(false); st.stunT = STUN; if (window.UI) UI.toast('¡Aturdido! El equipo vuelve al modo automático unos segundos'); }
  }

  function update(dt) {
    if (st.stunT > 0) st.stunT = Math.max(0, st.stunT - dt);
    if (!st.on || Core.isPaused()) { paintHud(); return; }
    const e = Core.F.enemy;
    if (e !== st.enemy) { st.enemy = e; bullets = []; st.cd = 1.2; }
    if (st.inv > 0) st.inv -= dt;
    if (st.dashCd > 0) st.dashCd -= dt;
    // movimiento
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (!dx && !dy && target) { const tx = target.x - st.x, ty = target.y - st.y, d = Math.hypot(tx, ty); if (d > 2) { dx = tx / d; dy = ty / d; } }
    const len = Math.hypot(dx, dy);
    if (len) { dx /= len; dy /= len; st.dashDir = [dx, dy]; }
    let sp = 78;
    if (st.dash > 0) { st.dash -= dt; sp = 260; dx = st.dashDir[0]; dy = st.dashDir[1]; }
    st.x = clamp(st.x + dx * sp * dt, X0, X1); st.y = clamp(st.y + dy * sp * dt, Y0, Y1);
    if (!e) { Core.setExtMult(1); paintHud(); return; }
    // combo y bonus
    st.combo += dt;
    Core.setExtMult(mult());
    // ataques y balas
    st.cd -= dt; if (st.cd <= 0) attack(e);
    const px = st.x, py = st.y - 10;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > 160) { bullets.splice(i, 1); continue; }
      const d = Math.hypot(b.x - px, b.y - py);
      if (d < b.r + 3 && st.inv <= 0 && st.dash <= 0) { bullets.splice(i, 1); hurt(); if (!st.on) return; }
      else if (d < b.r + 11 && !b.g) { b.g = true; st.combo += 0.7; }     // roce: acelera el combo
    }
    paintHud();
  }

  function over(ctx, t) {
    if (!st.on) return;
    for (const b of bullets) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = b.col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1, 0, 6.3); ctx.fill();
      ctx.strokeStyle = b.col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.stroke();
    }
    const px = Math.round(st.x), py = Math.round(st.y - 10);
    ctx.strokeStyle = st.inv > 0 ? 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(t * 30)) + ')' : 'rgba(120,255,160,0.8)';
    ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px, Math.round(st.y), 9, 3.5, 0, 0, 6.3); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(px - 1, py - 1, 3, 3);
    ctx.fillStyle = '#ff3b5c'; ctx.fillRect(px, py, 1, 1);
  }

  function paintHud(force) {
    if (!el) return;
    const lv = level();
    const key = [st.on, st.hp, lv, st.stunT > 0 ? Math.ceil(st.stunT) : 0, st.dashCd > 0].join();
    if (!force && key === lastHud) return;
    lastHud = key;
    $('#btn-manual').classList.toggle('on', st.on);
    $('#btn-manual').textContent = st.stunT > 0 ? 'Aturdido ' + Math.ceil(st.stunT) + 's' : st.on ? 'Manual: ON' : 'Manual';
    $('#btn-manual').disabled = st.stunT > 0;
    el.classList.toggle('hidden', !st.on);
    if (!st.on) return;
    el.querySelector('.man-hp').innerHTML = Array.from({ length: MAX_HP }, (_, i) => '<i class="' + (i < st.hp ? 'full' : '') + '">♥</i>').join('');
    el.querySelector('.man-combo').textContent = lv ? 'Combo ×' + lv + ' · +' + Math.round(lv * COMBO_BONUS * 100) + '% daño' : 'Esquiva para subir el combo';
    $('#man-dash').classList.toggle('cd', st.dashCd > 0);
  }

  function dash() { if (st.on && st.dashCd <= 0 && st.dash <= 0) { st.dash = 0.16; st.dashCd = 1.6; st.inv = Math.max(st.inv, 0.25); } }

  function toArt(ev) {
    const r = $('#cv').getBoundingClientRect();
    return { x: clamp((ev.clientX - r.left) / r.width * W, X0, X1), y: clamp((ev.clientY - r.top) / r.height * 144 + 12, Y0, Y1) };
  }

  function init() {
    el = $('#man-hud');
    Arena.hooks.pos = () => (st.on ? [st.x, st.y] : null) || [90, 104];
    Arena.hooks.over = over;
    const arena = $('#arena');
    arena.addEventListener('pointerdown', ev => { if (!st.on || ev.target.closest('button')) return; target = toArt(ev); arena.setPointerCapture && arena.setPointerCapture(ev.pointerId); });
    arena.addEventListener('pointermove', ev => { if (st.on && target) target = toArt(ev); });
    const up = () => { target = null; };
    arena.addEventListener('pointerup', up); arena.addEventListener('pointercancel', up);
    $('#btn-manual').onclick = () => { Audio8.resume(); set(!st.on); };
    $('#man-dash').onclick = dash;
    const map = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
    window.addEventListener('keydown', ev => {
      if (ev.target && /INPUT|TEXTAREA/.test(ev.target.tagName)) return;
      if (ev.key === 'm' || ev.key === 'M') { set(!st.on); return; }
      if (!st.on) return;
      if (ev.key === ' ') { ev.preventDefault(); dash(); }
      else if (map[ev.key]) { ev.preventDefault(); keys[map[ev.key]] = true; }
    });
    window.addEventListener('keyup', ev => { if (map[ev.key]) keys[map[ev.key]] = false; });
    paintHud(true);
  }

  return { init, update, set, get on() { return st.on; } };
})();
