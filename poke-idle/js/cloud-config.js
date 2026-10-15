// Configuración de la nube (Supabase). Mientras `url` y `anonKey` estén vacíos el juego funciona
// sin cuentas, solo con la partida guardada en el navegador (como invitado).
// La clave `anonKey` es PÚBLICA (la protege la seguridad por filas del esquema), se puede subir al repositorio.
// Guía paso a paso: supabase/README.md
window.CLOUD_CONFIG = {
  url: '',          // https://TU-PROYECTO.supabase.co
  anonKey: '',      // clave «anon public» de Settings → API
  redirect: '',     // opcional: a dónde vuelve tras iniciar sesión (por defecto, esta misma página)
};
