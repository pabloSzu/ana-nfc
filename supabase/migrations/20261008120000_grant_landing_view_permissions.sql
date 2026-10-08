-- Las políticas RLS definen qué filas puede usar cada rol, pero PostgreSQL también exige
-- permisos explícitos sobre la tabla, la vista y la secuencia. Sin estos GRANT, Supabase
-- rechaza tanto el registro público de visitas como la lectura de estadísticas del dueño.

grant insert on table public.landing_views to anon, authenticated;
grant select on table public.landing_views to authenticated;

grant usage, select on sequence public.landing_views_id_seq to anon, authenticated;

grant select on table public.landing_view_counts to authenticated;
