// Cuenta y nube (Supabase): inicio de sesión con Google o como invitado, partida en la nube con control de
// conflictos, perfil público, marcas para los rankings y lectura de los rankings. Si no hay configuración
// (js/cloud-config.js) todo queda desactivado y el juego funciona como siempre, solo en este dispositivo.
'use strict';

const Cloud = (() => {
  const cfg = window.CLOUD_CONFIG || {};
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  const KEY = 'pokeidle.save.v1';
  const PUSH_EVERY = 120, SCORE_EVERY = 180;                 // segundos
  const st = { client: null, user: null, profile: null, status: 'off', msg: '', lastPush: 0, lastScore: 0, lastTime: -1, busy: false, loginDone: '', paused: false, ready: false };
  const subs = [];
  const enabled = () => !!(cfg.url && cfg.anonKey);
  const notify = type => { for (const f of subs) { try { f({ type }); } catch (e) { /* la interfaz es opcional */ } } };
  const setStatus = (s, msg) => { st.status = s; st.msg = msg || ''; notify('status'); };
  const S = () => Core.S;

  // ---------- compresión (gzip + base64) para que la partida ocupe poco ----------
  const toB64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(s); };
  async function pack(str) {
    if (typeof CompressionStream === 'function') {
      try { const buf = await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer(); return { format: 'gzip-b64', data: toB64(buf) }; } catch (e) { /* sin compresión */ }
    }
    return { format: 'json', data: str };
  }
  async function unpack(data, format) {
    if (format === 'json') return data;
    const bin = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    return new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  }

  // ---------- biblioteca y sesión ----------
  function loadLib() {
    return new Promise((res, rej) => {
      if (window.supabase && window.supabase.createClient) return res();
      const s = document.createElement('script');
      s.src = cfg.lib || LIB; s.async = true; s.onload = res; s.onerror = () => rej(new Error('lib'));
      document.head.appendChild(s);
    });
  }
  async function init() {
    if (!enabled()) { st.ready = true; return; }
    if (navigator.onLine === false) { st.ready = true; setStatus('offline'); return; }
    setStatus('connecting');
    try { await loadLib(); } catch (e) { st.ready = true; setStatus('offline'); return; }
    st.client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'pokeidle.auth' } });
    st.client.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_OUT') { st.user = null; st.profile = null; st.loginDone = ''; setStatus('guest'); notify('user'); } else if (session && session.user && st.loginDone !== session.user.id) setTimeout(() => onSession(session), 0); });
    // si Google/Supabase devuelven un error en la dirección, lo guardamos para enseñarlo (antes de limpiarla)
    let urlErr = '';
    try { const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#/, '')); urlErr = q.get('error_description') || h.get('error_description') || q.get('error') || h.get('error') || ''; } catch (e) { /* sin error en la URL */ }
    const back = /[?&]code=|access_token=/.test(location.search + location.hash);
    const clean = () => { if (/[?&]code=|access_token=|error=|error_description=/.test(location.search + location.hash)) { try { history.replaceState({}, '', location.pathname); } catch (e) { /* nada */ } } };
    // la sesión se recupera con un tope de tiempo: si Supabase no contesta, no dejamos el juego esperando
    const limit = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(L('Supabase no responde. Recarga la página.', 'Supabase is not responding. Reload the page.'))), ms))]);
    try {
      const { data, error } = await limit(st.client.auth.getSession(), 15000);
      clean();
      if (data && data.session) { st.ready = true; notify('ready'); await onSession(data.session); }
      else if (urlErr || error) setStatus('error', urlErr || String(error.message || error));
      else if (back) setStatus('error', L('No se pudo completar el inicio de sesión (falta la clave de seguridad de esta pestaña). Pulsa el botón de Google de nuevo, sin recargar la página de Google.', 'Could not complete sign-in (this tab’s security key is missing). Press the Google button again.'));
      else setStatus('guest');
    } catch (e) { clean(); console.error('[Cloud] init', e); setStatus('error', urlErr || String(e && e.message || e)); }
    st.ready = true; notify('ready');
  }
  async function onSession(session) {
    if (st.loginDone === session.user.id) return;
    st.loginDone = session.user.id; st.user = session.user;
    setStatus('syncing'); notify('user');
    try {
      await loadProfile();
      await reconcile();
      setStatus('ok');
      askName();
    } catch (e) { console.error('[Cloud] onSession', e); setStatus('error', String(e && e.message || e)); }
    notify('user');
  }
  // primera vez con esta cuenta: dejamos elegir el nombre público (si no, se queda el automático y se cambia en Perfil)
  function askName() {
    const p = st.profile, k = 'pokeidle.nameask.' + (st.user && st.user.id);
    if (!p || p.nickname_set) return;
    try { if (localStorage.getItem(k)) return; } catch (e) { /* sin almacenamiento: se pregunta */ }
    if (typeof UI.nameModal === 'function') UI.nameModal(() => { try { localStorage.setItem(k, '1'); } catch (e) { /* nada */ } });
  }
  async function signIn() {
    if (!st.client) { try { await init(); } catch (e) { /* ver estado */ } }
    if (!st.client) return false;
    const { error } = await st.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: cfg.redirect || location.origin + location.pathname, queryParams: { prompt: 'select_account' } } });
    if (error) { setStatus('error', error.message); return false; }
    return true;
  }
  async function signOut() {
    if (!st.client) return;
    try { await push(); } catch (e) { /* ya quedó guardada en local */ }
    await st.client.auth.signOut();
    st.user = null; st.profile = null; st.loginDone = '';
    S().cloud = { uid: '', rev: 0 }; Core.save();
    setStatus('guest'); notify('user');
  }

  // ---------- perfil ----------
  async function loadProfile() {
    const { data, error } = await st.client.rpc('ensure_profile');
    if (error) throw error;
    st.profile = data;
    const P = S().profile, cloudDefault = data.avatar === 0 && data.title === 'novato' && data.frame === 'classic';
    if (data.nickname_set) P.name = data.nickname;
    if (cloudDefault && (P.avatar || P.title !== 'novato' || S().cosm.frame !== 'classic')) await pushProfile();
    else {
      if (data.avatar && Core.setAvatar(data.avatar)) { /* avatar de la cuenta */ }
      if (TITLES.some(t => t.id === data.title)) P.title = data.title;
      if (FRAMES.some(f => f.id === data.frame)) { S().cosm.frame = data.frame; document.documentElement.dataset.frame = data.frame; }
    }
    Core.save();
  }
  let ptimer = 0;
  function pushProfile(now) {
    if (!st.user) return Promise.resolve(false);
    clearTimeout(ptimer);
    const run = async () => {
      const P = S().profile, show = st.profile ? st.profile.show_in_rankings : true;
      const { error } = await st.client.rpc('update_profile', { p_avatar: P.avatar || 0, p_title: P.title, p_frame: S().cosm.frame, p_show: show, p_lang: I18N.lang });
      return !error;
    };
    if (now) return run();
    return new Promise(res => { ptimer = setTimeout(() => run().then(res), 1200); });
  }
  // ¿Está libre este nombre? ok:null = no se pudo comprobar (sin conexión o esquema antiguo): se decide al guardar
  async function checkNickname(n) {
    if (!st.user) return { ok: null, reason: 'login' };
    try { const { data, error } = await st.client.rpc('nickname_available', { p_nickname: n }); if (error || !data) return { ok: null, reason: 'unknown' }; return data; } catch (e) { return { ok: null, reason: 'unknown' }; }
  }
  async function setNickname(n) {
    if (!st.user) return { ok: false, reason: 'login' };
    const { data, error } = await st.client.rpc('set_nickname', { p_nickname: n });
    if (error) return { ok: false, reason: 'error' };
    if (data.ok) { st.profile.nickname = data.nickname; st.profile.nickname_set = true; S().profile.name = data.nickname; Core.save(); notify('profile'); }
    return data;
  }
  async function setShow(v) {
    if (!st.user) return false;
    st.profile.show_in_rankings = !!v; notify('profile');
    return pushProfile(true);
  }

  // ---------- partida en la nube ----------
  const meta = () => { const s = S(); return { max_stage: s.stats.maxStage, medals: s.medals, asc_rank: s.asc.rank, essence: s.asc.ess, dex_count: Core.dexCount(), play_time: Math.floor(s.stats.time) }; };
  const device = () => { const ua = navigator.userAgent || ''; const b = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Web'; const o = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : ''; return (b + (o ? ' · ' + o : '')).slice(0, 40); };
  async function push(force) {
    if (!st.user || !S().started || st.busy || (st.paused && !force)) return false;
    st.busy = true; setStatus('syncing');
    let conflict = null;
    try {
      const s = S();
      Core.save();
      const p = await pack(JSON.stringify(s));
      const base = s.cloud && s.cloud.uid === st.user.id ? s.cloud.rev : 0;
      const { data, error } = await st.client.rpc('save_game', { p_data: p.data, p_format: p.format, p_base_rev: base, p_meta: meta(), p_device: device(), p_force: !!force });
      if (error) throw error;
      if (data.ok) { s.cloud = { uid: st.user.id, rev: data.rev }; Core.save(); st.lastPush = Date.now(); st.lastTime = s.stats.time; st.paused = false; setStatus('ok'); return true; }
      if (data.reason === 'conflict') conflict = data; else setStatus('error', data.reason || 'error');
    } catch (e) { setStatus('error', String(e && e.message || e)); }
    finally { st.busy = false; }
    if (conflict) await conflictDialog(conflict);
    return false;
  }
  async function reconcile() {
    const { data: row, error } = await st.client.from('saves').select('rev,max_stage,medals,asc_rank,dex_count,play_time,updated_at,device').maybeSingle();
    if (error) throw error;
    const s = S();
    if (!row) { if (s.started) await push(); return; }
    if (!s.started) { await pullAndApply(); return; }
    if (s.cloud && s.cloud.uid === st.user.id && s.cloud.rev === row.rev) { st.lastPush = Date.now(); st.lastTime = s.stats.time; return; }       // ya está al día
    await conflictDialog(row);
  }
  async function pullAndApply() {
    const { data, error } = await st.client.from('saves').select('data,format,rev').maybeSingle();
    if (error) throw error;
    if (!data) return false;
    const d = JSON.parse(await unpack(data.data, data.format));
    if (!d || d.v !== 1 || !d.mons) throw new Error('bad_save');
    try { const old = localStorage.getItem(KEY); if (old) localStorage.setItem(KEY + '.bak', old); } catch (e) { /* sin espacio */ }
    d.settings = Object.assign({}, d.settings || {}, S().settings);          // los ajustes son del dispositivo
    d.cloud = { uid: st.user.id, rev: data.rev }; d.last = Date.now();
    Core.freezeSave(true);
    localStorage.setItem(KEY, JSON.stringify(d));
    location.reload();
    return true;
  }
  function conflictDialog(remote) {
    return new Promise(done => {
      const s = S(), fmtT = secs => { const h = Math.floor(secs / 3600), m = Math.floor(secs / 60) % 60; return (h ? h + ' h ' : '') + m + ' min'; };
      const col = (title, o, rec) => `<div class="cfcol ${rec ? 'rec' : ''}"><b>${title}</b>${rec ? `<em>${L('Recomendada', 'Recommended')}</em>` : ''}<span>${L('Etapa máx.', 'Max stage')} <b>${o.max_stage}</b></span><span>${L('Medallas', 'Medals')} <b>${o.medals}</b></span><span>${L('Rango', 'Rank')} <b>${o.asc_rank}</b></span><span>Pokédex <b>${o.dex_count}</b></span><span>${L('Jugado', 'Played')} <b>${fmtT(o.play_time)}</b></span>${o.device ? `<small>${o.device}</small>` : ''}</div>`;
      const loc = meta(), recCloud = remote.play_time > loc.play_time;
      UI.openModal(`<h2>${L('Tu partida en la nube es distinta', 'Your cloud game is different')}</h2><p class="hint">${L('Hay una partida guardada en tu cuenta y otra en este dispositivo. Elige cuál quieres conservar; la otra se reemplaza (se guarda una copia de seguridad).', 'There is a game saved in your account and another on this device. Choose which one to keep; the other is replaced (a backup is kept).')}</p>
        <div class="cfgrid">${col(L('En la nube', 'In the cloud'), remote, recCloud)}${col(L('En este dispositivo', 'On this device'), loc, !recCloud)}</div>
        <div class="row"><button class="btn" id="cf-later">${L('Decidir luego', 'Decide later')}</button><button class="btn ${recCloud ? 'primary' : ''}" id="cf-cloud">${L('Usar la nube', 'Use the cloud')}</button><button class="btn ${recCloud ? '' : 'primary'}" id="cf-local">${L('Usar este dispositivo', 'Use this device')}</button></div>`);
      const q = id => document.querySelector(id);
      q('#cf-later').onclick = () => { st.paused = true; UI.closeModal(); setStatus('paused'); done(); };
      q('#cf-cloud').onclick = async () => { UI.closeModal(); setStatus('syncing'); try { await pullAndApply(); } catch (e) { setStatus('error', String(e.message || e)); } done(); };
      q('#cf-local').onclick = async () => { UI.closeModal(); st.busy = false; st.paused = false; await push(true); done(); };
    });
  }
  async function syncNow() { if (!st.user) return false; st.paused = false; try { const ok = await push(); if (ok) await submitScore(true); return ok; } catch (e) { return false; } }

  // ---------- rankings ----------
  async function submitScore(force) {
    if (!st.user || !S().started || st.profile && st.profile.banned) return false;
    if (!force && Date.now() - st.lastScore < SCORE_EVERY * 1000) return false;
    st.lastScore = Date.now();
    const s = S(), wk = Math.floor((Date.now() / 864e5 + 3) / 7), curWeek = s.event && s.event.week === Core.eventWeek();
    const tiers = s.event ? s.event.tiers.filter(Boolean).length : 0;
    const { error } = await st.client.rpc('submit_score', { p: { max_stage: s.stats.maxStage, asc_rank: s.asc.rank, essence: s.asc.ess, tower_best: s.tower.best, master_level: s.rival.master, dex_count: Core.dexCount(), rivals: Core.rivalWins(), medals: s.medals, play_time: Math.floor(s.stats.time), week_id: wk, event_kills: curWeek ? s.event.kills : 0, event_tiers: curWeek ? tiers : 0 } });
    return !error;
  }
  async function board(name) {
    if (!st.client) { try { await init(); } catch (e) { /* ver estado */ } }
    if (!st.client) throw new Error('offline');
    const r = name === 'weekly' ? await st.client.rpc('get_weekly_board', { p_limit: 50 }) : await st.client.rpc('get_leaderboard', { p_board: name, p_limit: 50, p_offset: 0 });
    if (r.error) throw r.error;
    let me = null;
    if (st.user && name !== 'weekly') { const m = await st.client.rpc('get_my_rank', { p_board: name }); if (!m.error && m.data && m.data[0] && m.data[0].rank) me = m.data[0]; }
    return { rows: r.data || [], me };
  }
  async function report(target, reason) { if (!st.user) return false; const { data, error } = await st.client.rpc('report_player', { p_target: target, p_reason: reason }); return !error && data && data.ok; }
  async function deleteAccount() {
    if (!st.user) return false;
    const { error } = await st.client.rpc('delete_my_account');
    if (error) return false;
    try { await st.client.auth.signOut(); } catch (e) { /* ya no existe */ }
    st.user = null; st.profile = null; st.loginDone = '';
    S().cloud = { uid: '', rev: 0 }; Core.save();
    setStatus('guest'); notify('user');
    return true;
  }

  // ---------- segundo plano: guardar y enviar marcas cada cierto tiempo ----------
  let soonT = 0;
  function soon() { clearTimeout(soonT); soonT = setTimeout(() => { if (st.user) { push().then(() => submitScore(true)); } }, 8000); }
  function flush() { if (st.user && S().started && !st.paused) { push(); submitScore(); } }
  setInterval(() => {
    if (!st.user || !S() || !S().started || document.hidden || !navigator.onLine || st.paused) return;
    if (S().stats.time !== st.lastTime && Date.now() - st.lastPush > PUSH_EVERY * 1000) push().then(() => submitScore());
  }, 30000);
  window.addEventListener('online', () => { if (st.user) flush(); else if (enabled() && !st.client) init().then(() => notify('ready')); });

  return {
    enabled, init, signIn, signOut, syncNow, soon, flush, pushProfile, setNickname, checkNickname, setShow, board, report, deleteAccount, submitScore,
    on: f => subs.push(f),
    get status() { return st.status; }, get msg() { return st.msg; }, get user() { return st.user; }, get profile() { return st.profile; },
    get mode() { return !enabled() ? 'off' : st.user ? 'user' : 'guest'; }, get lastPush() { return st.lastPush; }, get ready() { return st.ready; },
  };
})();
