-- =====================================================================================
-- PokéIdle · esquema de Supabase (PostgreSQL)
--
-- Cómo usarlo: Supabase → SQL Editor → pega todo este archivo → Run.
-- Es idempotente: puedes volver a ejecutarlo tras una actualización sin perder datos.
--
-- Qué guarda:
--   profiles        nombre público, avatar, título, marco, código de amigo, opciones de privacidad
--   saves           la partida de cada jugador (comprimida) con control de versiones (rev)
--   save_backups    las 3 copias de seguridad más recientes de cada partida
--   scores          la mejor marca de cada jugador para los rankings (etapa, Rango, Torre, …)
--   weekly_scores   marcas del evento semanal (ranking semanal)
--   friendships     amigos (por código de amigo)
--   reports         denuncias de jugadores
--   blocked_words   palabras prohibidas en los nombres
--
-- Seguridad: todas las tablas tienen RLS. El navegador NO escribe directamente en ellas
-- (salvo leer lo suyo): todo pasa por funciones (RPC) que validan los datos. Los rankings
-- se leen con funciones, así nadie ve correos ni datos privados de otros jugadores.
-- =====================================================================================

-- ------------------------------------------------------------------ utilidades
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- semana de juego (igual que en el cliente: Math.floor((día + 3) / 7), con el día en UTC)
create or replace function public.game_week(p_at timestamptz default now()) returns int
language sql immutable as $$ select floor((extract(epoch from p_at) / 86400 + 3) / 7)::int $$;

-- ------------------------------------------------------------------ nombres prohibidos
create table if not exists public.blocked_words (word text primary key check (word = lower(word)));
insert into public.blocked_words (word) values
  ('puta'), ('puto'), ('mierda'), ('cabron'), ('gilipollas'), ('pendejo'), ('coño'), ('joder'), ('nazi'), ('hitler'),
  ('fuck'), ('shit'), ('bitch'), ('cunt'), ('nigg'), ('faggot'), ('rape'), ('admin'), ('moderador'), ('pokeidle')
on conflict do nothing;

create or replace function public.nickname_ok(p text) returns boolean language sql stable as $$
  select p is not null
     and p ~ '^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ _.-]{3,16}$'
     and p = btrim(p)
     and not exists (select 1 from public.blocked_words w where case
           when w.word in ('puta', 'puto', 'rape', 'coño') then lower(p) ~ ('(^|[^[:alnum:]])' || w.word || '($|[^[:alnum:]])')     -- como palabra suelta («puta» ≠ «Computadora», «rape» ≠ «Grape»)
           else lower(p) like '%' || w.word || '%' end)
$$;

-- ------------------------------------------------------------------ perfiles
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  nickname         text not null,
  nickname_set     boolean not null default false,        -- false = nombre automático (aún no lo ha elegido)
  avatar           int not null default 0 check (avatar between 0 and 20000),
  title            text not null default 'novato' check (char_length(title) between 1 and 24),
  frame            text not null default 'classic' check (char_length(frame) between 1 and 24),
  friend_code      text not null unique,
  show_in_rankings boolean not null default true,
  banned           boolean not null default false,        -- lo cambias tú (administrador)
  lang             text check (lang in ('es', 'en')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint nickname_valid check (public.nickname_ok(nickname))
);
create unique index if not exists profiles_nickname_key on public.profiles (lower(nickname));
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- nombre automático y único: «Entrenador4821», «Ash1033»…
create or replace function public.new_nickname(p_base text) returns text
language plpgsql security definer set search_path = public as $$
declare base text; cand text; i int := 0;
begin
  base := left(regexp_replace(coalesce(p_base, ''), '[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]', '', 'g'), 10);
  if char_length(base) < 3 or not public.nickname_ok(base) then base := 'Entrenador'; end if;
  loop
    cand := base || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when public.nickname_ok(cand) and not exists (select 1 from public.profiles where lower(nickname) = lower(cand));
    i := i + 1;
    if i > 30 then cand := 'Entrenador' || lpad(floor(random() * 10000)::int::text, 4, '0'); exit; end if;
  end loop;
  return cand;
end $$;

create or replace function public.new_friend_code() returns text
language plpgsql volatile as $$
declare c text;
begin
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.profiles where friend_code = c);
  end loop;
  return c;
