// Configuración de la nube (Supabase). Mientras `url` y `anonKey` estén vacíos el juego funciona
// sin cuentas, solo con la partida guardada en el navegador (como invitado).
// La clave de aquí es la PÚBLICA («publishable» o «anon»): la protege la seguridad por filas del esquema,
// así que puede estar en el repositorio. NUNCA pongas aquí la clave secreta ni la «service_role».
// Guía paso a paso: supabase/README.md
window.CLOUD_CONFIG = {
  url: 'https://nghbhdxvjgxbsfgakpqg.supabase.co',
  anonKey: 'sb_publishable_ph--oCzrNp5xtcqCTXSRsA_AeLF199z',
  redirect: '',     // opcional: a dónde vuelve tras iniciar sesión (por defecto, esta misma página)
  lib: '',          // opcional: dirección de supabase-js si quieres otra versión (por defecto, la fijada en js/cloud.js)
};
