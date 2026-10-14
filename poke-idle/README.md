# PokéIdle

Juego incremental (idle) de Pokémon para navegador, con gacha de Poké Balls. Es un proyecto de fan sin ánimo de lucro, hecho con HTML, CSS y JavaScript sin dependencias. Para jugar, abre `index.html`.

## Qué incluye

- **971 Pokémon de 9 regiones** (Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar y Paldea), con sprites animados, retratos y versión shiny. Los que no tienen sprite en SpriteCollab todavía no están.
- **134 rutas en 10 zonas**: las 9 regiones y «Más allá». Cada ruta tiene su escenario, sus Pokémon salvajes y un jefe al final. Al terminar vuelven a empezar en ciclos cada vez más duros.
- **134 jefes** en 5 categorías:
  - **Líderes de gimnasio y Pokémon Tótem:** 72.
  - **Alto Mando:** 36.
  - **Campeones:** 9, de Azul a Geeta.
  - **Legendarios:** 9, de Mewtwo a Koraidon.
  - **Jefes finales:** 8, como Rojo, Rayquaza, Giratina, Eternatus, Calyrex y Arceus.
- **Progresión lenta y constante**: cada etapa cuesta más que la anterior y los jefes son muros reales con límite de tiempo. Para avanzar mejoras a tu equipo, abres huecos, mejoras la banda y, sobre todo, repites el viaje en la **Liga**.

## Cómo se juega

- Tu equipo de hasta **6 Pokémon combate solo**. Tócalos a ellos para hacer daño extra. Un Pokémon con ventaja de tipo hace x2.
- Las **monedas** sirven para subir de nivel a tus Pokémon (evolucionan en los niveles 20 y 45), abrir huecos de equipo y comprar 13 mejoras (daño, monedas, críticos, afinidad de tipo, daño contra jefes, toque automático, polvo estelar…).
- **3 habilidades activas** con enfriamiento: Furia (x3 de daño), Fiebre del Oro (x3 de monedas) y Señuelo (x6 de capturas).
- **Mapa del mundo** para elegir en qué ruta farmear.
- A veces un Pokémon salvaje derrotado se une a ti. Los Pokémon **dorados** dan gemas.

## Gacha

- **14 tipos de Poké Ball**: Poké Ball (monedas), Super, Ultra, **Bola Destacada**, **Bola Maestra** (siempre épico o legendario) y **9 bolas regionales**, una por región, que solo dan Pokémon de esa región.
- 5 rarezas. La tirada x10 cuesta como 9 y garantiza un Pokémon raro o mejor.
- **Destacados rotativos**: un épico cada 3 días y un legendario cada semana. En la Bola Destacada la mitad de los épicos y legendarios son los destacados, y si pierdes el 50/50 el siguiente legendario es el destacado seguro.
- **Garantías**: épico a las 25 tiradas con gemas y legendario a las 90.
- **Tirada diaria gratis**.
- **Estrellas**: las copias repetidas suben las estrellas del Pokémon (★5 = x10 de daño).
- **Polvo estelar**: cada copia repetida da polvo. Con él canjeas en la Pokédex el Pokémon que quieras de una región abierta.
- Las regiones nuevas del gacha se desbloquean al llegar a ellas.

## Para volver cada día

- Recompensa diaria con racha de 7 días, **4 misiones diarias** (de 21 posibles) y **3 misiones semanales** (de 12).
- **226 logros** en 54 categorías: etapas, Pokédex regional, colecciones por tipo, estrellas, niveles, críticos, rachas, mejoras al máximo…
- **Pokédex** con filtros por región: cada Pokémon registrado da +1% de daño.

## Liga Pokémon (prestigio)

A partir de la etapa 60 puedes reiniciar el viaje a cambio de **medallas** (+3% de daño y monedas cada una) y **Puntos de Liga**. Los puntos se gastan en la **Tienda de la Liga**, con 14 mejoras permanentes: daño, monedas, niveles iniciales, huecos de equipo, ganancias offline, capturas, shinies, gemas, habilidades, polvo, daño por toque, críticos, descuento en Poké Balls y tiempo contra jefes.

Tu equipo también sigue ganando monedas hasta 8 horas mientras estás fuera, ampliable en la Liga.

## Equilibrio

Las constantes están en `Core.K` (`js/core.js`) y se pueden comprobar con simulaciones en Node cargando `pokedex.js`, `idle.js` y `core.js`.

## Créditos

- Sprites y retratos: [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licencia **CC BY-NC 4.0**. Los artistas aparecen en `CREDITS.md`. `tools/fetch_pokemon.py` descarga sprites y datos (por ejemplo `python3 tools/fetch_pokemon.py 1 1025`).
- Datos: [PokéAPI](https://pokeapi.co/).
- El motor de escenarios (`js/art/tiles.js`), los efectos (`js/art/vfx.js`) y los iconos (`js/art/icons.js`) están adaptados de [pokesurvivor](https://github.com/JPTER78/pokesurvivor) (MIT, ver `LICENSE-POKESURVIVOR.txt`).
- Pokémon © Nintendo / Creatures / GAME FREAK. Este proyecto no está afiliado a ellos.
