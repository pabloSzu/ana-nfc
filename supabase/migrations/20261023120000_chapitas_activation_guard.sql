-- Defensa adicional: una cuenta del equipo no puede quedar como dueña de una chapita por
-- accidente. La pantalla ya lo advierte, pero el control definitivo vive en la base y cubre
-- también llamadas directas al RPC.
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
