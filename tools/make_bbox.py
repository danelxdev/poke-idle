"""Calcula, para cada Pokémon, el recuadro (en coordenadas del fotograma) que ocupa su dibujo en la animación de reposo
mirando al frente (unión de todos los fotogramas). El juego lo usa para centrar al Pokémon en sus iconos.
Uso: python3 tools/make_bbox.py  → escribe js/data/bbox.js"""
import json, os
from PIL import Image
root = os.path.join(os.path.dirname(__file__), '..')
base = os.path.join(root, 'assets', 'pokemon')
out = {}
for d in sorted(os.listdir(base), key=lambda x: (len(x), x)):
    p = os.path.join(base, d)
    try:
        meta = json.load(open(os.path.join(p, 'anim.json')))
    except Exception:
        continue
    a = 'idle' if 'idle' in meta else 'walk'
    m = meta.get(a)
    if not m: continue
    f = os.path.join(p, a + '.png')
    if not os.path.exists(f): continue
    im = Image.open(f).convert('RGBA')
    n = len(m['d'])
    x0 = y0 = 10**6; x1 = y1 = -1
    for i in range(n):
        fr = im.crop((i * m['w'], 0, (i + 1) * m['w'], m['h']))      # fila 0 = mirando abajo (al frente)
        bb = fr.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
        if bb:
            x0 = min(x0, bb[0]); y0 = min(y0, bb[1]); x1 = max(x1, bb[2]); y1 = max(y1, bb[3])
    if x1 > 0:
        out[d] = [x0, y0, x1, y1]
with open(os.path.join(root, 'js', 'data', 'bbox.js'), 'w') as fh:
    fh.write('// Generado por tools/make_bbox.py: recuadro del dibujo de cada Pokémon (x0,y0,x1,y1) en su fotograma de reposo.\n')
    fh.write('const SPR_BOX = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print(len(out), 'especies')
