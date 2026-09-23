# Mi Landing Web Fácil

Plataforma de tarjetas digitales (estilo Linktree) para NFC/QR. Un admin crea un
perfil por cliente ("landing"): nombre, logo, colores, fondo y una lista de
botones de contacto (WhatsApp, Instagram, email, links personalizados...). Al
publicarla, queda disponible en `tudominio.com/<slug>` — esa URL es la que se
graba en el tag NFC físico o se codifica en el QR.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19, todo en Server Components
  con **Server Actions** para cada mutación (no hay API routes separadas).
- **Supabase**: Postgres (tablas `landings` y `actions`), Auth (login del
  admin) y Storage (bucket público `landing-assets` para logos/fondos).
- Sin librería de UI ni CSS framework: un solo `app/globals.css` con
  variables (`oklch()`), soporta claro/oscuro vía `prefers-color-scheme`.

## Cómo levantarlo

```bash
npm install
npm run dev      # http://localhost:3000
```

Necesita `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # se graba en los QR — en prod, el dominio real
```

Las credenciales de Supabase están en el dashboard del proyecto
(supabase.com → Settings → API). El login del admin es el que ya tenías
configurado en Supabase Auth.

`npm run build` corre el chequeo de TypeScript real (el modo `dev` con
Turbopack es más permisivo) — conviene correrlo antes de dar algo por
terminado.

## Estructura del proyecto

```
app/
  [slug]/page.tsx           → landing pública (lo que ve el cliente final)
  page.tsx, _home/          → la home pública del producto (marketing)
  admin/
    page.tsx                → dashboard: lista de clientes y landings
    clientes/[id]/          → ficha de un cliente
    landings/[id]/
      page.tsx              → solo un redirect() a editor-v2 (ruta vieja)
      editor-v2/            → EL editor: editor-v2.tsx + sus Server Actions + su CSS
      preview/              → vista previa a pantalla completa
      qr/                   → generador del QR de la landing
      font-picker.tsx, icon-picker.tsx → piezas sueltas que usa el editor
    actions.ts              → Server Actions del dashboard (crear/publicar/borrar)
  layout.tsx                → metadata global del sitio
components/
  landing-renderer.tsx      → cómo se pinta una landing (ver "El editor" más abajo)
  icons.tsx, action-icons.tsx → todos los íconos
lib/
  landing-catalog.ts        → el "catálogo": tipos de botón, colores automáticos, helpers de color/URL
  design-presets.ts         → los 15 presets de diseño y las colecciones de botones
  fonts.tsx, compress-image.ts
  supabase/                 → clientes de Supabase (server.ts usa cookies, client.ts es para el browser)
proxy.ts                    → middleware: refresca la sesión de Supabase en cada request
```

## Los datos: dos tablas

- **`landings`**: un registro por tarjeta digital. Identidad (nombre,
  descripción, logo), estilo (colores, fondo, tipografías), `slug` (la URL
  pública), `published` (bool), y opcionalmente `redirect_url` (si querés que
  el tag NFC lleve a otro lado en vez de mostrar esta landing).
- **`actions`**: los botones de una landing. Dos tipos, diferenciados por
  `is_generated`:
  - **Catálogo** (`is_generated: true`, tiene `source_field`): los ~14 tipos
    fijos definidos en `lib/landing-catalog.ts` (whatsapp, instagram, email,
    maps, etc.). Cada landing tiene como máximo una fila por tipo.
  - **Personalizados** (`is_generated: false`): links libres que agrega el
    admin, sin límite.

  Ambos comparten columnas de estilo (`background_color`, `text_color`,
  `use_auto_color`, `icon`) y `position` (orden en la lista, compartido entre
  ambos tipos).

## El editor

Hay **un solo** editor: `/admin/landings/[id]/editor-v2`. Es el estilo "celular
central" — tocás un elemento en la vista previa y se abre un panel solo para eso.
La ruta vieja `/admin/landings/[id]` es hoy nada más que un `redirect()` a
editor-v2, y todos los links del dashboard ya apuntan ahí directo.

El editor clásico (pestañas Identidad/Botones/Publicar) y el prototipo `visual/`
**ya no existen en `main`**. La rama `experimento/editor-visual` queda solo como
histórico: no la uses de referencia.

