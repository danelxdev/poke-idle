# PokéIdle · nube con Supabase (cuenta de Google, partida en la nube y rankings)

Todo es **opcional**: mientras `js/cloud-config.js` tenga `url` y `anonKey` vacíos, el juego funciona como siempre
(solo con la partida en el navegador, «jugar como invitado»).

## 1. Crear el proyecto

1. Entra en <https://supabase.com> → **New project** (región cercana a tus jugadores, p. ej. *West EU*).
2. **SQL Editor** → **New query** → pega todo `supabase/schema.sql` → **Run**. Se puede repetir sin problema.
   Crea las tablas, la seguridad (RLS) y las funciones. No hace falta tocar nada más en la base de datos.

## 2. Activar el inicio de sesión con Google

1. En <https://console.cloud.google.com> → *APIs y servicios* → **Pantalla de consentimiento de OAuth** (tipo *Externo*, pon el nombre
   del juego, tu correo y tu dominio) → **Credenciales** → **Crear credenciales → ID de cliente de OAuth** (tipo *Aplicación web*).
2. En *URI de redirección autorizados* añade la que te muestra Supabase en **Authentication → Providers → Google**
   (tiene la forma `https://TU-PROYECTO.supabase.co/auth/v1/callback`).
3. Copia el *Client ID* y el *Client secret* en Supabase → **Authentication → Providers → Google** → activar → Save.
4. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: tu dominio, p. ej. `https://tudominio.com/`
   - **Redirect URLs**: añade `https://tudominio.com/**` (y, si quieres probar en local, `http://localhost:8000/**`).

> Con el dominio `pokeidlegame.com`: Site URL `https://pokeidlegame.com/` y Redirect URL `https://pokeidlegame.com/**`.
> En la pantalla de consentimiento de Google, añade `pokeidlegame.com` como dominio autorizado, enlaza la política de
> privacidad `https://pokeidlegame.com/privacy.html` y pon el estado en **En producción**.

## 3. Conectar el juego

Rellena `js/cloud-config.js` con los datos de **Settings → API**:

```js
window.CLOUD_CONFIG = {
  url: 'https://TU-PROYECTO.supabase.co',
  anonKey: 'eyJ…',   // «anon public»: es pública, la protege el esquema. NUNCA pongas la «service_role».
  redirect: '',      // opcional; por defecto vuelve a la página desde la que se inició sesión
};
```

Sube los cambios (con tu dominio apuntando a donde alojes el juego) y ya está.

## Cómo funciona

- **Invitado**: sin cuenta, la partida vive solo en el navegador. Puedes iniciar sesión más tarde y se sube.
- **Iniciar sesión**: se crea un perfil con nombre automático (`Entrenador4821`); lo cambias en Ajustes → Perfil.
- **Partida en la nube**: se guarda comprimida cada ~2 minutos, al ocultar la pestaña y tras hitos (Ascensión, jefes…).
  Si la partida de la nube y la del dispositivo son distintas, el juego te enseña ambas y eliges cuál conservar
  (la otra queda en una copia de seguridad: 3 en el servidor y una local en `pokeidle.save.v1.bak`).
- **Rankings**: etapa, Rango, Torre, Duelos Maestros, Pokédex, medallas y semanal del evento. Los pueden ver todos,
  también los invitados. Para salir hay que haber iniciado sesión y no haber desactivado «Aparecer en los rankings».
- **Trampas**: el juego corre en el navegador, así que no se pueden evitar del todo. El servidor comprueba que las marcas
  sean verosímiles (etapa frente a tiempo jugado, saltos bruscos…) y oculta las sospechosas. Son rankings «por diversión».

## Administración (SQL Editor)

```sql
-- sospechosos
select u.email, s.* from scores s join auth.users u on u.id = s.user_id where s.flagged;
-- perdonar a alguien
update scores set flagged = false, flag_reason = null where user_id = '<uuid>';
-- sacar a alguien de los rankings
update profiles set banned = true where id = '<uuid>';
-- denuncias pendientes
select r.*, p.nickname from reports r join profiles p on p.id = r.target_id where not r.handled order by r.created_at desc;
-- palabras prohibidas en los nombres
insert into blocked_words (word) values ('palabra');
```

## Privacidad (conviene avisar a los jugadores)

Se guardan: el identificador y el correo de Google (los gestiona Supabase), el nombre público elegido, el avatar, el título,
la partida y las marcas del ranking. En Ajustes → Cuenta hay un botón **Borrar mi cuenta y mis datos** que lo elimina todo.
Si publicas el juego, añade una política de privacidad corta con esto.

## Ideas ya previstas en el esquema (sin interfaz todavía)

Amigos por código (`add_friend`, `get_friends`, `friendships`) y denuncias (`report_player`: sí tiene interfaz, desde el ranking).

> **Si ya habías ejecutado `schema.sql` antes de esta versión:** vuelve a pegarlo y ejecutarlo en el SQL Editor (es idempotente). Añade la función `nickname_available`, que usa el juego para comprobar si un nombre está libre mientras lo escribes.
