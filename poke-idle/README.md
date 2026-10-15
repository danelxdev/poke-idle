# PokéIdle

Juego incremental (idle) de Pokémon para navegador, con gacha de Poké Balls. Es un proyecto de fan sin ánimo de lucro, hecho con HTML, CSS y JavaScript sin dependencias. Para jugar, abre `index.html`.

## Qué incluye

- **1 027 Pokémon de 9 regiones** (971 especies más 56 formas regionales de Alola, Galar, Hisui y Paldea) (Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar y Paldea), con sprites animados, retratos y versión shiny. Los que no tienen sprite en SpriteCollab todavía no están.
- **134 rutas en 10 zonas**: las 9 regiones y «Más allá». Cada ruta tiene su escenario, sus Pokémon salvajes y un jefe al final. Al terminar vuelven a empezar en ciclos cada vez más duros.
- **134 jefes** en 5 categorías:
  - **Líderes de gimnasio y Pokémon Tótem:** 72.
  - **Alto Mando:** 36.
  - **Campeones:** 9, de Azul a Geeta.
  - **Legendarios:** 9, de Mewtwo a Koraidon.
  - **Jefes finales:** 8, como Rojo, Rayquaza, Giratina, Eternatus, Calyrex y Arceus.
- **Huevos, naturalezas, IVs y tipos eficaces**: incubadora con 4 tipos de huevo, 25 naturalezas, IVs entrenables con polvo estelar y ayudas visuales de eficacia en combate (ver más abajo).
- **Eventos semanales y Torre de batalla**: un tipo protagonista cada semana con jefe, misiones y bola propia, y una torre infinita con pisos de reglas especiales.
- **Rival, entrenadores y Pokédex completa**: el rival Nico te desafía dos veces por región (20 duelos con historia), aparecen entrenadores con varios Pokémon seguidos y cada Pokémon tiene una ficha con estadísticas, debilidades, evolución y dónde aparece.
- **Guía «¿Qué hago ahora?»**, **auras** en los enemigos, **perfil con títulos y avatar**, favoritos en la Pokédex y objetos exclusivos de final de partida.
- **Final de partida sin techo**: **Ascensión** (una segunda Liga con Rango, Esencia y multiplicadores permanentes que se acumulan) y **Duelos Maestros** de Nico, una escalera infinita cada vez más dura.
- **Objetos, combos y tácticas**: 17 objetos con efectos distintos, fusión y taller, combos de objetos y 5 tácticas de equipo.
- **Sonido y música**: volúmenes por categoría, 3 estilos de música, 20 pistas desbloqueables en una sala de música y subtítulos de sonidos.
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

## Idiomas (español / inglés)

El juego está en **español** y en **inglés**. Se elige según el idioma del navegador la primera vez y se cambia en la portada (ES | EN) o en Ajustes; el cambio recarga la página.

- `js/i18n.js`: `I18N.apply(lang)` y el atajo `L(es, en)` que usan los textos de la interfaz (`ui.js`, `main.js`, `core.js`…). El idioma se aplica antes de cargar el resto de scripts.
- `js/data/en.js`: traducción de los datos (regiones, rutas, jefes, bolas, mejoras, objetos, logros, naturalezas, movimientos, nombres de Pokémon que cambian…). Al elegir inglés sustituye los textos en los objetos de datos y los restaura al volver al español.
- Los textos del HTML estático usan `data-en` (contenido), `data-en-title` y `data-en-ph`.
- Las misiones diarias guardan solo qué contar y cuánto: el texto se genera al mostrarlas, así que cambian con el idioma.
- Para añadir un idioma: duplica el patrón `L()`/`EN_APPLY` y amplía `I18N.apply`.

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

## Eventos semanales y Torre de batalla (pestaña Retos)

Se desbloquea al llegar a la etapa 10. Los retos sustituyen al combate normal (un solo enemigo con vida y tiempo fijos); no se guardan, así que si recargas la página pierdes el intento.

