"""Genera los iconos de la PWA (Poké Ball pixel art) en assets/pwa/."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'pwa')
os.makedirs(OUT, exist_ok=True)
BG = (10, 20, 48, 255)
N = 24                                        # rejilla de píxeles de la bola
K, R, S_, Wh, G, Hi, Y = (27, 21, 40), (255, 95, 109), (184, 40, 58), (245, 245, 250), (190, 196, 214), (255, 255, 255), (255, 210, 63)

def ball():
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    c = (N - 1) / 2
    for y in range(N):
        for x in range(N):
            dx, dy = x - c, y - c
            r = (dx * dx + dy * dy) ** 0.5
            if r > 11.3:
                continue
            if r > 10.2:
                col = K
            elif r <= 3.4:
                col = Y if r < 1.5 else Hi if r < 2.5 else Wh
            elif r <= 4.6:
                col = K
            elif abs(dy) < 1.4:
                col = K
            elif dy < 0:
                col = Hi if (dx + 5) ** 2 + (dy + 6) ** 2 < 5 else S_ if (dx > 4 and dy > -6) else R
            else:
                col = G if (dx > 4 and dy < 6) else Wh
            im.putpixel((x, y), col + (255,))
    return im

W = H = N

def icon(size, pad):
    im = Image.new('RGBA', (size, size), BG)
    d = ImageDraw.Draw(im)
    for i in range(size):  # degradado suave
        t = i / size
        d.line([(0, i), (size, i)], fill=(int(10 + 14 * t), int(20 + 22 * t), int(48 + 50 * t), 255))
    b = ball()
    target = int(size * (1 - 2 * pad))
    k = max(1, target // W)
    b = b.resize((W * k, H * k), Image.NEAREST)
    im.alpha_composite(b, ((size - b.width) // 2, (size - b.height) // 2))
    return im

icon(192, 0.12).save(os.path.join(OUT, 'icon-192.png'))
icon(512, 0.12).save(os.path.join(OUT, 'icon-512.png'))
icon(512, 0.24).save(os.path.join(OUT, 'maskable-512.png'))   # zona segura para iconos adaptativos
icon(180, 0.12).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
print('ok')
