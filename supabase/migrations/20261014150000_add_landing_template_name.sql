-- Plantillas propias: una landing con template_name aparece en el panel de Plantillas del editor
-- con ese nombre, para empezar otras páginas desde ella. NULL = no es plantilla.
alter table public.landings
  add column if not exists template_name text;
