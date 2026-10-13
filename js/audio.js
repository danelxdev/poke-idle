// Efectos y música chiptune originales con Web Audio
'use strict';

const Audio8 = (() => {
  let ctx = null, master = null, sfxGain = null, musGain = null, noiseBuf = null;
  let musicTimer = null, musicStep = 0, musicNext = 0, track = null;
  const last = {};

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.connect(master);
    musGain = ctx.createGain(); musGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setVolumes();
  }
  function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function setVolumes() {
    if (!ctx) return;
    const s = Save.d ? Save.d.settings : { sfx: 0.7, music: 0.4 };
    sfxGain.gain.value = s.sfx * 0.5;
    musGain.gain.value = s.music * 0.22;
  }

  function tone(type, f0, f1, dur, vol, when, dest) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, when) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain);
    s.start(t); s.stop(t + dur);
  }

  // Limita la frecuencia de cada efecto para no saturar
  function play(name) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const gap = { shoot: 0.06, hit: 0.05, xp: 0.04, coin: 0.05, kill: 0.04, beam: 0.2 }[name] || 0;
    if (gap && last[name] && now - last[name] < gap) return;
    last[name] = now;
    switch (name) {
      case 'shoot': tone('square', 880, 440, 0.08, 0.08); break;
      case 'beam': tone('sawtooth', 200, 900, 0.5, 0.12); noise(0.5, 0.08, 3000); break;
      case 'charge': tone('triangle', 200, 800, 0.35, 0.1); break;
      case 'hit': noise(0.06, 0.12, 2500); break;
      case 'kill': tone('square', 300, 80, 0.1, 0.07); break;
      case 'hurt': tone('sawtooth', 220, 60, 0.2, 0.15); noise(0.15, 0.15, 900); break;
      case 'xp': tone('sine', 1200 + Math.random() * 300, 1800, 0.06, 0.05); break;
      case 'coin': tone('square', 1320, 0, 0.05, 0.06); tone('square', 1760, 0, 0.08, 0.06, now + 0.05); break;
      case 'ticket': [988, 1318, 1976].forEach((f, i) => tone('square', f, 0, 0.1, 0.07, now + i * 0.07)); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => tone('square', f, 0, 0.12, 0.09, now + i * 0.08)); break;
      case 'select': tone('square', 660, 0, 0.06, 0.07); tone('square', 990, 0, 0.08, 0.07, now + 0.05); break;
      case 'click': tone('square', 520, 0, 0.04, 0.05); break;
      case 'error': tone('square', 200, 150, 0.15, 0.08); break;
      case 'explode': noise(0.5, 0.25, 800); tone('sawtooth', 120, 30, 0.4, 0.12); break;
      case 'dash': noise(0.15, 0.1, 5000); tone('triangle', 400, 1200, 0.12, 0.06); break;
      case 'slash': noise(0.08, 0.1, 6000); break;
      case 'transform': tone('sawtooth', 110, 880, 1.0, 0.14); noise(1.0, 0.1, 1500); [523, 784, 1046].forEach((f, i) => tone('square', f, 0, 0.3, 0.08, now + 0.6 + i * 0.1)); break;
      case 'boss': [196, 185, 175, 165].forEach((f, i) => tone('sawtooth', f, 0, 0.35, 0.12, now + i * 0.3)); break;
      case 'rift': tone('sine', 300, 1200, 0.8, 0.12); tone('sine', 450, 1800, 0.8, 0.08, now + 0.1); break;
      case 'shake': tone('square', 300, 280, 0.08, 0.07); break;
      case 'reel': tone('square', 700 + Math.random() * 200, 0, 0.03, 0.04); break;
      case 'stop': tone('square', 400, 0, 0.08, 0.08); noise(0.05, 0.08, 4000); break;
      case 'pop': noise(0.25, 0.2, 3000); tone('square', 600, 1500, 0.15, 0.08); break;
      case 'rare': [784, 988, 1175, 1568].forEach((f, i) => tone('square', f, 0, 0.15, 0.09, now + i * 0.09)); break;
      case 'legend': [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone('square', f, 0, 0.25, 0.09, now + i * 0.08)); tone('triangle', 130, 0, 1.2, 0.15, now); break;
      case 'death': [440, 370, 311, 220].forEach((f, i) => tone('square', f, 0, 0.3, 0.1, now + i * 0.22)); break;
      case 'win': [523, 659, 784, 659, 784, 1046].forEach((f, i) => tone('square', f, 0, 0.18, 0.09, now + i * 0.12)); break;
      case 'shenron': tone('sawtooth', 55, 110, 2.5, 0.2); noise(2.5, 0.12, 400); break;
      case 'erase': tone('sine', 2000, 50, 1.2, 0.2); break;
      default: break;
    }
  }

  // ---- Música: secuenciador simple de 16 pasos ----
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const TRACKS = {
    menu: { bpm: 112, bass: [45, 0, 45, 0, 48, 0, 48, 0, 43, 0, 43, 0, 47, 0, 47, 0], lead: [69, 0, 72, 0, 76, 0, 74, 72, 71, 0, 67, 0, 71, 0, 74, 0, 69, 0, 72, 0, 76, 0, 79, 77, 76, 0, 74, 0, 72, 0, 71, 0] },
    battle: { bpm: 150, bass: [40, 40, 52, 40, 43, 43, 55, 43, 45, 45, 57, 45, 47, 47, 59, 47], lead: [64, 0, 67, 69, 71, 0, 69, 67, 64, 0, 62, 0, 64, 67, 0, 0, 72, 0, 71, 69, 67, 0, 69, 71, 72, 0, 74, 0, 76, 0, 0, 0] },
    boss: { bpm: 165, bass: [38, 38, 50, 38, 39, 39, 51, 39, 38, 38, 50, 38, 36, 36, 48, 36], lead: [62, 0, 65, 0, 69, 68, 0, 65, 62, 0, 63, 0, 62, 0, 0, 0, 74, 0, 72, 0, 69, 0, 68, 0, 65, 0, 63, 0, 62, 0, 61, 0] },
  };
  function music(name) {
    init();
    if (!ctx) return;
    if (track === name) return;
    track = name;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (!name) return;
    musicStep = 0;
    musicNext = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 50);
  }
  function schedule() {
    if (!ctx || !track) return;
    const T = TRACKS[track];
    const step = 60 / T.bpm / 2;
    while (musicNext < ctx.currentTime + 0.2) {
      const b = T.bass[musicStep % T.bass.length];
      const l = T.lead[musicStep % T.lead.length];
      if (b) tone('triangle', N(b), 0, step * 0.9, 0.5, musicNext, musGain);
      if (l) tone('square', N(l), 0, step * 0.8, 0.18, musicNext, musGain);
      if (musicStep % 4 === 0) { // bombo
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(140, musicNext); o.frequency.exponentialRampToValueAtTime(40, musicNext + 0.1);
        g.gain.setValueAtTime(0.5, musicNext); g.gain.exponentialRampToValueAtTime(0.001, musicNext + 0.12);
        o.connect(g); g.connect(musGain); o.start(musicNext); o.stop(musicNext + 0.13);
      }
      musicStep++;
      musicNext += step;
    }
  }

  return { init, resume, play, music, setVolumes };
})();
