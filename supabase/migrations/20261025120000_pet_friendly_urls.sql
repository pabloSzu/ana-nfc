-- URL pública amigable para mascotas. El slug técnico original se conserva para que ningún
-- enlace anterior se rompa; pet_slug es un alias estable que se crea una sola vez.
alter table public.landings add column if not exists pet_slug text;
create unique index if not exists landings_pet_slug_key on public.landings (pet_slug) where pet_slug is not null;

create or replace function public.assign_pet_slug() returns trigger
  language plpgsql set search_path = ''
  as $$
declare
  v_base text;
  v_candidate text;
begin
  if new.business_type <> 'pet' or new.activated_at is null or new.pet_slug is not null
     or trim(coalesce(new.business_name, '')) = '' then
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

  -- También se compara con el slug técnico porque public_landing acepta ambos alias.
  if exists (select 1 from public.landings l where l.id <> new.id and (l.slug = v_candidate or l.pet_slug = v_candidate)) then
    v_candidate := v_base || '-' || left(replace(new.id::text, '-', ''), 12);
  end if;
  if exists (select 1 from public.landings l where l.id <> new.id and (l.slug = v_candidate or l.pet_slug = v_candidate)) then
    v_candidate := v_base || '-' || replace(new.id::text, '-', '');
  end if;

  new.pet_slug := v_candidate;
  return new;
end $$;

drop trigger if exists assign_pet_slug on public.landings;
create trigger assign_pet_slug
  before insert or update of business_name, activated_at on public.landings
  for each row execute function public.assign_pet_slug();

-- Las chapitas que ya fueron activadas también reciben su alias. El slug técnico no cambia.
update public.landings set business_name = business_name
  where business_type = 'pet' and activated_at is not null and pet_slug is null
    and trim(coalesce(business_name, '')) <> '';

-- La misma lectura segura acepta tanto el slug histórico como el alias amigable.
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
    where (l.slug = p_slug or l.pet_slug = p_slug) and l.published
  $$;
revoke execute on function public.public_landing(text) from public;
grant execute on function public.public_landing(text) to anon, authenticated, service_role;

-- /go/[id] recibe directamente el alias amigable cuando existe.
create or replace function public.public_landing_slug(p_landing uuid) returns text
  language sql stable security definer set search_path = ''
  as $$ select case when business_type = 'pet' then coalesce(pet_slug, slug) else slug end
        from public.landings where id = p_landing and published $$;
revoke execute on function public.public_landing_slug(uuid) from public;
grant execute on function public.public_landing_slug(uuid) to anon, authenticated, service_role;
