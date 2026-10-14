-- Datos extra de cada botón (ver lib/button-extras.ts): botón destacado, nota y cantidad de
-- reseñas, WhatsApp "en línea" y horarios para mostrar "abierto ahora". Es público como el resto
-- del botón, así que no va nada privado.
alter table public.actions
  add column if not exists extra jsonb not null default '{}'::jsonb;
