-- La parte del nombre del link de mascota, como mucho 20 letras y cortada en una palabra entera:
-- "Señor Bigotes Maximiliano Tercero" → "senor-bigotes-k7m2" (antes "senor-bigotes-maximiliano-
-- tercero-k7m2"). El link va escrito en las imágenes para compartir y en la chapita: largo, se
-- leía chiquito y nadie lo escribía.

create or replace function public.pet_slug_base(p_name text) returns text
  language sql immutable set search_path = ''
  as $$
    with full_base as (
      select coalesce(nullif(regexp_replace(regexp_replace(
        lower(translate(trim(coalesce(p_name, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
        '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'mascota') as b
    )
    select case
      when length(b) <= 20 then b
      -- Una sola palabra larga: se corta a las 20 letras.
      when position('-' in left(b, 21)) = 0 then left(b, 20)
      -- Si no, hasta la última palabra entera que entra.
      else regexp_replace(left(b, 21), '-[^-]*$', '')
    end
    from full_base
  $$;

-- Las mascotas con nombre largo pasan al link corto (el anterior queda como alias y redirige).
update public.landings set business_name = business_name
  where business_type = 'pet' and pet_slug is not null
    and pet_slug !~ ('^' || public.pet_slug_base(business_name) || '-[a-hjkmnp-z2-9]{4}$');