**Evento semanal.** Cambia cada semana (el calendario es el mismo para todos): el tipo protagonista rota por los 18 tipos y un bonus general rota cada 5 semanas.
- Tus Pokémon del tipo de la semana hacen **+25 %** de daño.
- Bonus de la semana: shinies ×2, huevos ×2 de rápidos, +50 % monedas, ×2 polvo estelar o +50 % de tickets soltados.
- **Jefe del evento** (uno de los Pokémon más fuertes de ese tipo) en 4 dificultades. Vida = vida de un Pokémon salvaje en tu etapa máxima × 3 / 7 / 16 / 40, con 45 / 50 / 55 / 60 s. La primera victoria de cada semana da gemas, tickets y huevos (hasta 160 gemas, 2 Ultra, 1 Maestro y un huevo épico). Cada botón muestra tu «Poder» (≥100 % = lo vences a tiempo).
- **Misiones del evento**: derrotar 150 y 600 Pokémon del tipo de la semana y abrir 10 Bolas del Evento.
- **Bola del Evento** (1 Ticket Super): solo Pokémon del tipo de la semana; al salir épico o legendario, la mitad de las veces es el destacado del evento. Una tirada gratis por semana.

**Torre de batalla.** Pisos infinitos, cada uno contra un Pokémon de un tipo distinto. Piso *f*: vida = salvaje en tu etapa máxima × 2,5 × 1,07^(f−1) en 40 s. Sigues subiendo hasta que caes. Cada 5 pisos hay un guardián (×1,5 de vida) con una regla: sin objetos, sin sinergias, solo del tipo del piso (los demás hacen la mitad), sin críticos, contrarreloj (mitad de tiempo, −45 % de vida) o armadura (+60 % de vida, +40 % de tiempo). Las recompensas (gemas, polvo, tickets cada 5 pisos y huevos cada 10) se dan solo la primera vez que superas cada piso. Puedes empezar desde cualquier guardián superado. El récord da **+0,3 % de daño permanente por piso**.

Con la simulación de equilibrio: en el techo de cada etapa un jugador supera sin problema hasta el piso ~14 y el jefe fácil/normal del evento; los pisos con regla, el jefe difícil y el extremo exigen preparar el equipo (tipos, objetos y mejoras).

## Crianza (Guardería)

En la pestaña Gacha, bajo la incubadora: eliges un Pokémon **principal** (da la especie) y una **pareja**, y pagas polvo estelar (30 / 60 / 120 / 300 / 700 según la rareza más alta de la pareja). Obtienes un huevo del tipo que corresponde a esa rareza (común hasta rareza 2, raro, épico o legendario), que tarda las mismas victorias que un huevo normal.

- **IVs de la cría**: cada IV hereda el mejor de los dos padres con un 70 % (el peor con un 30 %) más un bonus aleatorio de 0 a 2. Repetir generaciones tiende a los IVs perfectos.
- **Naturaleza**: eliges si hereda la del principal o la de la pareja.
- **Shiny**: si alguno de los dos tiene la versión shiny, la probabilidad se duplica (y el huevo ya da +50 %).
- Al eclosionar suma una copia y polvo como cualquier repetido, y una ventana compara tus genes con los de la cría para que elijas con cuáles te quedas.

## App instalable (PWA) y avisos

- **Instalar**: el navegador ofrece «Instalar app» (hay un enlace en la pantalla de inicio y otro en Ajustes). En iPhone: Compartir → Añadir a pantalla de inicio. Se abre a pantalla completa con su icono (`assets/pwa/`, generados con `tools/make_icons.py`).
- **Sin conexión**: un service worker (`sw.js`) guarda el código y los datos (red primero, para recibir las novedades al instante, y copia guardada si no hay red) y los sprites de Pokémon según los vas viendo (caché primero, hasta 1 500). El primer arranque necesita conexión; después se puede jugar sin ella. La partida siempre se guarda en el propio navegador.
- **Avisos** (Ajustes → Aplicación): al ocultar la pestaña o la app, el juego calcula cuándo eclosionará el próximo huevo y cuándo se llenará el límite offline y programa un aviso. Funcionan mientras el navegador mantenga la página viva en segundo plano; con la app totalmente cerrada no se pueden enviar sin un servidor de notificaciones push (no hay ninguno).
- **Actualizar**: el service worker se renueva solo al cambiar `sw.js`; para forzar una limpieza basta con subir el número de `VERSION`. Hay que añadir cualquier archivo nuevo a la lista `SHELL`.
- Solo funciona desde `https://` o `localhost` (no desde `file://`).

