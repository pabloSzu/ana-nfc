-- La etapa de pruebas de Mascotas queda reversible: no se borra ningún lote, chapita, código,
-- cliente ni ficha. Los lotes y fichas de mascota existentes se archivan; los nuevos nacen
-- visibles. Las fichas archivadas se despublican para que tampoco sigan visibles por su URL.
alter table public.tag_batches
  add column if not exists archived_at timestamptz;

alter table public.landings
  add column if not exists pet_archived_at timestamptz;

update public.tag_batches
  set archived_at = now()
  where archived_at is null;

update public.landings
  set pet_archived_at = now(), published = false
  where business_type = 'pet' and pet_archived_at is null;

create index if not exists tag_batches_owner_archived_idx
  on public.tag_batches (owner_id, archived_at, created_at desc);

create index if not exists landings_owner_pet_archived_idx
  on public.landings (owner_id, pet_archived_at)
  where business_type = 'pet';

-- Un QR o código viejo tampoco debe revivir una prueba archivada.
create or replace function public.tag_pending(p_landing uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1
      from public.tag_activations a
      join public.landings l on l.id = a.landing_id
      where a.landing_id = p_landing and l.pet_archived_at is null
    )
  $$;
revoke execute on function public.tag_pending(uuid) from public;
grant execute on function public.tag_pending(uuid) to anon, authenticated;

create or replace function public.tag_code_valid(p_code text) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1
      from public.tag_activations a
      join public.landings l on l.id = a.landing_id
      where a.code = upper(replace(trim(p_code), '-', '')) and l.pet_archived_at is null
    )
  $$;
revoke execute on function public.tag_code_valid(text) from public, anon, authenticated;
grant execute on function public.tag_code_valid(text) to service_role;

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
  if public.is_staff() then raise exception 'cuenta_staff'; end if;

  v_key := 'activate:' || v_user::text;
  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));
  if (select count(*) from public.rate_limit_hits where key = v_key and at > now() - interval '15 minutes') >= 10 then
    raise exception 'demasiados_intentos';
  end if;

  select a.landing_id, l.owner_id into v_landing, v_owner
    from public.tag_activations a join public.landings l on l.id = a.landing_id
    where a.code = upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'))
      and l.pet_archived_at is null
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
    insert into public.clients (owner_id, name, email)
      values (v_owner, coalesce(nullif(v_email, ''), 'Cliente'), v_email)
      returning id into v_client;
    insert into public.client_members (client_id, user_id, email, terms_accepted_at, terms_version)
      values (v_client, v_user, v_email, now(), nullif(p_terms_version, ''));
  else
    update public.client_members
      set terms_accepted_at = now(), terms_version = nullif(p_terms_version, '')
      where client_id = v_client and user_id = v_user;
  end if;

  update public.landings set
    client_id = v_client,
    activated_at = now(),
    business_name = case when business_name ~ '^Chapita [0-9]+$' then '' else business_name end
    where id = v_landing;
  delete from public.tag_activations where landing_id = v_landing;
  return v_landing;
end $$;

revoke execute on function public.activate_tag(text, text) from public, anon;
grant execute on function public.activate_tag(text, text) to authenticated;

-- Lote y fichas cambian juntos: si algo falla, PostgreSQL revierte toda la operación.
create or replace function public.set_tag_batch_archived(p_batch uuid, p_archived boolean) returns boolean
  language plpgsql security invoker set search_path = ''
  as $$
declare
  v_rows integer;
  v_at timestamptz := case when p_archived then now() else null end;
begin
  update public.tag_batches
    set archived_at = v_at
    where id = p_batch and owner_id = auth.uid();
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then return false; end if;

  update public.landings
    set pet_archived_at = v_at,
        published = case when p_archived then false else published end
    where batch_id = p_batch and owner_id = auth.uid() and business_type = 'pet';
  return true;
end $$;

revoke execute on function public.set_tag_batch_archived(uuid, boolean) from public, anon;
grant execute on function public.set_tag_batch_archived(uuid, boolean) to authenticated;
