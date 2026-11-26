-- Control de fabricación de chapitas: permite marcar las unidades cuya impresión física salió mal.
-- Se guarda en la chapita para compartir el estado entre computadoras y excluir su tarjeta hasta
-- que la reimpresión quede bien. Las políticas existentes de landings limitan el cambio al staff.
alter table public.landings
  add column if not exists tag_print_failed boolean not null default false;

create index if not exists landings_batch_print_failed_idx
  on public.landings (batch_id, tag_print_failed)
  where batch_id is not null and activated_at is null;
