-- Chapitas que activa el comprador y acceso de clientes (etapa 2).
--
-- Hasta ahora todo usuario logueado era "admin" de sus propios datos. Ahora hay dos tipos:
--   · staff: usa el Admin (Pablo). Solo el staff puede crear clientes y páginas.
--   · miembro de un cliente: el dueño de una chapita. No escribe directo en ninguna tabla; lee
--     sus páginas y las guarda con funciones (save_my_pet) que solo tocan los campos permitidos.
--     Así no puede cambiarse el plan, el vencimiento ni nada que no sea suyo.
-- Las chapitas se generan por lote, sin cliente y sin publicar, cada una con un código de
-- activación que va impreso en una tarjetita adentro del paquete (no en la chapita).

-- Staff --------------------------------------------------------------------------------------
create table if not exists public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;
drop policy if exists "staff se ve a sí mismo" on public.staff;
create policy "staff se ve a sí mismo" on public.staff for select to authenticated using (user_id = auth.uid());
-- Quien ya tiene clientes o páginas es staff (Pablo, en DEV y en PROD).
insert into public.staff (user_id)
  select owner_id from public.clients union select owner_id from public.landings
  on conflict do nothing;

create or replace function public.is_staff() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.staff where user_id = auth.uid()) $$;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- Crear clientes y páginas: solo el staff (antes alcanzaba con estar logueado).
drop policy if exists "client owner insert" on public.clients;
create policy "client owner insert" on public.clients for insert to authenticated with check (auth.uid() = owner_id and public.is_staff());
drop policy if exists "landing owner insert" on public.landings;
create policy "landing owner insert" on public.landings for insert to authenticated with check (auth.uid() = owner_id and public.is_staff());

-- Miembros de un cliente ------------------------------------------------------------------------
create table if not exists public.client_members (
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null default '',
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);
alter table public.client_members enable row level security;
drop policy if exists "el miembro se ve a sí mismo" on public.client_members;
create policy "el miembro se ve a sí mismo" on public.client_members for select to authenticated using (user_id = auth.uid());
drop policy if exists "el dueño del cliente ve sus miembros" on public.client_members;
create policy "el dueño del cliente ve sus miembros" on public.client_members for select to authenticated
  using (exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()));
drop policy if exists "el dueño del cliente quita miembros" on public.client_members;
create policy "el dueño del cliente quita miembros" on public.client_members for delete to authenticated
  using (exists (select 1 from public.clients c where c.id = client_id and c.owner_id = auth.uid()));

create or replace function public.is_client_member(p_client uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.client_members where client_id = p_client and user_id = auth.uid()) $$;
revoke execute on function public.is_client_member(uuid) from public, anon;
grant execute on function public.is_client_member(uuid) to authenticated;

-- El miembro lee (solo lee) las páginas de su cliente.
drop policy if exists "el miembro lee las páginas de su cliente" on public.landings;
create policy "el miembro lee las páginas de su cliente" on public.landings for select to authenticated
  using (client_id is not null and public.is_client_member(client_id));

-- Fotos: cada uno sube a su carpeta, pero solo el staff o un miembro (no cualquier registrado).
drop policy if exists "landing-assets insert own" on storage.objects;
create policy "landing-assets insert own" on storage.objects for insert to authenticated with check (
  bucket_id = 'landing-assets' and (storage.foldername(name))[1] = auth.uid()::text
  and (public.is_staff() or exists (select 1 from public.client_members m where m.user_id = auth.uid()))
);

-- Lotes y códigos de activación -------------------------------------------------------------
create table if not exists public.tag_batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  reseller text not null default '',
  created_at timestamptz not null default now()
);
alter table public.tag_batches enable row level security;
drop policy if exists "el staff maneja sus lotes" on public.tag_batches;
create policy "el staff maneja sus lotes" on public.tag_batches for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid() and public.is_staff());

alter table public.landings
  add column if not exists batch_id uuid references public.tag_batches (id) on delete set null,
  add column if not exists tag_number integer,
  add column if not exists activated_at timestamptz;

