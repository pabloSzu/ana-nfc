# Chapitas de mascota

Cómo se venden, cómo las activa el comprador y qué pasa por dentro. Complementa
[ARQUITECTURA.md](ARQUITECTURA.md) (permisos) y [VENCIMIENTOS.md](VENCIMIENTOS.md) (planes).

---

## La idea

La chapita se vende ya grabada. El que vende (vos en la calle, una veterinaria, un pet shop)
no configura nada: adentro del paquete va una **tarjetita con un QR secreto y un código de respaldo**. El
comprador escanea ese QR (o pone el código), entra con su email y carga los datos de su
mascota. Desde ese momento la edita él solo, incluido prender "¡Estoy perdido!".

El código va en la tarjetita y **nunca en la chapita**: si alguien encuentra al perro, no
tiene que poder quedarse con ella.

## QR, NFC y nombre de cada página

El QR y el chip NFC llevan **la misma URL permanente**: `https://bionfc.com/go/[id]`. Eso hace
que los dos sean dinámicos: el objeto físico nunca se vuelve a grabar ni imprimir, aunque cambien
el nombre de la mascota, su foto, el teléfono o incluso el slug público. No existe un “NFC
dinámico” distinto que haya que comprar; lo dinámico es la redirección administrada por BIONFC.

Cada chapita tiene tres identificadores con funciones distintas:

- **ID interno (UUID):** es estable y va dentro de `/go/[id]`; no se muestra como nombre comercial.
- **Número de lote:** `Chapita 1`, `Chapita 2`, etc.; sirve para emparejar el grabado con su
  tarjetita de activación mientras está en stock.
- **Página pública:** antes de activarse usa un slug técnico aleatorio (`m-xxxxxxx`). Cuando el
  comprador carga el nombre, BIONFC crea una dirección amigable y única, por ejemplo
  `/mascota/toby-a7k3f2`. El slug técnico anterior sigue siendo válido como respaldo y el QR/NFC
  continúa apuntando a `/go/id`, por lo que el objeto físico nunca se rompe.

No poner el nombre de la mascota ni el código de activación en el QR/NFC: el primero todavía no
se conoce al fabricar y el segundo permitiría apropiarse de una chapita encontrada.

## Paso a paso para vender

1. **Admin → Chapitas → Generar lote.** Cantidad (hasta 100), nombre del lote y veterinaria o
   revendedor (para saber cuántas vendió cada uno). Las chapitas no vencen.
2. **Grabar cada chapita.** En el lote, cada fila tiene su link para el chip NFC (botón
   Copiar). "Imprimir QR" da los QR numerados para grabar o hacer stickers. Hacelo desde el
   Admin de **bionfc.com**, nunca desde DEV: en DEV los links apuntan a tu computadora.
3. **Imprimir tarjetitas.** "Imprimir tarjetitas" da una hoja A4 con 6 por página. Cada una
   tiene un QR secreto que abre la activación con el código ya cargado, el código escrito como
   respaldo y el número de su chapita. Juntá chapita N° 5 con tarjetita N° 5.
4. **Vender.** El comprador hace todo desde **su** celular. Si abrís /activar con tu sesión
   de Admin, la página te frena: la chapita quedaría a tu nombre.

## Lo que hace el comprador

1. Escanea el QR secreto del packaging. La activación se abre con su código ya cargado. También
   puede acercar/escanear la chapita o entrar a `bionfc.com/activar` y escribir el código.
2. Confirma el código y acepta los [términos](../app/terminos/page.tsx).
3. Pone su email y le llega un código de 6 números. No hay contraseñas.
4. Cae en el editor de su chapita (`/mi/chapita/[id]`): nombre, foto y su WhatsApp en la misma
   pantalla. El número se escribe como siempre ("351 555 1234", "0351 15…") y se guarda en formato
   de WhatsApp (`549…`, ver `normalizePhone` en `lib/pet.ts`). Cuando guarda con un WhatsApp que
   sirve, se publica sola.
5. Después vuelve por `bionfc.com/mi` (email + código nuevo) para editar o avisar que se
   perdió.

Si activa una segunda chapita con el mismo email, quedan las dos en su panel.

## Email de acceso

Supabase verifica el código y un proveedor SMTP lo entrega. La plantilla versionada está en
`supabase/templates/magic_link.html`: usa `{{ .Token }}` para mostrar 6 números y nunca manda al
comprador a `localhost`. En el proyecto alojado hay que copiar esa plantilla en Authentication →
Email Templates → Magic Link y configurar un SMTP verificado (por ejemplo, Resend) desde un
subdominio de BIONFC. Primero se prueba en DEV con un email externo al equipo y recién después se
repite la configuración en PROD.

