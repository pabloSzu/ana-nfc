-- Links de mascota con 4 letras y números ("luna-k7m2") en vez de 4 números ("luna-4821").
-- Con números solos había 9.000 links por nombre: un programa podía probar toby-1000 a
-- toby-9999 con los nombres más comunes y juntar los WhatsApp de las familias. Con 31
-- caracteres (los mismos de las chapitas: sin i, l, o, 0 ni 1, que se confunden al dictarlos)
-- son 923.521 por nombre.
--
-- Además, ninguna página puede usar como link el de una mascota o uno anterior de una mascota
-- (antes solo se miraba landings.slug al crear o renombrar una landing común).

create or replace function public.assign_pet_slug() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_chars constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  v_base text;
  v_candidate text;
  v_try int := 0;
begin
  -- El stock de un lote sin activar todavía se llama "Chapita N": recién al activarla tiene nombre.
  if new.business_type <> 'pet' or (new.batch_id is not null and new.activated_at is null)
     or trim(coalesce(new.business_name, '')) = '' then
    return new;
  end if;

  v_base := public.pet_slug_base(new.business_name);
  -- Ya tiene un link nuevo con este mismo nombre: no se toca.
  if new.pet_slug is not null and new.pet_slug ~ ('^' || v_base || '-[a-hjkmnp-z2-9]{4}$') then
    return new;
  end if;

  loop
    v_try := v_try + 1;
    v_candidate := v_base || '-' || (
      select string_agg(substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1), '')
      from generate_series(1, 4));
    exit when not public.pet_slug_taken(v_candidate, new.id);
    -- Casi nunca llega acá; si pasa, se usa el id (que es único).
    if v_try >= 40 then
      v_candidate := v_base || '-' || left(replace(new.id::text, '-', ''), 10);
      exit;
    end if;
  end loop;

  -- El link anterior queda como alias y sigue funcionando.
  if new.pet_slug is not null and new.pet_slug <> v_candidate then
    insert into public.pet_slug_aliases (slug, landing_id) values (new.pet_slug, new.id)
      on conflict (slug) do nothing;
  end if;
  new.pet_slug := v_candidate;
  return new;
end $$;

-- Los links con 4 números pasan al formato nuevo SIN quedar como alias (si no, se podrían
-- seguir recorriendo). En PROD existieron solo durante esta misma actualización; en DEV eran
-- de prueba. Los links anteriores a los de números (nombre + 6 caracteres) siguen como alias.
delete from public.pet_slug_aliases where slug ~ '-[0-9]{4}$';
update public.landings set pet_slug = null, business_name = business_name
  where business_type = 'pet' and pet_slug ~ '-[0-9]{4}$';

-- Ninguna página puede tomar como link el de una mascota ni uno anterior de una mascota.
-- security definer: tiene que ver todas las páginas, no solo las de quien guarda.
create or replace function public.guard_landing_slug() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
begin
  if exists (select 1 from public.landings l where l.id <> new.id and l.pet_slug = new.slug)
     or exists (select 1 from public.pet_slug_aliases a where a.slug = new.slug and a.landing_id <> new.id) then
    raise exception 'slug_en_uso' using errcode = '23505';
  end if;
  return new;
end $$;

drop trigger if exists guard_landing_slug on public.landings;
create trigger guard_landing_slug
  before insert or update of slug on public.landings
  for each row execute function public.guard_landing_slug();

-- Para que la app pregunte antes de crear o renombrar (y proponga otro en vez de fallar).
create or replace function public.slug_in_use(p_slug text, p_landing uuid default null) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.landings l
                   where l.id is distinct from p_landing and (l.slug = p_slug or l.pet_slug = p_slug))
        or exists (select 1 from public.pet_slug_aliases a
                   where a.slug = p_slug and a.landing_id is distinct from p_landing)
  $$;
revoke execute on function public.slug_in_use(text, uuid) from public, anon;
grant execute on function public.slug_in_use(text, uuid) to authenticated, service_role;
