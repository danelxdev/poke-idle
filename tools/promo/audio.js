// node audio.js <salida> music <pista> <segundos> | sfx <json de cues> <segundos>
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs'), path = require('path');
const [out, kind, arg, secs] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); pg.on('pageerror', e => console.error(e.message));
  await pg.goto('file://' + path.join(__dirname, 'audio.html') + '?s=' + secs);
  const b64 = await pg.evaluate(([k, a]) => k === 'music' ? music(a) : sfx(JSON.parse(a)), [kind, arg]);
  fs.writeFileSync(out, Buffer.from(b64, 'base64')); await b.close(); })();
