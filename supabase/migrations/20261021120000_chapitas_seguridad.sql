-- Endurecimiento de las chapitas antes de vender (ver docs/CHAPITAS.md, "Seguridad").
--
-- 1. Las páginas publicadas ya no se pueden listar en masa: se leen de a una, por su link, con
--    public_landing(slug). Antes cualquiera podía bajarse todas las chapitas (con los teléfonos
--    de las familias) con la clave pública.
-- 2. Validar códigos de activación y frenar abusos (intentos, mails, denuncias) pasa por el
--    servidor, con la clave secreta y límites por IP (rate_limit_hit).
-- 3. activate_tag cuenta los intentos fallidos de cada usuario y frena a los 10 en 15 minutos.
-- 4. Una chapita que BIONFC despublica (por una denuncia) queda bloqueada: el dueño no puede
--    volver a publicarla al guardar.
-- 5. La foto que guarda el dueño tiene que ser un archivo suyo de nuestro storage (antes alcanzaba
--    con que la URL contuviera esa ruta en cualquier parte).
-- 6. El bucket acepta solo imágenes y PDF de hasta 10 MB, y ya no se puede listar entero.
-- 7. Índices para cuando haya miles de chapitas.

-- 1. Lectura pública de a una página ----------------------------------------------------------
create or replace function public.is_published_landing(p_landing uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.landings where id = p_landing and published) $$;
revoke execute on function public.is_published_landing(uuid) from public;
grant execute on function public.is_published_landing(uuid) to anon, authenticated, service_role;

-- La página publicada con sus botones habilitados, o null. Sin las columnas internas.
create or replace function public.public_landing(p_slug text) returns jsonb
  language sql stable security definer set search_path = ''
  as $$
    select (to_jsonb(l) - 'request_key' - 'client_id' - 'batch_id' - 'tag_number' - 'activated_at' - 'blocked_at' - 'notes')
      || jsonb_build_object('actions', coalesce((
        select jsonb_agg(to_jsonb(a) order by a.position)
        from public.actions a where a.landing_id = l.id and a.enabled
      ), '[]'::jsonb))
    from public.landings l
    where l.slug = p_slug and l.published
  $$;
revoke execute on function public.public_landing(text) from public;
grant execute on function public.public_landing(text) to anon, authenticated, service_role;

-- Para /go/[id]: el link de una página publicada, o null.
create or replace function public.public_landing_slug(p_landing uuid) returns text
  language sql stable security definer set search_path = ''
  as $$ select slug from public.landings where id = p_landing and published $$;
revoke execute on function public.public_landing_slug(uuid) from public;
grant execute on function public.public_landing_slug(uuid) to anon, authenticated, service_role;

drop policy if exists "Public can read published landings" on public.landings;
drop policy if exists "landing public" on public.landings;
drop policy if exists "Public can read enabled actions of published landings" on public.actions;
drop policy if exists "action public" on public.actions;

-- Las políticas que miraban "landings publicadas" lo hacen ahora con la función, porque anon ya
-- no ve la tabla.
drop policy if exists "registrar visita de una landing publicada" on public.landing_views;
create policy "registrar visita de una landing publicada" on public.landing_views for insert to anon, authenticated
  with check (public.is_published_landing(landing_id));
drop policy if exists "cualquiera denuncia una página publicada" on public.reports;
create policy "cualquiera denuncia una página publicada" on public.reports for insert to anon, authenticated
  with check (resolved_at is null and public.is_published_landing(landing_id));

-- 2. Límites por clave (IP, email…) -------------------------------------------------------------
create table if not exists public.rate_limit_hits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_at_idx on public.rate_limit_hits (key, at desc);
alter table public.rate_limit_hits enable row level security;
-- Sin políticas: solo la usa el servidor con la clave secreta.

-- true = se permite (y se cuenta); false = se pasó del límite.
create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer) returns boolean
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_count integer;
begin
  if random() < 0.02 then
    delete from public.rate_limit_hits where at < now() - interval '2 days';
  end if;
  select count(*) into v_count from public.rate_limit_hits
    where key = p_key and at > now() - make_interval(secs => p_window_seconds);
  if v_count >= p_max then return false; end if;
  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end $$;
revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

-- Validar un código ya no se puede desde el navegador: solo el servidor, después del límite por IP.
revoke execute on function public.tag_code_valid(text) from anon, authenticated;
grant execute on function public.tag_code_valid(text) to service_role;

-- 3. Activar con límite de intentos ---------------------------------------------------------------
alter table public.client_members add column if not exists terms_version text;

drop function if exists public.activate_tag(text);
-- Devuelve la chapita activada, o null si el código no existe o ya se usó (sin lanzar error, así
-- el intento fallido queda contado).
create or replace function public.activate_tag(p_code text, p_terms_version text default '') returns uuid
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_user uuid := auth.uid();
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_landing uuid;
  v_owner uuid;
  v_client uuid;
  v_key text;
