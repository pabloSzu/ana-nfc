# Arquitectura y operación

Complemento del [README](../README.md), que explica el código. Esto explica **dónde vive
todo, cómo se despliega y qué cosas rompen en silencio**. Todos los datos de acá están
verificados contra las bases reales, no asumidos.

---

## Los dos entornos

Son **dos proyectos de Supabase distintos**. No comparten base, ni usuarios de auth, ni
storage, ni claves. Nada de lo que hagas en uno aparece en el otro.

| | DEV | PROD |
|---|---|---|
| Project ref | `zupefxnbvlardzdrhqjb` | `hjoemykslbmzstktckup` |
| Región (pooler) | `aws-0-ca-central-1` | `aws-0-sa-east-1` |
| Postgres | 17.6 | 17.6 |
| Config local | `.env.local` | variables en Vercel |

`.env.production.local.bak` es un resto: **no se usa**, y su `NEXT_PUBLIC_SITE_URL`
apunta a localhost. Las variables reales de producción viven en el dashboard de Vercel.

**Consecuencia práctica: toda migración hay que aplicarla dos veces.**

## Despliegue

Vercel está conectado al repo. **Mergear a `main` despliega a producción.** No hay
GitHub Actions; `vercel.json` solo fija la región (`gru1`, San Pablo). El resto vive en el dashboard de Vercel.

Orden correcto al cambiar el esquema:

1. Aplicar primero las migraciones **compatibles** que agregan tablas, columnas y funciones.
2. Recién después mergear a `main` y comprobar el deploy.
3. Si hay una migración de **cierre** que quita compatibilidad vieja, aplicarla al final.

Las chapitas usan exactamente este esquema: `20261021120000_chapitas_seguridad.sql` crea
`public_landing` pero conserva temporalmente la lectura pública anterior; después del deploy,
`20261022120000_chapitas_lockdown.sql` la elimina. Así la versión vieja y la nueva funcionan
durante todo el cambio. Probá siempre primero en DEV y en un preview de Vercel apuntando a DEV.

## Los datos

Las tablas, todas en `public`:

- **`landings`** — una fila por tarjeta digital. Identidad, estilo, `slug`, `published`,
  y `redirect_url` opcional.
- **`actions`** — los botones de una landing. Ver el README para la distinción entre
  catálogo y personalizados.
- **`clients`** — ficha de CRM del cliente (nombre, email, teléfono). El `owner_id` de todo
  sos vos. Un cliente puede tener **miembros** con login (ver abajo).
- **`landing_views`** — una fila por visita. Ver abajo.
- **`staff`**, **`client_members`**, **`tag_batches`**, **`tag_activations`**, **`reports`** —
  quién usa el Admin, quién es dueño de qué chapita, los lotes de chapitas, sus códigos de
  activación y las denuncias. Ver [CHAPITAS.md](CHAPITAS.md).

### El modelo de permisos

Hay dos capas, y las dos están puestas.

Las Server Actions filtran por `.eq("owner_id", user.id)` en cada consulta, pero eso es
conveniencia, no la defensa: **la defensa está en la base**. Todas las tablas tienen RLS,
acotada por `owner_id = auth.uid()` para el usuario logueado, más lectura pública
restringida a landings publicadas y a sus botones habilitados.

Eso importa porque la `PUBLISHABLE_KEY` es pública por diseño: cualquiera puede pegarle a
Supabase directo desde el navegador salteándose las Server Actions. Cuando lo hace, la RLS
lo frena igual.

Las páginas publicadas **no** se pueden listar desde afuera: se leen de a una, por su link, con
la función `public_landing(slug)` (y `/go/[id]` con `public_landing_slug`). Antes cualquiera con la
clave pública podía bajarse todas las chapitas con los teléfonos de las familias. Ver
`supabase/migrations/20261021120000_chapitas_seguridad.sql`.

Lo que el público no puede hacer solo (validar un código de activación, crear la cuenta de quien
activa, contar intentos para frenar abusos) lo hace el servidor con la **clave secreta**
(`SUPABASE_SECRET_KEY`, `lib/supabase/admin.ts`). Esa variable va solo en `.env.local` y en Vercel,
**nunca** con prefijo `NEXT_PUBLIC_`.

Hay dos tipos de usuario (migración `20261020120000_pet_tags_and_members`):

- **Staff** (tabla `staff`): usa el Admin. Solo el staff puede crear clientes, páginas y
  lotes (`is_staff()` en las políticas de inserción). El Admin manda a `/mi` a quien no lo es.
- **Miembro de un cliente** (tabla `client_members`): el dueño de una chapita. **Lee** las
  páginas de su cliente, pero **no escribe en ninguna tabla**: guarda con la función
  `save_my_pet`, que revisa que sea suya y toca solo nombre, foto, colores y datos de la
  mascota. Así no puede cambiarse el plan, el vencimiento ni nada más.

Un registro nuevo sin código de chapita no puede hacer nada: no es staff ni miembro.

El esquema completo, con sus políticas, está en `supabase/baseline/` más las migraciones.

## Contador de escaneos

Un chip NFC no puede contar: no tiene batería ni memoria, solo guarda una URL. Lo que se
cuenta son **aperturas de la página**, en `app/[slug]/page.tsx`.

- El insert corre dentro de `after()`, después de mandar la respuesta. Nunca hace esperar
  a quien apoyó el celular, y nunca lanza: si la base falla, la landing igual se ve.
