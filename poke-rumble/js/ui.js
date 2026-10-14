// Menús, colección, HUD, modales y controles táctiles.
'use strict';

const UI = (() => {
  const $ = s => document.querySelector(s);
  const DEX = Sprites.DEX;
  const fmtTime = t => { t = Math.floor(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const typeChip = t => `<span class="type" style="background:${TYPE_COLORS[t]}">${TYPE_ES[t]}</span>`;
  const STARTERS = [1, 4, 7, 25, 133];

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('#scr-' + id).classList.add('active');
  }

  // ---------- sprites animados en menús ----------
  const anims = new Set();
  function animCanvas(cv, dex, shiny, anim) {
    cv.width = 96; cv.height = 96;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const o = { cv, g, dex, shiny, anim: anim || 'idle', t0: performance.now() };
    anims.add(o);
    Sprites.preload(dex, shiny);
    return o;
  }
  (function animLoop() {
    requestAnimationFrame(animLoop);
    for (const o of anims) {
      if (!o.cv.isConnected) { anims.delete(o); continue; }
      o.g.clearRect(0, 0, 96, 96);
      o.g.fillStyle = 'rgba(0,0,0,0.25)'; o.g.beginPath(); o.g.ellipse(48, 80, 22, 7, 0, 0, 6.3); o.g.fill();
      Sprites.draw(o.g, o.dex, o.shiny, o.anim, Math.PI / 2, (performance.now() - o.t0) / 1000, 48, 80, 2, {});
    }
  })();

  // ---------- título ----------
  function title() {
    show('title');
    const ids = [25, 1, 4, 7, 133, 94, 143, 6, 150, 151, 39, 52];
    $('#parade').innerHTML = ids.map(d => `<img class="px" src="${Sprites.portrait(d)}" title="${DEX[d].name}">`).join('');
    $('#btn-start').onclick = () => {
      Audio8.resume(); Audio8.play('item');
      if (!Object.keys(Save.d.collection).length) starter(); else menu();
    };
  }

  function starter() {
    show('starter');
    Audio8.music('menu');
    $('#starters').innerHTML = STARTERS.map(d => `<button class="starter" data-d="${d}"><img class="px" src="${Sprites.portrait(d)}"><b>${DEX[d].name}</b><div class="types">${DEX[d].types.map(typeChip).join('')}</div></button>`).join('');
    document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
      const d = +b.dataset.d;
      const m = Game.makeMon(d, 5);
      Save.addFriend(m);
      Save.d.leader = Save.keyOf(m);
      Save.save();
      Audio8.play('friend');
      toast('¡' + DEX[d].name + ' es tu compañero!');
      menu();
    });
  }

  // ---------- menú ----------
  function menu() {
    show('menu');
    Audio8.music('menu');
    const d = Save.d;
    if (!d.leader || !d.collection[d.leader]) d.leader = Object.keys(d.collection)[0];
    const L = d.collection[d.leader];
    $('#leader').innerHTML = `<canvas class="anim px"></canvas><div class="ln">${L.shiny ? '✨ ' : ''}${DEX[L.dex].name}</div>
      <div class="types">${DEX[L.dex].types.map(typeChip).join('')}</div>
      <div class="lp">${L.moves.map(m => MOVES[m].name).join(' · ')}</div><div class="lp">Pulsa para cambiar de líder</div>`;
    animCanvas($('#leader canvas'), L.dex, L.shiny);
    $('#leader').onclick = () => sub('dex');
    const st = d.stats;
    $('#mstats').innerHTML = `<div>Amigos<b>${Object.keys(d.collection).length}/${POKEDEX.length}</b></div><div>Mejor piso<b>${st.bestFloor}/${ZONES.length}</b></div><div>Victorias<b>${st.wins}</b></div><div>Shinies<b>${st.shinies}</b></div>`;
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      Audio8.play('step');
      if (b.dataset.go === 'play') return play();
      sub(b.dataset.go);
    });
  }

  function play() {
    show('game');
    resize();
    const L = Save.d.collection[Save.d.leader];
    Game.start(L);
    $('#touch').classList.toggle('hidden', !matchMedia('(pointer: coarse)').matches);
    hudFull();
  }

  // ---------- subpantallas ----------
  const SUBS = { dex: ['Colección', renderDex], help: ['Guía', renderHelp], settings: ['Ajustes', renderSettings] };
  function sub(id, arg) {
    show('sub');
    $('#sub-title').textContent = SUBS[id][0];
    $('#btn-back').onclick = () => { Audio8.play('step'); menu(); };
    SUBS[id][1]($('#sub-body'), arg);
    $('#sub-body').scrollTop = 0;
  }

  let dexFilter = 'all';
  function renderDex(body) {
    const d = Save.d;
    const own = {};
    for (const [k, c] of Object.entries(d.collection)) { (own[c.dex] = own[c.dex] || []).push(k); }
    let list = POKEDEX.slice();
    if (dexFilter === 'own') list = list.filter(p => own[p.dex]);
    if (dexFilter === 'miss') list = list.filter(p => !own[p.dex]);
    body.innerHTML = `<div class="filters">${[['all', 'Todos'], ['own', 'Tengo'], ['miss', 'Me faltan']].map(([k, n]) => `<button class="tab ${dexFilter === k ? 'on' : ''}" data-f="${k}">${n}</button>`).join('')}
      <span class="count">${Object.keys(own).length} / ${POKEDEX.length} · vistos ${Object.keys(d.seen).length}</span></div>
      <div class="dex-grid">${list.map(p => {
        const o = own[p.dex], seen = d.seen[p.dex];
        const cls = o ? 'own' : seen ? 'seen' : 'unseen';
        const isL = o && o.includes(d.leader);
        return `<button class="dc ${cls}" data-dex="${p.dex}">${isL ? '<span class="ld">★</span>' : ''}${o && o.some(k => k.endsWith('s')) ? '<span class="sh">✨</span>' : ''}
          <img class="px" src="${Sprites.portrait(p.dex)}" loading="lazy"><small>#${String(p.dex).padStart(3, '0')}</small><span>${seen || o ? p.name : '???'}</span></button>`;
      }).join('')}</div>`;
    body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { dexFilter = b.dataset.f; renderDex(body); });
    body.querySelectorAll('[data-dex]').forEach(b => b.onclick = () => { const dex = +b.dataset.dex; if (own[dex] || d.seen[dex]) detail(body, dex); });
  }

  function detail(body, dex, prefer) {
    const d = Save.d, p = DEX[dex];
    const keys = Object.keys(d.collection).filter(k => d.collection[k].dex === dex);
    const k = prefer && keys.includes(prefer) ? prefer : keys[0];
    const c = k ? d.collection[k] : null;
    const s = p.stats;
    const bar = (n, v) => `<div class="srow"><span>${n}</span><div class="sb"><i style="width:${Math.min(100, v / 1.6)}%"></i></div><b>${v}</b></div>`;
    const evoTo = POKEDEX.filter(q => q.evo === dex).map(q => q.name);
    const el = Game.evoLevel(dex);
    body.innerHTML = `<button class="btn small" id="d-back">Volver a la colección</button>
      <div class="detail" style="margin-top:12px">
        <div class="big"><canvas class="anim px"></canvas>${keys.length > 1 ? `<div class="filters">${keys.map(x => `<button class="tab ${x === k ? 'on' : ''}" data-k="${x}">${x.endsWith('s') ? '✨ Shiny' : 'Normal'}</button>`).join('')}</div>` : ''}
          <div class="types">${p.types.map(typeChip).join('')}</div>
          ${c ? `<div class="count">Poder ${c.power} · amigos conseguidos: ${c.count}</div>` : '<div class="count">Visto, pero todavía no es tu amigo</div>'}</div>
        <div><h3>${c && c.shiny ? '✨ ' : ''}${p.name} <small class="count">#${String(dex).padStart(3, '0')}</small></h3>
          ${bar('PS', s.hp)}${bar('Ataque', s.atk)}${bar('Defensa', s.def)}${bar('At. Esp.', s.spa)}${bar('Def. Esp.', s.spd)}${bar('Velocidad', s.spe)}
          ${evoTo.length ? `<div class="count" style="margin-top:6px">Evoluciona a ${evoTo.join(' / ')} al nivel ${el} durante una aventura.</div>` : ''}
          ${c ? `<div class="moves">${c.moves.map((m, i) => { const mv = MOVES[m]; return `<div class="mv" style="--mc:${TYPE_COLORS[mv.type]}"><div><b>${i === 0 ? 'Ataque' : 'Especial'}: ${mv.name}</b><br><small>${TYPE_ES[mv.type]} · ${CLASS_ES[mv.cls]} · Potencia ${mv.pow} · ${mv.cat === 'f' ? 'Físico' : 'Especial'}</small></div></div>`; }).join('')}</div>
          <div class="actions" style="justify-content:flex-start">${d.leader === k ? '<b style="color:var(--yellow)">★ Es tu líder</b>' : '<button class="btn primary" id="d-lead">Elegir como líder</button>'}</div>` : ''}
        </div></div>`;
    if (c) animCanvas(body.querySelector('canvas'), dex, c.shiny);
    else animCanvas(body.querySelector('canvas'), dex, false);
    $('#d-back').onclick = () => renderDex(body);
    body.querySelectorAll('[data-k]').forEach(b => b.onclick = () => detail(body, dex, b.dataset.k));
    if ($('#d-lead')) $('#d-lead').onclick = () => { d.leader = k; Save.save(); Audio8.play('friend'); toast('¡' + p.name + ' es tu líder!'); detail(body, dex, k); };
  }

  function renderHelp(body) {
    body.innerHTML = `<div class="help">
      <p><b>PokéMazmorra</b> es un roguelike de salas al estilo de Pokémon Rumble y The Binding of Isaac. Entras con tu Pokémon líder y bajas por 6 pisos llenos de Pokémon salvajes hasta el jefe final.</p>
      <h3>Controles</h3>
      <p>En PC: muévete con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, ataca en una dirección con las <kbd>flechas</kbd> o con el ratón (clic izquierdo), y usa la técnica especial con <kbd>ESPACIO</kbd> o el clic derecho. Cambia de Pokémon con <kbd>1</kbd>–<kbd>6</kbd> o <kbd>Q</kbd>/<kbd>E</kbd>. Pausa con <kbd>Esc</kbd>.</p>
      <p>En móvil: el joystick izquierdo mueve y el derecho apunta y ataca. El botón <b>B</b> lanza la técnica especial y <b>⇄</b> cambia de Pokémon.</p>
      <h3>Salas</h3>
      <p>Las puertas se cierran hasta que derrotas a todos los Pokémon de la sala. En el minimapa verás las salas especiales: <b style="color:#ffd23f">tesoro</b> (un objeto gratis), <b style="color:#4aa8ff">tienda</b> (gasta tus ₽), <b style="color:#ff80c0">Centro Pokémon</b> (cura y revive a tu equipo) y <b style="color:#ff5050">jefe</b>. Al vencer al jefe aparece la escalera al siguiente piso.</p>
      <h3>Amigos (como en Pokémon Rumble)</h3>
      <p>Los Pokémon que derrotas a veces <b>quieren ser tus amigos</b>: recoge el Pokémon que aparece con un ♥. Se une a tu equipo de la aventura (hasta 6) y se queda para siempre en tu colección, con sus técnicas. Si tu Pokémon se debilita, sale el siguiente del equipo. Si caen todos, termina la aventura.</p>
      <p>Cada Pokémon tiene un ataque principal y una técnica especial según su tipo. Hazte amigo del mismo Pokémon varias veces para encontrar mejores técnicas. Los shiny salen muy de vez en cuando… y siempre se hacen tus amigos.</p>
      <h3>Niveles, tipos y evoluciones</h3>
      <p>Tus Pokémon ganan experiencia, suben de nivel y <b>evolucionan</b> durante la aventura. Los tipos importan: un ataque de Agua es muy eficaz contra un Pokémon de Fuego. Las técnicas de tu mismo tipo hacen un 50% más de daño.</p>
      <h3>Objetos</h3>
      <div class="itemlist">${Object.entries(ITEMS).map(([id, i]) => `<div>${Icons.html(Icons.item(id), 24)} <b>${i.name}</b>: ${i.desc}</div>`).join('')}</div>
      <h3>Pisos</h3>
      <p>${ZONES.map((z, i) => `${i + 1}. ${z.name} (${z.types.map(t => TYPE_ES[t]).join(', ')}) · Jefe: ${DEX[z.boss].name}`).join('<br>')}</p>
    </div>`;
  }

  function renderSettings(body) {
    const s = Save.d.settings;
    body.innerHTML = `<div class="help">
      <h3>Sonido</h3><div class="sliders">Música <input type="range" min="0" max="1" step="0.05" id="s-m" value="${s.music}"> Efectos <input type="range" min="0" max="1" step="0.05" id="s-s" value="${s.sfx}"></div>
      <h3>Pantalla</h3><div class="sliders"><label><input type="checkbox" id="s-d" ${s.dmgNums ? 'checked' : ''}> Números de daño</label><label><input type="checkbox" id="s-k" ${s.shake ? 'checked' : ''}> Temblor</label></div>
      <h3>Partida</h3><p>Tu colección se guarda en este navegador.</p><button class="btn danger" id="s-r">Borrar partida</button>
      <h3>Créditos</h3><p>Sprites y retratos de <a href="https://github.com/PMDCollab/SpriteCollab" target="_blank">PMD SpriteCollab</a> y sus artistas (CC BY-NC 4.0); lista completa en <a href="CREDITS.md" target="_blank">CREDITS.md</a>. Datos de <a href="https://pokeapi.co" target="_blank">PokéAPI</a>. Música y sonidos originales. Proyecto de fans sin ánimo de lucro, sin relación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company.</p>
    </div>`;
    $('#s-m').oninput = e => { s.music = +e.target.value; Audio8.setVolumes(); Save.save(); };
    $('#s-s').oninput = e => { s.sfx = +e.target.value; Audio8.setVolumes(); Save.save(); Audio8.play('coin'); };
    $('#s-d').onchange = e => { s.dmgNums = e.target.checked; Save.save(); };
    $('#s-k').onchange = e => { s.shake = e.target.checked; Save.save(); };
    $('#s-r').onclick = () => modal(`<h2>¿Borrar la partida?</h2><p class="sub">Perderás toda tu colección.</p><div class="actions"><button class="btn danger" id="r-y">Borrar</button><button class="btn" id="r-n">Cancelar</button></div>`, () => {
      $('#r-y').onclick = () => { closeModal(); Save.reset(); title(); };
      $('#r-n').onclick = closeModal;
    });
  }

  // ---------- modales ----------
  function modal(html, after) { $('#modal-box').innerHTML = html; $('#modal').classList.remove('hidden'); if (after) after(); }
  function closeModal() { $('#modal').classList.add('hidden'); $('#modal-box').innerHTML = ''; }
  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2400); }

  let bannerT = 0;
  function banner(title, sub, color) {
    const b = $('#banner');
    b.querySelector('b').textContent = title;
    b.querySelector('small').textContent = sub || '';
    b.style.setProperty('--bc', color || 'var(--yellow)');
    b.classList.remove('hidden');
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(bannerT);
    bannerT = setTimeout(() => b.classList.add('hidden'), 2800);
  }

  function togglePause() {
    const G = Game.state;
    if (!G || G.over) return;
    if (!$('#modal').classList.contains('hidden')) { if (G.paused) { closeModal(); Game.pause(false); } return; }
    Game.pause(true);
    modal(`<h2>Pausa</h2><p class="sub">WASD moverse · flechas o ratón atacar · ESPACIO especial · 1–6 / Q / E cambiar · Esc pausa</p>
      <div class="actions"><button class="btn primary" id="p-c">Continuar</button><button class="btn" id="p-m">${Save.d.settings.music > 0 ? 'Silenciar' : 'Activar sonido'}</button><button class="btn danger" id="p-q">Abandonar</button></div>`, () => {
      $('#p-c').onclick = () => { closeModal(); Game.pause(false); };
      $('#p-m').onclick = () => { const s = Save.d.settings; if (s.music > 0 || s.sfx > 0) { s._m = s.music; s._s = s.sfx; s.music = s.sfx = 0; } else { s.music = s._m || 0.4; s.sfx = s._s || 0.7; } Audio8.setVolumes(); Save.save(); closeModal(); Game.pause(false); };
      $('#p-q').onclick = () => { closeModal(); Game.pause(false); G.over = true; Audio8.music(null); runOver({ won: false, quit: true, floor: G.floor + 1, zone: G.zone.name, kills: G.kills, time: G.t, friends: G.friends.slice(), party: G.party.slice() }); };
    });
  }

  function evolveChoice(m, kids, finish) {
    modal(`<h2>¡${DEX[m.dex].name} quiere evolucionar!</h2><p class="sub">Elige en qué Pokémon se convierte</p>
      <div class="starter-grid">${kids.map(k => `<button class="starter" data-e="${k}"><img class="px" src="${Sprites.portrait(k, m.shiny)}"><b>${DEX[k].name}</b><div class="types">${DEX[k].types.map(typeChip).join('')}</div></button>`).join('')}</div>`, () => {
      document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { closeModal(); finish(+b.dataset.e); });
    });
  }

  function runOver(r) {
    const G = Game.state;
    Game.stop();
    modal(`<h2>${r.won ? '¡Has completado la mazmorra!' : r.quit ? 'Aventura abandonada' : 'Tu equipo se ha debilitado…'}</h2>
      <p class="sub">${r.won ? '¡Eres un auténtico maestro de las mazmorras!' : 'Has llegado al piso ' + r.floor + ': ' + r.zone}</p>
      <div class="rgrid"><div>Piso<b>${r.floor}/${ZONES.length}</b></div><div>Pokémon derrotados<b>${r.kills}</b></div><div>Tiempo<b>${fmtTime(r.time)}</b></div><div>Amigos nuevos<b>${r.friends.length}</b></div></div>
      ${r.friends.length ? `<p class="sub">Se han unido a tu colección:</p><div class="friends">${r.friends.map(f => `<div><img class="px" src="${Sprites.portrait(f.dex, f.shiny)}">${f.shiny ? '✨' : ''}${DEX[f.dex].name}</div>`).join('')}</div>` : ''}
      <div class="actions"><button class="btn primary" id="r-again">Otra aventura</button><button class="btn" id="r-menu">Menú</button></div>`, () => {
      $('#r-again').onclick = () => { closeModal(); play(); };
      $('#r-menu').onclick = () => { closeModal(); menu(); };
    });
    void G;
  }

  // ---------- HUD ----------
  const cache = {};
  const set = (id, prop, v) => { const k = id + prop; if (cache[k] === v) return; cache[k] = v; const el = document.getElementById(id); if (!el) return; if (prop === 'w') el.style.width = v; else if (prop === 'text') el.textContent = v; else if (prop === 'src') el.src = v; else el.innerHTML = v; };
  function hudFull() { for (const k of Object.keys(cache)) delete cache[k]; }
  function hud(G) {
    if (!G) return;
    const m = G.party[G.active];
    const mh = Game.maxHp(m, G.items);
    set('h-por', 'src', Sprites.portrait(m.dex, m.shiny));
    set('h-name', 'text', (m.shiny ? '✨ ' : '') + DEX[m.dex].name);
    set('h-lv', 'text', 'Nv. ' + m.lvl);
    const k = Math.max(0, m.hp / mh);
    set('h-hp', 'w', (k * 100).toFixed(1) + '%');
    const hpEl = document.getElementById('h-hp');
    if (hpEl) hpEl.style.background = k > 0.5 ? 'var(--green)' : k > 0.2 ? 'var(--yellow)' : 'var(--red)';
    set('h-hptxt', 'text', Math.max(0, Math.ceil(m.hp)) + '/' + mh);
    const e0 = Math.round(m.lvl ** 3 * 0.8), e1 = Math.round((m.lvl + 1) ** 3 * 0.8);
    set('h-xp', 'w', Math.min(100, (m.exp - e0) / (e1 - e0) * 100).toFixed(1) + '%');
    const st = G.p.status;
    set('h-status', 'html', Object.keys(st).filter(s => st[s] > 0 && s !== 'slow').map(s => `<i>${STATUS_ES[s]}</i>`).join(''));
    // equipo
    const ps = G.party.map((q, i) => `${i}${q.dex}${q.shiny}${q.fainted}${Math.round(q.hp / Game.maxHp(q, G.items) * 10)}${i === G.active}`).join('|');
    if (cache.party !== ps) {
      cache.party = ps;
      $('#h-party').innerHTML = G.party.map((q, i) => `<button class="ps ${i === G.active ? 'on' : ''} ${q.fainted ? 'ko' : ''}" data-i="${i}" title="${DEX[q.dex].name} Nv. ${q.lvl}"><em>${i + 1}</em><img class="px" src="${Sprites.portrait(q.dex, q.shiny)}"><i><b style="width:${Math.max(0, q.hp / Game.maxHp(q, G.items) * 100)}%"></b></i></button>`).join('');
      $('#h-party').querySelectorAll('[data-i]').forEach(b => b.onpointerdown = ev => { ev.stopPropagation(); Game.swapTo(+b.dataset.i); });
    }
    // técnicas
    const ms = m.moves.join() + G.active;
    if (cache.moves !== ms) {
      cache.moves = ms;
      $('#h-moves').innerHTML = m.moves.map((id, i) => { const mv = MOVES[id]; return `<div class="hm" style="--mc:${TYPE_COLORS[mv.type]}"><i class="cd" id="cd${i}"></i><b>${mv.name}</b><small>${i === 0 ? 'Flechas / clic' : 'ESPACIO / B'} · ${TYPE_ES[mv.type]}</small></div>`; }).join('');
    }
    const cdMul = Math.pow(0.8, G.items.garra_rapida || 0) * Math.pow(0.9, G.items.pp_max || 0);
    const c0 = Math.max(0, G.p.cdA / (MOVES[m.moves[0]].cd * cdMul)), c1 = Math.max(0, G.p.cdB / (MOVES[m.moves[1]].cd * cdMul * 1.4));
    set('cd0', 'w', (Math.min(1, c0) * 100).toFixed(0) + '%');
    set('cd1', 'w', (Math.min(1, c1) * 100).toFixed(0) + '%');
    set('h-coins', 'text', G.coins);
    set('h-floor', 'text', 'Piso ' + (G.floor + 1) + ' · ' + G.zone.name);
    const it = Object.entries(G.items).map(([id, n]) => id + n).join();
    if (cache.items !== it) {
      cache.items = it;
      $('#h-items').innerHTML = Object.entries(G.items).map(([id, n]) => `<span title="${ITEMS[id].name}: ${ITEMS[id].desc}">${Icons.html(Icons.item(id), 24)}${n > 1 ? '<em>' + n + '</em>' : ''}</span>`).join('');
    }
    const boss = G.enemies.find(e => e.boss && !e.dead);
    document.getElementById('h-boss').classList.toggle('hidden', !boss);
    if (boss) { set('h-bossname', 'text', (boss.mon.shiny ? '✨ ' : '') + DEX[boss.mon.dex].name + ' · Nv. ' + boss.mon.lvl); set('h-bosshp', 'w', Math.max(0, boss.mon.hp / boss.maxHp * 100).toFixed(1) + '%'); }
    minimap(G);
  }

  function minimap(G) {
    const key = G.room.key + Object.values(G.dun.rooms).map(r => (r.seen ? 1 : 0) + (r.visited ? 2 : 0) + (r.cleared ? 4 : 0)).join('');
    if (cache.mini === key) return;
    cache.mini = key;
    const c = $('#minimap'), g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    const cw = 9, ch = 7, ox = (c.width - Dungeon.GW * (cw + 1)) / 2, oy = (c.height - Dungeon.GH * (ch + 1)) / 2;
    for (const r of Object.values(G.dun.rooms)) {
      if (!r.seen) continue;
      const x = ox + r.x * (cw + 1), y = oy + r.y * (ch + 1);
      g.fillStyle = r === G.room ? '#ffffff' : r.visited ? '#8a9ad0' : '#3a4a7a';
      g.fillRect(x, y, cw, ch);
      const icon = { boss: '#ff4040', treasure: '#ffd23f', shop: '#4aa8ff', heal: '#ff80c0' }[r.type];
      if (icon) { g.fillStyle = icon; g.fillRect(x + 3, y + 2, 3, 3); }
    }
  }

  // ---------- escalado y controles táctiles ----------
  function resize() {
    const st = $('#stage');
    const w = window.innerWidth, h = window.innerHeight;
    const k = Math.min(w / VIEW_W, h / VIEW_H);
    st.style.width = Math.floor(VIEW_W * k) + 'px';
    st.style.height = Math.floor(VIEW_H * k) + 'px';
    $('#hud').style.fontSize = Math.max(11, Math.min(16, k * 4.6)) + 'px';
  }
  window.addEventListener('resize', resize);

  function bindTouch() {
    const stick = (el, target) => {
      let id = null, cx = 0, cy = 0;
      const knob = el.querySelector('i');
      const upd = (x, y) => {
        let dx = x - cx, dy = y - cy; const l = Math.hypot(dx, dy), max = 40;
        if (l > max) { dx = dx / l * max; dy = dy / l * max; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        target.x = dx / max; target.y = dy / max; target.on = true;
      };
      el.addEventListener('pointerdown', e => { id = e.pointerId; const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; el.setPointerCapture(id); upd(e.clientX, e.clientY); });
      el.addEventListener('pointermove', e => { if (e.pointerId === id) upd(e.clientX, e.clientY); });
      const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; target.on = false; target.x = target.y = 0; };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    };
    stick($('#stick-move'), Game.sticks.move);
    stick($('#stick-aim'), Game.sticks.aim);
    const b = $('#t-b');
    b.addEventListener('pointerdown', () => { Game.sticks.b = true; });
    b.addEventListener('pointerup', () => { Game.sticks.b = false; });
    b.addEventListener('pointercancel', () => { Game.sticks.b = false; });
    $('#t-sw').addEventListener('pointerdown', () => Game.cycle(1));
    $('#btn-pause').onclick = togglePause;
  }

  return { title, menu, banner, hud, hudFull, evolveChoice, runOver, togglePause, toast, bindTouch, resize };
})();
