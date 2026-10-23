-- Links de mascota más fáciles de leer y dictar: nombre + 4 números ("luna-4821") en vez de
-- nombre + 6 caracteres del id ("luna-1afacd"). Además el link sigue al nombre: si la familia lo
-- cambia, se genera uno nuevo. Los anteriores quedan como alias en pet_slug_aliases y siguen
-- abriendo la página (la app redirige al actual), así ningún link compartido se rompe. El NFC y
-- el QR de la chapita apuntan a /go/{id} y no dependen de esto.

create table if not exists public.pet_slug_aliases (
  slug text primary key,
  landing_id uuid not null references public.landings (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- Sin políticas: solo la leen las funciones de abajo (security definer).
alter table public.pet_slug_aliases enable row level security;

-- La parte del nombre: sin tildes, en minúscula y con guiones ("Don Pepe" → "don-pepe").
create or replace function public.pet_slug_base(p_name text) returns text
  language sql immutable set search_path = ''
  as $$
    select left(coalesce(nullif(regexp_replace(regexp_replace(
      lower(translate(trim(coalesce(p_name, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')),
      '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), ''), 'mascota'), 42)
  $$;

-- ¿Ese link ya lo usa otra página (como slug, link de mascota o alias)?
-- security definer: tiene que ver todas las páginas y alias, no solo las de quien guarda.
create or replace function public.pet_slug_taken(p_slug text, p_landing uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.landings l where l.id <> p_landing and (l.slug = p_slug or l.pet_slug = p_slug))
        or exists (select 1 from public.pet_slug_aliases a where a.slug = p_slug and a.landing_id <> p_landing)
  $$;

-- security definer: guarda el alias aunque quien edita (el Admin) no pueda escribir esa tabla.
create or replace function public.assign_pet_slug() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
declare
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
  if new.pet_slug is not null and new.pet_slug ~ ('^' || v_base || '-[0-9]{4}$') then
    return new;
  end if;

  loop
    v_try := v_try + 1;
    v_candidate := v_base || '-' || (1000 + floor(random() * 9000))::int::text;
    exit when not public.pet_slug_taken(v_candidate, new.id);
    -- Con 9000 números por nombre casi nunca llega acá; si pasa, se usa el id (que es único).
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

-- Las mascotas que ya tienen nombre pasan al formato nuevo (el link anterior queda como alias).
update public.landings set business_name = business_name
  where business_type = 'pet' and not (batch_id is not null and activated_at is null)
    and trim(coalesce(business_name, '')) <> ''
    and (pet_slug is null or pet_slug !~ '-[0-9]{4}$');

-- La lectura pública acepta el slug técnico, el link actual y los anteriores. 'slug' devuelve
-- siempre el actual: la app redirige ahí si se entró por otro.
create or replace function public.public_landing(p_slug text) returns jsonb
  language sql stable security definer set search_path = ''
  as $$
    select jsonb_build_object(
      'id', l.id,
      'owner_id', l.owner_id,
      'business_name', l.business_name,
      'slug', case when l.business_type = 'pet' then coalesce(l.pet_slug, l.slug) else l.slug end,
      'description', l.description,
      'logo_url', l.logo_url,
      'whatsapp', l.whatsapp,
      'primary_color', l.primary_color,
      'template', l.template,
      'published', l.published,
      'background_color', l.background_color,
      'business_type', l.business_type,
      'redirect_url', l.redirect_url,
      'background_type', l.background_type,
      'background_gradient_to', l.background_gradient_to,
      'background_image_url', l.background_image_url,
      'text_color', l.text_color,
      'font_pair', l.font_pair,
      'text_panel', l.text_panel,
      'button_font', l.button_font,
      'text_panel_color', l.text_panel_color,
      'button_shape', l.button_shape,
      'button_fill', l.button_fill,
      'button_style', l.button_style,
      'title_style', l.title_style,
      'subtitle_style', l.subtitle_style,
      'logo_style', l.logo_style,
      'background_style', l.background_style,
      'cover_image_url', l.cover_image_url,
      'cover_style', l.cover_style,
      'qr_style', l.qr_style,
      'plan', l.plan,
      'expires_at', l.expires_at,
      'fallback_url', l.fallback_url
    )
      || jsonb_build_object('actions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', a.id,
          'title', a.title,
          'type', a.type,
          'message', a.message,
          'url', a.url,
          'icon', a.icon,
          'enabled', a.enabled,
          'position', a.position,
          'background_color', a.background_color,
          'background_gradient_to', a.background_gradient_to,
          'text_color', a.text_color,
          'icon_color', a.icon_color,
          'use_auto_color', a.use_auto_color,
          'subtitle', a.subtitle,
          'icon_background_color', a.icon_background_color,
          'icon_url', a.icon_url,
          'icon_fit', a.icon_fit,
          'icon_scale', a.icon_scale,
          'extra', a.extra
        ) order by a.position)
        from public.actions a where a.landing_id = l.id and a.enabled
      ), '[]'::jsonb))
    from public.landings l
    where (l.slug = p_slug or l.pet_slug = p_slug
           or l.id = (select a.landing_id from public.pet_slug_aliases a where a.slug = p_slug))
      and l.published
  $$;
revoke execute on function public.public_landing(text) from public;
grant execute on function public.public_landing(text) to anon, authenticated, service_role;
revoke execute on function public.pet_slug_taken(text, uuid) from public, anon, authenticated;
