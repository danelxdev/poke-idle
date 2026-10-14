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
- **Huevos, naturalezas, IVs y tipos eficaces**: incubadora con 4 tipos de huevo, 25 naturalezas, IVs entrenables con polvo estelar y ayudas visuales de eficacia en combate (ver más abajo).
- **Progresión lenta y constante**: cada etapa cuesta más que la anterior y los jefes son muros reales con límite de tiempo. Para avanzar mejoras a tu equipo, abres huecos, mejoras la banda y, sobre todo, repites el viaje en la **Liga**.

## Cómo se juega

- Tu equipo de hasta **6 Pokémon combate solo**. Tócalos a ellos para hacer daño extra. Un Pokémon con ventaja de tipo hace x2.
- Las **monedas** sirven para subir de nivel a tus Pokémon (evolucionan en los niveles 20 y 45), abrir huecos de equipo y comprar 13 mejoras (daño, monedas, críticos, afinidad de tipo, daño contra jefes, toque automático, polvo estelar…).
- **3 habilidades activas** con enfriamiento: Furia (x3 de daño), Fiebre del Oro (x3 de monedas) y Señuelo (x6 de capturas).
- **Mapa del mundo** para elegir en qué ruta farmear.
- Los Pokémon **dorados** dan gemas y, a veces, un ticket Super.
- Cada Pokémon **aprende ataques más potentes** al subir de nivel (Ascuas → Lanzallamas → Envite Ígneo → Llamarada → Erupción), con un efecto distinto en combate, y **evoluciona con una animación** en los niveles 20 y 45.
- Puedes **cambiar** cualquier Pokémon del equipo por otro de tu colección desde la pestaña Equipo, con buscador y orden.
- Los números de daño son grandes y de colores: críticos en amarillo, súper eficaces en naranja, toques en azul y monedas en dorado.

## Gacha

Los Pokémon **solo se consiguen en el gacha** (aparte de tu primer compañero). Las Poké Balls se abren con **tickets**:

- **4 tipos de ticket**: Poké (se compra con monedas), Super, Ultra y Maestro (se compran con gemas). También se cambian por **polvo estelar** en el Taller.
- Los tickets **caen** de los Pokémon derrotados, de los jefes, de las misiones diarias y semanales, de los logros y de la recompensa diaria.
- **14 tipos de Poké Ball**: Poké, Super, Ultra, **Bola Destacada**, **Bola Maestra** y **9 bolas regionales** (solo Pokémon de esa región).
- 5 rarezas según la línea evolutiva: un Pidgey es común, un Charmander es épico y los legendarios son legendarios. La tirada x10 cuesta 9 tickets y garantiza un Pokémon raro o mejor.
- **Shinies** (1 de cada 100): cuentan como una forma aparte que puedes activar o desactivar desde la ficha del Pokémon, y dan +50% de daño.
- **Destacados rotativos**: un épico cada 3 días y un legendario cada semana. En la Bola Destacada la mitad de los épicos y legendarios son los destacados, y si pierdes el 50/50 el siguiente legendario es el destacado seguro.
- **Garantías**: épico a las 25 tiradas y legendario a las 90 (con tickets Super o mejores).
- **Tirada diaria gratis** sin ticket.
- **Estrellas**: las copias repetidas suben las estrellas del Pokémon (★5 = x10 de daño) y dan polvo estelar.
- La animación de apertura crece según la rareza: ticket, Poké Ball que se agita con un halo del color del mejor premio, destello y reveladas una a una, con efectos especiales para épicos, legendarios y shinies.
- Las regiones nuevas del gacha se desbloquean al llegar a ellas.

## Huevos, naturalezas, IVs y tipos

**Huevos.** Cada victoria avanza los huevos que están en una incubadora (jefe ×5, Pokémon dorado ×3), también sin conexión. Hay cuatro tipos:

| Huevo | Victorias | Rareza al eclosionar | IV mínimo |
|---|---|---|---|
| Común | 600 | como una Poké Ball (común/raro) | 0 |
| Raro | 1 500 | raro o mejor (nunca común) | 8 |
| Épico | 3 500 | raro o mejor, mayoría épico | 16 |
| Legendario | 8 000 | épico o legendario (34 %) | 24 |

