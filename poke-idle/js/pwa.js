// App instalable (PWA): service worker, botón de instalar y avisos locales (huevo listo, límite offline).
'use strict';

const PWA = (() => {
  let deferred = null, timers = [];
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const canInstall = () => !!deferred;
  const notifSupported = () => 'Notification' in window;
  const perm = () => (notifSupported() ? Notification.permission : 'unsupported');
  const notifOn = () => perm() === 'granted' && !!(Core.S && Core.S.settings.notify);
  const paintInstall = () => { const a = document.getElementById('t-install'); if (a) a.classList.toggle('hidden', !deferred || standalone()); };

  function init() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; paintInstall(); });
    window.addEventListener('appinstalled', () => { deferred = null; paintInstall(); });
    const a = document.getElementById('t-install');
    if (a) a.onclick = e => { e.preventDefault(); install(); };
    paintInstall();
  }
  async function install() {
    if (!deferred) return false;
    deferred.prompt();
    const r = await deferred.userChoice.catch(() => null);
    deferred = null; paintInstall();
    return !!(r && r.outcome === 'accepted');
  }
  async function enableNotify() {
    if (!notifSupported()) return false;
    const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    Core.S.settings.notify = p === 'granted';
    return p === 'granted';
  }
  function show(title, body, tag) {
    if (!notifOn()) return;
    const opts = { body, icon: 'assets/pwa/icon-192.png', badge: 'assets/pwa/icon-192.png', tag };
    const fallback = () => { try { new Notification(title, opts); } catch (e) { /* sin permiso */ } };
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r => r.showNotification(title, opts)).catch(fallback);
    else fallback();
  }
  // al ocultar la pestaña, calcula cuándo estará listo el próximo huevo y cuándo se llena el límite offline
  function schedule() {
    clear();
    if (!notifOn() || !Core.S.started) return;
    const eta = Core.nextEggEta(), cap = Core.offlineCapSecs();
    if (eta !== null && eta < cap) timers.push(setTimeout(() => show(L('¡Un huevo está listo!', 'An egg is ready!'), L('Vuelve a PokéIdle para eclosionarlo.', 'Come back to PokéIdle to hatch it.'), 'egg'), eta * 1000));
    timers.push(setTimeout(() => show(L('Tu equipo ha llenado el límite offline', 'Your team has hit the offline limit'), L('Vuelve para recoger tus monedas.', 'Come back to collect your coins.'), 'cap'), cap * 1000));
  }
  function clear() { timers.forEach(clearTimeout); timers = []; }

  return { init, install, canInstall, standalone, enableNotify, notifSupported, perm, notifOn, schedule, clear, show };
})();