begin
  if v_user is null then raise exception 'sin_sesion'; end if;
  v_key := 'activate:' || v_user::text;
  if (select count(*) from public.rate_limit_hits where key = v_key and at > now() - interval '15 minutes') >= 10 then
    raise exception 'demasiados_intentos';
  end if;

  select a.landing_id, l.owner_id into v_landing, v_owner
    from public.tag_activations a join public.landings l on l.id = a.landing_id
    where a.code = upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'))
    for update of a;
  if v_landing is null then
    insert into public.rate_limit_hits (key) values (v_key);
    return null;
  end if;

  select m.client_id into v_client
    from public.client_members m join public.clients c on c.id = m.client_id
    where m.user_id = v_user and c.owner_id = v_owner
    order by m.created_at limit 1;
  if v_client is null then
    insert into public.clients (owner_id, name, email) values (v_owner, coalesce(nullif(v_email, ''), 'Cliente'), v_email) returning id into v_client;
    insert into public.client_members (client_id, user_id, email, terms_accepted_at, terms_version) values (v_client, v_user, v_email, now(), nullif(p_terms_version, ''));
  else
    update public.client_members set terms_accepted_at = now(), terms_version = nullif(p_terms_version, '') where client_id = v_client and user_id = v_user;
  end if;

  -- El nombre "Chapita N" del lote no es el de la mascota: queda vacío hasta que el dueño lo cargue.
  update public.landings set client_id = v_client, activated_at = now(),
    business_name = case when business_name ~ '^Chapita [0-9]+$' then '' else business_name end
    where id = v_landing;
  delete from public.tag_activations where landing_id = v_landing;
  return v_landing;
end $$;
revoke execute on function public.activate_tag(text, text) from public, anon;
grant execute on function public.activate_tag(text, text) to authenticated;

-- 4 y 5. Bloqueo por moderación y foto del dueño -------------------------------------------------
alter table public.landings add column if not exists blocked_at timestamptz;

create or replace function public.save_my_pet(
  p_landing uuid, p_name text, p_pet jsonb, p_logo_url text, p_accent text, p_background text, p_publish boolean
) returns void
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_landing public.landings;
  v_photo text := '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/landing-assets/' || auth.uid()::text || '/[A-Za-z0-9/._-]+$';
begin
  select * into v_landing from public.landings where id = p_landing for update;
  if v_landing.id is null or v_landing.business_type <> 'pet' or v_landing.client_id is null or not public.is_client_member(v_landing.client_id) then
    raise exception 'sin_permiso';
  end if;
  if length(trim(coalesce(p_name, ''))) not between 1 and 60 then raise exception 'nombre_invalido'; end if;
  if p_pet is null or jsonb_typeof(p_pet) <> 'object' or length(p_pet::text) > 12000 then raise exception 'datos_invalidos'; end if;
  if p_accent !~ '^#[0-9a-fA-F]{6}$' or p_background !~ '^#[0-9a-fA-F]{6}$' then raise exception 'color_invalido'; end if;
  -- La foto: la misma de antes, ninguna, o un archivo de este usuario en nuestro storage.
  if coalesce(p_logo_url, '') <> '' and p_logo_url is distinct from v_landing.logo_url and p_logo_url !~ v_photo then
    raise exception 'foto_invalida';
  end if;

  update public.landings set
    business_name = trim(p_name),
    description = left(coalesce(p_pet ->> 'message', ''), 200),
    primary_color = p_accent,
    background_color = p_background,
    logo_url = nullif(p_logo_url, ''),
    button_style = coalesce(button_style, '{}'::jsonb) || jsonb_build_object('pet', p_pet),
    -- Bloqueada por BIONFC: no se vuelve a publicar sola.
    published = case when blocked_at is not null then false else published or coalesce(p_publish, false) end,
    expires_at = case when blocked_at is null and coalesce(p_publish, false) and not published and plan = 'annual' and expires_at is null then now() + interval '1 year' else expires_at end
  where id = p_landing;
end $$;
revoke execute on function public.save_my_pet(uuid, text, jsonb, text, text, text, boolean) from public, anon;
grant execute on function public.save_my_pet(uuid, text, jsonb, text, text, text, boolean) to authenticated;

-- Conteos de los lotes en la base (traer todas las chapitas para contarlas se corta a las 1.000).
create or replace function public.tag_batch_counts() returns table (batch_id uuid, total bigint, active bigint)
  language sql stable security invoker set search_path = ''
  as $$ select batch_id, count(*), count(activated_at) from public.landings where batch_id is not null group by batch_id $$;
revoke execute on function public.tag_batch_counts() from public, anon;
grant execute on function public.tag_batch_counts() to authenticated;

-- 6. Storage ------------------------------------------------------------------------------------
update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  where id = 'landing-assets';
-- Un bucket público sirve sus archivos sin esta política; con ella, cualquiera podía listar todo.
drop policy if exists "landing-assets public read" on storage.objects;
drop policy if exists "landing-assets read own" on storage.objects;
create policy "landing-assets read own" on storage.objects for select to authenticated using (
  bucket_id = 'landing-assets' and (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Índices --------------------------------------------------------------------------------------
create index if not exists landings_owner_idx on public.landings (owner_id);
create index if not exists landings_client_idx on public.landings (client_id);
create index if not exists landings_batch_idx on public.landings (batch_id, tag_number);
create index if not exists client_members_user_idx on public.client_members (user_id);
create index if not exists reports_landing_idx on public.reports (landing_id);
create index if not exists actions_landing_idx on public.actions (landing_id, position);

grant select, insert, delete on public.rate_limit_hits to service_role;
