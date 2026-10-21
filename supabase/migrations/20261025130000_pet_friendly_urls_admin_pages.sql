-- Las páginas de mascota creadas directamente por el Admin también tienen URL amigable.
-- Solo se excluye el stock de un lote todavía sin activar: ahí el nombre sigue siendo
-- "Chapita N" y la familia todavía no eligió el nombre real.
create or replace function public.assign_pet_slug() returns trigger
  language plpgsql set search_path = ''
  as $$
declare
  v_base text;
  v_candidate text;
begin
  if new.business_type <> 'pet' or (new.batch_id is not null and new.activated_at is null)
     or new.pet_slug is not null or trim(coalesce(new.business_name, '')) = '' then
    return new;
  end if;

  v_base := regexp_replace(
    regexp_replace(
      lower(translate(trim(new.business_name),
        'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
      '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g');
  v_base := left(coalesce(nullif(v_base, ''), 'mascota'), 42);
  v_candidate := v_base || '-' || left(replace(new.id::text, '-', ''), 6);

  if exists (select 1 from public.landings l where l.id <> new.id and (l.slug = v_candidate or l.pet_slug = v_candidate)) then
    v_candidate := v_base || '-' || left(replace(new.id::text, '-', ''), 12);
  end if;
  if exists (select 1 from public.landings l where l.id <> new.id and (l.slug = v_candidate or l.pet_slug = v_candidate)) then
    v_candidate := v_base || '-' || replace(new.id::text, '-', '');
  end if;

  new.pet_slug := v_candidate;
  return new;
end $$;

update public.landings set business_name = business_name
  where business_type = 'pet' and not (batch_id is not null and activated_at is null)
    and pet_slug is null and trim(coalesce(business_name, '')) <> '';
