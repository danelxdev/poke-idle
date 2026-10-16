# Material promocional

Todo sale del juego real: escenas grabadas fotograma a fotograma con Playwright (reloj virtual), la
música y los efectos del propio motor de sonido (`js/audio.js`, renderizado sin tiempo real) y los
mismos sprites, iconos, paisaje y tipografía (Pixelify Sans, OFL).

```sh
C=/ruta/a/clips
for s in boss gacha fight dex evo; do node clips.js $C $s; done          # escenas del juego
QS='&evo0=5&evok=1.2' node render.js $C video video_mudo.mp4           # vídeo 1080×1920 (34 s)
node audio.js music.wav music r4 36 && node audio.js sfx.wav sfx "$(node cues.js)" 35
ffmpeg -i video_mudo.mp4 -i music.wav -i sfx.wav -filter_complex \
  "[1]atrim=0:34,volume=1.6,afade=t=out:st=32.2:d=1.8[m];[2]atrim=0:34[s];[m][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart PokeIdle_promo_1080x1920.mp4
# imágenes: capturas a tamaño real de la app en iPhone (393×764 pt, sin barra de estado ni indicador de inicio)
PVW=393 PVH=764 MAXF=151 node clips.js /ruta/a/fotos boss && PVW=393 PVH=764 MAXF=151 node clips.js /ruta/a/fotos gacha
PAGE=image.html W=1080 H=1350 QS='&f=ig&stills=file:///ruta/a/fotos' node render.js $C stills salida 0     # también f=sq (1080×1080) y f=wide (1920×1080)
```
