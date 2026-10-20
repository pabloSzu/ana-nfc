# Chapitas de mascota

Cómo se venden, cómo las activa el comprador y qué pasa por dentro. Complementa
[ARQUITECTURA.md](ARQUITECTURA.md) (permisos) y [VENCIMIENTOS.md](VENCIMIENTOS.md) (planes).

---

## La idea

La chapita se vende ya grabada. El que vende (vos en la calle, una veterinaria, un pet shop)
no configura nada: adentro del paquete va una **tarjetita con un código de activación**. El
comprador escanea la chapita, pone el código, entra con su email y carga los datos de su
mascota. Desde ese momento la edita él solo, incluido prender "¡Estoy perdido!".

El código va en la tarjetita y **nunca en la chapita**: si alguien encuentra al perro, no
tiene que poder quedarse con ella.

## Paso a paso para vender

1. **Admin → Chapitas → Generar lote.** Cantidad (hasta 100), nombre del lote, veterinaria o
   revendedor (para saber cuántas vendió cada uno) y plan (sin vencimiento o anual).
2. **Grabar cada chapita.** En el lote, cada fila tiene su link para el chip NFC (botón
   Copiar). "Imprimir QR" da los QR numerados para grabar o hacer stickers. Hacelo desde el
   Admin de **bionfc.com**, nunca desde DEV: en DEV los links apuntan a tu computadora.
3. **Imprimir tarjetitas.** "Imprimir tarjetitas" da una hoja A4 con 8 por página, cada una
   con el número y el código de su chapita. Juntá chapita N° 5 con tarjetita N° 5.
4. **Vender.** El comprador hace todo desde **su** celular. Si abrís /activar con tu sesión
   de Admin, la página te frena: la chapita quedaría a tu nombre.

## Lo que hace el comprador

1. Escanea la chapita (o entra a `bionfc.com/activar`). Una chapita sin activar no da error:
   `/go/[id]` lo manda a Activar.
2. Pone el código y acepta los [términos](../app/terminos/page.tsx).
3. Pone su email y le llega un código de 6 números. No hay contraseñas.
4. Cae en el editor de su chapita (`/mi/chapita/[id]`). Cuando guarda con un WhatsApp, se
   publica sola.
5. Después vuelve por `bionfc.com/mi` (email + código nuevo) para editar o avisar que se
   perdió.

Si activa una segunda chapita con el mismo email, quedan las dos en su panel.

## Por dentro

| Pieza | Dónde |
|---|---|
| Tablas, políticas y funciones | `supabase/migrations/20261020120000_pet_tags_and_members.sql` |
| Códigos y slugs de lote | `lib/pet-tags.ts` |
| Datos de la chapita y diseños | `lib/pet.ts` |
| Página pública | `components/pet-renderer.tsx` |
| Editor (Admin y dueño) | `app/admin/landings/[id]/mascota/pet-editor.tsx` (`mode="owner"` para el dueño) |
| Lotes e impresión | `app/admin/chapitas/` |
| Activar | `app/activar/` |
| Panel del dueño y login | `app/mi/` |
| Denuncias | `app/denunciar/[slug]/`, y aparecen en el Resumen del Admin |

- Una chapita de lote es una landing `business_type = 'pet'`, sin cliente y sin publicar, con
  `batch_id` y `tag_number`. Su código vive en `tag_activations`, aparte, porque las columnas
  de una landing publicada son legibles por cualquiera.
- `activate_tag(código)` pasa la chapita a un cliente del comprador (lo crea con su email si
  es la primera), lo hace miembro, marca `activated_at` y borra el código.
- `save_my_pet(...)` es la única forma en que el dueño escribe. La foto la sube a su propia
  carpeta del storage.
- Las chapitas sin activar no aparecen en Páginas ni en el Resumen: solo en Chapitas.
- Una cuenta nueva solo se crea con un código de chapita válido (`sendLoginCode` en
  `app/mi/auth-actions.ts`). "Entrar" no crea cuentas.

## Configuración que no está en el código

En **cada** proyecto de Supabase (DEV y PROD):

- **Authentication → Emails → plantillas "Magic Link" y "Confirm signup":** tienen que
  incluir `{{ .Token }}` (el código de 6 números). Sin eso llega un link en vez del código.
- **Authentication → Sign In / Providers:** "Allow new users to sign up" prendido. Lo usa la
  activación; sin código de chapita nadie puede crear una cuenta igual.
- **SMTP propio (Resend) en PROD.** El envío que trae Supabase solo manda a los emails del
  equipo del proyecto y muy pocos por hora: sirve para probar, no para vender.

Plantilla sugerida para los dos mails:

```html
<h2>Tu código de BIONFC</h2>
<p>Escribí este código para entrar: <strong style="font-size:24px">{{ .Token }}</strong></p>
<p>Vence en una hora. Si no lo pediste, ignorá este mail.</p>
```

### Emails con Resend (una sola vez, para PROD)

1. Crear la cuenta en resend.com (plan gratis: 3.000 mails por mes, 100 por día).
2. **Domains → Add domain → `bionfc.com`.** Resend muestra 3 o 4 registros (TXT para SPF y
   DKIM, MX para `send`). Cargarlos tal cual donde se maneja el DNS del dominio (Cloudflare u
   otro). Es lo único que se toca en el DNS. Esperar a que Resend los marque como verificados.
3. **API Keys → Create** (permiso "Sending access"). Se ve una sola vez: pegarla directo en
   Supabase, no guardarla en el repo.
4. **Supabase PROD → Authentication → Emails → SMTP Settings:** host `smtp.resend.com`,
   puerto `465`, usuario `resend`, contraseña la API key, remitente `hola@bionfc.com` con
   nombre "BIONFC".
5. **Supabase PROD → Authentication → Rate Limits:** con SMTP propio arranca en 30 mails por
   hora; alcanza para empezar.
6. Probar activando una chapita de prueba con un email que no sea del equipo.

## Pendiente

- Que un abogado revise los términos (`app/terminos/page.tsx`).
- Fotos viejas: **ninguna parte del sistema borra archivos del storage** (ni al cambiar una foto
  de landing, ícono, PDF o chapita, ni al eliminar una página). No se puede borrar "la vieja"
  al reemplazar sin más, porque en las landings una misma foto puede usarla otra página o una
  plantilla. Plan: en chapitas de dueños, borrar la anterior al guardar (es solo de esa
  chapita); en el Admin, un "Liberar espacio" que borre lo que nada usa y tenga más de un día.
  Al 2026-10-20, DEV tenía 24 archivos (16 MB), 13 sin uso (5 MB).
- Botón "Mandar mi ubicación a la familia" para quien encuentra la mascota.
- Mover una chapita activada a otro cliente desde el Admin.
