// Accesibilidad: tamaño de texto, reducir movimiento, sin destellos, alto contraste, paleta para daltonismo,
// navegación con teclado (atajos, foco en los modales) y etiquetas para lectores de pantalla.
'use strict';

const A11Y = (() => {
  const root = document.documentElement;
  const DEF = { motion: 'auto', text: 1, nf: false, hc: false, cb: false };
  let cfg = Object.assign({}, DEF);
  // paleta Okabe-Ito para las rarezas (validada con ΔE ≥ 9 para daltonismo; el nombre de la rareza siempre se muestra en texto)
  const CB_RARITY = [null, '#c8c8c8', '#009e73', '#56b4e9', '#cc79a7', '#f0e442'];
  const CB_ITEM = [null, '#c8c8c8', '#56b4e9', '#cc79a7'];
  let orig = null;

  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => cfg.motion === 'reduce' || (cfg.motion === 'auto' && !!(mq && mq.matches));
  const noFlash = () => !!cfg.nf || reduced();

  function apply(c) {
    cfg = Object.assign({}, DEF, c || {});
    root.classList.toggle('a-rm', reduced());
    root.classList.toggle('a-nf', noFlash());
    root.classList.toggle('a-hc', !!cfg.hc);
    root.classList.toggle('a-cb', !!cfg.cb);
    root.style.setProperty('--tz', String(cfg.text || 1));
    if (!orig) orig = { rar: RARITY.map(r => r && r.color), item: ITEM_RAR.map(r => r && r.color) };
    RARITY.forEach((r, i) => { if (r) r.color = cfg.cb ? CB_RARITY[i] : orig.rar[i]; });
    ITEM_RAR.forEach((r, i) => { if (r) r.color = cfg.cb ? CB_ITEM[i] : orig.item[i]; });
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => apply(cfg));

  // ---- teclado ----
  const FOCUSABLE = 'button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
  let lastFocus = null;
  function trap(e) {
    const m = document.getElementById('modal');
    if (!m || m.classList.contains('hidden') || e.key !== 'Tab') return;
    const list = [...m.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  // elementos clicables que no son botones (retratos…) se vuelven accesibles con Tab y Enter
  function pass(el) {
    (el || document).querySelectorAll('[data-act]:not(button), [data-go]:not(button)').forEach(n => {
      if (n.tabIndex < 0 || !n.hasAttribute('role')) { n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button'); }
      if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', n.getAttribute('title') || n.getAttribute('alt') || n.dataset.act || 'button');
    });
  }
  function init(handlers) {
    handlers = handlers || {};
    document.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target, typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      trap(e);
      if (e.key === 'Escape' && handlers.close) handlers.close(e);
      else if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button' && t.tagName !== 'BUTTON') { e.preventDefault(); t.click(); }
      else if (!typing && handlers.tab && /^[1-7]$/.test(e.key) && document.getElementById('scr-game').classList.contains('active')) handlers.tab(+e.key - 1);
    });
    // recuerda dónde estaba el foco al abrir un modal y lo devuelve al cerrarlo
    const m = document.getElementById('modal');
    if (m && window.MutationObserver) new MutationObserver(() => {
      if (!m.classList.contains('hidden')) { lastFocus = document.activeElement; const f = m.querySelector('button:not([disabled]), input'); if (f && !m.contains(document.activeElement)) setTimeout(() => f.focus({ preventScroll: true }), 30); }
      else if (lastFocus && document.body.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* sin foco */ } lastFocus = null; }
    }).observe(m, { attributes: true, attributeFilter: ['class'] });
  }
  // texto para lectores de pantalla (se actualiza solo si cambia)
  function label(el, text) { if (el && el.getAttribute('aria-label') !== text) el.setAttribute('aria-label', text); }

  return { apply, init, pass, label, reduced, noFlash, get cfg() { return cfg; }, DEF };
})();
