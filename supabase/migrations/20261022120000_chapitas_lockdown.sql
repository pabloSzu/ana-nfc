-- Cierre del despliegue de chapitas.
--
-- Aplicar SOLO después de que producción esté sirviendo la versión que lee cada página mediante
-- public_landing/public_landing_slug. Hasta entonces, main necesita las políticas públicas viejas.

drop policy if exists "Public can read published landings" on public.landings;
drop policy if exists "landing public" on public.landings;
drop policy if exists "Public can read enabled actions of published landings" on public.actions;
drop policy if exists "action public" on public.actions;

-- La validación pública de códigos queda cerrada: el código nuevo la hace desde el servidor,
-- después del límite por IP, usando la clave secreta.
revoke execute on function public.tag_code_valid(text) from anon, authenticated;
grant execute on function public.tag_code_valid(text) to service_role;
