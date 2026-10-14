-- Plan y vencimiento de cada landing o tarjeta.
--
-- plan:
--   annual   → página BIONFC con renovación anual (el caso normal).
--   direct   → producto con link directo: siempre redirige a redirect_url y nunca vence.
--   lifetime → sin vencimiento (páginas propias, regalos, cortesías).
-- expires_at: hasta cuándo está pagada. La primera publicación la fija en un año; se renueva
--   desde el Admin. Solo aplica al plan annual.
-- fallback_url: el link único que abre la página si el cliente no renueva. Pasados 15 días del
--   vencimiento, la página pública redirige sola a este link (ver app/[slug]/page.tsx).
--
-- Ojo: la política pública deja leer todas las columnas de una página publicada, así que acá no
-- va nada privado. Las notas internas viven en clients.notes.
alter table public.landings
  add column if not exists plan text not null default 'annual',
  add column if not exists expires_at timestamptz,
  add column if not exists fallback_url text;

alter table public.landings drop constraint if exists landings_plan_check;
alter table public.landings add constraint landings_plan_check check (plan in ('annual', 'direct', 'lifetime'));

-- Las páginas que ya redirigen a un link son productos con link directo: no vencen.
update public.landings
set plan = 'direct', expires_at = null
where coalesce(redirect_url, '') <> '' and plan = 'annual';

-- Las páginas publicadas antes de esta migración arrancan su año desde que se crearon.
update public.landings
set expires_at = coalesce(created_at, now()) + interval '1 year'
where plan = 'annual' and published and expires_at is null;