Lo más importante de cómo está armado, y hay que cuidarlo:
**`components/landing-renderer.tsx` es el mismo componente que pinta la landing
pública y el canvas editable del admin.** El editor solo le pasa
`LandingEditControls`, que agrega onClick, outline y badges *sin tocar el markup
real*. Por eso la vista previa no puede desincronizarse de lo publicado. Si vas
a tocar el renderer, mantené esa propiedad — es lo que hace que no exista el bug
de "en el editor se veía bien".

### Cómo agregar un tipo de botón nuevo

Un tipo de acción vive en **seis** lugares. Si te salteás uno, el botón anda
igual pero se ve mal (ícono genérico o color feo) en algún preset:

1. `lib/landing-catalog.ts` → el union `ActionType`
2. `lib/landing-catalog.ts` → `ACTION_ORDER` (define el orden en el menú "Agregar")
3. `lib/landing-catalog.ts` → `ACTION_DEFS` (label, emoji, tipo de input, placeholder)
4. `lib/landing-catalog.ts` → `AUTO_COLORS` (el color de "color automático")
5. `components/action-icons.tsx` → `actionIcons` (el ícono real del botón)
6. `lib/design-presets.ts` → `BRAND_VIVID` (presets oscuros) y `BRAND_ICON` (insignia "Ícono real")

Y además `validTypes` en `app/admin/landings/[id]/editor-v2/actions.ts`, que hoy
es una copia a mano de `ACTION_ORDER` (vale la pena unificarlas en algún momento).

## Patrones que se repiten en todo el código (importante si vas a tocar algo)

1. **Toda mutación es un Server Action que termina en `redirect()`**. No hay
   `fetch` a una API — los `<form action={miAccion}>` llaman directo a una
   función del servidor.
2. **`revalidatePath()` antes de cada `redirect()`**. Sin esto, Next.js puede
   mostrar una versión vieja de la página después de guardar — fue un bug
   real que ya pisamos una vez (commit `2bec2d5`).
3. **El truco `form="algo"`**: HTML no permite `<form>` anidados. Para tener
   un campo fuera de la etiqueta `<form>` (ej: un selector de color en otro
   lado de la pantalla) se usa el atributo `form={ID}` en el input, apuntando
   al `id` del form real. Se usa MUCHO, sobre todo en el editor visual donde
   los campos de identidad viven en un `<form>` vacío y los inputs de verdad
   están desperdigados por toda la pantalla del celular.
4. **Ojo con los campos "ocultos" que hay que mantener sincronizados**: si un
   campo de un formulario deja de estar en el DOM al momento de guardar (por
   ejemplo, porque el modal que lo mostraba ya se cerró), ese campo se manda
   vacío y **pisa** el valor guardado en la base. Por eso en el editor visual
   los campos identity (nombre, fondo, colores) viven siempre montados como
   inputs ocultos que reflejan el estado en vivo (`draft`), y los modales solo
   los editan — nunca son ellos mismos la fuente del guardado.
5. **`DraftProvider`** (`draft-context.tsx`): contexto de React que guarda el
   estado "en vivo" de lo que se está editando, para que la vista previa se
   actualice al tipear sin necesidad de guardar. Se resincroniza solo cuando
   el servidor manda datos frescos (después de un `redirect`).
6. **Compresión de imágenes en el navegador** (`lib/compress-image.ts`) antes
   de subir: logo a 320px, fondo a 1200px — ajustado al tamaño real en que se
   muestran (el logo nunca se ve a más de ~96px), no a lo que ocupaba
   originalmente la foto del celular del cliente.

## Deploy

En Vercel, conectado al repo de GitHub (`pabloSzu/ana-nfc`). Variables de
entorno necesarias ahí (Project Settings → Environment Variables), tipo
**Config** (no "Secret" — Next.js las expone igual al navegador por ser
`NEXT_PUBLIC_*`, así que no hay nada que ocultar):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` → el dominio real de producción (se graba en los QR
  que se generan; si esto queda en `localhost`, los QR van a apuntar a
  localhost).

## Pendientes conocidos (no son bugs, son cosas que quedaron afuera a propósito)

- Reordenar botones es con flechas Subir/Bajar, no arrastrando. Si se siente
  incómodo, hacer drag-and-drop real es la mejora natural siguiente.
- El modo oscuro está armado en el CSS pero nunca se probó visualmente a
  fondo.
- El editor visual no tiene forma de reactivar un botón personalizado
  desactivado (solo se ven los que están activos en el celular) — para eso
  hay que ir al editor clásico por ahora.
