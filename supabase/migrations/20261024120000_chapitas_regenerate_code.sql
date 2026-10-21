-- Recuperación de una tarjetita de activación perdida. Solo el staff dueño del lote puede
-- reemplazar el código, y únicamente mientras la chapita siga sin activar. DELETE + INSERT viven
-- en la misma transacción: una colisión del código nuevo conserva el anterior.
create or replace function public.regenerate_tag_code(p_landing uuid, p_code text) returns boolean
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'));
  v_allowed boolean;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'sin_permiso'; end if;
  if v_code !~ '^[ABCDEFGHJKMNPQRTUVWXYZ2346789]{8}$' then raise exception 'codigo_invalido'; end if;

  select true into v_allowed
    from public.landings
    where id = p_landing
      and owner_id = auth.uid()
      and business_type = 'pet'
      and batch_id is not null
      and activated_at is null
      and client_id is null
    for update;
  if coalesce(v_allowed, false) = false then return false; end if;

  delete from public.tag_activations where landing_id = p_landing;
  insert into public.tag_activations (landing_id, code) values (p_landing, v_code);
  return true;
end $$;

revoke execute on function public.regenerate_tag_code(uuid, text) from public, anon;
grant execute on function public.regenerate_tag_code(uuid, text) to authenticated;