## Estadísticas

Ajustes → **Estadísticas** (o el botón de la pestaña Liga). El juego guarda una muestra por minuto jugado (hasta 240; al llenarse se queda con una de cada dos) y dibuja tres gráficas de línea en SVG: etapa máxima, monedas por segundo y daño por segundo del equipo (estas dos en escala logarítmica, indicada en el título). Pasando el ratón o el dedo aparece el valor de cada punto; hay una **vista de tabla** con los mismos datos. Debajo: Pokédex por región, Pokémon por rareza, potencial de IVs y tipos, y una lista de totales y récords (mayor daño/s, golpe más fuerte, Torre…).

## Accesibilidad

Ajustes → **Accesibilidad**:

- **Tamaño del texto**: normal, grande o muy grande (paneles, ventanas y avisos).
- **Animaciones**: «según el sistema» (respeta `prefers-reduced-motion`), reducidas o todas. Reducidas quita animaciones y transiciones, el temblor de pantalla y el movimiento de la portada.
- **Sin destellos**: elimina los fogonazos del gacha, la evolución y los golpes.
- **Alto contraste**: texto más claro, bordes marcados y foco más grueso.
- **Paleta para daltonismo**: rarezas con la paleta Okabe-Ito (validada: separación ΔE ≥ 9 entre rarezas contiguas para deuteranopía, protanopía y tritanopía) y azul/naranja en lugar de rojo/verde. El nombre de la rareza y los símbolos ▲ ▼ se muestran siempre, así que el color nunca es lo único que informa.
- **Teclado**: `1`–`7` cambian de pestaña, `Esc` cierra ventanas, `Tab` recorre los botones (con foco visible), `Enter` o `Espacio` activan los retratos, y el foco queda dentro de las ventanas y vuelve al cerrarlas.
- **Lectores de pantalla**: roles de pestañas y ventana, `aria-live` en avisos, etiquetas en los botones de iconos y descripción del combate.

## Formas regionales y megaevoluciones

**Formas regionales** (56: Alola, Galar, Hisui y Paldea). Son especies propias (ids de PokéAPI 10001+): salen en el gacha según su región (ids de generación 7, 8 y 9), aparecen como Pokémon salvajes en esas rutas y tienen sus propias líneas evolutivas (Rattata de Alola → Raticate de Alola; Pikachu puede evolucionar a Raichu o a Raichu de Alola al azar).

**Megaevoluciones** (41 formas Mega y primigenias con sprite). No están en el gacha: se desbloquean desde la ficha del Pokémon.
- Hace falta que sea la especie final de su línea, **nivel 50 o más** y **fragmentos Mega**: 4 (común/poco común), 6 (raro), 10 (épico) o 16 (legendario).
- Los fragmentos se consiguen en la Torre (1 por guardián superado por primera vez, 2 desde el piso 50 y 3 desde el 100) y en el jefe del evento semanal (1 / 2 / 3 / 5 según la dificultad).
- La forma Mega cambia sprite, **tipos**, ataques y estadísticas: el daño sube con su BST (p. ej. Charizard → Mega Charizard X, +41 %). Se puede activar y desactivar; **solo una forma Mega activa a la vez**.
- Los datos y sprites se generan con `tools/fetch_forms.py` (`js/data/forms.js`).

## Equipos guardados

El botón **Equipos** de la pestaña Equipo guarda hasta 4 equipos con nombre y los carga con un toque (uno para farmear, otro para el evento o la Torre…). Se guardan las especies, así que sobreviven a evoluciones y a la Liga; si el equipo tiene más Pokémon que huecos, se cargan los primeros.

## Objetos, combos y tácticas

