alter table public.tag_batches
  add column tag_print_setup jsonb,
  add column tag_print_reopened_ids uuid[] not null default '{}',
  add column cards_printed_count integer check (cards_printed_count > 0);

create function public.change_batch_print_workflow(
  p_batch uuid, p_action text, p_ids uuid[], p_setup jsonb
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  batch public.tag_batches%rowtype;
  unit_ids uuid[];
begin
  if auth.uid() is null or not public.is_staff() then return false; end if;
  select * into batch from public.tag_batches
    where id = p_batch and owner_id = auth.uid() for update;
  if not found then return false; end if;

  if p_action in ('reopen_units', 'print_units', 'print_cards') then
    select coalesce(array_agg(id), '{}') into unit_ids from public.landings
      where batch_id = p_batch and owner_id = auth.uid() and activated_at is null
        and id = any(p_ids);
    if cardinality(unit_ids) = 0 or cardinality(unit_ids) <> cardinality(p_ids) then
      return false;
    end if;
  end if;

  case p_action
    when 'print_tags' then
      if batch.tag_print_setup is not null or jsonb_typeof(p_setup) is distinct from 'object' then return false; end if;
      update public.tag_batches set tag_print_setup = p_setup where id = p_batch;
    when 'reopen_units' then
      if batch.tag_print_setup is null then return false; end if;
      update public.tag_batches
        set tag_print_reopened_ids = array(select distinct unnest(batch.tag_print_reopened_ids || unit_ids)),
            cards_printed_count = null
        where id = p_batch;
    when 'print_units' then
      if not unit_ids <@ batch.tag_print_reopened_ids then return false; end if;
      update public.tag_batches
        set tag_print_reopened_ids = array(select id from unnest(batch.tag_print_reopened_ids) id where not (id = any(unit_ids)))
        where id = p_batch;
    when 'print_cards' then
      if batch.tag_print_setup is null or unit_ids && batch.tag_print_reopened_ids then return false; end if;
      update public.tag_batches set cards_printed_count = cardinality(unit_ids) where id = p_batch;
    when 'reopen_cards' then
      update public.tag_batches set cards_printed_count = null where id = p_batch;
    else return false;
  end case;
  return true;
end;
$$;

revoke execute on function public.change_batch_print_workflow(uuid, text, uuid[], jsonb) from public, anon;
grant execute on function public.change_batch_print_workflow(uuid, text, uuid[], jsonb) to authenticated;

-- Serializa las ediciones individuales con el cierre del lote. El estilo de la tarjeta se puede
-- guardar aparte porque no cambia la chapita física.
create function public.guard_printed_tag_design() returns trigger
language plpgsql security invoker set search_path = ''
as $$
declare
  batch public.tag_batches%rowtype;
begin
  if new.batch_id is null then return new; end if;
  if tg_op = 'UPDATE' then
    if new.batch_id is not distinct from old.batch_id and
      (coalesce(new.button_style->'print', '{}'::jsonb) - 'card')
      is not distinct from (coalesce(old.button_style->'print', '{}'::jsonb) - 'card') then
      return new;
    end if;
  end if;
  select * into batch from public.tag_batches where id = new.batch_id for share;
  if batch.tag_print_setup is not null and not (new.id = any(batch.tag_print_reopened_ids)) then
    raise exception 'La chapita ya está impresa. Reabrí su edición primero.';
  end if;
  return new;
end;
$$;

create trigger guard_printed_tag_design
before insert or update of button_style, batch_id on public.landings
for each row execute function public.guard_printed_tag_design();
