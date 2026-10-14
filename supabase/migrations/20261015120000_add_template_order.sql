-- Panel de Prediseños: orden en el que aparecen y si están ocultos (se guardan pero no se ofrecen
-- en el editor ni al crear una página). Solo importan en landings con template_name.
alter table public.landings
  add column if not exists template_order integer not null default 0,
  add column if not exists template_hidden boolean not null default false;