- **Objetos equipables**: cada Pokémon lleva uno. Hay **17 tipos** en 3 rarezas (Común x1, Raro x1,6 y Épico x2,5):
  - Ataque: Cinta Elección (+20 % daño), Vidasfera (+35 % daño, −10 % velocidad), Pañuelo Elección (+10 % velocidad), Gafas Zoom (+6 % crítico), Orbe de tipo, **Cinta Experto** (+25 % en golpes súper eficaces), **Garra Remate** (+50 % a enemigos con menos del 30 % de vida) y **Banda Doble** (12 % de atacar dos veces).
  - Jefes: Banda Focus (+30 % a jefes), **Concha Impulso** (+60 % en los primeros 10 s de un jefe) y **Reloj de Arena** (+1 s contra jefes y retos, de todo el equipo).
  - Economía (afectan a todo el equipo): Moneda Amuleto (+8 % monedas), Cascabel Fortuna (+10 % tickets), Guante de Entrenador (+10 % toque), **Huevo Suerte** (+15 % eclosión), **Colmillo Gema** (+10 % gemas de jefes) y **Polvo Brillo** (+12 % polvo).
- Los sueltan los jefes (cuanto más difícil, mejor rareza), los duelos del rival y, con poca probabilidad, los Pokémon salvajes y los entrenadores.
- **Mochila**: reciclar por polvo, comprar uno al azar (150 de polvo), **Taller** (elige el objeto común que quieras por 600) y **Fusión**: 3 objetos iguales sin usar → 1 de la rareza siguiente (40 de polvo de Común a Raro, 160 de Raro a Épico).
- **Combos de objetos**: con 3 objetos distintos del mismo grupo en el equipo hay bonus. **Arsenal** (7 objetos de ataque): +10 % de daño con 3 y +20 % con 5. **Equipo de caza** (Banda Focus, Concha Impulso, Reloj de Arena, Cinta Experto, Garra Remate): +20 % de daño contra jefes con 3 y +35 % con 4. **Granja** (Moneda, Cascabel, Huevo Suerte, Colmillo, Polvo, Guante): +12 % monedas con 3 y +30 % con 5.
- **Tácticas de equipo** (desde la etapa 20, en la pestaña Equipo): Equilibrada (sin cambios), **Ofensiva** (+25 % daño, −20 % monedas), **Economía** (+30 % monedas, −15 % daño), **Cazajefes** (+30 % daño a jefes y retos, −10 % contra salvajes) y **Rastreo** (+40 % tickets, huevos y polvo, −12 % daño). La equilibrada es la referencia del equilibrio del juego; las demás son decisiones para cada momento.
- **Sinergias de equipo**: Afinidad de tipo (2 a 6 Pokémon del mismo tipo), Diversidad, Élite legendaria, Brillo compartido (shinies) y Equipo veterano (todos con ★3 o más).

## Rival y entrenadores

- **Nico, el rival**: te desafía **dos veces en cada región** (a mitad de camino y justo antes del campeón), 20 duelos en total con diálogos que cuentan una pequeña historia. Se abren al alcanzar su etapa y se aceptan desde la pestaña Retos.
- Cada duelo son **3 Pokémon seguidos con un solo cronómetro**; su equipo de cada región usa tipos distintos, así que importan los tipos de tu equipo. Se muestra el **Poder** del equipo (≥100 % = lo vences a tiempo).
- La primera victoria da gemas, polvo y tickets (en los segundos duelos, además, fragmentos Mega, un huevo y un objeto) y **+1 % de daño permanente**. Después puedes pedir una **revancha** al día por duelo (polvo y gemas).
- **Entrenadores**: de vez en cuando, en vez de un salvaje, aparece un entrenador con 2 Pokémon seguidos (3 desde la etapa 60). Al derrotar al último das un extra de monedas y, con suerte, gemas, tickets u objetos. Se ven en la tarjeta del enemigo (por ejemplo «Pescador Pablo 2/3»).

## Guía, auras y perfil

