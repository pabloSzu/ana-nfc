-- Registra la última modificación de cada landing o tarjeta sin depender del editor que la guardó.
-- Los valores históricos no se reconstruyen: desde esta migración, toda actualización queda fechada.
create or replace function public.set_landing_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists set_landing_updated_at on public.landings;
create trigger set_landing_updated_at
before update on public.landings
for each row
execute function public.set_landing_updated_at();