Si la tarjetita se pierde **antes** de activar, el staff entra al lote y usa **Cambiar código**.
El anterior deja de funcionar en el mismo instante y aparece uno nuevo para imprimir o copiar. La
base rechaza esta operación si la chapita ya fue activada; perder el papel después de activarla no
afecta en nada al dueño.

Quien escanea una chapita activada pero sin publicar (o pausada) cae en `/sin-datos`, que le explica
al dueño cómo cargarla y al que la encontró cómo escribirnos.

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
- Una cuenta nueva solo se crea con un código de chapita válido: el registro público de Supabase
  está apagado y la cuenta la crea el servidor con la clave secreta (`sendLoginCode` en
  `app/mi/auth-actions.ts`). "Entrar" no crea cuentas.
- Límites (tabla `rate_limit_hits`): 20 códigos probados cada 10 minutos por IP, 10 mails por hora
  por IP y 6 por email, 10 activaciones fallidas cada 15 minutos por usuario, 5 denuncias por hora
  por IP. Las IP y los emails se guardan como hashes, no en texto legible, y cada clave se cuenta
  de forma atómica para que pedidos simultáneos no atraviesen juntos el límite.
- Si despublicás desde el Admin una chapita que ya tiene dueño (por una denuncia), queda
  **pausada** (`blocked_at`): el dueño no la puede volver a publicar. Publicarla desde el Admin la
  despausa.

## Configuración que no está en el código

En **cada** proyecto de Supabase (DEV y PROD):

- **Authentication → Emails → plantillas "Magic Link" y "Confirm signup":** tienen que
  incluir `{{ .Token }}` (el código de 6 números). Sin eso llega un link en vez del código.
- **Authentication → Sign In / Providers:** "Allow new users to sign up" **apagado**. Las
  cuentas las crea el servidor al activar (con la clave secreta); con el registro prendido,
  cualquiera podría crear cuentas y mandar mails salteándose el código.
- **Project Settings → API Keys → Secret key** (`sb_secret_…`): copiarla a `SUPABASE_SECRET_KEY`
  en `.env.local` (DEV) y en Vercel (PROD, solo entorno Production; Preview con la de DEV). Sin
  ella no se puede activar ninguna chapita.
- **Resend → API Keys** (`re_…`, permiso "Sending access"): copiarla a `RESEND_API_KEY` en
  `.env.local` y en Vercel. Manda el mail de bienvenida al publicar la chapita por primera vez
  (`lib/welcome-email.ts`). Es opcional: sin ella no se manda y todo lo demás funciona igual.
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
   otro). Sumar también un **DMARC**: registro TXT `_dmarc` con `v=DMARC1; p=none;` (Gmail y
   Hotmail lo piden para no mandar a spam). Esperar a que Resend los marque como verificados.
3. **API Keys → Create** (permiso "Sending access"). Se ve una sola vez: pegarla directo en
   Supabase, no guardarla en el repo.
4. **Supabase PROD → Authentication → Emails → SMTP Settings:** host `smtp.resend.com`,
   puerto `465`, usuario `resend`, contraseña la API key, remitente `hola@bionfc.com` con
   nombre "BIONFC".
5. **Supabase PROD → Authentication → Rate Limits:** con SMTP propio arranca en 30 mails por
   hora; alcanza para empezar.
6. Probar activando una chapita de prueba con un email que no sea del equipo.

## Pendiente

- Que un abogado revise los términos (`app/terminos/page.tsx`) cuando el negocio crezca. Los
  datos del responsable y el contacto están en `lib/terms.ts`.
- Fotos viejas: **ninguna parte del sistema borra archivos del storage** (ni al cambiar una foto
  de landing, ícono, PDF o chapita, ni al eliminar una página). No se puede borrar "la vieja"
  al reemplazar sin más, porque en las landings una misma foto puede usarla otra página o una
  plantilla. Plan: en chapitas de dueños, borrar la anterior al guardar (es solo de esa
  chapita); en el Admin, un "Liberar espacio" que borre lo que nada usa y tenga más de un día.
  Al 2026-10-20, DEV tenía 24 archivos (16 MB), 13 sin uso (5 MB). Para que no vuelva a crecer
  sin control, el bucket ya acepta solo imágenes y PDF de hasta 10 MB.
- Las listas de Páginas y Resumen del Admin traen todas las páginas de una vez: con más de 1.000
  (contando chapitas activadas) se cortan. Antes de llegar ahí, paginar o sacar las chapitas de
  esas listas (ya se cuentan bien en Chapitas).
- "¿Encontraste a…? Mandá tu ubicación" se muestra siempre (no solo en modo perdido: casi siempre
  la encuentran antes de que la familia prenda el cartel). Ver con compradores reales si se usa.
- Mover una chapita activada a otro cliente desde el Admin.
