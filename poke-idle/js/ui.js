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
  const REG_COL = ['#ff5f6d', '#ffd23f', '#5fe08a', '#4fb4ff', '#c47bff', '#ff8ad8', '#ff9a3d', '#9fe0ff', '#ff7a5a'];
  function title() {
    show('scr-title');
    const s = S(), k = $('#kofi-title');
    if (k) { k.href = KOFI_URL; k.innerHTML = ico('cup', 24) + ' Apoyar en Ko-fi'; }
    TitleFX.start($('#title-bg'));
    $('#logo-ball').innerHTML = ico('ball', 48);
    $('#t-badges').innerHTML = [['book', POKEDEX.length + ' Pokémon'], ['boot', REGIONS.filter(r => r.gen).length + ' regiones'], ['crown', ROUTES.length + ' jefes'], ['ball', Object.keys(BALLS).length + ' Poké Balls'], ['trophy', ACHIEVEMENTS.length + ' logros']]
      .map(([i, t], n) => `<span style="animation-delay:${0.1 + n * 0.08}s">${ico(i, 20)}${t}</span>`).join('');
    // continuar
    const started = s.started;
    $('#btn-start').textContent = started ? 'Continuar' : 'Jugar';
    $('#t-cont').classList.toggle('hidden', !started);
    $('#t-new').classList.toggle('hidden', !started);
    if (started) {
      const n = Object.keys(s.mons).length, hrs = Math.floor(s.stats.time / 3600), mins = Math.floor(s.stats.time / 60) % 60;
      $('#t-cont').innerHTML = `<div class="ct-team">${s.team.slice(0, 6).map(kk => `<img class="px" src="${por(s.mons[kk].dex, s.mons[kk].shiny)}" alt="">`).join('')}</div>
        <div class="ct-info"><b>Tu aventura</b><span>${REGIONS[Core.regionOf(s.stage)].name} · etapa ${s.stage} <small>(máx. ${s.stats.maxStage})</small></span>
        <small>${n} Pokémon · Pokédex ${Core.dexCount()}/${POKEDEX.length} · ${s.medals} medallas · ${hrs ? hrs + ' h ' : ''}${mins} min jugados</small></div>`;
      $('#t-new').onclick = e => {
        e.preventDefault();
        openModal(`<h2>¿Empezar de nuevo?</h2><p>Se borrará tu partida actual: Pokémon, progreso y objetos.</p><div class="row"><button class="btn" id="n-no">Cancelar</button><button class="btn danger" id="n-yes">Sí, borrar todo</button></div>`);
        $('#n-no').onclick = closeModal; $('#n-yes').onclick = () => { Core.wipe(); location.reload(); };
      };
    }
    // Pokémon destacado
    const fl = Core.featuredLegend(), fe = Core.featuredEpic();
    $('#t-featured').innerHTML = `<h3>Destacados de la semana</h3><div class="t-feat">
      <div class="tf big" style="--rc:${RARITY[5].color}"><img class="px" src="${por(fl)}" alt=""><b>${DEX[fl].name}</b><small>${RARITY[5].name}</small>${typeTags(fl)}</div>
      <div class="tf" style="--rc:${RARITY[4].color}"><img class="px" src="${por(fe)}" alt=""><b>${DEX[fe].name}</b><small>${RARITY[4].name}</small>${typeTags(fe)}</div></div>
      <p class="hint">Más probabilidad en la Bola Destacada.</p>`;
    // regiones
    $('#t-regions').innerHTML = `<h3>Viaja por 9 regiones</h3><div class="t-reg">${REGIONS.filter(r => r.gen).map((r, i) => {
      const open = Core.genUnlocked(r.gen), n = POKEDEX.filter(p => p.gen === r.gen).length;
      return `<div class="rg ${open ? '' : 'lock'}" style="--c:${REG_COL[i]}"><i></i><b>${r.name}</b><small>${open ? n + ' Pokémon' : 'Etapa ' + (r.first * 10 + 1)}</small></div>`;
    }).join('')}</div>`;
    // características
    $('#t-cards').innerHTML = [
      ['fist', 'Combate automático', 'Tu equipo pelea solo. Toca al enemigo para golpear más fuerte y usa habilidades.'],
      ['ball', 'Gacha con tickets', 'Abre Poké Balls con rarezas, shinies, destacados y garantías.'],
      ['up', 'Evoluciona y mejora', 'Nuevos ataques por nivel, evoluciones animadas, estrellas y objetos.'],
      ['crown', 'Liga y prestigio', 'Reinicia el viaje con bonus permanentes y una tienda de mejoras.'],
    ].map(([i, t, d], n) => `<div class="tcard" style="animation-delay:${0.3 + n * 0.1}s">${ico(i, 36)}<b>${t}</b><small>${d}</small></div>`).join('');
    $('#t-news').innerHTML = `<h3>Novedades</h3><ul>
      <li>Objetos equipables, sinergias de equipo y tutorial inicial.</li>
      <li>Los Pokémon solo se consiguen en el gacha, con tickets.</li>
      <li>Ataques que mejoran con el nivel y animaciones de evolución.</li>
      <li>9 regiones, 971 Pokémon y música original por región.</li></ul>`;
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
    $('#tks').textContent = fmt(Object.values(s.tk).reduce((a, b) => a + b, 0));
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
      const eased = e.boss && Core.bossEase(e.stage) < 1 ? ' · −' + Math.round((1 - Core.bossEase(e.stage)) * 100) + '%' : '';
      const name = e.boss ? (r.boss.who === DEX[e.dex].name ? r.boss.who : r.boss.who + ' · ' + DEX[e.dex].name) + eased : (e.golden ? '✨ ' : '') + DEX[e.dex].name + (e.golden ? ' dorado' : '');
      if ($('#enemy-name').textContent !== name) $('#enemy-name').textContent = name;
      const ft = $('#foe-types'); if (ft.dataset.k !== String(e.dex)) { ft.dataset.k = e.dex; ft.innerHTML = typeTags(e.dex); }
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
    const waitBoss = !s.auto && s.kills >= 10 && !boss && Core.isBoss(s.stage + 1), rd = waitBoss ? Math.min(1, Core.bossReady(s.stage + 1)) : 0;
    $('#dps').innerHTML = 'Daño/s <b>' + fmt(e ? Core.teamDps(e.types) : Core.teamDps()) + '</b> · Toque <b>' + fmt(Core.tapDmg()) + '</b>' + (waitBoss ? ` · Poder vs jefe <b style="color:${rd >= 0.95 ? '#7ff0a0' : '#ffd23f'}">${Math.round(rd * 100)}%</b>` : '');
    $('#quest-dot').classList.toggle('hidden', !Core.pendingRewards() && s.daily.claimed);
    $('#gacha-dot').classList.toggle('hidden', !Core.eggsReady());
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
    const foe = Core.F.enemy;
    for (const c of $$('#tab-body [data-effk]')) {
      const m = s.mons[c.dataset.effk], ef = m && foe ? Core.eff(m.dex, foe.types) : 1;
      const t = ef >= 2 ? '▲ ×' + (Math.round(ef * 10) / 10) : ef < 0.5 ? '✖ sin efecto' : ef < 1 ? '▼ ×½' : '', cl = 'effchip' + (ef >= 2 ? ' eup' : ef < 1 ? ' edn' : '');
      if (c.textContent !== t) c.textContent = t;
      if (c.className !== cl) c.className = cl;
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

  const natTxt = m => { const n = Core.natOf(m); return n.up ? `${n.name} <em class="nu">▲${NAT_SHORT[n.up]}</em> <em class="nd">▼${NAT_SHORT[n.down]}</em>` : n.name + ' (neutra)'; };
  function incubatorHtml() {
    const s = S();
    let h = `<h3>Incubadora <small style="color:var(--dim)">${s.eggs.length}/${EGG_CAP} huevos</small></h3><div class="incubator">`;
    const eggRow = (e, i, active) => {
      const d = EGGS[e.t], ready = Core.eggReady(e);
      return `<div class="eggrow ${ready ? 'ready' : ''}" style="--ec:${d.color}"><span class="eico">${ico('egg' + e.t, 40)}</span><div class="info"><b>${d.name}</b>
        ${active ? `<div class="bar egg" data-egg="${i}"><i></i><span></span></div>` : '<small>En espera: no avanza hasta que tenga incubadora</small>'}</div>
        ${ready ? `<button class="btn primary" data-act="hatch" data-v="${i}">¡Eclosionar!</button>` : active ? '' : `<button class="btn small" data-act="eggfront" data-v="${i}">Incubar</button>`}</div>`;
    };
    for (let i = 0; i < s.inc; i++) h += s.eggs[i] ? eggRow(s.eggs[i], i, true) : `<div class="eggrow empty"><span class="eico">${ico('egg0', 40)}</span><div class="info"><b>Incubadora libre</b><small>Los huevos caen de los Pokémon derrotados, los jefes y las misiones</small></div></div>`;
    for (let i = s.inc; i < s.eggs.length; i++) h += eggRow(s.eggs[i], i, false);
    const ic = Core.incCost();
    if (ic) h += `<div class="eggrow locked"><div class="info"><b>Incubadora ${s.inc + 1}</b><small>Incuba un huevo más a la vez</small></div>${costBtn(ic, 'Comprar', 'buyinc', '', 'gems')}</div>`;
    h += '</div><p class="hint">Cada victoria avanza los huevos que están en una incubadora (jefe ×5, dorado ×3), también sin conexión. Al eclosionar sale un Pokémon con IVs mínimos garantizados y un 50% más de probabilidad de ser shiny.</p>';
    h += `<div class="eggshop">` + EGGS.map((d, t) => `<button class="btn small buy" data-act="buyegg" data-v="${t}" data-cost="${d.gems}" data-cur="gems" ${s.eggs.length >= EGG_CAP ? 'data-off="1"' : ''} title="${d.desc} Necesita ${fmt(d.need)} victorias."><span>${ico('egg' + t, 20)}</span><small>${ico('gem', 12)}${fmt(d.gems)}</small></button>`).join('') + '</div>';
    return h;
  }
  const itemName = it => HELD[it.id].name + (it.id === 'orbe' ? ' de ' + TYPE_NAMES[it.type] : '');
  const itemDesc = it => HELD[it.id].desc(Core.itemVal(it), it);
  function itemChip(k, m) {
    const it = Core.itemOf(m);
    return `<button class="itemchip ${it ? 'has' : ''}" data-act="item" data-v="${k}" ${it ? `style="--rc:${ITEM_RAR[it.rar].color}"` : ''} title="${it ? itemName(it) + ': ' + itemDesc(it) : 'Equipar un objeto'}">${it ? ico(HELD[it.id].icon, 24) : '+'}</button>`;
  }
  function buyN(m) {
    const bm = S().buyMul;
    if (bm === 'max') { const r = Core.maxAffordable(m); return r.n ? r : { n: 1, c: Core.levelCost(m, m.lvl) }; }
    return { n: bm, c: Core.levelCostN(m, bm) };
  }

  const TABS = {
    team: {
      sig: () => { const s = S(); return JSON.stringify([s.team.map(k => [k, s.mons[k].lvl, s.mons[k].dex, s.mons[k].stars, s.mons[k].shiny, s.mons[k].item]), s.inv.length, s.slots, s.buyMul, s.buyMul === 'max' ? Math.floor(Math.log(s.coins + 1) * 3) : 0, s.medals, s.up.train, Core.dexCount(), s.badges, s.team.map(k => [s.mons[k].nat, Core.ivSum(s.mons[k])]), Core.routeIdx(s.stage), Core.isBoss(s.stage), s.kills >= 10 && !s.auto]); },
      html() {
        const s = S();
        let h = `<div class="teamhead"><div class="seg">${[1, 10, 25, 'max'].map(v => `<button data-act="mul" data-v="${v}" class="${s.buyMul === v ? 'on' : ''}">${v === 'max' ? 'Máx' : 'x' + v}</button>`).join('')}</div><div class="rowbtns"><button class="btn small" data-act="best" title="Elige a tus Pokémon que mejor golpean a los enemigos de esta ruta">Mejor equipo</button><button class="btn small" data-act="bag">Mochila · ${s.inv.length}</button></div></div>`;
        const tgt = s.kills >= 10 && !s.auto && !Core.isBoss(s.stage) ? s.stage + 1 : s.stage, strong = Core.strongTypes(tgt);
        if (strong.length) h += `<div class="foehint">${Core.isBoss(tgt) ? 'Jefe' : 'Esta ruta'}: pega fuerte ${strong.map(o => `<span class="type" style="background:${TYPE_COLORS[o.t]}">${TYPE_ES[o.t]}</span>`).join('')}</div>`;
        for (let i = 0; i < 6; i++) {
          const k = s.team[i];
          if (i >= s.slots) {
            h += i === s.slots ? `<div class="card locked"><div class="info"><b>Hueco ${i + 1} bloqueado</b><small>Un Pokémon más combatiendo a la vez</small></div>${costBtn(SLOT_COST[i], 'Abrir', 'slot')}</div>` : '';
            continue;
          }
          if (!k) { h += `<div class="card empty"><div class="info"><b>Hueco ${i + 1} libre</b><small>Pon a combatir a otro de tus Pokémon</small></div><button class="btn primary" data-act="pick" data-v="${i}">Elegir</button></div>`; continue; }
          const m = s.mons[k], rar = Core.RAR[m.dex], st = Core.stageOf(m.dex), kids = Core.CHILDREN[m.dex];
          const evo = kids && st < EVO_LVL.length ? `Evoluciona a Nv. ${EVO_LVL[st]}` : '';
          const t0 = DEX[m.dex].types[0], tier = Core.tierOf(m.lvl), mv = MOVES[Core.moveOf(m)];
          const next = tier + 1 < TIER_LV.length ? `Nuevo ataque a Nv. ${TIER_LV[tier + 1]}: ${MOVES[MOVE_TIERS[t0][tier + 1]].name}` : 'Ataque máximo';
          const b = buyN(m);
          h += `<div class="card" style="--rc:${RARITY[rar].color}">
            <img class="por" src="${por(m.dex, m.shiny)}" data-act="mon" data-v="${k}">
            <div class="info"><b>${m.shiny ? '<span class="shiny-tag">✨</span>' : ''}${DEX[m.dex].name} <small style="display:inline">Nv. ${m.lvl}</small></b>
            ${starsHtml(m.stars)} ${typeTags(m.dex)} <span data-effk="${k}"></span>
            <small class="natline">${natTxt(m)} · <span class="gr" style="background:${Core.ivGrade(m)[2]}">IV ${Math.round(Core.ivPct(m) * 100)}% · ${Core.ivGrade(m)[1]}</span></small>
            <small class="mv"><i style="background:${TYPE_COLORS[mv.type]}"></i>${mv.name} · ${fmt(Core.monDmg(m) / Core.monRate(m))} daño/s</small>
            <small class="evo">${evo ? evo + ' · ' : ''}${next}</small></div>
            <div class="acts">${costBtn(b.c, 'Subir +' + b.n, 'lvl', `data-v="${k}"`)}<div class="rowbtns">${itemChip(k, m)}<button class="btn small" data-act="pick" data-v="${i}">Cambiar</button></div></div></div>`;
        }
        const sy = Core.synergies();
        h += '<h3>Sinergias de equipo</h3>';
        h += sy.list.length ? sy.list.map(x => `<div class="syn on"><b>${x.name}</b><small>${x.txt}</small></div>`).join('') : '<p class="hint">Aún no tienes ninguna activa.</p>';
        h += '<p class="hint">Mismo tipo: 2 Pokémon +8%, 3 +20%, 4 +35%, 5 +55%, 6 +80% de daño a los de ese tipo. Diversidad: 4 tipos distintos +15%, 6 +30%. Legendarios: 2 +20%, 4 +50%. Shinies: 2 +10% monedas, 4 +25%. Veterano: todos con ★3 o más +25%.</p>';
        h += `<p class="hint">Consejo: los Pokémon hacen x2 de daño cuando su tipo es eficaz contra el enemigo (lo ves en cada tarjeta) y la mitad si se resiste. Naturaleza e IVs mejoran a cada Pokémon: las copias repetidas tiran IVs nuevos y te quedas con los mejores. Cada 25 niveles su daño se duplica y cada cierto nivel aprenden un ataque más potente.</p>`;
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
      sig: () => { const s = S(); return JSON.stringify([s.pity, s.pityE, s.bannerLost, Core.ticketPrice('poke'), Core.featuredEpic(), Core.featuredLegend(), Core.unlockedGens(), Core.freePullReady(), s.tk, Math.floor(s.dust / 10), s.eggs.map(e => [e.t, Core.eggReady(e)]), s.inc, Core.incCost()]); },
      html() {
        const s = S(), fe = Core.featuredEpic(), fl = Core.featuredLegend();
        let h = '<div class="tkgrid">' + Object.entries(TICKETS).map(([t, k]) => `<div class="tkbox" style="--tc:${k.color}">${ico(k.icon, 36)}<b>${s.tk[t]}</b><small>${k.name}</small>
          <button class="btn small primary" data-act="buytk" data-v="${t}" data-n="1" data-cost="${Core.ticketPrice(t)}" data-cur="${k.cur}">+1 ${ico(k.cur === 'gems' ? 'gem' : 'coin', 10)} ${fmt(Core.ticketPrice(t))}</button></div>`).join('') + '</div>';
        h += incubatorHtml();
        if (Core.freePullReady()) h += `<div class="feat free"><span>${ico('tkPoke', 48)}</span><div><b>¡Tirada diaria gratis!</b><small>Una Poké Ball gratis cada día, sin ticket</small></div><button class="btn primary" data-act="freepull">Abrir</button></div>`;
        const feat = (d, tag) => `<div class="feat"><span class="tagx">${tag}</span><img src="${por(d)}"><div><b>${DEX[d].name}</b><small>${RARITY[Core.RAR[d]].name}</small><br>${typeTags(d)}</div></div>`;
        h += `<h3>Destacados de la Bola Destacada</h3>` + feat(fl, 'LEGENDARIO · SEMANA') + feat(fe, 'ÉPICO · 3 DÍAS');
        h += `<div class="pity">Épico garantizado en <b>${Math.max(0, PITY_EPIC - s.pityE)}</b> tiradas · Legendario en <b>${Math.max(0, PITY - s.pity)}</b> (con tickets Super, Ultra o Maestro)${s.bannerLost ? '<br><b style="color:#ffd23f">¡El próximo legendario de la Bola Destacada será el destacado!</b>' : ''}<div class="bar"><i style="width:${s.pity / PITY * 100}%"></i></div></div>`;
        const ballCard = ([id, b]) => {
          const tk = TICKETS[b.ticket];
          return `<div class="ball-card"><span class="bi">${ico(b.icon, 48)}</span><b>${b.name}</b><p>${b.desc}</p>
            <div class="rates">${b.rates.map((r, k) => r ? `<span style="color:${RARITY[k].color}">${RARITY[k].name} ${r}%</span>` : '').join('')}</div>
            <div class="btns">
              <button class="btn primary" data-act="pull" data-v="${id}" data-n="1" data-cost="1" data-cur="tk:${b.ticket}">Abrir x1 ${ico(tk.icon, 14)} 1</button>
              <button class="btn primary" data-act="pull" data-v="${id}" data-n="10" data-cost="${Core.ticketCost(10)}" data-cur="tk:${b.ticket}">Abrir x10 ${ico(tk.icon, 14)} ${Core.ticketCost(10)}</button>
            </div></div>`;
        };
        const entries = Object.entries(BALLS);
        h += entries.filter(([id, b]) => !b.region && id !== 'master').map(ballCard).join('');
        h += ballCard(['master', BALLS.master]);
        h += '<h3>Bolas regionales</h3><p class="hint">Solo Pokémon de la región (usan 1 Ticket Super). Se abren al llegar a ella.</p>';
        let locked = 0;
        for (const [id, b] of entries.filter(([, b]) => b.region)) {
          if (!Core.ballAvailable(id)) { if (!locked++) h += `<div class="ball-row locked"><span>${ico(b.icon, 24)}</span><b>${b.name}</b><small>Llega a ${REGIONS[b.gen - 1].name} (etapa ${REGIONS[b.gen - 1].first * 10 + 1})</small></div>`; continue; }
          h += `<div class="ball-row"><span>${ico(b.icon, 24)}</span><b>${b.name}</b>
            <button class="btn small primary" data-act="pull" data-v="${id}" data-n="1" data-cost="1" data-cur="tk:super">x1 ${ico('tkSuper', 12)} 1</button>
            <button class="btn small primary" data-act="pull" data-v="${id}" data-n="10" data-cost="${Core.ticketCost(10)}" data-cur="tk:super">x10 ${ico('tkSuper', 12)} ${Core.ticketCost(10)}</button></div>`;
        }
        h += `<h3>Taller de polvo estelar <small style="color:var(--dim)">${ico('dust', 14)} ${fmt(s.dust)}</small></h3><p class="hint">Cada copia repetida da polvo. Cámbialo por tickets:</p><div class="tkgrid">` + Object.entries(TICKETS).map(([t, k]) => `<button class="btn small" data-act="dusttk" data-v="${t}" data-cost="${TICKET_DUST[t]}" data-cur="dust">${ico(k.icon, 16)} ${fmt(TICKET_DUST[t])} ${ico('dust', 12)}</button>`).join('') + '</div>';
        h += `<p class="hint">Los Pokémon solo se consiguen en el gacha. Los tickets caen de los Pokémon derrotados, de los jefes, las misiones y los logros, o se compran con monedas y gemas. x10 cuesta 9 tickets y garantiza un Pokémon raro o mejor. Las copias repetidas suben estrellas (★ multiplica el daño). 1 de cada 100 es shiny (+50% de daño).</p>`;
        return h;
      },
    },
    dex: {
      sig: () => { const s = S(); return JSON.stringify([Object.keys(s.mons).length, Object.keys(s.seen).length, s.team, dexFilter, Core.unlockedGens(), Object.values(s.mons).map(m => m.dex + ':' + m.stars + ':' + m.lvl + ':' + (m.shiny ? 1 : 0) + (m.shinyOwned ? 1 : 0) + ':' + (m.copies >= STAR_COPIES[m.stars] ? 1 : 0))]); },
      html() {
        const s = S();
        const n = Core.dexCount();
        const filters = [['all', 'Todos'], ['mine', 'Solo los míos']].concat(REGIONS.filter(r => r.gen).map(r => [String(r.gen), r.name]));
        let h = `<div class="dexhead"><span>Registrados <b style="color:#fff">${n}/${POKEDEX.length}</b> · +${n}% de daño</span></div>
          <button class="dd" data-act="dexdd">${filters.find(f => f[0] === dexFilter)[1]}<i></i></button><div class="dexgrid">`;
        for (const p of POKEDEX) {
          if (/^[1-9]$/.test(dexFilter)) { if (p.gen !== +dexFilter) continue; }
          const base = String(Core.baseOf(p.dex)), own = s.mons[base], seen = s.seen[p.dex];
          const cur = own && own.dex === p.dex, locked = !Core.genUnlocked(p.gen);
          if (dexFilter === 'mine' && !(own && seen)) continue;
          const canStar = cur && own.stars < 5 && own.copies >= STAR_COPIES[own.stars];
          const attr = own && seen ? `data-act="mon" data-v="${base}"` : seen ? `data-act="seen" data-v="${p.dex}"` : locked ? 'data-act="locked"' : 'data-act="noown"';
          h += `<button class="${seen ? '' : 'unk'} ${cur && s.team.includes(base) ? 'inteam' : ''}" style="--rc:${cur ? RARITY[Core.RAR[p.dex]].color : seen ? '#2a3f8a' : '#1d2a5a'}" ${attr}>
            ${cur ? `<span class="lv">${own.lvl}</span>` : ''}${cur && own.shinyOwned ? '<span class="sh">✨</span>' : ''}${seen ? `<img src="${por(p.dex, cur && own.shiny)}" loading="lazy">` : `<span class="q">${locked ? '🔒' : '?'}</span>`}<span class="n">${seen ? (canStar ? '⬆ ' : '') + p.name : '#' + p.dex}</span></button>`;
        }
        return h + '</div><p class="hint">Los Pokémon que no tienes solo se consiguen en el gacha.</p>';
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

  // ---------------- desplegables propios ----------------
  let ddEl = null;
  function closeDD() { if (ddEl) { ddEl.remove(); ddEl = null; } }
  function openDD(anchor, options, value, onPick) {
    closeDD();
    const r = anchor.getBoundingClientRect(), pop = document.createElement('div');
    pop.className = 'dd-pop';
    pop.style.left = r.left + 'px'; pop.style.top = (r.bottom + 4) + 'px'; pop.style.minWidth = r.width + 'px';
    pop.innerHTML = options.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(value) ? 'on' : ''}">${l}</button>`).join('');
    pop.onclick = e => { const b = e.target.closest('button'); if (b) { closeDD(); onPick(b.dataset.v); } };
    document.body.appendChild(pop); ddEl = pop;
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
      case 'slot': if (Core.buySlot()) { Audio8.play('item'); banner('¡Nuevo hueco en el equipo!', 'Elige qué Pokémon combate en él', '#7ff0a0'); autoFill(); } break;
      case 'up': if (Core.buyUp(v)) Audio8.play('levelup'); break;
      case 'tab': setTab(v); return;
      case 'pick': pickModal(+v); return;
      case 'item': itemModal(v); return;
      case 'bag': bagModal(); return;
      case 'pull': doPull(v, +el.dataset.n); break;
      case 'best': {
        const tgt = s.kills >= 10 && !s.auto && !Core.isBoss(s.stage) ? s.stage + 1 : s.stage;
        const keys = Core.bestTeam(tgt, s.slots);
        if (keys.join() === s.team.join()) { toast('Ya tienes el mejor equipo para esta ruta'); break; }
        Core.setTeamList(keys); Audio8.play('swap'); toast('Equipo ideal para ' + (Core.isBoss(tgt) ? 'el jefe' : 'esta ruta'));
        break;
      }
      case 'hatch': { const r = Core.hatch(+v); if (r) { Core.save(); playReveal([r], 'egg' + r.egg, 'egg' + r.egg, EGGS[r.egg].name); return; } break; }
      case 'eggfront': Core.moveEgg(+v); Audio8.play('swap'); break;
      case 'buyegg': if (Core.buyEgg(+v)) Audio8.play('item'); else Audio8.play('error'); break;
      case 'buyinc': if (Core.buyInc()) { Audio8.play('levelup'); toast('¡Nueva incubadora!'); } else Audio8.play('error'); break;
      case 'freepull': doPull('poke', 1, true); break;
      case 'buytk': if (Core.buyTicket(v, +el.dataset.n)) Audio8.play('item'); else Audio8.play('error'); break;
      case 'dusttk': if (Core.dustTicket(v)) Audio8.play('ticket'); else Audio8.play('error'); break;
      case 'shop': if (Core.buyShop(v)) Audio8.play('levelup'); break;
      case 'dexdd': {
        const filters = [['all', 'Todos'], ['mine', 'Solo los míos']].concat(REGIONS.filter(r => r.gen).map(r => [String(r.gen), r.name]));
        openDD(el, filters, dexFilter, val => { dexFilter = val; sig = ''; refresh(true); });
        return;
      }
      case 'mon': monModal(v); return;
      case 'seen': toast(DEX[v].name + ': lo has visto, pero aún no lo tienes'); return;
      case 'noown': toast('Solo se consigue en el gacha'); return;
      case 'locked': toast('Región bloqueada: llega a ella para descubrir sus Pokémon'); return;
      case 'daily': { const g = Core.claimDaily(); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + ' gemas y tickets'); } break; }
      case 'quest': { const g = Core.claimQuest(+v); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + ' gemas y ticket'); } break; }
      case 'wquest': { const g = Core.claimQuest(+v, true); if (g) { Audio8.play('ticket'); toast(ico('gem', 18) + ' +' + g + ' gemas y 2 tickets Super'); } break; }
      case 'ach': { const g = Core.claimAch(v); if (g) { Audio8.play('rare'); toast(ico('trophy', 18) + ' +' + g + ' gemas y tickets'); } break; }
      case 'achall': achShowAll = !achShowAll; break;
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

  // ---------------- cambiar Pokémon del equipo ----------------
  let pickSlot = 0, pickSort = 'dps', pickQ = '';
  const PICK_SORTS = [['dps', 'Por daño'], ['lvl', 'Por nivel'], ['rar', 'Por rareza'], ['num', 'Por número'], ['star', 'Por estrellas']];
  function pickList() {
    const s = S();
    let list = Object.entries(s.mons).map(([k, m]) => ({ k, m, dps: Core.monDmg(m) / Core.monRate(m) }));
    const q = pickQ.trim().toLowerCase();
    if (q) list = list.filter(o => DEX[o.m.dex].name.toLowerCase().includes(q));
    const key = { dps: o => -o.dps, lvl: o => -o.m.lvl, rar: o => -Core.RAR[o.m.dex] * 1e6 - o.m.lvl, num: o => o.m.dex, star: o => -o.m.stars * 1e6 - o.m.lvl }[pickSort];
    list.sort((a, b) => key(a) - key(b));
    if (!list.length) return '<p class="hint">No hay ningún Pokémon con ese nombre.</p>';
    return '<div class="pickgrid">' + list.map(({ k, m, dps }) => {
      const at = s.team.indexOf(k);
      return `<button class="pk ${at === pickSlot ? 'cur' : ''}" data-k="${k}" style="--rc:${RARITY[Core.RAR[m.dex]].color}"><img src="${por(m.dex, m.shiny)}" loading="lazy">
        <b>${m.shiny ? '✨' : ''}${DEX[m.dex].name}</b><small>Nv. ${m.lvl} · ${starsHtml(m.stars)}</small><small>${fmt(dps)}/s</small>${at >= 0 ? `<span class="slot">${at + 1}</span>` : ''}</button>`;
    }).join('') + '</div>';
  }
  function pickModal(slot) {
    pickSlot = slot;
    openModal(`<h2>Hueco ${slot + 1}: elige un Pokémon</h2>
      <div class="pickbar"><input class="search" id="pk-q" placeholder="Buscar por nombre…" value="${pickQ.replace(/"/g, '')}" autocomplete="off"><button class="dd" id="pk-sort">${PICK_SORTS.find(x => x[0] === pickSort)[1]}<i></i></button></div>
      <div class="pickwrap" id="pk-list">${pickList()}</div>
      <p class="hint">Si eliges uno que ya está en otro hueco, se intercambian.</p>
      <div class="row">${S().team[slot] && S().team.length > 1 ? '<button class="btn danger" id="pk-rm">Quitar del equipo</button>' : ''}<button class="btn" id="pk-x">Cerrar</button></div>`);
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
    openModal(`<h2>Objeto de ${DEX[m.dex].name}</h2>
      ${cur ? `<div class="curitem">${itemCard(cur, '<em>Equipado</em>')}</div>` : '<p class="hint">No lleva ningún objeto.</p>'}
      <div class="pickwrap itemlist2" id="it-list">${list.length ? list.map(it => { const h = holderOf(it.u); return itemCard(it, h && h !== m ? `<em>Lo lleva ${DEX[h.dex].name}</em>` : ''); }).join('') : '<p class="hint">Aún no tienes objetos. Los sueltan los jefes y, con suerte, los Pokémon salvajes.</p>'}</div>
      <div class="row">${cur ? '<button class="btn danger" id="it-rm">Quitar objeto</button>' : ''}<button class="btn" id="it-x">Cerrar</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#it-x').onclick = closeModal;
    if ($('#it-rm')) $('#it-rm').onclick = () => { Core.unequip(key); Audio8.play('swap'); Core.save(); closeModal(); refresh(true); };
    $('#it-list').onclick = e => { const b = e.target.closest('.it'); if (!b) return; Core.equip(key, +b.dataset.u); Audio8.play('item'); Core.save(); closeModal(); refresh(true); };
  }
  function bagModal() {
    const s = S(), list = s.inv.slice().sort((a, b) => b.rar - a.rar || a.id.localeCompare(b.id));
    openModal(`<h2>Mochila · ${list.length} objetos</h2>
      <div class="row" style="margin:0 0 8px"><button class="btn small" id="bag-spare">Reciclar comunes sin usar</button><button class="btn small primary" id="bag-buy" ${s.dust >= ITEM_DUST_COST ? '' : 'disabled'}>Objeto al azar ${ico('dust', 12)} ${ITEM_DUST_COST}</button></div>
      <p class="hint" style="margin:0 0 6px">Polvo estelar: ${ico('dust', 14)} ${fmt(s.dust)} · Toca un objeto para reciclarlo.</p>
      <div class="pickwrap itemlist2" id="bag-list">${list.length ? list.map(it => { const h = holderOf(it.u); return itemCard(it, `<em>${h ? 'Lo lleva ' + DEX[h.dex].name : '+' + ITEM_RAR[it.rar].dust + ' polvo'}</em>`); }).join('') : '<p class="hint">Aún no tienes objetos. Los sueltan los jefes y, con suerte, los Pokémon salvajes.</p>'}</div>
      <div class="row"><button class="btn" id="bag-x">Cerrar</button></div>`);
    $('#modal-box').classList.add('wide');
    $('#bag-x').onclick = closeModal;
    $('#bag-spare').onclick = () => { const r = Core.recycleSpare(); Audio8.play(r.n ? 'ticket' : 'error'); if (r.n) toast(`Reciclados ${r.n} objetos: +${r.d} polvo`); Core.save(); bagModal(); refresh(true); };
    $('#bag-buy').onclick = () => { const it = Core.buyItem(); if (it) { Audio8.play('item'); banner('¡' + itemName(it) + '!', ITEM_RAR[it.rar].name + ' · ' + itemDesc(it), ITEM_RAR[it.rar].color); Core.save(); bagModal(); refresh(true); } };
    $('#bag-list').onclick = e => {
      const b = e.target.closest('.it'); if (!b) return;
      const it = s.inv.find(i => i.u === +b.dataset.u); if (!it) return;
      const h = holderOf(it.u);
      if (h) { toast('Lo lleva ' + DEX[h.dex].name + ': quítaselo primero'); return; }
      const d = Core.recycleItem(it.u); Audio8.play('ticket'); toast('+' + d + ' polvo'); Core.save(); bagModal(); refresh(true);
    };
  }

  // ---------------- tutorial inicial ----------------
  const TUT = [
    { sel: '#arena', text: 'Tu Pokémon combate solo contra los Pokémon salvajes de cada ruta. ¡Toca a los enemigos para hacer daño extra!', wait: () => S().stats.taps >= 3, hint: 'Toca al enemigo 3 veces' },
    { sel: '.cur.coins', text: 'Cada Pokémon derrotado te da monedas. Mira cómo sube el contador.', next: 1 },
    { sel: '.a-top', text: 'Cada 10 victorias pasas de etapa. En la décima hay un jefe con tiempo limitado: si tu equipo aún no es lo bastante fuerte, sigue combatiendo en la etapa anterior y retará al jefe solo cuando esté listo.', next: 1 },
    { tab: 'team', sel: '[data-act="lvl"]', text: 'Gasta tus monedas en subir de nivel a tu Pokémon. Aprenderá ataques más potentes y evolucionará. ¡Sube un nivel!', wait: () => S().stats.levels >= 1, hint: 'Pulsa «Subir»', pre: () => { if (S().coins < 12) S().coins = 12; } },
    { sel: '#tabs [data-tab="gacha"]', text: 'Los Pokémon solo se consiguen en el gacha. Abre la pestaña.', wait: () => tab === 'gacha', hint: 'Toca «Gacha»' },
    { sel: '[data-act="pull"][data-v="poke"][data-n="1"]', text: 'Las bolas se abren con tickets. Tienes Tickets Poké de regalo. ¡Abre una Poké Ball!', wait: () => S().stats.pulls >= 1 && $('#gacha-fx').classList.contains('hidden'), hint: 'Pulsa «Abrir x1»' },
    { sel: '.tkgrid', text: 'Aquí ves tus tickets. Caen de los jefes, los Pokémon derrotados, las misiones y los logros, y también puedes comprarlos con monedas o gemas.', next: 1 },
    { sel: '.incubator', text: 'Los huevos eclosionan con tus victorias, incluso sin conexión. Los de las incubadoras avanzan; ¡ya tienes uno de regalo! Al abrirlos salen Pokémon con IVs altos y más opciones de ser shiny.', next: 1 },
    { tab: 'team', sel: '[data-act="pick"]', text: 'Cuando tengas más Pokémon, cámbialos desde aquí. Abre más huecos para que combatan varios a la vez.', next: 1 },
    { sel: '[data-act="best"]', text: 'Cada Pokémon tiene tipo, naturaleza e IVs. Los golpes súper eficaces hacen x2: mira las etiquetas ▲ de cada tarjeta, y «Mejor equipo» elige solo a los más eficaces para la ruta.', next: 1 },
    { sel: '.itemchip', text: 'Cada Pokémon puede llevar un objeto. Los jefes los sueltan y están en la Mochila.', next: 1 },
    { sel: '#skills', text: 'Tres habilidades activas: Furia (más daño), Fiebre del Oro (más monedas) y Lluvia de Tickets. Úsalas cuando estén listas.', next: 1 },
    { sel: '#tabs [data-tab="quests"]', text: 'Las misiones diarias y semanales, los logros y la recompensa diaria te dan gemas y tickets. ¡Entra cada día!', next: 1 },
    { sel: '#tabs [data-tab="league"]', text: 'Al llegar a la etapa 60 podrás entrar en la Liga: reinicias el viaje a cambio de bonus permanentes y una tienda de mejoras.', next: 1 },
    { text: '¡Listo! Ahora te toca a ti: llega lo más lejos que puedas, colecciona los 971 Pokémon y completa la Pokédex. Puedes repetir este tutorial desde Ajustes.', next: 1, last: 1 },
  ];
  let tutI = -1, tutRaf = 0, tutEl = null;
  function tutStart(force) {
    if (!force && S().tutDone) return;
    tutEnd(true);
    tutEl = document.createElement('div'); tutEl.id = 'tut'; tutEl.className = 'tut';
    tutEl.innerHTML = '<i class="tb"></i><i class="tb"></i><i class="tb"></i><i class="tb"></i><div class="th"></div><div class="tc"><small class="tp"></small><p></p><em class="tw"></em><div class="tbtn"><button class="btn small" id="tut-skip">Saltar tutorial</button><button class="btn primary small" id="tut-next">Siguiente</button></div></div>';
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
    tutEl.querySelector('.tp').textContent = 'Paso ' + (tutI + 1) + ' de ' + TUT.length;
    tutEl.querySelector('.tw').textContent = st.hint || '';
    $('#tut-next').style.display = st.wait ? 'none' : '';
    $('#tut-next').textContent = st.last ? '¡A jugar!' : 'Siguiente';
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
  function playReveal(res, ballIcon, tkIcon, title) {
    const n = res.length;
    autoFill();
    Core.save();
    Core.setPaused(true);
    const fx = $('#gacha-fx'), best = Math.max(...res.map(r => r.rar)), anyShiny = res.some(r => r.shiny);
    const col = RARITY[best].color;
    fx.className = 'gacha-fx';
    fx.innerHTML = `<div class="gx-rays" style="--c:#6a8aff"></div><div class="gx-stage"><div class="gx-ticket">${ico(tkIcon, 64)}</div><div class="gx-ball" id="gx-ball"><div class="gx-aura" id="gx-aura"></div>${ico(ballIcon, 120)}</div><div class="gx-txt" id="gx-txt">${ballIcon.startsWith('egg') ? 'Eclosionando ' : 'Abriendo '}${title}…</div></div><button class="gx-skip" id="gx-skip">Saltar</button>`;
    const aura = $('#gx-aura'), ballEl = $('#gx-ball'), steps = ['#ffffff', best >= 2 ? RARITY[Math.min(best, 3)].color : '#ffffff', best >= 4 ? RARITY[4].color : col, col];
    const timers = [];
    let done = false;
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    later(() => Audio8.play('shake'), 700);
    [0, 1, 2].forEach(i => later(() => { Audio8.play('shake'); aura.style.setProperty('--ac', steps[i + 1]); aura.style.setProperty('--as', 1 + i * 0.5); ballEl.classList.add('s' + (i + 1)); if ($('#gx-txt')) $('#gx-txt').textContent = ['¡Se mueve!', '¡Algo bueno se acerca!', '¡Está a punto!'][i]; }, 900 + i * 650));
    later(reveal, 3000);
    $('#gx-skip').onclick = () => { if (!done) reveal(); };
    function reveal() {
      if (done) return; done = true; timers.forEach(clearTimeout);
      Audio8.play(best >= 5 ? 'legend' : best >= 4 ? 'rare' : 'pop');
      if (anyShiny) setTimeout(() => Audio8.play('rare'), 500);
      const label = best >= 5 ? '¡LEGENDARIO!' : best >= 4 ? '¡ÉPICO!' : best >= 3 ? '¡RARO!' : '';
      fx.classList.toggle('legend', best >= 5); fx.classList.toggle('epic', best === 4);
      let cards = '';
      res.forEach((r, j) => {
        const m = S().mons[r.base];
        cards += `<div class="pull r${r.rar} ${r.shiny ? 'shiny' : ''}" style="--rc:${RARITY[r.rar].color};animation-delay:${0.15 + j * (n > 1 ? 0.16 : 0)}s">
          ${r.isNew ? '<span class="new">¡NUEVO!</span>' : ''}${r.shiny ? '<span class="shtag">✨ SHINY</span>' : ''}
          ${n === 1 ? '<canvas class="pv" id="pv" width="128" height="128"></canvas>' : `<img src="${por(r.base, r.shiny)}">`}
          <b>${DEX[r.base].name}</b><small>${RARITY[r.rar].name}</small>
          <span class="dup nat">${Core.natOf({ nat: r.nat }).name} · IV ${Math.round(Core.ivPct(m) * 100)}% · <span class="gr" style="background:${r.grade[2]}">${r.grade[1]}</span></span>
          ${r.ivUp ? `<span class="dup" style="color:#7ff0a0">¡IVs mejorados! ${Math.round(r.ivUp.from * 100)}% → ${Math.round(r.ivUp.to * 100)}%</span>` : ''}
          ${r.isNew ? '' : `<span class="dup">+1 copia (${m.copies}/${m.stars < 5 ? STAR_COPIES[m.stars] : '★5'}) · +${r.dust} ${ico('dust', 12)}</span>`}
          ${r.newShiny && !r.isNew ? '<span class="dup" style="color:#fff3a8">¡Versión shiny desbloqueada!</span>' : ''}
          <i class="gl"></i></div>`;
      });
      fx.innerHTML = `<div class="gx-rays on" style="--c:${col}"></div><div class="flash" style="--fc:${col}"></div>
        ${label ? `<div class="gx-label" style="--c:${col}">${label}</div>` : ''}${anyShiny ? '<div class="gx-label sh">✨ ¡SHINY! ✨</div>' : ''}
        <div class="pulls ${n === 1 ? 'one' : ''}">${cards}</div><button class="btn big primary" id="pull-ok" style="animation:pin .4s ${0.4 + n * 0.16}s backwards">¡Genial!</button>`;
      $('#pull-ok').onclick = close;
      if (n === 1) { pvT = 0; pvMon = { dex: res[0].dex, shiny: res[0].shiny }; Sprites.preload(res[0].dex, res[0].shiny); } else pvMon = null;
      if (best >= 5) { const st = $('#stage'); }
    }
    function close() { pvMon = null; fx.classList.add('hidden'); fx.className = 'gacha-fx hidden'; Core.setPaused(false); refresh(true); }
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
  function evolveAnim(from, to, shiny) { evoQueue.push({ from, to, shiny }); if (!evoRun) nextEvo(); }
  function nextEvo() {
    const ev = evoQueue.shift();
    if (!ev) { evoRun = false; Core.setPaused(false); $('#evo').classList.add('hidden'); return; }
    evoRun = true; Core.setPaused(true);
    const box = $('#evo'), cv = $('#evo-cv'), g = cv.getContext('2d'), txt = $('#evo-txt'), ok = $('#evo-ok');
    box.classList.remove('hidden', 'done'); ok.classList.add('hidden');
    Sprites.preload(ev.to, ev.shiny); Sprites.preload(ev.from, ev.shiny);
    txt.innerHTML = `¿Eh? ¡<b>${DEX[ev.from].name}</b> está evolucionando!`;
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
      if (t >= 3.6 && !flashed) { flashed = true; box.classList.add('flash'); setTimeout(() => box.classList.remove('flash'), 600); Audio8.play('evolve'); for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, sp = rnd(30, 110); parts.push({ x: cx, y: cy - 44, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, m: 1, c: pick(['#ffffff', '#ffd23f', '#9fe0ff', '#ff9ed8']) }); } txt.innerHTML = `¡<b>${DEX[ev.from].name}</b> ha evolucionado en <b style="color:#ffd23f">${DEX[ev.to].name}</b>!`; }
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
    const rar = Core.RAR[m.dex], p = DEX[m.dex], st = p.stats;
    const need = m.stars < 5 ? STAR_COPIES[m.stars] : 0;
    const inTeam = s.team.indexOf(key);
    let slots = '';
    for (let i = 0; i < s.slots; i++) {
      const k = s.team[i];
      slots += `<button data-slot="${i}" class="${k === key ? 'cur' : ''}" title="Hueco ${i + 1}">${k ? `<img src="${por(s.mons[k].dex, s.mons[k].shiny)}">` : '+'}</button>`;
    }
    const t0 = p.types[0], tier = Core.tierOf(m.lvl);
    const moves = MOVE_TIERS[t0].map((id, i) => `<span class="mvchip ${i <= tier ? 'on' : ''}" style="--tc:${TYPE_COLORS[MOVES[id].type]}">${MOVES[id].name}<small>Nv. ${TIER_LV[i]}</small></span>`).join('');
    openModal(`<h2>${m.shiny ? '✨ ' : ''}${p.name}</h2>
      <div class="monbig"><canvas id="mon-cv" width="72" height="72"></canvas><div class="stats">
        <div style="color:${RARITY[rar].color};font-size:16px">${RARITY[rar].name} ${starsHtml(m.stars)}</div>${typeTags(m.dex)}
        <div>Nivel <b>${m.lvl}</b> · Daño/s <b>${fmt(Core.monDmg(m) / Core.monRate(m))}</b></div>
        <div>PS ${st.hp} · Atq ${st.atk} · Def ${st.def} · AtE ${st.spa} · DfE ${st.spd} · Vel ${st.spe}</div>
        <div>Copias: <b>${m.copies}</b>${need ? ' / ' + need + ' para ★' + (m.stars + 1) + ' (daño x' + STAR_MULT[m.stars + 1] + ')' : ' · ¡Estrellas al máximo!'}</div>
      </div></div>
      <div class="mvlist">${moves}</div>
      ${genesHtml(m)}
      <div class="row">${need ? `<button class="btn primary" id="m-star" ${m.copies >= need ? '' : 'disabled'}>Subir a ★${m.stars + 1}</button>` : ''}${m.shinyOwned ? `<button class="btn" id="m-shiny">Forma: ${m.shiny ? '✨ Shiny' : 'Normal'}</button>` : ''}</div>
      <p class="hint" style="margin-top:12px">${inTeam >= 0 ? 'Está en tu equipo. Toca otro hueco para moverlo.' : 'Elige el hueco del equipo donde quieres ponerlo:'}</p>
      <div class="slotpick">${slots}</div>
      <div class="row"><button class="btn" id="m-close">Cerrar</button></div>`);
    monCv = $('#mon-cv'); monCv.dataset.k = key; Sprites.preload(m.dex, m.shiny);
    $('#m-close').onclick = closeModal;
    $$('[data-iv]').forEach(b => b.onclick = () => { if (Core.trainIv(key, b.dataset.iv)) { Audio8.play('levelup'); Core.save(); monModal(key); refresh(true); } else Audio8.play('error'); });
    if ($('#m-natre')) $('#m-natre').onclick = () => { if (Core.rerollNat(key)) { Audio8.play('item'); Core.save(); monModal(key); refresh(true); } else Audio8.play('error'); };
    if ($('#m-natset')) $('#m-natset').onclick = e => openDD(e.currentTarget, NATURES.map(n => [n.id, n.up ? `${n.name} · ▲${NAT_AXES[n.up]} ▼${NAT_AXES[n.down]}` : n.name + ' · neutra']), m.nat, v => { if (Core.setNat(key, +v)) { Audio8.play('item'); Core.save(); monModal(key); refresh(true); } else Audio8.play('error'); });
    if ($('#m-shiny')) $('#m-shiny').onclick = () => { Core.toggleShiny(key); Audio8.play('swap'); Core.save(); monModal(key); refresh(true); };
    if ($('#m-star')) $('#m-star').onclick = () => { if (Core.starUp(key)) { Audio8.play('legend'); banner('¡' + p.name + ' sube a ★' + m.stars + '!', 'Su daño se multiplica por ' + STAR_MULT[m.stars], '#ffd23f'); Core.save(); monModal(key); refresh(true); } };
    $$('.slotpick button').forEach(b => b.onclick = () => { Core.setTeam(+b.dataset.slot, key); Audio8.play('swap'); Core.save(); monModal(key); refresh(true); });
  }
  const tchip = t => `<span class="type" style="background:${TYPE_COLORS[t]}">${TYPE_ES[t]}</span>`;
  function genesHtml(m) {
    const s = S(), nt = Core.natOf(m), gr = Core.ivGrade(m);
    const strong = Object.keys(TYPE_NAMES).filter(t => Math.max(...DEX[m.dex].types.map(a => Core.typeEff(a, [t]))) >= 2);
    const ivRows = ['d', 's', 'c'].map(k => `<div class="ivrow"><span>${IV_NAMES[k]}</span><div class="ivbar"><i style="width:${m.iv[k] / IV_MAX * 100}%"></i></div><b>${m.iv[k]}</b>${m.iv[k] < IV_MAX ? `<button class="btn small" data-iv="${k}" ${s.dust >= ivTrainCost(m.iv[k]) ? '' : 'disabled'} title="Entrenar este IV (+${IV_TRAIN_STEP})">+${IV_TRAIN_STEP} ${ico('dust', 10)}${ivTrainCost(m.iv[k])}</button>` : '<small class="max">MÁX</small>'}</div>`).join('');
    return `<div class="genes"><div class="genehead"><span>Naturaleza <b>${natTxt(m)}</b></span><span class="dustnum">${ico('dust', 14)} ${fmt(s.dust)}</span></div>
      <div class="row tight"><button class="btn small" id="m-natre" ${s.dust >= NAT_REROLL_COST ? '' : 'disabled'}>Cambiar al azar ${ico('dust', 10)}${NAT_REROLL_COST}</button><button class="btn small" id="m-natset" ${s.dust >= NAT_CHOOSE_COST ? '' : 'disabled'}>Elegir ${ico('dust', 10)}${NAT_CHOOSE_COST}</button></div>
      <div class="genehead"><span>IVs</span><span class="gr" style="background:${gr[2]}">${Math.round(Core.ivPct(m) * 100)}% · ${gr[1]}</span></div>${ivRows}
      <div class="foehint">${DEX[m.dex].name} pega fuerte a ${strong.length ? strong.map(tchip).join('') : '—'}</div></div>`;
  }
  function drawMonCv(t) {
    if (!monCv || !monCv.isConnected) { monCv = null; return; }
    const m = S().mons[monCv.dataset.k];
    const g = monCv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 72, 72);
    if (m) Sprites.draw(g, m.dex, m.shiny, 'idle', Math.PI / 2, t, 36, 56, 1, {});
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
      h += `<button class="maprow ${ri === cur ? 'cur' : ''}" data-go="${Math.min(base + 8, s.maxStage)}" ${open ? '' : 'disabled'}><b>${r.name}</b><small>${open ? 'Etapas ' + base + '–' + (base + 9) : 'Bloqueada'}</small><small class="rt">Tipos: ${r.types.map(tchip).join('')} · Usa: ${Core.strongTypes(base).map(o => tchip(o.t)).join('') || '—'}</small><span class="mb"><img src="${por(r.boss.dex)}" class="px">${done ? '✓ ' : ''}${r.boss.who}</span></button>`;
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
    const st = S().settings;
    const slider = (k, label, icon) => `<div class="setrow"><span class="sl">${ico(icon, 24)}<b>${label}</b></span><div class="slider" data-k="${k}" style="--v:${st[k]}"><div class="trk"><i></i><u></u></div><em>${Math.round(st[k] * 100)}%</em></div></div>`;
    const tog = (k, label, sub) => `<div class="setrow"><span class="sl"><b>${label}</b><small>${sub}</small></span><button class="tog ${st[k] ? 'on' : ''}" data-k="${k}"><i></i></button></div>`;
    openModal(`<div class="set"><h2>${ico('gear', 32)} Ajustes</h2>
      <div class="sset"><h4>Sonido</h4>${slider('music', 'Música', 'sound')}${slider('sfx', 'Efectos', 'ticket')}</div>
      <div class="sset"><h4>Combate</h4>${tog('nums', 'Números de daño', 'Muestra el daño y las monedas sobre el enemigo')}${tog('bigNums', 'Números grandes', 'Más tamaño para verlos mejor')}${tog('shake', 'Temblor de pantalla', 'En críticos y jefes')}${tog('autoBoss', 'Reintentar jefes solo', 'Vuelve a retar al jefe cuando tu equipo tenga fuerza para vencerlo')}</div>
      <div class="sset"><h4>Partida</h4><div class="row" style="margin:0"><button class="btn" id="s-exp">Exportar</button><button class="btn" id="s-imp">Importar</button><button class="btn danger" id="s-wipe">Borrar</button></div>
        <p class="hint" style="margin:8px 0 0">Tu partida se guarda sola en este navegador. Exporta un código para llevarla a otro dispositivo.</p></div>
      <div class="sset kofi-box"><h4>Apoya el proyecto</h4><p class="hint" style="margin:0 0 8px">PokéIdle es gratis y lo hace una sola persona. Si te gusta, puedes invitarme a un café.</p><a class="kofi" href="${KOFI_URL}" target="_blank" rel="noopener noreferrer">${ico('cup', 24)} Apoyar en Ko-fi</a></div>
      <div class="row"><button class="btn" id="s-tut">Ver el tutorial</button><button class="btn big primary" id="s-ok">Listo</button></div>
      <p class="fine">Sprites: PMD SpriteCollab (CC BY-NC 4.0) · Escenarios e iconos adaptados de pokesurvivor (MIT) · Pokémon © Nintendo/Creatures/GAME FREAK</p></div>`);
    $$('.slider').forEach(sl => {
      const k = sl.dataset.k, trk = sl.querySelector('.trk');
      const set = e => { const r = trk.getBoundingClientRect(), v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); st[k] = Math.round(v * 20) / 20; sl.style.setProperty('--v', st[k]); sl.querySelector('em').textContent = Math.round(st[k] * 100) + '%'; Audio8.setVolumes(); };
      sl.onpointerdown = e => { sl.setPointerCapture(e.pointerId); set(e); sl.onpointermove = set; };
      sl.onpointerup = () => { sl.onpointermove = null; if (k === 'sfx') Audio8.play('coin'); Core.save(); };
    });
    $$('.tog').forEach(t => t.onclick = () => { st[t.dataset.k] = !st[t.dataset.k]; t.classList.toggle('on', st[t.dataset.k]); Audio8.play('click'); Core.save(); applySettings(); });
    $('#s-ok').onclick = () => { Core.save(); closeModal(); };
    $('#s-tut').onclick = () => { closeModal(); setTab('team'); tutStart(true); };
    $('#s-exp').onclick = () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(S()))));
      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
      openModal(`<h2>Exportar partida</h2><p class="hint">Copiado al portapapeles. Guarda este código:</p><textarea class="search area" readonly id="code">${code}</textarea><div class="row"><button class="btn primary" id="e-ok">Cerrar</button></div>`);
      $('#code').onfocus = e => e.target.select(); $('#e-ok').onclick = settings;
    };
    $('#s-imp').onclick = () => {
      openModal(`<h2>Importar partida</h2><p class="hint">Pega aquí el código exportado. Sustituirá tu partida actual.</p><textarea class="search area" id="code" placeholder="Pega el código…"></textarea><p class="hint" id="imp-err" style="color:#ff8080"></p><div class="row"><button class="btn" id="i-no">Cancelar</button><button class="btn primary" id="i-yes">Importar</button></div>`);
      $('#i-no').onclick = settings;
      $('#i-yes').onclick = () => {
        try { const d = JSON.parse(decodeURIComponent(escape(atob($('#code').value.trim())))); if (!d || d.v !== 1 || !d.mons) throw 0; localStorage.setItem('pokeidle.save.v1', JSON.stringify(d)); location.reload(); }
        catch (e) { $('#imp-err').textContent = 'Ese código no es válido.'; }
      };
    };
    $('#s-wipe').onclick = () => {
      openModal(`<h2>¿Borrar todo?</h2><p>Perderás todos tus Pokémon y tu progreso.</p><div class="row"><button class="btn" id="w-no">No</button><button class="btn danger" id="w-yes">Sí, borrar</button></div>`);
      $('#w-no').onclick = settings;
      $('#w-yes').onclick = () => { Core.wipe(); location.reload(); };
    };
  }
  function applySettings() { const l = $('#dmg-layer'); if (l) { l.classList.toggle('big', S().settings.bigNums !== false); } }

  // ---------------- modales, avisos ----------------
  function openModal(html) { $('#modal-box').innerHTML = html; $('#modal').classList.remove('hidden'); }
  function closeModal() { $('#modal').classList.add('hidden'); $('#modal-box').classList.remove('wide'); monCv = null; closeDD(); }
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
    $('#i-tk').innerHTML = ico('tkPoke', 24);
    $('#btn-tk').onclick = () => { Audio8.play('click'); setTab('gacha'); };
    applySettings();
    $('#skills').innerHTML = Object.entries(SKILLS).map(([id, k]) => `<button class="skill" id="sk-${id}" data-sk="${id}" title="${k.name}: ${k.desc}">${ico(k.icon, 24)}<i></i><small></small></button>`).join('');
    $$('#skills .skill').forEach(b => b.onclick = e => { e.stopPropagation(); if (Core.useSkill(b.dataset.sk)) { Audio8.play(b.dataset.sk === 'rage' ? 'charge' : 'ticket'); banner(SKILLS[b.dataset.sk].name + '!', SKILLS[b.dataset.sk].desc, '#ff8040'); } });
  }

  return { show, title, starter, hud, refresh, setTab, bind, banner, toast, openModal, closeModal, drawMonCv, drawPv, evolveAnim, tutStart, autoFill, monModal, mapModal };
})();
