# PokéMazmorra

Fan game gratuito para navegador: un **roguelike de salas al estilo Pokémon Rumble + The Binding of Isaac**, con los sprites de Pokémon de PMD SpriteCollab (los mismos que usa PokéSurvivor).

## Cómo jugarlo

Abre `index.html` en el navegador; no hace falta instalar nada. También se puede publicar en GitHub Pages.

- **PC**: `WASD` para moverte, flechas o ratón (clic izquierdo) para atacar, `ESPACIO` o clic derecho para la técnica especial, `1`–`6` o `Q`/`E` para cambiar de Pokémon y `Esc` para pausar.
- **Móvil**: el joystick izquierdo mueve y el derecho apunta y ataca. El botón **B** lanza la técnica especial y **⇄** cambia de Pokémon.

## Qué incluye

- **151 Pokémon de Kanto** con sus animaciones de andar, reposo, ataque y daño en 8 direcciones, su versión shiny y su retrato.
- **6 pisos generados al azar en salas** (estilo Isaac): Bosque Verde, Monte Moon, Islas Espuma, Central Energía, Torre Pokémon y Cueva Celeste. Hay salas de combate, tesoro, tienda, Centro Pokémon y jefe, con puertas que se cierran hasta limpiar la sala y un minimapa.
- **Jefes gigantes**: Beedrill, Onix, Articuno, Zapdos, Gengar y Mewtwo.
- **Amigos como en Pokémon Rumble**: los Pokémon derrotados a veces se unen a tu equipo de la aventura (hasta 6) y se quedan para siempre en tu colección con sus técnicas.
- **Combate Pokémon**: 70 técnicas de los 18 tipos y 12 clases (proyectiles, rayos, cuerpo a cuerpo, órbitas, auras, meteoros, minas…). Usa la tabla de tipos real, STAB, críticos y estados (quemado, envenenado, paralizado, congelado y ralentizado).
- **Niveles y evoluciones** durante la aventura. Si hay varias evoluciones posibles, eliges tú (Eevee).
- **25 objetos acumulables** al estilo Isaac: Restos, Cinta Elección, Garra Rápida, Banda Focus, Vidasfera, vitaminas, Caramelo Raro…
- Pokémon singulares en salas raras, shinies (1/400), colección con estadísticas y técnicas, música y sonidos originales.

## Sprites y datos

`tools/fetch_pokemon.py` descarga los sprites de [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) y los datos de [PokéAPI](https://pokeapi.co/). Además genera `js/data/pokedex.js` y `CREDITS.md` con los artistas de cada sprite. Para añadir más generaciones:

```
python3 tools/fetch_pokemon.py 152 251
```

## Aviso legal

Proyecto de fans sin ánimo de lucro, sin relación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company. Pokémon y sus personajes son propiedad de sus dueños.

Los sprites de SpriteCollab tienen licencia **CC BY-NC 4.0**: no se puede usar con fines comerciales y hay que citar a los artistas (ver `CREDITS.md`). Algunos sprites proceden originalmente de los juegos Pokémon Mystery Dungeon (CHUNSOFT).
