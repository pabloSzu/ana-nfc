-- Imagen personalizada opcional para el ícono de cada botón. Los archivos viven en el
-- bucket landing-assets dentro de la carpeta del dueño; acá solo se guarda su URL pública.
alter table public.actions
  add column if not exists icon_url text not null default '';