- **¿Qué hago ahora?** (botón de la estrella, arriba a la derecha): una lista corta, por orden de importancia, de lo más útil en este momento: recompensas por recoger, huevos listos, tirada gratis, huecos libres, si tu equipo está listo para el jefe (y qué hacer si no), el duelo de Nico, la Torre, objetos que fusionar o equipar, Megas desbloqueables y, sobre todo, **cuándo conviene entrar en la Liga o ascender**. Cada consejo tiene un botón «Ir» que te lleva a la pestaña.
- **Auras**: a partir de la etapa 150, algunos enemigos salvajes (del 8 % al 35 % según la etapa) llevan una aura y dan **+50 % de monedas**: **férrea** (−20 % de daño recibido), **vital** (recupera 2 % de vida por segundo) o **de protección** (los Pokémon de un tipo concreto hacen −50 %). Se ven junto al nombre del enemigo (✦). Los jefes no tienen aura. Premian un equipo con tipos variados.
- **Táctica automática en jefes** (Ajustes → Combate, desactivada por defecto): si usas la táctica Equilibrada, el juego usa Cazajefes contra jefes y retos y vuelve sola.
- **Perfil** (Ajustes): nombre, avatar (uno de tus Pokémon) y **título**. Hay 29 títulos que se desbloquean jugando: etapas y campeones de cada región, Pokédex, shinies, crianza, Torre, bestiario, entrenadores, Liga, Megas, Nico, Ascensión, música… El nombre y el título salen en la pantalla de inicio.
- **Favoritos** en la Pokédex (la estrella de la ficha) y un filtro «Favoritos». Los filtros y el orden de la Pokédex se **recuerdan** entre sesiones.
- **Misiones nuevas** (solo salen si puedes cumplirlas): entrenadores, fusiones, ascensiones, Duelos Maestros y pisos de la Torre.
- **Objetos exclusivos** (solo en los Duelos Maestros, cada 5 niveles, siempre épicos): **Insignia de Nico** (+40 % de daño en duelos, Torre y eventos), **Cristal de Esencia** (+2,5 % de daño por Rango de Ascensión, hasta +100 %) y **Reloj Eterno** (+3 s contra jefes y retos).

## Ascensión y Duelos Maestros (final de partida)

Las medallas de la Liga suman de forma lineal (+3 % cada una), así que a partir de la etapa ~650 cada vuelta aporta cada vez menos. La Ascensión añade un multiplicador que crece sin techo, y la dificultad sube con ella.

- **Ascender** (se desbloquea al llegar a la etapa 500 y se hace desde la pestaña Liga): es una Liga normal (mismas medallas y mismo reinicio) que además sube tu **Rango** en 1 y te da **Esencia** = ((etapa − 400) / 50)^1,35 redondeada (en la etapa 500 son 2, en la 650 son 8, en la 800 son 16 y en la 1000 son 28).
- **Cada Esencia** da **×1,05 de daño y ×1,03 de monedas para siempre**, y se acumula multiplicando. No se gasta ni se pierde.
- **Cada Rango** hace que todos los enemigos y retos tengan **×1,25 de vida**: la dificultad nunca deja de subir, pero la Esencia crece más rápido que ella. El Rango se ve en la etapa (por ejemplo «Rango 3»).
- **Duelos Maestros**: al ganar los 20 duelos de Nico se abre una escalera sin fin. Cada nivel es un duelo de 3 Pokémon seguidos con el mejor de cada tipo, con ×15 de la vida de un jefe de tu mejor etapa (×1,16 más por nivel). Cada nivel superado da gemas, polvo, fragmentos Mega, un huevo legendario, un objeto y un ticket, **+0,5 % de daño permanente**, y cada 5 niveles un ticket Maestro y **1 de Esencia**.
- Logros nuevos: Ascensión, Esencia y Maestro de Nico.
- **Ritmo medido** (jugador activo 2 h al día): sin Ascensión el avance se frena hacia la etapa ~700 y apenas se mueve en semanas. Ascendiendo cada vez que la Esencia ganada es al menos el 30 % de la que ya tienes, se llega a la etapa ~590 el día 14, ~750 el día 18 y ~830 el día 21, y el avance sigue a unas 20–25 etapas al día (más despacio cuanto mayor es el Rango). No hay techo: pasada la etapa 1340 las rutas se repiten con enemigos más fuertes.

## Pokédex

