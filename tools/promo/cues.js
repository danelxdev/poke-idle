// Efectos de sonido del juego colocados sobre la línea de tiempo del vídeo (segundos)
const C = [];
const at = (t, n) => C.push([Math.round(t * 1000) / 1000, n]);
at(0.5, 'dash'); at(1.0, 'pop'); at(2.4, 'select');
for (const c of [4, 8, 12.5, 17.5, 21.5, 25.5, 29.5]) at(c - 0.05, 'dash');
[5.3, 6.0, 6.7].forEach(t => at(t, 'select'));
for (let i = 27; i < 140; i++) if (i % 9 === 0) at(4 + (i - 20) / 30, 'hit');
at(4 + 30 / 30, 'charge'); at(4 + 75 / 30, 'ticket');
at(8.05, 'boss'); [9.0, 9.5, 10.0, 10.5].forEach(t => at(t, 'select'));
for (let i = 36; i < 160; i++) if (i % 7 === 0) at(8 + i / 30 / 1.36, 'hit');
at(8 + 60 / 30 / 1.36, 'charge'); at(8 + 152 / 30 / 1.36, 'win');
at(12.5, 'click'); [0.7, 0.9, 1.55, 2.2].forEach(d => at(12.5 + d, 'shake')); at(15.5, 'legend');
for (let t = 17.6; t < 19.4; t += 0.12) at(t, 'coin'); at(19.45, 'levelup');
for (let i = 0; i < 8; i++) at(21.5 + 0.35 + i * 0.4, 'select');
at(25.5, 'charge'); at(28.5, 'evolve');
at(29.75, 'pop'); at(30.3, 'levelup'); at(30.7, 'coin'); at(31.1, 'item');
console.log(JSON.stringify(C.sort((a, b) => a[0] - b[0])));
