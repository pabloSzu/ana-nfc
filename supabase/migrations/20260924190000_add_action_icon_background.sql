-- Optional per-action icon badge background. Empty keeps the template's icon design.
alter table public.actions add column if not exists icon_background_color text not null default '';