-- Aparte de landings a propósito: las columnas de una landing publicada son legibles por
-- cualquiera, y el código no tiene que poder leerse nunca desde afuera.
create table if not exists public.tag_activations (
  landing_id uuid primary key references public.landings (id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
alter table public.tag_activations enable row level security;
drop policy if exists "el dueño de la chapita ve y crea su código" on public.tag_activations;
create policy "el dueño de la chapita ve y crea su código" on public.tag_activations for all to authenticated
  using (exists (select 1 from public.landings l where l.id = landing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.landings l where l.id = landing_id and l.owner_id = auth.uid()));

-- ¿La chapita espera activación? Lo usa /go/[id] para mandar a "Activar" en vez de dar 404.
create or replace function public.tag_pending(p_landing uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.tag_activations where landing_id = p_landing) $$;
revoke execute on function public.tag_pending(uuid) from public;
grant execute on function public.tag_pending(uuid) to anon, authenticated;

-- ¿El código existe? Para avisar antes de pedir el email. No dice de qué chapita es.
create or replace function public.tag_code_valid(p_code text) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.tag_activations where code = upper(replace(trim(p_code), '-', ''))) $$;
revoke execute on function public.tag_code_valid(text) from public;
grant execute on function public.tag_code_valid(text) to anon, authenticated;

-- Activar: el usuario ya entró con su email. La chapita pasa a un cliente suyo (si ya activó
-- otra, la misma carpeta; si no, uno nuevo con su email) y deja de esperar activación.
create or replace function public.activate_tag(p_code text) returns uuid
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_user uuid := auth.uid();
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_landing uuid;
  v_owner uuid;
  v_client uuid;
begin
  if v_user is null then raise exception 'sin_sesion'; end if;
  select a.landing_id, l.owner_id into v_landing, v_owner
    from public.tag_activations a join public.landings l on l.id = a.landing_id
    where a.code = upper(replace(trim(p_code), '-', ''))
    for update of a;
  if v_landing is null then raise exception 'codigo_invalido'; end if;

  select m.client_id into v_client
    from public.client_members m join public.clients c on c.id = m.client_id
    where m.user_id = v_user and c.owner_id = v_owner
    order by m.created_at limit 1;
  if v_client is null then
    insert into public.clients (owner_id, name, email) values (v_owner, coalesce(nullif(v_email, ''), 'Cliente'), v_email) returning id into v_client;
    insert into public.client_members (client_id, user_id, email, terms_accepted_at) values (v_client, v_user, v_email, now());
  else
    update public.client_members set terms_accepted_at = now() where client_id = v_client and user_id = v_user;
  end if;

  update public.landings set client_id = v_client, activated_at = now() where id = v_landing;
  delete from public.tag_activations where landing_id = v_landing;
  return v_landing;
end $$;
revoke execute on function public.activate_tag(text) from public, anon;
grant execute on function public.activate_tag(text) to authenticated;

-- Guardar la chapita desde el panel del dueño. Toca solo nombre, foto, colores y los datos de
-- la mascota; publica si se pide (la app lo pide cuando hay un WhatsApp cargado).
create or replace function public.save_my_pet(
  p_landing uuid, p_name text, p_pet jsonb, p_logo_url text, p_accent text, p_background text, p_publish boolean
) returns void
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_landing public.landings;
  v_folder text := '/storage/v1/object/public/landing-assets/' || auth.uid()::text || '/';
begin
  select * into v_landing from public.landings where id = p_landing for update;
  if v_landing.id is null or v_landing.business_type <> 'pet' or v_landing.client_id is null or not public.is_client_member(v_landing.client_id) then
    raise exception 'sin_permiso';
  end if;
  if length(trim(coalesce(p_name, ''))) not between 1 and 60 then raise exception 'nombre_invalido'; end if;
  if p_pet is null or jsonb_typeof(p_pet) <> 'object' or length(p_pet::text) > 12000 then raise exception 'datos_invalidos'; end if;
  if p_accent !~ '^#[0-9a-fA-F]{6}$' or p_background !~ '^#[0-9a-fA-F]{6}$' then raise exception 'color_invalido'; end if;
  -- La foto: la misma de antes, ninguna, o una subida por este usuario a su carpeta.
  if p_logo_url is not null and p_logo_url <> '' and p_logo_url is distinct from v_landing.logo_url and position(v_folder in p_logo_url) = 0 then
    raise exception 'foto_invalida';
  end if;

  update public.landings set
    business_name = trim(p_name),
    description = left(coalesce(p_pet ->> 'message', ''), 200),
    primary_color = p_accent,
    background_color = p_background,
    logo_url = nullif(p_logo_url, ''),
    button_style = coalesce(button_style, '{}'::jsonb) || jsonb_build_object('pet', p_pet),
    published = published or coalesce(p_publish, false),
    -- Igual que al publicar desde el Admin (publishUpdate): el año del plan anual arranca acá.
    expires_at = case when coalesce(p_publish, false) and not published and plan = 'annual' and expires_at is null then now() + interval '1 year' else expires_at end
  where id = p_landing;
end $$;
revoke execute on function public.save_my_pet(uuid, text, jsonb, text, text, text, boolean) from public, anon;
grant execute on function public.save_my_pet(uuid, text, jsonb, text, text, text, boolean) to authenticated;

-- Denuncias -------------------------------------------------------------------------------------
-- Cualquiera puede denunciar una página publicada; solo su dueño (staff) las lee.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.landings (id) on delete cascade,
  reason text not null check (length(reason) between 1 and 1000),
  contact text not null default '' check (length(contact) <= 200),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.reports enable row level security;
drop policy if exists "cualquiera denuncia una página publicada" on public.reports;
create policy "cualquiera denuncia una página publicada" on public.reports for insert to anon, authenticated
  with check (resolved_at is null and exists (select 1 from public.landings l where l.id = landing_id and l.published = true));
drop policy if exists "el dueño lee y resuelve las denuncias" on public.reports;
create policy "el dueño lee y resuelve las denuncias" on public.reports for select to authenticated
  using (exists (select 1 from public.landings l where l.id = landing_id and l.owner_id = auth.uid()));
drop policy if exists "el dueño resuelve las denuncias" on public.reports;
create policy "el dueño resuelve las denuncias" on public.reports for update to authenticated
  using (exists (select 1 from public.landings l where l.id = landing_id and l.owner_id = auth.uid()));

grant select, insert, update, delete on public.staff, public.client_members, public.tag_batches, public.tag_activations, public.reports to authenticated;
grant insert on public.reports to anon;
