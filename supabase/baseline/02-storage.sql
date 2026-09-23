-- Storage: el bucket de imágenes y sus permisos. pg_dump del esquema public no los trae,
-- porque el bucket es una FILA en storage.buckets y las políticas viven sobre storage.objects.
-- Sin esto, un proyecto nuevo levanta pero no se puede subir ni un logo.
--
-- Se corre después de 01-schema.sql, sobre el proyecto nuevo.

insert into storage.buckets (id, name, public)
values ('landing-assets', 'landing-assets', true)
on conflict (id) do nothing;

-- Lectura pública (las landings son públicas), escritura solo del dueño, y cada usuario
-- confinado a su propia carpeta: el primer segmento del path tiene que ser su auth.uid().
create policy "landing-assets delete own" on storage.objects for DELETE to authenticated using (((bucket_id = 'landing-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "landing-assets insert own" on storage.objects for INSERT to authenticated with check (((bucket_id = 'landing-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "landing-assets public read" on storage.objects for SELECT to public using ((bucket_id = 'landing-assets'::text));
create policy "landing-assets update own" on storage.objects for UPDATE to authenticated using (((bucket_id = 'landing-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