Caen de los Pokémon derrotados (0,08 % por victoria, ×10 si es dorado), de la primera victoria contra cada jefe, de la racha de 7 días y de las misiones semanales; también se compran con gemas. Tienes una incubadora gratis (más caras: 150, 600 y 2 400 gemas) y hasta 10 huevos guardados (si está lleno, el huevo se convierte en polvo). La tienda de la Liga tiene «Calor de Incubación» (−5 % de victorias por nivel). Los Pokémon de huevo tienen un 50 % más de probabilidad de ser shiny. Las partidas anteriores reciben un huevo común de regalo.

**Naturalezas (25).** Como en los juegos: una sube un eje y baja otro (las 5 neutras no cambian nada). Ejes: Ataque→Daño (+10 % / −5 %), Velocidad (+8 % / −4 %), At. Esp.→Crítico (+3 % / −1,5 % de probabilidad), Defensa→Botín (+4 % / −2 % de monedas por Pokémon del equipo) y Def. Esp.→Jefes (+10 % / −5 % de daño a jefes).

**IVs.** Cada Pokémon tiene tres IVs de 0 a 31: Daño (hasta +10 %), Velocidad (hasta +5 %) y Crítico (hasta +2 %). Al conseguir un Pokémon que ya tienes, la copia tira IVs nuevos y **te quedas con los mejores** (además de dar polvo y estrellas). El polvo estelar también sirve para entrenar un IV (+3 por 15 + 3·IV de polvo), cambiar la naturaleza al azar (60) o elegirla (450). Nivel de potencial: Bajo < 35 %, Normal, Bueno (55 %), Muy bueno (75 %), Excelente (90 %) y Perfecto (31/31/31). Medido en la simulación de equilibrio, el efecto medio de IVs y naturalezas acelera la partida un ~5 % (dentro del margen de variación entre ejecuciones).

**Tipos.** Cada Pokémon pega con su mejor tipo contra los tipos del enemigo: súper eficaz ×2 (más con la mejora «Afinidad de tipo»), resistido ×0,5 e inmune ×0,35 (nunca bloquea del todo). Ahora se ve: el enemigo muestra sus tipos, cada tarjeta del equipo indica ▲×2 / ▼×½ contra el enemigo actual, el mapa lista los tipos de cada ruta y cuáles les pegan más, y el botón **Mejor equipo** coloca a los Pokémon más eficaces para la ruta (o el jefe).

## Objetos y sinergias

- **Objetos equipables**: cada Pokémon lleva uno. Hay 9 tipos (Cinta Elección, Vidasfera, Pañuelo Elección, Gafas Zoom, Banda Focus, Orbe de tipo, Moneda Amuleto, Cascabel Fortuna y Guante de Entrenador) en 3 rarezas (Común, Raro y Épico).
- Los sueltan los jefes (cuanto más difícil, mejor rareza) y, con poca probabilidad, los Pokémon salvajes. En la **Mochila** puedes reciclarlos por polvo estelar o comprar uno al azar.
- **Sinergias de equipo**: Afinidad de tipo (2 a 6 Pokémon del mismo tipo), Diversidad, Élite legendaria, Brillo compartido (shinies) y Equipo veterano (todos con ★3 o más).

## Música

La música es **original** y se genera con código, en un estilo relajado y cálido. Cada pista usa una progresión de acordes conocida, melodías de frases de 4 compases (motivo, respuesta, repetición y cadencia) y estos instrumentos:

- **Melodía:** voz suave con un ligero vibrato y eco.
- **Colchón de cuerdas:** acordes largos que suenan de fondo.
- **Bajo:** redondo y discreto.
- **Caja de música:** arpegios que se repiten sobre cada acorde.
- **Percusión:** suave, con bombo discreto y escobillas, solo en algunas pistas.
- **Efectos:** reverberación y fundido entre pistas.

Hay una pista para el menú, una para cada región (con su propia tonalidad y tempo), una para los jefes y otra para los jefes finales. No usa ninguna melodía de los juegos de Pokémon.

La calidad se comprueba con números: en todas las pistas los tiempos fuertes caen en notas del acorde, el 80% de los movimientos de la melodía son de un paso, los saltos grandes son menos del 10% y el volumen no satura.

## Tutorial

Al empezar, una guía paso a paso te enseña el combate, las monedas, subir de nivel, abrir una Poké Ball, el equipo, los objetos, las habilidades y las misiones. Se puede repetir desde Ajustes.

## Apoyar el proyecto

