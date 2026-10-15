// Arranque, bucle principal, guardado automático y avisos de eventos.
'use strict';

(() => {
  const $ = s => document.querySelector(s);
  const DEX = Core.DEX;
  Core.load();
  let pendingOffline = Core.S.started ? Core.offline() : null;
  A11Y.apply(Core.S.settings.a11y);
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
  let lastCoinSfx = 0, lastHitSfx = 0, hidden = false, running = false, last = 0, uiT = 0, trkT = 0, trkN = -1;
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
    if (d.full) { UI.toast(L('Huevos al máximo: ' + EGGS[d.t].name + ' convertido en ' + d.dust + ' de polvo', 'Eggs full: ' + EGGS[d.t].name + ' turned into ' + d.dust + ' stardust')); return; }
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
    if (e.aura && !Core.S.ui.auraTip) { Core.S.ui.auraTip = 1; UI.banner(L('¡Un enemigo con aura!', 'An enemy with an aura!'), auraText(e.aura) + L(' · da +50% de monedas', ' · gives +50% coins'), '#c47bff'); }
  });
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
      UI.drawPv(dt);
      uiT += dt;
      if (uiT > 0.25) { uiT = 0; UI.refresh(false); }
      trkT += dt;
      if (trkT > 3) { trkT = 0; const n = Core.tracksUnlocked(); if (trkN >= 0 && n > trkN) { Audio8.play('unlock'); UI.toast(Icons.html('sound', 18) + ' ' + L('Nueva pista en la sala de música (Ajustes)', 'New track in the music room (Settings)')); } trkN = n; }
    }
    requestAnimationFrame(loop);
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
    const daily = Core.checkDaily() || !Core.S.daily.claimed;
    const parts = [];
    if (off) {
      const h = Math.floor(off.secs / 3600), m = Math.floor(off.secs / 60) % 60;
      parts.push(`<h2>${L('¡Bienvenido de nuevo!', 'Welcome back!')}</h2><p>${L(`Mientras no estabas (${h ? h + 'h ' : ''}${m}m) tu equipo derrotó <b>${Core.fmt(off.kills)}</b> Pokémon y ganó`, `While you were away (${h ? h + 'h ' : ''}${m}m) your team defeated <b>${Core.fmt(off.kills)}</b> Pokémon and earned`)}</p><p style="font-size:28px;color:var(--yellow)">${Icons.html('coin', 24)} ${Core.fmt(off.coins)}</p>`);
    }
    if (Core.eggsReady()) parts.push(`<h2>${L('¡Huevos listos!', 'Eggs ready!')}</h2><p>${L(`Tienes <b>${Core.eggsReady()}</b> huevo${Core.eggsReady() > 1 ? 's' : ''} listo${Core.eggsReady() > 1 ? 's' : ''} para eclosionar en la pestaña Gacha.`, `You have <b>${Core.eggsReady()}</b> egg${Core.eggsReady() > 1 ? 's' : ''} ready to hatch in the Gacha tab.`)}</p>`);
    if (daily && !Core.S.daily.claimed) {
      parts.push(`<h2>${L('Recompensa diaria', 'Daily reward')}</h2><p>${L(`Día <b>${Core.S.daily.streak}</b> de racha`, `Day <b>${Core.S.daily.streak}</b> streak`)}</p><p style="font-size:28px;color:#9fe8ff">${Icons.html('gem', 24)} ${Core.dailyReward()}</p><p class="hint">${L('Vuelve mañana: la recompensa crece hasta el día 7. Tienes misiones nuevas.', 'Come back tomorrow: the reward grows until day 7. You have new quests.')}</p>`);
    }
    if (!parts.length) { if (!Core.S.tutDone) setTimeout(() => UI.tutStart(), 700); return; }
    UI.openModal(parts.join('<hr style="border-color:#2a3f8a">') + `<div class="row"><button class="btn big primary" id="w-ok">${daily && !Core.S.daily.claimed ? L('Recoger', 'Claim') : L('Seguir', 'Continue')}</button></div>`);
    $('#w-ok').onclick = () => { const g = Core.claimDaily(); if (g) Audio8.play('ticket'); Core.save(); UI.closeModal(); UI.refresh(true); if (!Core.S.tutDone) setTimeout(() => UI.tutStart(), 500); };
  }

  // ---- guardado ----
  setInterval(() => { if (!hidden && Core.S.started) Core.save(); }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hidden = true; Audio8.setHidden(true); if (Core.S.started) Core.save(); PWA.schedule(); }
    else { hidden = false; Audio8.setHidden(false); PWA.clear(); last = performance.now(); if (Core.S.started && $('#scr-game').classList.contains('active')) welcome(); }
  });
  window.addEventListener('pagehide', () => { if (Core.S.started) Core.save(); });

  // ---- inicio ----
  UI.title();
  $('#btn-start').onclick = () => {
    Audio8.resume();
    Audio8.play('select');
    if (!Core.S.started) Audio8.music('menu');
    if (Core.S.started) enterGame();
    else UI.starter(d => { Core.start(d); enterGame(); });
  };

  // API de depuración para pruebas
  window.PokeIdle = { Core, UI, Arena };
})();
