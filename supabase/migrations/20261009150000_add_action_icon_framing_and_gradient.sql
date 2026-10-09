-- Encuadre de imágenes usadas como ícono y degradado opcional por botón.
alter table public.actions
  add column if not exists icon_fit text not null default 'contain',
  add column if not exists icon_scale numeric not null default 1,
  add column if not exists background_gradient_to text not null default '';

alter table public.actions drop constraint if exists actions_icon_fit_check;
alter table public.actions add constraint actions_icon_fit_check
  check (icon_fit in ('contain', 'cover'));

alter table public.actions drop constraint if exists actions_icon_scale_check;
alter table public.actions add constraint actions_icon_scale_check
  check (icon_scale between 0.6 and 1.5);
