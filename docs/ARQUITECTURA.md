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
`vercel.json` ni GitHub Actions: la configuración vive en el dashboard de Vercel.

Orden correcto al cambiar el esquema:

1. Aplicar la migración en PROD.
2. Recién después mergear a `main`.

Al revés también es seguro —el código está escrito para tolerar que la tabla no exista—
pero perdés los datos del intervalo.

## Los datos

Cuatro tablas, todas en `public`:

- **`landings`** — una fila por tarjeta digital. Identidad, estilo, `slug`, `published`,
  y `redirect_url` opcional.
- **`actions`** — los botones de una landing. Ver el README para la distinción entre
  catálogo y personalizados.
- **`clients`** — ficha de CRM del cliente (nombre, email, teléfono). **No es un usuario
  de auth**: los clientes no tienen login. El `owner_id` de todo sos vos.
- **`landing_views`** — una fila por visita. Ver abajo.

### El modelo de permisos

Hay dos capas, y las dos están puestas.

Las Server Actions filtran por `.eq("owner_id", user.id)` en cada consulta, pero eso es
conveniencia, no la defensa: **la defensa está en la base**. Las cuatro tablas tienen RLS
habilitada y 18 políticas, acotadas por `owner_id = auth.uid()` para el usuario logueado,
más lectura pública restringida a landings publicadas y a sus botones habilitados.

Eso importa porque la `PUBLISHABLE_KEY` es pública por diseño: cualquiera puede pegarle a
Supabase directo desde el navegador salteándose las Server Actions. Cuando lo hace, la RLS
lo frena igual.

El día que un cliente tenga su propio login **no hay un agujero que tapar, hay políticas
que agregar**: hoy su `auth.uid()` no coincide con ningún `owner_id`, así que no vería
nada. Es lo contrario de un problema de seguridad — es una funcionalidad que falta.

El esquema completo, con sus políticas, está en `supabase/baseline/`.

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

## Migraciones

```
npm run db:dev          # dry-run: muestra qué aplicaría, no escribe
npm run db:dev:apply    # aplica
npm run db:prod         # dry-run contra producción
npm run db:prod:apply   # aplica en producción
```

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