- **Ficha de cada Pokémon**: estadísticas base, debilidades y resistencias (con los multiplicadores x4, x2, ×½, ×¼ e inmunidades), línea evolutiva completa (con niveles), formas regionales y Mega, los 5 ataques de su tipo, **dónde aparece** como enemigo salvaje, cuántas veces lo has derrotado y los datos de tu Pokémon (nivel, estrellas, naturaleza, IVs, copias). Los no registrados se ven como silueta.
- **Buscador y filtros**: por nombre o número, región, tipo y estado (registrados, sin registrar, los tengo, con shiny, formas regionales), y orden por número, nombre, rareza, nivel o estadísticas.
- **Resumen**: progreso por región, especies que tienes, shinies, formas regionales, Megas y **bestiario** (especies distintas derrotadas).
- Cada Pokémon registrado da +1 % de daño.

## Música y sonido

La música es **original** y se genera con código, en un estilo relajado y cálido. Cada pista usa una progresión de acordes conocida y melodías de frases de 4 compases (motivo, respuesta, repetición y cadencia). No usa ninguna melodía de los juegos de Pokémon.

- **3 estilos** (Ajustes → Sonido): **Cálido** (cuerdas suaves, melodía con vibrato, eco, caja de música y escobillas), **Retro 8 bits** (pulsos secos, bajo triangular, arpegios rápidos y percusión de ruido, sin reverberación) y **Ensueño** (más lento, cuerdas anchas, melodía de seno con mucho eco y campanitas).
- **20 pistas**: título, una por región (con su tonalidad y tempo), jefes, jefe final, **Nico** (y su duelo final), entrenadores, Torre, evento semanal, Liga y Guardería.
- **Sala de música** (Ajustes): escucha cada pista, que se **desbloquea jugando** (llegar a una región, vencer un jefe, ganar a Nico, usar la Torre, el evento, la Liga o la crianza), y fija la que quieras como música de fondo.
- **Qué suena**: por región (una pista por región y otra para jefes, duelos, Torre y eventos), aleatorio (cambia cada dos vueltas con las pistas desbloqueadas) o pista fija.
- **Volúmenes**: general, música, efectos y sonidos de combate por separado. La música puede **silenciarse en segundo plano** al cambiar de pestaña del navegador.
- **Subtítulos de sonidos** (accesibilidad): muestran en pantalla los sonidos importantes (jefe, duelo, objeto, tickets, evolución, derrota…).

La calidad de la composición se comprueba con números: en todas las pistas los tiempos fuertes caen en notas del acorde, el 80% de los movimientos de la melodía son de un paso, los saltos grandes son menos del 10% y el volumen no satura.

## Tutorial

Al empezar, una guía paso a paso te enseña el combate, las monedas, subir de nivel, abrir una Poké Ball, el equipo, los objetos, las habilidades y las misiones. Se puede repetir desde Ajustes.

## Apoyar el proyecto

