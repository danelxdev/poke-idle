// Arranque, bucle principal, guardado automático y avisos de eventos.
'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const DEX = Core.DEX;
  Core.load();
  let pendingOffline = Core.S.started ? Core.offline() : null;
  UI.bind();
  Arena.init($('#cv'), () => {
    const c = $('.cur.coins');
    c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
    coinSfx();
  });

  let lastCoinSfx = 0, lastHitSfx = 0, hidden = false, running = false, last = 0, uiT = 0;
  function coinSfx() { const n = performance.now(); if (n - lastCoinSfx > 90) { lastCoinSfx = n; Audio8.play('coin'); } }

  // ---- avisos de eventos del juego ----
  Core.on('evolve', d => {
    Audio8.play('evolve');
    UI.banner('¡' + DEX[d.from].name + ' ha evolucionado en ' + DEX[d.to].name + '!', 'Su daño aumenta un montón', '#7ff0a0');
    Sprites.preload(d.to, Core.S.mons[d.key].shiny);
  });
  Core.on('kill', k => {
    if (k.caught) {
      Audio8.play('friend');
      UI.banner((k.caught.shiny ? '✨ ' : '') + '¡Has capturado a ' + DEX[k.caught.base].name + '!', k.caught.isNew ? '¡Nuevo en tu Pokédex!' : '+1 copia para subir estrellas', '#7ff0a0');
      UI.autoFill();
    }
    if (k.enemy.golden) UI.toast(Icons.html('gem', 18) + ' ¡Pokémon dorado! +' + k.gems + ' gemas');
  });
  Core.on('bossWin', e => {
    const r = ROUTES[Core.route(e.stage) % ROUTES.length];
    Audio8.play('win');
    UI.banner('¡Has vencido a ' + r.boss.who + '!', e.stage <= 80 ? 'Medalla de gimnasio: +5% de daño' : r.boss.title + ' derrotado', '#ffd23f');
  });
  Core.on('bossFail', () => { Audio8.play('death'); UI.banner('¡El jefe era demasiado fuerte!', 'Sube de nivel a tu equipo y vuelve a intentarlo', '#ff5050'); });
  Core.on('stage', s => { Audio8.music(Core.isBoss(s) ? 'boss' : 'battle'); if (Core.isBoss(s)) { const r = Core.routeData(s); UI.banner(r.boss.who + ' te desafía', r.boss.title + ' · 30 segundos para vencerle', '#ff8040'); } });
  Core.on('spawn', e => { if (e.boss) Audio8.play('boss'); });
  Core.on('hit', h => { const n = performance.now(); if (n - lastHitSfx > 70) { lastHitSfx = n; Audio8.play('hit'); } });

  // ---- toque en la arena ----
  $('#arena').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    Audio8.resume();
    const r = Core.tap();
    if (r) { $('#tap-hint').classList.add('hidden'); }
  });

  function loop(now) {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000 || 0));
    last = now;
    if (!hidden) {
      Core.tick(dt);
      Arena.frame(dt);
      UI.hud(dt);
      UI.drawMonCv(now / 1000);
      uiT += dt;
      if (uiT > 0.25) { uiT = 0; UI.refresh(false); }
    }
    requestAnimationFrame(loop);
  }

  function enterGame() {
    UI.show('scr-game');
    for (const k of Core.S.team) Sprites.preload(Core.S.mons[k].dex, Core.S.mons[k].shiny);
    UI.setTab('team');
    if (Core.S.stats.taps > 30) $('#tap-hint').classList.add('hidden');
    Audio8.music(Core.isBoss(Core.S.stage) ? 'boss' : 'battle');
    if (!running) { running = true; requestAnimationFrame(t => { last = t; loop(t); }); }
    welcome();
  }

  function welcome() {
    const off = pendingOffline || Core.offline();
    pendingOffline = null;
    const daily = Core.checkDaily() || !Core.S.daily.claimed;
    const parts = [];
    if (off) {
      const h = Math.floor(off.secs / 3600), m = Math.floor(off.secs / 60) % 60;
      parts.push(`<h2>¡Bienvenido de nuevo!</h2><p>Mientras no estabas (${h ? h + 'h ' : ''}${m}m) tu equipo derrotó <b>${Core.fmt(off.kills)}</b> Pokémon y ganó</p><p style="font-size:28px;color:var(--yellow)">${Icons.html('coin', 24)} ${Core.fmt(off.coins)}</p>`);
    }
    if (daily && !Core.S.daily.claimed) {
      parts.push(`<h2>Recompensa diaria</h2><p>Día <b>${Core.S.daily.streak}</b> de racha</p><p style="font-size:28px;color:#9fe8ff">${Icons.html('gem', 24)} ${Core.dailyReward()}</p><p class="hint">Vuelve mañana: la recompensa crece hasta el día 7. Tienes misiones nuevas.</p>`);
    }
    if (!parts.length) return;
    UI.openModal(parts.join('<hr style="border-color:#2a3f8a">') + `<div class="row"><button class="btn big primary" id="w-ok">${daily && !Core.S.daily.claimed ? 'Recoger' : 'Seguir'}</button></div>`);
    $('#w-ok').onclick = () => { const g = Core.claimDaily(); if (g) Audio8.play('ticket'); Core.save(); UI.closeModal(); UI.refresh(true); };
  }

  // ---- guardado ----
  setInterval(() => { if (!hidden && Core.S.started) Core.save(); }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hidden = true; if (Core.S.started) Core.save(); }
    else { hidden = false; last = performance.now(); if (Core.S.started && $('#scr-game').classList.contains('active')) welcome(); }
  });
  window.addEventListener('pagehide', () => { if (Core.S.started) Core.save(); });

  // ---- inicio ----
  UI.title();
  $('#btn-start').onclick = () => {
    Audio8.resume();
    Audio8.play('select');
    if (Core.S.started) enterGame();
    else UI.starter(d => { Core.start(d); enterGame(); });
  };

  // API de depuración para pruebas
  window.PokeIdle = { Core, UI, Arena };
})();
