// Interfaz HTML: cabecera, pestañas (Equipo, Mejoras, Gacha, Pokédex, Misiones, Liga), modales y animación del gacha.
'use strict';

const UI = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const DEX = Core.DEX;
  const fmt = Core.fmt;
  const ico = (n, s = 24) => Icons.html(n, s);
  const S = () => Core.S;
  const typeTags = d => `<span class="types">${DEX[d].types.map(t => `<span class="type" style="background:${TYPE_COLORS[t]}">${TYPE_ES[t]}</span>`).join('')}</span>`;
  const starsHtml = n => `<span class="stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const por = (d, shiny) => Sprites.portrait(d, shiny);
  // el Pokémon animado dentro de una cajita (en lugar de su retrato/carta)
  const spb = (dex, px, shiny) => `<span class="spb" style="width:${px + 8}px;height:${px + 8}px">${Sprites.html(dex, !!shiny, px, true)}</span>`;

  let tab = 'team', sig = '', dexFilter = 'all', achShowAll = false, rivalAll = false;

  function show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

  // ---------------- pantallas iniciales ----------------
  const REG_COL = ['#ff5f6d', '#ffd23f', '#5fe08a', '#4fb4ff', '#c47bff', '#ff8ad8', '#ff9a3d', '#9fe0ff', '#ff7a5a'];
  // el Pokémon del avatar (el del perfil o, si no hay, el primero del equipo) y los datos del entrenador
  function profInfo() {
    const s = S(), pr = s.profile, m0 = s.team[0] ? s.mons[s.team[0]] : null;
    const av = pr.avatar && DEX[pr.avatar] ? pr.avatar : (m0 ? Core.fdex(m0) : 25), own = s.mons[String(Core.baseOf(av))];
    const name = (Cloud.user && Cloud.profile && Cloud.profile.nickname) || pr.name || L('Entrenador', 'Trainer');
    return { av, shiny: !!(own && own.shiny), name, title: (TITLES.find(t => t.id === pr.title) || TITLES[0]).name };
  }
  const esc = x => String(x).replace(/[<>&"']/g, '');
  // enlaces del autor (título y ajustes)
  const GITHUB_URL = 'https://github.com/danelxdev/', X_URL = 'https://x.com/InvertiBytes';
  const SOC_GH = '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
  const SOC_X = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  const socialHtml = () => `<a class="soc" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${SOC_GH}<span>GitHub</span></a><a class="soc" href="${X_URL}" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">${SOC_X}<span>@InvertiBytes</span></a>`;
  const avatarHtml = (size, px) => { const p = profInfo(); return `<span class="pavatar ${size}">${Sprites.html(p.av, p.shiny, px, true)}</span>`; };
  let chipKey = '';
  function paintProf(force) {
    const el = $('#btn-profile'); if (!el || !S().started) return;
    const p = profInfo(), k = [p.av, p.shiny, p.name, p.title, I18N.lang].join('|');
    if (!force && k === chipKey) return; chipKey = k;
    el.innerHTML = `${avatarHtml('sm', 34)}<span class="pc-t"><b>${esc(p.name)}</b><small>${p.title}</small></span><span class="pc-edit" aria-hidden="true">✎</span>`;
    el.setAttribute('aria-label', L('Perfil: ', 'Profile: ') + p.name + L('. Pulsa para editarlo', '. Press to edit it')); el.title = L('Editar perfil', 'Edit profile');
  }
  function paintCont() {
    const s = S(), el = $('#t-cont'); if (!el || !s.started) return;
    const n = Object.keys(s.mons).length, hrs = Math.floor(s.stats.time / 3600), mins = Math.floor(s.stats.time / 60) % 60, p = profInfo();
    el.innerHTML = `<button class="ct-prof" id="ct-prof" aria-label="${L('Editar perfil', 'Edit profile')}">${avatarHtml('md', 56)}<span class="cp-t"><b>${esc(p.name)}</b><small>${p.title}</small></span><span class="cp-e">✎ ${L('Editar perfil', 'Edit profile')}</span></button>
      <div class="ct-team">${s.team.slice(0, 6).map(kk => Sprites.html(Core.fdex(s.mons[kk]), s.mons[kk].shiny, 40, true, 'ctsp')).join('')}</div>
      <div class="ct-info"><span>${REGIONS[Core.regionOf(s.stage)].name} · ${L('etapa', 'stage')} ${s.stage} <small>(${L('máx.', 'max')} ${s.stats.maxStage})</small></span>
      <small>${n} Pokémon · Pokédex ${Core.regCount()}/${POKEDEX.length} · ${fmt(s.medals)} ${L('medallas', 'medals')} · ${hrs ? hrs + ' h ' : ''}${mins} min ${L('jugados', 'played')}</small></div>`;
    $('#ct-prof').onclick = () => profileModal('title');
  }
  // ---------------- novedades (botón junto al idioma + ventana) ----------------
  const NEWS_VER = 'v24';
  const newsItems = () => [
    L('Perfil con tu Pokémon animado: pulsa el icono de la cabecera (o la tarjeta del inicio) para editarlo.', 'Profile with your animated Pokémon: press the header icon (or the title card) to edit it.'),
    L('Pokédex mucho más rápida en móvil y con los Pokémon en lugar de cartas; también en el mapa, retos y rankings.', 'Much faster Pokédex on mobile, with Pokémon instead of cards; also on the map, challenges and rankings.'),
    L('Atajos de teclado en el ordenador: Espacio ataca, Q/W/E habilidades, ? muestra la lista.', 'Keyboard shortcuts on desktop: Space attacks, Q/W/E skills, ? shows the list.'),
    L('Con Google, tu partida se guarda en la nube; si juegas como invitado y luego entras, no pierdes ese progreso.', 'With Google your game is saved in the cloud; if you play as a guest and sign in later, you do not lose that progress.'),
    L('Ascensión y Duelos Maestros: un final de partida sin techo.', 'Ascension and Master Duels: an endgame with no ceiling.'),
    L('Nico, tu rival: 20 duelos con historia, y entrenadores por las rutas.', 'Nico, your rival: 20 story duels, and trainers along the routes.'),
    L('Sala de música, 3 estilos y subtítulos de sonidos; formas regionales, megaevoluciones y accesibilidad.', 'Music room, 3 styles and sound captions; regional forms, Mega evolutions and accessibility.'),
  ];
  function paintNewsBtn() {
    const b = $('#btn-news'); if (!b) return;
    const seen = S().ui.newsSeen === NEWS_VER;
    b.innerHTML = `<span aria-hidden="true">🔔</span> ${L('Novedades', "What's new")}${seen ? '' : '<i class="newdot" aria-hidden="true"></i>'}`;
    b.onclick = newsModal;
  }
  function newsModal() {
    S().ui.newsSeen = NEWS_VER; Core.save(); paintNewsBtn();
    openModal(`<h2>🔔 ${L('Novedades', "What's new")}</h2><ul class="newslist">${newsItems().map(t => `<li>${t}</li>`).join('')}</ul><div class="row"><button class="btn primary" id="nw-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#nw-x').onclick = closeModal;
  }
  function title() {
    show('scr-title');
    const s = S(), k = $('#kofi-title');
    { const f = $('#t-fs'), io = $('#t-ios');
      if (f) { f.classList.toggle('hidden', !PWA.fsSupported()); f.textContent = '⛶ ' + (PWA.fsActive() ? L('Salir de pantalla completa', 'Exit full screen') : L('Pantalla completa', 'Full screen')); f.onclick = async e => { e.preventDefault(); await PWA.fsToggle(); setTimeout(() => { f.textContent = '⛶ ' + (PWA.fsActive() ? L('Salir de pantalla completa', 'Exit full screen') : L('Pantalla completa', 'Full screen')); }, 200); }; }
      if (io) { io.classList.toggle('hidden', !(PWA.isIOS() && !PWA.standalone())); io.textContent = '📲 ' + L('Instalar en iPhone (sin barras)', 'Install on iPhone (no bars)'); io.onclick = e => { e.preventDefault(); iosHelpModal(); }; } }
    const so = $('#t-social'); if (so) so.innerHTML = '<small>' + L('Hecho por Danel · síguelo:', 'Made by Danel · follow:') + '</small>' + socialHtml();
    if (k) { k.href = KOFI_URL; k.innerHTML = ico('cup', 24) + '<span>' + L('Apoyar el proyecto en Ko-fi', 'Support the project on Ko-fi') + '</span>'; }
    TitleFX.start($('#title-bg'));
    $$('#langsw button[data-lang]').forEach(b => { b.classList.toggle('on', b.dataset.lang === I18N.lang); b.onclick = () => { if (b.dataset.lang === I18N.lang) return; s.settings.lang = b.dataset.lang; Core.save(); location.reload(); }; });
    $('#logo-ball').innerHTML = ico('ball', 48);
    $('#t-badges').innerHTML = [['book', POKEDEX.length + ' Pokémon'], ['boot', REGIONS.filter(r => r.gen).length + ' ' + L('regiones', 'regions')], ['crown', ROUTES.length + ' ' + L('jefes', 'bosses')], ['ball', Object.keys(BALLS).length + ' Poké Balls'], ['trophy', ACHIEVEMENTS.length + ' ' + L('logros', 'achievements')]]
      .map(([i, t], n) => `<span style="animation-delay:${0.1 + n * 0.08}s">${ico(i, 20)}${t}</span>`).join('');
    // continuar
    const started = s.started;
    $('#btn-start').textContent = started ? L('Continuar', 'Continue') : L('Jugar', 'Play');
    $('#t-cont').classList.toggle('hidden', !started);
    $('#t-new').classList.toggle('hidden', !started);
    if (started) {
      paintCont();
      $('#t-new').onclick = e => {
        e.preventDefault();
        openModal(`<h2>${L('¿Empezar de nuevo?', 'Start over?')}</h2><p>${L('Se borrará tu partida actual: Pokémon, progreso y objetos.', 'Your current game will be erased: Pokémon, progress and items.')}</p><div class="row"><button class="btn" id="n-no">${L('Cancelar', 'Cancel')}</button><button class="btn danger" id="n-yes">${L('Sí, borrar todo', 'Yes, erase everything')}</button></div>`);
        $('#n-no').onclick = closeModal; $('#n-yes').onclick = () => { Core.wipe(); location.reload(); };
      };
    }
    // Pokémon destacado
    const fl = Core.featuredLegend(), fe = Core.featuredEpic();
    $('#t-featured').innerHTML = `<h3>${L('Destacados de la semana', 'Featured this week')}</h3><div class="t-feat">
      <div class="tf big" style="--rc:${RARITY[5].color}"><span class="tf-spr">${Sprites.html(fl, false, 84, true)}</span><b>${DEX[fl].name}</b><small>${RARITY[5].name}</small>${typeTags(fl)}</div>
      <div class="tf" style="--rc:${RARITY[4].color}"><span class="tf-spr">${Sprites.html(fe, false, 72, true)}</span><b>${DEX[fe].name}</b><small>${RARITY[4].name}</small>${typeTags(fe)}</div></div>
      <p class="hint">${L('Más probabilidad en la Bola Destacada.', 'Higher chance in the Featured Ball.')}</p>`;
    // regiones
    $('#t-regions').innerHTML = `<h3>${L('Viaja por 9 regiones', 'Travel across 9 regions')}</h3><div class="t-reg">${REGIONS.filter(r => r.gen).map((r, i) => {
      const open = Core.genUnlocked(r.gen), n = POKEDEX.filter(p => p.gen === r.gen).length;
      return `<div class="rg ${open ? '' : 'lock'}" style="--c:${REG_COL[i]}"><i></i><b>${r.name}</b><small>${open ? n + ' Pokémon' : L('Etapa ', 'Stage ') + (r.first * 10 + 1)}</small></div>`;
    }).join('')}</div>`;
    // características
    $('#t-cards').innerHTML = [
      ['fist', L('Combate automático', 'Automatic combat'), L('Tu equipo pelea solo. Toca al enemigo para golpear más fuerte y usa habilidades.', 'Your team fights on its own. Tap the enemy to hit harder and use skills.')],
      ['ball', L('Gacha con tickets', 'Ticket gacha'), L('Abre Poké Balls con rarezas, shinies, destacados y garantías.', 'Open Poké Balls with rarities, shinies, featured Pokémon and pity.')],
      ['egg1', L('Huevos y crianza', 'Eggs and breeding'), L('Incuba huevos, hereda IVs y naturalezas y busca el Pokémon perfecto.', 'Hatch eggs, inherit IVs and natures and chase the perfect Pokémon.')],
      ['crown', L('Eventos y Torre', 'Events and Tower'), L('Un evento nuevo cada semana y una torre infinita con guardianes.', 'A new event every week and an endless tower with guardians.')],
    ].map(([i, t, d], n) => `<div class="tcard" style="animation-delay:${0.3 + n * 0.1}s">${ico(i, 36)}<b>${t}</b><small>${d}</small></div>`).join('');
    paintNewsBtn();
  }
  function starter(cb) {
    show('scr-starter');
    $('#starters').innerHTML = [1, 4, 7, 172, 133].map(d => `<button class="starter" data-d="${d}"><img class="px" src="${por(d)}"><b>${DEX[d].name}</b>${typeTags(d)}</button>`).join('');
    $$('#starters .starter').forEach(b => b.onclick = () => { Audio8.play('select'); cb(+b.dataset.d); });
  }

  // ---------------- cabecera y arena ----------------
  // monedas por segundo: lo ganado (total acumulado, sin contar lo gastado) en los últimos 20 s reales
  let cpsBuf = [], cpsLast = 0, cpsTxt = '';
  function hud(dt) {
    const s = S();
    paintProf();
    $('#coins').textContent = fmt(s.coins);
    $('#gems').textContent = fmt(s.gems);
    $('#tks').textContent = fmt(Object.values(s.tk).reduce((a, b) => a + b, 0));
    { const now = performance.now();
      if (now - cpsLast >= 500) {
        cpsLast = now; const tot = s.stats.coinsTotal;
        if (cpsBuf.length && tot < cpsBuf[cpsBuf.length - 1][1]) cpsBuf = [];                    // partida nueva / importada
        cpsBuf.push([now, tot]); while (cpsBuf.length > 2 && now - cpsBuf[0][0] > 20000) cpsBuf.shift();
        const a = cpsBuf[0], el = (now - a[0]) / 1000;
        const t = el >= 4 ? (() => { const v = (tot - a[1]) / el; return v > 0 ? (v < 10 ? v.toFixed(1) : fmt(v)) + '/s' : ''; })() : '';
        if (t !== cpsTxt) { cpsTxt = t; $('#cps').textContent = t; }
      } }
    const r = Core.routeData(s.stage), lp = Core.loopOf(s.stage);
    $('#route-name').textContent = r.name + (lp ? ' +' + lp : '');
    $('#stage-label').textContent = REGIONS[Core.regionOf(s.stage)].name + ' · ' + L('Etapa ', 'Stage ') + s.stage + (s.maxStage > s.stage ? ' / ' + s.maxStage : '') + (s.asc.rank ? ' · ' + L('Rango ', 'Rank ') + s.asc.rank : '');
    const boss = Core.isBoss(s.stage);
    const pips = $('#pips');
    const pk = boss ? 'boss' : String(s.kills);
    if (pips.dataset.k !== pk) {
      pips.dataset.k = pk;
      pips.className = 'pips' + (boss ? ' boss' : '');
      pips.innerHTML = boss ? '<i></i>' : Array.from({ length: 10 }, (_, i) => `<i class="${i < s.kills ? 'on' : ''}"></i>`).join('');
    }
    const inCh = Core.inChal();
    $('#st-prev').disabled = s.stage <= 1 || inCh;
    $('#st-next').disabled = s.stage >= s.maxStage || boss || inCh;
    const cb = $('#chal-bar'); cb.classList.toggle('hidden', !inCh);
    if (inCh) { const c = Core.chal, t = c.label + (c.rule ? ' · ' + c.rule.name + (c.rule.only ? ' ' + TYPE_ES[c.rule.only] : '') : ''); if ($('#chal-txt').textContent !== t) $('#chal-txt').textContent = t; }
    const e = Core.F.enemy;
    const box = $('#enemy-box');
    if (e) {
      box.classList.remove('hidden');
      const eased = e.boss && !e.chal && Core.bossEase(e.stage) < 1 ? ' · −' + Math.round((1 - Core.bossEase(e.stage)) * 100) + '%' : '';
      const ch = Core.chal;
      const aura = e.aura ? ' ✦ ' + AURAS[e.aura.id].name + (e.aura.type ? ' ' + TYPE_NAMES[e.aura.type] : '') : '';
      const name = (e.chal && ch ? DEX[e.dex].name + (e.part && e.part.n > 1 ? ' (' + e.part.i + '/' + e.part.n + ')' : '') : e.trainer ? DEX[e.dex].name + ' · ' + e.trainer.cls + ' ' + e.trainer.name + ' ' + e.trainer.i + '/' + e.trainer.n : e.boss ? (r.boss.who === DEX[e.dex].name ? r.boss.who : r.boss.who + ' · ' + DEX[e.dex].name) + eased : (e.golden ? '✨ ' : '') + DEX[e.dex].name + (e.golden ? L(' dorado', ' (golden)') : '')) + aura;
      $('#enemy-name').title = e.aura ? auraText(e.aura) : '';
      if ($('#enemy-name').textContent !== name) { $('#enemy-name').textContent = name; A11Y.label($('#cv'), L('Combate contra ', 'Battle against ') + name); }
      const ft = $('#foe-types'); if (ft.dataset.k !== String(e.dex)) { ft.dataset.k = e.dex; ft.innerHTML = typeTags(e.dex); }
      $('#enemy-hp').style.width = Math.max(0, e.hp / e.max * 100) + '%';
      $('#enemy-hptxt').textContent = fmt(Math.max(0, Math.ceil(e.hp)));
      $('#boss-timer').classList.toggle('hidden', !e.boss);
      if (e.boss) $('#boss-t').style.width = Math.max(0, Core.F.bossT / (e.chal && Core.chal ? Core.chal.time : Core.bossTime(e.stage)) * 100) + '%';
    } else box.classList.add('hidden');
    const bb = $('#btn-boss'), showBb = !s.auto && s.kills >= 10 && !boss && !inCh;
    bb.classList.toggle('hidden', !showBb);
    if (showBb) { const t = Core.isBoss(s.stage + 1) ? L('¡Reta al jefe!', 'Challenge the boss!') : L('Avanzar etapa', 'Next stage'); if (bb.textContent !== t) bb.textContent = t; }
    for (const [id, k] of Object.entries(SKILLS)) {
      const b = $('#sk-' + id); if (!b) continue;
      const rem = Math.max(0, s.sk[id] - s.stats.time), on = Core.skillOn(id);
      b.classList.toggle('on', on); b.disabled = rem > 0;
      b.querySelector('i').style.height = (on ? 0 : rem / k.cd * 100) + '%';
      const tx = on ? Math.ceil(s.skOn[id] - s.stats.time) + 's' : rem > 0 ? Math.ceil(rem) + 's' : '';
      const sm = b.querySelector('small'); if (sm.textContent !== tx) sm.textContent = tx;
    }
    const waitBoss = !s.auto && s.kills >= 10 && !boss && Core.isBoss(s.stage + 1), rd = waitBoss ? Math.min(1, Core.bossReady(s.stage + 1)) : 0;
    $('#dps').innerHTML = L('Daño/s', 'Damage/s') + ' <b>' + fmt(e ? Core.teamDps(e.types) : Core.teamDps()) + '</b> · ' + L('Toque', 'Tap') + ' <b>' + fmt(Core.tapDmg()) + '</b>' + (cpsTxt ? '<span class="mcps"> · ' + L('Monedas', 'Coins') + ' <b>' + cpsTxt + '</b></span>' : '') + (waitBoss ? ` · ${L('Poder vs jefe', 'Power vs boss')} <b style="color:${rd >= 0.95 ? '#7ff0a0' : '#ffd23f'}">${Math.round(rd * 100)}%</b>` : '');
    $('#quest-dot').classList.toggle('hidden', !Core.pendingRewards() && s.daily.claimed);
    $('#gacha-dot').classList.toggle('hidden', !Core.eggsReady());
    const rvNext = Core.rivalNext(), rvOpen = rvNext && Core.rivalOpen(rvNext);
    $('#chal-dot').classList.toggle('hidden', !Core.towerUnlocked() || !(rvOpen || Core.ev && (!s.event.free || EVENT_TASKS.some(t => !s.event.claimed[t.id] && s.event[t.stat] >= t.goal))));
  }

  // ---------------- pestañas ----------------
  function setTab(t) {
    tab = t; sig = '';
    $$('#tabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    $('#tab-body').scrollTop = 0;
    refresh(true);
  }
  // vuelve a pintar la pestaña solo si cambia su estructura; si no, solo actualiza qué se puede comprar
  function refresh(force) {
    const s = S();
    const ns = TABS[tab].sig();
    if (force || ns !== sig) { sig = ns; $('#tab-body').innerHTML = TABS[tab].html(); A11Y.pass($('#tab-body')); }
    const foe = Core.F.enemy;
    for (const c of $$('#tab-body [data-effk]')) {
      const m = s.mons[c.dataset.effk], ef = m && foe ? Core.eff(Core.fdex(m), foe.types) : 1;
      const t = ef >= 2 ? '▲ ×' + (Math.round(ef * 10) / 10) : ef < 0.5 ? L('✖ sin efecto', '✖ no effect') : ef < 1 ? '▼ ×½' : '', cl = 'effchip' + (ef >= 2 ? ' eup' : ef < 1 ? ' edn' : '');
      if (c.textContent !== t) c.textContent = t;
      if (c.className !== cl) c.className = cl;
    }
    for (const el of $$('#tab-body [data-rdy]')) {
      const [k, v] = el.dataset.rdy.split(':'), r = Core.chalReady(k === 't' ? Core.towerSpec(+v) : k === 'r' ? Core.rivalSpec(v) : Core.eventSpec(+v)), t = L('Poder ', 'Power ') + (r >= 10 ? '×' + fmt(Math.floor(r)) : Math.round(r * 100) + '%'), cl = 'rdy' + (r >= 1 ? ' ok' : r >= 0.7 ? ' mid' : '');
      if (el.textContent !== t) el.textContent = t;
      if (el.className !== cl) el.className = cl;
    }
    for (const b of $$('#tab-body [data-egg]')) {
      const e = s.eggs[+b.dataset.egg]; if (!e) continue;
      const need = Core.eggNeed(e), w = Math.min(100, e.p / need * 100).toFixed(1) + '%', t = fmt(Math.floor(Math.min(e.p, need))) + ' / ' + fmt(need);
      if (b.firstElementChild.style.width !== w) b.firstElementChild.style.width = w;
      if (b.lastElementChild.textContent !== t) b.lastElementChild.textContent = t;
    }
    for (const b of $$('#tab-body [data-cost]')) { const cur = b.dataset.cur || 'coins'; b.disabled = (cur.startsWith('tk:') ? s.tk[cur.slice(3)] : s[cur]) < +b.dataset.cost || b.dataset.off === '1'; }
  }

  const costBtn = (cost, label, act, extra = '', cur = 'coins') =>
    `<button class="btn primary buy" data-act="${act}" data-cost="${cost}" data-cur="${cur}" ${extra}><span>${label}</span><small>${ico(cur === 'gems' ? 'gem' : 'coin', 12)}${fmt(cost)}</small></button>`;

  const natTxt = m => { const n = Core.natOf(m); return n.up ? `${n.name} <em class="nu">▲${NAT_SHORT[n.up]}</em> <em class="nd">▼${NAT_SHORT[n.down]}</em>` : n.name + L(' (neutra)', ' (neutral)'); };
  let towerStart = 0;
  const rewText = r => !r ? '' : [r.ess && '+' + r.ess + L(' Esencia', ' Essence'), r.gems && '+' + r.gems + L(' gemas', ' gems'), r.shards && '+' + r.shards + L(r.shards === 1 ? ' fragmento Mega' : ' fragmentos Mega', r.shards === 1 ? ' Mega shard' : ' Mega shards'), r.dust && '+' + fmt(Core.srcCoins(r.dust)) + L(' monedas', ' coins'), ...Object.entries(r.tk || {}).map(([t, n]) => n + '× ' + TICKETS[t].name), r.egg !== undefined && EGGS[r.egg].name, r.item && L('un objeto', 'an item'), r.excl && L('un objeto exclusivo', 'an exclusive item')].filter(Boolean).join(' · ');
  const ruleTxt = r => r ? `<div class="rulebox"><b>${r.name}${r.only ? ' ' + TYPE_ES[r.only] : ''}</b>: ${r.desc}</div>` : '';
  function chalHtml() {
    const s = S();
    if (!Core.towerUnlocked()) return `<h3>${L('Retos', 'Challenges')}</h3><p class="hint">${L(`Derrota al primer jefe (etapa ${TOWER_UNLOCK}) para desbloquear el evento semanal y la Torre de batalla.`, `Beat the first boss (stage ${TOWER_UNLOCK}) to unlock the weekly event and the Battle Tower.`)}</p>`;
    const ev = Core.ev, col = TYPE_COLORS[ev.type], busy = Core.inChal() ? 'disabled' : '';
    const bonus = EVENT_BONUS[ev.bonus], d = Core.eventDaysLeft();
    let h = rivalHtml() + `<div class="evcard" style="--ec:${col}"><div class="evhead"><span class="evtag">${L('EVENTO SEMANAL', 'WEEKLY EVENT')}</span><b>${L('Semana ' + TYPE_NAMES[ev.type], TYPE_NAMES[ev.type] + ' Week')}</b><small>${L(`Termina en ${d} día${d > 1 ? 's' : ''}`, `Ends in ${d} day${d > 1 ? 's' : ''}`)}</small></div>
      <ul class="evfx"><li>${L(`Tus Pokémon de tipo ${TYPE_NAMES[ev.type]} hacen <b>+${Math.round(EVENT_DMG * 100)}%</b> de daño`, `Your ${TYPE_NAMES[ev.type]}-type Pokémon deal <b>+${Math.round(EVENT_DMG * 100)}%</b> damage`)}</li><li><b>${bonus.name}:</b> ${bonus.txt}</li></ul>
      <div class="evrow">${spb(ev.boss, 52)}<div>${L('Jefe del evento', 'Event boss')}<br><b>${DEX[ev.boss].name}</b> ${typeTags(ev.boss)}</div></div>
      <div class="tiers">${EVENT_TIERS.map((t, i) => `<button class="tierbtn ${s.event.tiers[i] ? 'done' : ''}" data-act="evboss" data-v="${i}" ${busy}><b>${t.name}${s.event.tiers[i] ? '<span style="color:#7ff0a0">✓</span>' : ''}</b><span data-rdy="e:${i}" class="rdy"></span><small>${s.event.tiers[i] ? L('Recompensa ya recogida', 'Reward already claimed') : rewText(t.rew)}</small></button>`).join('')}</div>
      <h3 style="margin-top:8px">${L('Misiones del evento', 'Event quests')}</h3>`;
    h += EVENT_TASKS.map((t, i) => {
      const p = Math.min(t.goal, s.event[t.stat]), got = s.event.claimed[t.id], ok = p >= t.goal;
      return `<div class="etask"><div class="qi"><b>${t.text(fmt(t.goal), TYPE_NAMES[ev.type])}</b><small>${fmt(p)} / ${fmt(t.goal)} · ${rewText(t.rew)}</small><div class="bar"><i style="width:${p / t.goal * 100}%"></i></div></div>${got ? '<button class="btn small" disabled>✓</button>' : `<button class="btn ${ok ? 'primary' : ''}" data-act="evtask" data-v="${i}" ${ok ? '' : 'disabled'}>${L('Recoger', 'Claim')}</button>`}</div>`;
    }).join('');
    h += '</div>';
    // Torre
    const starts = Core.towerStarts(), st = starts.includes(towerStart) ? towerStart : starts[starts.length - 1], sp = Core.towerSpec(st), nx = Core.towerSpec(s.tower.best + 1);
    h += `<h3>${L('Torre de batalla', 'Battle Tower')}</h3><div class="tower"><div class="hint" style="text-align:center">${L('Récord', 'Record')}</div><div class="big">${L('Piso', 'Floor')} ${s.tower.best}</div>
      <p class="hint" style="text-align:center">${L(`+${(TOWER_BONUS * s.tower.best * 100).toFixed(1)}% de daño permanente (${TOWER_BONUS * 100}% por piso)`, `+${(TOWER_BONUS * s.tower.best * 100).toFixed(1)}% permanent damage (${TOWER_BONUS * 100}% per floor)`)}</p>
      <div class="floorline">${L('Empiezas en el', 'You start at')} <b>${L('piso', 'floor')} ${st}</b> · ${typeTags(sp.dex)} <span data-rdy="t:${st}" class="rdy"></span></div>
      <div class="floorline">${L('Piso a batir', 'Floor to beat')}: <b>${nx.floor}</b> · ${tchip(nx.type)} <span data-rdy="t:${nx.floor}" class="rdy"></span> · ${rewText(Core.towerReward(nx.floor))}</div>
      ${ruleTxt(nx.rule)}
      <div class="row" style="margin-top:6px">${starts.length > 1 ? `<button class="dd" data-act="towerdd">${L('Empezar en el piso', 'Start at floor')} ${st}<i></i></button>` : ''}<button class="btn big primary" data-act="tower" data-v="${st}" ${busy}>${L('Subir a la Torre', 'Climb the Tower')}</button></div></div>
      <p class="hint">${L('Cada piso es un duelo contra un Pokémon de un tipo distinto con vida y tiempo fijos. Sigues subiendo hasta que caes; los pisos cada 5 son guardianes con una regla especial. Las recompensas se dan la primera vez que superas cada piso y puedes empezar desde cualquier guardián que ya hayas superado.', 'Each floor is a duel against a Pokémon of a different type with fixed HP and time. You keep climbing until you fall; every 5th floor is a guardian with a special rule. Rewards are given the first time you clear each floor and you can start from any guardian you have already beaten.')}</p>`;
    return h;
  }
  // ---------------- el rival: Nico ----------------
  function rivalHtml() {
    const s = S(), next = Core.rivalNext(), won = Core.rivalWins(), busy = Core.inChal() ? 'disabled' : '';
    let h = `<h3>${L('Rival', 'Rival')}: ${RIVAL_NAME} <small style="color:var(--dim)">${won}/${RIVAL_ENC.length} · +${Math.round(won * RIVAL_BONUS * 100)}% ${L('de daño', 'damage')}</small></h3>`;
    if (next) {
      const open = Core.rivalOpen(next), team = Core.rivalTeam(next);
      h += `<div class="rivalcard ${open ? 'open' : ''}"><div class="rvhead">${spb(team[team.length - 1], 52)}<div><b>${RIVAL_NAME} · ${REGIONS[next.region].name} ${next.meet ? 'II' : 'I'}</b><small>${open ? L('Nico te espera para un duelo', 'Nico is waiting for a duel') : L(`Llega a la etapa ${next.stage} para encontrarte con Nico`, `Reach stage ${next.stage} to meet Nico`)}</small></div></div>
        <div class="rvteam">${team.map(d => `<div class="rvm">${spb(d, 44)}<small>${DEX[d].name}</small>${typeTags(d)}</div>`).join('')}</div>
        <div class="floorline">${L('3 Pokémon seguidos con un solo cronómetro', '3 Pokémon in a row on a single timer')} · <span data-rdy="r:${next.id}" class="rdy"></span></div>
        <div class="floorline">${L('Recompensa', 'Reward')}: ${rewText(rivalReward(next))}</div>
        <div class="row"><button class="btn big primary" data-act="rival" data-v="${next.id}" ${open && !busy ? '' : 'disabled'}>${L('Aceptar el duelo', 'Accept the duel')}</button></div></div>`;
    } else if (Core.masterOpen()) {
      const t = s.rival.master + 1, e = masterEnc(t), team = Core.rivalTeam(e);
      h += `<div class="rivalcard open master"><div class="rvhead">${spb(team[team.length - 1], 52)}<div><b>${RIVAL_NAME} · ${L('Duelo Maestro', 'Master Duel')} ${t}</b><small>${L('La escalera no se acaba: cada nivel es más duro', 'The ladder never ends: every level is tougher')}</small></div></div>
        <div class="rvteam">${team.map(d => `<div class="rvm">${spb(d, 44)}<small>${DEX[d].name}</small>${typeTags(d)}</div>`).join('')}</div>
        <div class="floorline">${L('Vida', 'HP')} ×${Math.round(e.hp * 10) / 10} ${L('de un jefe', 'of a boss')} · <span data-rdy="r:master" class="rdy"></span></div>
        <div class="floorline">${L('Recompensa', 'Reward')}: ${rewText(masterReward(t))}</div>
        <div class="row"><button class="btn big primary" data-act="master" ${busy}>${L('Aceptar el duelo', 'Accept the duel')}</button></div></div>`;
    } else h += `<p class="hint">${L('Has ganado todos los duelos contra Nico. ¡Eres el mejor rival que Nico podía pedir!', 'You won every duel against Nico. You are the best rival Nico could ask for!')}</p>`;
    if (won) {
      h += `<div class="row" style="margin:4px 0"><button class="btn small" data-act="rivalall">${rivalAll ? L('Ocultar duelos ganados', 'Hide won duels') : L('Ver duelos ganados', 'Show won duels')}</button></div>`;
      if (rivalAll) h += RIVAL_ENC.filter(e => s.rival.won[e.id]).map(e => {
        const done = s.rival.rem[e.id] === Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
        return `<div class="etask"><div class="qi"><b>${REGIONS[e.region].name} ${e.meet ? 'II' : 'I'} ✓</b><small>${L('Revancha: una vez al día', 'Rematch: once a day')} · ${done ? L('ya hecha hoy', 'done today') : L('+monedas y gemas', '+coins and gems')}</small></div><button class="btn small" data-act="rivaltalk" data-v="${e.id}">${L('Historia', 'Story')}</button><button class="btn small primary" data-act="rival" data-v="${e.id}" ${busy}>${L('Revancha', 'Rematch')}</button></div>`;
      }).join('');
    }
    return h + `<p class="hint">${L('Nico es tu rival a lo largo de todo el viaje: dos duelos por región. La primera vez dan recompensas y +1% de daño permanente; después puedes pedir la revancha cada día.', 'Nico is your rival throughout the whole journey: two duels per region. The first time they give rewards and +1% permanent damage; afterwards you can ask for a rematch every day.')}</p>`;
  }
  function rivalTalk(e, which, d) {
    const team = Core.rivalTeam(e), won = which === 'post' && d;
    openModal(`<div class="rvtalk"><span class="rvav spb">${Sprites.html(team[team.length - 1], false, 76, true)}</span><div class="rvsay"><b>${RIVAL_NAME} · ${e.master ? L('Duelo Maestro ', 'Master Duel ') + e.master : REGIONS[e.region].name + ' ' + (e.meet ? 'II' : 'I')}</b>${which === 'story' ? `<p>“${e.pre}”</p><p>“${e.post}”</p>` : `<p>“${which === 'pre' ? e.pre : e.post}”</p>`}</div></div>
      ${won ? `<p class="hint" style="text-align:center">${d.first ? L('¡Primera victoria! ', 'First win! ') : L('Revancha: ', 'Rematch: ')}${d.rew ? rewText(d.rew) : L('Ya recogiste la recompensa de hoy', 'You already claimed today’s reward')}</p>` : ''}
      <div class="row">${which === 'story' ? `<button class="btn primary" id="rv-x">${L('Cerrar', 'Close')}</button>` : which === 'pre' ? `<button class="btn" id="rv-x">${L('Ahora no', 'Not now')}</button><button class="btn primary" id="rv-go">${L('¡Vamos!', 'Let’s go!')}</button>` : `<button class="btn primary" id="rv-ok">${L('Seguir', 'Continue')}</button>`}</div>`);
    if (which === 'story') $('#rv-x').onclick = closeModal;
    else if (which === 'pre') {
      $('#rv-x').onclick = closeModal;
      $('#rv-go').onclick = () => { closeModal(); if (e.master ? Core.startMaster() : Core.startRival(e.id)) Audio8.play('select'); else Audio8.play('error'); };
    } else { $('#rv-ok').onclick = () => { Core.save(); closeModal(); refresh(true); }; Core.save(); }
  }
  function presetModal() {
    const s = S();
    const row = (p, i) => `<div class="preset"><div class="pr-head"><input class="pr-name" data-i="${i}" value="${p.name.replace(/"/g, '').replace(/^Equipo (\d)$/, L('Equipo $1', 'Team $1'))}" maxlength="16" autocomplete="off"><span class="pr-n">${p.team.length ? p.team.length + ' Pokémon' : L('Vacío', 'Empty')}</span></div>
      <div class="pr-mons">${p.team.length ? p.team.map(k => s.mons[k] ? `<img src="${por(Core.fdex(s.mons[k]), s.mons[k].shiny)}" title="${DEX[Core.fdex(s.mons[k])].name}">` : '').join('') : '<small>' + L('Aún no has guardado ningún equipo aquí', 'You have not saved a team here yet') + '</small>'}</div>
      <div class="row tight"><button class="btn small primary" data-load="${i}" ${p.team.length ? '' : 'disabled'}>${L('Cargar', 'Load')}</button><button class="btn small" data-save="${i}">${L('Guardar el actual', 'Save current')}</button></div></div>`;
    openModal(`<h2>${L('Equipos guardados', 'Saved teams')}</h2><p class="hint">${L('Guarda tu equipo actual y cámbialo con un toque, por ejemplo uno para farmear y otro para el evento o la Torre.', 'Save your current team and swap with one tap, for example one for farming and another for the event or the Tower.')}</p>${s.presets.map(row).join('')}<div class="row"><button class="btn" id="pr-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#pr-x').onclick = closeModal;
    $$('.pr-name').forEach(inp => inp.onchange = () => { Core.renamePreset(+inp.dataset.i, inp.value); Core.save(); });
    $$('[data-save]').forEach(b => b.onclick = () => { if (Core.savePreset(+b.dataset.save)) { Audio8.play('item'); toast(L('Equipo guardado', 'Team saved')); Core.save(); presetModal(); } else Audio8.play('error'); });
    $$('[data-load]').forEach(b => b.onclick = () => {
      const r = Core.loadPreset(+b.dataset.load);
      if (!r) { Audio8.play('error'); return; }
      Audio8.play('swap'); closeModal(); Core.save(); refresh(true);
      toast(r.cut ? L('Equipo cargado (solo caben ' + S().slots + ')', 'Team loaded (only ' + S().slots + ' fit)') : L('Equipo cargado', 'Team loaded'));
    });
  }
  let brA = '', brB = '', brNat = 'a';
  function nurseryHtml() {
    const s = S();
    if (brA && !s.mons[brA]) brA = '';
    if (brB && !s.mons[brB]) brB = '';
    const slot = (k, w, label) => {
      const m = k && s.mons[k];
      return `<button class="nsl ${m ? 'has' : ''}" data-act="breedpick" data-v="${w}">${m ? `<img src="${por(m.dex, m.shiny)}"><b>${DEX[m.dex].name}</b><small>${Math.round(Core.ivPct(m) * 100)}% IV · ${Core.natOf(m).name}</small>` : `<span class="plus">+</span><b>${label}</b>`}</button>`;
    };
    const ok = brA && brB && brA !== brB;
    let h = `<h3>${L('Guardería', 'Nursery')}</h3><p class="hint">${L('Dos Pokémon dejan un huevo con IVs heredados. El principal da la especie.', 'Two Pokémon leave an egg with inherited IVs. The main one gives the species.')}</p><div class="nursery">${slot(brA, 'a', L('Principal', 'Main'))}<span class="heart">♥</span>${slot(brB, 'b', L('Pareja', 'Partner'))}</div>`;
    if (ok) {
      const cost = Core.breedCost(brA, brB), full = s.eggs.length >= EGG_CAP, t = BREED_EGG[Math.max(Core.RAR[s.mons[brA].dex], Core.RAR[s.mons[brB].dex])];
      h += `<div class="nfx"><div>${L('Huevo', 'Egg')}: <b style="color:${EGGS[t].color}">${EGGS[t].name}</b> (${fmt(EGGS[t].need)} ${L('victorias', 'victories')})</div>
        <div>${L('IVs esperados de la cría', 'Expected offspring IVs')}: <b>≈ ${Math.round(Core.breedExpect(brA, brB) * 100)}%</b></div>
        <div class="seg"><button data-act="breednat" data-v="a" class="${brNat === 'a' ? 'on' : ''}">${L('Naturaleza', 'Nature')}: ${Core.natOf(s.mons[brA]).name}</button><button data-act="breednat" data-v="b" class="${brNat === 'b' ? 'on' : ''}">${L('Naturaleza', 'Nature')}: ${Core.natOf(s.mons[brB]).name}</button></div>
        <button class="btn primary buy" data-act="breed" data-cost="${cost}" data-cur="coins" ${full ? 'data-off="1"' : ''}><span>${L('Criar', 'Breed')}</span><small>${ico('coin', 12)}${fmt(cost)}</small></button>${full ? '<small class="hint">' + L('Tienes el máximo de huevos', 'You have the maximum number of eggs') + '</small>' : ''}</div>`;
    }
    return h;
  }
  function breedPickModal(which) {
    openModal(`<h2>${which === 'a' ? L('Pokémon principal', 'Main Pokémon') : L('Pareja', 'Partner')}</h2>
      <div class="pickbar"><input class="search" id="pk-q" placeholder="${L('Buscar por nombre…', 'Search by name…')}" value="${pickQ.replace(/"/g, '')}" autocomplete="off"><button class="dd" id="pk-sort">${PICK_SORTS.find(x => x[0] === pickSort)[1]}<i></i></button></div>
      <div class="pickwrap" id="pk-list">${pickList()}</div><div class="row"><button class="btn" id="pk-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#modal-box').classList.add('wide');
    pickSlot = -1;
    $('#pk-x').onclick = closeModal;
    $('#pk-q').oninput = e => { pickQ = e.target.value; $('#pk-list').innerHTML = pickList(); };
    $('#pk-sort').onclick = e => openDD(e.currentTarget, PICK_SORTS, pickSort, v => { pickSort = v; breedPickModal(which); });
    $('#pk-list').onclick = e => {
      const b = e.target.closest('.pk'); if (!b) return;
      if (which === 'a') brA = b.dataset.k; else brB = b.dataset.k;
      Audio8.play('swap'); closeModal(); sig = ''; refresh(true);
    };
  }
  function genesModal(r) {
    const m = S().mons[r.base], g = r.genes;
    const line = (k, n) => `<div class="ivrow"><span>${IV_NAMES[k]}</span><b>${m.iv[k]}</b><span class="arrow">→</span><b style="color:${g.iv[k] > m.iv[k] ? '#7ff0a0' : g.iv[k] < m.iv[k] ? '#ff8c9a' : 'inherit'}">${g.iv[k]}</b></div>`;
    const pct = iv => Math.round((iv.d + iv.s + iv.c) / (3 * IV_MAX) * 100);
    const better = pct(g.iv) > pct(m.iv);
    openModal(`<h2>${L('Genes de la cría', 'Offspring genes')}</h2><p class="hint">${L(`${DEX[m.dex].name} ya tenía copia: la cría sumó una copia y monedas. ¿Con qué genes te quedas?`, `You already had ${DEX[m.dex].name}: the offspring added a copy and coins. Which genes do you keep?`)}</p>
      <div class="genes cmp"><div class="genehead"><span>${L('Naturaleza', 'Nature')}</span><span>${Core.natOf(m).name} → <b>${NATURES[g.nat].name}</b></span></div>
      ${['d', 's', 'c'].map(k => line(k)).join('')}<div class="genehead"><span>${L('Potencial', 'Potential')}</span><b>${pct(m.iv)}% → ${pct(g.iv)}%</b></div></div>
      <div class="row"><button class="btn ${better ? '' : 'primary'}" id="g-keep">${L('Mantener los míos', 'Keep mine')}</button><button class="btn ${better ? 'primary' : ''}" id="g-take">${L('Quedarme con los de la cría', 'Take the offspring genes')}</button></div>`);
    $('#g-keep').onclick = closeModal;
    $('#g-take').onclick = () => { Core.applyGenes(String(r.base), g); Audio8.play('levelup'); Core.save(); closeModal(); refresh(true); };
  }
  function incubatorHtml() {
    const s = S();
    let h = `<h3>${L('Incubadora', 'Incubator')} <small style="color:var(--dim)">${s.eggs.length}/${EGG_CAP} ${L('huevos', 'eggs')}</small></h3><div class="incubator">`;
    const eggRow = (e, i, active) => {
      const d = EGGS[e.t], ready = Core.eggReady(e);
      return `<div class="eggrow ${ready ? 'ready' : ''}" style="--ec:${d.color}"><span class="eico">${ico('egg' + e.t, 40)}</span><div class="info"><b>${d.name}${e.bred ? ' · ' + DEX[e.bred.base].name : ''}</b>
        ${active ? `<div class="bar egg" data-egg="${i}"><i></i><span></span></div>` : (() => { const need = Core.eggNeed(e), pc = Math.min(100, e.p / need * 100); return `<div class="bar egg paused"><i style="width:${pc.toFixed(1)}%"></i><span>${fmt(Math.floor(Math.min(e.p, need)))} / ${fmt(need)}</span></div><small>${L('En espera: conserva su progreso y sigue cuando vuelva a una incubadora', 'Waiting: it keeps its progress and resumes when it gets an incubator back')}</small>`; })()}</div>
        ${ready ? `<button class="btn primary" data-act="hatch" data-v="${i}">${L('¡Eclosionar!', 'Hatch!')}</button>` : active ? '' : `<button class="btn small" data-act="eggfront" data-v="${i}">${L('Incubar', 'Incubate')}</button>`}</div>`;
    };
    for (let i = 0; i < s.inc; i++) h += s.eggs[i] ? eggRow(s.eggs[i], i, true) : `<div class="eggrow empty"><span class="eico">${ico('egg0', 40)}</span><div class="info"><b>${L('Incubadora libre', 'Free incubator')}</b><small>${L('Los huevos caen de los Pokémon derrotados, los jefes y las misiones', 'Eggs drop from defeated Pokémon, bosses and quests')}</small></div></div>`;
    for (let i = s.inc; i < s.eggs.length; i++) h += eggRow(s.eggs[i], i, false);
    const ic = Core.incCost();
    if (ic) h += `<div class="eggrow locked"><div class="info"><b>${L('Incubadora', 'Incubator')} ${s.inc + 1}</b><small>${L('Incuba un huevo más a la vez', 'Incubate one more egg at a time')}</small></div>${costBtn(ic, L('Comprar', 'Buy'), 'buyinc', '', 'gems')}</div>`;
    h += '</div><p class="hint">' + L('Cada victoria avanza los huevos que están en una incubadora (jefe ×5, dorado ×3), también sin conexión. Al eclosionar sale un Pokémon con IVs mínimos garantizados y un 50% más de probabilidad de ser shiny.', 'Every victory advances the eggs in an incubator (boss ×5, golden ×3), also while offline. A hatched Pokémon has guaranteed minimum IVs and a 50% higher chance of being shiny.') + '</p>';
    h += `<div class="eggshop">` + EGGS.map((d, t) => `<button class="btn small buy" data-act="buyegg" data-v="${t}" data-cost="${d.gems}" data-cur="gems" ${s.eggs.length >= EGG_CAP ? 'data-off="1"' : ''} title="${d.desc} ${L('Necesita', 'Needs')} ${fmt(d.need)} ${L('victorias', 'victories')}."><span>${ico('egg' + t, 20)}</span><small>${ico('gem', 12)}${fmt(d.gems)}</small></button>`).join('') + '</div>';
    return h;
  }
  const itemName = it => HELD[it.id].name + (it.id === 'orbe' ? L(' de ', ' · ') + TYPE_NAMES[it.type] : '');
  const itemDesc = it => HELD[it.id].desc(Core.itemVal(it), it);
  function itemChip(k, m) {
    const it = Core.itemOf(m);
    return `<button class="itemchip ${it ? 'has' : ''}" data-act="item" data-v="${k}" ${it ? `style="--rc:${ITEM_RAR[it.rar].color}"` : ''} title="${it ? itemName(it) + ': ' + itemDesc(it) : L('Equipar un objeto', 'Equip an item')}">${it ? ico(HELD[it.id].icon, 24) : '+'}</button>`;
  }
  function buyN(m) {
    const bm = S().buyMul;
    if (bm === 'max') { const r = Core.maxAffordable(m); return r.n ? r : { n: 1, c: Core.levelCost(m, m.lvl) }; }
    return { n: bm, c: Core.levelCostN(m, bm) };
  }


  // ---------------- Pokédex: filtros, cuadrícula y ficha ----------------
  let dexQ = '', dexType = 'all', dexState = 'all', dexSort = 'num';
  const saveDexUi = () => { const u = S().ui; u.dexFilter = dexFilter; u.dexType = dexType; u.dexState = dexState; u.dexSort = dexSort; Core.save(); };
  function loadDexUi() { const u = S().ui; if (u.dexFilter) dexFilter = u.dexFilter; if (u.dexType) dexType = u.dexType; if (u.dexState) dexState = u.dexState; if (u.dexSort) dexSort = u.dexSort; }
  const dexRegions = () => [['all', L('Todas las regiones', 'All regions')], ['mine', L('Solo los míos', 'Mine only')]].concat(REGIONS.filter(r => r.gen).map(r => [String(r.gen), r.name]));
  const dexStates = () => [['all', L('Todos', 'All')], ['seen', L('Registrados', 'Registered')], ['missing', L('Sin registrar', 'Not registered')], ['owned', L('Los tengo', 'Owned')], ['shiny', L('Con shiny', 'With shiny')], ['forms', L('Formas regionales', 'Regional forms')], ['favs', L('Favoritos', 'Favorites')]];
  const dexSorts = () => [['num', L('Número', 'Number')], ['name', L('Nombre', 'Name')], ['rar', L('Rareza', 'Rarity')], ['lvl', L('Nivel', 'Level')], ['bst', L('Estadísticas', 'Stats')]];
  const dexNum = p => String(p.of || p.dex).padStart(4, '0');
  const DEX_CHUNK = 72;
  let dexList = [], dexShown = DEX_CHUNK, dexFsig = '';
  function dexGrid() {
    const s = S(), q = dexQ.trim().toLowerCase().replace(/^#/, '');
    let list = POKEDEX.filter(p => {
      const base = String(Core.baseOf(p.dex)), own = s.mons[base], seen = s.seen[p.dex], cur = own && own.dex === p.dex;
      if (/^[1-9]$/.test(dexFilter) && p.gen !== +dexFilter) return false;
      if (dexFilter === 'mine' && !(own && seen)) return false;
      if (dexType !== 'all' && !(seen ? p.types.includes(dexType) : false)) return false;
      if (dexState === 'seen' && !seen) return false;
      if (dexState === 'missing' && seen) return false;
      if (dexState === 'owned' && !cur) return false;
      if (dexState === 'shiny' && !(cur && own.shinyOwned)) return false;
      if (dexState === 'forms' && !p.form) return false;
      if (dexState === 'favs' && !s.favs[p.dex]) return false;
      if (q && !((seen && p.name.toLowerCase().includes(q)) || (p.dex < 10000 && String(p.dex) === q.replace(/^0+/, '')) || (p.dex < 10000 && dexNum(p).startsWith(q)))) return false;
      return true;
    });
    const key = { num: p => (p.of || p.dex) * 10 + (p.of ? 1 : 0), name: p => 0, rar: p => -Core.RAR[p.dex] * 1e5 + (p.of || p.dex), lvl: p => { const o = s.mons[String(Core.baseOf(p.dex))]; return o && o.dex === p.dex ? -o.lvl : 1e6 + p.dex; }, bst: p => -Core.bst(p.dex) };
    if (dexSort === 'name') list.sort((a, b) => (!!s.seen[b.dex] - !!s.seen[a.dex]) || a.name.localeCompare(b.name));
    else list.sort((a, b) => key[dexSort](a) - key[dexSort](b));
    if (!list.length) return `<p class="hint" style="grid-column:1/-1;text-align:center">${L('Ningún Pokémon coincide con los filtros.', 'No Pokémon match the filters.')}</p>`;
    dexList = list;
    const fs = [dexFilter, dexType, dexState, dexSort, dexQ].join('|');
    if (fs !== dexFsig) { dexFsig = fs; dexShown = DEX_CHUNK; }
    return list.slice(0, dexShown).map(dexCell).join('') + dexMore();
  }
  const dexMore = () => dexList.length > dexShown ? `<p class="hint dxmore" style="grid-column:1/-1;text-align:center">${L('Sigue bajando para ver más', 'Keep scrolling to see more')} (${dexShown}/${dexList.length})</p>` : '';
  function dexCell(p) {
    const s = S(), base = String(Core.baseOf(p.dex)), own = s.mons[base], seen = s.seen[p.dex], cur = own && own.dex === p.dex, locked = !Core.genUnlocked(p.gen);
    const canStar = cur && own.stars < 5 && own.copies >= STAR_COPIES[own.stars];
    return `<button class="${seen ? '' : 'unk'} ${cur && s.team.includes(base) ? 'inteam' : ''}" style="--rc:${cur ? RARITY[Core.RAR[p.dex]].color : seen ? '#2a3f8a' : '#1d2a5a'}" data-act="dexinfo" data-v="${p.dex}" aria-label="${seen ? p.name : (p.dex < 10000 ? '#' + p.dex : L('Forma sin registrar', 'Unregistered form'))}">
      ${cur ? `<span class="lv">${own.lvl}</span>` : ''}${cur && own.shinyOwned ? '<span class="sh">✨</span>' : ''}${s.favs[p.dex] ? '<span class="fv">★</span>' : ''}${seen ? `<span class="cell-spr">${Sprites.html(p.dex, cur && own.shiny, 46, false)}</span>` : `<span class="q">${locked ? '🔒' : '?'}</span>`}<span class="n">${seen ? (canStar ? '⬆ ' : '') + p.name : (p.dex < 10000 ? '#' + p.dex : '#???')}</span></button>`;
  }
  // la Pokédex se pinta por trozos: más rápida en móvil (antes se creaban de golpe más de 1000 botones)
  function dexScroll() {
    if (tab !== 'dex' || dexShown >= dexList.length) return;
    const tb = $('#tab-body'), g = $('#dexgrid'); if (!g || tb.scrollTop + tb.clientHeight < tb.scrollHeight - 700) return;
    const from = dexShown; dexShown = Math.min(dexList.length, dexShown + DEX_CHUNK);
    const m = g.querySelector('.dxmore'); if (m) m.remove();
    g.insertAdjacentHTML('beforeend', dexList.slice(from, dexShown).map(dexCell).join('') + dexMore());
  }
  const STAT_NAMES = () => [['hp', 'HP', 'HP'], ['atk', 'Ataque', 'Attack'], ['def', 'Defensa', 'Defense'], ['spa', 'At. Esp.', 'Sp. Atk'], ['spd', 'Def. Esp.', 'Sp. Def'], ['spe', 'Velocidad', 'Speed']];
  function evoTree(d, depth) {
    const s = S(), seen = s.seen[d], p = DEX[d], kids = Core.CHILDREN[d] || [];
    const node = `<button class="evn ${seen ? '' : 'unk'}" data-act="dexinfo" data-v="${d}" aria-label="${seen ? p.name : '???'}">${seen ? Sprites.html(d, false, 40, false) : '<span class="q">?</span>'}<small>${seen ? p.name : '???'}</small></button>`;
    if (!kids.length) return `<div class="evt">${node}</div>`;
    return `<div class="evt">${node}<div class="eva">→<small>${L('Nv.', 'Lv.')} ${EVO_LVL[Math.min(depth, EVO_LVL.length - 1)]}</small></div><div class="evk">${kids.map(k => evoTree(k, depth + 1)).join('')}</div></div>`;
  }
  function dexModal(dex) {
    const s = S(), p = DEX[dex]; if (!p) return;
    const base = String(Core.baseOf(dex)), own = s.mons[base], seen = !!s.seen[dex], cur = own && own.dex === dex, rar = Core.RAR[dex], reg = REGIONS[p.gen - 1];
    const num = p.dex < 10000 ? '#' + String(p.dex).padStart(4, '0') : L('Forma regional', 'Regional form');
    let h = `<div class="dxm"><div class="dxhead"><span class="dxpor sprbox ${seen ? '' : 'sil'}" aria-hidden="true">${Sprites.html(dex, cur && own.shiny, 88, true)}</span><div><small>${num}</small><h2>${seen ? p.name : '???'} ${seen ? `<button class="favbtn ${s.favs[dex] ? 'on' : ''}" id="dx-fav" aria-pressed="${!!s.favs[dex]}" aria-label="${L('Favorito', 'Favorite')}">★</button>` : ''}</h2>${seen ? typeTags(dex) : ''}${seen ? `<span class="rartag" style="color:${RARITY[rar].color}">${RARITY[rar].name}</span>` : ''}<small>${reg ? reg.name : ''} · ${L('Generación', 'Generation')} ${p.gen}</small></div></div>`;
    if (!seen) {
      h += `<p class="hint">${L('Aún no has registrado este Pokémon. Consíguelo en el gacha para ver su ficha completa.', 'You have not registered this Pokémon yet. Get it from the gacha to see its full entry.')}</p>${Core.genUnlocked(p.gen) ? '' : `<p class="hint">🔒 ${L('Llega a ' + reg.name + ' (etapa ' + (reg.first * 10 + 1) + ') para encontrarlo.', 'Reach ' + reg.name + ' (stage ' + (reg.first * 10 + 1) + ') to find it.')}</p>`}`;
    } else {
      const st = p.stats, tot = Core.bst(dex);
      h += `<h4>${L('Estadísticas base', 'Base stats')} <small style="color:var(--dim)">${L('Total', 'Total')} ${tot}</small></h4><div class="dxstats">${STAT_NAMES().map(([k, es, en]) => `<div class="brow"><span class="bl">${L(es, en)}</span><div class="bt"><i style="width:${Math.min(100, st[k] / 160 * 100)}%;background:${st[k] >= 110 ? '#7ff0a0' : st[k] >= 70 ? '#ffd23f' : '#8aa0ff'}"></i></div><em>${st[k]}</em></div>`).join('')}</div>`;
      // debilidades
      const wk = [], rs = [], im = [];
      for (const t of Object.keys(TYPE_NAMES)) { const m = Core.typeEff(t, p.types); if (m === 0) im.push([t]); else if (m >= 2) wk.push([t, m]); else if (m <= 0.5) rs.push([t, m]); }
      const chips = (arr, f) => arr.length ? arr.map(o => `<span class="type" style="background:${TYPE_COLORS[o[0] || o]}">${TYPE_ES[o[0] || o]}${f ? ' ' + f(o) : ''}</span>`).join('') : '<small>—</small>';
      h += `<h4>${L('Frente a los ataques', 'Against attacks')}</h4><div class="dxmatch"><div><b>${L('Débil', 'Weak')}</b>${chips(wk, o => '×' + o[1])}</div><div><b>${L('Resiste', 'Resists')}</b>${chips(rs, o => o[1] === 0.5 ? '×½' : '×¼')}</div>${im.length ? `<div><b>${L('Inmune', 'Immune')}</b>${chips(im)}</div>` : ''}</div>`;
      // evolución
      if (p.dex < 10000 || p.of) {
        const tree = evoTree(+base, 0);
        h += `<h4>${L('Línea evolutiva', 'Evolution line')}</h4><div class="dxevo">${tree}</div>`;
      }
      // formas
      const regs = POKEDEX.filter(x => x.of === dex || (p.of && x.of === p.of)).concat(p.of ? [DEX[p.of]] : []).filter((x, i, a) => x && x.dex !== dex && a.findIndex(y => y && y.dex === x.dex) === i);
      const megas = Core.MEGA_BY_BASE[dex] || [];
      if (regs.length || megas.length) {
        h += `<h4>${L('Otras formas', 'Other forms')}</h4><div class="dxforms">${regs.map(x => `<button class="evn ${s.seen[x.dex] ? '' : 'unk'}" data-act="dexinfo" data-v="${x.dex}">${s.seen[x.dex] ? `<img src="${por(x.dex)}" alt=""><small>${x.name}</small>` : '<span class="q">?</span><small>???</small>'}</button>`).join('')}${megas.map(x => `<div class="evn mega ${cur && own.megas.includes(x.form) ? '' : 'unk'}"><img src="${por(x.dex)}" alt=""><small>${x.form === 'primal' ? L('Primigenio', 'Primal') : 'Mega' + (x.form.length === 1 ? ' ' + x.form.toUpperCase() : '')}${cur && own.megas.includes(x.form) ? '' : ' 🔒'}</small></div>`).join('')}</div>`;
      }
      // ataques
      const mt = MOVE_TIERS[p.types[0]], tier = cur ? Core.tierOf(own.lvl) : -1;
      h += `<h4>${L('Ataques', 'Moves')} <small style="color:var(--dim)">${TYPE_ES[p.types[0]]}</small></h4><div class="dxmoves">${mt.map((id, i) => `<span class="mv ${i <= tier ? 'on' : ''}"><i style="background:${TYPE_COLORS[MOVES[id].type]}"></i>${MOVES[id].name}<small>${L('Nv.', 'Lv.')} ${TIER_LV[i]}</small></span>`).join('')}</div>`;
      // dónde aparece
      const ap = Core.appearsIn(dex);
      let where = '';
      if (p.leg) where = L('Pokémon legendario: solo aparece como jefe o en el gacha.', 'Legendary Pokémon: it only appears as a boss or from the gacha.');
      else if (!ap.length) where = L('No aparece como enemigo salvaje en la primera vuelta.', 'It does not appear as a wild enemy in the first loop.');
      else {
        const byReg = {}; for (const ri of ap) { const r = REGIONS[Core.regionOfRoute(ri)].name; (byReg[r] = byReg[r] || []).push(ROUTES[ri].name); }
        where = Object.entries(byReg).slice(0, 4).map(([r, l]) => `<b>${r}</b>: ${l.slice(0, 3).join(', ')}${l.length > 3 ? ' +' + (l.length - 3) : ''}`).join('<br>') + (Object.keys(byReg).length > 4 ? '<br>…' : '');
      }
      h += `<h4>${L('Dónde aparece', 'Where it appears')}</h4><p class="dxwhere">${where}</p><p class="hint">${L('Derrotado', 'Defeated')} <b>${fmt(Core.foeKills(dex))}</b> ${L('veces', 'times')}.</p>`;
      // tu Pokémon
      if (cur) {
        const g = Core.ivGrade(own), need = own.stars < 5 ? STAR_COPIES[own.stars] : 0;
        h += `<h4>${L('Tu Pokémon', 'Your Pokémon')}</h4><div class="dxown">${starsHtml(own.stars)} <b>${L('Nv.', 'Lv.')} ${own.lvl}</b>${own.shinyOwned ? ' ✨' : ''}${own.megas.length ? ' <span class="megatag">MEGA</span>' : ''}<br><small>${natTxt(own)} · <span class="gr" style="background:${g[2]}">IV ${Math.round(Core.ivPct(own) * 100)}% · ${g[1]}</span></small>${need ? `<br><small>${L('Copias', 'Copies')}: ${own.copies}/${need}</small>` : ''}</div><div class="row"><button class="btn primary" id="dx-mon">${L('Gestionar', 'Manage')}</button></div>`;
      } else if (own) h += `<p class="hint">${L('Tu línea está ahora en ' + DEX[own.dex].name + '.', 'Your line is currently at ' + DEX[own.dex].name + '.')}</p>`;
    }
    h += `<div class="row"><button class="btn" id="dx-x">${L('Cerrar', 'Close')}</button></div></div>`;
    openModal(h);
    $('#modal-box').classList.add('wide');
    $('#dx-x').onclick = closeModal;
    if ($('#dx-fav')) $('#dx-fav').onclick = () => { Core.toggleFav(dex); Core.save(); Audio8.play('click'); sig = ''; dexModal(dex); };
    if ($('#dx-mon')) $('#dx-mon').onclick = () => { closeModal(); monModal(base); };
  }

  // texto corto de cada mejora: etiqueta (ES, EN) y valor según el nivel, para ver «ahora → siguiente» en una sola línea
  const UPV = {
    tap: ['Toque (%DPS)', 'Tap (%DPS)', n => (15 + 2 * n) + '%'],
    train: ['Daño equipo', 'Team damage', n => '+' + n * 10 + '%'],
    coin: ['Monedas', 'Coins', n => '+' + n * 15 + '%'],
    crit: ['Prob. crítico', 'Crit chance', n => (3 + n * 2) + '%'],
    critdmg: ['Daño crítico', 'Critical damage', n => '×' + (3 + n * 0.25).toFixed(2)],
    speed: ['Vel. ataque', 'Attack speed', n => '+' + n * 4 + '%'],
    catch: ['Prob. ticket', 'Ticket chance', n => (1.5 + n * 0.5).toFixed(1) + '%'],
    golden: ['Dorados', 'Golden', n => '1/' + Math.round(1 / (1 / 120 + n * 0.002))],
    type: ['Súper eficaz', 'Super effective', n => '+' + n * 4 + '%'],
    boss: ['Daño a jefes', 'Boss damage', n => '+' + n * 4 + '%'],
    autotap: ['Toques auto', 'Auto taps', n => n * 0.5 + '/s'],
    bosstime: ['Tiempo jefes', 'Boss time', n => '+' + n * 3 + ' s'],
  };
  const TABS = {
    team: {
      sig: () => { const s = S(); return JSON.stringify([s.team.map(k => [k, s.mons[k].lvl, s.mons[k].dex, s.mons[k].mf, s.mons[k].stars, s.mons[k].shiny, s.mons[k].item]), s.inv.length, s.tactic, Core.tacticOpen(), s.slots, s.buyMul, s.buyMul === 'max' ? Math.floor(Math.log(s.coins + 1) * 3) : 0, s.medals, s.up.train, Core.dexCount(), s.badges, s.team.map(k => [s.mons[k].nat, Core.ivSum(s.mons[k])]), Core.routeIdx(s.stage), Core.isBoss(s.stage), s.kills >= 10 && !s.auto]); },
      html() {
        const s = S();
        let h = `<div class="teamhead"><div class="seg">${[1, 10, 25, 'max'].map(v => `<button data-act="mul" data-v="${v}" class="${s.buyMul === v ? 'on' : ''}">${v === 'max' ? L('Máx', 'Max') : 'x' + v}</button>`).join('')}</div><div class="rowbtns"><button class="btn small" data-act="presets" title="${L('Guarda y carga equipos', 'Save and load teams')}">${L('Equipos', 'Teams')}</button><button class="btn small" data-act="best" title="${L('Elige a tus Pokémon que mejor golpean a los enemigos de esta ruta', 'Picks your Pokémon that hit the enemies of this route best')}">${L('Mejor equipo', 'Best team')}</button><button class="btn small" data-act="bag">${L('Mochila', 'Bag')} · ${s.inv.length}</button></div></div>`;
        const tgt = s.kills >= 10 && !s.auto && !Core.isBoss(s.stage) ? s.stage + 1 : s.stage, strong = Core.strongTypes(tgt);
        if (strong.length) h += `<div class="foehint">${Core.isBoss(tgt) ? L('Contra el jefe', 'Against the boss') : L('En esta ruta', 'On this route')}: ${L('usa', 'use')} ${strong.map(o => `<span class="type" style="background:${TYPE_COLORS[o.t]}">${TYPE_ES[o.t]}</span>`).join('')}</div>`;
        for (let i = 0; i < 6; i++) {
          const k = s.team[i];
          if (i >= s.slots) {
            h += i === s.slots ? `<div class="card locked"><div class="info"><b>${L('Hueco', 'Slot')} ${i + 1} ${L('bloqueado', 'locked')}</b><small>${L('Un Pokémon más combatiendo a la vez', 'One more Pokémon fighting at a time')}</small></div>${costBtn(SLOT_COST[i], L('Desbloquear', 'Unlock'), 'slot')}</div>` : '';
            continue;
          }
          if (!k) { h += `<div class="card empty"><div class="info"><b>${L('Hueco', 'Slot')} ${i + 1} ${L('libre', 'free')}</b><small>${L('Pon a combatir a otro de tus Pokémon', 'Put another one of your Pokémon to fight')}</small></div><button class="btn primary" data-act="pick" data-v="${i}">${L('Elegir', 'Choose')}</button></div>`; continue; }
          const m = s.mons[k], rar = Core.RAR[m.dex], st = Core.stageOf(m.dex), kids = Core.CHILDREN[m.dex];
          const evo = kids && st < EVO_LVL.length ? L(`Evoluciona a Nv. ${EVO_LVL[st]}`, `Evolves at Lv. ${EVO_LVL[st]}`) : '';
          const fd = Core.fdex(m), t0 = DEX[fd].types[0], tier = Core.tierOf(m.lvl), mv = MOVES[Core.moveOf(m)];
          const next = tier + 1 < TIER_LV.length ? L(`Nuevo ataque a Nv. ${TIER_LV[tier + 1]}: `, `New move at Lv. ${TIER_LV[tier + 1]}: `) + MOVES[MOVE_TIERS[t0][tier + 1]].name : L('Ataque máximo', 'Max move');
          const b = buyN(m);
          h += `<div class="card" style="--rc:${RARITY[rar].color}">
            <img class="por" src="${por(fd, m.shiny)}" data-act="mon" data-v="${k}">
            <div class="info"><b>${m.shiny ? '<span class="shiny-tag">✨</span>' : ''}${m.mf ? '<span class="megatag">MEGA</span>' : ''}${DEX[fd].name} <small style="display:inline">${L('Nv.', 'Lv.')} ${m.lvl}</small></b>
            ${starsHtml(m.stars)} ${typeTags(fd)} <span data-effk="${k}"></span>
            <small class="natline">${natTxt(m)} · <span class="gr" style="background:${Core.ivGrade(m)[2]}">IV ${Math.round(Core.ivPct(m) * 100)}% · ${Core.ivGrade(m)[1]}</span></small>
            <small class="mv"><i style="background:${TYPE_COLORS[mv.type]}"></i>${mv.name} · ${fmt(Core.monDmg(m) / Core.monRate(m))} ${L('daño/s', 'dmg/s')}</small>
            <small class="evo">${evo ? evo + ' · ' : ''}${next}</small></div>
            <div class="acts">${costBtn(b.c, L('Subir +', 'Level +') + b.n, 'lvl', `data-v="${k}"`)}<div class="rowbtns">${itemChip(k, m)}<button class="btn small" data-act="pick" data-v="${i}">${L('Cambiar', 'Change')}</button></div></div></div>`;
        }
        const sy = Core.synergies();
        h += '<h3>' + L('Sinergias de equipo', 'Team synergies') + '</h3>';
        h += sy.list.length ? sy.list.map(x => `<div class="syn on"><b>${x.name}</b><small>${x.txt}</small></div>`).join('') : '<p class="hint">' + L('Aún no tienes ninguna activa.', 'You have none active yet.') + '</p>';
        h += '<p class="hint">' + L('Mismo tipo: 2 Pokémon +8%, 3 +20%, 4 +35%, 5 +55%, 6 +80% de daño a los de ese tipo. Diversidad: 4 tipos distintos +15%, 6 +30%. Legendarios: 2 +20%, 4 +50%. Shinies: 2 +10% monedas, 4 +25%. Veterano: todos con ★3 o más +25%. Combos de objetos: con 3 objetos distintos del mismo grupo (Arsenal, Equipo de caza o Granja) el equipo gana un bonus.', 'Same type: 2 Pokémon +8%, 3 +20%, 4 +35%, 5 +55%, 6 +80% damage to those of that type. Diversity: 4 different types +15%, 6 +30%. Legendaries: 2 +20%, 4 +50%. Shinies: 2 +10% coins, 4 +25%. Veteran: all ★3 or more +25%. Item combos: with 3 different items of the same group (Arsenal, Hunting party or Farm) the team gets a bonus.') + '</p>';
        h += `<p class="hint">${L('Consejo: los Pokémon hacen x2 de daño cuando su tipo es eficaz contra el enemigo (lo ves en cada tarjeta) y la mitad si se resiste. Naturaleza e IVs mejoran a cada Pokémon: las copias repetidas tiran IVs nuevos y te quedas con los mejores. Cada 25 niveles su daño se duplica y cada cierto nivel aprenden un ataque más potente.', 'Tip: Pokémon deal x2 damage when their type is effective against the enemy (shown on each card) and half if resisted. Nature and IVs improve each Pokémon: duplicate copies roll new IVs and you keep the best. Every 25 levels their damage doubles and at certain levels they learn a stronger move.')}</p>`;
        return h;
      },
    },
    up: {
      sig: () => JSON.stringify([S().up, S().stage, Math.round(Math.log2(Core.teamDps() + 1) * 4), S().buyMul, S().buyMul === 'max' ? Object.keys(UPGRADES).map(id => Core.upPlan(id, 'max').n).join() : '']),
      html() {
        const s = S();
        let h = '<h3>' + L('Mejoras', 'Upgrades') + '</h3><div class="seg upmul" role="group" aria-label="' + L('Cantidad por compra', 'Amount per purchase') + '">' + [1, 10, 25, 'max'].map(v => `<button data-act="mul" data-v="${v}" class="${s.buyMul === v ? 'on' : ''}" aria-pressed="${s.buyMul === v}">${v === 'max' ? L('Máx', 'Max') : 'x' + v}</button>`).join('') + '</div><p class="hint">' + L('Se pierden al entrar en la Liga, pero las medallas lo compensan con creces.', 'They are lost when you enter the League, but medals more than make up for it.') + '</p>';
        for (const [id, u] of Object.entries(UPGRADES)) {
          const n = s.up[id], maxed = n >= u.max;
          const uv = UPV[id], pl = maxed ? { n: 0, c: 0 } : Core.upPlan(id, s.buyMul), kk = Math.max(1, pl.n), pv = Core.previewUp(id, kk), arrow = (a, b) => `<span class="upvals"><em class="now">${a}</em><i aria-hidden="true">→</i><em class="nxt">${b}</em></span>`;
          h += `<div class="card upc"><span class="ico">${ico(u.icon, 36)}</span><div class="info"><b>${u.name} <small style="display:inline">${L('Nv.', 'Lv.')} ${n}</small></b>
            <div class="upline"><span class="uplbl">${L(uv[0], uv[1])}</span>${maxed ? `<span class="upvals"><em class="now">${uv[2](n)}</em></span>` : arrow(uv[2](n), uv[2](n + kk))}</div>
            ${pv && !maxed ? `<div class="upline sub"><span class="uplbl">${{ tap: L('Tu toque', 'Your tap'), coin: L('Por derrota', 'Per kill'), train: L('Daño/s equipo', 'Team dmg/s') }[id]}</span>${arrow(fmt(pv.a), fmt(pv.b))}</div>` : ''}</div>
            ${maxed ? '<button class="btn small" disabled>' + L('Máx.', 'Max') + '</button>' : (() => { const cost = pl.n ? pl.c : Core.upCost(id); return costBtn(cost, L('Mejorar', 'Upgrade') + (pl.n > 1 ? ' +' + pl.n : ''), 'up', `data-v="${id}"`); })()}</div>`;
        }
        return h;
      },
    },
    gacha: {
      sig: () => { const s = S(); return JSON.stringify([s.pity, s.pityE, s.bannerLost, Core.ticketPrice('poke'), Core.featuredEpic(), Core.featuredLegend(), Core.unlockedGens(), Core.freePullReady(), s.tk, s.eggs.map((e, i) => [e.t, i >= s.inc ? Math.floor(e.p) : -1, Core.eggReady(e), e.bred ? e.bred.base : 0]), s.inc, Core.incCost(), brA, brB, brNat]); },
      html() {
        const s = S(), fe = Core.featuredEpic(), fl = Core.featuredLegend();
        let h = '<div class="tkgrid">' + Object.entries(TICKETS).map(([t, k]) => `<div class="tkbox" style="--tc:${k.color}">${ico(k.icon, 36)}<b>${s.tk[t]}</b><small>${k.name}</small>
          <button class="btn small primary" data-act="buytk" data-v="${t}" data-n="1" data-cost="${Core.ticketPrice(t)}" data-cur="${k.cur}">+1 ${ico(k.cur === 'gems' ? 'gem' : 'coin', 10)} ${fmt(Core.ticketPrice(t))}</button></div>`).join('') + '</div>';
        h += incubatorHtml() + nurseryHtml();
        if (Core.freePullReady()) h += `<div class="feat free"><span>${ico('tkPoke', 48)}</span><div><b>${L('¡Tirada diaria gratis!', 'Free daily pull!')}</b><small>${L('Una Poké Ball gratis cada día, sin ticket', 'A free Poké Ball every day, no ticket needed')}</small></div><button class="btn primary" data-act="freepull">${L('Abrir', 'Open')}</button></div>`;
        const feat = (d, tag, cls) => `<div class="feat ${cls || ''}"><span class="tagx">${tag}</span>${spb(d, 66)}<div><b>${DEX[d].name}</b><small>${RARITY[Core.RAR[d]].name}</small><br>${typeTags(d)}</div></div>`;
        h += `<h3>${L('Destacados de la Bola Destacada', 'Featured Ball highlights')}</h3>` + feat(fl, L('LEGENDARIO · SEMANA', 'LEGENDARY · WEEK'), 'leg') + feat(fe, L('ÉPICO · 3 DÍAS', 'EPIC · 3 DAYS'), 'epic');
        h += `<div class="pity">${L('Épico garantizado en', 'Epic guaranteed in')} <b>${Math.max(0, PITY_EPIC - s.pityE)}</b> ${L('tiradas', 'pulls')} · ${L('Legendario en', 'Legendary in')} <b>${Math.max(0, PITY - s.pity)}</b> ${L('(con tickets Super, Ultra o Maestro)', '(with Great, Ultra or Master tickets)')}${s.bannerLost ? '<br><b style="color:#ffd23f">' + L('¡El próximo legendario de la Bola Destacada será el destacado!', 'The next legendary from the Featured Ball will be the featured one!') + '</b>' : ''}<div class="bar"><i style="width:${s.pity / PITY * 100}%"></i></div></div>`;
        const ballCard = ([id, b]) => {
          const tk = TICKETS[b.ticket];
          return `<div class="ball-card"><span class="bi">${ico(b.icon, 48)}</span><b>${b.name}</b><p>${b.desc}</p>
            <div class="rates">${b.rates.map((r, k) => r ? `<span style="color:${RARITY[k].color}">${RARITY[k].name} ${r}%</span>` : '').join('')}</div>
            <div class="btns">
              <button class="btn primary" data-act="pull" data-v="${id}" data-n="1" data-cost="1" data-cur="tk:${b.ticket}">${L('Abrir', 'Open')} x1 ${ico(tk.icon, 14)} 1</button>
              <button class="btn primary" data-act="pull" data-v="${id}" data-n="10" data-cost="${Core.ticketCost(10)}" data-cur="tk:${b.ticket}">${L('Abrir', 'Open')} x10 ${ico(tk.icon, 14)} ${Core.ticketCost(10)}</button>
            </div></div>`;
        };
        const entries = Object.entries(BALLS);
        h += entries.filter(([id, b]) => !b.region && !b.event && id !== 'master').map(ballCard).join('');
        h += ballCard(['master', BALLS.master]);
        h += '<h3>' + L('Bolas regionales', 'Regional balls') + '</h3><p class="hint">' + L('Solo Pokémon de la región (usan 1 Ticket Super). Se abren al llegar a ella.', 'Only Pokémon from the region (they use 1 Great Ticket). They open when you reach it.') + '</p>';
        let locked = 0;
        for (const [id, b] of entries.filter(([, b]) => b.region)) {
          if (!Core.ballAvailable(id)) { if (!locked++) h += `<div class="ball-row locked"><span>${ico(b.icon, 24)}</span><b>${b.name}</b><small>${L('Llega a', 'Reach')} ${REGIONS[b.gen - 1].name} (${L('etapa', 'stage')} ${REGIONS[b.gen - 1].first * 10 + 1})</small></div>`; continue; }
          h += `<div class="ball-row"><span>${ico(b.icon, 24)}</span><b>${b.name}</b>
            <button class="btn small primary" data-act="pull" data-v="${id}" data-n="1" data-cost="1" data-cur="tk:super">x1 ${ico('tkSuper', 12)} 1</button>
            <button class="btn small primary" data-act="pull" data-v="${id}" data-n="10" data-cost="${Core.ticketCost(10)}" data-cur="tk:super">x10 ${ico('tkSuper', 12)} ${Core.ticketCost(10)}</button></div>`;
        }
        h += `<p class="hint">${L('Los Pokémon solo se consiguen en el gacha. Los tickets caen de los Pokémon derrotados, de los jefes, las misiones y los logros, o se compran con monedas y gemas. x10 cuesta 9 tickets y garantiza un Pokémon raro o mejor. Las copias repetidas suben estrellas (★ multiplica el daño). 1 de cada 100 es shiny (+50% de daño).', 'Pokémon can only be obtained from the gacha. Tickets drop from defeated Pokémon, bosses, quests and achievements, or are bought with coins and gems. x10 costs 9 tickets and guarantees a rare Pokémon or better. Duplicate copies raise stars (★ multiplies damage). 1 in 100 is shiny (+50% damage).')}</p>`;
        return h;
      },
    },
    dex: {
      sig: () => { const s = S(); let h = 7; for (const m of Object.values(s.mons)) h = (Math.imul(h, 31) + m.dex * 7 + m.stars * 131 + m.lvl * 17 + (m.shiny ? 1 : 0) + (m.shinyOwned ? 2 : 0) + (m.copies >= STAR_COPIES[m.stars] ? 4 : 0)) | 0; return [h, Object.keys(s.seen).length, s.team.join(','), dexFilter, dexType, dexState, dexSort, Core.unlockedGens(), Object.keys(s.foes).length, Object.keys(s.favs).length].join('|'); },
      html() {
        const s = S(), n = Core.regCount(), dn = Core.dexCount(), all = POKEDEX.length;
        const owned = POKEDEX.filter(p => { const o = s.mons[String(Core.baseOf(p.dex))]; return o && o.dex === p.dex; }).length;
        const shinies = Object.values(s.mons).filter(m => m.shinyOwned).length;
        const forms = POKEDEX.filter(p => p.form), formsSeen = forms.filter(p => s.seen[p.dex]).length;
        const regs = REGIONS.filter(r => r.gen).map(r => { const tot = POKEDEX.filter(p => p.gen === r.gen).length, got = POKEDEX.filter(p => p.gen === r.gen && Core.isReg(p.dex)).length; return { r, tot, got }; });
        let h = `<div class="dexhead"><span>${L('Registrados', 'Registered')} <b style="color:#fff">${n}/${all}</b> · +${dn}% ${L('de daño (por especies obtenidas)', 'damage (from species you own)')}</span></div>
          <div class="dexsum"><div><b>${owned}</b><small>${L('Especies que tienes', 'Species owned')}</small></div><div><b>${shinies}</b><small>✨ Shiny</small></div><div><b>${formsSeen}/${forms.length}</b><small>${L('Formas regionales', 'Regional forms')}</small></div><div><b>${s.stats.megas}/${MEGA_DEX.length}</b><small>${L('Formas Mega', 'Mega forms')}</small></div><div><b>${Object.keys(s.foes).length}</b><small>${L('Bestiario', 'Bestiary')}</small></div></div>
          <div class="regbars">${regs.map(o => `<button class="regbar ${dexFilter === String(o.r.gen) ? 'on' : ''}" data-act="dexreg" data-v="${o.r.gen}" aria-label="${o.r.name} ${o.got}/${o.tot}"><span>${o.r.name}</span><div class="bt"><i style="width:${o.got / o.tot * 100}%"></i></div><em>${o.got}/${o.tot}</em></button>`).join('')}</div>
          <div class="dexfilters"><input class="search" id="dex-q" type="search" placeholder="${L('Buscar por nombre o número…', 'Search by name or number…')}" value="${dexQ.replace(/"/g, '&quot;')}" aria-label="${L('Buscar en la Pokédex', 'Search the Pokédex')}">
          <button class="dd" data-act="dexdd">${dexRegions().find(f => f[0] === dexFilter)[1]}<i></i></button><button class="dd" data-act="dextype">${dexType === 'all' ? L('Todos los tipos', 'All types') : TYPE_ES[dexType]}<i></i></button><button class="dd" data-act="dexstate">${dexStates().find(f => f[0] === dexState)[1]}<i></i></button><button class="dd" data-act="dexsort">${L('Orden', 'Sort')}: ${dexSorts().find(f => f[0] === dexSort)[1]}<i></i></button></div>
          <div class="dexgrid" id="dexgrid">${dexGrid()}</div>`;
        return h + '<p class="hint">' + L('Toca un Pokémon para ver su ficha: estadísticas, debilidades, evolución, ataques y dónde aparece. Los Pokémon que no tienes solo se consiguen en el gacha.', 'Tap a Pokémon to see its entry: stats, weaknesses, evolution, moves and where it appears. Pokémon you do not own can only be obtained from the gacha.') + '</p>';
      },
    },
    chal: {
      sig: () => { const s = S(); return JSON.stringify([Core.towerUnlocked(), Core.ev && Core.ev.w, s.event, s.tower.best, s.rival, rivalAll, Core.S.stats.maxStage >= 40, Core.inChal(), Core.towerStarts().length, towerStart, Core.eventDaysLeft()]); },
      html: chalHtml,
    },
    quests: {
      sig: () => { const s = S(); return JSON.stringify([s.daily, s.weekly, s.ach, s.daily.quests.map(q => Core.questProg(q)), s.weekly.quests.map(q => Core.questProg(q)), ACHIEVEMENTS.map(a => Core.achStat(a) >= a.goal), achShowAll]); },
      html() {
        const s = S();
        const qrow = (q, i, act) => { const p = Core.questProg(q), ok = p >= q.goal; return `<div class="quest ${q.claimed ? 'done' : ok ? 'ready' : ''}"><div class="qi"><b>${Core.questText(q)}</b><small>${fmt(p)} / ${fmt(q.goal)}</small><div class="bar"><i style="width:${p / q.goal * 100}%"></i></div></div>
          ${q.claimed ? '<button class="btn small" disabled>' + L('Hecho', 'Done') + '</button>' : `<button class="btn ${ok ? 'primary' : ''}" data-act="${act}" data-v="${i}" ${ok ? '' : 'disabled'}>${ico('gem', 12)} ${Math.round(q.reward * Core.gemMult())}</button>`}</div>`; };
        let h = '<h3>' + L('Recompensa diaria', 'Daily reward') + '</h3>';
        h += `<div class="quest ${s.daily.claimed ? 'done' : 'ready'}"><span>${ico('gem', 30)}</span><div class="qi"><b>${L(`Día ${s.daily.streak} de racha`, `Day ${s.daily.streak} streak`)}</b><small>${L('Entra cada día: la recompensa crece hasta el día 7', 'Come back every day: the reward grows until day 7')}</small></div>${s.daily.claimed ? '<button class="btn small" disabled>' + L('Mañana más', 'More tomorrow') + '</button>' : `<button class="btn primary" data-act="daily">${ico('gem', 12)} ${Core.dailyReward()}</button>`}</div>`;
        h += '<h3>' + L('Misiones de hoy', "Today's quests") + '</h3>' + s.daily.quests.map((q, i) => qrow(q, i, 'quest')).join('');
        h += '<h3>' + L('Misiones semanales', 'Weekly quests') + '</h3>' + s.weekly.quests.map((q, i) => qrow(q, i, 'wquest')).join('');
        const done = ACHIEVEMENTS.filter(a => s.ach[a.id]).length;
        h += `<h3>${L('Logros', 'Achievements')} <small style="color:var(--dim)">${done}/${ACHIEVEMENTS.length}</small></h3>`;
        const groups = {};
        for (const a of ACHIEVEMENTS) (groups[a.stat] = groups[a.stat] || []).push(a);
        let show = [];
        for (const g of Object.values(groups)) {
          g.sort((a, b) => a.goal - b.goal);
          const open = g.filter(a => !s.ach[a.id]);
          if (achShowAll) show.push(...g); else show.push(...open.filter(a => Core.achStat(a) >= a.goal), ...open.filter(a => Core.achStat(a) < a.goal).slice(0, 1));
        }
        show.sort((a, b) => (!!s.ach[a.id] - !!s.ach[b.id]) || ((Core.achStat(b) >= b.goal) - (Core.achStat(a) >= a.goal)));
        for (const a of show) {
          const v = Core.achStat(a), ok = v >= a.goal, got = s.ach[a.id];
          h += `<div class="quest ${got ? 'done' : ok ? 'ready' : ''}"><span>${ico(got ? 'trophy' : a.icon, 24)}</span><div class="qi"><b>${a.name}</b><small>${a.desc} · ${fmt(Math.min(v, a.goal))}/${fmt(a.goal)}</small></div>
            ${got ? '<button class="btn small" disabled>✓</button>' : `<button class="btn ${ok ? 'primary' : ''}" data-act="ach" data-v="${a.id}" ${ok ? '' : 'disabled'}>${ico('gem', 12)} ${a.reward}</button>`}</div>`;
        }
        h += `<div class="row"><button class="btn small" data-act="achall">${achShowAll ? L('Ocultar completados', 'Hide completed') : L('Ver todos los logros', 'Show all achievements')}</button></div>`;
        return h;
      },
    },
    league: {
      sig: () => { const s = S(); return JSON.stringify([s.medals, s.mp, s.shop, Core.medalGain(), s.maxStage, s.stats.prestiges, Core.badgeCount(), s.asc, s.stats.maxStage >= ASC.min]); },
      html() {
        const s = S(), g = Core.medalGain();
        let h = `<div class="league"><h3>${L('Liga Pokémon', 'Pokémon League')}</h3>
          <div>${ico('crown', 48)}</div><div class="big">${fmt(s.medals)}</div><p class="hint">${L(`Medallas de la Liga · +${fmt(s.medals * 3)}% de daño y de monedas para siempre`, `League medals · +${s.medals * 3}% damage and coins forever`)}</p>`;
        if (g) h += `<p>${L(`Si entras ahora en la Liga ganas <b style="color:var(--yellow)">+${g} medallas</b> y ${g} Puntos de Liga.`, `If you enter the League now you earn <b style="color:var(--yellow)">+${g} medals</b> and ${g} League Points.`)}</p>${leagueTip(g)}<p class="hint">${L('Vuelves a la etapa 1 y pierdes monedas, niveles y mejoras. Conservas tus Pokémon, estrellas, gemas y la Pokédex.', 'You go back to stage 1 and lose coins, levels and upgrades. You keep your Pokémon, stars, gems and the Pokédex.')}</p><button class="btn big primary" data-act="prestige">${L('Entrar en la Liga', 'Enter the League')}</button>`;
        else h += `<p class="hint">${L(`Llega a la <b>etapa 60</b> para poder entrar. Cuanto más lejos llegues, más medallas: en la etapa 100 son ${Core.medalFor(100)} y en la 200, ${Core.medalFor(200)}.`, `Reach <b>stage 60</b> to be able to enter. The further you get, the more medals: at stage 100 it is ${Core.medalFor(100)} and at 200, ${Core.medalFor(200)}.`)}</p>`;
        h += ascHtml();
        h += `<h3>${L('Tienda de la Liga', 'League shop')} <small style="color:var(--dim)">${ico('crown', 14)} ${s.mp} ${L('puntos', 'points')}</small></h3><div style="text-align:left">`;
        for (const [id, u] of Object.entries(LEAGUE_SHOP)) {
          const n = s.shop[id], maxed = n >= u.max;
          h += `<div class="card"><span class="ico">${ico(u.icon, 36)}</span><div class="info"><b>${u.name} <small style="display:inline">${L('Nv.', 'Lv.')} ${n}</small></b><small>${u.desc(n)}</small>${maxed ? '' : `<small style="color:#7ff0a0">${L('Siguiente', 'Next')}: ${u.desc(n + 1)}</small>`}</div>
            ${maxed ? '<button class="btn small" disabled>' + L('Máx.', 'Max') + '</button>' : `<button class="btn primary buy" data-act="shop" data-v="${id}" data-cost="${Core.shopCost(id)}" data-cur="mp"><span>${L('Comprar', 'Buy')}</span><small>${ico('crown', 12)}${Core.shopCost(id)}</small></button>`}</div>`;
        }
        const st = s.stats;
        h += `</div><div class="row" style="margin:4px 0 8px"><button class="btn primary" data-act="stats">${L('Ver estadísticas y gráficas', 'View statistics and charts')}</button>${Cloud.enabled() ? `<button class="btn" data-act="ranking">${L('Rankings', 'Rankings')}</button>` : ''}</div><div class="statgrid"><span>${L('Etapa máxima', 'Max stage')} <b>${st.maxStage}</b></span><span>${L('Pokémon derrotados', 'Pokémon defeated')} <b>${fmt(st.kills)}</b></span><span>${L('Jefes vencidos', 'Bosses beaten')} <b>${fmt(st.bosses)}</b></span><span>${L('Poké Balls abiertas', 'Poké Balls opened')} <b>${fmt(st.pulls)}</b></span>
          <span>${L('Capturas', 'Catches')} <b>${fmt(st.catches)}</b></span><span>${L('Evoluciones', 'Evolutions')} <b>${fmt(st.evolutions)}</b></span><span>Shinies <b>${fmt(st.shinies)}</b></span><span>${L('Monedas totales', 'Total coins')} <b>${fmt(st.coinsTotal)}</b></span>
          <span>${L('Medallas de gimnasio', 'Gym badges')} <b>${Core.badgeCount()}/24</b></span><span>${L('Tiempo jugado', 'Time played')} <b>${Math.floor(st.time / 3600)}h ${Math.floor(st.time / 60) % 60}m</b></span></div></div>`;
        return h;
      },
    },
  };

  // ---------------- desplegables propios ----------------
  let ddEl = null;
  const ddKey = e => { if (e.key === 'Escape' && ddEl) { e.stopPropagation(); e.preventDefault(); closeDD(); } };
  function closeDD() { if (ddEl) { ddEl.remove(); ddEl = null; } document.removeEventListener('keydown', ddKey, true); }
  function openDD(anchor, options, value, onPick) {
    closeDD();
    const r = anchor.getBoundingClientRect(), pop = document.createElement('div');
    pop.className = 'dd-pop';
    pop.style.left = r.left + 'px'; pop.style.top = (r.bottom + 4) + 'px'; pop.style.minWidth = r.width + 'px';
    pop.innerHTML = options.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(value) ? 'on' : ''}">${l}</button>`).join('');
    pop.onclick = e => { const b = e.target.closest('button'); if (b) { closeDD(); onPick(b.dataset.v); } };
    document.body.appendChild(pop); ddEl = pop; document.addEventListener('keydown', ddKey, true);
    const pr = pop.getBoundingClientRect();
    if (pr.bottom > innerHeight - 8) pop.style.top = Math.max(8, r.top - pr.height - 4) + 'px';
    if (pr.right > innerWidth - 8) pop.style.left = Math.max(8, innerWidth - pr.width - 8) + 'px';
    setTimeout(() => document.addEventListener('pointerdown', function out(e) { if (ddEl && !ddEl.contains(e.target)) { closeDD(); } else if (ddEl) document.addEventListener('pointerdown', out, { once: true }); }, { once: true }), 0);
  }

  // ---------------- acciones ----------------
  function act(el) {
    const s = S(), a = el.dataset.act, v = el.dataset.v;
    switch (a) {
      case 'mul': s.buyMul = v === 'max' ? 'max' : +v; Audio8.play('click'); break;
      case 'lvl': {
        const m = s.mons[v], b = buyN(m);
        if (Core.levelUp(v, b.n)) Audio8.play('levelup'); else Audio8.play('error');
        break;
      }
      case 'slot': if (Core.buySlot()) { Audio8.play('item'); banner(L('¡Nuevo hueco en el equipo!', 'New team slot!'), L('Elige qué Pokémon combate en él', 'Choose which Pokémon fights in it'), '#7ff0a0'); autoFill(); } break;
      case 'up': if (Core.buyUpN(v, S().buyMul)) Audio8.play('levelup'); break;
      case 'tab': setTab(v); return;
      case 'pick': pickModal(+v); return;
      case 'item': itemModal(v); return;
      case 'bag': bagModal(); return;
      case 'pull': doPull(v, +el.dataset.n); break;
      case 'presets': presetModal(); return;
      case 'best': {
        const tgt = s.kills >= 10 && !s.auto && !Core.isBoss(s.stage) ? s.stage + 1 : s.stage;
        const keys = Core.bestTeam(tgt, s.slots);
        if (keys.join() === s.team.join()) { toast(L('Ya tienes el mejor equipo para esta ruta', 'You already have the best team for this route')); break; }
        Core.setTeamList(keys); Audio8.play('swap'); toast(L('Equipo ideal para ' + (Core.isBoss(tgt) ? 'el jefe' : 'esta ruta'), 'Ideal team for ' + (Core.isBoss(tgt) ? 'the boss' : 'this route')));
        break;
      }
      case 'tower': if (Core.startTower(+v)) Audio8.play('select'); else Audio8.play('error'); break;
      case 'tactic': if (Core.setTactic(v)) Audio8.play('swap'); break;
      case 'rival': { const e = RIVAL_ENC.find(x => x.id === v); if (e) { if (S().rival.won[v]) { if (Core.startRival(v)) Audio8.play('select'); else Audio8.play('error'); } else rivalTalk(e, 'pre'); } return; }
      case 'rivaltalk': { const e = RIVAL_ENC.find(x => x.id === v); if (e) rivalTalk(e, 'story'); return; }
      case 'rivalall': rivalAll = !rivalAll; break;
      case 'master': { const t = s.rival.master + 1, e = masterEnc(t); if (Core.masterOpen()) rivalTalk(e, 'pre'); return; }
      case 'evboss': if (Core.startEvent(+v)) Audio8.play('select'); else Audio8.play('error'); break;
      case 'evtask': { const t = EVENT_TASKS[+v]; if (Core.claimEventTask(+v)) { Audio8.play('ticket'); toast(L('¡Recompensa! ', 'Reward! ') + rewText(t.rew)); } break; }
      case 'towerdd': openDD(el, Core.towerStarts().map(c => [c, L('Piso ', 'Floor ') + c + (c === 1 ? '' : L(' (guardián superado)', ' (guardian beaten)'))]), towerStart, val => { towerStart = +val; sig = ''; refresh(true); }); return;
      case 'breedpick': breedPickModal(v); return;
      case 'breednat': brNat = v; break;
      case 'breed': { const e = Core.breed(brA, brB, brNat); if (e) { Audio8.play('item'); toast(L('¡Huevo en camino!', 'Egg on the way!')); brA = brB = ''; } else Audio8.play('error'); break; }
      case 'hatch': { const r = Core.hatch(+v); if (r) { Core.save(); playReveal([r], 'egg' + r.egg, 'egg' + r.egg, EGGS[r.egg].name, r.genes ? () => genesModal(r) : null); return; } break; }
      case 'eggfront': {
        const s0 = S(), out = s0.eggs.length >= s0.inc ? s0.eggs[s0.inc - 1] : null;      // el huevo que deja la incubadora
        Core.moveEgg(+v); Audio8.play('swap');
        if (out && s0.eggs.indexOf(out) >= s0.inc) { const need = Core.eggNeed(out); toast(L(`${EGGS[out.t].name} pasa a la espera y conserva su progreso (${fmt(Math.floor(Math.min(out.p, need)))}/${fmt(need)})`, `${EGGS[out.t].name} goes to the waiting list and keeps its progress (${fmt(Math.floor(Math.min(out.p, need)))}/${fmt(need)})`)); }
        break;
      }
      case 'buyegg': if (Core.buyEgg(+v)) Audio8.play('item'); else Audio8.play('error'); break;
      case 'buyinc': if (Core.buyInc()) { Audio8.play('levelup'); toast(L('¡Nueva incubadora!', 'New incubator!')); } else Audio8.play('error'); break;
      case 'freepull': doPull('poke', 1, true); break;
      case 'buytk': if (Core.buyTicket(v, +el.dataset.n)) Audio8.play('item'); else Audio8.play('error'); break;
      case 'shop': if (Core.buyShop(v)) Audio8.play('levelup'); break;
      case 'dexdd': openDD(el, dexRegions(), dexFilter, val => { dexFilter = val; saveDexUi(); sig = ''; refresh(true); }); return;
      case 'dextype': openDD(el, [['all', L('Todos los tipos', 'All types')]].concat(Object.keys(TYPE_NAMES).map(t => [t, TYPE_ES[t]])), dexType, val => { dexType = val; saveDexUi(); sig = ''; refresh(true); }); return;
      case 'dexstate': openDD(el, dexStates(), dexState, val => { dexState = val; saveDexUi(); sig = ''; refresh(true); }); return;
      case 'dexsort': openDD(el, dexSorts(), dexSort, val => { dexSort = val; saveDexUi(); sig = ''; refresh(true); }); return;
      case 'dexreg': dexFilter = dexFilter === v ? 'all' : v; saveDexUi(); sig = ''; break;
      case 'dexinfo': dexModal(+v); return;
      case 'mon': monModal(v); return;
      case 'seen': toast(DEX[v].name + L(': lo has visto, pero aún no lo tienes', ': you have seen it, but do not own it yet')); return;
      case 'noown': toast(L('Solo se consigue en el gacha', 'It can only be obtained from the gacha')); return;
      case 'locked': toast(L('Región bloqueada: llega a ella para descubrir sus Pokémon', 'Region locked: reach it to discover its Pokémon')); return;
      case 'daily': { const g = Core.claimDaily(); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + L(' gemas y tickets', ' gems and tickets')); } break; }
      case 'quest': { const g = Core.claimQuest(+v); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + L(' gemas y ticket', ' gems and a ticket')); } break; }
      case 'wquest': { const g = Core.claimQuest(+v, true); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + L(' gemas y 2 tickets Super', ' gems and 2 Great tickets')); } break; }
      case 'ach': { const g = Core.claimAch(v); if (g) { Audio8.play('rare'); toast(ico('trophy', 18) + ' +' + g + L(' gemas y tickets', ' gems and tickets')); } break; }
      case 'achall': achShowAll = !achShowAll; break;
      case 'prestige': prestigeModal(); return;
      case 'ascend': ascendModal(); return;
      case 'stats': statsModal(false); return;
      case 'ranking': rankingModal(); return;
    }
    Core.save();
    refresh(true);
  }
  function autoFill() {
    const s = S();
    const free = Object.keys(s.mons).filter(k => !s.team.includes(k)).sort((a, b) => Core.monDmg(s.mons[b]) - Core.monDmg(s.mons[a]));
    while (s.team.length < s.slots && free.length) s.team.push(free.shift());
  }

  // ---------------- cambiar Pokémon del equipo ----------------
  let pickSlot = 0, pickSort = 'dps', pickQ = '';
  const PICK_SORTS = [['dps', L('Por daño', 'By damage')], ['lvl', L('Por nivel', 'By level')], ['rar', L('Por rareza', 'By rarity')], ['num', L('Por número', 'By number')], ['star', L('Por estrellas', 'By stars')]];
  function pickList() {
    const s = S();
    let list = Object.entries(s.mons).map(([k, m]) => ({ k, m, dps: Core.monDmg(m) / Core.monRate(m) }));
    const q = pickQ.trim().toLowerCase();
    if (q) list = list.filter(o => DEX[o.m.dex].name.toLowerCase().includes(q));
    const key = { dps: o => -o.dps, lvl: o => -o.m.lvl, rar: o => -Core.RAR[o.m.dex] * 1e6 - o.m.lvl, num: o => o.m.dex, star: o => -o.m.stars * 1e6 - o.m.lvl }[pickSort];
    list.sort((a, b) => key(a) - key(b));
    if (!list.length) return '<p class="hint">' + L('No hay ningún Pokémon con ese nombre.', 'No Pokémon with that name.') + '</p>';
    return '<div class="pickgrid">' + list.map(({ k, m, dps }) => {
      const at = s.team.indexOf(k);
      return `<button class="pk ${at === pickSlot ? 'cur' : ''}" data-k="${k}" style="--rc:${RARITY[Core.RAR[m.dex]].color}"><img src="${por(Core.fdex(m), m.shiny)}" loading="lazy">
        <b>${m.shiny ? '✨' : ''}${DEX[Core.fdex(m)].name}</b><small>${L('Nv.', 'Lv.')} ${m.lvl} · ${starsHtml(m.stars)}</small><small>${fmt(dps)}/s</small>${at >= 0 ? `<span class="slot">${at + 1}</span>` : ''}</button>`;
    }).join('') + '</div>';
  }
  function pickModal(slot) {
    pickSlot = slot;
    openModal(`<h2>${L(`Hueco ${slot + 1}: elige un Pokémon`, `Slot ${slot + 1}: choose a Pokémon`)}</h2>
      <div class="pickbar"><input class="search" id="pk-q" placeholder="${L('Buscar por nombre…', 'Search by name…')}" value="${pickQ.replace(/"/g, '')}" autocomplete="off"><button class="dd" id="pk-sort">${PICK_SORTS.find(x => x[0] === pickSort)[1]}<i></i></button></div>
      <div class="pickwrap" id="pk-list">${pickList()}</div>
      <p class="hint">${L('Si eliges uno que ya está en otro hueco, se intercambian.', 'If you pick one that is already in another slot, they swap.')}</p>
      <div class="row">${S().team[slot] && S().team.length > 1 ? '<button class="btn danger" id="pk-rm">' + L('Quitar del equipo', 'Remove from team') + '</button>' : ''}<button class="btn" id="pk-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#pk-x').onclick = closeModal;
    if ($('#pk-rm')) $('#pk-rm').onclick = () => { Core.unsetTeam(slot); Audio8.play('swap'); Core.save(); closeModal(); refresh(true); };
    $('#pk-q').oninput = e => { pickQ = e.target.value; $('#pk-list').innerHTML = pickList(); };
    $('#pk-sort').onclick = e => openDD(e.currentTarget, PICK_SORTS, pickSort, v => { pickSort = v; pickModal(slot); });
    $('#pk-list').onclick = e => {
      const b = e.target.closest('.pk'); if (!b) return;
      Core.setTeam(slot, b.dataset.k); Audio8.play('swap'); Core.save(); closeModal(); refresh(true);
    };
  }

  // ---------------- objetos ----------------
  const itemCard = (it, extra = '') => `<button class="it" data-u="${it.u}" style="--rc:${ITEM_RAR[it.rar].color}">${ico(HELD[it.id].icon, 36)}<span><b>${itemName(it)}</b><small>${ITEM_RAR[it.rar].name} · ${itemDesc(it)}</small></span>${extra}</button>`;
  function holderOf(u) { const s = S(); const k = Object.keys(s.mons).find(k => s.mons[k].item === u); return k ? s.mons[k] : null; }
  function itemModal(key) {
    const s = S(), m = s.mons[key], cur = Core.itemOf(m);
    const list = s.inv.slice().sort((a, b) => b.rar - a.rar || a.id.localeCompare(b.id));
    openModal(`<h2>${L('Objeto de ' + DEX[m.dex].name, DEX[m.dex].name + "'s item")}</h2>
      ${cur ? `<div class="curitem">${itemCard(cur, '<em>' + L('Equipado', 'Equipped') + '</em>')}</div>` : '<p class="hint">' + L('No lleva ningún objeto.', 'It holds no item.') + '</p>'}
      <div class="pickwrap itemlist2" id="it-list">${list.length ? list.map(it => { const h = holderOf(it.u); return itemCard(it, h && h !== m ? `<em>${L('Lo lleva', 'Held by')} ${DEX[h.dex].name}</em>` : ''); }).join('') : '<p class="hint">' + L('Aún no tienes objetos. Los sueltan los jefes y, con suerte, los Pokémon salvajes.', 'You have no items yet. Bosses drop them and, with luck, wild Pokémon.') + '</p>'}</div>
      <div class="row">${cur ? '<button class="btn danger" id="it-rm">' + L('Quitar objeto', 'Remove item') + '</button>' : ''}<button class="btn" id="it-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#it-x').onclick = closeModal;
    if ($('#it-rm')) $('#it-rm').onclick = () => { Core.unequip(key); Audio8.play('swap'); Core.save(); closeModal(); refresh(true); };
    $('#it-list').onclick = e => { const b = e.target.closest('.it'); if (!b) return; Core.equip(key, +b.dataset.u); Audio8.play('item'); Core.save(); closeModal(); refresh(true); };
  }
  function bagModal() {
    const s = S(), list = s.inv.slice().sort((a, b) => b.rar - a.rar || a.id.localeCompare(b.id)), fg = Core.fuseGroups();
    openModal(`<h2>${L('Mochila', 'Bag')} · ${list.length} ${L('objetos', 'items')}</h2>
      <div class="row" style="margin:0 0 8px"><button class="btn small" id="bag-spare">${L('Reciclar comunes sin usar', 'Recycle unused commons')}</button><button class="btn small primary" id="bag-buy" ${s.coins >= Core.dc(ITEM_DUST_COST) ? '' : 'disabled'}>${L('Objeto al azar', 'Random item')} ${ico('coin', 12)} ${fmt(Core.dc(ITEM_DUST_COST))}</button></div>
      <div class="row" style="margin:0 0 8px"><button class="btn small" id="bag-craft" ${s.coins >= Core.dc(ITEM_CRAFT_COST) ? '' : 'disabled'}>${L('Taller: elegir objeto', 'Workshop: pick an item')} ${ico('coin', 12)} ${fmt(Core.dc(ITEM_CRAFT_COST))}</button></div>
      ${fg.length ? `<div class="fuselist"><b>${L('Fusión', 'Fusion')}</b> <small>${L('3 objetos iguales sin usar → 1 de la rareza siguiente', '3 identical unused items → 1 of the next rarity')}</small>${fg.map(g => `<button class="btn small ${s.coins >= g.cost ? 'primary' : ''}" data-fuse="${g.id}|${g.rar}|${g.type}" ${s.coins >= g.cost ? '' : 'disabled'}>${ico(HELD[g.id].icon, 16)} ${itemName(g)} ${ITEM_RAR[g.rar].name}→${ITEM_RAR[g.rar + 1].name} · ${ico('coin', 12)} ${fmt(g.cost)}</button>`).join('')}</div>` : ''}
      <p class="hint" style="margin:0 0 6px">${L('Toca un objeto para reciclarlo y recuperar monedas.', 'Tap an item to recycle it for coins.')}</p>
      <div class="pickwrap itemlist2" id="bag-list">${list.length ? list.map(it => { const h = holderOf(it.u); return itemCard(it, `<em>${h ? L('Lo lleva ', 'Held by ') + DEX[h.dex].name : '+' + fmt(Core.srcCoins(ITEM_RAR[it.rar].dust)) + L(' monedas', ' coins')}</em>`); }).join('') : '<p class="hint">' + L('Aún no tienes objetos. Los sueltan los jefes y, con suerte, los Pokémon salvajes.', 'You have no items yet. Bosses drop them and, with luck, wild Pokémon.') + '</p>'}</div>
      <div class="row"><button class="btn" id="bag-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#bag-x').onclick = closeModal;
    $$('[data-fuse]').forEach(b => b.onclick = () => { const [id, rar, type] = b.dataset.fuse.split('|'); const it = Core.fuseItem(id, +rar, type); if (it) { Audio8.play('legend'); banner(L('¡Fusión! ', 'Fusion! ') + itemName(it), ITEM_RAR[it.rar].name + ' · ' + itemDesc(it), ITEM_RAR[it.rar].color); Core.save(); bagModal(); refresh(true); } else Audio8.play('error'); });
    $('#bag-craft').onclick = e => openDD(e.currentTarget, Object.keys(HELD).filter(id => !HELD[id].excl).map(id => [id, HELD[id].name + ' · ' + HELD[id].desc(HELD[id].v, { type: 'normal' }).slice(0, 48)]), null, id => {
      const make = type => { const it = Core.craftItem(id, type); if (it) { Audio8.play('item'); toast(L('Fabricado: ', 'Crafted: ') + itemName(it)); Core.save(); bagModal(); refresh(true); } else Audio8.play('error'); };
      if (id === 'orbe') setTimeout(() => openDD($('#bag-craft'), Object.keys(TYPE_NAMES).map(t => [t, TYPE_NAMES[t]]), null, make), 30); else make();
    });
    $('#bag-spare').onclick = () => { const r = Core.recycleSpare(); Audio8.play(r.n ? 'ticket' : 'error'); if (r.n) toast(L(`${r.n} objeto${r.n > 1 ? 's reciclados' : ' reciclado'}: +${fmt(r.d)} monedas`, `Recycled ${r.n} item${r.n > 1 ? 's' : ''}: +${fmt(r.d)} coins`)); Core.save(); bagModal(); refresh(true); };
    $('#bag-buy').onclick = () => { const it = Core.buyItem(); if (it) { Audio8.play('item'); banner(L('¡', '') + itemName(it) + '!', ITEM_RAR[it.rar].name + ' · ' + itemDesc(it), ITEM_RAR[it.rar].color); Core.save(); bagModal(); refresh(true); } };
    $('#bag-list').onclick = e => {
      const b = e.target.closest('.it'); if (!b) return;
      const it = s.inv.find(i => i.u === +b.dataset.u); if (!it) return;
      const h = holderOf(it.u);
      if (h) { toast(L('Lo lleva ' + DEX[h.dex].name + ': quítaselo primero', DEX[h.dex].name + ' holds it: take it off first')); return; }
      const d = Core.recycleItem(it.u); Audio8.play('ticket'); toast('+' + fmt(d) + L(' monedas', ' coins')); Core.save(); bagModal(); refresh(true);
    };
  }

  // ---------------- tutorial inicial ----------------
  const TUT = [
    { sel: '#arena', text: L('Tu Pokémon combate solo contra los Pokémon salvajes de cada ruta. ¡Toca a los enemigos para hacer daño extra!', 'Your Pokémon fights wild Pokémon on its own on every route. Tap the enemies to deal extra damage!'), wait: () => S().stats.taps >= 3, hint: L('Toca al enemigo 3 veces', 'Tap the enemy 3 times') },
    { sel: '.cur.coins', text: L('Cada Pokémon derrotado te da monedas. Mira cómo sube el contador.', 'Every defeated Pokémon gives you coins. Watch the counter go up.'), next: 1 },
    { sel: '.a-top', text: L('Cada 10 victorias pasas de etapa. En la décima hay un jefe con tiempo limitado: si tu equipo aún no es lo bastante fuerte, sigue combatiendo en la etapa anterior y retará al jefe solo cuando esté listo.', 'Every 10 victories you move to the next stage. The tenth has a boss with a time limit: if your team is not strong enough yet, it keeps fighting on the previous stage and will challenge the boss only when ready.'), next: 1 },
    { tab: 'team', sel: '[data-act="lvl"]', text: L('Gasta tus monedas en subir de nivel a tu Pokémon. Aprenderá ataques más potentes y evolucionará. ¡Sube un nivel!', 'Spend your coins to level up your Pokémon. It will learn stronger moves and evolve. Level up once!'), wait: () => S().stats.levels >= 1, hint: L('Pulsa «Subir»', 'Press “Level”'), pre: () => { if (S().coins < 12) S().coins = 12; } },
    { sel: '#tabs [data-tab="gacha"]', text: L('Los Pokémon solo se consiguen en el gacha. Abre la pestaña.', 'Pokémon can only be obtained from the gacha. Open the tab.'), wait: () => tab === 'gacha', hint: L('Toca «Gacha»', 'Tap “Gacha”') },
    { sel: '[data-act="pull"][data-v="poke"][data-n="1"]', text: L('Las bolas se abren con tickets. Tienes Tickets Poké de regalo. ¡Abre una Poké Ball!', 'Balls are opened with tickets. You have some free Poké Tickets. Open a Poké Ball!'), wait: () => S().stats.pulls >= 1 && $('#gacha-fx').classList.contains('hidden'), hint: L('Pulsa «Abrir x1»', 'Press “Open x1”') },
    { sel: '.tkgrid', text: L('Aquí ves tus tickets. Caen de los jefes, los Pokémon derrotados, las misiones y los logros, y también puedes comprarlos con monedas o gemas.', 'Here are your tickets. They drop from bosses, defeated Pokémon, quests and achievements, and you can also buy them with coins or gems.'), next: 1 },
    { sel: '.incubator', text: L('Los huevos eclosionan con tus victorias, incluso sin conexión. Los de las incubadoras avanzan; ¡ya tienes uno de regalo! Al abrirlos salen Pokémon con IVs altos y más opciones de ser shiny.', 'Eggs hatch with your victories, even offline. The ones in incubators advance; you already have a free one! Hatched Pokémon have high IVs and a better shiny chance.'), next: 1 },
    { tab: 'team', sel: '[data-act="pick"]', text: L('Cuando tengas más Pokémon, cámbialos desde aquí. Abre más huecos para que combatan varios a la vez.', 'When you have more Pokémon, swap them from here. Unlock more slots so several fight at once.'), next: 1 },
    { sel: '[data-act="best"]', text: L('Cada Pokémon tiene tipo, naturaleza e IVs. Los golpes súper eficaces hacen x2: mira las etiquetas ▲ de cada tarjeta, y «Mejor equipo» elige solo a los más eficaces para la ruta.', 'Every Pokémon has a type, nature and IVs. Super effective hits deal x2: look at the ▲ tags on each card, and “Best team” picks only the most effective ones for the route.'), next: 1 },
    { sel: '.itemchip', text: L('Cada Pokémon puede llevar un objeto. Los jefes los sueltan y están en la Mochila.', 'Each Pokémon can hold an item. Bosses drop them and they are in the Bag.'), next: 1 },
    { sel: '#skills', text: L('Tres habilidades activas: Furia (más daño), Fiebre del Oro (más monedas) y Lluvia de Tickets. Úsalas cuando estén listas.', 'Three active skills: Rage (more damage), Gold Rush (more coins) and Ticket Rain. Use them when ready.'), next: 1 },
    { sel: '#tabs [data-tab="chal"]', text: L('En Retos está Nico, tu rival (duelos con historia), un evento cada semana con un tipo protagonista (bonus de daño, jefe, misiones y una bola propia) y la Torre de batalla, un duelo tras otro con reglas especiales.', 'Challenges has Nico, your rival (story duels), a weekly event with a featured type (damage bonus, boss, quests and its own ball) and the Battle Tower, one duel after another with special rules.'), next: 1 },
    { sel: '#tabs [data-tab="quests"]', text: L('Las misiones diarias y semanales, los logros y la recompensa diaria te dan gemas y tickets. ¡Entra cada día!', 'Daily and weekly quests, achievements and the daily reward give you gems and tickets. Come back every day!'), next: 1 },
    { sel: '#tabs [data-tab="league"]', text: L('Al llegar a la etapa 60 podrás entrar en la Liga: reinicias el viaje a cambio de bonus permanentes y una tienda de mejoras. Más adelante, desde la etapa 500, podrás ascender para tener multiplicadores que no dejan de crecer.', 'At stage 60 you can enter the League: you restart the journey in exchange for permanent bonuses and an upgrade shop. Later, from stage 500, you can ascend for multipliers that never stop growing.'), next: 1 },
    { text: L('¡Listo! Ahora te toca a ti: llega lo más lejos que puedas, colecciona los ' + POKEDEX.length + ' Pokémon y completa la Pokédex. Puedes repetir este tutorial desde Ajustes.', 'All set! Now it is your turn: get as far as you can, collect all ' + POKEDEX.length + ' Pokémon and complete the Pokédex. You can repeat this tutorial from Settings.'), next: 1, last: 1 },
  ];
  let tutI = -1, tutRaf = 0, tutEl = null;
  function tutStart(force) {
    if (!force && S().tutDone) return;
    tutEnd(true);
    tutEl = document.createElement('div'); tutEl.id = 'tut'; tutEl.className = 'tut';
    tutEl.innerHTML = '<i class="tb"></i><i class="tb"></i><i class="tb"></i><i class="tb"></i><div class="th"></div><div class="tc"><small class="tp"></small><p></p><em class="tw"></em><div class="tbtn"><button class="btn small" id="tut-skip">' + L('Saltar tutorial', 'Skip tutorial') + '</button><button class="btn primary small" id="tut-next">' + L('Siguiente', 'Next') + '</button></div></div>';
    document.body.appendChild(tutEl);
    $('#tut-skip').onclick = () => tutEnd();
    $('#tut-next').onclick = () => { Audio8.play('click'); tutNext(); };
    tutI = -1; tutNext();
    cancelAnimationFrame(tutRaf);
    const loop = () => { if (!tutEl) return; tutLayout(); tutRaf = requestAnimationFrame(loop); };
    loop();
  }
  function tutNext() {
    tutI++;
    while (tutI < TUT.length && TUT[tutI].sel && !TUT[tutI].tab && !document.querySelector(TUT[tutI].sel) && !TUT[tutI].wait) tutI++;
    if (tutI >= TUT.length) return tutEnd();
    const st = TUT[tutI];
    if (st.tab && tab !== st.tab) setTab(st.tab);
    if (st.pre) st.pre();
    if (st.sel && !document.querySelector(st.sel)) { setTimeout(() => { if (tutEl && TUT[tutI] === st && !document.querySelector(st.sel)) tutNext(); }, 400); }
    tutEl.querySelector('p').textContent = st.text;
    tutEl.querySelector('.tp').textContent = L('Paso ', 'Step ') + (tutI + 1) + L(' de ', ' of ') + TUT.length;
    tutEl.querySelector('.tw').textContent = st.hint || '';
    $('#tut-next').style.display = st.wait ? 'none' : '';
    $('#tut-next').textContent = st.last ? L('¡A jugar!', 'Let\'s play!') : L('Siguiente', 'Next');
    $('#tut-skip').style.display = st.last ? 'none' : '';
    tutEl._wait = st.wait || null;
  }
  function tutLayout() {
    const st = TUT[tutI]; if (!st || !tutEl) return;
    if (tutEl._wait && tutEl._wait()) { tutEl._wait = null; setTimeout(() => { if (tutEl) tutNext(); }, 350); }
    const W = innerWidth, H = innerHeight, tb = tutEl.querySelectorAll('.tb'), th = tutEl.querySelector('.th'), tc = tutEl.querySelector('.tc');
    const el = st.sel && document.querySelector(st.sel);
    if (el && tutEl._sc !== tutI) { tutEl._sc = tutI; try { el.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch (e) { el.scrollIntoView(); } }
    let r = el && el.getBoundingClientRect();
    if (el && (!r.width || !r.height)) r = null;
    if (r) {
      const pad = 6, x = Math.max(0, r.left - pad), y = Math.max(0, r.top - pad), w = Math.min(W - x, r.width + pad * 2), h = Math.min(H - y, r.height + pad * 2);
      th.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:block`;
      const rects = [[0, 0, W, y], [0, y + h, W, H - y - h], [0, y, x, h], [x + w, y, W - x - w, h]];
      tb.forEach((b, i) => { const q = rects[i]; b.style.cssText = `left:${q[0]}px;top:${q[1]}px;width:${Math.max(0, q[2])}px;height:${Math.max(0, q[3])}px`; });
      const cw = Math.min(330, W - 24), below = H - (y + h) > 190 || y < 190;
      tc.style.cssText = `width:${cw}px;left:${Math.max(12, Math.min(W - cw - 12, x + w / 2 - cw / 2))}px;${below ? `top:${Math.min(H - 170, y + h + 12)}px` : `top:${Math.max(8, y - 12 - tc.offsetHeight)}px`}`;
    } else {
      th.style.display = 'none';
      tb.forEach((b, i) => { b.style.cssText = i === 0 ? `left:0;top:0;width:${W}px;height:${H}px` : 'display:none'; });
      const cw = Math.min(380, W - 24);
      tc.style.cssText = `width:${cw}px;left:${(W - cw) / 2}px;top:${Math.max(20, H / 2 - tc.offsetHeight / 2)}px`;
    }
  }
  function tutEnd(silent) {
    cancelAnimationFrame(tutRaf);
    if (tutEl) { tutEl.remove(); tutEl = null; }
    if (!silent && S() && !S().tutDone) { S().tutDone = true; Core.save(); }
  }

  // ---------------- gacha ----------------
  function doPull(id, n, free) {
    const res = free ? Core.freePull() : Core.pull(id, n);
    if (!res) { Audio8.play('error'); return; }
    Core.save();
    playReveal(res, BALLS[id].icon, TICKETS[free ? 'poke' : BALLS[id].ticket].icon, BALLS[id].name);
  }
  function playReveal(res, ballIcon, tkIcon, title, onClose) {
    const n = res.length;
    autoFill();
    Core.save();
    Core.setPaused(true);
    const fx = $('#gacha-fx'), best = Math.max(...res.map(r => r.rar)), anyShiny = res.some(r => r.shiny);
    const col = RARITY[best].color;
    fx.className = 'gacha-fx';
    fx.innerHTML = `<div class="gx-rays" style="--c:#6a8aff"></div><div class="gx-stage"><div class="gx-ticket">${ico(tkIcon, 64)}</div><div class="gx-ball" id="gx-ball"><div class="gx-aura" id="gx-aura"></div>${ico(ballIcon, 120)}</div><div class="gx-txt" id="gx-txt">${ballIcon.startsWith('egg') ? L('Eclosionando ', 'Hatching ') : L('Abriendo ', 'Opening ')}${title}…</div></div><button class="gx-skip" id="gx-skip">${L('Saltar', 'Skip')}</button>`;
    const aura = $('#gx-aura'), ballEl = $('#gx-ball'), steps = ['#ffffff', best >= 2 ? RARITY[Math.min(best, 3)].color : '#ffffff', best >= 4 ? RARITY[4].color : col, col];
    const timers = [];
    let done = false;
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    later(() => Audio8.play('shake'), 700);
    [0, 1, 2].forEach(i => later(() => { Audio8.play('shake'); aura.style.setProperty('--ac', steps[i + 1]); aura.style.setProperty('--as', 1 + i * 0.5); ballEl.classList.add('s' + (i + 1)); if ($('#gx-txt')) $('#gx-txt').textContent = [L('¡Se mueve!', 'It moves!'), L('¡Algo bueno se acerca!', 'Something good is coming!'), L('¡Está a punto!', 'Almost there!')][i]; }, 900 + i * 650));
    later(reveal, 3000);
    $('#gx-skip').onclick = () => { if (!done) reveal(); };
    function reveal() {
      if (done) return; done = true; timers.forEach(clearTimeout);
      Audio8.play(best >= 5 ? 'legend' : best >= 4 ? 'rare' : 'pop');
      if (anyShiny) setTimeout(() => Audio8.play('rare'), 500);
      const label = best >= 5 ? L('¡LEGENDARIO!', 'LEGENDARY!') : best >= 4 ? L('¡ÉPICO!', 'EPIC!') : best >= 3 ? L('¡RARO!', 'RARE!') : '';
      fx.classList.toggle('legend', best >= 5); fx.classList.toggle('epic', best === 4);
      fx.classList.add('res');
      let cards = '';
      res.forEach((r, j) => {
        const m = S().mons[r.base];
        cards += `<div class="pull r${r.rar} ${r.shiny ? 'shiny' : ''}" style="--rc:${RARITY[r.rar].color};animation-delay:${0.15 + j * (n > 1 ? 0.16 : 0)}s">
          ${r.isNew ? '<span class="new">' + L('¡NUEVO!', 'NEW!') + '</span>' : ''}${r.shiny ? '<span class="shtag">✨ SHINY</span>' : ''}
          ${n === 1 ? '<canvas class="pv" id="pv" width="128" height="128"></canvas>' : `<span class="pk-spr">${Sprites.html(r.base, r.shiny, 72, true)}</span>`}
          <b>${DEX[r.base].name}</b><small>${RARITY[r.rar].name}</small>
          <span class="dup nat"><span class="nt">${Core.natOf({ nat: r.nat }).name} · IV ${Math.round(Core.ivPct(m) * 100)}%</span> <span class="gr" style="background:${r.grade[2]}">${r.grade[1]}</span></span>
          ${r.genes ? '<span class="dup" style="color:#ffd6f2">' + L('Cría: genes nuevos de ', 'Offspring: new genes of ') + Math.round((r.genes.iv.d + r.genes.iv.s + r.genes.iv.c) / (3 * IV_MAX) * 100) + '% IV</span>' : ''}
          ${r.ivUp ? `<span class="dup" style="color:#7ff0a0">${n === 1 ? L('¡IVs mejorados!', 'IVs improved!') + ' ' : 'IV ↑ '}${Math.round(r.ivUp.from * 100)}→${Math.round(r.ivUp.to * 100)}%</span>` : ''}
          ${r.isNew ? '' : `<span class="dup cp"><span class="cpt">${L('+1 copia', '+1 copy')} <span class="cc">(${m.copies}/${m.stars < 5 ? STAR_COPIES[m.stars] : '★5'})</span> · </span>+${fmt(r.dust)}<span class="dustic">${ico('coin', 12)}</span></span>`}
          ${r.newShiny && !r.isNew ? '<span class="dup" style="color:#fff3a8">' + L('¡Versión shiny desbloqueada!', 'Shiny form unlocked!') + '</span>' : ''}
          <i class="gl"></i></div>`;
      });
      fx.innerHTML = `<div class="gx-rays on" style="--c:${col}"></div><div class="flash" style="--fc:${col}"></div>
        <div class="gx-labels">${label ? `<div class="gx-label" style="--c:${col}">${label}</div>` : ''}${anyShiny ? '<div class="gx-label sh">✨ ' + L('¡SHINY!', 'SHINY!') + ' ✨</div>' : ''}</div>
        <div class="pulls ${n === 1 ? 'one' : ''}">${cards}</div><button class="btn big primary" id="pull-ok" style="animation:pin .4s ${0.4 + n * 0.16}s backwards">${L('¡Genial!', 'Great!')}</button>`;
      $('#pull-ok').onclick = close;
      if (n === 1) { pvT = 0; pvMon = { dex: res[0].dex, shiny: res[0].shiny }; Sprites.preload(res[0].dex, res[0].shiny); } else pvMon = null;
      if (best >= 5) { const st = $('#stage'); }
    }
    function close() { pvMon = null; fx.classList.add('hidden'); fx.className = 'gacha-fx hidden'; Core.setPaused(false); refresh(true); if (onClose) onClose(); }
    fx.classList.remove('hidden');
  }
  // sprite animado en la tarjeta de una tirada única
  let pvMon = null, pvT = 0;
  function drawPv(dt) {
    if (!pvMon) return;
    const cv = $('#pv'); if (!cv) return;
    pvT += dt;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 128, 128);
    const a = DEX[pvMon.dex].anim, h = (a.idle || a.walk).h;
    Sprites.draw(g, pvMon.dex, pvMon.shiny, 'idle', Math.PI / 2, pvT, 64, 112, Math.min(3, 100 / h), {});
  }

  // ---------------- animación de evolución ----------------
  const evoQueue = []; let evoRun = false;
  function evolveAnim(from, to, shiny, mega) { evoQueue.push({ from, to, shiny, mega }); if (!evoRun) nextEvo(); }
  function nextEvo() {
    const ev = evoQueue.shift();
    if (!ev) { evoRun = false; Core.setPaused(false); $('#evo').classList.add('hidden'); return; }
    evoRun = true; Core.setPaused(true);
    const box = $('#evo'), cv = $('#evo-cv'), g = cv.getContext('2d'), txt = $('#evo-txt'), ok = $('#evo-ok');
    box.classList.remove('hidden', 'done'); ok.classList.add('hidden');
    Sprites.preload(ev.to, ev.shiny); Sprites.preload(ev.from, ev.shiny);
    txt.innerHTML = ev.mega ? L(`¡<b>${DEX[ev.from].name}</b> está megaevolucionando!`, `<b>${DEX[ev.from].name}</b> is Mega Evolving!`) : L(`¿Eh? ¡<b>${DEX[ev.from].name}</b> está evolucionando!`, `What? <b>${DEX[ev.from].name}</b> is evolving!`);
    const parts = []; let t0 = performance.now(), finished = false, lastSw = -1, flashed = false, raf = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    Audio8.play('charge');
    const scaleOf = d => { const a = DEX[d].anim; return Math.min(4.4, 150 / (a.idle || a.walk).h); };
    function frame(now) {
      const t = (now - t0) / 1000;
      g.imageSmoothingEnabled = false; g.clearRect(0, 0, 160, 160);
      const cx = 80, cy = 140;
      // halo
      const prog = Math.min(1, t / 3.4);
      if (t > 0.9 && t < 3.9) { g.globalAlpha = 0.25 + 0.2 * Math.sin(t * 12); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy - 40, 30 + prog * 40, 0, 6.3); g.fill(); g.globalAlpha = 1; }
      let showNew = false, flash = false;
      if (t < 0.9) { flash = false; }
      else if (t < 3.6) {
        flash = true;
        const period = 0.45 - prog * 0.39, idx = Math.floor((t - 0.9) / period);
        showNew = idx % 2 === 1;
        if (idx !== lastSw) { lastSw = idx; if (idx % 2 === 0) Audio8.play('swap'); }
        if (Math.random() < 0.6) parts.push({ x: cx + rnd(-44, 44), y: cy - rnd(0, 90), vx: rnd(-10, 10), vy: rnd(-40, -10), l: 0.7, m: 0.7, c: '#ffffff' });
      } else { showNew = true; flash = t < 3.75; }
      if (t >= 3.6 && !flashed) { flashed = true; box.classList.add('flash'); setTimeout(() => box.classList.remove('flash'), 600); Audio8.play('evolve'); for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, sp = rnd(30, 110); parts.push({ x: cx, y: cy - 44, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, m: 1, c: pick(['#ffffff', '#ffd23f', '#9fe0ff', '#ff9ed8']) }); } txt.innerHTML = ev.mega ? L(`¡<b>${DEX[ev.from].name}</b> ha megaevolucionado en <b style="color:#ffd23f">${DEX[ev.to].name}</b>!`, `<b>${DEX[ev.from].name}</b> Mega Evolved into <b style="color:#ffd23f">${DEX[ev.to].name}</b>!`) : L(`¡<b>${DEX[ev.from].name}</b> ha evolucionado en <b style="color:#ffd23f">${DEX[ev.to].name}</b>!`, `<b>${DEX[ev.from].name}</b> evolved into <b style="color:#ffd23f">${DEX[ev.to].name}</b>!`); }
      const d = showNew ? ev.to : ev.from, bounce = t < 0.9 ? Math.sin(t * 8) * 1.5 : 0;
      Sprites.draw(g, d, ev.shiny, 'idle', Math.PI / 2, t, cx, cy + bounce, scaleOf(d), { flash });
      for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.l -= 1 / 60; p.x += p.vx / 60; p.y += p.vy / 60; if (p.l <= 0) { parts.splice(i, 1); continue; } g.globalAlpha = p.l / p.m; g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
      g.globalAlpha = 1;
      if (t > 4.4 && !finished) { finished = true; ok.classList.remove('hidden'); }
      if (!stop) raf = requestAnimationFrame(frame);
    }
    let stop = false;
    ok.onclick = () => { stop = true; cancelAnimationFrame(raf); nextEvo(); };
    $('#evo').onclick = e => { if (e.target.id === 'evo' && !finished) { /* acelerar: salta al final */ t0 -= 4400; } };
    raf = requestAnimationFrame(frame);
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ---------------- ficha de Pokémon ----------------
  let monCv = null;
  function monModal(key) {
    const s = S(), m = s.mons[key];
    if (!m) return;
    const rar = Core.RAR[m.dex], p = DEX[Core.fdex(m)], st = p.stats;
    const need = m.stars < 5 ? STAR_COPIES[m.stars] : 0;
    const inTeam = s.team.indexOf(key);
    let slots = '';
    for (let i = 0; i < s.slots; i++) {
      const k = s.team[i];
      slots += `<button data-slot="${i}" class="${k === key ? 'cur' : ''}" title="${L('Hueco', 'Slot')} ${i + 1}">${k ? `<img src="${por(Core.fdex(s.mons[k]), s.mons[k].shiny)}">` : '+'}</button>`;
    }
    const t0 = p.types[0], tier = Core.tierOf(m.lvl);
    const moves = MOVE_TIERS[t0].map((id, i) => `<span class="mvchip ${i <= tier ? 'on' : ''}" style="--tc:${TYPE_COLORS[MOVES[id].type]}">${MOVES[id].name}<small>${L('Nv.', 'Lv.')} ${TIER_LV[i]}</small></span>`).join('');
    openModal(`<h2>${m.shiny ? '✨ ' : ''}${p.name}</h2>
      <div class="monbig"><canvas id="mon-cv" width="72" height="72"></canvas><div class="stats">
        <div style="color:${RARITY[rar].color};font-size:16px">${RARITY[rar].name} ${starsHtml(m.stars)}</div>${typeTags(Core.fdex(m))}
        <div>${L('Nivel', 'Level')} <b>${m.lvl}</b> · ${L('Daño/s', 'Damage/s')} <b>${fmt(Core.monDmg(m) / Core.monRate(m))}</b></div>
        <div>${L(`PS ${st.hp} · Atq ${st.atk} · Def ${st.def} · AtE ${st.spa} · DfE ${st.spd} · Vel ${st.spe}`, `HP ${st.hp} · Atk ${st.atk} · Def ${st.def} · SpA ${st.spa} · SpD ${st.spd} · Spe ${st.spe}`)}</div>
        <div>${L('Copias', 'Copies')}: <b>${m.copies}</b>${need ? ' / ' + need + L(' para ★', ' for ★') + (m.stars + 1) + L(' (daño x', ' (damage x') + STAR_MULT[m.stars + 1] + ')' : L(' · ¡Estrellas al máximo!', ' · Stars maxed!')}</div>
      </div></div>
      <div class="mvlist">${moves}</div>
      ${genesHtml(m)}
      ${megaHtml(key, m)}
      <div class="row">${need ? `<button class="btn primary" id="m-star" ${m.copies >= need ? '' : 'disabled'}>${L('Subir a ★', 'Upgrade to ★')}${m.stars + 1}</button>` : ''}${m.shinyOwned ? `<button class="btn" id="m-shiny">${L('Forma', 'Form')}: ${m.shiny ? '✨ Shiny' : 'Normal'}</button>` : ''}</div>
      <p class="hint" style="margin-top:12px">${inTeam >= 0 ? L('Está en tu equipo. Toca otro hueco para moverlo.', 'It is in your team. Tap another slot to move it.') : L('Elige el hueco del equipo donde quieres ponerlo:', 'Choose the team slot where you want to put it:')}</p>
      <div class="slotpick">${slots}</div>
      <div class="row"><button class="btn" id="m-close">${L('Cerrar', 'Close')}</button></div>`);
    monCv = $('#mon-cv'); monCv.dataset.k = key; Sprites.preload(Core.fdex(m), m.shiny);
    $('#m-close').onclick = closeModal;
    $$('[data-mega-unlock]').forEach(b => b.onclick = () => { if (Core.megaUnlock(key, b.dataset.megaUnlock)) { Core.save(); closeModal(); refresh(true); } else Audio8.play('error'); });
    $$('[data-mega-set]').forEach(b => b.onclick = () => { Core.megaSet(key, b.dataset.megaSet || null); Audio8.play('swap'); Core.save(); monModal(key); refresh(true); });
    $$('[data-iv]').forEach(b => b.onclick = () => { if (Core.trainIv(key, b.dataset.iv)) { Audio8.play('levelup'); Core.save(); monModal(key); refresh(true); } else Audio8.play('error'); });
    if ($('#m-natre')) $('#m-natre').onclick = () => { if (Core.rerollNat(key)) { Audio8.play('item'); Core.save(); monModal(key); refresh(true); } else Audio8.play('error'); };
    if ($('#m-natset')) $('#m-natset').onclick = e => openDD(e.currentTarget, NATURES.map(n => [n.id, n.up ? `${n.name} · ▲${NAT_AXES[n.up]} ▼${NAT_AXES[n.down]}` : n.name + L(' · neutra', ' · neutral')]), m.nat, v => { if (Core.setNat(key, +v)) { Audio8.play('item'); Core.save(); monModal(key); refresh(true); } else Audio8.play('error'); });
    if ($('#m-shiny')) $('#m-shiny').onclick = () => { Core.toggleShiny(key); Audio8.play('swap'); Core.save(); monModal(key); refresh(true); };
    if ($('#m-star')) $('#m-star').onclick = () => { if (Core.starUp(key)) { Audio8.play('legend'); banner(L('¡' + p.name + ' sube a ★' + m.stars + '!', p.name + ' reaches ★' + m.stars + '!'), L('Su daño se multiplica por ', 'Its damage is multiplied by ') + STAR_MULT[m.stars], '#ffd23f'); Core.save(); monModal(key); refresh(true); } };
    $$('.slotpick button').forEach(b => b.onclick = () => { Core.setTeam(+b.dataset.slot, key); Audio8.play('swap'); Core.save(); monModal(key); refresh(true); });
  }
  function megaHtml(key, m) {
    const forms = Core.megaForms(m);
    if (!forms.length) return '';
    const s = S(), cost = Core.megaCost(m);
    let h = `<div class="genes mega"><div class="genehead"><span>${L('Megaevolución', 'Mega Evolution')}</span><span class="dustnum">${ico('stone', 14)} ${s.shards} ${L('fragmentos', 'shards')}</span></div>`;
    for (const e of forms) {
      const owned = m.megas.includes(e.form), on = m.mf === e.form, ok = Core.megaCan(m, e.form);
      const bst = Object.values(e.stats).reduce((a, b) => a + b, 0) - Object.values(DEX[m.dex].stats).reduce((a, b) => a + b, 0);
      h += `<div class="megarow ${on ? 'on' : ''}"><img src="${por(e.dex, m.shiny)}"><div class="info"><b>${e.name}</b>${typeTags(e.dex)}<small>+${bst} ${L('estadísticas base', 'base stats')}</small></div>
        ${owned ? `<button class="btn small ${on ? '' : 'primary'}" data-mega-set="${on ? '' : e.form}">${on ? L('Desactivar', 'Deactivate') : L('Activar', 'Activate')}</button>`
          : `<button class="btn small primary" data-mega-unlock="${e.form}" ${ok ? '' : 'disabled'}>${ico('stone', 12)} ${cost}</button>`}</div>`;
    }
    const need = [m.lvl < MEGA_LV ? L('Nivel ' + MEGA_LV, 'Level ' + MEGA_LV) : '', s.shards < cost ? L(cost + ' fragmentos', cost + ' shards') : ''].filter(Boolean).join(' · ');
    return h + `<p class="hint" style="margin:6px 0 0">${L('Solo una forma Mega activa a la vez. Los fragmentos se consiguen en la Torre y en el evento semanal.', 'Only one Mega form can be active at a time. Shards come from the Tower and the weekly event.')}${need && !forms.every(e => m.megas.includes(e.form)) ? ' ' + L('Te falta: ', 'You need: ') + need + '.' : ''}</p></div>`;
  }
  const tchip = t => `<span class="type" style="background:${TYPE_COLORS[t]}">${TYPE_ES[t]}</span>`;
  function genesHtml(m) {
    const s = S(), nt = Core.natOf(m), gr = Core.ivGrade(m);
    const strong = Object.keys(TYPE_NAMES).filter(t => Math.max(...DEX[Core.fdex(m)].types.map(a => Core.typeEff(a, [t]))) >= 2);
    const ivRows = ['d', 's', 'c'].map(k => `<div class="ivrow"><span>${IV_NAMES[k]}</span><div class="ivbar"><i style="width:${m.iv[k] / IV_MAX * 100}%"></i></div><b>${m.iv[k]}</b>${m.iv[k] < IV_MAX ? `<button class="btn small" data-iv="${k}" ${s.coins >= Core.dc(ivTrainCost(m.iv[k])) ? '' : 'disabled'} title="${L('Entrenar este IV', 'Train this IV')} (+${IV_TRAIN_STEP})">+${IV_TRAIN_STEP} ${ico('coin', 10)}${fmt(Core.dc(ivTrainCost(m.iv[k])))}</button>` : '<small class="max">' + L('MÁX', 'MAX') + '</small>'}</div>`).join('');
    return `<div class="genes"><div class="genehead"><span>${L('Naturaleza', 'Nature')} <b>${natTxt(m)}</b></span><span class="dustnum">${ico('coin', 14)} ${fmt(s.coins)}</span></div>
      <div class="row tight"><button class="btn small" id="m-natre" ${s.coins >= Core.dc(NAT_REROLL_COST) ? '' : 'disabled'}>${L('Cambiar al azar', 'Reroll')} ${ico('coin', 10)}${fmt(Core.dc(NAT_REROLL_COST))}</button><button class="btn small" id="m-natset" ${s.coins >= Core.dc(NAT_CHOOSE_COST) ? '' : 'disabled'}>${L('Elegir', 'Choose')} ${ico('coin', 10)}${fmt(Core.dc(NAT_CHOOSE_COST))}</button></div>
      <div class="genehead"><span>IVs</span><span class="gr" style="background:${gr[2]}">${Math.round(Core.ivPct(m) * 100)}% · ${gr[1]}</span></div>${ivRows}
      <div class="foehint">${DEX[Core.fdex(m)].name} ${L('es fuerte contra', 'is strong against')} ${strong.length ? strong.map(tchip).join('') : '—'}</div></div>`;
  }
  function drawMonCv(t) {
    if (!monCv || !monCv.isConnected) { monCv = null; return; }
    const m = S().mons[monCv.dataset.k];
    const g = monCv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 72, 72);
    if (m) Sprites.draw(g, Core.fdex(m), m.shiny, 'idle', Math.PI / 2, t, 36, 56, 1, {});
  }

  let mapReg = -1;
  function mapModal() {
    const s = S(), LP = Core.loopOf(s.stage), cur = Core.routeIdx(s.stage);
    if (mapReg < 0) mapReg = Core.regionOf(s.stage);
    const reg = REGIONS[mapReg], end = mapReg + 1 < REGIONS.length ? REGIONS[mapReg + 1].first : ROUTES.length;
    let h = `<h2>${L('Mapa del mundo', 'World map')}</h2><p class="hint">${L('Toca una ruta para farmear en ella. Usa «Avanzar etapa» para seguir.', 'Tap a route to farm on it. Use “Next stage” to move on.')}${LP ? L(' Ciclo +', ' Loop +') + LP : ''}</p>
      <div class="seg wrap">${REGIONS.map((r, i) => `<button data-reg="${i}" class="${i === mapReg ? 'on' : ''}" ${(LP * ROUTES.length + r.first) * 10 + 1 > s.maxStage ? 'disabled' : ''}>${r.name}</button>`).join('')}</div><div class="maplist">`;
    for (let ri = reg.first; ri < end; ri++) {
      const r = ROUTES[ri], base = (LP * ROUTES.length + ri) * 10 + 1, open = base <= s.maxStage, done = s.bossFirst[base + 9];
      h += `<button class="maprow ${ri === cur ? 'cur' : ''}" data-go="${Math.min(base + 8, s.maxStage)}" ${open ? '' : 'disabled'}><b>${r.name}</b><small>${open ? L('Etapas ', 'Stages ') + base + '–' + (base + 9) : L('Bloqueada', 'Locked')}</small><small class="rt">${L('Tipos', 'Types')}: ${r.types.map(tchip).join('')} · ${L('Usa', 'Use')}: ${Core.strongTypes(base).map(o => tchip(o.t)).join('') || '—'}</small><span class="mb">${Sprites.html(r.boss.dex, false, 60, true)}${done ? '✓ ' : ''}${r.boss.who}</span></button>`;
    }
    openModal(h + '</div><div class="row"><button class="btn" id="map-x">' + L('Cerrar', 'Close') + '</button></div>');
    $('#map-x').onclick = closeModal;
    $$('[data-reg]').forEach(b => b.onclick = () => { mapReg = +b.dataset.reg; mapModal(); });
    $$('.maprow').forEach(b => b.onclick = () => { if (b.disabled) return; Core.goStage(+b.dataset.go); S().auto = false; Audio8.play('select'); closeModal(); });
  }

  // ---------------- estadísticas ----------------
  const fmtT = sec => { const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return h ? h + 'h ' + m + 'm' : m + 'm'; };
  let chartData = [];
  // gráfica de líneas en SVG: una serie, una escala, líneas finas, etiqueta directa del último valor (y tabla alternativa)
  function lineChart(idx, title, pts, o) {
    o = o || {};
    const W = 320, H = 118, pl = 6, pr = 6, pt = 14, pb = 16;
    if (pts.length < 2) return `<div class="chart"><h4>${title}</h4><p class="hint" style="margin:6px 0">${L('Sigue jugando unos minutos para ver esta gráfica.', 'Keep playing for a few minutes to see this chart.')}</p></div>`;
    const ys = pts.map(p => (o.log ? Math.log10(Math.max(1, p.y)) : p.y));
    let y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (o.log) { y0 = Math.floor(y0); y1 = Math.max(y1, y0 + 1); } else { y0 = Math.min(0, y0); if (y1 === y0) y1 = y0 + 1; }
    const x0 = pts[0].x, x1 = pts[pts.length - 1].x || 1;
    const X = x => pl + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * (W - pl - pr), Y = v => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
    const poly = pts.map((p, i) => X(p.x).toFixed(1) + ',' + Y(ys[i]).toFixed(1)).join(' ');
    const last = pts[pts.length - 1], lx = X(last.x), ly = Y(ys[ys.length - 1]);
    chartData[idx] = { pts, ys, X, Y, W, H, fmtY: o.fmt || fmt };
    const grid = [0, 0.5, 1].map(f => `<line x1="${pl}" x2="${W - pr}" y1="${(pt + f * (H - pt - pb)).toFixed(1)}" y2="${(pt + f * (H - pt - pb)).toFixed(1)}" class="cgrid"/>`).join('');
    return `<div class="chart" data-chart="${idx}"><h4>${title}${o.log ? ` <small>${L('escala logarítmica', 'log scale')}</small>` : ''}</h4>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}: ${(o.fmt || fmt)(last.y)}">${grid}
        <polyline points="${poly}" class="cline"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3" class="cdot"/>
        <text x="${Math.min(W - pr, lx).toFixed(1)}" y="${Math.max(10, ly - 7).toFixed(1)}" text-anchor="end" class="clab">${(o.fmt || fmt)(last.y)}</text>
        <text x="${pl}" y="${H - 3}" class="cax">${fmtT(x0)}</text><text x="${W - pr}" y="${H - 3}" text-anchor="end" class="cax">${fmtT(x1)}</text>
        <line class="ccross" x1="0" x2="0" y1="${pt}" y2="${H - pb}" style="display:none"/><circle class="chov" r="3.5" cx="0" cy="0" style="display:none"/></svg><div class="ctip hidden"></div></div>`;
  }
  const barRow = (label, n, max, color, extra) => `<div class="brow"><span class="bl">${label}</span><div class="bt"><i style="width:${max ? Math.max(n ? 2 : 0, n / max * 100).toFixed(1) : 0}%;background:${color}"></i></div><b>${extra || fmt(n)}</b></div>`;
  function statsModal(table) {
    const s = S(), st = s.stats, h = s.hist, mons = Object.values(s.mons);
    chartData = [];
    const stage = h.map(r => ({ x: r[0], y: r[1] }));
    const cps = h.slice(1).map((r, i) => ({ x: r[0], y: Math.max(0, (r[2] - h[i][2]) / Math.max(1, r[0] - h[i][0])) }));
    const dps = h.map(r => ({ x: r[0], y: r[4] }));
    let body = '';
    if (table) {
      body += `<h3>${L('Tabla de datos', 'Data table')}</h3><div class="tblwrap"><table class="stbl"><thead><tr><th>${L('Tiempo', 'Time')}</th><th>${L('Etapa', 'Stage')}</th><th>${L('Monedas/s', 'Coins/s')}</th><th>${L('Daño/s', 'Damage/s')}</th></tr></thead><tbody>${h.slice(-40).map((r, i, a) => { const p = a[i - 1] || h[h.length - 41] || null; return `<tr><td>${fmtT(r[0])}</td><td>${r[1]}</td><td>${p ? fmt(Math.max(0, (r[2] - p[2]) / Math.max(1, r[0] - p[0]))) : '—'}</td><td>${fmt(r[4])}</td></tr>`; }).join('') || `<tr><td colspan="4">${L('Sin datos todavía', 'No data yet')}</td></tr>`}</tbody></table></div>`;
    } else {
      body += `<h3>${L('Progreso', 'Progress')}</h3><div class="charts">${lineChart(0, L('Etapa máxima', 'Max stage'), stage)}${lineChart(1, L('Monedas por segundo', 'Coins per second'), cps, { log: true })}${lineChart(2, L('Daño por segundo del equipo', 'Team damage per second'), dps, { log: true })}</div>`;
    }
    // colección
    const regions = REGIONS.filter(r => r.gen).map(r => { const tot = POKEDEX.filter(p => p.gen === r.gen).length, got = Object.keys(s.seen).filter(d => DEX[d] && DEX[d].gen === r.gen).length; return [r.name, got, tot]; });
    const rar = [1, 2, 3, 4, 5].map(r => [RARITY[r].name, mons.filter(m => Core.RAR[m.dex] === r).length, RARITY[r].color]);
    const types = Object.keys(TYPE_NAMES).map(t => [TYPE_NAMES[t], mons.filter(m => DEX[Core.fdex(m)].types.includes(t)).length, TYPE_COLORS[t]]).sort((a, b) => b[1] - a[1]);
    const grades = IV_GRADES.slice().reverse().map(g => [g[1], mons.filter(m => Core.ivGrade(m)[1] === g[1]).length, g[2]]);
    const maxOf = a => Math.max(1, ...a.map(x => x[1]));
    body += `<h3>${L('Colección', 'Collection')}</h3><div class="charts two">
      <div class="chart"><h4>${L('Pokédex por región', 'Pokédex by region')}</h4>${regions.map(([n, g, t]) => barRow(n, g, t, '#4fb4ff', `${g}/${t}`)).join('')}</div>
      <div class="chart"><h4>${L('Pokémon por rareza', 'Pokémon by rarity')}</h4>${rar.map(([n, c, col]) => barRow(n, c, maxOf(rar), col)).join('')}<h4 style="margin-top:8px">${L('Potencial (IVs)', 'Potential (IVs)')}</h4>${grades.map(([n, c, col]) => barRow(n, c, maxOf(grades), col)).join('')}</div>
      <div class="chart wide"><h4>${L('Pokémon por tipo', 'Pokémon by type')}</h4><div class="tcols">${types.map(([n, c, col]) => barRow(n, c, maxOf(types), col)).join('')}</div></div></div>`;
    // totales y récords
    const done = ACHIEVEMENTS.filter(a => s.ach[a.id]).length;
    const rows = [
      [L('Tiempo jugado', 'Time played'), fmtT(st.time)], [L('Etapa máxima', 'Max stage'), st.maxStage], [L('Récord de la Torre', 'Tower record'), L('Piso ', 'Floor ') + s.tower.best],
      [L('Mayor daño/s del equipo', 'Best team damage/s'), fmt(st.maxDps)], [L('Golpe más fuerte', 'Strongest hit'), fmt(st.bestHit)], [L('Pokémon derrotados', 'Pokémon defeated'), fmt(st.kills)],
      [L('Jefes vencidos', 'Bosses beaten'), fmt(st.bosses)], [L('Toques', 'Taps'), fmt(st.taps)], [L('Golpes críticos', 'Critical hits'), fmt(st.crits)], [L('Monedas totales', 'Total coins'), fmt(st.coinsTotal)],
      [L('Poké Balls abiertas', 'Poké Balls opened'), fmt(st.pulls)], [L('Huevos eclosionados', 'Eggs hatched'), fmt(st.hatched)], [L('Crías', 'Breedings'), fmt(st.bred)], [L('Shinies', 'Shinies'), fmt(st.shinies)],
      [L('Evoluciones', 'Evolutions'), fmt(st.evolutions)], [L('Formas Mega', 'Mega forms'), fmt(st.megas)], [L('Veces en la Liga', 'League runs'), fmt(st.prestiges)], [L('Logros', 'Achievements'), done + '/' + ACHIEVEMENTS.length],
    ];
    body += `<h3>${L('Totales y récords', 'Totals and records')}</h3><div class="statgrid wide">${rows.map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('')}</div>`;
    openModal(`<h2>${L('Estadísticas', 'Statistics')}</h2><div class="statbody">${body}</div><div class="row"><button class="btn small" id="st-tbl">${table ? L('Ver gráficas', 'Show charts') : L('Ver datos en tabla', 'Show data as table')}</button><button class="btn" id="st-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#st-x').onclick = closeModal;
    $('#st-tbl').onclick = () => statsModal(!table);
    $$('.chart[data-chart]').forEach(c => {
      const d = chartData[+c.dataset.chart], svg = c.querySelector('svg'), tip = c.querySelector('.ctip'), cross = c.querySelector('.ccross'), dot = c.querySelector('.chov');
      if (!d || !svg) return;
      const move = e => {
        const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * d.W;
        let best = 0, bd = 1e9;
        d.pts.forEach((p, i) => { const dx = Math.abs(d.X(p.x) - x); if (dx < bd) { bd = dx; best = i; } });
        const p = d.pts[best], px = d.X(p.x), py = d.Y(d.ys[best]);
        cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.style.display = ''; dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.style.display = '';
        tip.textContent = fmtT(p.x) + ' · ' + d.fmtY(p.y); tip.classList.remove('hidden');
        tip.style.left = Math.min(r.width - 90, Math.max(0, px / d.W * r.width - 40)) + 'px';
      };
      const out = () => { cross.style.display = 'none'; dot.style.display = 'none'; tip.classList.add('hidden'); };
      svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', out);
    });
  }

  // ---------------- atajos de teclado ----------------
  function keysModal() {
    const rows = [
      [['Espacio', 'F'], L('Atacar (tocar al enemigo)', 'Attack (tap the enemy)')],
      [['Q', 'W', 'E'], L('Habilidades: Furia · Fiebre del Oro · Lluvia de Tickets', 'Skills: Rage · Gold Rush · Ticket Rain')],
      [['1', '…', '7'], L('Pestañas: Equipo · Mejoras · Gacha · Pokédex · Retos · Misiones · Liga', 'Tabs: Team · Upgrades · Gacha · Pokédex · Challenges · Quests · League')],
      [['←', '→'], L('Etapa anterior / siguiente', 'Previous / next stage')],
      [['B'], L('Retar al jefe / Avanzar etapa', 'Challenge the boss / Next stage')],
      [['X'], L('Cambiar el multiplicador de compra (×1, ×10, ×25, Máx)', 'Change the buy multiplier (×1, ×10, ×25, Max)')],
      [['M'], L('Mapa del mundo', 'World map')], [['P'], L('Perfil', 'Profile')], [['O'], L('Ajustes', 'Settings')],
      [['Intro', 'Espacio'], L('En las animaciones de gacha y evolución: continuar', 'In gacha and evolution animations: continue')],
      [['Esc'], L('Cerrar la ventana abierta', 'Close the open window')], [['?', 'K'], L('Esta lista de atajos', 'This list of shortcuts')],
    ];
    openModal(`<h2>⌨ ${L('Atajos de teclado', 'Keyboard shortcuts')}</h2><p class="hint">${L('Alternativa al ratón en el ordenador. No funcionan mientras escribes en un campo de texto.', 'A mouse alternative on desktop. They do not work while you type in a text field.')}</p>
      <div class="keylist">${rows.map(([ks, d]) => `<div class="keyrow"><span class="keys">${ks.map(k => k === '…' ? '<i>…</i>' : `<kbd>${k}</kbd>`).join('')}</span><span>${d}</span></div>`).join('')}</div>
      <div class="row"><button class="btn primary" id="kb-x">${L('Entendido', 'Got it')}</button></div>`);
    $('#kb-x').onclick = closeModal;
  }
  // ---------------- cuenta y nube ----------------
  const GOOGLE = '<svg class="gsvg" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.3 5.7c4.3-4 6.8-9.9 6.8-17.1z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.3-5.7c-2 1.4-4.7 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
  function cloudStatus() {
    const st = Cloud.status, ago = Cloud.lastPush ? Math.max(1, Math.round((Date.now() - Cloud.lastPush) / 60000)) : 0;
    return st === 'ok' ? L('Partida sincronizada', 'Game synced') + (ago ? ' · ' + L('hace ' + ago + ' min', ago + ' min ago') : '') : st === 'syncing' ? L('Sincronizando…', 'Syncing…') : st === 'connecting' ? L('Conectando…', 'Connecting…') : st === 'offline' ? L('Sin conexión: juegas en este dispositivo', 'Offline: playing on this device') : st === 'paused' ? L('Sincronización en pausa: elige qué partida usar desde Ajustes → Cuenta', 'Sync paused: choose which game to use in Settings → Account') : st === 'error' ? L('No se pudo sincronizar. Se reintentará solo.', 'Could not sync. It will retry by itself.') : '';
  }
  function authPanel() {
    const el = $('#t-auth'); if (!el) return;
    if (!Cloud.enabled()) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    if (Cloud.user) {
      const p = Cloud.profile;
      el.innerHTML = `<div class="authuser"><b>${p ? p.nickname : (Cloud.user.email || '')}</b><small>${cloudStatus()}</small>${Cloud.status === 'error' && Cloud.msg ? `<small class="autherr">⚠ ${String(Cloud.msg).replace(/[<>&"]/g, '').slice(0, 160)}</small>` : ''}</div><div class="row tight"><button class="btn small" id="a-rank">${L('Rankings', 'Rankings')}</button><button class="btn small" id="a-out">${L('Cerrar sesión', 'Sign out')}</button></div>`;
      $('#a-out').onclick = async () => { await Cloud.signOut(); authPanel(); };
    } else el.innerHTML = (Cloud.status === 'error' && Cloud.msg ? `<small class="autherr">⚠ ${L('No se pudo iniciar sesión', 'Could not sign in')}: ${String(Cloud.msg).replace(/[<>&"]/g, '').slice(0, 160)}</small>` : '') + `<button class="gbtn" id="a-google">${GOOGLE}<span>${L('Iniciar sesión con Google', 'Sign in with Google')}</span></button><small>${Cloud.status === 'connecting' ? L('Conectando con la nube… puedes pulsar el botón o «Jugar» como invitado.', 'Connecting to the cloud… you can press the button or “Play” as a guest.') : Cloud.status === 'offline' ? L('Sin conexión: pulsa «Jugar» para jugar como invitado.', 'Offline: press “Play” to play as a guest.') : L('o pulsa «Jugar» para jugar como invitado: tu partida solo se guarda en este dispositivo.', 'or press “Play” to play as a guest: your game is only saved on this device.')}</small><button class="linkbtn" id="a-rank">${L('Ver rankings', 'View rankings')}</button>`;
    if ($('#a-google')) $('#a-google').onclick = async () => { $('#a-google').disabled = true; Audio8.play('select'); if (!(await Cloud.signIn())) authPanel(); };
    if ($('#a-rank')) $('#a-rank').onclick = () => rankingModal();
  }
  function accBind() {
    const box = $('#acc-box'); if (!box) return;
    const u = Cloud.user, p = Cloud.profile;
    box.innerHTML = u ? `<div class="setrow"><span class="sl"><b>${p ? p.nickname : ''}</b><small>${u.email || ''} · ${cloudStatus()}</small></span></div>
        <div class="row tight" style="margin:4px 0"><button class="btn small primary" id="ac-sync">${L('Sincronizar ahora', 'Sync now')}</button><button class="btn small" id="ac-rank">${L('Rankings', 'Rankings')}</button><button class="btn small" id="ac-out">${L('Cerrar sesión', 'Sign out')}</button></div>
        <div class="setrow"><span class="sl"><b>${L('Aparecer en los rankings', 'Appear in the rankings')}</b><small>${L('Se muestra tu nombre público, avatar y título', 'Your public name, avatar and title are shown')}</small></span><button class="tog ${p && p.show_in_rankings ? 'on' : ''}" id="ac-show" role="switch" aria-checked="${!!(p && p.show_in_rankings)}" aria-label="${L('Aparecer en los rankings', 'Appear in the rankings')}"><i></i></button></div>
        <div class="row tight" style="margin:4px 0 0"><button class="btn small danger" id="ac-del">${L('Borrar mi cuenta y mis datos', 'Delete my account and data')}</button></div>
        <p class="hint" style="margin:6px 0 0"><a href="privacy.html" target="_blank" rel="noopener">${L('Política de privacidad', 'Privacy policy')}</a></p>`
      : `<p class="hint" style="margin:0 0 6px">${L('Juegas como invitado: tu partida solo se guarda en este dispositivo. Con Google la guardas en la nube, la usas en otros dispositivos y apareces en los rankings.', 'You are playing as a guest: your game is only saved on this device. With Google you save it in the cloud, use it on other devices and appear in the rankings.')}</p>
        <div class="row tight" style="margin:0"><button class="gbtn" id="ac-google">${GOOGLE}<span>${L('Iniciar sesión con Google', 'Sign in with Google')}</span></button><button class="btn small" id="ac-rank">${L('Ver rankings', 'View rankings')}</button></div>
        <p class="hint" style="margin:6px 0 0"><a href="privacy.html" target="_blank" rel="noopener">${L('Política de privacidad', 'Privacy policy')}</a></p>`;
    const on = (id, f) => { const e = $(id); if (e) e.onclick = f; };
    on('#ac-google', async () => { Audio8.play('select'); await Cloud.signIn(); });
    on('#ac-rank', () => rankingModal());
    on('#ac-sync', async () => { toast(L('Sincronizando…', 'Syncing…')); const ok = await Cloud.syncNow(); toast(ok ? L('Partida sincronizada', 'Game synced') : L('No se pudo sincronizar', 'Could not sync')); });
    on('#ac-out', async () => { await Cloud.signOut(); accBind(); });
    on('#ac-show', async () => { await Cloud.setShow(!(p && p.show_in_rankings)); accBind(); });
    on('#ac-del', () => {
      openModal(`<h2>${L('¿Borrar tu cuenta?', 'Delete your account?')}</h2><p>${L('Se borrarán tu perfil, tu partida en la nube, tus marcas de ranking y tus amigos. La partida de este dispositivo no se toca.', 'Your profile, cloud game, ranking scores and friends will be deleted. The game on this device is not touched.')}</p><div class="row"><button class="btn" id="d-no">${L('Cancelar', 'Cancel')}</button><button class="btn danger" id="d-yes">${L('Sí, borrar', 'Yes, delete')}</button></div>`);
      $('#d-no').onclick = settings;
      $('#d-yes').onclick = async () => { const ok = await Cloud.deleteAccount(); settings(); toast(ok ? L('Cuenta borrada', 'Account deleted') : L('No se pudo borrar la cuenta', 'Could not delete the account')); };
    });
  }
  // Comprobación en vivo del nombre público (formato + si está libre). Devuelve una función para forzar la comprobación.
  function nickBind(inp, msg, btn) {
    let t = 0, seq = 0;
    const say = (txt, cls) => { msg.textContent = txt; msg.className = 'nickmsg ' + (cls || ''); };
    const fmtMsg = L('Usa de 3 a 16 letras, números, espacios, «.», «_» o «-» (sin palabras prohibidas).', 'Use 3 to 16 letters, numbers, spaces, “.”, “_” or “-” (no banned words).');
    const run = async () => {
      const n = inp.value.trim(), me = ++seq;
      if (!/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]{3,16}$/.test(n)) { say(fmtMsg, 'bad'); if (btn) btn.disabled = true; return; }
      say(L('Comprobando…', 'Checking…'), ''); if (btn) btn.disabled = true;
      const r = await Cloud.checkNickname(n);
      if (me !== seq) return;
      if (r.ok === true) { say(L('✔ Disponible', '✔ Available'), 'ok'); if (btn) btn.disabled = false; }
      else if (r.ok === false) { say(r.reason === 'taken' ? L('✖ Ese nombre ya está cogido.', '✖ That name is taken.') : fmtMsg, 'bad'); if (btn) btn.disabled = true; }
      else { say(L('No se pudo comprobar ahora; se verificará al guardar.', 'Could not check right now; it will be verified on save.'), ''); if (btn) btn.disabled = false; }
    };
    inp.addEventListener('input', () => { clearTimeout(t); seq++; if (btn) btn.disabled = true; t = setTimeout(run, 350); });
    return run;
  }
  function nameModal(done) {
    const p = Cloud.profile; if (!p) return;
    openModal(`<h2>${L('Elige tu nombre', 'Choose your name')}</h2><p class="hint">${L('Es el nombre que verán los demás en los rankings. Te hemos puesto uno automático; puedes cambiarlo ahora o más tarde en tu Perfil.', 'This is the name others will see in the rankings. We gave you an automatic one; you can change it now or later in your Profile.')}</p>
      <input class="search" id="nm-in" maxlength="16" value="${String(p.nickname).replace(/"/g, '')}" aria-label="${L('Nombre público', 'Public name')}" autocomplete="off" spellcheck="false"><em id="nm-msg" class="nickmsg" role="status" aria-live="polite"></em>
      <div class="row"><button class="btn" id="nm-later">${L('Más tarde', 'Later')}</button><button class="btn primary" id="nm-ok">${L('Guardar nombre', 'Save name')}</button></div>`);
    const inp = $('#nm-in'), msg = $('#nm-msg'), ok = $('#nm-ok'), check = nickBind(inp, msg, ok);
    check(); inp.focus(); inp.select();
    $('#nm-later').onclick = () => { closeModal(); if (done) done(); };
    const save = async () => {
      if (ok.disabled) return; ok.disabled = true;
      const r = await Cloud.setNickname(inp.value);
      if (r.ok) { closeModal(); toast(L('¡Nombre guardado!', 'Name saved!')); authPanel(); accBind(); if (done) done(); }
      else { msg.textContent = r.reason === 'taken' ? L('✖ Ese nombre ya está cogido.', '✖ That name is taken.') : r.reason === 'invalid' ? L('Usa de 3 a 16 letras, números, espacios, «.», «_» o «-».', 'Use 3 to 16 letters, numbers, spaces, “.”, “_” or “-”.') : L('No se pudo guardar. Inténtalo de nuevo.', 'Could not save. Try again.'); msg.className = 'nickmsg bad'; ok.disabled = false; }
    };
    ok.onclick = save;
    inp.onkeydown = e => { if (e.key === 'Enter') save(); };
  }
  function authChanged() { authPanel(); accBind(); }
  let rkBoard = 'stage';
  async function rankingModal(b) {
    if (b) rkBoard = b;
    const want = rkBoard, tabs = [['stage', L('Etapa', 'Stage')], ['rank', L('Rango', 'Rank')], ['tower', L('Torre', 'Tower')], ['master', L('Maestro', 'Master')], ['dex', 'Pokédex'], ['medals', L('Medallas', 'Medals')], ['weekly', L('Semanal', 'Weekly')]];
    openModal(`<h2>${L('Rankings', 'Rankings')}</h2><div class="seg wrap rktabs" role="tablist">${tabs.map(([id, n]) => `<button data-rk="${id}" class="${id === want ? 'on' : ''}" aria-pressed="${id === want}">${n}</button>`).join('')}</div>
      <div id="rk-body" class="rk-body"><p class="hint">${L('Cargando…', 'Loading…')}</p></div><div id="rk-me" class="rk-me"></div>
      <p class="hint" style="margin:6px 0 0">${Cloud.user ? L('Tus marcas se envían solas. Los rankings son por diversión.', 'Your scores are sent automatically. Rankings are for fun.') : L('Inicia sesión con Google para aparecer en los rankings.', 'Sign in with Google to appear in the rankings.')}</p>
      <div class="row"><button class="btn" id="rk-x">${L('Cerrar', 'Close')}</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#rk-x').onclick = closeModal;
    $$('[data-rk]').forEach(t => t.onclick = () => rankingModal(t.dataset.rk));
    const unit = { stage: L('etapa', 'stage'), rank: L('Rango', 'Rank'), tower: L('piso', 'floor'), master: L('nivel', 'level'), dex: 'Pokémon', medals: L('medallas', 'medals'), weekly: L('derrotas', 'defeats') };
    const sub = (id, r) => (id === 'stage' && r.extra > 0 ? L('Rango ', 'Rank ') + r.extra : id === 'rank' ? L('Esencia ', 'Essence ') + fmt(r.extra || 0) : id === 'weekly' && r.extra > 0 ? r.extra + L(' jefes del evento', ' event bosses') : '');
    try {
      const { rows, me } = await Cloud.board(want);
      if (rkBoard !== want || !$('#rk-body')) return;
      $('#rk-body').innerHTML = rows.length ? rows.map(r => `<div class="rkrow ${r.is_me ? 'me' : ''}"><span class="rkn">#${r.rank}</span><span class="pavatar sm rk-av" data-pf="${String(r.frame || 'classic').replace(/[^a-z]/g, '')}">${Sprites.html(Sprites.DEX[r.avatar] ? r.avatar : 25, false, 34, true)}</span><div class="rki"><b>${String(r.nickname).replace(/[<>&"]/g, '')}</b><small>${((TITLES.find(t => t.id === r.title) || {}).name || '')}${sub(want, r) ? ' · ' + sub(want, r) : ''}</small></div><span class="rkv">${fmt(r.value)}<small>${unit[want]}</small></span>${Cloud.user && !r.is_me ? `<button class="rkflag" data-rp="${r.user_id}" aria-label="${L('Denunciar', 'Report')}" title="${L('Denunciar', 'Report')}">⚑</button>` : ''}</div>`).join('') : `<p class="hint">${L('Todavía no hay nadie en este ranking. ¡Sé el primero!', 'Nobody is in this ranking yet. Be the first!')}</p>`;
      if (me) $('#rk-me').innerHTML = `<b>${L('Tu puesto', 'Your rank')}: #${me.rank}</b> <small>${L('de', 'of')} ${me.total} · ${fmt(me.value)} ${unit[want]}</small>`;
      $$('[data-rp]').forEach(b => b.onclick = () => {
        openModal(`<h2>${L('Denunciar jugador', 'Report player')}</h2><p class="hint">${L('¿Por qué lo denuncias?', 'Why are you reporting this player?')}</p><div class="seg wrap">${[[L('Nombre inapropiado', 'Inappropriate name')], [L('Sospecho de trampas', 'I suspect cheating')], [L('Otro motivo', 'Other')]].map(([t]) => `<button data-why="${t}">${t}</button>`).join('')}</div><div class="row"><button class="btn" id="rp-x">${L('Cancelar', 'Cancel')}</button></div>`);
        $('#rp-x').onclick = () => rankingModal();
        $$('[data-why]').forEach(w => w.onclick = async () => { const ok = await Cloud.report(b.dataset.rp, w.dataset.why); rankingModal(); toast(ok ? L('Gracias: lo revisaremos', 'Thanks: we will review it') : L('No se pudo enviar la denuncia', 'Could not send the report')); });
      });
    } catch (e) {
      if ($('#rk-body')) $('#rk-body').innerHTML = `<p class="hint">${Cloud.enabled() ? L('No se pudo cargar el ranking. Comprueba tu conexión.', 'Could not load the ranking. Check your connection.') : L('Los rankings no están disponibles en esta versión.', 'Rankings are not available in this version.')}</p>`;
    }
  }
  // ---------------- consejos de novedades ----------------
  let lastTip = -1;
  function tipModal(t, replay) {
    openModal(`<div class="tipbox"><span class="tipico">${ico(t.icon, 48)}</span><h2>${t.title}</h2><p>${t.text}</p></div>
      <div class="row">${replay ? '' : `<button class="btn small" id="tip-off">${L('No más consejos', 'No more tips')}</button>`}${t.tab ? `<button class="btn" id="tip-go">${L('Verlo', 'Show me')}</button>` : ''}<button class="btn primary" id="tip-ok">${L('Entendido', 'Got it')}</button></div>`);
    $('#tip-ok').onclick = closeModal;
    if ($('#tip-go')) $('#tip-go').onclick = () => { closeModal(); setTab(t.tab); };
    if ($('#tip-off')) $('#tip-off').onclick = () => { S().settings.tips = false; Core.save(); closeModal(); toast(L('Consejos desactivados. Puedes reactivarlos en Ajustes.', 'Tips turned off. You can turn them back on in Settings.')); };
  }
  function tipsTick() {
    const s = S(); if (!s || !s.started) return;
    if (!$('#modal').classList.contains('hidden') || !$('#evo').classList.contains('hidden') || !$('#gacha-fx').classList.contains('hidden') || Core.inChal() || tutEl || !$('#scr-game').classList.contains('active')) return;
    if (lastTip < 0) lastTip = s.stats.time - TIP_GAP + 25;
    if (s.stats.time - lastTip < TIP_GAP) return;
    const t = Core.nextTip(); if (!t) return;
    lastTip = s.stats.time; Core.seenTip(t.id); Core.save(); Audio8.play('unlock'); tipModal(t);
  }
  function tipsModal() {
    const s = S();
    openModal(`<h2>${L('Consejos de novedades', 'Feature tips')} <small style="color:var(--dim)">${TIPS.filter(t => s.ui.tips[t.id]).length}/${TIPS.length}</small></h2>
      <p class="hint">${L('Cada novedad te la explicamos una sola vez, cuando se hace útil. Aquí puedes releerlas.', 'We explain each feature only once, when it becomes useful. You can re-read them here.')}</p>
      <div class="trklist">${TIPS.map(t => `<div class="trk-row ${s.ui.tips[t.id] ? '' : 'lock'}"><span>${ico(t.icon, 20)}</span><span class="tn">${s.ui.tips[t.id] ? t.title : '???'}</span>${s.ui.tips[t.id] ? `<button class="btn small" data-tip="${t.id}">${L('Leer', 'Read')}</button>` : ''}</div>`).join('')}</div>
      <div class="row"><button class="btn small" id="tips-reset">${L('Volver a mostrarlos todos', 'Show them all again')}</button><button class="btn" id="tips-x">${L('Volver', 'Back')}</button></div>`);
    $$('[data-tip]').forEach(b => b.onclick = () => tipModal(TIPS.find(t => t.id === b.dataset.tip), true));
    $('#tips-reset').onclick = () => { Core.resetTips(); S().settings.tips = true; Core.save(); Audio8.play('select'); tipsModal(); };
    $('#tips-x').onclick = settings;
  }
  // ---------------- resumen al volver ----------------
  function welcomeModal(o) {
    const s = S(), parts = [], fmtT = secs => { const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60; return (h ? h + ' h ' : '') + m + ' min'; };
    const off = o.off;
    parts.push(`<h2>${off ? L('¡Bienvenido de nuevo!', 'Welcome back!') : L('Novedades', 'News')}</h2>`);
    if (off) {
      parts.push(`<div class="wsec"><b>${L('Mientras no estabas', 'While you were away')} (${fmtT(off.away)})</b><p>${L(`Tu equipo derrotó <b>${Core.fmt(off.kills)}</b> Pokémon y ganó`, `Your team defeated <b>${Core.fmt(off.kills)}</b> Pokémon and earned`)}</p><p style="font-size:26px;color:var(--yellow);margin:2px 0">${ico('coin', 24)} ${Core.fmt(off.coins)}</p><small>≈ ${Core.fmt(off.perHour)} ${L('monedas por hora', 'coins per hour')}</small>${off.capped ? `<p class="hint">${L(`Tu equipo solo trabaja ${Math.round(off.cap / 3600)} h seguidas sin ti: el resto no cuenta. Amplía el límite con el Campamento de la tienda de la Liga.`, `Your team only works ${Math.round(off.cap / 3600)} h in a row without you: the rest does not count. Extend the limit with the Camp in the League shop.`)}</p>` : ''}
        ${off.eggs.length ? `<div class="weggs">${off.eggs.map(e => { const w0 = Math.min(100, e.from / e.need * 100), w1 = Math.min(100, e.to / e.need * 100); return `<div class="wegg">${ico('egg' + e.t, 20)}<div class="bt"><i style="width:${w0}%"></i><i class="gain" style="left:${w0}%;width:${Math.max(0, w1 - w0)}%"></i></div><em>${w1 >= 100 ? '✓' : Math.round(w1) + '%'}</em></div>`; }).join('')}</div><small>${L('Progreso de tus huevos', 'Your eggs’ progress')}</small>` : ''}</div>`);
    }
    if (o.rc && o.rc.rows.length) parts.push(`<div class="wsec"><b>${L('Tu última sesión', 'Your last session')}${o.rc.time ? ' (' + fmtT(o.rc.time) + ')' : ''}</b><div class="wchips">${o.rc.rows.map(r => `<span><b>+${Core.fmt(r.v)}</b> ${r.name}</span>`).join('')}${o.rc.kills ? `<span><b>+${Core.fmt(o.rc.kills)}</b> ${L('Pokémon derrotados', 'Pokémon defeated')}</span>` : ''}</div></div>`);
    const news = [];
    if (o.rc && o.rc.weekChanged && Core.ev) news.push(L(`Semana nueva de evento: <b>${TYPE_NAMES[Core.ev.type]}</b> con jefe ${DEX[Core.ev.boss].name}.`, `New event week: <b>${TYPE_NAMES[Core.ev.type]}</b> with boss ${DEX[Core.ev.boss].name}.`));
    if (o.newDay) news.push(L('Hay <b>misiones diarias nuevas</b>.', 'There are <b>new daily quests</b>.'));
    const ready = s.daily.quests.concat(s.weekly.quests).filter(q => !q.claimed && Core.questProg(q) >= q.goal).length;
    if (ready) news.push(L(`Tienes <b>${ready}</b> misión${ready > 1 ? 'es' : ''} lista${ready > 1 ? 's' : ''} para recoger.`, `You have <b>${ready}</b> quest${ready > 1 ? 's' : ''} ready to claim.`));
    if (Core.eggsReady()) news.push(L(`Tienes <b>${Core.eggsReady()}</b> huevo${Core.eggsReady() > 1 ? 's' : ''} listo${Core.eggsReady() > 1 ? 's' : ''} para eclosionar en la pestaña Gacha.`, `You have <b>${Core.eggsReady()}</b> egg${Core.eggsReady() > 1 ? 's' : ''} ready to hatch in the Gacha tab.`));
    if (news.length) parts.push(`<div class="wsec"><b>${L('Hoy', 'Today')}</b><ul class="wlist">${news.map(n => `<li>${n}</li>`).join('')}</ul></div>`);
    if (o.daily && !s.daily.claimed) parts.push(`<div class="wsec"><b>${L('Recompensa diaria', 'Daily reward')}</b><p>${L(`Día <b>${s.daily.streak}</b> de racha`, `Day <b>${s.daily.streak}</b> streak`)}</p><p style="font-size:26px;color:#9fe8ff;margin:2px 0">${ico('gem', 24)} ${Core.dailyReward()}</p><small>${L('Vuelve mañana: la recompensa crece hasta el día 7.', 'Come back tomorrow: the reward grows until day 7.')}</small></div>`);
    openModal(`<div class="welc">${parts.join('')}</div><div class="row"><button class="btn big primary" id="w-ok">${o.daily && !s.daily.claimed ? L('Recoger', 'Claim') : L('Seguir', 'Continue')}</button></div>`);
    $$('[data-go]').forEach(b => b.onclick = () => { const g = Core.claimDaily(); if (g) Audio8.play('ticket'); Core.save(); closeModal(); setTab(b.dataset.go); });
    $('#w-ok').onclick = () => { const g = Core.claimDaily(); if (g) Audio8.play('ticket'); Core.save(); closeModal(); refresh(true); if (o.done) o.done(); };
  }
  // ---------------- consejos y perfil ----------------
  let pfFrom = 'settings';
  function profileModal(from) {
    if (from) pfFrom = from;
    const s = S(), pr = s.profile, open = Core.titlesOpen().length;
    const owned = Object.values(s.mons).sort((a, b) => Core.bst(Core.fdex(b)) - Core.bst(Core.fdex(a)) || b.lvl - a.lvl).slice(0, 48);
    const av = pr.avatar && DEX[pr.avatar] ? pr.avatar : (s.team[0] ? Core.fdex(s.mons[s.team[0]]) : 25);
    openModal(`<h2>${L('Perfil', 'Profile')}</h2>
      <div class="profhead">${avatarHtml('lg', 100)}<div>${Cloud.user && Cloud.profile ? `<div class="nickrow"><input class="search" id="pf-name" maxlength="16" placeholder="${L('Nombre público', 'Public name')}" value="${Cloud.profile.nickname.replace(/"/g, '')}" aria-label="${L('Nombre público', 'Public name')}"><button class="btn small primary" id="pf-nick">${L('Guardar', 'Save')}</button></div><em id="pf-nickmsg" class="nickmsg"></em>` : `<input class="search" id="pf-name" maxlength="14" placeholder="${L('Tu nombre', 'Your name')}" value="${pr.name.replace(/"/g, '')}" aria-label="${L('Tu nombre', 'Your name')}">`}<small>${(TITLES.find(t => t.id === pr.title) || TITLES[0]).name}</small></div></div>
      <h4>${L('Avatar', 'Avatar')}</h4><div class="avgrid">${owned.map(m => `<button data-av="${Core.fdex(m)}" class="${pr.avatar === Core.fdex(m) ? 'on' : ''}" aria-label="${DEX[Core.fdex(m)].name}">${Sprites.html(Core.fdex(m), m.shiny, 42, false)}</button>`).join('')}</div>
      <h4>${L('Marco del retrato', 'Portrait frame')} <small style="color:var(--dim)">${Core.framesOpen().length}/${FRAMES.length}</small></h4><div class="frgrid">${FRAMES.map(f => { const ok = Core.frameOpen(f); return `<button class="frprev ${s.cosm.frame === f.id ? 'on' : ''}" data-fr="${f.id}" data-frame-pick="${f.id}" ${ok ? '' : 'disabled'} aria-label="${f.name}" title="${ok ? f.name : f.hint}"><img src="${ok ? por(av) : por(av)}" alt="" style="${ok ? '' : 'filter:brightness(0) opacity(.5)'}"><small>${ok ? f.name : '???'}</small></button>`; }).join('')}</div>
      <h4>${L('Fondo de la arena', 'Arena background')} <small style="color:var(--dim)">${Core.biomesSeen().length}/${Tiles.THEMES.length}</small></h4><div class="bggrid"><button class="ttl ${s.cosm.bg === 'auto' ? 'on' : ''}" data-bg="auto"><b>${L('Automático', 'Automatic')}</b><small>${L('El de cada ruta', 'The one of each route')}</small></button>${Core.biomesSeen().map(i => `<button class="ttl ${String(s.cosm.bg) === String(i) ? 'on' : ''}" data-bg="${i}"><b><i class="sw" style="background:${Tiles.THEMES[i].floor}"></i>${biomeName(i)}</b></button>`).join('')}</div><p class="hint" style="margin:2px 0">${L('Los fondos se desbloquean al pasar por rutas con ese paisaje.', 'Backgrounds unlock when you travel through routes with that scenery.')}</p>
      <h4>${L('Título', 'Title')} <small style="color:var(--dim)">${open}/${TITLES.length}</small></h4><div class="titlist">${TITLES.map(t => { const ok = Core.titleOpen(t); return `<button class="ttl ${pr.title === t.id ? 'on' : ''}" data-ttl="${t.id}" ${ok ? '' : 'disabled'}><b>${ok ? t.name : '???'}</b><small>${ok ? '' : t.hint}</small></button>`; }).join('')}</div>
      <div class="row"><button class="btn" id="pf-x">${L('Volver', 'Back')}</button></div>`);
    if ($('#pf-nick')) { const b = $('#pf-nick'); nickBind($('#pf-name'), $('#pf-nickmsg'), b); }
    if ($('#pf-nick')) $('#pf-nick').onclick = async () => {
      const r = await Cloud.setNickname($('#pf-name').value), m = $('#pf-nickmsg');
      m.textContent = r.ok ? L('¡Nombre guardado!', 'Name saved!') : r.reason === 'taken' ? L('Ese nombre ya está cogido.', 'That name is taken.') : r.reason === 'invalid' ? L('Usa de 3 a 16 letras, números, espacios, «.», «_» o «-» (sin palabras prohibidas).', 'Use 3 to 16 letters, numbers, spaces, “.”, “_” or “-” (no banned words).') : L('No se pudo guardar. Inténtalo de nuevo.', 'Could not save. Try again.');
      m.className = 'nickmsg ' + (r.ok ? 'ok' : 'bad');
    };
    else {
      $('#pf-name').oninput = e => { Core.setName(e.target.value); };
      $('#pf-name').onchange = () => { Core.save(); };
    }
    $$('[data-av]').forEach(b => b.onclick = () => { Core.setAvatar(+b.dataset.av); Core.save(); Cloud.pushProfile(); Audio8.play('swap'); profileModal(); });
    $$('[data-frame-pick]').forEach(b => b.onclick = () => { if (Core.setFrame(b.dataset.framePick)) { document.documentElement.dataset.frame = S().cosm.frame; Core.save(); Cloud.pushProfile(); Audio8.play('select'); profileModal(); } });
    $$('[data-bg]').forEach(b => b.onclick = () => { if (Core.setBg(b.dataset.bg)) { Core.save(); Audio8.play('swap'); profileModal(); } });
    $$('[data-ttl]').forEach(b => b.onclick = () => { if (Core.setTitle(b.dataset.ttl)) { Core.save(); Cloud.pushProfile(); Audio8.play('select'); profileModal(); } });
    $('#pf-x').onclick = () => { Core.save(); paintProf(true); paintCont(); if (pfFrom === 'settings') settings(); else closeModal(); };
  }
  // ---------------- Ascensión ----------------
  function ascHtml() {
    const s = S(), a = s.asc;
    if (!Core.ascOpen() && !a.rank) return `<h3>${L('Ascensión', 'Ascension')}</h3><p class="hint">${L(`Llega a la <b>etapa ${ASC.min}</b> para desbloquear la Ascensión: una Liga que además sube tu Rango y te da Esencia, con multiplicadores permanentes sin techo.`, `Reach <b>stage ${ASC.min}</b> to unlock Ascension: a League run that also raises your Rank and gives you Essence, with permanent uncapped multipliers.`)}</p>`;
    const ready = Core.ascReady(), g = Core.essGain();
    let h = `<h3>${L('Ascensión', 'Ascension')} <small style="color:var(--dim)">${L('Rango', 'Rank')} ${a.rank}</small></h3><div class="asc">
      <div class="ascnums"><div><b>${a.ess}</b><small>${L('Esencia', 'Essence')}</small></div><div><b>×${fmt(Core.ascDmg())}</b><small>${L('daño', 'damage')}</small></div><div><b>×${fmt(Core.ascCoin())}</b><small>${L('monedas', 'coins')}</small></div><div><b>×${fmt(Core.rankHp())}</b><small>${L('vida enemiga', 'enemy HP')}</small></div></div>`;
    if (ready) h += `<p>${L(`Si asciendes ahora ganas <b style="color:var(--yellow)">+${g} Esencia</b> (×${(Math.pow(ASC.dmgEss, g)).toFixed(2)} de daño y ×${(Math.pow(ASC.coinEss, g)).toFixed(2)} de monedas) además de las medallas de la Liga. El Rango sube a ${a.rank + 1} y los enemigos tendrán ×${ASC.hpRank} más vida.`, `If you ascend now you earn <b style="color:var(--yellow)">+${g} Essence</b> (×${(Math.pow(ASC.dmgEss, g)).toFixed(2)} damage and ×${(Math.pow(ASC.coinEss, g)).toFixed(2)} coins) on top of the League medals. Your Rank goes up to ${a.rank + 1} and enemies get ×${ASC.hpRank} more HP.`)}</p><button class="btn big primary" data-act="ascend">${L('Ascender', 'Ascend')}</button>`;
    else h += `<p class="hint">${L(`Para ascender tienes que llegar a la etapa ${ASC.min} en esta vuelta (vas por la ${s.maxStage}). Cuanto más lejos llegues, más Esencia: en la 650 son ${ascGain(650)}, en la 800 ${ascGain(800)} y en la 1000 ${ascGain(1000)}.`, `To ascend you must reach stage ${ASC.min} in this run (you are at ${s.maxStage}). The further you go, the more Essence: at 650 it is ${ascGain(650)}, at 800 ${ascGain(800)} and at 1000 ${ascGain(1000)}.`)}</p>`;
    return h + `<p class="hint">${L(`Cada Esencia da ×${String(ASC.dmgEss).replace('.', ',')} de daño y ×${String(ASC.coinEss).replace('.', ',')} de monedas para siempre y se acumula multiplicando. Ascender reinicia como la Liga; conservas medallas, tienda de la Liga, Pokémon, Pokédex, Torre y Esencia. Cada Rango hace a los enemigos ×${String(ASC.hpRank).replace('.', ',')} más duros: la dificultad nunca deja de subir.`, `Each Essence gives ×${ASC.dmgEss} damage and ×${ASC.coinEss} coins forever and stacks multiplicatively. Ascending restarts like the League; you keep medals, the League shop, Pokémon, the Pokédex, the Tower and Essence. Every Rank makes enemies ×${ASC.hpRank} tougher: the difficulty never stops rising.`)}</p></div>`;
  }
  function ascendModal() {
    const g = Core.essGain(), m = Core.medalGain();
    openModal(`<h2>${L('¿Ascender?', 'Ascend?')}</h2><p>${L(`Ganarás <b style="color:var(--yellow)">+${g} Esencia</b> y <b style="color:var(--yellow)">+${m} medallas</b>. Tu Rango pasará a ${S().asc.rank + 1}.`, `You will earn <b style="color:var(--yellow)">+${g} Essence</b> and <b style="color:var(--yellow)">+${m} medals</b>. Your Rank will become ${S().asc.rank + 1}.`)}</p>
      <p class="hint">${L('Vuelves a la etapa 1 como en la Liga. Los enemigos serán más duros, pero tus multiplicadores crecen para siempre.', 'You go back to stage 1 as in the League. Enemies will be tougher, but your multipliers keep growing forever.')}</p>
      <div class="row"><button class="btn" id="p-no">${L('Todavía no', 'Not yet')}</button><button class="btn primary" id="p-yes">${L('¡Ascender!', 'Ascend!')}</button></div>`);
    $('#p-no').onclick = closeModal;
    $('#p-yes').onclick = () => { const r = Core.ascend(); closeModal(); if (r) { Audio8.play('legend'); banner(L('¡Ascensión! Rango ', 'Ascension! Rank ') + S().asc.rank, '+' + r.ess + L(' Esencia · +', ' Essence · +') + r.medals + L(' medallas', ' medals'), '#ffd23f'); } Core.save(); refresh(true); };
  }
  // consejo de cuándo entrar en la Liga (verde si compensa, naranja si aún sale mejor seguir avanzando)
  function leagueTip(g) {
    const r = Core.leagueRec();
    return g >= r ? `<p class="hint" style="color:#7ff0a0">${L('¡Buen momento para entrar!', 'Good time to enter!')}</p>`
      : `<p class="hint" style="color:#ffb060">${L(`Recomendado a partir de <b>+${r} medallas</b>: con tan pocas, volver a subir te costará más de lo que ganas. Sigue avanzando un poco más.`, `Recommended from <b>+${r} medals</b>: with so few, climbing back costs more than you gain. Keep going a bit further.`)}</p>`;
  }
  function prestigeModal() {
    const g = Core.medalGain();
    openModal(`<h2>${L('¿Entrar en la Liga?', 'Enter the League?')}</h2><p>${L(`Ganarás <b style="color:var(--yellow)">+${g} medallas</b> (+${g * 3}% de daño y monedas para siempre) y ${g} Puntos de Liga para la tienda.`, `You will earn <b style="color:var(--yellow)">+${g} medals</b> (+${g * 3}% damage and coins forever) and ${g} League Points for the shop.`)}</p>
      ${leagueTip(g)}<p class="hint">${L('Vuelves a la etapa 1. Pierdes monedas, niveles, mejoras y algunos huecos. Conservas Pokémon, estrellas, gemas y Pokédex.', 'You go back to stage 1. You lose coins, levels, upgrades and some slots. You keep Pokémon, stars, gems and the Pokédex.')}</p>
      <div class="row"><button class="btn" id="p-no">${L('Todavía no', 'Not yet')}</button><button class="btn primary" id="p-yes">${L('¡Adelante!', 'Go ahead!')}</button></div>`);
    $('#p-no').onclick = closeModal;
    $('#p-yes').onclick = () => { const n = Core.prestige(); closeModal(); Audio8.play('win'); banner(L('¡Bienvenido a la Liga!', 'Welcome to the League!'), '+' + n + L(' medallas · tu nuevo viaje empieza ahora', ' medals · your new journey starts now'), '#ffd23f'); Core.save(); Cloud.soon(); refresh(true); };
  }

  // pantalla completa / instalar para quitar las barras del navegador
  function iosHelpModal() {
    openModal(`<h2>${L('Jugar sin barras en iPhone', 'Play without bars on iPhone')}</h2><ol class="iosl"><li>${L('Abre esta página en <b>Safari</b>.', 'Open this page in <b>Safari</b>.')}</li><li>${L('Pulsa el botón <b>Compartir</b> (el cuadrado con la flecha hacia arriba).', 'Tap the <b>Share</b> button (the square with the up arrow).')}</li><li>${L('Elige <b>Añadir a pantalla de inicio</b> y confirma.', 'Choose <b>Add to Home Screen</b> and confirm.')}</li><li>${L('Abre PokéIdle desde el icono nuevo: se ve a pantalla completa, sin las barras de Safari.', 'Open PokéIdle from the new icon: it runs full screen, without Safari’s bars.')}</li></ol><p class="hint">${L('Safari en el iPhone no permite ocultar sus barras desde una página web; instalarla es la única forma.', 'Safari on iPhone does not let a web page hide its bars; installing it is the only way.')}</p><div class="row"><button class="btn primary" id="ios-x">${L('Entendido', 'Got it')}</button></div>`);
    $('#ios-x').onclick = closeModal;
  }
  function fsBlock() {
    if (PWA.standalone()) return `<p class="hint" style="margin:0">${L('Ya juegas sin barras del navegador: estás en la app instalada.', 'You already play without browser bars: you are in the installed app.')}</p>`;
    const st = S().settings;
    let h = `<p class="hint" style="margin:0 0 6px">${L('Para jugar sin las barras de arriba y de abajo del navegador: instala la app (Añadir a pantalla de inicio) o usa la pantalla completa.', 'To play without the browser bars at the top and bottom: install the app (Add to Home Screen) or use full screen.')}</p><div class="row tight" style="margin:0">`;
    if (PWA.fsSupported()) h += `<button class="btn primary" id="s-fs">⛶ ${PWA.fsActive() ? L('Salir de pantalla completa', 'Exit full screen') : L('Pantalla completa', 'Full screen')}</button>`;
    if (PWA.isIOS()) h += `<button class="btn" id="s-ios">📲 ${L('Cómo instalarla en iPhone', 'How to install on iPhone')}</button>`;
    h += '</div>';
    if (PWA.fsSupported()) h += `<div class="setrow" style="margin-top:8px"><span class="sl"><b>${L('Pantalla completa al jugar', 'Full screen on play')}</b><small>${L('Al pulsar Jugar o Continuar', 'When you press Play or Continue')}</small></span><button class="tog ${st.autoFs ? 'on' : ''}" id="s-autofs" role="switch" aria-checked="${!!st.autoFs}" aria-label="${L('Pantalla completa al jugar', 'Full screen on play')}"><i></i></button></div>`;
    return h;
  }
  function settings() {
    const st = S().settings, a11y = st.a11y;
    const a11yTog = (k, label, sub) => `<div class="setrow"><span class="sl"><b>${label}</b><small>${sub}</small></span><button class="tog ${a11y[k] ? 'on' : ''}" data-a11y="${k}" role="switch" aria-checked="${!!a11y[k]}" aria-label="${label}"><i></i></button></div>`;
    const slider = (k, label, icon) => `<div class="setrow"><span class="sl">${ico(icon, 24)}<b>${label}</b></span><div class="slider" data-k="${k}" style="--v:${st[k]}"><div class="trk"><i></i><u></u></div><em>${Math.round(st[k] * 100)}%</em></div></div>`;
    const tog = (k, label, sub) => `<div class="setrow"><span class="sl"><b>${label}</b><small>${sub}</small></span><button class="tog ${st[k] ? 'on' : ''}" data-k="${k}"><i></i></button></div>`;
    openModal(`<div class="set"><h2>${ico('gear', 32)} ${L('Ajustes', 'Settings')}</h2>
      <div class="sset"><h4>${L('Idioma', 'Language')}</h4><div class="seg"><button data-lang="es" class="${I18N.lang === 'es' ? 'on' : ''}">Español</button><button data-lang="en" class="${I18N.lang === 'en' ? 'on' : ''}">English</button></div></div>
      ${Cloud.enabled() ? `<div class="sset"><h4>${L('Cuenta', 'Account')}</h4><div id="acc-box"></div></div>` : ''}
      <div class="sset"><h4>${L('Sonido', 'Sound')}</h4>${slider('master', L('Volumen general', 'Master volume'), 'gear')}${slider('music', L('Música', 'Music'), 'sound')}${slider('sfx', L('Efectos', 'Effects'), 'ticket')}${slider('combat', L('Sonidos de combate', 'Combat sounds'), 'fist')}
        <div class="setrow col"><span class="sl"><b>${L('Estilo de la música', 'Music style')}</b><small>${L('Cambia los instrumentos de todas las pistas', 'Changes the instruments of every track')}</small></span><div class="seg a11y" role="group">${[['warm', L('Cálido', 'Warm')], ['retro', L('Retro 8 bits', 'Retro 8-bit')], ['dream', L('Ensueño', 'Dreamy')]].map(([v, l]) => `<button data-setk="mstyle" data-sv="${v}" class="${st.mstyle === v ? 'on' : ''}" aria-pressed="${st.mstyle === v}">${l}</button>`).join('')}</div></div>
        <div class="setrow col"><span class="sl"><b>${L('Qué suena', 'What plays')}</b><small>${st.mmode === 'pin' ? L('Siempre la misma pista (elígela en la sala de música)', 'Always the same track (choose it in the music room)') : st.mmode === 'shuffle' ? L('Cambia de pista cada dos vueltas; los jefes y duelos mantienen la suya', 'Switches track every two loops; bosses and duels keep theirs') : L('Una pista por región, y una propia para jefes, duelos, Torre y eventos', 'One track per region, plus their own for bosses, duels, the Tower and events')}</small></span><div class="seg a11y" role="group">${[['region', L('Por región', 'By region')], ['shuffle', L('Aleatorio', 'Shuffle')], ['pin', L('Pista fija', 'Pinned track')]].map(([v, l]) => `<button data-setk="mmode" data-sv="${v}" class="${st.mmode === v ? 'on' : ''}" aria-pressed="${st.mmode === v}">${l}</button>`).join('')}</div></div>
        ${tog('bgmute', L('Silenciar en segundo plano', 'Mute in the background'), L('Pausa la música cuando cambias de pestaña del navegador', 'Pauses the music when you switch browser tabs'))}
        ${tog('captions', L('Subtítulos de sonidos', 'Sound captions'), L('Muestra un aviso en pantalla con los sonidos importantes (jefes, premios, derrotas…)', 'Shows an on-screen caption for important sounds (bosses, rewards, defeats…)'))}
        <div class="row" style="margin:6px 0 0"><button class="btn primary" id="s-music">${ico('sound', 16)} ${L('Sala de música', 'Music room')} · ${Core.tracksUnlocked()}/${MUSIC_LIST.length}</button></div></div>
      <div class="sset"><h4>${L('Perfil', 'Profile')}</h4><div class="setrow"><span class="sl"><b>${S().profile.name || L('Entrenador', 'Trainer')}</b><small>${(TITLES.find(t => t.id === S().profile.title) || TITLES[0]).name} · ${Core.titlesOpen().length}/${TITLES.length} ${L('títulos', 'titles')}</small></span><button class="btn small primary" id="s-prof">${L('Editar', 'Edit')}</button></div></div>
      <div class="sset"><h4>${L('Consejos', 'Tips')}</h4>${tog('tips', L('Consejos de novedades', 'Feature tips'), L('Te explica cada función nueva una sola vez, cuando se hace útil', 'Explains each new feature once, when it becomes useful'))}<div class="row" style="margin:4px 0 0"><button class="btn small" id="s-tips">${L('Ver consejos', 'View tips')} · ${TIPS.filter(t => S().ui.tips[t.id]).length}/${TIPS.length}</button></div></div>
      <div class="sset"><h4>${L('Combate', 'Combat')}</h4>${tog('nums', L('Números de daño', 'Damage numbers'), L('Muestra el daño y las monedas sobre el enemigo', 'Shows damage and coins over the enemy'))}${tog('bigNums', L('Números grandes', 'Big numbers'), L('Más tamaño para verlos mejor', 'Bigger size to see them better'))}${tog('shake', L('Temblor de pantalla', 'Screen shake'), L('En críticos y jefes', 'On crits and bosses'))}${tog('autoBoss', L('Reintentar jefes automáticamente', 'Auto-retry bosses'), L('Vuelve a retar al jefe cuando tu equipo tenga fuerza para vencerlo', 'Challenges the boss again when your team is strong enough to beat it'))}</div>
      <div class="sset"><h4>${L('Accesibilidad', 'Accessibility')}</h4>
        <div class="setrow col"><span class="sl"><b>${L('Tamaño del texto', 'Text size')}</b></span><div class="seg a11y" role="group" aria-label="${L('Tamaño del texto', 'Text size')}">${[[1, L('Normal', 'Normal')], [1.15, L('Grande', 'Large')], [1.3, L('Muy grande', 'Extra large')]].map(([v, l]) => `<button data-ak="text" data-av="${v}" class="${+a11y.text === v ? 'on' : ''}" aria-pressed="${+a11y.text === v}">${l}</button>`).join('')}</div></div>
        <div class="setrow col"><span class="sl"><b>${L('Animaciones', 'Animations')}</b></span><div class="seg a11y" role="group" aria-label="${L('Animaciones', 'Animations')}">${[['auto', L('Según el sistema', 'System setting')], ['reduce', L('Reducidas', 'Reduced')], ['full', L('Todas', 'Full')]].map(([v, l]) => `<button data-ak="motion" data-av="${v}" class="${a11y.motion === v ? 'on' : ''}" aria-pressed="${a11y.motion === v}">${l}</button>`).join('')}</div></div>
        ${a11yTog('nf', L('Sin destellos', 'No flashing'), L('Quita los fogonazos del gacha, la evolución y los golpes', 'Removes flashes in the gacha, evolutions and hits'))}
        ${a11yTog('hc', L('Alto contraste', 'High contrast'), L('Texto más claro y bordes marcados', 'Lighter text and stronger borders'))}
        ${a11yTog('cb', L('Paleta para daltonismo', 'Color-blind palette'), L('Rarezas y avisos con colores distinguibles (azul/naranja en lugar de rojo/verde)', 'Distinguishable rarity and alert colors (blue/orange instead of red/green)'))}
        <p class="hint" style="margin:6px 0 0">${L('Atajos: 1–7 cambian de pestaña, Esc cierra ventanas y Tab recorre los botones.', 'Shortcuts: 1–7 switch tabs, Esc closes windows and Tab moves between buttons.')}</p></div>
      <div class="sset"><h4>${L('Teclado', 'Keyboard')}</h4><div class="row" style="margin:0"><button class="btn" id="s-keys">⌨ ${L('Atajos de teclado', 'Keyboard shortcuts')}</button></div></div>
      <div class="sset"><h4>${L('Pantalla', 'Screen')}</h4>${fsBlock()}</div>
      <div class="sset"><h4>${L('Aplicación', 'App')}</h4>${PWA.standalone() ? '<p class="hint" style="margin:0 0 6px">' + L('Estás usando la app instalada.', 'You are using the installed app.') + '</p>' : PWA.canInstall() ? '<div class="row" style="margin:0 0 6px"><button class="btn primary" id="s-inst">' + L('Instalar la app', 'Install the app') + '</button></div>' : '<p class="hint" style="margin:0 0 6px">' + L('Puedes instalarla desde el menú del navegador («Instalar app»). En iPhone: Compartir → Añadir a pantalla de inicio.', 'You can install it from the browser menu (“Install app”). On iPhone: Share → Add to Home Screen.') + '</p>'}
        <div class="setrow"><span class="sl"><b>${L('Avisos', 'Notifications')}</b><small id="ntf-sub"></small></span><button class="tog" id="s-notif"><i></i></button></div></div>
      <div class="sset"><h4>${L('Estadísticas', 'Statistics')}</h4><div class="row" style="margin:0"><button class="btn" id="s-stats">${L('Ver estadísticas y gráficas', 'View statistics and charts')}</button></div></div>
      <div class="sset"><h4>${L('Partida', 'Save data')}</h4><div class="row" style="margin:0"><button class="btn" id="s-exp">${L('Exportar', 'Export')}</button><button class="btn" id="s-imp">${L('Importar', 'Import')}</button><button class="btn danger" id="s-wipe">${L('Borrar', 'Erase')}</button></div>
        <p class="hint" style="margin:8px 0 0">${L('Tu partida se guarda sola en este navegador. Exporta un código para llevarla a otro dispositivo.', 'Your game saves itself in this browser. Export a code to take it to another device.')}</p></div>
      <div class="sset kofi-box"><h4>${L('Apoya el proyecto', 'Support the project')}</h4><p class="hint" style="margin:0 0 8px">${L('PokéIdle es gratis y lo hace una sola persona. Si te gusta, puedes invitarme a un café.', 'PokéIdle is free and made by one person. If you like it, you can buy me a coffee.')}</p><a class="kofi" href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${ico('cup', 24)} ${L('Apoyar en Ko-fi', 'Support on Ko-fi')}</a><div class="socrow"><small>${L('Sígueme y reporta fallos o ideas:', 'Follow me and report bugs or ideas:')}</small><div>${socialHtml()}</div></div></div>
      <div class="row"><button class="btn" id="s-tut">${L('Ver el tutorial', 'Watch the tutorial')}</button><button class="btn big primary" id="s-ok">${L('Listo', 'Done')}</button></div>
      <p class="fine">${L('Sprites: PMD SpriteCollab (CC BY-NC 4.0) · Escenarios e iconos adaptados de pokesurvivor (MIT) · Pokémon © Nintendo/Creatures/GAME FREAK', 'Sprites: PMD SpriteCollab (CC BY-NC 4.0) · Scenes and icons adapted from pokesurvivor (MIT) · Pokémon © Nintendo/Creatures/GAME FREAK')}</p></div>`);
    $$('[data-ak]').forEach(b => b.onclick = () => { a11y[b.dataset.ak] = b.dataset.ak === 'text' ? +b.dataset.av : b.dataset.av; Core.save(); A11Y.apply(a11y); Audio8.play('click'); settings(); });
    $$('[data-a11y]').forEach(b => b.onclick = () => { a11y[b.dataset.a11y] = !a11y[b.dataset.a11y]; Core.save(); A11Y.apply(a11y); Audio8.play('click'); settings(); refresh(true); });
    $$('[data-setk]').forEach(b => b.onclick = () => { st[b.dataset.setk] = b.dataset.sv; Core.save(); Audio8.play('click'); if (b.dataset.setk === 'mstyle') Audio8.restyle(); else Audio8.remode(); settings(); });
    $('#s-music').onclick = musicModal;
    accBind();
    $('#s-prof').onclick = () => profileModal('settings');
    $('#s-tips').onclick = tipsModal;
    $$('[data-lang]').forEach(b => b.onclick = () => { S().settings.lang = b.dataset.lang; Core.save(); location.reload(); });
    $$('.slider').forEach(sl => {
      const k = sl.dataset.k, trk = sl.querySelector('.trk');
      const set = e => { const r = trk.getBoundingClientRect(), v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); st[k] = Math.round(v * 20) / 20; sl.style.setProperty('--v', st[k]); sl.querySelector('em').textContent = Math.round(st[k] * 100) + '%'; Audio8.setVolumes(); };
      sl.onpointerdown = e => { sl.setPointerCapture(e.pointerId); set(e); sl.onpointermove = set; };
      sl.onpointerup = () => { sl.onpointermove = null; if (k === 'sfx' || k === 'master') Audio8.play('coin'); else if (k === 'combat') Audio8.play('boom'); Core.save(); };
      // teclado y lectores de pantalla: flechas ±5 %, Inicio/Fin
      const nm = sl.closest('.setrow') && sl.closest('.setrow').querySelector('b');
      sl.tabIndex = 0; sl.setAttribute('role', 'slider'); sl.setAttribute('aria-valuemin', '0'); sl.setAttribute('aria-valuemax', '100'); if (nm) sl.setAttribute('aria-label', nm.textContent);
      const paint = () => { sl.style.setProperty('--v', st[k]); sl.querySelector('em').textContent = Math.round(st[k] * 100) + '%'; sl.setAttribute('aria-valuenow', String(Math.round(st[k] * 100))); Audio8.setVolumes(); };
      paint();
      sl.onkeydown = e => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.05 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.05 : 0;
        if (!d && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault(); st[k] = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : Math.max(0, Math.min(1, Math.round((st[k] + d) * 20) / 20));
        paint(); Core.save();
      };
    });
    $$('.tog[data-k]').forEach(t => t.onclick = () => { st[t.dataset.k] = !st[t.dataset.k]; t.classList.toggle('on', st[t.dataset.k]); Audio8.play('click'); Core.save(); applySettings(); });
    const paintNtf = () => {
      const p = PWA.perm(), on = PWA.notifOn();
      $('#s-notif').classList.toggle('on', on);
      $('#ntf-sub').textContent = p === 'unsupported' ? L('Tu navegador no admite avisos', 'Your browser does not support notifications') : p === 'denied' ? L('Bloqueados en el navegador', 'Blocked in the browser') : L('Huevo listo y límite offline, con la app abierta en segundo plano', 'Egg ready and offline limit, with the app open in the background');
    };
    paintNtf();
    $('#s-notif').onclick = async () => { if (PWA.notifOn()) { st.notify = false; } else await PWA.enableNotify(); Audio8.play('click'); Core.save(); paintNtf(); };
    if ($('#s-inst')) $('#s-inst').onclick = async () => { await PWA.install(); settings(); };
    $('#s-stats').onclick = () => statsModal(false);
    $('#s-keys').onclick = keysModal;
    if ($('#s-fs')) $('#s-fs').onclick = async () => { await PWA.fsToggle(); setTimeout(settings, 150); };
    if ($('#s-ios')) $('#s-ios').onclick = iosHelpModal;
    if ($('#s-autofs')) $('#s-autofs').onclick = () => { const st2 = S().settings; st2.autoFs = !st2.autoFs; Core.save(); Audio8.play('click'); settings(); };
    $('#s-ok').onclick = () => { Core.save(); closeModal(); };
    $('#s-tut').onclick = () => { closeModal(); setTab('team'); tutStart(true); };
    $('#s-exp').onclick = () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S()))));
      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
      openModal(`<h2>${L('Exportar partida', 'Export save')}</h2><p class="hint">${L('Copiado al portapapeles. Guarda este código:', 'Copied to the clipboard. Keep this code:')}</p><textarea class="search area" readonly id="code">${code}</textarea><div class="row"><button class="btn primary" id="e-ok">${L('Cerrar', 'Close')}</button></div>`);
      $('#code').onfocus = e => e.target.select(); $('#e-ok').onclick = settings;
    };
    $('#s-imp').onclick = () => {
      openModal(`<h2>${L('Importar partida', 'Import save')}</h2><p class="hint">${L('Pega aquí el código exportado. Sustituirá tu partida actual.', 'Paste the exported code here. It will replace your current game.')}</p><textarea class="search area" id="code" placeholder="${L('Pega el código…', 'Paste the code…')}"></textarea><p class="hint" id="imp-err" style="color:#ff8080"></p><div class="row"><button class="btn" id="i-no">${L('Cancelar', 'Cancel')}</button><button class="btn primary" id="i-yes">${L('Importar', 'Import')}</button></div>`);
      $('#i-no').onclick = settings;
      $('#i-yes').onclick = () => {
        try { const d = JSON.parse(decodeURIComponent(escape(atob($('#code').value.trim())))); if (!d || d.v !== 1 || !d.mons || typeof d.mons !== 'object') throw 0; const old = localStorage.getItem('pokeidle.save.v1'); if (old) localStorage.setItem('pokeidle.save.v1.bak', old); localStorage.setItem('pokeidle.save.v1', JSON.stringify(d)); Core.freezeSave(true); location.reload(); }
        catch (e) { $('#imp-err').textContent = L('Ese código no es válido.', 'That code is not valid.'); }
      };
    };
    $('#s-wipe').onclick = () => {
      openModal(`<h2>${L('¿Borrar todo?', 'Erase everything?')}</h2><p>${L('Perderás todos tus Pokémon y tu progreso.', 'You will lose all your Pokémon and your progress.')}</p><div class="row"><button class="btn" id="w-no">No</button><button class="btn danger" id="w-yes">${L('Sí, borrar', 'Yes, erase')}</button></div>`);
      $('#w-no').onclick = settings;
      $('#w-yes').onclick = () => { Core.wipe(); location.reload(); };
    };
  }
  function musicModal() {
    const st = S().settings, now = Audio8.auditioning;
    openModal(`<h2>${ico('sound', 32)} ${L('Sala de música', 'Music room')} <small style="color:var(--dim)">${Core.tracksUnlocked()}/${MUSIC_LIST.length}</small></h2>
      <p class="hint">${L('Escucha las pistas que has desbloqueado. La estrella fija una como música de fondo. Las demás se desbloquean jugando.', 'Listen to the tracks you have unlocked. The star pins one as your background music. The rest unlock as you play.')}${st.music <= 0 ? ' <b>' + L('La música está en 0%: súbela en Ajustes.', 'Music is at 0%: raise it in Settings.') + '</b>' : ''}</p>
      <div class="trklist">${MUSIC_LIST.map(t => {
        const ok = Core.musicUnlocked(t), pinned = st.mmode === 'pin' && st.mpin === t.id;
        return `<div class="trk-row ${ok ? '' : 'lock'}"><span class="tn">${ok ? t.name : '???'}</span>${ok ? `<button class="btn small ${now === t.id ? 'primary' : ''}" data-play="${t.id}" aria-label="${now === t.id ? L('Parar', 'Stop') : L('Escuchar', 'Listen')} ${t.name}">${now === t.id ? '■' : '▶'}</button><button class="btn small ${pinned ? 'primary' : ''}" data-pin="${t.id}" aria-pressed="${pinned}" aria-label="${L('Fijar', 'Pin')} ${t.name}" title="${L('Fijar como música de fondo', 'Pin as background music')}">${ico('star', 12)}</button>` : `<small>${t.hint}</small>`}</div>`;
      }).join('')}</div>
      <div class="row"><button class="btn" id="mr-x">${L('Volver', 'Back')}</button></div>`);
    $$('[data-play]').forEach(b => b.onclick = () => { if (Audio8.auditioning === b.dataset.play) Audio8.endAudition(); else Audio8.audition(b.dataset.play); musicModal(); });
    $$('[data-pin]').forEach(b => b.onclick = () => { st.mmode = 'pin'; st.mpin = b.dataset.pin; Core.save(); Audio8.play('select'); Audio8.endAudition(); Audio8.remode(); musicModal(); });
    $('#mr-x').onclick = () => { Audio8.endAudition(); settings(); };
  }
  function applySettings() { const l = $('#dmg-layer'); if (l) { l.classList.toggle('big', S().settings.bigNums !== false); } }

  // ---------------- modales, avisos ----------------
  function openModal(html) { $('#modal-box').innerHTML = html; $('#modal').classList.remove('hidden'); A11Y.pass($('#modal-box')); }
  function closeModal() { Audio8.endAudition(); $('#modal').classList.add('hidden'); $('#modal-box').classList.remove('wide'); monCv = null; closeDD(); }
  let bannerT = null;
  function banner(title, sub, color) {
    const b = $('#banner');
    b.querySelector('b').textContent = title;
    b.querySelector('small').textContent = sub || '';
    b.style.setProperty('--bc', color || 'var(--yellow)');
    b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.add('hidden'), 2600);
  }
  let toastT = null;
  const CUES = { boss: ['¡Jefe!', 'Boss!'], duel: ['¡Duelo!', 'Duel!'], legend: ['¡Legendario!', 'Legendary!'], rare: ['¡Raro!', 'Rare!'], item: ['Objeto', 'Item'], ticket: ['Tickets', 'Tickets'], levelup: ['Nivel', 'Level up'], evolve: ['Evolución', 'Evolution'], death: ['Derrota', 'Defeat'], win: ['Victoria', 'Victory'], trainer: ['Entrenador', 'Trainer'], unlock: ['Desbloqueado', 'Unlocked'], pop: ['Gacha', 'Gacha'] };
  let cueT = 0;
  function cue(name) {
    const c = CUES[name]; if (!c || !S() || !S().settings.captions) return;
    const el = $('#cue'); if (!el) return;
    el.textContent = '♪ ' + L(c[0], c[1]); el.classList.remove('hidden');
    clearTimeout(cueT); cueT = setTimeout(() => el.classList.add('hidden'), 1500);
  }
  function toast(html) { const t = $('#toast'); t.innerHTML = html; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2000); }

  function bind() {
    $('#tab-body').addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) act(el); });
    loadDexUi();
    $('#tab-body').addEventListener('input', e => { if (e.target.id === 'dex-q') { dexQ = e.target.value; const g = $('#dexgrid'); if (g) g.innerHTML = dexGrid(); } });
    $('#tab-body').addEventListener('scroll', dexScroll, { passive: true });
    $$('#tabs button').forEach(b => b.onclick = () => { Audio8.play('click'); setTab(b.dataset.tab); });
    $$('[data-ico]').forEach(s => s.innerHTML = ico(s.dataset.ico, 24));
    $$('#tabs button').forEach(b => { b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', b.classList.contains('on')); });
    A11Y.label($('#btn-settings'), L('Ajustes', 'Settings')); A11Y.label($('#btn-map'), L('Mapa del mundo', 'World map')); A11Y.label($('#btn-tk'), L('Tickets de gacha', 'Gacha tickets'));
    A11Y.label($('#st-prev'), L('Etapa anterior', 'Previous stage')); A11Y.label($('#st-next'), L('Etapa siguiente', 'Next stage'));
    $('#chal-x').onclick = () => { Core.abortChal(); Audio8.play('swap'); };
    $('#i-coin').innerHTML = ico('coin', 24);
    $('#i-gem').innerHTML = ico('gem', 24);
    $('#btn-settings').innerHTML = ico('gear', 24);
    $('#btn-support').href = KOFI_URL; $('#btn-support').innerHTML = ico('cup', 22) + '<span>' + L('Apoyar', 'Support') + '</span>'; A11Y.label($('#btn-support'), L('Apoyar el proyecto en Ko-fi', 'Support the project on Ko-fi'));
    $('#btn-settings').onclick = settings;
    $('#btn-profile').onclick = () => { Audio8.play('click'); profileModal('game'); };
    $('#btn-keys').onclick = () => { Audio8.play('click'); keysModal(); };
    $('#btn-keys').innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1zm2 2v2h2V8H5zm4 0v2h2V8H9zm4 0v2h2V8h-2zm4 0v2h2V8h-2zM5 12v2h2v-2H5zm4 0v2h2v-2H9zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM7 15v2h10v-2H7z"/></svg>';
    A11Y.label($('#btn-keys'), L('Atajos de teclado', 'Keyboard shortcuts'));
    $('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
    $('#st-prev').onclick = () => { Core.goStage(S().stage - 1); S().auto = false; };
    $('#st-next').onclick = () => { Core.goStage(S().stage + 1); };
    $('#btn-boss').onclick = () => { Core.fightBoss(); };
    $('#btn-map').innerHTML = ico('boot', 24);
    $('#btn-map').onclick = () => { mapReg = -1; mapModal(); };
    $('#i-tk').innerHTML = ico('tkPoke', 24);
    $('#btn-tk').onclick = () => { Audio8.play('click'); setTab('gacha'); };
    applySettings();
    $('#skills').innerHTML = Object.entries(SKILLS).map(([id, k]) => `<button class="skill" id="sk-${id}" data-sk="${id}" title="${k.name}: ${k.desc}">${ico(k.icon, 24)}<i></i><small></small></button>`).join('');
    $$('#skills .skill').forEach(b => b.setAttribute('aria-label', SKILLS[b.dataset.sk].name + ': ' + SKILLS[b.dataset.sk].desc));
    $$('#skills .skill').forEach(b => b.onclick = e => { e.stopPropagation(); if (Core.useSkill(b.dataset.sk)) { Audio8.play(b.dataset.sk === 'rage' ? 'charge' : 'ticket'); banner(SKILLS[b.dataset.sk].name + '!', SKILLS[b.dataset.sk].desc, '#ff8040'); } });
  }

  return { show, title, starter, hud, refresh, setTab, profileModal, paintProf, keysModal, bind, banner, toast, openModal, closeModal, drawMonCv, drawPv, evolveAnim, rewText, rivalTalk, cue, tipsTick, welcomeModal, nameModal, authChanged, authPanel, rankingModal, tutStart, autoFill, monModal, mapModal };
})();
