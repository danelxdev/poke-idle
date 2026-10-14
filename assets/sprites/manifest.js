// Sprites en PNG que sustituyen a los generados por código.
// Pon el PNG en esta carpeta y añade una línea aquí. Formato:
//   id: { src: 'archivo.png', frames: 1 }
// - id: el identificador del personaje (ver js/data/chars.js), p. ej. 'goku_kid'.
//   Para una transformación usa 'id@forma' (p. ej. 'goku_namek@ssj') y para la versión shiny 'id*'.
// - frames: número de fotogramas en horizontal, en este orden:
//   reposo, reposo 2, andar A, andar B, ataque (si hay menos, se repiten).
// - scale (opcional): escala del dibujo; por defecto se ajusta a unos 44 px de alto.
// El personaje debe mirar a la DERECHA y tener los pies en el borde inferior de la imagen.
window.SPRITE_FILES = {
  // goku_kid: { src: 'goku_kid.png', frames: 5 },
};
