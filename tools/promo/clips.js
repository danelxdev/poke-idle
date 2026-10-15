// Graba las escenas reales del juego para el vídeo: node clips.js <salida> <escena>
const L = require('./lib'); const O = process.argv[2], which = process.argv[3];
const TEAM = [6, 25, 150, 658, 448, 94];
const tapAt = (pg, x, y) => pg.evaluate(([x, y]) => { const a = document.querySelector('#arena'); for (const t of ['pointerdown', 'pointerup']) a.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true })); }, [x, y]);
const enemyPos = pg => pg.evaluate(() => { const r = document.querySelector('#cv').getBoundingClientRect(); return [r.left + r.width * 178 / 240, r.top + r.height * 92 / 144]; });
const S = {
  async boss() {    // jefe legendario: Rayquaza en el Pilar Celeste (la vida baja de forma controlada para que dure)
    const { b, pg } = await L.open({ dpr: 3 }); await L.setupMid(pg, TEAM);
    await pg.evaluate(() => PokeIdle.Core.goStage(1289)); await L.settle(pg, 800);
    await pg.evaluate(() => PokeIdle.Core.goStage(1290));
    const [ex, ey] = await enemyPos(pg);
    await L.rec(pg, O + '/boss', 230, async i => {
      await pg.evaluate(i => { const e = PokeIdle.Core.F.enemy; if (!e || !e.boss) return; const f = i < 30 ? 1 : 1 - (i - 30) / 125; if (f > 0.02) e.hp = e.max * f; else e.hp = Math.min(e.hp, 1); }, i);
      if (i > 34 && i < 160 && i % 7 === 0) await tapAt(pg, ex + (i % 4) * 5, ey - 10 - (i % 5) * 5);
      if (i === 60) await pg.keyboard.press('q');
    });
    await b.close();
  },
  async gacha() {   // Bola Destacada: tirada x10 con legendario (pity a punto)
    for (const n of [10, 1]) {
      const { b, pg } = await L.open({ dpr: 3 }); await L.setupMid(pg, [6, 25, 658, 448, 94, 130], { dexN: 120 });
      await pg.evaluate(() => { const S = PokeIdle.Core.S; delete S.mons[150]; delete S.seen[150]; S.tk.ultra = 50; S.pity = 89; S.bannerLost = 1; PokeIdle.UI.setTab('gacha'); });
      for (let w = 0; w < 60; w++) { await pg.clock.setSystemTime(new Date(Date.UTC(2026, 9, 12 + w * 7, 18))); if (await pg.evaluate(() => PokeIdle.Core.featuredLegend() === 150)) break; }
      await L.settle(pg, 500);
      await pg.evaluate(n => { const el = document.querySelector(`[data-act="pull"][data-v="banner"][data-n="${n}"]`); el.scrollIntoView({ block: 'center' }); }, n);
      await L.settle(pg, 300);
      await L.rec(pg, O + '/gacha' + n, 230, async i => { if (i === 12) await pg.evaluate(n => document.querySelector(`[data-act="pull"][data-v="banner"][data-n="${n}"]`).click(), n); });
      await b.close();
    }
  },
  async fight() {
    const { b, pg } = await L.open({ dpr: 3 }); await L.setupMid(pg, TEAM);
    await pg.evaluate(() => PokeIdle.Core.goStage(285)); await L.settle(pg, 1500);
    const [ex, ey] = await enemyPos(pg);
    await L.rec(pg, O + '/fight', 180, async i => { if (i % 9 === 0 && i > 6) await tapAt(pg, ex + (i % 3) * 6, ey - (i % 5) * 4); if (i === 50) await pg.keyboard.press('q'); if (i === 95) await pg.keyboard.press('w'); });
    await b.close();
  },
  async dex() {     // Pokédex: desplazamiento suave por cientos de Pokémon
    const { b, pg } = await L.open({ dpr: 3 }); await L.setupMid(pg, TEAM, { dexN: 5000 });
    await pg.evaluate(() => { const S = PokeIdle.Core.S; for (const p of POKEDEX) S.seen[p.dex] = 1; let k = 0; for (const d in S.mons) if (++k % 11 === 0) { S.mons[d].shinyOwned = true; } PokeIdle.UI.setTab('dex'); });
    await L.settle(pg, 1500);
    await L.rec(pg, O + '/dex', 180, async i => { await pg.evaluate(i => { const t = document.querySelector('#tab-body') || document.querySelector('.tab-body'); const e = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; t.scrollTop = e(Math.min(1, i / 170)) * 2600; }, i); }, { wait: 30 });
    await b.close();
  },
  async map() {
    const { b, pg } = await L.open({ dpr: 3 }); await L.setupMid(pg, TEAM);
    await pg.evaluate(() => PokeIdle.Core.goStage(285)); await L.settle(pg, 800);
    await pg.evaluate(() => PokeIdle.UI.mapModal()); await L.settle(pg, 300);
    await L.rec(pg, O + '/map', 120);
    await b.close();
  },
  async evo() {
    const { b, pg } = await L.open({ dpr: 3 }); await L.setupMid(pg, TEAM);
    await pg.evaluate(() => PokeIdle.Core.goStage(285)); await L.settle(pg, 800);
    await L.rec(pg, O + '/evo', 260, async i => { if (i === 5) await pg.evaluate(() => PokeIdle.UI.evolveAnim(129, 130, false)); });
    await b.close();
  },
  async title() {
    const { b, pg } = await L.open({ dpr: 3 }); await L.settle(pg, 2500);
    await L.rec(pg, O + '/title', 150);
    await b.close();
  },
};
S[which]().catch(e => { console.error(e); process.exit(1); });
