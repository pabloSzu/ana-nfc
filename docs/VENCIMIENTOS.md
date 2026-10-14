# Planes, vencimientos y flujos de trabajo

Cómo se maneja cada producto después de venderlo. Las reglas viven en `lib/landing-plan.ts`
(con tests en `tests/landing-plan.test.ts`); todo lo operativo de una página está en
**Admin → Páginas → Gestión**.

## Los tres planes

| Plan | Qué abre el producto | Vence |
|---|---|---|
| **Anual** | La página o tarjeta BIONFC | Sí, cada año |
| **Link directo** | Un solo link (reseñas, Instagram, WhatsApp, web…) | No |
| **Sin vencimiento** | La página o tarjeta, siempre | No (propias, regalos, cortesías) |

Una página anual que no se renueva **pasa sola a funcionar como link directo**. El producto
nunca deja de andar.

## Qué es automático y qué es manual

Lo único manual es lo que involucra plata o hablar con el cliente: **avisarle** y **renovar
cuando paga**. Todo lo demás pasa solo.

| Momento | Qué pasa | ¿Hay que hacer algo? |
|---|---|---|
| Se publica la página por primera vez | Empieza su año | No |
| Faltan 30 días o menos | Aparece en amarillo en Inicio → "Requieren atención" | **Sí**: "Avisar por WhatsApp" (el mensaje ya está escrito) |
| El cliente paga | — | **Sí**: "Renovar" en Gestión. Suma un año desde el vencimiento, sin perder días |
| Vence sin pagar | Rojo. Durante 15 días de gracia se sigue mostrando la página | Opcional: volver a avisar |
| Día 16 sin pagar | Abre sola el link de respaldo, o si no hay, el primer botón de la página | No |
| Paga tarde | — | **Sí**: "Renovar". Vuelve a mostrarse la página; el año corre desde hoy |

Rutina: mirar el Inicio una vez por semana.

## Link de respaldo

Es lo que abre el producto si el cliente no renueva. Si no se carga uno, se usa solo el
**primer botón de la página** que sirva como destino (WhatsApp, Instagram, web…; se saltean email,
teléfono y PDF). Conviene igual preguntarle al cliente al hacer el pedido.

## Flujos habituales

| Situación | Qué hacer | Cobro |
|---|---|---|
| Venta con página | Nueva landing o tarjeta → diseño → Publicar → QR y NFC → grabar | Producto con página |
| Venta de link directo | **Nuevo link directo** (queda publicado y abre el QR y NFC) → grabar | Producto |
| Cambiar el link de un link directo | Gestión → Link que abre el producto. Sin tocar el chip | $5.000 |
| Pasar de link directo a página | Gestión → Anual → Editar diseño. **Mismo producto**, no hace falta otro NFC | $10.000 (la diferencia) |
| Pasar de página a link directo (a pedido) | Gestión → Link directo → pegar el link. La página queda guardada | — |
| Cambios en una página vigente | Editor | Incluidos |
| Página propia o regalo | Plan "Sin vencimiento" | — |

## El chip NFC

Siempre se graba el **link permanente de BIONFC** (pantalla QR y NFC, termina en `?s=nfc`),
nunca el destino final, y se bloquea el chip. Así se puede cambiar a dónde abre, pasar de link
directo a página y contar los escaneos sin tocar el producto.
