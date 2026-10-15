// Efectos y música chiptune originales con Web Audio
'use strict';

const Audio8 = (() => {
  let ctx = null, master = null, sfxGain = null, musGain = null, cbGain = null, out = null, noiseBuf = null;
  let cueFn = null, unlockFn = () => [], wantName = null, wantPrio = 0, shuffleCur = null, audition_ = null;
  const COMBAT = new Set(['shoot', 'beam', 'charge', 'hit', 'kill', 'slash', 'dash', 'zap', 'boom', 'explode', 'hurt', 'break']);
  const cfg = () => (Save.d ? Save.d.settings : { sfx: 0.7, music: 0.4, master: 1, combat: 0.8, mstyle: 'warm', mmode: 'region', mpin: 'r0', bgmute: true });
  let musicTimer = null, musicStep = 0, musicNext = 0, track = null;
  const last = {};

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.connect(master);
    cbGain = ctx.createGain(); cbGain.connect(sfxGain);
    musGain = ctx.createGain(); musGain.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setVolumes();
  }
  function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function setVolumes() {
    if (!ctx) return;
    const s = cfg();
    master.gain.value = 0.8 * (s.master === undefined ? 1 : s.master);
    sfxGain.gain.value = s.sfx * 0.5;
    cbGain.gain.value = s.combat === undefined ? 0.8 : s.combat;
    musGain.gain.value = s.music * 0.5;
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
    o.connect(g); g.connect(dest || out || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, when) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || sfxGain);
    s.start(t); s.stop(t + dur);
  }

  // Limita la frecuencia de cada efecto para no saturar
  function play(name) {
    if (cueFn) { try { cueFn(name); } catch (e) { /* subtítulos opcionales */ } }
    if (!ctx) return;
    out = COMBAT.has(name) ? cbGain : sfxGain;
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
      case 'trainer': [392, 523, 659].forEach((f, i) => tone('square', f, 0, 0.1, 0.07, now + i * 0.07)); break;
      case 'duel': [196, 196, 262, 330, 392].forEach((f, i) => tone('square', f, 0, 0.14, 0.09, now + i * 0.1)); tone('sawtooth', 98, 0, 0.7, 0.1, now); break;
      case 'unlock': [659, 880, 1175, 1568].forEach((f, i) => tone('triangle', f, 0, 0.14, 0.09, now + i * 0.07)); break;
      case 'lose': [440, 370, 311, 220].forEach((f, i) => tone('square', f, 0, 0.3, 0.1, now + i * 0.22)); break;
      default: break;
    }
  }

  // ---- Música: composición procedural original, cálida y relajada ----
  // Cada pista (menú, una por región y jefes) se compone con un generador determinista:
  // acordes de progresiones conocidas, frases de 4 compases (motivo, respuesta, repetición y
  // cadencia) con las notas fuertes sobre notas del acorde, bajo suave, arpegios tipo caja de
  // música, colchón de cuerdas, percusión de escobillas, reverberación y eco. No usa ninguna
  // melodía existente.
  const MID = n => 440 * Math.pow(2, (n - 69) / 12);
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  const RC = {
    calm: [[0, 4, 8, 12], [0, 6, 8, 12], [0, 4, 8, 10, 12], [0, 8, 12], [0, 3, 6, 8, 12]],
    bounce: [[0, 3, 6, 8, 12], [0, 4, 6, 8, 10, 12], [0, 3, 6, 8, 11, 14], [0, 2, 4, 8, 12]],
    drive: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 4, 8, 11, 12], [0, 4, 8, 10, 12, 14], [0, 3, 6, 8, 11, 14]],
  };
  const CONT = [[0, 1, 2, 1, 0], [0, 1, 2, 3, 2], [2, 1, 0, 1, 0], [0, 2, 1, 0, 1], [0, 1, 0, -1, 0], [0, 2, 4, 2, 0]];
  // prog = raíz (grado de la escala) de cada compás; se repite cada 8
  const P_A = [0, 4, 5, 3, 0, 4, 3, 4], P_B = [0, 5, 3, 4, 0, 2, 3, 4], P_C = [5, 3, 0, 4, 5, 3, 4, 4], P_D = [0, 3, 4, 0, 0, 3, 4, 4];
  const P_M1 = [0, 5, 2, 6, 0, 3, 6, 4], P_M2 = [0, 6, 5, 6, 0, 3, 4, 4], P_M3 = [0, 3, 6, 2, 5, 3, 4, 4];
  const TRACKS = {
    menu: { bpm: 82, root: 60, scale: 'major', prog: P_B, seed: 7, mel: 'calm', tone: 'soft', arp: 1, drums: '' },
    r0: { bpm: 112, root: 60, scale: 'major', prog: P_A, seed: 21, mel: 'bounce', tone: 'soft', arp: 1, drums: 'soft' },
    r1: { bpm: 100, root: 62, scale: 'major', prog: P_B, seed: 32, mel: 'calm', tone: 'soft', arp: 1, drums: '' },
    r2: { bpm: 108, root: 67, scale: 'mixo', prog: [0, 6, 3, 0, 0, 6, 4, 0], seed: 43, mel: 'bounce', tone: 'soft', arp: 1, drums: 'soft' },
    r3: { bpm: 92, root: 57, scale: 'minor', prog: P_M1, seed: 54, mel: 'calm', tone: 'soft', arp: 1, drums: '' },
    r4: { bpm: 120, root: 64, scale: 'major', prog: P_D, seed: 65, mel: 'drive', tone: 'bright', arp: 0, drums: 'drive' },
    r5: { bpm: 88, root: 65, scale: 'major', prog: P_C, seed: 76, mel: 'calm', tone: 'soft', arp: 1, drums: '' },
    r6: { bpm: 104, root: 58, scale: 'major', prog: [0, 3, 0, 4, 5, 3, 0, 4], seed: 87, mel: 'bounce', tone: 'soft', arp: 1, drums: 'soft' },
    r7: { bpm: 124, root: 60, scale: 'minor', prog: P_M2, seed: 98, mel: 'drive', tone: 'bright', arp: 0, drums: 'drive' },
    r8: { bpm: 110, root: 62, scale: 'dorian', prog: [0, 3, 6, 0, 0, 3, 4, 6], seed: 109, mel: 'bounce', tone: 'soft', arp: 1, drums: 'soft' },
    r9: { bpm: 96, root: 54, scale: 'harm', prog: P_M3, seed: 120, mel: 'calm', tone: 'soft', arp: 1, drums: 'soft' },
    boss: { bpm: 138, root: 57, scale: 'harm', prog: [0, 5, 6, 4, 0, 5, 6, 4], seed: 131, mel: 'drive', tone: 'bright', arp: 1, drums: 'drive' },
    rival: { bpm: 132, root: 55, scale: 'dorian', prog: [0, 3, 4, 0, 5, 3, 4, 4], seed: 153, mel: 'drive', tone: 'bright', arp: 1, drums: 'drive' },
    rival2: { bpm: 152, root: 50, scale: 'harm', prog: [0, 3, 5, 4, 0, 6, 5, 4], seed: 164, mel: 'drive', tone: 'bright', arp: 1, drums: 'drive' },
    trainer: { bpm: 118, root: 62, scale: 'mixo', prog: P_D, seed: 175, mel: 'bounce', tone: 'bright', arp: 1, drums: 'soft' },
    tower: { bpm: 94, root: 57, scale: 'harm', prog: P_M3, seed: 186, mel: 'calm', tone: 'soft', arp: 1, drums: '' },
    event: { bpm: 116, root: 64, scale: 'major', prog: P_A, seed: 197, mel: 'bounce', tone: 'soft', arp: 1, drums: 'soft' },
    league: { bpm: 100, root: 62, scale: 'major', prog: P_C, seed: 208, mel: 'calm', tone: 'soft', arp: 1, drums: 'soft' },
    nest: { bpm: 76, root: 65, scale: 'major', prog: P_B, seed: 219, mel: 'calm', tone: 'soft', arp: 1, drums: '' },
    boss2: { bpm: 146, root: 52, scale: 'harm', prog: [0, 1, 0, 5, 0, 6, 5, 4], seed: 142, mel: 'drive', tone: 'bright', arp: 1, drums: 'drive' },
  };
  const rngOf = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const composed = {};
  function compose(name) {
    if (composed[name]) return composed[name];
    const T = TRACKS[name], rand = rngOf(T.seed), sc = SCALES[T.scale], L = sc.length;
    const mod = (a, n) => ((a % n) + n) % n;
    const deg = d => T.root + sc[mod(d, L)] + 12 * Math.floor(d / L);
    const chordRoot = bar => (bar % 16 === 15 ? 0 : T.prog[bar % T.prog.length]);   // el último compás resuelve en la tónica
    const isTone = (d, c) => [0, 2, 4].includes(mod(d - c, L));
    const snap = (d, c) => { let best = d, bd = 99; for (let x = Math.max(LO, d - 3); x <= Math.min(HI, d + 3); x++) if (isTone(x, c) && Math.abs(x - d) < bd) { bd = Math.abs(x - d); best = x; } return best; };
    let center = 0, cb = 99; for (let x = -7; x <= 14; x++) if (Math.abs(deg(x) - 74) < cb) { cb = Math.abs(deg(x) - 74); center = x; }
    const LO = center - 3, HI = center + 6, clamp = d => Math.max(LO, Math.min(HI, d));
    const pick = a => a[Math.floor(rand() * a.length)];
    // un compás de motivo: contorno + ritmo; los tiempos fuertes caen en notas del acorde y se evitan los saltos grandes
    let last = center;
    function fit(d, c, strong) {
      let x = d;
      if (Math.abs(x - last) > 3) x = last + Math.sign(x - last) * 3;
      if (strong) {
        let best = x, bd = 99;
        for (let y = Math.max(LO, x - 3); y <= Math.min(HI, x + 3); y++) if (isTone(y, c)) { const cost = Math.abs(y - last) * 1.2 + Math.abs(y - x); if (cost < bd) { bd = cost; best = y; } }
        x = best;
      }
      return (last = clamp(x));
    }
    function bar(b, start, tpl, rc, endTone) {
      const c = chordRoot(b);
      const notes = rc.map((pos, i) => ({ pos, d: fit(start + tpl[i % tpl.length], c, pos === 0 || pos === 8 || (endTone && i === rc.length - 1)) }));
      return notes;
    }
    function cadence(b, final) {
      const c = chordRoot(b), tgt = fit(last, c, true), hi = snap(tgt + 2, c);
      last = tgt;
      return [{ pos: 0, d: hi }, { pos: 4, d: clamp(tgt + 1) }, { pos: 8, d: tgt, len: 6 }];
    }
    function phrase(b0, o) {
      const tpl = o.tpl, rc = o.rc, rc2 = o.rc2;
      let start = clamp(snap(o.start, chordRoot(b0)));
      start = last + Math.max(-3, Math.min(3, start - last));
      const a = bar(b0, start, tpl, rc), r = bar(b0 + 1, start + o.shift, tpl, rc2, true);
      const rep = bar(b0 + 2, start, tpl, rc);
      return [a, r, rep, cadence(b0 + 3, o.final)];
    }
    const mood = RC[T.mel];
    const mA = { tpl: pick(CONT), rc: pick(mood), rc2: pick(mood), start: center + Math.floor(rand() * 3) - 1, shift: rand() < 0.5 ? 1 : -1 };
    const mB = { tpl: pick(CONT), rc: pick(mood), rc2: pick(mood), start: center + 2, shift: rand() < 0.5 ? 1 : -1 };
    const A1 = phrase(0, mA), A2 = phrase(4, { ...mA, shift: -mA.shift }), B = phrase(8, mB), A3 = phrase(12, { ...mA, final: true });
    const mel = new Array(256).fill(null);
    [A1, A2, B, A3].forEach((ph, pi) => ph.forEach((notes, bi) => {
      const barIdx = pi * 4 + bi;
      notes.forEach((n, i) => { const next = i + 1 < notes.length ? notes[i + 1].pos : 16; const len = n.len || Math.max(1, next - n.pos); mel[barIdx * 16 + n.pos] = { m: deg(n.d), len, chord: chordRoot(barIdx), d: n.d }; });
    }));
    return (composed[name] = { T, mel, deg, chordRoot, L, isTone });
  }

  // ---- instrumentos ----
  const waves = {};
  function pulseWave(d) {
    if (waves[d]) return waves[d];
    const n = 24, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d) / k;   // armónicos suavizados
    return (waves[d] = ctx.createPeriodicWave(re, im));
  }
  // voz genérica: oscilador + filtro + envolvente (+ vibrato y envío al eco)
  function voice(o) {
    const t = o.when, o1 = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    if (typeof o.type === 'number') o1.setPeriodicWave(pulseWave(o.type)); else o1.type = o.type || 'triangle';
    o1.frequency.setValueAtTime(o.f, t);
    if (o.det) o1.detune.setValueAtTime(o.det, t);
    lp.type = 'lowpass'; lp.frequency.value = o.lp || 3000; lp.Q.value = 0.4;
    const a = o.a || 0.012, end = t + o.dur;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.vol, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol * (o.sus || 0.6)), t + Math.max(a + 0.01, o.dur * 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, end + (o.rel || 0.08));
    o1.connect(lp); lp.connect(g); g.connect(o.dest);
    if (o.echo && cur.echoIn) { const s = ctx.createGain(); s.gain.value = o.echo; g.connect(s); s.connect(cur.echoIn); }
    if (o.vib) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib, t + Math.min(0.35, o.dur * 0.7)); lfo.connect(lg); lg.connect(o1.detune); lfo.start(t); lfo.stop(end + 0.1); }
    o1.start(t); o1.stop(end + (o.rel || 0.08) + 0.05);
  }
  function noiseHit(when, dest, vol, dur, type, freq) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = 0.7;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(when); s.stop(when + dur + 0.02);
  }
  function kick(when, dest, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(115, when); o.frequency.exponentialRampToValueAtTime(46, when + 0.11);
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
    o.connect(g); g.connect(dest); o.start(when); o.stop(when + 0.22);
  }

  // ---- cadena de efectos y control de pistas ----
  let revIn = null;
  function buildFx() {
    if (revIn) return;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; lp.Q.value = 0.3;
    musGain.disconnect(); musGain.connect(lp); lp.connect(master);
    const len = Math.floor(ctx.sampleRate * 2.4), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    const conv = ctx.createConvolver(); conv.buffer = buf;
    const rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 4200;
    revIn = ctx.createGain(); revIn.gain.value = 0.3;
    lp.connect(revIn); revIn.connect(conv); conv.connect(rlp); rlp.connect(master);
  }
  let cur = { bus: null, echoIn: null };
  const styleOf = () => { const m = cfg().mstyle; return m === 'retro' || m === 'dream' ? m : 'warm'; };
  const tempoOf = () => (styleOf() === 'dream' ? 0.82 : 1);
  function newTrack(bpm) {
    const bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, ctx.currentTime); bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.9); bus.connect(musGain);
    const echoIn = ctx.createGain(), dl = ctx.createDelay(1.5), fb = ctx.createGain(), elp = ctx.createBiquadFilter(), out = ctx.createGain();
    dl.delayTime.value = Math.min(1.4, 60 / bpm * 0.75); fb.gain.value = 0.3; elp.type = 'lowpass'; elp.frequency.value = 2400; out.gain.value = 0.55;
    echoIn.connect(dl); dl.connect(elp); elp.connect(fb); fb.connect(dl); elp.connect(out); out.connect(bus);
    return { bus, echoIn, nodes: [echoIn, dl, fb, elp, out] };
  }
  function music(name) {
    init();
    if (!ctx) return;
    if (name && !TRACKS[name]) name = 'r0';
    if (track === name) return;
    track = name;
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    buildFx();
    // fundido del tema anterior
    if (cur.bus) { const old = cur, t = ctx.currentTime; old.bus.gain.cancelScheduledValues(t); old.bus.gain.setValueAtTime(old.bus.gain.value, t); old.bus.gain.linearRampToValueAtTime(0.0001, t + 0.8); setTimeout(() => { try { old.bus.disconnect(); old.nodes.forEach(n => n.disconnect()); } catch (e) { /* ya desconectado */ } }, 2500); }
    cur = { bus: null, echoIn: null };
    if (!name) return;
    const T = TRACKS[name], nt = newTrack(T.bpm * tempoOf());
    revIn.gain.value = { warm: 0.3, retro: 0.05, dream: 0.6 }[styleOf()];
    cur = { bus: nt.bus, echoIn: nt.echoIn, nodes: nt.nodes };
    musicStep = 0;
    musicNext = ctx.currentTime + 0.15;
    musicTimer = setInterval(tickMusic, 50);
  }
  function tickMusic() {
    schedule();
    if (cfg().mmode === 'shuffle' && !audition_ && shuffleCur && track === shuffleCur && musicStep >= 512) { shuffleCur = nextShuffle(); music(shuffleCur); }   // cambia de tema cada dos vueltas
  }
  // ---- elección de la pista según el modo (por región, aleatorio o fija) ----
  function nextShuffle() {
    const ok = unlockFn().filter(id => TRACKS[id] && !['menu', 'boss', 'boss2', 'rival', 'rival2'].includes(id) && id !== shuffleCur);
    return ok.length ? ok[Math.floor(Math.random() * ok.length)] : (wantName || 'r0');
  }
  function applyMode() {
    if (!ctx || audition_ || !wantName) return;
    const s = cfg();
    let t = wantName;
    if (s.mmode === 'pin' && TRACKS[s.mpin] && unlockFn().includes(s.mpin)) t = s.mpin;
    else if (s.mmode === 'shuffle' && wantPrio === 0 && wantName !== 'menu') { if (!shuffleCur || !unlockFn().includes(shuffleCur)) shuffleCur = nextShuffle(); t = shuffleCur; }
    music(t);
  }
  function want(name, prio) { wantName = name; wantPrio = prio | 0; init(); applyMode(); }
  function audition(id) { init(); if (!ctx || !TRACKS[id]) return; audition_ = id; track = null; music(id); }
  function endAudition() { if (!audition_) return; audition_ = null; track = null; if (wantName) applyMode(); }
  function restyle() { if (!ctx) return; const t = track; track = null; if (audition_) music(audition_); else if (t) music(t); }
  function setHidden(h) { if (!ctx) return; if (h && cfg().bgmute) ctx.suspend(); else if (ctx.state === 'suspended') ctx.resume(); }
  function schedule(limit) {
    if (!ctx || !track || !cur.bus) return;
    const C = compose(track), T = C.T, sty = styleOf(), stepT = 60 / (T.bpm * tempoOf()) / 4, dest = cur.bus, bright = T.tone === 'bright';
    while (musicNext < (limit !== undefined ? limit : ctx.currentTime + 0.3)) {
      const i = musicStep % 256, bar = Math.floor(i / 16), st = i % 16, when = musicNext, cd = C.chordRoot(bar);
      const dyn = 0.85 + 0.15 * Math.sin(bar / 16 * Math.PI * 2);               // el volumen respira a lo largo de la pieza
      const n = C.mel[i];
      if (sty === 'retro') {
        // consola de 8 bits: pulsos secos, bajo triangular, arpegio rápido y percusión de ruido, sin reverberación
        if (n) voice({ f: MID(n.m), dur: n.len * stepT * 0.92, vol: 0.085 * (st === 0 ? 1.1 : 0.9) * dyn, when, type: bright ? 0.125 : 0.25, a: 0.004, lp: 6500, sus: 0.85, rel: 0.03, dest });
        if (st % 4 === 0) voice({ f: MID(C.deg(cd) - 24), dur: stepT * 3.3, vol: 0.2 * dyn, when, type: 'triangle', a: 0.004, lp: 900, sus: 0.85, rel: 0.03, dest });
        if (T.arp || bright) { const seq = [0, 2, 4, 2]; voice({ f: MID(C.deg(cd + seq[st % 4]) + 12), dur: stepT * 0.8, vol: 0.03 * dyn, when, type: 0.125, a: 0.003, lp: 5200, sus: 0.4, rel: 0.02, dest }); }
        if (T.drums) { if (st === 0 || st === 8) kick(when, dest, 0.22); if (st === 4 || st === 12) noiseHit(when, dest, 0.09, 0.09, 'bandpass', 3200); if (st % 2 === 0) noiseHit(when, dest, 0.02, 0.03, 'highpass', 7000); }
      } else if (sty === 'dream') {
        // sueño: cuerdas anchas, melodía de seno con mucho eco y campanitas
        if (st === 0) {
          const dur = stepT * 15.7;
          for (const k of [0, 2, 4, 6]) voice({ f: MID(C.deg(cd + k) - 12), dur, vol: 0.05 * dyn, when, type: k % 4 ? 'sine' : 'triangle', a: 0.9, rel: 1.1, lp: 1500, sus: 0.95, dest, det: k * 3 - 4 });
        }
        if (n) { const dur = n.len * stepT * 1.05, ac = st === 0 ? 1.1 : 0.9; voice({ f: MID(n.m), dur, vol: 0.12 * ac * dyn, when, type: 'sine', a: 0.05, rel: 0.3, lp: 3800, vib: 5, echo: 0.55, dest }); voice({ f: MID(n.m) * 2, dur: dur * 0.6, vol: 0.02 * ac * dyn, when, type: 'sine', a: 0.02, lp: 6000, echo: 0.6, dest }); }
        if (st % 8 === 0) voice({ f: MID(C.deg(cd) - 24), dur: stepT * 7, vol: 0.2 * dyn, when, type: 'sine', a: 0.03, lp: 500, sus: 0.8, dest });
        if (st % 4 === 2) { const seq = [0, 2, 4, 7, 4, 2], k = seq[Math.floor(i / 4) % seq.length]; voice({ f: MID(C.deg(cd + k) + 12), dur: stepT * 2.2, vol: 0.035 * dyn, when, type: 'sine', a: 0.003, lp: 6000, sus: 0.2, echo: 0.6, dest }); }
        if (T.drums && st === 0) noiseHit(when, dest, 0.02, 0.4, 'highpass', 5000);
      } else {
        // colchón de acordes (cuerdas suaves): al inicio de cada compás
        if (st === 0) {
          const dur = stepT * 15.5;
          for (const [k, off] of [[0, 0], [2, 0], [4, 0], [6, 0]]) {
            if (k === 6 && T.scale !== 'major' && T.scale !== 'mixo') continue;
            voice({ f: MID(C.deg(cd + k) - 12 + off), dur, vol: (k === 6 ? 0.018 : 0.034) * dyn, when, type: 'triangle', a: 0.45, rel: 0.7, lp: 1300, sus: 0.9, dest, det: k * 3 - 4 });
          }
        }
        // melodía principal
        if (n) {
          const dur = n.len * stepT * 0.96, accent = st === 0 ? 1.12 : st === 8 ? 1.0 : 0.88;
          if (bright) { voice({ f: MID(n.m), dur, vol: 0.1 * accent * dyn, when, type: 0.25, a: 0.012, lp: 2600, vib: 8, echo: 0.28, dest }); voice({ f: MID(n.m), dur, vol: 0.05 * accent * dyn, when, type: 'triangle', a: 0.02, lp: 2200, det: 5, dest }); }
          else { voice({ f: MID(n.m), dur, vol: 0.14 * accent * dyn, when, type: 'triangle', a: 0.02, lp: 3200, vib: 7, echo: 0.3, dest, sus: 0.7 }); voice({ f: MID(n.m), dur, vol: 0.035 * accent * dyn, when, type: 'sine', a: 0.03, lp: 5000, det: 6, dest }); }
        }
        // bajo
        if (st % 4 === 0 && (st !== 4 && st !== 12 || bright)) voice({ f: MID(C.deg(cd) - 24 + (st === 8 ? 7 * 0 : 0)), dur: stepT * (st === 0 ? 7 : 3.4), vol: 0.2 * dyn, when, type: 'sine', a: 0.012, lp: 600, sus: 0.7, dest });
        if (st === 8 && !bright) voice({ f: MID(C.deg(cd + 4) - 24), dur: stepT * 3, vol: 0.12 * dyn, when, type: 'sine', a: 0.012, lp: 600, dest });
        if (bright && st % 2 === 0) voice({ f: MID(C.deg(cd) - 24 + (st % 8 === 4 ? 12 : st % 8 === 6 ? 7 : 0)), dur: stepT * 1.6, vol: 0.16 * dyn, when, type: 'triangle', a: 0.008, lp: 700, dest });
        // arpegio de caja de música
        if (T.arp && st % 2 === 0) { const seq = [0, 2, 4, 7, 4, 2], k = seq[(st / 2) % seq.length]; voice({ f: MID(C.deg(cd + k) + 12), dur: stepT * 1.8, vol: 0.04 * dyn, when, type: 'sine', a: 0.004, lp: 5200, sus: 0.3, echo: 0.35, dest }); }
        // percusión suave
        const dr = T.drums;
        if (dr === 'soft') { if (st === 0 || st === 8) kick(when, dest, 0.26); if (st === 4 || st === 12) noiseHit(when, dest, 0.07, 0.14, 'bandpass', 2600); if (st % 2 === 0) noiseHit(when, dest, st % 4 === 2 ? 0.032 : 0.018, 0.04, 'highpass', 6500); }
        else if (dr === 'drive') { if (st % 4 === 0) kick(when, dest, 0.3); if (st === 4 || st === 12) noiseHit(when, dest, 0.11, 0.13, 'bandpass', 2000); if (st % 2 === 0) noiseHit(when, dest, st % 4 === 2 ? 0.045 : 0.025, 0.04, 'highpass', 6000); }
      }
      musicStep++;
      musicNext += stepT;
    }
  }

  // Renderiza una pista a un buffer (para pruebas y para generar vistas previas)
  function preview(name, secs) {
    init(); buildFx();
    const T = TRACKS[name], nt = newTrack(T.bpm * tempoOf());
    track = name; cur = { bus: nt.bus, echoIn: nt.echoIn, nodes: nt.nodes }; musicStep = 0; musicNext = 0.05;
    schedule(secs);
    return ctx.startRendering();
  }

  function setCue(f) { cueFn = f; }
  function setUnlock(f) { unlockFn = f; }
  const state = () => ctx ? ctx.state : 'none';
  return { init, resume, state, play, music, want, remode: applyMode, audition, endAudition, restyle, setHidden, setCue, setUnlock, setVolumes, compose, TRACKS, preview, get track() { return track; }, get auditioning() { return audition_; } };
})();
