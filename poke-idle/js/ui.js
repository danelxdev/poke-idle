// Interfaz HTML: cabecera, pestañas (Equipo, Mejoras, Gacha, Pokédex, Misiones, Liga), modales y animación del gacha.
'use strict';

const UI = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const DEX = Core.DEX;
  const fmt = Core.fmt;
  const ico = (n, s = 24) => Icons.html(n, s);
  const S = () => Core.S;
  const TYPE_ES = { normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada' };
  const typeTags = d => `<span class="types">${DEX[d].types.map(t => `<span class="type" style="background:${TYPE_COLORS[t]}">${TYPE_ES[t]}</span>`).join('')}</span>`;
  const starsHtml = n => `<span class="stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  const por = (d, shiny) => Sprites.portrait(d, shiny);

  let tab = 'team', sig = '', dexFilter = 'all', achShowAll = false;

  function show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }

  // ---------------- pantallas iniciales ----------------
  function title() {
    show('scr-title');
    const ids = [25, 4, 249, 384, 7, 133, 258, 149, 382, 155, 150, 252];
    $('#parade').innerHTML = ids.map(d => `<img class="px" src="${por(d)}" alt="">`).join('');
  }
  function starter(cb) {
    show('scr-starter');
    $('#starters').innerHTML = [1, 4, 7, 172, 133].map(d => `<button class="starter" data-d="${d}"><img class="px" src="${por(d)}"><b>${DEX[d].name}</b>${typeTags(d)}</button>`).join('');
    $$('#starters .starter').forEach(b => b.onclick = () => { Audio8.play('select'); cb(+b.dataset.d); });
  }

  // ---------------- cabecera y arena ----------------
  let lastCoins = 0, cpsAvg = 0, cpsT = 0, cpsAcc = 0;
  function hud(dt) {
    const s = S();
    $('#coins').textContent = fmt(s.coins);
    $('#gems').textContent = fmt(s.gems);
    $('#dust').textContent = fmt(s.dust);
    cpsT += dt;
    if (s.coins > lastCoins) cpsAcc += s.coins - lastCoins;
    lastCoins = s.coins;
    if (cpsT >= 2) { cpsAvg = cpsAvg ? cpsAvg * 0.6 + cpsAcc / cpsT * 0.4 : cpsAcc / cpsT; cpsT = 0; cpsAcc = 0; $('#cps').textContent = cpsAvg ? fmt(cpsAvg) + '/s' : ''; }
    const r = Core.routeData(s.stage), lp = Core.loopOf(s.stage);
    $('#route-name').textContent = r.name + (lp ? ' +' + lp : '');
    $('#stage-label').textContent = REGIONS[Core.regionOf(s.stage)].name + ' · Etapa ' + s.stage + (s.maxStage > s.stage ? ' / ' + s.maxStage : '');
    const boss = Core.isBoss(s.stage);
    const pips = $('#pips');
    const pk = boss ? 'boss' : String(s.kills);
    if (pips.dataset.k !== pk) {
      pips.dataset.k = pk;
      pips.className = 'pips' + (boss ? ' boss' : '');
      pips.innerHTML = boss ? '<i></i>' : Array.from({ length: 10 }, (_, i) => `<i class="${i < s.kills ? 'on' : ''}"></i>`).join('');
    }
    $('#st-prev').disabled = s.stage <= 1;
    $('#st-next').disabled = s.stage >= s.maxStage || boss;
    const e = Core.F.enemy;
    const box = $('#enemy-box');
    if (e) {
      box.classList.remove('hidden');
      const name = e.boss ? (r.boss.who === DEX[e.dex].name ? r.boss.who : r.boss.who + ' · ' + DEX[e.dex].name) : (e.golden ? '✨ ' : '') + DEX[e.dex].name + (e.golden ? ' dorado' : '');
      if ($('#enemy-name').textContent !== name) $('#enemy-name').textContent = name;
      $('#enemy-hp').style.width = Math.max(0, e.hp / e.max * 100) + '%';
      $('#enemy-hptxt').textContent = fmt(Math.max(0, Math.ceil(e.hp)));
      $('#boss-timer').classList.toggle('hidden', !e.boss);
      if (e.boss) $('#boss-t').style.width = Math.max(0, Core.F.bossT / Core.bossTime(e.stage) * 100) + '%';
    } else box.classList.add('hidden');
    const bb = $('#btn-boss'), showBb = !s.auto && s.kills >= 10 && !boss;
    bb.classList.toggle('hidden', !showBb);
    if (showBb) { const t = Core.isBoss(s.stage + 1) ? '¡Reta al jefe!' : 'Avanzar etapa'; if (bb.textContent !== t) bb.textContent = t; }
    for (const [id, k] of Object.entries(SKILLS)) {
      const b = $('#sk-' + id); if (!b) continue;
      const rem = Math.max(0, s.sk[id] - s.stats.time), on = Core.skillOn(id);
      b.classList.toggle('on', on); b.disabled = rem > 0;
      b.querySelector('i').style.height = (on ? 0 : rem / k.cd * 100) + '%';
      const tx = on ? Math.ceil(s.skOn[id] - s.stats.time) + 's' : rem > 0 ? Math.ceil(rem) + 's' : '';
      const sm = b.querySelector('small'); if (sm.textContent !== tx) sm.textContent = tx;
    }
    $('#dps').innerHTML = 'Daño/s <b>' + fmt(e ? Core.teamDps(e.types) : Core.teamDps()) + '</b> · Toque <b>' + fmt(Core.tapDmg()) + '</b>';
    $('#quest-dot').classList.toggle('hidden', !Core.pendingRewards() && s.daily.claimed);
  }

  // ---------------- pestañas ----------------
  function setTab(t) {
    tab = t; sig = '';
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    $('#tab-body').scrollTop = 0;
    refresh(true);
  }
  // vuelve a pintar la pestaña solo si cambia su estructura; si no, solo actualiza qué se puede comprar
  function refresh(force) {
    const s = S();
    const ns = TABS[tab].sig();
    if (force || ns !== sig) { sig = ns; $('#tab-body').innerHTML = TABS[tab].html(); }
    for (const b of $$('#tab-body [data-cost]')) b.disabled = s[b.dataset.cur || 'coins'] < +b.dataset.cost || b.dataset.off === '1';
  }

  const costBtn = (cost, label, act, extra = '', cur = 'coins') =>
    `<button class="btn primary buy" data-act="${act}" data-cost="${cost}" data-cur="${cur}" ${extra}><span>${label}</span><small>${ico(cur === 'gems' ? 'gem' : 'coin', 12)}${fmt(cost)}</small></button>`;

  function buyN(m) {
    const bm = S().buyMul;
    if (bm === 'max') { const r = Core.maxAffordable(m); return r.n ? r : { n: 1, c: Core.levelCost(m, m.lvl) }; }
    return { n: bm, c: Core.levelCostN(m, bm) };
  }

  const TABS = {
    team: {
      sig: () => { const s = S(); return JSON.stringify([s.team.map(k => [k, s.mons[k].lvl, s.mons[k].dex, s.mons[k].stars, s.mons[k].shiny]), s.slots, s.buyMul, s.buyMul === 'max' ? Math.floor(Math.log(s.coins + 1) * 3) : 0, s.medals, s.up.train, Core.dexCount(), s.badges]); },
      html() {
        const s = S();
        let h = `<div class="seg">${[1, 10, 25, 'max'].map(v => `<button data-act="mul" data-v="${v}" class="${s.buyMul === v ? 'on' : ''}">${v === 'max' ? 'Máx' : 'x' + v}</button>`).join('')}</div>`;
        for (let i = 0; i < 6; i++) {
          const k = s.team[i];
          if (i >= s.slots) {
            h += i === s.slots ? `<div class="card locked"><div class="info"><b>Hueco ${i + 1} bloqueado</b><small>Un Pokémon más combatiendo a la vez</small></div>${costBtn(SLOT_COST[i], 'Abrir', 'slot')}</div>` : '';
            continue;
          }
          if (!k) { h += `<div class="card"><div class="info"><b>Hueco libre</b><small>Elige un Pokémon en la Pokédex o abre Poké Balls</small></div><button class="btn small" data-act="tab" data-v="dex">Pokédex</button></div>`; continue; }
          const m = s.mons[k], rar = Core.RAR[m.dex], st = Core.stageOf(m.dex), kids = Core.CHILDREN[m.dex];
          const evo = kids && st < EVO_LVL.length ? `<small class="evo">Evoluciona a Nv. ${EVO_LVL[st]}</small>` : '';
          const b = buyN(m);
          h += `<div class="card" style="--rc:${RARITY[rar].color}">
            <img class="por" src="${por(m.dex, m.shiny)}" data-act="mon" data-v="${k}">
            <div class="info"><b>${m.shiny ? '<span class="shiny-tag">✨</span>' : ''}${DEX[m.dex].name} <small style="display:inline">Nv. ${m.lvl}</small></b>
            ${starsHtml(m.stars)} ${typeTags(m.dex)}<small>${fmt(Core.monDmg(m) / Core.monRate(m))} daño/s</small>${evo}</div>
            ${costBtn(b.c, 'Subir +' + b.n, 'lvl', `data-v="${k}"`)}</div>`;
        }
        h += `<p class="hint">Consejo: los Pokémon hacen x2 de daño cuando su tipo es eficaz contra el enemigo. Cada 25 niveles su daño se duplica.</p>`;
        return h;
      },
    },
    up: {
      sig: () => JSON.stringify(S().up),
      html() {
        const s = S();
        let h = '<h3>Mejoras</h3><p class="hint">Se pierden al entrar en la Liga, pero las medallas lo compensan con creces.</p>';
        for (const [id, u] of Object.entries(UPGRADES)) {
          const n = s.up[id], maxed = n >= u.max;
          h += `<div class="card"><span class="ico">${ico(u.icon, 36)}</span><div class="info"><b>${u.name} <small style="display:inline">Nv. ${n}</small></b><small>${u.desc(n)}</small><small style="color:#7ff0a0">Siguiente: ${u.desc(n + 1)}</small></div>
            ${maxed ? '<button class="btn small" disabled>Máx.</button>' : costBtn(Core.upCost(id), 'Mejorar', 'up', `data-v="${id}"`)}</div>`;
        }
        return h;
      },
    },
    gacha: {
      sig: () => { const s = S(); return JSON.stringify([s.pity, s.pityE, s.bannerLost, Core.pokeBallPrice(), Core.featuredEpic(), Core.featuredLegend(), Core.unlockedGens(), Core.freePullReady(), s.dust]); },
      html() {
        const s = S(), fe = Core.featuredEpic(), fl = Core.featuredLegend();
        let h = '';
        if (Core.freePullReady()) h += `<div class="feat free"><span>${ico('ball', 48)}</span><div><b>¡Tirada diaria gratis!</b><small>Una Poké Ball gratis cada día</small></div><button class="btn primary" data-act="freepull">Abrir</button></div>`;
        const feat = (d, tag) => `<div class="feat"><span class="tagx">${tag}</span><img src="${por(d)}"><div><b>${DEX[d].name}</b><small>${RARITY[Core.RAR[d]].name}</small><br>${typeTags(d)}</div></div>`;
        h += `<h3>Destacados de la Bola Destacada</h3>` + feat(fl, 'LEGENDARIO · SEMANA') + feat(fe, 'ÉPICO · 3 DÍAS');
        h += `<div class="pity">Épico garantizado en <b>${Math.max(0, PITY_EPIC - s.pityE)}</b> tiradas · Legendario en <b>${Math.max(0, PITY - s.pity)}</b> (solo con gemas)${s.bannerLost ? '<br><b style="color:#ffd23f">¡El próximo legendario de la Bola Destacada será el destacado!</b>' : ''}<div class="bar"><i style="width:${s.pity / PITY * 100}%"></i></div></div>`;
        const ballCard = ([id, b]) => {
          const cur = b.cur;
          return `<div class="ball-card"><span class="bi">${ico(b.icon, 48)}</span><b>${b.name}</b><p>${b.desc}</p>
            <div class="rates">${b.rates.map((r, k) => r ? `<span style="color:${RARITY[k].color}">${RARITY[k].name} ${r}%</span>` : '').join('')}</div>
            <div class="btns">
              <button class="btn primary" data-act="pull" data-v="${id}" data-n="1" data-cost="${Core.ballPrice(id, 1)}" data-cur="${cur}">x1 ${ico(cur === 'gems' ? 'gem' : 'coin', 12)} ${fmt(Core.ballPrice(id, 1))}</button>
              <button class="btn primary" data-act="pull" data-v="${id}" data-n="10" data-cost="${Core.ballPrice(id, 10)}" data-cur="${cur}">x10 ${ico(cur === 'gems' ? 'gem' : 'coin', 12)} ${fmt(Core.ballPrice(id, 10))}</button>
            </div></div>`;
        };
        const entries = Object.entries(BALLS);
        h += entries.filter(([, b]) => !b.region && Core.ballAvailable(entries.find(e => e[1] === b)[0])).filter(([id]) => id !== 'master').map(ballCard).join('');
        h += entries.filter(([id]) => id === 'master').map(ballCard).join('');
        h += '<h3>Bolas regionales</h3><p class="hint">Solo Pokémon de la región. Se abren al llegar a ella.</p>';
        let locked = 0;
        for (const [id, b] of entries.filter(([, b]) => b.region)) {
          if (!Core.ballAvailable(id)) { if (!locked++) h += `<div class="ball-row locked"><span>${ico(b.icon, 24)}</span><b>${b.name}</b><small>Llega a ${REGIONS[b.gen - 1].name} (etapa ${REGIONS[b.gen - 1].first * 10 + 1})</small></div>`; continue; }
          h += `<div class="ball-row"><span>${ico(b.icon, 24)}</span><b>${b.name}</b>
            <button class="btn small primary" data-act="pull" data-v="${id}" data-n="1" data-cost="${Core.ballPrice(id, 1)}" data-cur="gems">x1 ${ico('gem', 10)} ${fmt(Core.ballPrice(id, 1))}</button>
            <button class="btn small primary" data-act="pull" data-v="${id}" data-n="10" data-cost="${Core.ballPrice(id, 10)}" data-cur="gems">x10 ${ico('gem', 10)} ${fmt(Core.ballPrice(id, 10))}</button></div>`;
        }
        h += `<p class="hint">x10 cuesta como 9 y garantiza un Pokémon raro o mejor. Las copias repetidas suben estrellas (★ multiplica el daño) y dan <b>polvo estelar</b> (${ico('dust', 14)} ${fmt(s.dust)}): con él puedes canjear en la Pokédex el Pokémon que quieras. Las regiones nuevas se abren al llegar a ellas. 1 de cada 150 sale shiny (+50% de daño).</p>`;
        return h;
      },
    },
    dex: {
      sig: () => { const s = S(); return JSON.stringify([Object.keys(s.mons).length, Object.keys(s.seen).length, s.team, dexFilter, Core.unlockedGens(), Math.floor(s.dust / 20), Object.values(s.mons).map(m => m.dex + ':' + m.stars + ':' + (m.copies >= STAR_COPIES[m.stars] ? 1 : 0))]); },
      html() {
        const s = S();
        const n = Core.dexCount();
        const filters = [['all', 'Todos'], ['mine', 'Solo los míos']].concat(REGIONS.filter(r => r.gen).map(r => [String(r.gen), r.name]));
        let h = `<div class="dexhead"><span>Registrados <b style="color:#fff">${n}/${POKEDEX.length}</b> · +${n}% de daño · ${ico('dust', 14)} ${fmt(s.dust)}</span></div>
          <div class="seg"><select class="sel" data-act="dexsel">${filters.map(([v, l]) => `<option value="${v}" ${dexFilter === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="dexgrid">`;
        for (const p of POKEDEX) {
          if (/^[1-9]$/.test(dexFilter)) { if (p.gen !== +dexFilter) continue; }
          const base = String(Core.baseOf(p.dex)), own = s.mons[base], seen = s.seen[p.dex];
          const cur = own && own.dex === p.dex, locked = !Core.genUnlocked(p.gen);
          if (dexFilter === 'mine' && !(own && seen)) continue;
          const canBuy = !own && !locked && +base === p.dex && !seen;
          const canStar = cur && own.stars < 5 && own.copies >= STAR_COPIES[own.stars];
          const attr = own && seen ? `data-act="mon" data-v="${base}"` : canBuy ? `data-act="dexbuy" data-v="${p.dex}"` : seen ? `data-act="seen" data-v="${p.dex}"` : locked ? 'data-act="locked"' : '';
          h += `<button class="${seen ? '' : 'unk'} ${cur && s.team.includes(base) ? 'inteam' : ''}" style="--rc:${cur ? RARITY[Core.RAR[p.dex]].color : seen ? '#2a3f8a' : canBuy ? RARITY[Core.RAR[p.dex]].color + '66' : '#1d2a5a'}" ${attr}>
            ${cur ? `<span class="lv">${own.lvl}</span>` : ''}${seen ? `<img src="${por(p.dex, cur && own.shiny)}" loading="lazy">` : `<span class="q">${locked ? '🔒' : '?'}</span>`}<span class="n">${seen ? (canStar ? '⬆ ' : '') + p.name : canBuy ? ico('dust', 10) + fmt(Core.dustCost(p.dex)) : '#' + p.dex}</span></button>`;
        }
        return h + '</div><p class="hint">Toca un Pokémon sin descubrir de una región abierta para canjearlo por polvo estelar.</p>';
      },
    },
    quests: {
      sig: () => { const s = S(); return JSON.stringify([s.daily, s.weekly, s.ach, s.daily.quests.map(q => Core.questProg(q)), s.weekly.quests.map(q => Core.questProg(q)), ACHIEVEMENTS.map(a => Core.achStat(a) >= a.goal), achShowAll]); },
      html() {
        const s = S();
        const qrow = (q, i, act) => { const p = Core.questProg(q), ok = p >= q.goal; return `<div class="quest ${q.claimed ? 'done' : ok ? 'ready' : ''}"><div class="qi"><b>${q.text}</b><small>${fmt(p)} / ${fmt(q.goal)}</small><div class="bar"><i style="width:${p / q.goal * 100}%"></i></div></div>
          ${q.claimed ? '<button class="btn small" disabled>Hecho</button>' : `<button class="btn ${ok ? 'primary' : ''}" data-act="${act}" data-v="${i}" ${ok ? '' : 'disabled'}>${ico('gem', 12)} ${Math.round(q.reward * Core.gemMult())}</button>`}</div>`; };
        let h = '<h3>Recompensa diaria</h3>';
        h += `<div class="quest ${s.daily.claimed ? 'done' : 'ready'}"><span>${ico('gem', 30)}</span><div class="qi"><b>Día ${s.daily.streak} de racha</b><small>Entra cada día: la recompensa crece hasta el día 7</small></div>${s.daily.claimed ? '<button class="btn small" disabled>Mañana más</button>' : `<button class="btn primary" data-act="daily">${ico('gem', 12)} ${Core.dailyReward()}</button>`}</div>`;
        h += '<h3>Misiones de hoy</h3>' + s.daily.quests.map((q, i) => qrow(q, i, 'quest')).join('');
        h += '<h3>Misiones semanales</h3>' + s.weekly.quests.map((q, i) => qrow(q, i, 'wquest')).join('');
        const done = ACHIEVEMENTS.filter(a => s.ach[a.id]).length;
        h += `<h3>Logros <small style="color:var(--dim)">${done}/${ACHIEVEMENTS.length}</small></h3>`;
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
        h += `<div class="row"><button class="btn small" data-act="achall">${achShowAll ? 'Ocultar completados' : 'Ver todos los logros'}</button></div>`;
        return h;
      },
    },
    league: {
      sig: () => { const s = S(); return JSON.stringify([s.medals, s.mp, s.shop, Core.medalGain(), s.maxStage, s.stats.prestiges, Core.badgeCount()]); },
      html() {
        const s = S(), g = Core.medalGain();
        let h = `<div class="league"><h3>Liga Pokémon</h3>
          <div>${ico('crown', 48)}</div><div class="big">${s.medals}</div><p class="hint">Medallas de la Liga · +${s.medals * 3}% de daño y de monedas para siempre</p>`;
        if (g) h += `<p>Si entras ahora en la Liga ganas <b style="color:var(--yellow)">+${g} medallas</b> y ${g} Puntos de Liga.</p><p class="hint">Vuelves a la etapa 1 y pierdes monedas, niveles y mejoras. Conservas tus Pokémon, estrellas, gemas, polvo y la Pokédex.</p><button class="btn big primary" data-act="prestige">Entrar en la Liga</button>`;
        else h += `<p class="hint">Llega a la <b>etapa 60</b> para poder entrar. Cuanto más lejos llegues, más medallas: en la etapa 100 son ${Core.medalFor(100)} y en la 200, ${Core.medalFor(200)}.</p>`;
        h += `<h3>Tienda de la Liga <small style="color:var(--dim)">${ico('crown', 14)} ${s.mp} puntos</small></h3><div style="text-align:left">`;
        for (const [id, u] of Object.entries(LEAGUE_SHOP)) {
          const n = s.shop[id], maxed = n >= u.max;
          h += `<div class="card"><span class="ico">${ico(u.icon, 36)}</span><div class="info"><b>${u.name} <small style="display:inline">Nv. ${n}</small></b><small>${u.desc(n)}</small>${maxed ? '' : `<small style="color:#7ff0a0">Siguiente: ${u.desc(n + 1)}</small>`}</div>
            ${maxed ? '<button class="btn small" disabled>Máx.</button>' : `<button class="btn primary buy" data-act="shop" data-v="${id}" data-cost="${Core.shopCost(id)}" data-cur="mp"><span>Comprar</span><small>${ico('crown', 12)}${Core.shopCost(id)}</small></button>`}</div>`;
        }
        const st = s.stats;
        h += `</div><div class="statgrid"><span>Etapa máxima <b>${st.maxStage}</b></span><span>Pokémon derrotados <b>${fmt(st.kills)}</b></span><span>Jefes vencidos <b>${fmt(st.bosses)}</b></span><span>Poké Balls abiertas <b>${fmt(st.pulls)}</b></span>
          <span>Capturas <b>${fmt(st.catches)}</b></span><span>Evoluciones <b>${fmt(st.evolutions)}</b></span><span>Shinies <b>${fmt(st.shinies)}</b></span><span>Monedas totales <b>${fmt(st.coinsTotal)}</b></span>
          <span>Medallas de gimnasio <b>${Core.badgeCount()}/24</b></span><span>Tiempo jugado <b>${Math.floor(st.time / 3600)}h ${Math.floor(st.time / 60) % 60}m</b></span></div></div>`;
        return h;
      },
    },
  };

  // ---------------- acciones ----------------
  function act(el) {
    const s = S(), a = el.dataset.act, v = el.dataset.v;
    switch (a) {
      case 'mul': s.buyMul = v === 'max' ? 'max' : +v; Audio8.play('click'); break;
      case 'lvl': {
        const m = s.mons[v], b = buyN(m), before = m.dex;
        if (Core.levelUp(v, b.n)) { Audio8.play(m.dex !== before ? 'evolve' : 'levelup'); } else Audio8.play('error');
        break;
      }
      case 'slot': if (Core.buySlot()) { Audio8.play('item'); banner('¡Nuevo hueco en el equipo!', 'Pon otro Pokémon a combatir desde la Pokédex', '#7ff0a0'); autoFill(); } break;
      case 'up': if (Core.buyUp(v)) Audio8.play('levelup'); break;
      case 'tab': setTab(v); return;
      case 'pull': doPull(v, +el.dataset.n); break;
      case 'freepull': doPull('poke', 1, true); break;
      case 'shop': if (Core.buyShop(v)) Audio8.play('levelup'); break;
      case 'wquest': { const g = Core.claimQuest(+v, true); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + ' gemas'); } break; }
      case 'achall': achShowAll = !achShowAll; break;
      case 'dexbuy': dexBuyModal(+v); return;
      case 'locked': toast('Región bloqueada: llega a ella para descubrir sus Pokémon'); return;
      case 'dexf': dexFilter = v; break;
      case 'mon': monModal(v); return;
      case 'seen': toast(DEX[v].name + ': lo has visto, pero aún no lo tienes'); return;
      case 'daily': { const g = Core.claimDaily(); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + ' gemas'); } break; }
      case 'quest': { const g = Core.claimQuest(+v); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + ' gemas'); } break; }
      case 'ach': { const g = Core.claimAch(v); if (g) { Audio8.play('rare'); toast(ico('trophy', 18) + ' +' + g + ' gemas'); } break; }
      case 'prestige': prestigeModal(); return;
    }
    Core.save();
    refresh(true);
  }
  function autoFill() {
    const s = S();
    const free = Object.keys(s.mons).filter(k => !s.team.includes(k)).sort((a, b) => Core.monDmg(s.mons[b]) - Core.monDmg(s.mons[a]));
    while (s.team.length < s.slots && free.length) s.team.push(free.shift());
  }

  // ---------------- gacha ----------------
  function doPull(id, n, free) {
    const res = free ? Core.freePull() : Core.pull(id, n);
    if (!res) { Audio8.play('error'); return; }
    autoFill();
    Core.save();
    const fx = $('#gacha-fx');
    const best = Math.max(...res.map(r => r.rar));
    fx.classList.remove('hidden');
    fx.innerHTML = `<div class="ballbig">${ico(BALLS[id].icon, 120)}</div><div class="tapclose">...</div>`;
    let i = 0;
    const shakes = setInterval(() => { Audio8.play('shake'); if (++i >= 3) clearInterval(shakes); }, 380);
    let done = false;
    const reveal = () => {
      if (done) return; done = true; clearInterval(shakes);
      Audio8.play(best >= 5 ? 'legend' : best >= 4 ? 'rare' : 'pop');
      const col = RARITY[best].color;
      fx.innerHTML = `<div class="flash" style="--fc:${col}"></div><div class="pulls ${n === 1 ? 'one' : ''}">${res.map((r, j) => {
        const m = S().mons[r.base];
        return `<div class="pull" style="--rc:${RARITY[r.rar].color};${r.rar >= 4 ? '--rg:' + RARITY[r.rar].color + '88;' : ''}animation-delay:${j * 0.08}s">
          ${r.isNew ? '<span class="new">¡NUEVO!</span>' : ''}<img src="${por(r.base, r.shiny)}"><b>${r.shiny ? '✨' : ''}${DEX[r.base].name}</b><small>${RARITY[r.rar].name}</small>
          ${r.isNew ? '' : `<span class="dup">+1 copia (${m.copies}/${m.stars < 5 ? STAR_COPIES[m.stars] : '★5'}) · +${r.dust} ${ico('dust', 12)}</span>`}</div>`;
      }).join('')}</div><button class="btn big primary" id="pull-ok">¡Genial!</button>`;
      $('#pull-ok').onclick = close;
    };
    const close = () => { fx.classList.add('hidden'); fx.onclick = null; refresh(true); };
    setTimeout(reveal, 1200);
    fx.onclick = e => { if (!done) reveal(); else if (e.target === fx) close(); };
  }

  // ---------------- ficha de Pokémon ----------------
  let monCv = null;
  function monModal(key) {
    const s = S(), m = s.mons[key];
    if (!m) return;
    const rar = Core.RAR[m.dex], p = DEX[m.dex], st = p.stats;
    const need = m.stars < 5 ? STAR_COPIES[m.stars] : 0;
    const inTeam = s.team.indexOf(key);
    let slots = '';
    for (let i = 0; i < s.slots; i++) {
      const k = s.team[i];
      slots += `<button data-slot="${i}" class="${k === key ? 'cur' : ''}" title="Hueco ${i + 1}">${k ? `<img src="${por(s.mons[k].dex, s.mons[k].shiny)}">` : '+'}</button>`;
    }
    openModal(`<h2>${m.shiny ? '✨ ' : ''}${p.name}</h2>
      <div class="monbig"><canvas id="mon-cv" width="72" height="72"></canvas><div class="stats">
        <div style="color:${RARITY[rar].color};font-size:16px">${RARITY[rar].name} ${starsHtml(m.stars)}</div>${typeTags(m.dex)}
        <div>Nivel <b>${m.lvl}</b> · Daño/s <b>${fmt(Core.monDmg(m) / Core.monRate(m))}</b></div>
        <div>PS ${st.hp} · Atq ${st.atk} · Def ${st.def} · AtE ${st.spa} · DfE ${st.spd} · Vel ${st.spe}</div>
        <div>Copias: <b>${m.copies}</b>${need ? ' / ' + need + ' para ★' + (m.stars + 1) + ' (daño x' + STAR_MULT[m.stars + 1] + ')' : ' · ¡Estrellas al máximo!'}</div>
      </div></div>
      ${need ? `<div class="row"><button class="btn primary" id="m-star" ${m.copies >= need ? '' : 'disabled'}>Subir a ★${m.stars + 1}</button></div>` : ''}
      <p class="hint" style="margin-top:12px">${inTeam >= 0 ? 'Está en tu equipo. Toca otro hueco para moverlo.' : 'Elige el hueco del equipo donde quieres ponerlo:'}</p>
      <div class="slotpick">${slots}</div>
      <div class="row"><button class="btn" id="m-close">Cerrar</button></div>`);
    monCv = $('#mon-cv'); monCv.dataset.k = key; Sprites.preload(m.dex, m.shiny);
    $('#m-close').onclick = closeModal;
    if ($('#m-star')) $('#m-star').onclick = () => { if (Core.starUp(key)) { Audio8.play('legend'); banner('¡' + p.name + ' sube a ★' + m.stars + '!', 'Su daño se multiplica por ' + STAR_MULT[m.stars], '#ffd23f'); Core.save(); monModal(key); refresh(true); } };
    $$('.slotpick button').forEach(b => b.onclick = () => { Core.setTeam(+b.dataset.slot, key); Audio8.play('swap'); Core.save(); monModal(key); refresh(true); });
  }
  function drawMonCv(t) {
    if (!monCv || !monCv.isConnected) { monCv = null; return; }
    const m = S().mons[monCv.dataset.k];
    const g = monCv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 72, 72);
    if (m) Sprites.draw(g, m.dex, m.shiny, 'idle', Math.PI / 2, t, 36, 56, 1, {});
  }

  function dexBuyModal(d) {
    const s = S(), c = Core.dustCost(d), rar = Core.RAR[d];
    openModal(`<h2>Canjear por polvo estelar</h2><div class="monbig" style="justify-content:center"><img src="${por(d)}" style="width:96px;height:96px;image-rendering:pixelated;border-radius:8px;background:#0b1638"><div class="stats"><b style="font-size:20px">${DEX[d].name}</b><br><span style="color:${RARITY[rar].color}">${RARITY[rar].name}</span> ${typeTags(d)}<div>Coste: <b>${ico('dust', 14)} ${fmt(c)}</b> · Tienes ${fmt(s.dust)}</div></div></div>
      <div class="row"><button class="btn" id="d-no">Cancelar</button><button class="btn primary" id="d-yes" ${s.dust >= c ? '' : 'disabled'}>Canjear</button></div>`);
    $('#d-no').onclick = closeModal;
    $('#d-yes').onclick = () => { const r = Core.dustBuy(d); closeModal(); if (r) { Audio8.play(r.rar >= 4 ? 'rare' : 'friend'); autoFill(); banner('¡' + DEX[d].name + ' se une a tu colección!', 'Canjeado con polvo estelar', RARITY[r.rar].color); Core.save(); refresh(true); } };
  }

  let mapReg = -1;
  function mapModal() {
    const s = S(), L = Core.loopOf(s.stage), cur = Core.routeIdx(s.stage);
    if (mapReg < 0) mapReg = Core.regionOf(s.stage);
    const reg = REGIONS[mapReg], end = mapReg + 1 < REGIONS.length ? REGIONS[mapReg + 1].first : ROUTES.length;
    let h = `<h2>Mapa del mundo</h2><p class="hint">Toca una ruta para farmear en ella. Usa «Avanzar etapa» para seguir.${L ? ' Ciclo +' + L : ''}</p>
      <div class="seg wrap">${REGIONS.map((r, i) => `<button data-reg="${i}" class="${i === mapReg ? 'on' : ''}" ${(L * ROUTES.length + r.first) * 10 + 1 > s.maxStage ? 'disabled' : ''}>${r.name}</button>`).join('')}</div><div class="maplist">`;
    for (let ri = reg.first; ri < end; ri++) {
      const r = ROUTES[ri], base = (L * ROUTES.length + ri) * 10 + 1, open = base <= s.maxStage, done = s.bossFirst[base + 9];
      h += `<button class="maprow ${ri === cur ? 'cur' : ''}" data-go="${Math.min(base + 8, s.maxStage)}" ${open ? '' : 'disabled'}><b>${r.name}</b><small>${open ? 'Etapas ' + base + '–' + (base + 9) : 'Bloqueada'}</small><span class="mb"><img src="${por(r.boss.dex)}" class="px">${done ? '✓ ' : ''}${r.boss.who}</span></button>`;
    }
    openModal(h + '</div><div class="row"><button class="btn" id="map-x">Cerrar</button></div>');
    $('#map-x').onclick = closeModal;
    $$('[data-reg]').forEach(b => b.onclick = () => { mapReg = +b.dataset.reg; mapModal(); });
    $$('.maprow').forEach(b => b.onclick = () => { if (b.disabled) return; Core.goStage(+b.dataset.go); S().auto = false; Audio8.play('select'); closeModal(); });
  }

  function prestigeModal() {
    const g = Core.medalGain();
    openModal(`<h2>¿Entrar en la Liga?</h2><p>Ganarás <b style="color:var(--yellow)">+${g} medallas</b> (+${g * 3}% de daño y monedas para siempre) y ${g} Puntos de Liga para la tienda.</p>
      <p class="hint">Vuelves a la etapa 1. Pierdes monedas, niveles, mejoras y algunos huecos. Conservas Pokémon, estrellas, gemas y Pokédex.</p>
      <div class="row"><button class="btn" id="p-no">Todavía no</button><button class="btn primary" id="p-yes">¡Adelante!</button></div>`);
    $('#p-no').onclick = closeModal;
    $('#p-yes').onclick = () => { const n = Core.prestige(); closeModal(); Audio8.play('win'); banner('¡Bienvenido a la Liga!', '+' + n + ' medallas · tu nuevo viaje empieza ahora', '#ffd23f'); Core.save(); refresh(true); };
  }

  function settings() {
    const s = S().settings;
    openModal(`<h2>Ajustes</h2>
      <div class="setrow"><span>Música</span><input type="range" min="0" max="1" step="0.05" id="s-mus" value="${s.music}"></div>
      <div class="setrow"><span>Efectos</span><input type="range" min="0" max="1" step="0.05" id="s-sfx" value="${s.sfx}"></div>
      <div class="setrow"><span>Números de daño</span><input type="checkbox" id="s-nums" ${s.nums ? 'checked' : ''}></div>
      <div class="row"><button class="btn danger" id="s-wipe">Borrar partida</button><button class="btn primary" id="s-ok">Listo</button></div>
      <p class="fine">Sprites: PMD SpriteCollab (CC BY-NC 4.0) · Arte de escenarios e iconos adaptado de pokesurvivor (MIT) · Pokémon © Nintendo/Creatures/GAME FREAK</p>`);
    $('#s-mus').oninput = e => { s.music = +e.target.value; Audio8.setVolumes(); };
    $('#s-sfx').oninput = e => { s.sfx = +e.target.value; Audio8.setVolumes(); };
    $('#s-nums').onchange = e => { s.nums = e.target.checked; };
    $('#s-ok').onclick = () => { Core.save(); closeModal(); };
    $('#s-wipe').onclick = () => {
      openModal(`<h2>¿Borrar todo?</h2><p>Perderás todos tus Pokémon y tu progreso.</p><div class="row"><button class="btn" id="w-no">No</button><button class="btn danger" id="w-yes">Sí, borrar</button></div>`);
      $('#w-no').onclick = closeModal;
      $('#w-yes').onclick = () => { Core.wipe(); location.reload(); };
    };
  }

  // ---------------- modales, avisos ----------------
  function openModal(html) { $('#modal-box').innerHTML = html; $('#modal').classList.remove('hidden'); }
  function closeModal() { $('#modal').classList.add('hidden'); monCv = null; }
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
  function toast(html) { const t = $('#toast'); t.innerHTML = html; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2000); }

  function bind() {
    $('#tab-body').addEventListener('change', e => { const el = e.target.closest('[data-act="dexsel"]'); if (el) { dexFilter = el.value; sig = ''; refresh(true); } });
    $('#tab-body').addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) act(el); });
    $$('#tabs button').forEach(b => b.onclick = () => { Audio8.play('click'); setTab(b.dataset.tab); });
    $$('[data-ico]').forEach(s => s.innerHTML = ico(s.dataset.ico, 24));
    $('#i-coin').innerHTML = ico('coin', 24);
    $('#i-gem').innerHTML = ico('gem', 24);
    $('#btn-settings').innerHTML = ico('gear', 24);
    $('#btn-settings').onclick = settings;
    $('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
    $('#st-prev').onclick = () => { Core.goStage(S().stage - 1); S().auto = false; };
    $('#st-next').onclick = () => { Core.goStage(S().stage + 1); };
    $('#btn-boss').onclick = () => { Core.fightBoss(); };
    $('#btn-map').innerHTML = ico('boot', 24);
    $('#btn-map').onclick = () => { mapReg = -1; mapModal(); };
    $('#i-dust').innerHTML = ico('dust', 24);
    $('#skills').innerHTML = Object.entries(SKILLS).map(([id, k]) => `<button class="skill" id="sk-${id}" data-sk="${id}" title="${k.name}: ${k.desc}">${ico(k.icon, 24)}<i></i><small></small></button>`).join('');
    $$('#skills .skill').forEach(b => b.onclick = e => { e.stopPropagation(); if (Core.useSkill(b.dataset.sk)) { Audio8.play(b.dataset.sk === 'rage' ? 'charge' : 'ticket'); banner(SKILLS[b.dataset.sk].name + '!', SKILLS[b.dataset.sk].desc, '#ff8040'); } });
  }

  return { show, title, starter, hud, refresh, setTab, bind, banner, toast, openModal, closeModal, drawMonCv, autoFill, monModal, mapModal };
})();
