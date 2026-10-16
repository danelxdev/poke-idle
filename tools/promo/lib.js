// Utilidades para grabar el juego real fotograma a fotograma (tiempo virtual: reloj de Playwright
// para JS/rAF y avance manual de las animaciones CSS), de modo que cada vídeo sale idéntico y fluido.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const FPS = 30;

async function open(opts = {}) {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-gpu-vsync'] });
  const w = opts.w || +process.env.PVW || 390, h = opts.h || +process.env.PVH || 844, mob = opts.mobile !== false;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: opts.dpr || 2, hasTouch: mob, isMobile: mob, locale: opts.locale || 'es-ES' });
  await ctx.clock.install({ time: new Date('2026-10-12T18:00:00Z') });
  await ctx.clock.pauseAt(new Date('2026-10-12T18:00:01Z'));   // el tiempo solo avanza cuando lo pedimos
  const pg = await ctx.newPage();
  pg.on('pageerror', e => console.error('PAGEERR', e.message));
  await pg.goto('file://' + ROOT + '/' + (opts.page || 'index.html'));
  await settle(pg, 900);
  return { b, ctx, pg };
}
// avanza el reloj virtual dejando tiempo real para cargar imágenes
async function settle(pg, ms) { for (let t = 0; t < ms; t += 100) { await pg.clock.runFor(100); await stepCss(pg, 100); await pg.waitForTimeout(25); } }
async function stepCss(pg, dt) {
  await pg.evaluate(dt => {
    const W = window.__vt || (window.__vt = new WeakMap());
    for (const a of document.getAnimations()) {
      if (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) { try { a.finish(); } catch (e) {} continue; }   // las transiciones cortas se dan por acabadas
      let v = W.get(a); if (v === undefined) v = 0; else v += dt;
      W.set(a, v); a.pause(); try { a.currentTime = v; } catch (e) {}
    }
  }, dt);
}
async function startGame(pg, starter) {
  await pg.evaluate(() => document.querySelector('#btn-start').click()); await settle(pg, 400);
  await pg.evaluate(d => document.querySelector(`[data-d="${d}"]`).click(), starter || 4); await settle(pg, 900);
  for (const sel of ['#w-ok', '#tut-skip']) { if (await pg.$(sel) && await pg.isVisible(sel)) { await pg.evaluate(s => document.querySelector(s).click(), sel); await settle(pg, 300); } }
}
// graba n fotogramas a 30 fps; hook(i) se ejecuta antes de cada uno
async function rec(pg, dir, n, hook, opts = {}) {
  if (process.env.MAXF) n = Math.min(n, +process.env.MAXF);   // para sacar solo las primeras (fotos fijas)
  require('fs').mkdirSync(dir, { recursive: true });
  let acc = 0;
  for (let i = 0; i < n; i++) {
    if (hook) await hook(i);
    const next = Math.round((i + 1) * 1000 / FPS), dt = next - acc; acc = next;
    await pg.clock.runFor(dt); await stepCss(pg, dt);
    if (opts.wait) await pg.waitForTimeout(opts.wait);
    await pg.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 93, clip: opts.clip });
  }
}
module.exports = { open, settle, stepCss, startGame, rec, ROOT, FPS };
// partida de mitad de juego vistosa: 6 huecos, equipo conocido, mucho progreso
async function setupMid(pg, team, opts = {}) {
  await startGame(pg, 4);
  if (await pg.$('#tut-skip')) { await pg.evaluate(() => document.querySelector('#tut-skip').click()); await settle(pg, 300); }
  await pg.evaluate(([team, o]) => { const C = PokeIdle.Core, S = C.S; S.slots = 6; S.maxStage = o.max || 1400; S.stats.maxStage = S.maxStage; S.coins = 4.2e12; S.gems = 3820; S.tutDone = true;
    for (const d of team) C.addMon(d, (o.shiny || []).includes(d));
    S.team = team.map(String); for (const k of S.team) { S.mons[k].lvl = o.lvl || 900; S.mons[k].stars = o.stars || 4; }
    if (o.dexN) for (const d of C.BASES.slice(0, o.dexN)) if (!S.mons[d]) { C.addMon(d, false); S.mons[d].lvl = 20 + (d * 7) % 60; }
    S.team = team.map(String);
    PokeIdle.UI.refresh(true); }, [team, opts]);
  await settle(pg, 400);
}
module.exports.setupMid = setupMid;