end $$;

-- al crearse un usuario (Google) se le crea el perfil
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, friend_code)
  values (new.id, public.new_nickname(coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))), public.new_friend_code())
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ partidas
create table if not exists public.saves (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  data           text not null,                              -- JSON de la partida, normalmente gzip + base64
  format         text not null default 'gzip-b64' check (format in ('json', 'gzip-b64')),
  schema_version int not null default 1,
  rev            bigint not null default 1,                  -- sube en cada guardado (control de conflictos)
  max_stage      int not null default 0,
  medals         int not null default 0,
  asc_rank       int not null default 0,
  essence        int not null default 0,
  dex_count      int not null default 0,
  play_time      int not null default 0,                     -- segundos jugados
  device         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.save_backups (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  data       text not null,
  format     text not null,
  rev        bigint not null,
  max_stage  int not null default 0,
  medals     int not null default 0,
  play_time  int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists save_backups_user_idx on public.save_backups (user_id, created_at desc);

-- ------------------------------------------------------------------ rankings
create table if not exists public.scores (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  max_stage    int not null default 0,
  asc_rank     int not null default 0,
  essence      int not null default 0,
  tower_best   int not null default 0,
  master_level int not null default 0,
  dex_count    int not null default 0,
  rivals       int not null default 0,
  medals       int not null default 0,
  play_time    int not null default 0,
  flagged      boolean not null default false,               -- sospechoso: no sale en los rankings
  flag_reason  text,
  last_submit  timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists scores_stage_idx on public.scores (max_stage desc) where not flagged;
create index if not exists scores_tower_idx on public.scores (tower_best desc) where not flagged;

create table if not exists public.weekly_scores (
  week_id      int not null,
  user_id      uuid not null references auth.users (id) on delete cascade,
  event_kills  int not null default 0,
  event_tiers  int not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (week_id, user_id)
);
create index if not exists weekly_scores_rank_idx on public.weekly_scores (week_id, event_kills desc);

-- ------------------------------------------------------------------ amigos y denuncias
create table if not exists public.friendships (
  user_id    uuid not null references auth.users (id) on delete cascade,
  friend_id  uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_id   uuid not null references auth.users (id) on delete cascade,
  reason      text not null check (char_length(reason) between 1 and 300),
  created_at  timestamptz not null default now(),
  handled     boolean not null default false
);

-- ------------------------------------------------------------------ seguridad (RLS)
alter table public.profiles      enable row level security;
alter table public.saves         enable row level security;
alter table public.save_backups  enable row level security;
alter table public.scores        enable row level security;
alter table public.weekly_scores enable row level security;
alter table public.friendships   enable row level security;
alter table public.reports       enable row level security;
alter table public.blocked_words enable row level security;

-- Supabase da por defecto todos los permisos a anon/authenticated: los quitamos y damos solo lectura de lo propio
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists saves_select_own on public.saves;
create policy saves_select_own on public.saves for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists backups_select_own on public.save_backups;
create policy backups_select_own on public.save_backups for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists scores_select_own on public.scores;
create policy scores_select_own on public.scores for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists friendships_select_own on public.friendships;
create policy friendships_select_own on public.friendships for select to authenticated using (user_id = (select auth.uid()));

grant select on public.profiles, public.saves, public.save_backups, public.scores, public.friendships to authenticated;

-- ------------------------------------------------------------------ funciones: perfil
-- Devuelve (y crea si falta) el perfil del jugador conectado
create or replace function public.ensure_profile() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.profiles%rowtype; meta jsonb;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into p from public.profiles where id = uid;
  if not found then
    select raw_user_meta_data into meta from auth.users where id = uid;
    insert into public.profiles (id, nickname, friend_code)
    values (uid, public.new_nickname(coalesce(meta ->> 'name', meta ->> 'full_name', '')), public.new_friend_code())
    returning * into p;
  end if;
  return jsonb_build_object('nickname', p.nickname, 'nickname_set', p.nickname_set, 'avatar', p.avatar, 'title', p.title, 'frame', p.frame,
    'friend_code', p.friend_code, 'show_in_rankings', p.show_in_rankings, 'banned', p.banned);
end $$;

create or replace function public.set_nickname(p_nickname text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n text := btrim(coalesce(p_nickname, ''));
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform public.ensure_profile();
  if not public.nickname_ok(n) then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  begin
    update public.profiles set nickname = n, nickname_set = true where id = uid;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'taken');
  end;
  return jsonb_build_object('ok', true, 'nickname', n);
end $$;

create or replace function public.nickname_available(p_nickname text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); n text := btrim(coalesce(p_nickname, ''));
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not public.nickname_ok(n) then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  if exists (select 1 from public.profiles where lower(nickname) = lower(n) and id <> uid) then
    return jsonb_build_object('ok', false, 'reason', 'taken');
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.update_profile(p_avatar int, p_title text, p_frame text, p_show boolean default null, p_lang text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform public.ensure_profile();
  update public.profiles set
    avatar = greatest(0, least(coalesce(p_avatar, avatar), 20000)),
    title = case when p_title ~ '^[a-z0-9_]{1,24}$' then p_title else title end,
    frame = case when p_frame ~ '^[a-z0-9_]{1,24}$' then p_frame else frame end,
    show_in_rankings = coalesce(p_show, show_in_rankings),
    lang = case when p_lang in ('es', 'en') then p_lang else lang end
  where id = uid;
  return jsonb_build_object('ok', true);
end $$;

-- ------------------------------------------------------------------ funciones: partida en la nube
-- Guarda la partida. p_base_rev es la versión que el cliente creía tener; si no coincide
-- hay conflicto (la partida cambió desde otro dispositivo) y no se sobrescribe, salvo p_force.
create or replace function public.save_game(p_data text, p_format text, p_base_rev bigint, p_meta jsonb default '{}'::jsonb, p_device text default null, p_force boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); cur public.saves%rowtype; newrev bigint; lastb timestamptz;
  v_stage int := greatest(0, least(coalesce((p_meta ->> 'max_stage')::int, 0), 100000000));
  v_medals int := greatest(0, least(coalesce((p_meta ->> 'medals')::int, 0), 2000000000));
  v_rank int := greatest(0, least(coalesce((p_meta ->> 'asc_rank')::int, 0), 1000000));
  v_ess int := greatest(0, least(coalesce((p_meta ->> 'essence')::int, 0), 2000000000));
  v_dex int := greatest(0, least(coalesce((p_meta ->> 'dex_count')::int, 0), 5000));
  v_time int := greatest(0, least(coalesce((p_meta ->> 'play_time')::int, 0), 2000000000));
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_format not in ('json', 'gzip-b64') then raise exception 'bad_format'; end if;
  if p_data is null or char_length(p_data) < 2 or char_length(p_data) > 4000000 then raise exception 'bad_size'; end if;
  select * into cur from public.saves where user_id = uid for update;
  if not found then
    insert into public.saves (user_id, data, format, rev, max_stage, medals, asc_rank, essence, dex_count, play_time, device)
    values (uid, p_data, p_format, 1, v_stage, v_medals, v_rank, v_ess, v_dex, v_time, left(p_device, 60))
    returning rev into newrev;
    return jsonb_build_object('ok', true, 'rev', newrev);
  end if;
  if cur.rev <> coalesce(p_base_rev, 0) and not p_force then
    return jsonb_build_object('ok', false, 'reason', 'conflict', 'rev', cur.rev, 'updated_at', cur.updated_at, 'max_stage', cur.max_stage,
      'medals', cur.medals, 'asc_rank', cur.asc_rank, 'dex_count', cur.dex_count, 'play_time', cur.play_time, 'device', cur.device);
  end if;
  -- copia de seguridad: como mucho una cada 30 minutos (siempre al forzar), y solo las 3 últimas
  select max(created_at) into lastb from public.save_backups where user_id = uid;
  if p_force or lastb is null or lastb < now() - interval '30 minutes' then
    insert into public.save_backups (user_id, data, format, rev, max_stage, medals, play_time)
    values (uid, cur.data, cur.format, cur.rev, cur.max_stage, cur.medals, cur.play_time);
    delete from public.save_backups where user_id = uid and id not in (select id from public.save_backups where user_id = uid order by created_at desc, id desc limit 3);
  end if;
  update public.saves set data = p_data, format = p_format, rev = cur.rev + 1, max_stage = v_stage, medals = v_medals, asc_rank = v_rank, essence = v_ess,
    dex_count = v_dex, play_time = v_time, device = left(p_device, 60), updated_at = now()
  where user_id = uid returning rev into newrev;
  return jsonb_build_object('ok', true, 'rev', newrev);
end $$;

-- ------------------------------------------------------------------ funciones: rankings
-- El cliente envía sus marcas; se comprueba que sean razonables. Lo sospechoso se marca (flagged) y deja de salir.
-- Ajusta aquí los límites si hace falta. OJO: el juego corre en el navegador, así que nada de esto
-- impide del todo hacer trampas: los rankings son «por diversión».
create or replace function public.submit_score(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); old public.scores%rowtype; had_old boolean; reason text := null; elapsed numeric;
  n_stage int := greatest(0, least(coalesce((p ->> 'max_stage')::int, 0), 100000000));
  n_rank int := greatest(0, least(coalesce((p ->> 'asc_rank')::int, 0), 1000000));
  n_ess int := greatest(0, least(coalesce((p ->> 'essence')::int, 0), 2000000000));
  n_tower int := greatest(0, least(coalesce((p ->> 'tower_best')::int, 0), 1000000));
  n_master int := greatest(0, least(coalesce((p ->> 'master_level')::int, 0), 1000000));
  n_dex int := greatest(0, least(coalesce((p ->> 'dex_count')::int, 0), 5000));
  n_rivals int := greatest(0, least(coalesce((p ->> 'rivals')::int, 0), 100));
  n_medals int := greatest(0, least(coalesce((p ->> 'medals')::int, 0), 2000000000));
  n_time int := greatest(0, least(coalesce((p ->> 'play_time')::int, 0), 2000000000));
  w_id int := coalesce((p ->> 'week_id')::int, public.game_week());
  w_kills int := greatest(0, least(coalesce((p ->> 'event_kills')::int, 0), 5000000));
  w_tiers int := greatest(0, least(coalesce((p ->> 'event_tiers')::int, 0), 4));
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform public.ensure_profile();
  select * into old from public.scores where user_id = uid for update;
  had_old := found;
  if had_old and old.last_submit > now() - interval '45 seconds' then
    return jsonb_build_object('ok', false, 'reason', 'rate');
  end if;
  -- comprobaciones de verosimilitud
  if n_stage > 150 + n_time / 15.0 then reason := 'stage_vs_time'; end if;
  if reason is null and n_tower > 20 + n_time / 20.0 then reason := 'tower_vs_time'; end if;
  if reason is null and n_master > 10 + n_time / 300.0 then reason := 'master_vs_time'; end if;
  if reason is null and n_rank > 3 + n_time / 120.0 then reason := 'rank_vs_time'; end if;
  if reason is null and n_dex > 1100 then reason := 'dex_too_high'; end if;
  -- topes absolutos y relación con el tiempo jugado (valen también en el primer envío, cuando aún no hay fila anterior)
  if reason is null and n_stage > 6000 then reason := 'stage_abs'; end if;
  if reason is null and n_tower > 1500 then reason := 'tower_abs'; end if;
  if reason is null and n_rank > 2000 then reason := 'rank_abs'; end if;
  if reason is null and n_master > 2000 then reason := 'master_abs'; end if;
  if reason is null and w_kills > 300000 then reason := 'kills_abs'; end if;
  if reason is null and w_kills > 100 + 3 * n_time then reason := 'kills_vs_time'; end if;
  if reason is null and had_old then
    elapsed := extract(epoch from now() - old.last_submit);
    if n_time - old.play_time > elapsed + 300 then reason := 'time_jump'; end if;
    if reason is null and n_stage - old.max_stage > 30 + greatest(0, n_time - old.play_time) / 20.0 then reason := 'stage_jump'; end if;
  end if;
  insert into public.scores as s (user_id, max_stage, asc_rank, essence, tower_best, master_level, dex_count, rivals, medals, play_time, flagged, flag_reason)
  values (uid, n_stage, n_rank, n_ess, n_tower, n_master, n_dex, n_rivals, n_medals, n_time, reason is not null, reason)
  on conflict (user_id) do update set
    max_stage = greatest(s.max_stage, excluded.max_stage), asc_rank = greatest(s.asc_rank, excluded.asc_rank), essence = greatest(s.essence, excluded.essence),
    tower_best = greatest(s.tower_best, excluded.tower_best), master_level = greatest(s.master_level, excluded.master_level),
    dex_count = greatest(s.dex_count, excluded.dex_count), rivals = greatest(s.rivals, excluded.rivals), medals = greatest(s.medals, excluded.medals),
    play_time = greatest(s.play_time, excluded.play_time),
    flagged = s.flagged or excluded.flagged, flag_reason = coalesce(s.flag_reason, excluded.flag_reason),
    last_submit = now(), updated_at = now();
  -- semana actual (se acepta ±1 por las zonas horarias)
  if abs(w_id - public.game_week()) <= 1 and reason is null and (not had_old or not old.flagged) then
    insert into public.weekly_scores as w (week_id, user_id, event_kills, event_tiers) values (w_id, uid, w_kills, w_tiers)
    on conflict (week_id, user_id) do update set event_kills = greatest(w.event_kills, excluded.event_kills), event_tiers = greatest(w.event_tiers, excluded.event_tiers), updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'flagged', reason is not null);
end $$;

-- filas del ranking (interna): value = marca principal, extra = desempate/dato secundario
create or replace function public.board_rows(p_board text) returns table (user_id uuid, nickname text, avatar int, title text, frame text, value bigint, extra bigint, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_board not in ('stage', 'rank', 'tower', 'master', 'dex', 'medals') then raise exception 'bad_board'; end if;
  return query
    select s.user_id, pr.nickname, pr.avatar, pr.title, pr.frame,
      (case p_board when 'stage' then s.max_stage when 'rank' then s.asc_rank when 'tower' then s.tower_best when 'master' then s.master_level when 'dex' then s.dex_count else s.medals end)::bigint,
      (case p_board when 'rank' then s.essence when 'stage' then s.asc_rank else null end)::bigint,
      s.updated_at
    from public.scores s join public.profiles pr on pr.id = s.user_id
    where not s.flagged and not pr.banned and pr.show_in_rankings
      and (case p_board when 'stage' then s.max_stage when 'rank' then s.asc_rank when 'tower' then s.tower_best when 'master' then s.master_level when 'dex' then s.dex_count else s.medals end) > 0;
end $$;

create or replace function public.get_leaderboard(p_board text, p_limit int default 50, p_offset int default 0)
returns table (rank bigint, user_id uuid, nickname text, avatar int, title text, frame text, value bigint, extra bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  select b.rnk, b.user_id, b.nickname, b.avatar, b.title, b.frame, b.value, b.extra, coalesce(b.user_id = auth.uid(), false)
  from (select x.*, rank() over (order by x.value desc, x.extra desc nulls last, x.updated_at asc) as rnk from public.board_rows(p_board) x) b
  order by b.rnk, b.updated_at
  limit greatest(1, least(coalesce(p_limit, 50), 100)) offset greatest(0, coalesce(p_offset, 0))
$$;

create or replace function public.get_my_rank(p_board text) returns table (rank bigint, value bigint, total bigint)
language sql stable security definer set search_path = public as $$
  with b as (select x.user_id, x.value, rank() over (order by x.value desc, x.extra desc nulls last, x.updated_at asc) as rnk from public.board_rows(p_board) x)
  select (select rnk from b where b.user_id = auth.uid()), (select value from b where b.user_id = auth.uid()), (select count(*) from b)
$$;

create or replace function public.get_weekly_board(p_limit int default 50)
returns table (rank bigint, user_id uuid, nickname text, avatar int, title text, frame text, value bigint, extra bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by w.event_kills desc, w.event_tiers desc, w.updated_at asc), w.user_id, pr.nickname, pr.avatar, pr.title, pr.frame, w.event_kills::bigint, w.event_tiers::bigint, coalesce(w.user_id = auth.uid(), false)
  from public.weekly_scores w join public.profiles pr on pr.id = w.user_id join public.scores s on s.user_id = w.user_id
  where w.week_id = public.game_week() and w.event_kills > 0 and not s.flagged and not pr.banned and pr.show_in_rankings
  order by 1, w.updated_at
  limit greatest(1, least(coalesce(p_limit, 50), 100))
$$;

-- ------------------------------------------------------------------ funciones: amigos y denuncias
create or replace function public.add_friend(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); fid uuid; n int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select id into fid from public.profiles where friend_code = upper(btrim(coalesce(p_code, ''))) and not banned;
  if fid is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if fid = uid then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  select count(*) into n from public.friendships where user_id = uid;
  if n >= 100 then return jsonb_build_object('ok', false, 'reason', 'too_many'); end if;
  insert into public.friendships (user_id, friend_id) values (uid, fid), (fid, uid) on conflict do nothing;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.remove_friend(p_friend uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  delete from public.friendships where (user_id = auth.uid() and friend_id = p_friend) or (user_id = p_friend and friend_id = auth.uid());
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.get_friends()
returns table (user_id uuid, nickname text, avatar int, title text, frame text, max_stage int, asc_rank int, tower_best int, master_level int, dex_count int, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.nickname, pr.avatar, pr.title, pr.frame, coalesce(s.max_stage, 0), coalesce(s.asc_rank, 0), coalesce(s.tower_best, 0), coalesce(s.master_level, 0), coalesce(s.dex_count, 0), s.updated_at
  from public.friendships f join public.profiles pr on pr.id = f.friend_id left join public.scores s on s.user_id = f.friend_id
  where f.user_id = auth.uid() and not pr.banned
  order by coalesce(s.max_stage, 0) desc, pr.nickname
$$;

create or replace function public.report_player(p_target uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_target is null or p_target = uid or p_reason is null or btrim(p_reason) = '' then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
  select count(*) into n from public.reports where reporter_id = uid and created_at > now() - interval '1 day';
  if n >= 5 then return jsonb_build_object('ok', false, 'reason', 'rate'); end if;
  insert into public.reports (reporter_id, target_id, reason) values (uid, p_target, left(btrim(p_reason), 300));
  return jsonb_build_object('ok', true);
end $$;

-- borrar mi cuenta y todos mis datos (perfil, partida, copias, marcas, amigos…) por cascada
create or replace function public.delete_my_account() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  delete from auth.users where id = auth.uid();
  return jsonb_build_object('ok', true);
end $$;

-- ------------------------------------------------------------------ permisos de las funciones
-- Postgres da EXECUTE a todos por defecto: lo quitamos y damos solo lo necesario.
revoke all on function public.touch_updated_at(), public.game_week(timestamptz), public.nickname_ok(text), public.new_nickname(text), public.new_friend_code(),
  public.handle_new_user(), public.board_rows(text) from public, anon, authenticated;
revoke all on function public.ensure_profile(), public.set_nickname(text), public.nickname_available(text), public.update_profile(int, text, text, boolean, text),
  public.save_game(text, text, bigint, jsonb, text, boolean), public.submit_score(jsonb), public.get_leaderboard(text, int, int), public.get_my_rank(text),
  public.get_weekly_board(int), public.add_friend(text), public.remove_friend(uuid), public.get_friends(), public.report_player(uuid, text), public.delete_my_account()
  from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, int, int), public.get_my_rank(text), public.get_weekly_board(int) to anon, authenticated;
grant execute on function public.ensure_profile(), public.set_nickname(text), public.nickname_available(text), public.update_profile(int, text, text, boolean, text),
  public.save_game(text, text, bigint, jsonb, text, boolean), public.submit_score(jsonb), public.add_friend(text), public.remove_friend(uuid),
  public.get_friends(), public.report_player(uuid, text), public.delete_my_account() to authenticated;

-- ------------------------------------------------------------------ administración (ejecútalo tú en el SQL Editor)
-- Ver sospechosos:         select u.email, s.* from scores s join auth.users u on u.id = s.user_id where s.flagged;
-- Perdonar a alguien:      update scores set flagged = false, flag_reason = null where user_id = '<uuid>';
-- Expulsar de rankings:    update profiles set banned = true where id = '<uuid>';
-- Ver denuncias:           select r.*, p.nickname from reports r join profiles p on p.id = r.target_id where not r.handled order by r.created_at desc;
-- Añadir palabra vetada:   insert into blocked_words (word) values ('palabra');
