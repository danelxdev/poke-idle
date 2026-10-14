// Arranque
'use strict';

(function boot() {
  Save.load();
  Game.bind(document.getElementById('cv'));
  UI.bindTouch();
  UI.title();
  const unlock = () => { Audio8.resume(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
})();
