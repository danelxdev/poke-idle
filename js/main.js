// Arranque, bucle principal, guardado automático y avisos de eventos.
'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const DEX = Core.DEX;
  Core.load();
  let pendingOffline = Core.S.started ? Core.offline() : null;
  A11Y.apply(Core.S.settings.a11y);
  document.documentElement.dataset.frame = Core.S.cosm.frame;
  UI.bind();
  A11Y.init({
    close: () => { if (!document.querySelector('#modal').classList.contains('hidden')) UI.closeModal(); },
    tab: i => UI.setTab(['team', 'up', 'gacha', 'dex', 'chal', 'quests', 'league'][i]),
  });
  PWA.init();
  Arena.init($('#cv'), () => {
    const c = $('.cur.coins');
    c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
    coinSfx();
  });

  // música: una pista por región; los jefes y los jefes finales tienen la suya
  const musicFor = st => Core.isBoss(st) ? (Core.routeData(st).boss.tier >= 4 ? 'boss2' : 'boss') : 'r' + Core.regionOf(st);
  const wantMusic = st => Audio8.want(musicFor(st), Core.isBoss(st) ? 1 : 0);
  Audio8.setUnlock(() => Core.musicIds());
  Audio8.setCue(n => UI.cue(n));
  let lastCoinSfx = 0, lastHitSfx = 0, hidden = false, running = false, last = 0, uiT = 0, trkT = 0, trkN = -1, tipT = 0;
  function coinSfx() { const n = performance.now(); if (n - lastCoinSfx > 90) { lastCoinSfx = n; Audio8.play('coin'); } }

  // ---- avisos de eventos del juego ----
  Core.on('evolve', d => {
    UI.evolveAnim(d.from, d.to, Core.S.mons[d.key].shiny);
    Sprites.preload(d.to, Core.S.mons[d.key].shiny);
  });
  Core.on('mega', d => { UI.evolveAnim(d.from, d.to, Core.S.mons[d.key].shiny, true); Sprites.preload(d.to, Core.S.mons[d.key].shiny); });
  Core.on('moveLearn', d => {
    const mv = MOVES[d.to];
    Audio8.play('levelup');
    UI.banner(L('¡' + DEX[d.dex].name + ' aprendió ' + mv.name + '!', DEX[d.dex].name + ' learned ' + mv.name + '!'), L('Su ataque ahora es más potente', 'Its attack is now stronger'), TYPE_COLORS[mv.type]);
  });
  Core.on('item', it => {
    const r = ITEM_RAR[it.rar];
    Audio8.play(it.rar >= 2 ? 'item' : 'coin');
    if (it.rar >= 2) UI.banner(L('¡', '') + HELD[it.id].name + (it.id === 'orbe' ? L(' de ', ' · ') + TYPE_NAMES[it.type] : '') + '!', r.name + L(' · equípalo desde la pestaña Equipo', ' · equip it from the Team tab'), r.color);
  });
  Core.on('egg', d => {
    if (d.full) { UI.toast(L('Huevos al máximo: ' + EGGS[d.t].name + ' convertido en ' + Core.fmt(d.coins) + ' monedas', 'Eggs full: ' + EGGS[d.t].name + ' turned into ' + Core.fmt(d.coins) + ' coins')); return; }
    Audio8.play('item');
    if (Core.S.started && d.t >= 1) UI.banner(L('¡Has encontrado un ' + EGGS[d.t].name + '!', 'You found a ' + EGGS[d.t].name + '!'), L('Eclosiona en una incubadora de la pestaña Gacha', 'Hatch it in an incubator in the Gacha tab'), EGGS[d.t].color);
    else if (Core.S.started) UI.toast(Icons.html('egg' + d.t, 18) + ' ' + L('¡Has encontrado un ' + EGGS[d.t].name + '!', 'You found a ' + EGGS[d.t].name + '!'));
  });
  Core.on('eggReady', e => { Audio8.play('rare'); UI.banner(L('¡Un ' + EGGS[e.t].name + ' está listo!', 'A ' + EGGS[e.t].name + ' is ready!'), L('Ve a la pestaña Gacha para eclosionarlo', 'Go to the Gacha tab to hatch it'), EGGS[e.t].color); });
  Core.on('chalStart', c => {
    Audio8.want(c.kind === 'rival' ? (c.enc.meet ? 'rival2' : 'rival') : c.kind === 'event' ? 'event' : c.kind === 'tower' ? (c.boss ? 'boss2' : 'tower') : 'boss', 1);
    if (c.kind === 'rival') Audio8.play('duel');
    UI.banner(c.label, c.rule ? c.rule.name + (c.rule.only ? ' ' + TYPE_ES[c.rule.only] : '') + ': ' + c.rule.desc : c.kind === 'rival' ? L('Tres Pokémon seguidos y un solo cronómetro', 'Three Pokémon in a row and a single timer') : L('Vence al rival antes de que se acabe el tiempo', 'Beat the rival before time runs out'), '#ff8040');
  });
  Core.on('chalWin', d => {
    if (d.kind === 'rival') { Audio8.play('legend'); setTimeout(() => UI.rivalTalk(d.enc, 'post', d), 700); return; }
    Audio8.play(d.kind === 'event' || d.floor % 5 === 0 ? 'legend' : 'win');
    if (d.kind === 'event') UI.banner(L('¡Jefe del evento vencido!', 'Event boss beaten!'), d.first ? UI.rewText(d.rew) : L('Ya habías recogido esta recompensa', 'You had already claimed this reward'), '#ffd23f');
    else if (d.first && d.floor % 5 === 0) UI.banner(L('¡Piso ' + d.floor + ' superado!', 'Floor ' + d.floor + ' cleared!'), UI.rewText(d.rew), '#ffd23f');
    else UI.toast(L('Piso ', 'Floor ') + d.floor + (d.first ? ' · ' + UI.rewText(d.rew) : L(' superado', ' cleared')));
  });
  Core.on('chalFail', d => { Audio8.play('death'); if (d.kind === 'rival') { UI.banner(L('Nico gana esta vez', 'Nico wins this time'), L('Mejora a tu equipo, usa los tipos que más daño le hacen y vuelve a retar a Nico', 'Improve your team, use the types that hurt most and challenge Nico again'), '#ff5050'); return; } UI.banner(d.kind === 'tower' ? L('La Torre te frena en el piso ' + d.floor, 'The Tower stops you at floor ' + d.floor) : L('El jefe del evento resistió', 'The event boss held out'), d.kind === 'tower' ? L('Récord: piso ', 'Record: floor ') + d.best : L('Mejora a tu equipo y vuelve a intentarlo', 'Improve your team and try again'), '#ff5050'); });
  Core.on('chalEnd', () => { wantMusic(Core.S.stage); UI.refresh(true); });
  Core.on('trainerStart', t => { if (Core.S.started) { Audio8.play('trainer'); UI.toast(Icons.html('friends', 18) + ' ' + L(t.cls + ' ' + t.name + ' te desafía (' + t.n + ' Pokémon)', t.cls + ' ' + t.name + ' challenges you (' + t.n + ' Pokémon)')); } });
  Core.on('trainerWin', d => { Audio8.play('win'); UI.toast(Icons.html('friends', 18) + ' ' + L('¡' + d.trainer.cls + ' ' + d.trainer.name + ' vencido! ', d.trainer.cls + ' ' + d.trainer.name + ' beaten! ') + '+' + Core.fmt(d.coins) + ' ' + L('monedas', 'coins') + (d.gems ? ' · +' + d.gems + ' ' + L('gemas', 'gems') : '') + (d.tickets ? ' · +1 ticket' : '') + (d.item ? ' · ' + L('¡objeto!', 'item!') : '')); });
  for (const ev of ['ascend', 'chalWin', 'bossWin', 'hatch']) Core.on(ev, () => Cloud.soon());
  Core.on('rivalReady', e => { Audio8.play('rare'); UI.banner(L('Nico quiere un duelo', 'Nico wants a duel'), REGIONS[e.region].name + L(' · pestaña Retos', ' · Challenges tab'), '#ff8040'); UI.refresh(true); });
  Core.on('tickets', t => { if (Core.S.started) UI.refresh(false); });
  Core.on('kill', k => {
    if (k.enemy.golden) UI.toast(Icons.html('gem', 18) + ' ' + L('¡Pokémon dorado! +' + k.gems + ' gemas', 'Golden Pokémon! +' + k.gems + ' gems'));
  });
  Core.on('bossWin', e => {
    const r = ROUTES[Core.route(e.stage) % ROUTES.length];
    Audio8.play(e.tier >= 4 ? 'legend' : 'win');
    UI.banner(L('¡Has vencido a ' + r.boss.who + '!', 'You beat ' + r.boss.who + '!'), e.tier === 1 ? L('Medalla de gimnasio: +3% de daño', 'Gym badge: +3% damage') : r.boss.title + L(' derrotado', ' defeated'), '#ffd23f');
  });
  let ligaTip = false;
  Core.on('bossWait', st => { const r = Core.routeData(st); if (!ligaTip && Core.medalGain() > 0) { ligaTip = true; setTimeout(() => UI.toast(L('Consejo: si te atascas, entra en la Liga (pestaña Liga) para ganar medallas permanentes', 'Tip: if you get stuck, enter the League (League tab) to earn permanent medals')), 3200); } UI.banner(L('Aún no estás listo para ' + r.boss.who, 'You are not ready for ' + r.boss.who + ' yet'), L('Sigue combatiendo: lo retarás solo cuando tengas fuerza suficiente', 'Keep fighting: the boss will be challenged only when you are strong enough'), '#ffd23f'); });
  Core.on('bossFail', () => { Audio8.play('death'); UI.banner(L('¡El jefe era demasiado fuerte!', 'The boss was too strong!'), L('Sigue combatiendo: lo retarás de nuevo cuando estés listo', 'Keep fighting: the boss will be challenged again when you are ready'), '#ff5050'); });
  Core.on('stage', s => {
    wantMusic(s);
    const r = Core.routeData(s);
    if (Core.isBoss(s)) UI.banner(L(r.boss.who + ' te desafía', r.boss.who + ' challenges you'), r.boss.title + ' · ' + Core.bossTime(s) + L(' segundos para vencerle', ' seconds to beat them'), '#ff8040');
    else if (s % 10 === 1) UI.banner(r.name, REGIONS[Core.regionOf(s)].name + (Core.loopOf(s) ? L(' · ciclo +', ' · loop +') + Core.loopOf(s) : ''), '#9fe0ff');
  });
  Core.on('spawn', e => {
    if (e.boss) Audio8.play('boss');
  });
  Core.on('hit', h => { const n = performance.now(); if (n - lastHitSfx > 70) { lastHitSfx = n; Audio8.play('hit'); } });

  // ---- toque en la arena ----
  $('#arena').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    Audio8.resume();
    const r = Core.tap();
    if (r) { $('#tap-hint').classList.add('hidden'); }
  });

  let loopErrs = 0;
  function loop(now) {
    requestAnimationFrame(loop);            // se reprograma antes de nada: un fallo puntual no puede parar el juego
    const real = Math.max(0, (now - last) / 1000 || 0), dt = Math.min(0.1, real);
    last = now;
    if (hidden) return;
    try {
      // si el navegador va lento (menos de 10 fps) no se pierde tiempo de juego: se simula en pasos de 0,1 s (hasta 2 s por fotograma)
      for (let rem = Math.min(real, 2); rem > 1e-6; rem -= 0.1) Core.tick(Math.min(0.1, rem));
      Arena.frame(dt);
      UI.hud(dt);
      UI.drawMonCv(now / 1000);
      UI.drawPv(dt);
      uiT += dt;
      if (uiT > 0.25) { uiT = 0; UI.refresh(false); }
      tipT += dt; if (tipT > 2) { tipT = 0; UI.tipsTick(); }
      trkT += dt;
      if (trkT > 3) { trkT = 0; const n = Core.tracksUnlocked(); if (trkN >= 0 && n > trkN) { Audio8.play('unlock'); UI.toast(Icons.html('sound', 18) + ' ' + L('Nueva pista en la sala de música (Ajustes)', 'New track in the music room (Settings)')); } trkN = n; }
    } catch (e) { if (loopErrs++ < 5) console.error('[PokéIdle] error en el bucle', e); }
  }

  function enterGame() {
    UI.show('scr-game');
    for (const k of Core.S.team) Sprites.preload(Core.fdex(Core.S.mons[k]), Core.S.mons[k].shiny);
    UI.setTab('team');
    if (Core.S.stats.taps > 30) $('#tap-hint').classList.add('hidden');
    wantMusic(Core.S.stage);
    if (!running) { running = true; requestAnimationFrame(t => { last = t; loop(t); }); }
    welcome();
  }

  function welcome() {
    const off = pendingOffline || Core.offline();
    pendingOffline = null;
    const newDay = Core.checkDaily(), daily = newDay || !Core.S.daily.claimed;
    if (!Core.S.ui.snap) Core.S.ui.snap = Core.snap();
    const rc = off ? Core.recap() : null;
    const hasNews = off || Core.eggsReady() || (daily && !Core.S.daily.claimed) || (rc && rc.rows.length);
    if (!hasNews) { if (!Core.S.tutDone) setTimeout(() => UI.tutStart(), 700); return; }
    UI.welcomeModal({ off, rc, newDay, daily, done: () => { if (!Core.S.tutDone) setTimeout(() => UI.tutStart(), 500); } });
  }

  // ---- guardado ----
  setInterval(() => { if (!hidden && Core.S.started) Core.save(); }, 5000);
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hidden = true; hiddenAt = Date.now(); Cloud.flush(); Audio8.setHidden(true); if (Core.S.started) Core.save(); PWA.schedule(); }
    else {
      hidden = false; Audio8.setHidden(false); PWA.clear(); last = performance.now();
      // el resumen solo sale tras una ausencia de verdad (≥ 1 min) y nunca encima de otra ventana
      if (Core.S.started && !Core.isStale() && Date.now() - hiddenAt >= 60000 && $('#scr-game').classList.contains('active') && $('#modal').classList.contains('hidden')) welcome();
    }
  });
  // ---- atajos de teclado (alternativa al ratón en el ordenador) ----
  let lastKeyTap = 0;
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if (typing || !Core.S.started) return;
    const vis = sel => { const el = $(sel); return el && !el.classList.contains('hidden'); };
    const go = e.code === 'Space' || e.key === 'Enter';
    // animaciones a pantalla completa: continuar
    if (vis('#gacha-fx')) { if (go) { const b = $('#pull-ok') || $('#gx-skip'); if (b) { e.preventDefault(); b.click(); } } return; }
    if (vis('#evo')) { if (go && vis('#evo-ok')) { e.preventDefault(); $('#evo-ok').click(); } return; }
    if (!$('#scr-game').classList.contains('active')) return;
    const modalOpen = !$('#modal').classList.contains('hidden');
    if (e.key === '?' || (e.code === 'KeyK' && !e.shiftKey)) { e.preventDefault(); if (modalOpen && $('#kb-x')) UI.closeModal(); else if (!modalOpen) UI.keysModal(); return; }
    if (modalOpen) return;
    const onCtl = t && (/^(BUTTON|A)$/.test(t.tagName) || t.getAttribute('role') === 'button');
    const click = sel => { const b = $(sel); if (b && !b.disabled && !b.classList.contains('hidden')) { e.preventDefault(); b.click(); return true; } return false; };
    switch (e.code) {
      case 'Space': case 'KeyF':
        if (onCtl && e.code === 'Space') return;                         // con un botón enfocado, Espacio lo pulsa (accesibilidad)
        e.preventDefault();
        { const n = performance.now(); if (e.repeat && n - lastKeyTap < 90) return; lastKeyTap = n; }
        Audio8.resume(); if (Core.tap()) $('#tap-hint').classList.add('hidden');
        return;
      case 'KeyQ': click('#sk-rage'); return;
      case 'KeyW': click('#sk-gold'); return;
      case 'KeyE': click('#sk-lure'); return;
      case 'ArrowLeft': click('#st-prev'); return;
      case 'ArrowRight': click('#st-next'); return;
      case 'KeyB': click('#btn-boss'); return;
      case 'KeyM': click('#btn-map'); return;
      case 'KeyP': click('#btn-profile'); return;
      case 'KeyO': click('#btn-settings'); return;
      case 'KeyX': { const o = [1, 10, 25, 'max'], s = Core.S; s.buyMul = o[(Math.max(0, o.indexOf(s.buyMul)) + 1) % o.length]; Audio8.play('click'); UI.refresh(true); e.preventDefault(); return; }
    }
  });
  // tras un clic con el ratón el botón no se queda enfocado (si no, Espacio lo volvería a pulsar en vez de atacar)
  document.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') setTimeout(() => { const a = document.activeElement; if (a && a.tagName === 'BUTTON' && $('#modal').classList.contains('hidden')) a.blur(); }, 0); });

  // otra pestaña abrió la partida: esta deja de guardar para no pisarla
  Core.on('stale', () => {
    if ($('#stalebar')) return;
    const b = document.createElement('div'); b.id = 'stalebar'; b.setAttribute('role', 'alert');
    b.innerHTML = '<span>' + L('Esta partida se ha abierto en otra pestaña o ventana. Aquí ya no se guarda.', 'This game was opened in another tab or window. Nothing is saved here anymore.') + '</span><button class="btn small primary" id="stale-reload">' + L('Recargar aquí', 'Reload here') + '</button>';
    document.body.appendChild(b); $('#stale-reload').onclick = () => location.reload();
  });
  window.addEventListener('storage', e => { if (e.key === 'pokeidle.owner') Core.ownerCheck(); });
  Core.on('saveFail', () => UI.banner(L('No se puede guardar la partida', 'Cannot save the game'), L('Almacenamiento lleno o bloqueado (¿modo privado?). Exporta tu partida desde Ajustes para no perderla.', 'Storage is full or blocked (private mode?). Export your game from Settings so you do not lose it.'), '#ff5050'));
  Core.on('newDay', () => { if (Core.S.started) { UI.toast(L('¡Nuevo día! Misiones y recompensa diaria renovadas', 'New day! Quests and daily reward renewed')); UI.refresh(true); } });
  window.addEventListener('pagehide', () => { if (Core.S.started) Core.save(); });

  // ---- inicio ----
  UI.title();
  // música del título: se prepara al cargar. Si el navegador deja sonar sin que el jugador haga nada (sitio visitado a menudo,
  // app instalada), suena sola. Si no (la mayoría de los navegadores exigen un gesto), arranca con el primer toque, clic o tecla
  // y mientras tanto sale un aviso discreto.
  Audio8.want('menu', 0);
  Audio8.resume();
  { const evs = ['pointerdown', 'pointerup', 'click', 'keydown', 'touchstart', 'touchend'];
    const hint = document.createElement('button'); hint.id = 'soundhint'; hint.className = 'soundhint hidden'; hint.type = 'button';
    hint.textContent = '🔊 ' + L('Toca para activar la música', 'Tap to turn the music on'); document.body.appendChild(hint);
    const done = () => { for (const ev of evs) document.removeEventListener(ev, kick, true); hint.remove(); };
    const kick = () => { Audio8.resume(); setTimeout(() => { if (Audio8.state() === 'running') done(); }, 60); };
    for (const ev of evs) document.addEventListener(ev, kick, true);
    setTimeout(() => { if (Audio8.state() === 'running') done(); else if (Core.S.settings.music > 0 && Core.S.settings.master > 0) hint.classList.remove('hidden'); }, 700);
    const poll = setInterval(() => { if (Audio8.state() === 'running') { clearInterval(poll); done(); } }, 500); setTimeout(() => clearInterval(poll), 120000); }
  Cloud.on(() => UI.authChanged());
  Cloud.init().then(() => { UI.authChanged(); try { if (sessionStorage.getItem('pokeidle.pulled')) { sessionStorage.removeItem('pokeidle.pulled'); UI.toast(L('Partida cargada desde tu cuenta', 'Game loaded from your account')); } } catch (e) { /* nada */ } });
  $('#btn-start').onclick = () => {
    Audio8.resume();
    if (Core.S.settings.autoFs) PWA.fsEnter();                // pantalla completa si el jugador lo pidió (necesita este clic)
    Audio8.play('select');
    if (!Core.S.started) Audio8.music('menu');
    if (Core.S.started) enterGame();
    else UI.starter(d => { Core.start(d); enterGame(); });
  };

  // API de depuración para pruebas
  window.PokeIdle = { Core, UI, Arena };
})();
