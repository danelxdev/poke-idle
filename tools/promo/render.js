// Renderiza video.html fotograma a fotograma y lo pasa a ffmpeg.
//   node render.js <clips> stills <salida_dir> t1,t2,...      → PNG sueltos para revisar
//   node render.js <clips> video <salida.mp4> [extra query]   → vídeo sin audio (H.264)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const [clips, mode, out, arg] = process.argv.slice(2);
const page = process.env.PAGE || 'video.html', W = +(process.env.W || 1080), H = +(process.env.H || 1920);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', e => console.error('PAGEERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await pg.goto('file://' + path.join(__dirname, page) + '?clips=' + encodeURIComponent('file://' + clips) + (process.env.QS || ''));
  console.log('ready', await pg.evaluate(() => window.ready()));
  const shot = async t => { await pg.evaluate(t => window.render(t), t); return pg.screenshot({ type: mode === 'video' ? 'jpeg' : 'png', quality: mode === 'video' ? 96 : undefined }); };
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of arg.split(',').map(Number)) fs.writeFileSync(path.join(out, 't' + t.toFixed(2).padStart(6, '0') + '.png'), await shot(t));
  } else {
    const dur = await pg.evaluate(() => window.DUR), n = Math.round(dur * 30);
    const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) { const buf = await shot(i / 30); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 60 === 0) console.log('frame', i, '/', n); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
