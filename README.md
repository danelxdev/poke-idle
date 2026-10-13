# Dragon Ball Survivor

Fan game gratuito de supervivencia (bullet heaven, estilo Survivor.io / PokéSurvivor) con personajes de **todas las sagas de Dragon Ball**, combate 2D en pixel art retro y un **gacha de cápsulas separado por sagas**.

## Cómo jugarlo

No necesita instalación ni compilación: abre `index.html` en el navegador.

Para publicarlo gratis, activa **GitHub Pages** en el repositorio (Settings → Pages → rama `main`, carpeta `/`).

## Qué incluye

- **200 personajes** de 12 sagas: Dragon Ball, Saiyan, Freezer, Cell, Buu, Películas Z, GT, Super (Dioses, Goku Black, Torneo del Poder, Héroes) y Daima. Cada uno tiene stats, técnica inicial y transformaciones propias.
- **Sprites pixel-art generados por código** (`js/sprites.js`), sin imágenes externas. Tienen variante shiny y siluetas para los que aún no tienes.
- **Combate survivor**: mapa infinito y hordas que cambian de saga cada 2:30, con mini jefe y jefe final por saga. En el minuto 30, Zeno-sama empieza a borrarlo todo.
- **Solo dispara la técnica activa** (hasta 4, se cambian con 1‑4 / Q / E). Hay 30 técnicas de 17 clases distintas: rayos, proyectiles, órbitas, auras, bumeranes, meteoros, minas, torretas, buffs…
- **Cartas al subir de nivel**: técnicas nuevas, mejoras, cartas de estadística, **evoluciones doradas** (Kamehameha → Kamehameha x10, Galick Gun → Final Flash…) y **Vínculo** para lanzar dos técnicas a la vez. Las cartas se pueden cambiar con `R`.
- **Transformaciones** con la barra de ki y la tecla `ESPACIO`: Super Saiyan 1‑4, Dios, Blue, Ultra Instinto, Ultra Ego, Bestia, Golden, Ōzaru…
- **Enemigos con personalidad**: curanderos, escuderos, invocadores, Saibaman kamikaze, rayos avisados en el suelo y saltadores.
- **Grietas temporales** que llevan a 12 arenas contra legendarios, con lava, hielo o gravedad.
- **Eventos**: ladrones dorados, guerreros shiny salvajes y clima (luna llena, gravedad, tormenta de ki).
- **11 objetos equipables** y **mejoras permanentes por personaje**.
- **Gacha tragaperras** por saga con 5 rarezas de cápsula (blanca, verde, azul, morada y dorada). La tirada ×10 garantiza una Épica, hay garantía de Legendaria y 1 de cada 100 tiradas es shiny.
- **Bolas de Dragón** y deseos a Shenlong.
- **Quiz de personalidad** para elegir el primer compañero.
- Misiones diarias y semanales, ~90 logros con títulos, perfil, ranking local y recompensa diaria.
- Música y efectos chiptune originales (Web Audio).
- Controles táctiles para móvil y guardado en `localStorage`, con exportación e importación de la partida.

## Estructura

```
index.html
css/style.css
js/sprites.js      generador de sprites pixel-art
js/data/chars.js   personajes, sagas, transformaciones, enemigos, jefes y arenas
js/data/moves.js   técnicas, cartas, objetos, mejoras, logros y misiones
js/save.js         partida guardada
js/audio.js        sonido y música
js/engine.js       motor de combate
js/gacha.js        gacha de cápsulas
js/ui.js           menús, HUD y modales
js/main.js         arranque
```

## Aviso legal

Proyecto de fan sin ánimo de lucro. No está afiliado a Bird Studio, Shueisha, Toei Animation ni Bandai Namco. Dragon Ball y sus personajes son propiedad de sus respectivos dueños.
