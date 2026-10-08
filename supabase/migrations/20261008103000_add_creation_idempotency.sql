-- Evita duplicados si una conexión lenta reenvía el mismo formulario de creación.
-- Los valores NULL mantienen compatibles todas las filas existentes.
alter table public.clients add column if not exists request_key text;
alter table public.landings add column if not exists request_key text;

alter table public.clients
  drop constraint if exists clients_owner_request_key_key;
alter table public.clients
  add constraint clients_owner_request_key_key unique (owner_id, request_key);

alter table public.landings
  drop constraint if exists landings_owner_request_key_key;
alter table public.landings
  add constraint landings_owner_request_key_key unique (owner_id, request_key);
