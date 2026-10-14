# PokéIdle

Juego incremental (idle) de Pokémon para navegador, con gacha de Poké Balls. Es un proyecto de fan sin ánimo de lucro, hecho con HTML, CSS y JavaScript sin dependencias. Para jugar, abre `index.html`.

## Cómo se juega

- Tu equipo de hasta **6 Pokémon combate solo** contra los Pokémon salvajes de cada ruta. Tócalos para hacer daño extra.
- Cada Pokémon derrotado da **monedas**. Úsalas para subir de nivel a tu equipo (cada 25 niveles su daño se duplica), abrir huecos en el equipo y comprar mejoras.
- Los Pokémon **evolucionan** en los niveles 20 y 45.
- Cada 10 etapas hay un **jefe** con 30 segundos de tiempo: los 8 líderes de gimnasio, el Alto Mando, el Campeón y Mewtwo. Las medallas de gimnasio dan +5% de daño.
- **Tipos**: un Pokémon con ventaja de tipo hace x2 de daño, así que conviene cambiar el equipo según la ruta.
- **Gacha**: la Poké Ball se compra con monedas. La Super Ball y la Ultra Ball se compran con gemas. Hay 5 rarezas, un Pokémon destacado que cambia cada día, un legendario garantizado a las 80 tiradas con gemas, x10 al precio de 9 y shinies (1/150).
- **Estrellas**: las copias repetidas suben las estrellas del Pokémon (★5 = x10 de daño).
- **Capturas**: a veces un Pokémon salvaje derrotado se une a ti. Los Pokémon dorados dan gemas.
- **Pokédex**: cada Pokémon registrado da +1% de daño.
- **Misiones diarias, recompensa por racha de días y logros**, que dan gemas.
- **Liga Pokémon (prestigio)**: a partir de la etapa 60 puedes reiniciar el viaje a cambio de medallas permanentes (+10% de daño y monedas cada una).
- **Ganancias offline**: tu equipo sigue combatiendo hasta 8 horas mientras no juegas.

## Créditos

- Sprites y retratos: [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licencia **CC BY-NC 4.0**. Los artistas aparecen en `CREDITS.md`.
- Datos: [PokéAPI](https://pokeapi.co/).
- El motor de escenarios (`js/art/tiles.js`), los efectos (`js/art/vfx.js`) y los iconos (`js/art/icons.js`) están adaptados de [pokesurvivor](https://github.com/JPTER78/pokesurvivor) (MIT, ver `LICENSE-POKESURVIVOR.txt`).
- Pokémon © Nintendo / Creatures / GAME FREAK. Este proyecto no está afiliado a ellos.
