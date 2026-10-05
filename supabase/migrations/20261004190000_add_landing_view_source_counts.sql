-- Expone en el Admin el origen que landing_views ya guardaba por cada apertura.
-- Las primeras cuatro columnas conservan exactamente el orden y nombre de la vista anterior;
-- agregar las nuevas al final permite reemplazarla sin romper consultas existentes.
create or replace view landing_view_counts
with (security_invoker = true) as
  select
    landing_id,
    count(*)::bigint as total,
    count(*) filter (where created_at > now() - interval '30 days')::bigint as last_30_days,
    max(created_at) as last_view_at,
    count(*) filter (where source = 'qr')::bigint as qr,
    count(*) filter (where source = 'nfc')::bigint as nfc,
    count(*) filter (where source = 'direct')::bigint as direct
  from landing_views
  group by landing_id;
