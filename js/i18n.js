// Idiomas: español (por defecto) e inglés. Los textos de la interfaz usan L(es, en) en el propio código;
// los datos (nombres, descripciones, rutas, logros…) los traduce js/data/en.js sustituyéndolos al elegir inglés.
'use strict';

const I18N = (() => {
  let lang = 'es';
  const undo = [];
  const set = (o, k, v) => { undo.push([o, k, o[k]]); o[k] = v; };
  const pref = () => { try { const l = JSON.parse(localStorage.getItem('pokeidle.save.v1')).settings.lang; if (l === 'es' || l === 'en') return l; } catch (e) { /* sin partida */ } return detect(); };
  const detect = () => (/^es\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || 'es') ? 'es' : 'en');
  // textos del HTML estático: data-en (contenido), data-en-title (tooltip) y data-en-ph (placeholder)
  function dom(root) {
    root = root || document;
    root.querySelectorAll('[data-en]').forEach(el => { if (el.dataset.es === undefined) el.dataset.es = el.textContent; el.textContent = lang === 'en' ? el.dataset.en : el.dataset.es; });
    root.querySelectorAll('[data-en-title]').forEach(el => { if (el.dataset.esTitle === undefined) el.dataset.esTitle = el.title; el.title = lang === 'en' ? el.dataset.enTitle : el.dataset.esTitle; });
    root.querySelectorAll('[data-en-ph]').forEach(el => { if (el.dataset.esPh === undefined) el.dataset.esPh = el.placeholder; el.placeholder = lang === 'en' ? el.dataset.enPh : el.dataset.esPh; });
  }
  function apply(l) {
    while (undo.length) { const [o, k, v] = undo.pop(); o[k] = v; }
    lang = l === 'en' ? 'en' : 'es';
    if (lang === 'en' && typeof EN_APPLY === 'function') EN_APPLY(set);
    document.documentElement.lang = lang;
    if (lang === 'en') {
      document.title = 'PokéIdle – Pokémon idle game with gacha';
      const m = document.querySelector('meta[name=description]');
      if (m) m.content = 'Free fan game for your browser: your Pokémon team fights on its own, earns coins, levels up, evolves, opens Poké Balls and conquers the League.';
    }
    dom();
  }
  return { apply, dom, detect, pref, get lang() { return lang; } };
})();
const L = (es, en) => (I18N.lang === 'en' && en !== undefined ? en : es);
