-- Estilo del QR guardado por landing. Sigue el mismo patrón que button_style, title_style
-- y cover_style: una columna jsonb opcional, con los valores por defecto resueltos en el
-- código (lib/qr.ts) y no en la base.
--
-- Se guarda, y no se elige en el momento de descargar, porque un QR es una pieza física:
-- si dentro de seis meses hay que reimprimir la tarjeta de un cliente, tiene que salir el
-- mismo código con el mismo diseño, sin depender de que alguien recuerde qué había elegido.
alter table landings add column if not exists qr_style jsonb;
