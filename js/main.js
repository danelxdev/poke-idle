// Arranque
'use strict';

(function boot() {
  Save.load();
  Game.bindInput(document.getElementById('cv'));
  UI.title();
  // el primer gesto del usuario desbloquea el audio
  const unlock = () => { Audio8.resume(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => { if (document.hidden) Save.save(); });
})();
