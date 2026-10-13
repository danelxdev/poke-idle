// Interfaz: menús, colección, mejoras, misiones, HUD y modales.
'use strict';

const UI = (() => {
  const $ = s => document.querySelector(s);
  const fmt = n => Math.floor(n).toLocaleString('es');
  const fmtTime = t => { t = Math.floor(t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  const fmtPL = n => n >= 1e12 ? (n / 1e12).toFixed(1) + ' billones' : n >= 1e9 ? (n / 1e9).toFixed(1) + ' mil millones' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' millones' : fmt(n);
  let current = 'title';
  let modalOpts = {};

  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $('#scr-' + id).classList.add('active');
    current = id;
  }

  // ---------- iconos de técnicas ----------
  const iconCache = {};
  function moveIcon(id) {
    if (iconCache[id]) return iconCache[id];
    const m = MOVES[id], c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w || 1, h || 1); };
    const col = m.color, wh = '#ffffff', dk = '#1a1030';
    const ball = (x, y, r) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r) P(x + xx, y + yy, 1, 1, col); P(x - Math.floor(r / 2), y - Math.floor(r / 2), Math.max(1, Math.floor(r / 2) + 1), Math.max(1, Math.floor(r / 2) + 1), wh); };
    switch (m.cls) {
      case 'melee': P(4, 4, 8, 7, dk); P(5, 5, 6, 5, col); P(5, 5, 6, 1, wh); P(4, 11, 6, 3, dk); P(5, 11, 4, 2, '#f5c08f'); for (let i = 0; i < 3; i++) P(12 + (i % 2), 3 + i * 3, 3, 1, wh); break;
      case 'dash': for (let i = 0; i < 4; i++) P(1, 3 + i * 3, 8 - i, 1, col); P(9, 5, 5, 6, dk); P(10, 6, 3, 4, col); break;
      case 'proj': P(1, 7, 7, 2, col); ball(10, 8, 3); break;
      case 'fan': ball(4, 8, 2); ball(11, 3, 2); ball(12, 8, 2); ball(11, 13, 2); break;
      case 'burst': for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; P(Math.round(7.5 + Math.cos(a) * 6), Math.round(7.5 + Math.sin(a) * 6), 2, 2, col); } P(7, 7, 2, 2, wh); break;
      case 'beam': ball(3, 8, 3); P(4, 5, 12, 6, col); P(4, 7, 12, 2, wh); break;
      case 'orbit': ball(8, 8, 2); ball(3, 4, 2); ball(13, 6, 2); ball(7, 14, 1); break;
      case 'aura': for (let i = 0; i < 24; i++) { const a = i / 24 * 6.28; P(Math.round(7.5 + Math.cos(a) * 6), Math.round(7.5 + Math.sin(a) * 6), 1, 1, col); } P(6, 5, 4, 6, dk); P(7, 6, 2, 4, '#f5c08f'); break;
      case 'boomerang': P(2, 6, 12, 4, col); P(5, 4, 6, 8, col); P(6, 7, 4, 2, wh); break;
      case 'chain': { let x = 2, y = 2; for (let i = 0; i < 6; i++) { P(x, y, 3, 2, col); x += (i % 2 ? -1 : 3); y += 2; } P(8, 13, 2, 2, wh); break; }
      case 'meteor': for (let i = 0; i < 3; i++) P(2 + i * 2, 1 + i * 2, 2, 2, col); ball(10, 10, 3); break;
      case 'mines': ball(5, 10, 2); ball(11, 6, 2); P(2, 14, 12, 1, dk); break;
      case 'trail': for (let i = 0; i < 4; i++) P(2 + i * 3, 12 - i * 3, 3, 3, col); P(12, 2, 2, 2, wh); break;
      case 'turret': P(5, 2, 6, 5, '#f5c08f'); P(4, 7, 8, 6, col); P(5, 13, 2, 2, dk); P(9, 13, 2, 2, dk); P(12, 8, 3, 1, wh); break;
      case 'bomb': ball(8, 9, 5); P(3, 1, 1, 2, wh); P(13, 2, 1, 2, wh); P(8, 1, 1, 2, wh); break;
      case 'flash': P(7, 1, 2, 14, col); P(1, 7, 14, 2, col); P(3, 3, 2, 2, col); P(11, 11, 2, 2, col); P(11, 3, 2, 2, col); P(3, 11, 2, 2, col); P(6, 6, 4, 4, wh); break;
      case 'buff': P(6, 6, 4, 9, col); P(3, 6, 10, 1, col); P(4, 5, 8, 1, col); P(5, 4, 6, 1, col); P(6, 3, 4, 1, col); P(7, 2, 2, 1, col); P(7, 7, 2, 6, wh); break;
      default: ball(8, 8, 4);
    }
    // contorno
    const img = g.getImageData(0, 0, 16, 16), a = (x, y) => (x < 0 || y < 0 || x > 15 || y > 15) ? 0 : img.data[(y * 16 + x) * 4 + 3];
    g.fillStyle = '#05050f';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) g.fillRect(x, y, 1, 1);
    iconCache[id] = c.toDataURL();
    return iconCache[id];
  }

  function charImg(c, shiny, form) { return PX.dataURL(c.look, form || null, shiny, c.id); }

  // ---------- recursos ----------
  function refreshRes() {
    const d = Save.d;
    $('#m-zeni').textContent = fmt(d.zeni);
    $('#m-t1').textContent = d.tickets.t1;
    $('#m-t10').textContent = d.tickets.t10;
    document.querySelectorAll('.s-zeni').forEach(e => (e.textContent = fmt(d.zeni)));
    document.querySelectorAll('.s-t1').forEach(e => (e.textContent = d.tickets.t1));
    document.querySelectorAll('.s-t10').forEach(e => (e.textContent = d.tickets.t10));
    $('#m-balls').innerHTML = [1, 2, 3, 4, 5, 6, 7].map(n => `<img class="px" src="${PX.dragonBall(n, !d.balls.includes(n))}">`).join('');
    $('#btn-shenron').classList.toggle('hidden', d.balls.length < 7);
    const pending = Save.pendingAch().length + [...(d.missions.daily || []), ...(d.missions.weekly || [])].filter(m => !m.claimed && m.prog >= m.goal).length;
    $('#m-dot').classList.toggle('hidden', !pending);
  }

  // ---------- título ----------
  function title() {
    show('title');
    const ids = ['goku_kid', 'vegeta_s', 'piccolo', 'frieza_final', 'cell_perfect', 'kidbuu', 'goku_ssj4', 'beerus', 'jiren', 'gohan_beast'];
    $('#title-sprites').innerHTML = ids.map(id => `<img class="px" src="${charImg(CHAR_BY[id])}">`).join('');
    $('#btn-start').onclick = () => {
      Audio8.resume();
      Audio8.play('select');
      if (!Save.d.partner) quiz(); else menu();
    };
  }

  // ---------- quiz de personalidad ----------
  function quiz() {
    show('quiz');
    Audio8.music('menu');
    const score = {};
    let qi = 0;
    const step = () => {
      if (qi >= QUIZ.length) return result();
      const q = QUIZ[qi];
      $('#quiz-title').textContent = 'Pregunta ' + (qi + 1) + ' de ' + QUIZ.length;
      $('#quiz-body').innerHTML = `<div class="quiz-q">${q.q}</div><div class="quiz-a">${q.a.map((a, i) => `<button class="btn" data-i="${i}">${a[0]}</button>`).join('')}</div>`;
      $('#quiz-body').querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const id = q.a[+b.dataset.i][1];
        score[id] = (score[id] || 0) + 1;
        qi++; Audio8.play('click'); step();
      });
    };
    const result = () => {
      const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
      const c = CHAR_BY[best];
      $('#quiz-title').textContent = 'Tu personalidad es…';
      $('#quiz-body').innerHTML = `<div class="quiz-result">
          <div class="quiz-q">${PERSONALITIES[best]}</div>
          <img class="px" src="${charImg(c)}">
          <div style="font-size:20px;margin:10px 0">Tu compañero: <b style="color:var(--yellow)">${c.name}</b></div>
          <div class="modal-actions"><button class="btn primary" id="q-ok">¡Vamos juntos!</button><button class="btn" id="q-other">Elegir otro</button></div>
        </div>`;
      $('#q-ok').onclick = () => pickStarter(best, PERSONALITIES[best]);
      $('#q-other').onclick = () => starters(PERSONALITIES[best]);
      Audio8.play('rare');
    };
    step();
  }
  function starters(pers) {
    const list = CHARS.filter(c => c.starter);
    $('#quiz-title').textContent = 'Elige a tu compañero';
    $('#quiz-body').innerHTML = `<div style="font-size:16px;color:var(--dim)">Los iniciales de las primeras sagas.</div>
      <div class="starter-grid">${list.map(c => `<div class="ccard" style="--rc:${RARITY[c.r].color}" data-id="${c.id}"><img class="px" src="${charImg(c)}"><div class="cn">${c.name}</div><small style="font-size:12px;color:var(--dim)">${MOVES[c.move].name}</small></div>`).join('')}</div>`;
    $('#quiz-body').querySelectorAll('[data-id]').forEach(b => b.onclick = () => pickStarter(b.dataset.id, pers));
  }
  function pickStarter(id, pers) {
    const d = Save.d;
    Save.addChar(id, false);
    d.partner = id; d.starter = id; d.personality = pers;
    Save.save();
    Audio8.play('legend');
    menu();
    toast('¡' + CHAR_BY[id].name + ' es ahora tu compañero!');
  }

  // ---------- menú principal ----------
  function menu() {
    show('menu');
    Audio8.music('menu');
    Save.refreshMissions();
    const d = Save.d, c = CHAR_BY[d.partner];
    $('#m-partner').innerHTML = `<img class="px" src="${charImg(c, d.partnerShiny)}"><div class="pn" style="color:${RARITY[c.r].color}">${d.partnerShiny ? '✨ ' : ''}${c.name}</div>
      <div class="pp">${MOVES[c.move].name} · ${RARITY[c.r].name}</div><div class="pp" style="font-size:13px">Récord: ${fmtTime(d.stats.bestTime)}</div>`;
    $('#m-partner').onclick = () => sub('collection', c.id);
    refreshRes();
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      Audio8.play('click');
      const go = b.dataset.go;
      if (go === 'play') return play();
      sub(go);
    });
    $('#btn-shenron').onclick = shenron;
    if (d.daily.last !== Save.dayKey()) setTimeout(daily, 300);
  }

  function play() {
    const d = Save.d;
    show('game');
    Game.start(d.partner, d.partnerShiny && !!d.shiny[d.partner]);
    if (window.matchMedia('(pointer: coarse)').matches && window.innerHeight > window.innerWidth) {
      const h = document.createElement('div');
      h.className = 'rot-hint'; h.textContent = '📱 Gira el móvil: se juega mejor en horizontal';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 4000);
    }
  }

  // ---------- subpantallas ----------
  const SUBS = {
    collection: { title: 'Guerreros', render: renderCollection },
    upgrades: { title: 'Mejoras', render: renderUpgrades },
    gacha: { title: 'Cápsulas', render: b => Gacha.render(b) },
    missions: { title: 'Misiones', render: renderMissions },
    ranking: { title: 'Ranking · tiempo aguantado', render: renderRanking },
    settings: { title: 'Ajustes', render: renderSettings },
    help: { title: 'Guía', render: renderHelp },
  };
  let subState = {};
  function sub(id, arg) {
    show('sub');
    $('#sub-title').textContent = SUBS[id].title;
    $('#btn-back').onclick = () => { Audio8.play('click'); menu(); };
    subState.id = id;
    if (arg) subState.arg = arg;
    refreshRes();
    SUBS[id].render($('#sub-body'), arg);
    $('#sub-body').scrollTop = 0;
  }

  // ---------- colección ----------
  let colFilter = { own: 'all', saga: 'all', rar: 'all' };
  function renderCollection(body, focusId) {
    const d = Save.d;
    if (focusId) return renderDetail(body, focusId);
    let list = CHARS.slice();
    if (colFilter.own === 'own') list = list.filter(c => d.owned[c.id]);
    if (colFilter.own === 'miss') list = list.filter(c => !d.owned[c.id]);
    if (colFilter.saga !== 'all') list = list.filter(c => c.saga === +colFilter.saga);
    if (colFilter.rar !== 'all') list = list.filter(c => c.r === +colFilter.rar);
    const ownN = Object.keys(d.owned).length;
    const totalPL = Object.keys(d.owned).reduce((a, id) => a + CHAR_BY[id].pl, 0);
    body.innerHTML = `
      <div class="filters">
        <div class="tabs" style="margin:0">${[['all', 'Todos'], ['own', 'Tengo'], ['miss', 'Me faltan']].map(([k, n]) => `<button class="tab ${colFilter.own === k ? 'on' : ''}" data-own="${k}">${n}</button>`).join('')}</div>
        <select id="f-saga"><option value="all">Todas las sagas</option>${SAGAS.map(s => `<option value="${s.id}" ${colFilter.saga == s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
        <select id="f-rar"><option value="all">Todas las rarezas</option>${[5, 4, 3, 2, 1].map(r => `<option value="${r}" ${colFilter.rar == r ? 'selected' : ''}>${RARITY[r].name}</option>`).join('')}</select>
        <span class="count">${ownN} / ${CHARS.length} · ✨ ${Object.keys(d.shiny).length}</span>
        <span class="scouter">Rastreador: poder total ${fmtPL(totalPL)}</span>
      </div>
      <div class="char-grid">${list.length ? list.map(c => {
        const own = d.owned[c.id];
        return `<div class="ccard ${own ? '' : 'locked'}" style="--rc:${RARITY[c.r].color}" data-id="${c.id}">
          ${d.partner === c.id ? '<span class="pt">★</span>' : ''}${d.shiny[c.id] ? '<span class="sh">✨</span>' : ''}
          <img class="px" src="${own ? charImg(c) : PX.silhouette(c.look, c.id)}">
          <div class="cn">${own ? c.name : '???'}</div><div class="rbar"></div></div>`;
      }).join('') : '<div style="font-size:16px;color:var(--dim)">Ninguno con este filtro.</div>'}</div>`;
    body.querySelectorAll('[data-own]').forEach(b => b.onclick = () => { colFilter.own = b.dataset.own; renderCollection(body); });
    $('#f-saga').onchange = e => { colFilter.saga = e.target.value; renderCollection(body); };
    $('#f-rar').onchange = e => { colFilter.rar = e.target.value; renderCollection(body); };
    body.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { Audio8.play('click'); renderDetail(body, b.dataset.id); body.scrollTop = 0; });
  }

  function renderDetail(body, id) {
    const d = Save.d, c = CHAR_BY[id], own = !!d.owned[id], sh = !!d.shiny[id];
    const r = RARITY[c.r];
    const showSh = sh && subState.viewShiny === id;
    const unlocked = 1 + Save.formsUnlocked(id);
    const mv = MOVES[c.move];
    body.innerHTML = `
      <button class="btn small" id="d-back">◀ Colección</button>
      <div class="detail" style="margin-top:14px;--rc:${r.color}">
        <div class="big">
          <img class="px" src="${own ? charImg(c, showSh) : PX.silhouette(c.look, c.id)}">
          ${sh ? `<button class="btn small" id="d-sh">${showSh ? 'Ver normal' : '✨ Ver shiny'}</button>` : ''}
          <div class="scouter">Nivel de poder: ${own ? fmtPL(c.pl) : '???'}${own && c.pl > 9000 && c.pl < 1e6 ? '<br>¡Es de más de 8.000!' : ''}</div>
        </div>
        <div>
          <h3 style="color:${r.color}">${own ? c.name : '???'}</h3>
          <div><span class="chip" style="--rc:${r.color}">${r.name}</span><span class="chip" style="--rc:#9aa6d8">${SAGAS[c.saga].name}</span>${c.saiyan ? '<span class="chip" style="--rc:#ffb060">Saiyan</span>' : ''}${sh ? '<span class="chip" style="--rc:var(--gold)">✨ Shiny</span>' : ''}</div>
          <div style="margin-top:12px">
            <div class="stat-row"><span>Vida</span><div class="sb"><i style="width:${c.hp / 1.6}%"></i></div><b>${c.hp}</b></div>
            <div class="stat-row"><span>Ataque</span><div class="sb"><i style="width:${c.atk / 1.6 * 100}%;background:var(--red)"></i></div><b>×${c.atk}</b></div>
            <div class="stat-row"><span>Velocidad</span><div class="sb"><i style="width:${c.spd / 1.3}%;background:var(--blue)"></i></div><b>${c.spd}</b></div>
          </div>
          <div style="margin-top:12px;font-size:16px;display:flex;gap:8px;align-items:center"><img class="px" style="width:32px;height:32px" src="${moveIcon(c.move)}"><div><b>Empieza con: ${mv.name}</b><br><span style="color:var(--dim)">${CLASS_NAMES[mv.cls]} · ${mv.desc}</span></div></div>
          <div class="cat-title">Transformaciones</div>
          <div class="forms">${c.forms.map((f, i) => {
            const isUn = i < unlocked;
            const cost = FORM_COST(c.r, i - 1);
            return `<div class="form-row ${isUn ? '' : 'locked'}"><img class="px" src="${PX.dataURL(c.look, f, showSh, c.id)}">
              <div class="fn"><b>${f.n}</b><br><small style="color:var(--dim)">×${f.m} daño · 20 s</small></div>
              ${isUn ? '<span class="chip" style="--rc:var(--green)">Desbloqueada</span>' : (i === unlocked && own ? `<button class="btn small gold" data-form="${i}" ${d.zeni < cost ? 'disabled' : ''}>${fmt(cost)} zeni</button>` : '<span class="chip" style="--rc:#556">Bloqueada</span>')}
            </div>`;
          }).join('')}</div>
          <div class="modal-actions" style="justify-content:flex-start">
            ${own ? (d.partner === id && (!sh || d.partnerShiny === showSh) ? '<span class="chip" style="--rc:var(--yellow)">★ Es tu compañero</span>' : `<button class="btn primary" id="d-partner">Elegir de compañero${showSh ? ' (shiny)' : ''}</button>`) : '<span style="color:var(--dim);font-size:16px">Consíguelo en las Cápsulas de la ' + SAGAS[c.saga].name + '.</span>'}
            ${own ? '<button class="btn" id="d-upg">Mejoras</button>' : ''}
          </div>
        </div>
      </div>`;
    $('#d-back').onclick = () => { subState.arg = null; renderCollection(body); };
    if ($('#d-sh')) $('#d-sh').onclick = () => { subState.viewShiny = showSh ? null : id; renderDetail(body, id); };
    if ($('#d-partner')) $('#d-partner').onclick = () => {
      d.partner = id; d.partnerShiny = showSh; Save.save(); Audio8.play('select');
      toast((showSh ? '✨ ' : '') + c.name + ' es ahora tu compañero'); renderDetail(body, id);
    };
    if ($('#d-upg')) $('#d-upg').onclick = () => { upgChar = id; sub('upgrades'); };
    body.querySelectorAll('[data-form]').forEach(b => b.onclick = () => {
      const i = +b.dataset.form, cost = FORM_COST(c.r, i - 1);
      if (d.zeni < cost) return;
      d.zeni -= cost; d.forms[id] = i; Save.save(); refreshRes(); Audio8.play('transform');
      toast('¡' + c.forms[i].n + ' desbloqueada!');
      renderDetail(body, id);
    });
  }

  // ---------- mejoras por personaje ----------
  let upgChar = null;
  function renderUpgrades(body) {
    const d = Save.d;
    if (!upgChar || !d.owned[upgChar]) upgChar = d.partner;
    const c = CHAR_BY[upgChar], up = Save.pupg(upgChar);
    const owned = CHARS.filter(x => d.owned[x.id]);
    body.innerHTML = `
      <div style="font-size:16px;color:var(--dim);margin-bottom:10px">Cada guerrero tiene sus propias mejoras: sólo cuentan cuando juegas con él.</div>
      <div class="filters"><b style="font-family:var(--px);font-size:10px">Guerrero</b>
        <select id="u-char">${owned.map(x => `<option value="${x.id}" ${x.id === upgChar ? 'selected' : ''}>${x.name}</option>`).join('')}</select>
        <img class="px" style="width:40px;height:54px" src="${charImg(c)}">
        ${upgChar !== d.partner ? '<button class="btn small" id="u-partner">Hacer compañero</button>' : '<span class="chip" style="--rc:var(--yellow)">★ Compañero</span>'}
      </div>
      <div class="upg-list">${PUPGRADES.map(u => {
        const lv = up[u.id] || 0, max = lv >= u.max, cost = Math.round(u.base * Math.pow(u.grow, lv));
        return `<div class="upg"><div class="ui">${u.icon}</div><div class="ut"><b>${u.name}</b><small>${u.unit} · ${lv}/${u.max}</small>
          <div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
          ${max ? '<span class="chip" style="--rc:var(--green)">MÁX</span>' : `<button class="btn small gold" data-u="${u.id}" ${d.zeni < cost ? 'disabled' : ''}>${fmt(cost)}</button>`}</div>`;
      }).join('')}</div>
      <div class="cat-title">Transformaciones de ${c.name}</div>
      <div style="font-size:16px;color:var(--dim)">Se desbloquean en su ficha de la colección. La barra de ki se llena al derrotar enemigos y al recibir golpes: pulsa ESPACIO (o el botón) para transformarte.</div>
      <div class="modal-actions" style="justify-content:flex-start"><button class="btn" id="u-forms">Ver transformaciones</button></div>`;
    $('#u-char').onchange = e => { upgChar = e.target.value; renderUpgrades(body); };
    if ($('#u-partner')) $('#u-partner').onclick = () => { d.partner = upgChar; d.partnerShiny = false; Save.save(); renderUpgrades(body); toast(c.name + ' es ahora tu compañero'); };
    $('#u-forms').onclick = () => sub('collection', upgChar);
    body.querySelectorAll('[data-u]').forEach(b => b.onclick = () => {
      const u = PUPGRADES.find(x => x.id === b.dataset.u), lv = up[u.id] || 0, cost = Math.round(u.base * Math.pow(u.grow, lv));
      if (d.zeni < cost || lv >= u.max) return;
      d.zeni -= cost; up[u.id] = lv + 1; Save.save(); refreshRes(); Audio8.play('levelup');
      renderUpgrades(body);
    });
  }

  // ---------- misiones / logros / perfil ----------
  let misTab = 'mis';
  function renderMissions(body) {
    const d = Save.d;
    Save.refreshMissions();
    const tabs = `<div class="tabs">${[['mis', 'Misiones'], ['ach', 'Logros'], ['prof', 'Perfil']].map(([k, n]) => `<button class="tab ${misTab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>`;
    let html = '';
    if (misTab === 'mis') {
      const row = (m, kind) => {
        const def = Save.missionDef(m.id);
        const g = def.mul ? m.goal / def.mul : m.goal, prog = def.mul ? Math.floor(m.prog / def.mul) : Math.floor(m.prog);
        const done = m.prog >= m.goal;
        return `<div class="mrow ${done ? 'done' : ''} ${m.claimed ? 'claimed' : ''}"><div class="mt"><b>${def.desc.replace('{g}', g)}</b><small>${Math.min(prog, g)} / ${g} · Premio: ${Save.rewardText(def.reward)}</small>
          <div class="pbar"><i style="width:${Math.min(100, m.prog / m.goal * 100)}%"></i></div></div>
          ${m.claimed ? '<span class="chip" style="--rc:#556">Hecha</span>' : `<button class="btn small ${done ? 'primary' : ''}" data-claim="${kind}:${m.id}" ${done ? '' : 'disabled'}>Reclamar</button>`}</div>`;
      };
      html = `<div class="cat-title">Diarias</div><div class="mlist">${d.missions.daily.map(m => row(m, 'daily')).join('')}</div>
        <div class="cat-title">Semanales</div><div class="mlist">${d.missions.weekly.map(m => row(m, 'weekly')).join('')}</div>`;
    } else if (misTab === 'ach') {
      const cats = [...new Set(ACH.map(a => a.cat))];
      const got = Object.keys(d.ach).length;
      html = `<div class="count">${got} / ${ACH.length} logros</div>` + cats.map(cat => `<div class="cat-title">${cat}</div><div class="mlist">${ACH.filter(a => a.cat === cat).map(a => {
        const v = a.value(d), done = v >= a.goal, claimed = !!d.ach[a.id];
        return `<div class="mrow ${done ? 'done' : ''} ${claimed ? 'claimed' : ''}"><div class="mt"><b>${claimed ? '🏅 ' : ''}${a.name}${a.title ? ' · <i style="color:var(--yellow)">' + a.title + '</i>' : ''}</b><small>${a.desc} · ${Save.rewardText(a.reward)}</small>
          <div class="pbar"><i style="width:${Math.min(100, v / a.goal * 100)}%"></i></div></div>
          ${claimed ? '<span class="chip" style="--rc:var(--gold)">🏅</span>' : `<button class="btn small ${done ? 'primary' : ''}" data-ach="${a.id}" ${done ? '' : 'disabled'}>Reclamar</button>`}</div>`;
      }).join('')}</div>`).join('');
    } else {
      const st = d.stats;
      const titles = ACH.filter(a => a.title && d.ach[a.id]).map(a => a.title);
      const c = CHAR_BY[d.partner];
      html = `<div class="detail"><div class="big"><img class="px" src="${charImg(c, d.partnerShiny)}"><div style="font-family:var(--px);font-size:11px;color:var(--yellow)">${d.profile.title || 'Sin título'}</div></div><div>
        <div class="filters"><b style="font-family:var(--px);font-size:10px">Apodo</b><input type="text" id="p-name" maxlength="16" value="${escapeHtml(d.profile.name || '')}">
        <b style="font-family:var(--px);font-size:10px">Título</b><select id="p-title"><option value="">Sin título</option>${titles.map(t => `<option ${d.profile.title === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="result-grid">
          <div>Runs<b>${fmt(st.runs)}</b></div><div>Mejor tiempo<b>${fmtTime(st.bestTime)}</b></div><div>Nivel máximo<b>${st.bestLevel}</b></div>
          <div>Enemigos<b>${fmt(st.kills)}</b></div><div>Jefes<b>${fmt(st.bosses)}</b></div><div>Grietas ganadas<b>${st.rifts}</b></div>
          <div>Tiradas<b>${fmt(st.pulls)}</b></div><div>Evoluciones<b>${st.evos}</b></div><div>Transformaciones<b>${st.transforms}</b></div>
          <div>Guerreros<b>${Object.keys(d.owned).length}/${CHARS.length}</b></div><div>Shinies<b>${Object.keys(d.shiny).length}</b></div><div>Deseos<b>${st.wishes}</b></div>
          <div>Legendarios vencidos<b>${Object.keys(d.legends).length}/${LEGENDS.length}</b></div><div>Objetos<b>${Object.keys(d.itemsFound).length}/11</b></div><div>Medallas<b>${Object.keys(d.ach).length}</b></div>
        </div>
        <div class="cat-title">Bolas de Dragón</div><div style="display:flex;gap:6px">${[1, 2, 3, 4, 5, 6, 7].map(n => `<img class="px" style="width:36px;height:36px" src="${PX.dragonBall(n, !d.balls.includes(n))}">`).join('')}</div>
        <div style="font-size:15px;color:var(--dim);margin-top:6px">Las sueltan los jefes, los élites y los legendarios de las grietas. Reúne las 7 para invocar a Shenlong.</div>
        ${d.personality ? `<div class="cat-title">Personalidad</div><div style="font-size:16px">${d.personality}</div>` : ''}
      </div></div>`;
    }
    body.innerHTML = tabs + html;
    body.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { misTab = b.dataset.t; renderMissions(body); });
    body.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => {
      const [kind, id] = b.dataset.claim.split(':');
      const m = d.missions[kind].find(x => x.id === id);
      if (!m || m.claimed || m.prog < m.goal) return;
      m.claimed = true;
      const rw = Save.missionDef(id).reward;
      Save.give(rw); Save.save(); refreshRes(); Audio8.play('ticket');
      toast('¡Misión completada! ' + Save.rewardText(rw));
      renderMissions(body);
    });
    body.querySelectorAll('[data-ach]').forEach(b => b.onclick = () => {
      const a = ACH.find(x => x.id === b.dataset.ach);
      if (!a || d.ach[a.id] || a.value(d) < a.goal) return;
      d.ach[a.id] = Date.now();
      Save.give(a.reward); Save.save(); refreshRes(); Audio8.play('rare');
      toast('🏅 ' + a.name + ' · ' + Save.rewardText(a.reward) + (a.title ? ' · Título: ' + a.title : ''));
      renderMissions(body);
    });
    if ($('#p-name')) $('#p-name').onchange = e => { d.profile.name = e.target.value.slice(0, 16); Save.save(); };
    if ($('#p-title')) $('#p-title').onchange = e => { d.profile.title = e.target.value; Save.save(); renderMissions(body); };
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

  // ---------- ranking ----------
  function renderRanking(body) {
    const d = Save.d;
    const r = d.ranking;
    body.innerHTML = r.length ? `<table class="rank"><tr><th>#</th><th>Guerrero</th><th>Tiempo</th><th>Nivel</th><th>Enemigos</th><th>Fecha</th></tr>
      ${r.map((e, i) => { const c = CHAR_BY[e.char]; return `<tr><td>${i + 1}</td><td><img class="px" src="${c ? charImg(c, e.shiny) : ''}"> ${c ? c.name : '?'}</td><td><b>${fmtTime(e.time)}</b></td><td>${e.lvl}</td><td>${fmt(e.kills)}</td><td>${new Date(e.at).toLocaleDateString('es')}</td></tr>`; }).join('')}</table>`
      : '<div style="font-size:16px;color:var(--dim)">Todavía no has jugado ninguna run. ¡A por ello!</div>';
  }

  // ---------- ajustes ----------
  function renderSettings(body) {
    const s = Save.d.settings;
    body.innerHTML = `<div class="help">
      <h3>Sonido</h3>
      <div class="filters">Música <input type="range" min="0" max="1" step="0.05" id="s-mus" value="${s.music}"> Efectos <input type="range" min="0" max="1" step="0.05" id="s-sfx" value="${s.sfx}"></div>
      <h3>Gráficos</h3>
      <div class="filters"><label><input type="checkbox" id="s-dmg" ${s.dmgNums ? 'checked' : ''}> Números de daño</label> <label><input type="checkbox" id="s-shake" ${s.shake ? 'checked' : ''}> Temblor de pantalla</label></div>
      <h3>Partida</h3>
      <p>Tu partida se guarda en este navegador. Puedes copiar un código para llevarla a otro dispositivo.</p>
      <div class="modal-actions" style="justify-content:flex-start"><button class="btn" id="s-exp">Exportar partida</button><button class="btn" id="s-imp">Importar partida</button><button class="btn danger" id="s-reset">Borrar partida</button></div>
      <textarea id="s-code" rows="4" style="width:100%;margin-top:10px" placeholder="Código de partida"></textarea>
      <h3>Acerca de</h3>
      <p>Dragon Ball Survivor es un juego hecho por fans, gratuito y sin ánimo de lucro, inspirado en PokéSurvivor y Vampire Survivors. No está afiliado a Bird Studio, Shueisha, Toei Animation ni Bandai Namco. Dragon Ball y sus personajes son propiedad de sus respectivos dueños. Todos los sprites se generan por código y la música y los sonidos son originales.</p>
    </div>`;
    $('#s-mus').oninput = e => { s.music = +e.target.value; Audio8.setVolumes(); Save.save(); };
    $('#s-sfx').oninput = e => { s.sfx = +e.target.value; Audio8.setVolumes(); Save.save(); Audio8.play('coin'); };
    $('#s-dmg').onchange = e => { s.dmgNums = e.target.checked; Save.save(); };
    $('#s-shake').onchange = e => { s.shake = e.target.checked; Save.save(); };
    $('#s-exp').onclick = () => { $('#s-code').value = btoa(unescape(encodeURIComponent(JSON.stringify(Save.d)))); $('#s-code').select(); toast('Código copiado en el cuadro: guárdalo'); };
    $('#s-imp').onclick = () => {
      try {
        const obj = JSON.parse(decodeURIComponent(escape(atob($('#s-code').value.trim()))));
        if (!obj || !obj.owned) throw new Error('bad');
        localStorage.setItem(Save.KEY, JSON.stringify(obj)); Save.load(); toast('Partida importada'); menu();
      } catch (e) { toast('Código no válido'); }
    };
    $('#s-reset').onclick = () => confirmBox('¿Borrar toda tu partida? No se puede deshacer.', () => { Save.reset(); title(); });
  }

  // ---------- guía ----------
  function renderHelp(body) {
    body.innerHTML = `<div class="help">
      <p>Dragon Ball Survivor es un juego de supervivencia al estilo de Survivor.io o Vampire Survivors: eliges un guerrero, te mueves por un mapa infinito y tus técnicas salen solas mientras hordas de enemigos de todas las sagas intentan rodearte. ¿Cuánto aguantarás?</p>
      <h3>Cómo se juega</h3>
      <p>En PC: muévete con <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o las flechas. Cambia de técnica con <kbd>1</kbd>–<kbd>4</kbd>, <kbd>Q</kbd>/<kbd>E</kbd> o haciendo clic en su icono. Transfórmate con <kbd>ESPACIO</kbd>. Pausa con <kbd>Esc</kbd>.</p>
      <p>En móvil (mejor en horizontal): arrastra el dedo en cualquier parte para moverte, toca una técnica para cambiarla y el botón de arriba a la derecha para pausar.</p>
      <p>Tu guerrero ataca solo con la técnica <b>activa</b>. Tú te encargas de esquivar, colocarte bien y elegir la técnica adecuada en cada momento.</p>
      <h3>Subir de nivel</h3>
      <p>Recoge la experiencia (gemas de ki) para subir de nivel y elige entre tres cartas: técnicas nuevas, mejorar las que tienes o potenciar a tu guerrero (Vigor, Potencia, Carrera, Reflejos, Coraza…). Pulsa <kbd>R</kbd> para cambiar las cartas.</p>
      <p><b>Evoluciones:</b> lleva una técnica a nivel 5, coge la carta de mejora que indica y aparecerá una carta dorada: Kamehameha se convierte en Kamehameha x10, Galick Gun en Final Flash…</p>
      <p><b>Vínculo:</b> une dos técnicas de nivel 3 o más para que se lancen a la vez ocupando un solo hueco.</p>
      <h3>Transformaciones</h3>
      <p>La barra de ki se llena al derrotar enemigos y al recibir golpes. Cuando esté llena, pulsa <kbd>ESPACIO</kbd> para transformarte durante 20 segundos: Super Saiyan, Kaio-ken, Ōzaru, Golden Freezer, Ultra Instinto… Desbloquea más formas en la ficha de cada guerrero.</p>
      <h3>Las sagas</h3>
      <p>Cada 2:30 minutos cambia la saga: Dragon Ball, Saiyan, Freezer, Cell, Buu, Películas, GT, Dioses, Goku Black, Torneo del Poder, Héroes y Daima. Cada saga tiene sus enemigos, un mini jefe y un jefe final. En el minuto 30, Zeno-sama empieza a borrarlo todo…</p>
      <h3>Enemigos con personalidad</h3>
      <p>Hay enemigos que curan, ponen escudos, invocan ayuda, explotan como los Saibaman o disparan rayos avisando en el suelo. Los avisos rojos en el suelo son ataques a punto de caer: ¡sal de ellos! Elimina primero a los que curan o ponen escudos.</p>
      <h3>Grietas temporales</h3>
      <p>De vez en cuando se abre una grieta. Si entras, luchas contra un guerrero legendario en una arena especial (con lava, hielo o gravedad). Si ganas te llevas premio y a veces un ticket ×10; si caes, vuelves al mapa sin premio.</p>
      <h3>Cápsulas y tickets</h3>
      <p>Los personajes se consiguen en el gacha de cápsulas, separado por sagas. Los tickets se ganan jugando: algunos enemigos los sueltan, y los jefes y legendarios a veces dan tickets ×10. Rarezas: Común (cápsula blanca), Poco común (verde), Rara (azul), Épica (morada) y Legendaria (dorada). 1 de cada 100 tiradas es shiny, y también puede aparecer un guerrero shiny salvaje en las hordas.</p>
      <h3>Objetos</h3>
      <div class="movedex">${Object.values(ITEMS).map(i => `<div><span style="font-size:22px">${i.icon}</span><span><b>${i.name}</b><br><span style="color:var(--dim)">${i.desc}</span></span></div>`).join('')}</div>
      <h3>Técnicas</h3>
      <div class="movedex">${Object.entries(MOVES).map(([id, m]) => `<div><img class="px" src="${moveIcon(id)}"><span><b>${m.name}</b> · <small>${CLASS_NAMES[m.cls]}</small><br><span style="color:var(--dim)">${m.desc}${m.evo ? ' Evoluciona a <b style="color:var(--gold)">' + m.evo.name + '</b> con ' + STAT_CARDS[m.evo.stat].title + '.' : ''}</span></span></div>`).join('')}</div>
      <h3>Bolas de Dragón</h3>
      <p>Los jefes, los élites y los legendarios pueden soltar Bolas de Dragón. Reúne las 7 e invoca a Shenlong para pedir un deseo.</p>
    </div>`;
  }

  // ---------- modales ----------
  function modal(html, opts) {
    modalOpts = opts || {};
    $('#modal-box').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }
  function closeModal() { $('#modal').classList.add('hidden'); $('#modal-box').innerHTML = ''; modalOpts = {}; }
  function modalOpen() { return !$('#modal').classList.contains('hidden'); }
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  function confirmBox(msg, yes) {
    modal(`<h2>¿Seguro?</h2><p class="sub">${msg}</p><div class="modal-actions"><button class="btn danger" id="cf-y">Sí</button><button class="btn" id="cf-n">No</button></div>`);
    $('#cf-y').onclick = () => { closeModal(); yes(); };
    $('#cf-n').onclick = closeModal;
  }

  function daily() {
    const d = Save.d;
    const yesterday = Save.dayKey(Date.now() - 86400000);
    const streak = d.daily.last === yesterday ? d.daily.streak % 7 : 0;
    const rw = DAILY_REWARDS[streak];
    modal(`<h2>¡Recompensa diaria!</h2><p class="sub">Entra cada día para conseguir premios mejores.</p>
      <div class="daily-grid">${DAILY_REWARDS.map((r, i) => `<div class="${i === streak ? 'today' : i < streak ? 'got' : ''}"><b>Día ${i + 1}</b>${Save.rewardText(r)}</div>`).join('')}</div>
      <div class="modal-actions"><button class="btn primary" id="dl-ok">Reclamar ${Save.rewardText(rw)}</button></div>`);
    $('#dl-ok').onclick = () => {
      d.daily.last = Save.dayKey(); d.daily.streak = streak + 1;
      Save.give(rw); Save.save(); refreshRes(); Audio8.play('ticket'); closeModal();
    };
  }

  // ---------- Shenlong ----------
  function shenron() {
    const d = Save.d;
    if (d.balls.length < 7) return;
    Audio8.play('shenron');
    modal(`<h2>¡Sal, Shenlong, y concédeme mi deseo!</h2><canvas class="shenron-cv px" id="sh-cv" width="200" height="120"></canvas>
      <p class="sub">«Os concederé un deseo. Decidme cuál es.»</p>
      <div class="wish-list">${WISHES.map(w => `<button class="btn" data-w="${w.id}">${w.name}<small>${w.desc}</small></button>`).join('')}</div>`, { noClose: true });
    const cvs = $('#sh-cv'), g = cvs.getContext('2d');
    let t = 0, alive = true;
    const draw = () => {
      if (!alive || !document.getElementById('sh-cv')) return;
      t += 0.03;
      g.fillStyle = '#0a0a1a'; g.fillRect(0, 0, 200, 120);
      for (let i = 0; i < 30; i++) { g.fillStyle = '#ffffff' + (i % 3 ? '44' : 'aa'); g.fillRect((i * 53) % 200, (i * 37) % 120, 1, 1); }
      for (let i = 0; i < 90; i++) {
        const k = i / 90;
        const x = 20 + k * 150 + Math.sin(k * 9 + t) * 14, y = 105 - k * 80 + Math.cos(k * 7 + t * 1.3) * 16;
        const r = 7 - k * 2;
        g.fillStyle = i % 4 === 0 ? '#2a8a3a' : '#3ab04a'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
        if (i % 6 === 0) { g.fillStyle = '#ffe0a0'; g.fillRect(x - 1, y + r - 2, 3, 2); }
      }
      const hx = 20 + 150 + Math.sin(9 + t) * 14, hy = 25 + Math.cos(7 + t * 1.3) * 16;
      g.fillStyle = '#3ab04a'; g.fillRect(hx - 2, hy - 6, 16, 10); g.fillRect(hx + 12, hy - 3, 6, 6);
      g.fillStyle = '#ff2020'; g.fillRect(hx + 7, hy - 4, 2, 2);
      g.fillStyle = '#f0e0a0'; g.fillRect(hx, hy - 10, 2, 5); g.fillRect(hx + 4, hy - 11, 2, 6);
      g.fillStyle = '#ffffff'; g.fillRect(hx + 16, hy + 2, 6, 1); g.fillRect(hx + 16, hy - 4, 7, 1);
      requestAnimationFrame(draw);
    };
    draw();
    document.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
      alive = false;
      const w = b.dataset.w;
      let msg = '';
      if (w === 'legend') {
        const miss = CHARS.filter(c => c.r === 5 && !d.owned[c.id]);
        let c, shiny = false;
        if (miss.length) c = miss[Math.floor(Math.random() * miss.length)];
        else { const ms = CHARS.filter(x => x.r === 5 && !d.shiny[x.id]); c = (ms.length ? ms : CHARS.filter(x => x.r === 5))[0]; shiny = true; }
        Save.addChar(c.id, shiny);
        msg = '¡' + (shiny ? '✨ ' : '') + c.name + ' se une a tu equipo!';
      } else if (w === 'tickets') { Save.give({ t10: 3 }); msg = '¡3 tickets ×10!'; }
      else if (w === 'zeni') { Save.give({ zeni: 15000 }); msg = '¡15.000 zeni!'; }
      else if (w === 'shiny') { d.shiny[d.partner] = 1; d.partnerShiny = true; msg = '¡' + CHAR_BY[d.partner].name + ' ahora brilla! ✨'; }
      d.balls = []; d.stats.wishes++;
      Save.save();
      Audio8.play('legend');
      modal(`<h2>«Tu deseo ha sido concedido. ¡Adiós!»</h2><p class="sub" style="font-size:20px;color:var(--yellow)">${msg}</p><p class="sub">Las Bolas de Dragón se dispersan por el universo…</p><div class="modal-actions"><button class="btn primary" id="sh-ok">Continuar</button></div>`, { noClose: true });
      $('#sh-ok').onclick = () => { closeModal(); menu(); };
    });
  }

  // ---------- en partida ----------
  let lvlCards = null, linkPick = null;
  function cardHtml(c, i) {
    const G = Game.state, p = G.player;
    let cls = '', icon = '', title = '', sub = '', desc = '';
    switch (c.type) {
      case 'up': {
        const m = MOVES[c.inst.id];
        icon = moveIcon(c.inst.id); title = Game.moveName(c.inst); sub = 'Nivel ' + c.inst.lvl + ' → ' + (c.inst.lvl + 1);
        desc = (c.inst.lvl + 1 === 5 && m.evo ? 'Al nivel 5 podrá evolucionar con <b>' + STAT_CARDS[m.evo.stat].title + '</b>. ' : '') + 'Más daño' + ({ proj: ' y más proyectiles', burst: ' y más proyectiles', fan: ' y más disparos', orbit: ' y más esferas', chain: ' y más saltos', meteor: ' y más impactos', beam: ' y rayo más grande' }[m.cls] || '') + ', menos recarga.';
        break;
      }
      case 'evo': {
        const m = MOVES[c.inst.id];
        cls = 'evo'; icon = moveIcon(c.inst.id); title = m.evo.name; sub = '¡EVOLUCIÓN!'; desc = m.name + ' evoluciona: ' + EVO_TEXT[m.cls] + '.';
        break;
      }
      case 'new': {
        const m = MOVES[c.id];
        cls = 'new'; icon = moveIcon(c.id); title = m.name; sub = 'Nueva · ' + CLASS_NAMES[m.cls]; desc = m.desc + (m.evo ? ' Evoluciona a ' + m.evo.name + '.' : '');
        break;
      }
      case 'stat': {
        const s = STAT_CARDS[c.id];
        title = s.icon + ' ' + s.title; sub = 'Mejora · ' + p.statTaken[c.id] + (s.max ? '/' + s.max : ''); desc = s.desc;
        const evoFor = p.slots.flat().filter(m => MOVES[m.id].evo && MOVES[m.id].evo.stat === c.id && !m.evo).map(m => MOVES[m.id].name);
        if (evoFor.length) desc += ' <span style="color:var(--gold)">Necesaria para evolucionar ' + evoFor.join(', ') + '.</span>';
        break;
      }
      case 'link': cls = 'link'; title = '🔗 Vínculo'; sub = 'Une dos técnicas'; desc = 'Elige dos técnicas de nivel 3 o más: se lanzarán a la vez y ocuparán un solo hueco.'; break;
      default: title = '💰 Zeni'; sub = 'Bolsa'; desc = '+25 zeni para el final de la run.';
    }
    return `<button class="card ${cls}" data-card="${i}">${icon ? `<img class="px" src="${icon}">` : ''}<div class="ct">${title}</div><div class="cs">${sub}</div><div class="cd">${desc}</div><div class="ck">${i + 1}</div></button>`;
  }
  function levelUp(lvl, cards, rerolls) {
    lvlCards = cards; linkPick = null;
    modal(`<h2>¡Nivel ${lvl}!</h2><p class="sub">Elige una recompensa · 1 2 3</p>
      <div class="cards">${cards.map(cardHtml).join('')}</div>
      <div class="modal-actions"><button class="btn small" id="lv-rr" ${rerolls > 0 ? '' : 'disabled'}>Cambiar opciones (${rerolls}) · R</button></div>`, { noClose: true, level: true });
    document.querySelectorAll('[data-card]').forEach(b => b.onclick = () => pickCard(+b.dataset.card));
    $('#lv-rr').onclick = doReroll;
  }
  function doReroll() {
    const c = Game.reroll();
    if (!c) return;
    Audio8.play('select');
    const G = Game.state;
    levelUp(G.player.lvl - G.pendingLevels + 1, c, G.player.rerolls);
  }
  function pickCard(i) {
    const c = lvlCards && lvlCards[i];
    if (!c) return;
    Audio8.play('select');
    if (c.type === 'link') return linkChooser(c);
    closeModal();
    lvlCards = null;
    Game.chooseCard(c);
  }
  function linkChooser(card) {
    const p = Game.state.player;
    const elig = p.slots.map((s, i) => ({ s, i })).filter(o => o.s.length === 1 && o.s[0].lvl >= 3 && MOVES[o.s[0].id].cls !== 'buff');
    linkPick = [];
    modal(`<h2>¡Vínculo!</h2><p class="sub">Los movimientos unidos se lanzan a la vez y ocupan un solo hueco</p>
      <div class="cards">${elig.map(o => `<button class="card link" data-slot="${o.i}"><img class="px" src="${moveIcon(o.s[0].id)}"><div class="ct">${Game.moveName(o.s[0])}</div><div class="cs">Nivel ${o.s[0].lvl}</div></button>`).join('')}</div>
      <div class="modal-actions"><button class="btn" id="lk-back">Atrás</button></div>`, { noClose: true, level: true });
    document.querySelectorAll('[data-slot]').forEach(b => b.onclick = () => {
      const i = +b.dataset.slot;
      if (linkPick.includes(i)) return;
      linkPick.push(i);
      b.style.background = '#1a4a6a';
      Audio8.play('click');
      if (linkPick.length === 2) { closeModal(); lvlCards = null; Game.chooseCard(card, linkPick); }
    });
    $('#lk-back').onclick = () => { const G = Game.state; levelUp(G.player.lvl - G.pendingLevels + 1, lvlCards, G.player.rerolls); };
  }

  function itemChoice(cur, nw) {
    const box = id => `<button class="card" data-item="${id}"><div style="font-size:30px">${ITEMS[id].icon}</div><div class="ct">${ITEMS[id].name}</div><div class="cd">${ITEMS[id].desc}</div><div class="cs">${id === cur ? 'El que llevas' : 'Nuevo'}</div></button>`;
    modal(`<h2>¡Un objeto!</h2><p class="sub">Sólo puedes llevar uno · 1 2</p><div class="item-choice">${box(cur)}${box(nw)}</div>`, { noClose: true, item: [cur, nw] });
    document.querySelectorAll('[data-item]').forEach(b => b.onclick = () => chooseItem(b.dataset.item));
  }
  function chooseItem(id) {
    closeModal();
    if (id !== Game.state.player.item) Game.equipItem(id);
    Game.resumeAfterItem();
  }

  function togglePause() {
    const G = Game.state;
    if (!G || G.over) return;
    if (modalOpen()) {
      if (modalOpts.pause) { closeModal(); Game.pause(false); }
      return;
    }
    Game.pause(true);
    const p = G.player;
    modal(`<h2>Pausa</h2>
      <p class="sub">WASD moverse · 1–4 técnica · Q / E ciclar · ESPACIO transformarse · Esc pausa<br>En móvil: arrastra el dedo para moverte · toca una técnica para cambiarla</p>
      <div class="mlist">${p.slots.map((s, i) => `<div class="mrow"><div class="mt"><b>${i + 1}. ${s.map(m => Game.moveName(m) + ' Nv ' + m.lvl + (m.evo ? ' ★' : '')).join(' + ')}</b><small>${s.map(m => MOVES[m.id].desc).join(' ')}</small></div></div>`).join('')}</div>
      ${p.item ? `<p class="sub" style="margin-top:10px">Objeto: ${ITEMS[p.item].icon} ${ITEMS[p.item].name} — ${ITEMS[p.item].desc}</p>` : ''}
      <div class="modal-actions"><button class="btn primary" id="pz-c">Continuar</button><button class="btn" id="pz-s">Sonido</button><button class="btn danger" id="pz-q">Abandonar run</button></div>`, { pause: true });
    $('#pz-c').onclick = () => { closeModal(); Game.pause(false); };
    $('#pz-s').onclick = () => {
      const s = Save.d.settings; const on = s.music > 0 || s.sfx > 0;
      if (on) { s._m = s.music; s._s = s.sfx; s.music = 0; s.sfx = 0; } else { s.music = s._m || 0.4; s.sfx = s._s || 0.7; }
      Audio8.setVolumes(); Save.save(); toast(on ? 'Sonido desactivado' : 'Sonido activado');
    };
    $('#pz-q').onclick = () => { closeModal(); Game.endRun(true); };
  }

  function keyInModal(e) {
    if (modalOpts.level) {
      if (e.code === 'KeyR' && lvlCards && !linkPick) doReroll();
      const n = +(e.code.match(/Digit(\d)/) || [])[1];
      if (n >= 1 && n <= 3 && lvlCards && !linkPick) pickCard(n - 1);
    } else if (modalOpts.item) {
      const n = +(e.code.match(/Digit(\d)/) || [])[1];
      if (n === 1 || n === 2) chooseItem(modalOpts.item[n - 1]);
    } else if (modalOpts.pause && (e.code === 'Space' || e.code === 'Enter')) { closeModal(); Game.pause(false); }
  }

  function runOver(s) {
    Game.stop();
    const newShinies = s.shinies.map(id => CHAR_BY[id].name).join(', ');
    modal(`<h2>${s.quit ? 'Run abandonada' : 'Has caído…'}</h2>
      ${s.newRecord ? '<p class="sub" style="color:var(--yellow)">¡Nuevo récord de tiempo!</p>' : ''}
      <div style="display:flex;justify-content:center"><img class="px" style="width:80px;height:108px;${s.quit ? '' : 'filter:grayscale(.6)'}" src="${charImg(s.char)}"></div>
      <div class="result-grid">
        <div>Tiempo<b>${fmtTime(s.time)}</b></div><div>Nivel<b>${s.lvl}</b></div><div>Enemigos<b>${fmt(s.kills)}</b></div><div>Jefes<b>${s.bosses}</b></div>
        <div>Zeni ganado<b>+${fmt(s.zeni)}</b></div><div>Tickets del gacha<b>${s.t1}${s.t10 ? ' · ×10: ' + s.t10 : ''}</b></div>
        ${s.balls.length ? `<div>Bolas de Dragón<b>${s.balls.map(n => '★' + n).join(' ')}</b></div>` : ''}
        ${s.legends.length ? `<div>Legendarios vencidos<b>${s.legends.map(id => CHAR_BY[id].name).join(', ')}</b></div>` : ''}
        ${newShinies ? `<div>Shinies conseguidos<b>${newShinies}</b></div>` : ''}
      </div>
      <div class="cat-title" style="text-align:center">Técnicas</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${s.moves.map(m => `<span class="chip" style="--rc:${m.evo ? 'var(--gold)' : '#9aa6d8'}">${m.name} · ${m.lvl}</span>`).join('')}</div>
      <div class="modal-actions"><button class="btn primary" id="ro-again">Otra run</button><button class="btn" id="ro-menu">Volver al menú</button></div>`, { noClose: true });
    $('#ro-again').onclick = () => { closeModal(); play(); };
    $('#ro-menu').onclick = () => { closeModal(); menu(); const n = Save.pendingAch().length; if (n) toast('🏅 Tienes ' + n + ' logro' + (n > 1 ? 's' : '') + ' por reclamar en Misiones'); };
  }

  // ---------- HUD ----------
  const hudCache = {};
  const set = (id, prop, v) => { const k = id + prop; if (hudCache[k] !== v) { hudCache[k] = v; const el = document.getElementById(id); if (prop === 'text') el.textContent = v; else if (prop === 'w') el.style.width = v; else if (prop === 'html') el.innerHTML = v; } };
  let bannerT = 0;
  const hud = {
    show(G) {
      Object.keys(hudCache).forEach(k => delete hudCache[k]);
      $('#btn-pause').onclick = togglePause;
      $('#btn-transform').onclick = () => Game.transform();
      $('#h-banner').classList.add('hidden');
      void G;
    },
    banner(title, sub, color) {
      const b = $('#h-banner');
      b.querySelector('b').textContent = title;
      b.querySelector('small').textContent = sub || '';
      b.style.setProperty('--bc', color || 'var(--yellow)');
      b.classList.remove('hidden');
      b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
      clearTimeout(bannerT);
      bannerT = setTimeout(() => b.classList.add('hidden'), 3200);
    },
    update(G) {
      if (!G) return;
      const p = G.player;
      set('h-hp', 'w', Math.max(0, p.hp / p.maxHp * 100).toFixed(1) + '%');
      set('h-hptxt', 'text', Math.ceil(Math.max(0, p.hp)) + ' / ' + p.maxHp);
      set('h-lv', 'text', 'Nv ' + p.lvl);
      set('h-xp', 'w', (p.xp / p.xpNext * 100).toFixed(1) + '%');
      set('h-time', 'text', fmtTime(G.t));
      set('h-saga', 'text', G.arena ? '⚡ ' + G.arena.name : SAGAS[G.phase].name + (G.weather === 'moon' ? ' · 🌕' : G.weather === 'gravity' ? ' · ⚖' : G.weather === 'storm' ? ' · ⚡' : ''));
      set('h-kills', 'text', fmt(G.kills));
      set('h-zeni', 'text', fmt(G.zeni));
      set('h-item', 'text', p.item ? ITEMS[p.item].icon + ' ' + ITEMS[p.item].name : '');
      const boss = G.enemies.find(e => e.boss && !e.dead);
      $('#h-boss').classList.toggle('hidden', !boss);
      if (boss) { set('h-bossname', 'text', boss.name + (boss.form ? ' · ' + boss.form.n : '')); set('h-bosshp', 'w', (boss.hp / boss.maxHp * 100).toFixed(1) + '%'); }
      // técnicas
      const sig = p.slots.map((s, i) => s.map(m => m.id + m.lvl + (m.evo ? 'e' : '')).join('+') + (i === p.active ? '*' : '')).join('|');
      if (hudCache.moves !== sig) {
        hudCache.moves = sig;
        $('#h-moves').innerHTML = p.slots.map((s, i) => `<button class="mslot ${i === p.active ? 'on' : ''} ${s.some(m => m.evo) ? 'evo' : ''}" data-s="${i}" title="${s.map(m => Game.moveName(m)).join(' + ')}">
          <span class="k">${i + 1}</span><img class="px" src="${moveIcon(s[0].id)}">${s.length > 1 ? '<span class="lnk">🔗</span>' : ''}<span class="l">${s.map(m => m.evo ? '★' : m.lvl).join('+')}</span><i class="cdv" id="cd${i}"></i></button>`).join('');
        $('#h-moves').querySelectorAll('[data-s]').forEach(b => b.onpointerdown = e => { e.stopPropagation(); Game.setActive(+b.dataset.s); });
      }
      p.slots.forEach((s, i) => {
        const m = s[0], def = MOVES[m.id];
        let k = 0;
        if (i === p.active && def.p.cd && m.t > 0) { const q = Game.moveStats(m); k = Math.min(1, m.t / q.cd); }
        const el = document.getElementById('cd' + i);
        if (el) set('cd' + i, 'w', '100%'), (el.style.height = (k * 100).toFixed(0) + '%');
      });
      // ki
      set('h-ki', 'w', p.ki.toFixed(1) + '%');
      const forms = p.char.forms, unl = Math.min(forms.length, 1 + Save.formsUnlocked(p.char.id));
      const nextForm = forms[unl - 1];
      set('h-formname', 'text', p.form ? p.form.n + ' · ' + Math.ceil(p.formT) + ' s' : nextForm.n);
      const ready = !p.form && p.ki >= 100;
      const tb = $('#btn-transform');
      if (tb.disabled === ready) tb.disabled = !ready;
      tb.classList.toggle('ready', ready);
    },
    joy(j) {
      const el = $('#joy');
      el.classList.toggle('hidden', !j.active);
      el.style.left = j.sx + 'px'; el.style.top = j.sy + 'px';
      const dx = j.x - j.sx, dy = j.y - j.sy;
      el.querySelector('i').style.transform = `translate(${dx}px, ${dy}px)`;
    },
  };

  return {
    title, menu, sub, refreshRes, toast, modal, closeModal, levelUp, itemChoice, togglePause, keyInModal, runOver, hud, moveIcon,
  };
})();