Si te gusta, puedes invitarme a un café en [Ko-fi](https://ko-fi.com/danelalonso): hay botones en la pantalla de inicio y en Ajustes.

## Para volver cada día

- Recompensa diaria con racha de 7 días, **4 misiones diarias** (de 21 posibles) y **3 misiones semanales** (de 12).
- **226 logros** en 54 categorías: etapas, Pokédex regional, colecciones por tipo, estrellas, niveles, críticos, rachas, mejoras al máximo…
- **Pokédex** con filtros por región: cada Pokémon registrado da +1% de daño.

## Liga Pokémon (prestigio)

A partir de la etapa 60 puedes reiniciar el viaje a cambio de **medallas** (+3% de daño y monedas cada una) y **Puntos de Liga**. Los puntos se gastan en la **Tienda de la Liga**, con 14 mejoras permanentes: daño, monedas, niveles iniciales, huecos de equipo, ganancias offline, capturas, shinies, gemas, habilidades, polvo, daño por toque, críticos, descuento en Poké Balls y tiempo contra jefes.

Tu equipo también sigue ganando monedas hasta 8 horas mientras estás fuera, ampliable en la Liga.

## Progresión y equilibrio

Todas las constantes están en `Core.K` (`js/core.js`) y el ritmo se ha calibrado con simulaciones en Node (cargando `pokedex.js`, `idle.js` y `core.js`) de un jugador que compra siempre lo más rentable y toca 2 veces por segundo.

**Fórmulas principales**

- **Vida del enemigo** = (100 · g^(etapa−1) + 6 · etapa) · curva. El factor `g` es 1,17 y baja poco a poco hasta 1,115 entre las etapas 100 y 400, y la curva añade un endurecimiento suave desde la etapa 50.
- **Monedas por baja** ≈ vida · 0,0012 · 0,994^etapa + 0,5 + 0,12 · etapa. Los jefes dan x6.
- **Coste de subir de nivel** = 6 · 1,15^(nivel−1) (por rareza x1 a x2,4). **Daño por nivel**: x1,075 y x2 cada 25 niveles.
- **Huecos de equipo**: 150, 3 K, 100 K, 20 M y 15 B monedas.
- **Jefes**: vida x6 (líder), x8 (Alto Mando), x11 (campeón), x15 (legendario) o x20 (final), con 30 a 60 s de tiempo.
- **Medallas de la Liga** = ((etapa−45)/12)^1,4, cada una +3% de daño y monedas.

**Para que no se haga pesado**

- El juego **no entra en un jefe** hasta tener poder para vencerlo (60% o más). Si no está listo, sigue combatiendo y lo reta solo al llegar al 95%. Se ve el «Poder vs jefe» y se puede desactivar en Ajustes.
- Cada intento fallido **debilita al jefe un 8%** (hasta un 65%).
- Los tickets grandes y los objetos de los jefes caen sobre todo la primera vez que los vences, para que repetir el viaje no regale poder sin límite.

**Ritmo medido (jugador activo y muy eficiente; uno normal tardará de 1,5 a 2,5 veces más)**

| Sin reiniciar la Liga | Tiempo |
|---|---|
| Etapa 10 (Brock) | 6 min |
| Etapa 20 | 18 min |
| Etapa 40 | 55 min |
| Etapa 60 (se desbloquea la Liga) | 2 h |
| Etapa 100 | 3 h |
| Etapa 140 (fin de Kanto) | 4 h |
| Etapa 200 | 6 h |

La espera más larga contra un jefe en esa partida es de unos 35 minutos. Con la Liga: el primer reinicio llega hacia las 3 h, la mayor parte de Kanto y Johto queda hecha hacia las 5 h y Hoenn se abre hacia las 10 h. Las regiones siguientes (Sinnoh en adelante) tardan días.

## Créditos

- Sprites y retratos: [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licencia **CC BY-NC 4.0**. Los artistas aparecen en `CREDITS.md`. `tools/fetch_pokemon.py` descarga sprites y datos (por ejemplo `python3 tools/fetch_pokemon.py 1 1025`).
- Datos: [PokéAPI](https://pokeapi.co/).
- El motor de escenarios (`js/art/tiles.js`), los efectos (`js/art/vfx.js`) y los iconos (`js/art/icons.js`) están adaptados de [pokesurvivor](https://github.com/JPTER78/pokesurvivor) (MIT, ver `LICENSE-POKESURVIVOR.txt`).
- Pokémon © Nintendo / Creatures / GAME FREAK. Este proyecto no está afiliado a ellos.