- Se filtran bots por `user-agent`. No es opcional: WhatsApp, Instagram y Slack abren la
  página para armar la previsualización del link, así que sin filtro compartir el link
  una vez ya suma escaneos falsos.
- El origen (`nfc` / `qr` / `direct`) sale del parámetro `?s=`. **Solo se distingue si el
  tag se grabó con `?s=nfc`.** El QR ya lo lleva. Sobre tarjetas ya entregadas no hay
  forma de saberlo: cuentan como `direct`.
- El Admin muestra el total, los últimos 30 días y el desglose por origen. Las aperturas
  hechas por el dueño mientras conserva su sesión de Admin no se registran.
- Un error de inserción no rompe la landing, pero sí queda registrado en los logs del servidor
  para que una falla de estadísticas no vuelva a pasar inadvertida.

## Migraciones

```
npm run db:dev          # dry-run: muestra qué aplicaría, no escribe
npm run db:dev:apply    # aplica
npm run db:prod         # dry-run contra producción
npm run db:prod:apply   # aplica en producción
```

Solo si una base quedó atrasada respecto de una migración más nueva que ya tiene aplicada,
usar `npm run db:prod -- --include-all` para ver qué migraciones antiguas faltan y, luego
de verificarlas una por una, `npm run db:prod:apply -- --include-all`. No usar esta opción
como rutina: puede aplicar cambios viejos que no esperabas.

Cada comando imprime el entorno y el project ref antes de hacer nada. **Sin `--apply` no
escribe.** El riesgo real con dos bases no es escribir mal el SQL: es correr en prod lo
que creías que corrías en dev.

Las cadenas de conexión van en `.env.db.local` (fuera de git; `.env.db.example` documenta
el formato). Dos trampas que cuestan tiempo si no se saben:

- **Usar el Session pooler, no la Direct connection.** La directa es solo IPv6 y no se
  alcanza desde redes sin IPv6.
- **La contraseña va percent-encodeada**: `/` → `%2F`, `&` → `%26`, `@` → `%40`.

El historial de migraciones vive en `supabase_migrations.schema_migrations` dentro de cada
base, así que cada proyecto sabe cuáles ya aplicó.

### Crear un proyecto desde cero

Las migraciones asumen que las tablas ya existen: se crearon a mano en el dashboard, antes
de que hubiera migraciones. Para levantar un proyecto nuevo (otra región, otro entorno,
recuperar uno perdido) hay que correr primero el esquema base, una sola vez:

```
psql "<Session pooler del proyecto nuevo>" -v ON_ERROR_STOP=1 -f supabase/baseline/01-schema.sql
psql "<Session pooler del proyecto nuevo>" -v ON_ERROR_STOP=1 -f supabase/baseline/02-storage.sql
```

y recién después las migraciones (`npm run db:dev:apply`). El archivo de storage va aparte
porque el bucket es una fila en `storage.buckets` y sus permisos viven sobre
`storage.objects`: un `pg_dump` del esquema `public` no los trae, y sin ellos el proyecto
levanta pero no se puede subir ni un logo.

Lo que NO se lleva ninguno de los dos: los datos, los archivos ya subidos y los usuarios de
auth. El usuario del admin se crea de nuevo en el dashboard del proyecto nuevo.

## Cosas que rompen en silencio

Ninguna de estas falla en pantalla. Todas fallan después.

**`NEXT_PUBLIC_SITE_URL` mal configurada.** Es lo que se codifica en cada QR. Si apunta a
localhost, el QR sale igual de prolijo que uno bueno y falla meses más tarde en el celular
de un cliente, sobre plástico ya impreso. Hay un aviso en la pantalla del QR que detecta
localhost y rangos de red privada, pero no puede detectar un dominio equivocado.

**Agregar un tipo de botón y olvidarse de un lugar.** Vive en seis (ver README) más
`validTypes` en las Server Actions del editor, que es una copia a mano. Si te olvidás de
esa, el botón se guarda silenciosamente como `url`.

**Tocar `landing-renderer.tsx` sin cuidado.** Es el mismo componente que pinta la landing
pública y el canvas editable del admin. Por eso la vista previa no puede desincronizarse
de lo publicado. Si eso se rompe, vuelve el bug de "en el editor se veía bien".

## Costos y límites de los servicios

Todo puede arrancar en planes gratis; estos son los límites que importan (verificar en cada
servicio, cambian):

| Servicio | Gratis | Cuándo pagar |
|---|---|---|
| Supabase | 500 MB de base, 1 GB de archivos, 5 GB de tráfico por mes, 50.000 usuarios activos. Un proyecto gratis **se pausa tras una semana sin uso** | Pro (USD 25/mes) cuando PROD no pueda pausarse nunca o se acerque a los límites |
| Vercel | Hobby: gratis, pero sus condiciones lo limitan a uso personal y no comercial | Pro (USD 20/mes) para un negocio que vende |
| Resend | 3.000 mails por mes, 100 por día | Cuando haya más de ~100 activaciones o entradas por día |
| api.qrserver.com | Gratis, sin cuenta | — (genera los QR de las pantallas de QR y de impresión) |

Las fotos ya se achican en el navegador antes de subirlas (`lib/compress-image.ts`: logo
900 px, fondo 1600 px, portada 2000 px, en WebP) y las páginas públicas las sirven
optimizadas (`lib/landing-image.ts`), así que el tráfico por visita es bajo.
