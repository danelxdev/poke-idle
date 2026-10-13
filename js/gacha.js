// Gacha de cápsulas por sagas, con forma de tragaperras.
'use strict';

const Gacha = (() => {
  const RATES = { 1: 45, 2: 30, 3: 17, 4: 6.5, 5: 1.5 };
  const PITY = 80;
  const SHINY = 1 / 100;
  let banner = 0;
  let busy = false;

  function rollRarity(saga) {
    const sv = Save.d;
    sv.pity[saga] = (sv.pity[saga] || 0) + 1;
    if (sv.pity[saga] >= PITY) return 5;
    let r = Math.random() * 100;
    for (const k of [5, 4, 3, 2, 1]) { r -= RATES[k]; if (r <= 0) return k; }
    return 1;
  }
  function poolFor(saga, rar) {
    for (const d of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
      const r = rar + d;
      if (r < 1 || r > 5) continue;
      const pool = CHARS.filter(c => c.saga === saga && c.r === r);
      if (pool.length) return pool;
    }
    return CHARS.filter(c => c.saga === saga);
  }
  function rollOne(saga, forceMin) {
    let rar = rollRarity(saga);
    if (forceMin && rar < forceMin) rar = forceMin;
    const pool = poolFor(saga, rar);
    let c = pool[Math.floor(Math.random() * pool.length)];
    let shiny = Math.random() < SHINY;
    if (shiny && Save.d.shiny[c.id]) {
      // los shiny no se repiten: sale otro de la misma rareza que te falte
      const alt = pool.filter(x => !Save.d.shiny[x.id]);
      if (alt.length) c = alt[Math.floor(Math.random() * alt.length)];
    }
    if (c.r === 5) Save.d.pity[saga] = 0;
    return { c, shiny };
  }

  function pull(saga, n, pay) {
    const sv = Save.d;
    if (pay === 't1' && sv.tickets.t1 < n) return null;
    if (pay === 't10' && sv.tickets.t10 < 1) return null;
    if (pay === 't1') sv.tickets.t1 -= n; else sv.tickets.t10 -= 1;
    const out = [];
    for (let i = 0; i < n; i++) out.push(rollOne(saga));
    if (n === 10 && !out.some(o => o.c.r >= 4)) out[9] = rollOne(saga, 4);
    for (const o of out) o.res = Save.addChar(o.c.id, o.shiny);
    sv.stats.pulls += n;
    Save.track('pulls', n);
    Save.save();
    return out;
  }

  // ---------- pantalla ----------
  function render(body) {
    const sv = Save.d;
    const s = SAGAS[banner];
    const all = CHARS.filter(c => c.saga === s.id);
    const own = all.filter(c => sv.owned[c.id]).length;
    const feat = all.slice().sort((a, b) => b.r - a.r).slice(0, 14);
    body.innerHTML = `
      <div class="banner-tabs">${SAGAS.map(x => `<button class="tab ${x.id === banner ? 'on' : ''}" data-b="${x.id}">${x.short}</button>`).join('')}</div>
      <div class="gacha-wrap">
        <div class="banner-card">
          <h3>${s.name}</h3>
          <div style="font-size:16px">${s.desc}</div>
          <div class="banner-feat">${feat.map(c => `<img class="px" title="${c.name}" src="${sv.owned[c.id] ? PX.dataURL(c.look, null, false, c.id) : PX.silhouette(c.look, c.id)}">`).join('')}</div>
          <div class="count">Tienes ${own} / ${all.length} guerreros de esta saga</div>
          <div class="rates" style="margin-top:10px">
            ${[5, 4, 3, 2, 1].map(r => `<div><b style="color:${RARITY[r].color}">■ ${RARITY[r].name}</b> · ${RATES[r]}% · ${RARITY[r].capName}</div>`).join('')}
            <div style="margin-top:8px">· Cada tirada tiene 1 entre 100 de ser <b style="color:var(--gold)">✨ SHINY</b>.</div>
            <div>· La tirada ×10 garantiza al menos una Épica.</div>
            <div>· Los repetidos dan zeni. Los shiny no se repiten.</div>
            <div>· Garantía: Legendaria asegurada a las ${PITY} tiradas en la misma saga.</div>
            <div>· Los tickets se consiguen jugando: algunos enemigos los sueltan al caer, y los jefes y los legendarios de las grietas, a veces, tickets ×10.</div>
          </div>
        </div>
        <div class="slot-machine">
          <div class="sm-lights">${'<i></i>'.repeat(9)}</div>
          <div class="sm-top">CÁPSULAS HOI-POI</div>
          <div class="reels" id="reels">${[0, 1, 2].map(() => `<div class="reel"><div class="strip"></div></div>`).join('')}</div>
          <div class="pity">Garantía Legendaria: ${sv.pity[banner] || 0} / ${PITY}</div>
          <div class="pull-btns">
            <button class="btn primary" data-pull="1" ${sv.tickets.t1 < 1 ? 'disabled' : ''}>Tirar ×1 · 1 ticket</button>
            <button class="btn gold" data-pull="10" ${sv.tickets.t1 < 10 ? 'disabled' : ''}>Tirar ×10 · 10 tickets</button>
            <button class="btn purple" data-pull="t10" ${sv.tickets.t10 < 1 ? 'disabled' : ''}>Tirar ×10 · 1 ticket ×10</button>
          </div>
          <div class="sm-lights">${'<i></i>'.repeat(9)}</div>
        </div>
      </div>`;
    body.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { banner = +b.dataset.b; Audio8.play('click'); render(body); });
    fillReels(body, null);
    body.querySelectorAll('[data-pull]').forEach(b => b.onclick = () => {
      if (busy) return;
      const v = b.dataset.pull;
      const res = v === '1' ? pull(banner, 1, 't1') : v === '10' ? pull(banner, 10, 't1') : pull(banner, 10, 't10');
      if (!res) { UI.toast('No tienes tickets suficientes: consíguelos jugando'); Audio8.play('error'); return; }
      UI.refreshRes();
      spin(body, res);
    });
  }

  function capURL(r, shiny) { return PX.capsule(shiny ? '#ff60d0' : RARITY[r].cap); }

  function fillReels(body, final) {
    const strips = body.querySelectorAll('.reel .strip');
    strips.forEach((st, i) => {
      const imgs = [];
      for (let k = 0; k < 24; k++) imgs.push(capURL([1, 1, 1, 2, 2, 3, 3, 4, 5][Math.floor(Math.random() * 9)]));
      if (final) imgs[22] = final[i];
      st.innerHTML = imgs.map(u => `<img class="px" src="${u}">`).join('');
      st.style.transition = 'none';
      st.style.transform = 'translateY(' + (final ? 0 : -64 * 21 + 16) + 'px)';
    });
  }

  // Anima los rodillos y luego abre las cápsulas
  function spin(body, res) {
    busy = true;
    const best = res.reduce((a, o) => (o.c.r > a.c.r || (o.c.r === a.c.r && o.shiny) ? o : a), res[0]);
    const capB = capURL(best.c.r, best.shiny);
    // con una legendaria o shiny, los tres rodillos coinciden; si no, el último puede variar
    const finals = [capB, capB, best.c.r >= 3 ? capB : capURL(Math.max(1, best.c.r - 1))];
    fillReels(body, finals);
    const strips = body.querySelectorAll('.reel .strip');
    const target = -(22 * 64) + 16;
    let ticks = 0;
    const tick = setInterval(() => { Audio8.play('reel'); if (++ticks > 40) clearInterval(tick); }, 60);
    strips.forEach((st, i) => {
      const dur = 0.9 + i * 0.45 + (i === 2 && best.c.r >= 4 ? 0.9 : 0);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        st.style.transition = `transform ${dur}s cubic-bezier(.15,.7,.2,1)`;
        st.style.transform = `translateY(${target}px)`;
      }));
      setTimeout(() => Audio8.play('stop'), dur * 1000);
    });
    const total = (0.9 + 2 * 0.45 + (best.c.r >= 4 ? 0.9 : 0)) * 1000 + 300;
    setTimeout(() => {
      clearInterval(tick);
      if (res.length === 1) openSingle(res[0], () => { busy = false; render(body); });
      else openMulti(res, () => { busy = false; render(body); });
    }, total);
  }

  function tagFor(o) {
    if (o.res.shinyNew) return { t: '¡SHINY NUEVO!', cls: 'sh' };
    if (o.res.isNew) return { t: '¡NUEVO!', cls: '' };
    return { t: 'Repetido · +' + o.res.dupZeni + ' zeni', cls: 'dup' };
  }

  function smoke(el) {
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('i');
      s.className = 'smoke';
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 40;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.left = '65px'; s.style.top = '65px';
      el.appendChild(s);
    }
  }

  function openSingle(o, done) {
    const r = RARITY[o.c.r];
    const shakes = o.c.r >= 5 ? 3 : o.c.r >= 3 ? 2 : 1;
    UI.modal(`<div class="reveal" style="--rc:${r.color}">
        <h2>${o.shiny ? '✨ Cápsula Shiny' : r.capName}</h2>
        <div class="poof" id="poof"><img class="capsule-big px shake" src="${capURL(o.c.r, o.shiny)}"></div>
        <div id="rv-info" class="sub">¡Toca para abrir!</div>
        <div class="modal-actions"><button class="btn" id="rv-skip">Abrir</button></div>
      </div>`, { noClose: true });
    let opened = false;
    let n = 0;
    const iv = setInterval(() => { Audio8.play('shake'); if (++n >= shakes * 2) { clearInterval(iv); open(); } }, 380);
    const open = () => {
      if (opened) return;
      opened = true;
      clearInterval(iv);
      const poof = document.getElementById('poof');
      if (!poof) return;
      Audio8.play('pop');
      poof.innerHTML = `<div class="burst"></div><img class="char-big px" src="${PX.dataURL(o.c.look, null, o.shiny, o.c.id)}">`;
      smoke(poof);
      setTimeout(() => Audio8.play(o.c.r >= 5 || o.shiny ? 'legend' : o.c.r >= 3 ? 'rare' : 'select'), 150);
      const tg = tagFor(o);
      document.getElementById('rv-info').outerHTML = `
        <div class="rname" style="color:${r.color}">${o.shiny ? '✨ ' : ''}${o.c.name}</div>
        <div><span class="chip" style="--rc:${r.color}">${r.name}</span><span class="chip" style="--rc:#9aa6d8">${SAGAS[o.c.saga].name}</span></div>
        <div class="rtag" style="background:${tg.cls === 'dup' ? '#334' : tg.cls === 'sh' ? 'var(--gold);color:#000' : 'var(--red)'}">${tg.t}</div>`;
      const sk = document.getElementById('rv-skip');
      sk.textContent = 'Continuar';
      sk.onclick = () => { UI.closeModal(); done(); };
    };
    document.getElementById('rv-skip').onclick = open;
    document.getElementById('poof').onclick = open;
  }

  function openMulti(res, done) {
    UI.modal(`<div class="reveal" style="--rc:var(--gold)">
        <h2>¡Tirada ×10!</h2>
        <div class="multi-grid" id="mg">${res.map((o, i) => `<div class="mc" style="--rc:${o.shiny ? 'var(--gold)' : RARITY[o.c.r].color}" data-i="${i}"><img class="cap px" src="${capURL(o.c.r, o.shiny)}"></div>`).join('')}</div>
        <div class="modal-actions"><button class="btn" id="mg-skip">Abrir todas</button></div>
      </div>`, { noClose: true });
    let i = 0;
    const openOne = k => {
      const el = document.querySelector(`#mg [data-i="${k}"]`);
      if (!el || el.dataset.open) return;
      el.dataset.open = 1;
      const o = res[k], tg = tagFor(o);
      el.innerHTML = `<span class="tag ${tg.cls}">${o.res.shinyNew ? 'SHINY' : o.res.isNew ? 'NUEVO' : '+' + o.res.dupZeni}</span><img class="ch px" src="${PX.dataURL(o.c.look, null, o.shiny, o.c.id)}"><small style="color:${RARITY[o.c.r].color}">${o.shiny ? '✨' : ''}${o.c.name}</small>`;
      Audio8.play(o.c.r >= 5 || o.shiny ? 'legend' : o.c.r >= 4 ? 'rare' : 'pop');
    };
    const iv = setInterval(() => { openOne(i++); if (i >= res.length) { clearInterval(iv); finish(); } }, 320);
    const finish = () => {
      const b = document.getElementById('mg-skip');
      if (!b) return;
      b.textContent = 'Continuar';
      b.onclick = () => { UI.closeModal(); done(); };
    };
    document.getElementById('mg-skip').onclick = () => { clearInterval(iv); for (let k = 0; k < res.length; k++) openOne(k); finish(); };
  }

  return { render, pull, setBanner(b) { banner = b; } };
})();