Si te gusta, puedes invitarme a un café en [Ko-fi](https://ko-fi.com/danelalonso): hay botones en la pantalla de inicio y en Ajustes.

## Para volver cada día

- Recompensa diaria con racha de 7 días, **4 misiones diarias** (de 21 posibles) y **3 misiones semanales** (de 12).
- **299 logros** en 62 categorías (incluidos entrenadores, rival, bestiario, fusiones y pistas de música): etapas, Pokédex regional, colecciones por tipo, estrellas, niveles, críticos, rachas, mejoras al máximo…
- **Pokédex** con ficha, buscador y filtros: cada Pokémon registrado da +1% de daño.

## Liga Pokémon (prestigio)

A partir de la etapa 60 puedes reiniciar el viaje a cambio de **medallas** (+3% de daño y monedas cada una) y **Puntos de Liga**. Los puntos se gastan en la **Tienda de la Liga**, con 14 mejoras permanentes: daño, monedas, niveles iniciales, huecos de equipo, ganancias offline, capturas, shinies, gemas, habilidades, polvo, daño por toque, críticos, descuento en Poké Balls y tiempo contra jefes.

Tu equipo también sigue ganando monedas hasta 8 horas mientras estás fuera, ampliable en la Liga.

## Progresión y equilibrio

Todas las constantes están en `Core.K` (`js/core.js`) y el ritmo se ha calibrado con simulaciones en Node (cargando `pokedex.js`, `idle.js` y `core.js`) de un jugador que compra siempre lo más rentable y toca 2 veces por segundo.

**Fórmulas principales**

- **Vida del enemigo** = (100 · g^(etapa−1) + 6 · etapa) · curva. El factor `g` es 1,17 y baja poco a poco hasta 1,115 entre las etapas 100 y 400, y la curva añade un endurecimiento suave desde la etapa 50.
- **Monedas por baja** ≈ vida · 0,0012 · d(etapa) + 0,5 + 0,12 · etapa, con d = 0,994^etapa hasta la 150 y 0,997 por etapa a partir de ahí. Los jefes dan x6.
- **Coste de subir de nivel** = 6 · 1,15^(nivel−1) hasta el nivel 100 y 1,13 por nivel a partir de ahí (por rareza x1 a x2,4). **Daño por nivel**: x1,075 y x2 cada 25 niveles. El tramo suave evita que el juego se atasque del todo en las etapas altas.
- **Huecos de equipo**: 150, 3 K, 100 K, 20 M y 15 B monedas.
- **Jefes**: vida x6 (líder), x8 (Alto Mando), x11 (campeón), x15 (legendario) o x20 (final), con 30 a 60 s de tiempo.
- **Medallas de la Liga** = ((etapa−45)/12)^1,4, cada una +3% de daño y monedas.

**Para que no se haga pesado**

- El juego **no entra en un jefe** hasta tener poder para vencerlo (60% o más). Si no está listo, sigue combatiendo y lo reta solo al llegar al 95%. Se ve el «Poder vs jefe» y se puede desactivar en Ajustes.
- Cada intento fallido **debilita al jefe un 8%** (hasta un 65%).
- Los tickets grandes y los objetos de los jefes caen sobre todo la primera vez que los vences, para que repetir el viaje no regale poder sin límite.

**Ritmo medido (jugador activo y muy eficiente; uno normal tardará de 1,5 a 2,5 veces más)**

| Sin reiniciar la Liga | Tiempo activo |
|---|---|
| Etapa 20 | 6 min |
| Etapa 40 | 30 min |
| Etapa 60 (se desbloquea la Liga) | 1 h |
| Etapa 100 | 2,4 h |
| Etapa 140 (fin de Kanto) | 4 h |
| Etapa 200 | 6,6 h |
| Etapa 280 | 26 h |

Sin reiniciar, a partir de la etapa ~280 hay un muro de días: es el momento de repetir el viaje en la Liga. Jugando 2 h al día y reiniciando cuando compensa, la simulación llega hacia la etapa 500 el día 7, 630 el día 14 y 670–700 el día 21–30; después el avance es muy lento, un reto para los más constantes.

**Otros recursos**

- Polvo estelar: los tickets caros cuestan más (Poké 40, Super 150, Ultra 500, Master 2200) para que el polvo no los regale.
- Torre: pasado el piso 100 solo cada 10 pisos da un ticket Master y el resto da Ultra, para que los pisos profundos no desbalanceen la economía.
- Las gemas salen sobre todo de logros y misiones (unos 190 al día de ritmo constante); los huevos, fragmentos Mega y premios de evento se calibraron para no apartar de la progresión principal.

## Créditos

- Sprites y retratos: [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab), licencia **CC BY-NC 4.0**. Los artistas aparecen en `CREDITS.md`. `tools/fetch_pokemon.py` descarga sprites y datos (por ejemplo `python3 tools/fetch_pokemon.py 1 1025`).
- Datos: [PokéAPI](https://pokeapi.co/).
- El motor de escenarios (`js/art/tiles.js`), los efectos (`js/art/vfx.js`) y los iconos (`js/art/icons.js`) están adaptados de [pokesurvivor](https://github.com/JPTER78/pokesurvivor) (MIT, ver `LICENSE-POKESURVIVOR.txt`).
- Pokémon © Nintendo / Creatures / GAME FREAK. Este proyecto no está afiliado a ellos.
