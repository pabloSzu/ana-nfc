-- Contador de escaneos. Una fila por visita a una landing publicada: el chip NFC no puede
-- contar nada (no tiene batería ni memoria), así que "escaneo" acá significa "la página se
-- abrió", que es lo único observable desde el servidor.

create table if not exists landing_views (
  id bigint generated always as identity primary key,
  landing_id uuid not null references landings (id) on delete cascade,
  -- De dónde vino. Se distingue solo si el tag se grabó con ?s=nfc y el QR con ?s=qr; sobre
  -- tarjetas ya entregadas no hay forma de saberlo, por eso el default es 'direct'.
  source text not null default 'direct' check (source in ('nfc', 'qr', 'direct')),
  created_at timestamptz not null default now()
);

-- Las dos consultas que se hacen son "cuántas tiene esta landing" y "cuántas en los últimos
-- N días", las dos por landing y ordenadas por fecha.
create index if not exists landing_views_landing_created_idx
  on landing_views (landing_id, created_at desc);

alter table landing_views enable row level security;

-- La landing pública la ve cualquiera sin login, así que el insert corre como `anon`. El
-- `with check` es lo que evita que eso sea un agujero: solo deja registrar visitas de una
-- landing que existe y está publicada, nunca inventar filas para cualquier uuid.
drop policy if exists "registrar visita de una landing publicada" on landing_views;
create policy "registrar visita de una landing publicada" on landing_views
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from landings
      where landings.id = landing_views.landing_id
        and landings.published
    )
  );

-- Leerlas es otra cosa: solo el dueño de la landing.
drop policy if exists "el dueño lee las visitas de sus landings" on landing_views;
create policy "el dueño lee las visitas de sus landings" on landing_views
  for select to authenticated
  using (
    exists (
      select 1 from landings
      where landings.id = landing_views.landing_id
        and landings.owner_id = auth.uid()
    )
  );

-- Contar desde el panel sin traerse una fila por visita. security_invoker es obligatorio acá:
-- sin él la vista corre con los permisos de su dueño y saltea la RLS de arriba, con lo que
-- cualquiera vería los números de todos.
create or replace view landing_view_counts
with (security_invoker = true) as
  select
    landing_id,
    count(*)::bigint as total,
    count(*) filter (where created_at > now() - interval '30 days')::bigint as last_30_days,
    max(created_at) as last_view_at
  from landing_views
  group by landing_id;
