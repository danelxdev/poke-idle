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
    const gap = { shoot: 0.07, hit: 0.05, xp: 0.04, coin: 0.05, kill: 0.04, beam: 0.2, slash: 0.07, zap: 0.08, boom: 0.06, step: 0.2 }[name] || 0;
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
      case 'door': tone('square', 220, 330, 0.15, 0.08); noise(0.1, 0.06, 1200); break;
      case 'step': tone('triangle', 300, 200, 0.06, 0.05); break;
      case 'stairs': [784, 659, 523, 392].forEach((f, i) => tone('square', f, 0, 0.12, 0.08, now + i * 0.08)); break;
      case 'heal': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone('triangle', f, 0, 0.12, 0.1, now + i * 0.09)); break;
      case 'evolve': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone('square', f, 0, 0.2, 0.08, now + i * 0.1)); break;
      case 'faint': tone('square', 600, 80, 0.4, 0.08); break;
      case 'friend': [659, 784, 988, 1318].forEach((f, i) => tone('square', f, 0, 0.12, 0.08, now + i * 0.07)); break;
      case 'swap': tone('sine', 500, 1000, 0.12, 0.08); break;
      case 'item': [523, 784, 1046, 1568].forEach((f, i) => tone('square', f, 0, 0.15, 0.08, now + i * 0.08)); break;
      case 'boom': noise(0.3, 0.18, 900); tone('sawtooth', 140, 40, 0.25, 0.08); break;
      case 'zap': noise(0.12, 0.12, 6000); tone('square', 900, 200, 0.12, 0.05); break;
      case 'break': noise(0.12, 0.12, 2500); break;
      case 'lose': [440, 370, 311, 220].forEach((f, i) => tone('square', f, 0, 0.3, 0.1, now + i * 0.22)); break;
      default: break;
    }
  }

  // ---- Música: composición procedural original ----
  // Cada pista (menú, una por región y jefes) se compone con un generador determinista:
  // progresión de acordes, melodía con motivos que se repiten y varían (A A' B A C C' B' A),
  // bajo, arpegios y percusión. Todo es original; no usa ninguna melodía existente.
  const MID = n => 440 * Math.pow(2, (n - 69) / 12);
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  const RH = {
    calm: [[0, 6, 8, 12], [0, 4, 8, 12], [0, 8, 12], [0, 6, 8, 10, 12], [0, 4, 6, 8, 12, 14]],
    bounce: [[0, 3, 6, 8, 10, 12, 14], [0, 2, 4, 6, 8, 12], [0, 4, 6, 8, 12, 14], [0, 3, 6, 9, 12], [0, 2, 6, 8, 10, 14]],
    drive: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 4, 8, 11, 12], [0, 4, 8, 10, 12, 14], [0, 2, 4, 8, 10, 12], [0, 3, 6, 8, 11, 14]],
  };
  const TRACKS = {
    menu: { bpm: 96, root: 60, scale: 'major', prog: [0, 5, 3, 4, 0, 5, 3, 4], seed: 7, mel: 'calm', duty: 0.5, arp: 1, drums: '', bass: 'quarter' },
    r0: { bpm: 138, root: 60, scale: 'major', prog: [0, 4, 5, 2, 3, 0, 3, 4], seed: 21, mel: 'bounce', duty: 0.25, drums: 'rock', bass: 'pulse' },
    r1: { bpm: 124, root: 62, scale: 'major', prog: [0, 5, 3, 4, 0, 2, 3, 4], seed: 32, mel: 'calm', duty: 0.5, arp: 1, drums: 'calm', bass: 'quarter' },
    r2: { bpm: 132, root: 67, scale: 'mixo', prog: [0, 6, 3, 0, 0, 6, 4, 0], seed: 43, mel: 'bounce', duty: 0.125, drums: 'rock', bass: 'pulse' },
    r3: { bpm: 116, root: 57, scale: 'minor', prog: [0, 5, 2, 6, 0, 5, 3, 4], seed: 54, mel: 'calm', duty: 0.25, arp: 1, drums: 'march', bass: 'quarter' },
    r4: { bpm: 150, root: 64, scale: 'major', prog: [0, 4, 5, 3, 0, 4, 3, 4], seed: 65, mel: 'drive', duty: 0.5, drums: 'rock', bass: 'pulse' },
    r5: { bpm: 108, root: 65, scale: 'major', prog: [0, 2, 5, 3, 0, 2, 3, 4], seed: 76, mel: 'calm', duty: 0.5, arp: 1, drums: 'calm', bass: 'quarter' },
    r6: { bpm: 118, root: 58, scale: 'major', prog: [0, 3, 0, 4, 5, 3, 0, 4], seed: 87, mel: 'bounce', duty: 0.125, drums: 'rock', bass: 'pulse' },
    r7: { bpm: 148, root: 60, scale: 'minor', prog: [0, 5, 2, 6, 0, 5, 6, 4], seed: 98, mel: 'drive', duty: 0.25, drums: 'march', bass: 'pulse' },
    r8: { bpm: 136, root: 62, scale: 'dorian', prog: [0, 3, 6, 0, 0, 3, 4, 6], seed: 109, mel: 'bounce', duty: 0.25, drums: 'rock', bass: 'pulse' },
    r9: { bpm: 144, root: 54, scale: 'harm', prog: [0, 6, 5, 4, 0, 6, 3, 4], seed: 120, mel: 'drive', duty: 0.125, arp: 1, drums: 'march', bass: 'pulse' },
    boss: { bpm: 172, root: 57, scale: 'harm', prog: [0, 5, 6, 4, 0, 5, 6, 4], seed: 131, mel: 'drive', duty: 0.125, arp: 1, drums: 'march', bass: 'pulse' },
    boss2: { bpm: 180, root: 52, scale: 'harm', prog: [0, 1, 0, 5, 0, 6, 5, 4], seed: 142, mel: 'drive', duty: 0.25, arp: 1, drums: 'march', bass: 'pulse' },
  };
  const rngOf = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const composed = {};
  function compose(name) {
    if (composed[name]) return composed[name];
    const T = TRACKS[name], rand = rngOf(T.seed), sc = SCALES[T.scale], L = sc.length;
    const deg = d => T.root + sc[((d % L) + L) % L] + 12 * Math.floor(d / L);
    const chordDeg = bar => T.prog[bar % T.prog.length];
    const tones = c => [c, c + 2, c + 4, c + 7];
    const nearestTone = (d, c) => { let best = d, bd = 99; for (const t of tones(c)) for (const o of [-L, 0, L]) { const x = t + o; if (Math.abs(x - d) < bd) { bd = Math.abs(x - d); best = x; } } return best; };
    const LO = 0, HI = 11, CENTER = 5;
    function genBar(bar, cur) {
      const rh = RH[T.mel][Math.floor(rand() * RH[T.mel].length)], c = chordDeg(bar), notes = [];
      for (const pos of rh) {
        const r = rand();
        let step = r < 0.26 ? -1 : r < 0.52 ? 1 : r < 0.64 ? -2 : r < 0.76 ? 2 : r < 0.82 ? 0 : r < 0.9 ? 3 : -3;
        if (cur > CENTER + 3 && step > 0) step = -step; if (cur < CENTER - 3 && step < 0) step = -step;
        cur = Math.max(LO, Math.min(HI, cur + step));
        if (pos === 0 || pos === 8) cur = Math.max(LO, Math.min(HI, nearestTone(cur, c)));
        notes.push({ pos, d: cur });
      }
      return { notes, cur };
    }
    function genUnit(bar0, cur) { const a = genBar(bar0, cur), b = genBar(bar0 + 1, a.cur); return { bars: [a.notes, b.notes], cur: b.cur }; }
    const vary = (u, bar0) => { const b2 = u.bars[1].map(n => ({ ...n })), c = chordDeg(bar0 + 1); for (let i = Math.max(0, b2.length - 3); i < b2.length; i++) b2[i].d = Math.max(LO, Math.min(HI, b2[i].d + (rand() < 0.5 ? 1 : -1) * (1 + Math.floor(rand() * 2)))); b2[b2.length - 1].d = nearestTone(b2[b2.length - 1].d, c); return { bars: [u.bars[0], b2] }; };
    const A = genUnit(0, CENTER), B = genUnit(4, CENTER + 2), C = genUnit(8, CENTER - 1), cad = { bars: [A.bars[0], A.bars[1].map(n => ({ ...n }))] };
    cad.bars[1][cad.bars[1].length - 1].d = 0;
    // 8 unidades de 2 compases: A A' B A  C C' B' A(final)
    const form = [A, vary(A, 0), B, A, C, vary(C, 8), vary(B, 4), cad];
    const mel = new Array(16 * 16).fill(null);
    form.forEach((u, ui) => u.bars.forEach((notes, bi) => { const bar = ui * 2 + bi; notes.forEach((n, i) => { const next = i + 1 < notes.length ? notes[i + 1].pos : 16; mel[bar * 16 + n.pos] = { m: deg(n.d) + (T.root <= 58 ? 12 : 0), len: Math.max(1, next - n.pos) }; }); }));
    return (composed[name] = { T, mel, deg, chordDeg, tones, L });
  }
  // onda de pulso con ancho configurable (sonido de consola clásica)
  const waves = {};
  function pulseWave(d) {
    if (waves[d]) return waves[d];
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d);
    return (waves[d] = ctx.createPeriodicWave(re, im));
  }
  function note(f, dur, vol, when, wave, type, bright) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (wave) o.setPeriodicWave(pulseWave(wave)); else o.type = type || 'triangle';
    o.frequency.setValueAtTime(f, when);
    g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(vol, when + 0.012);
    g.gain.setValueAtTime(vol * (bright ? 0.8 : 0.7), when + Math.max(0.02, dur * 0.55)); g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g); g.connect(musGain); o.start(when); o.stop(when + dur + 0.03);
  }
  function drum(kind, when, vol) {
    if (kind === 'k') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(42, when + 0.1); g.gain.setValueAtTime(0.55 * vol, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.13); o.connect(g); g.connect(musGain); o.start(when); o.stop(when + 0.14); return; }
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    if (kind === 's') { f.type = 'bandpass'; f.frequency.value = 1900; g.gain.setValueAtTime(0.4 * vol, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.11); }
    else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(0.16 * vol, when); g.gain.exponentialRampToValueAtTime(0.001, when + 0.035); }
    s.connect(f); f.connect(g); g.connect(musGain); s.start(when); s.stop(when + 0.13);
  }
  function music(name) {
    init();
    if (!ctx) return;
    if (name && !TRACKS[name]) name = 'r0';
    if (track === name) return;
    track = name;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (!name) return;
    musicStep = 0;
    musicNext = ctx.currentTime + 0.12;
    musicTimer = setInterval(schedule, 50);
  }
  function schedule() {
    if (!ctx || !track) return;
    const C = compose(track), T = C.T, stepT = 60 / T.bpm / 4;
    while (musicNext < ctx.currentTime + 0.25) {
      const i = musicStep % 256, bar = Math.floor(i / 16), st = i % 16, when = musicNext, cd = C.chordDeg(bar), root = C.deg(cd) - 12;
      // melodía
      const n = C.mel[i];
      if (n) {
        const dur = n.len * stepT * 0.94;
        note(MID(n.m), dur, 0.2, when, T.duty);
        note(MID(n.m) * 1.0035, dur, 0.09, when, 0.5);
      }
      // bajo
      if (T.bass === 'pulse') { if (st % 2 === 0) note(MID(root + (st % 8 === 4 ? 12 : st % 8 === 6 ? 7 : 0)), stepT * 1.8, 0.34, when, 0, 'triangle'); }
      else if (st % 4 === 0) note(MID(root + (st === 8 ? 7 : 0)), stepT * 3.6, 0.34, when, 0, 'triangle');
      // arpegio
      if (T.arp && st % 2 === 0) { const t = C.tones(cd); note(MID(C.deg(t[(st / 2) % 4]) + 12), stepT * 1.5, 0.07, when, 0.125); }
      // percusión
      const dr = T.drums;
      if (dr === 'rock') { if (st === 0 || st === 8 || (st === 10 && bar % 2)) drum('k', when, 1); if (st === 4 || st === 12) drum('s', when, 1); if (st % 2 === 0) drum('h', when, 1); }
      else if (dr === 'march') { if (st % 4 === 0) drum('k', when, 1); if (st === 4 || st === 12) drum('s', when, 1); if (st % 2 === 0) drum('h', when, st % 4 === 2 ? 1 : 0.6); if (st === 14 && bar % 4 === 3) drum('s', when, 0.8); }
      else if (dr === 'calm') { if (st === 0 || st === 8) drum('k', when, 0.8); if (st === 4 || st === 12) drum('h', when, 1); }
      musicStep++;
      musicNext += stepT;
    }
  }

  return { init, resume, play, music, setVolumes };
})();
