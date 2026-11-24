# Dibujos de las chapitas (animalitos) y cómo vectorizarlos

Cómo están guardados los dibujos de los animalitos, cómo se pasan a vector para imprimir y qué
hay que hacer para sumar una raza nueva o un personalizado. Complementa [CHAPITAS.md](CHAPITAS.md).

---

## Dónde está cada cosa

Todo vive en `public/pet-tags/`. Cada animalito tiene **el mismo nombre de archivo (su `id`) en
todas las carpetas**:

| Carpeta | Qué es | Tamaño aprox. | Dónde se usa |
|---|---|---|---|
| `characters/<id>.png` | El dibujo de cuerpo entero | 704×768 | Catálogo (`src`) |
| `faces/<id>.png` | La carita | 768×710 | Frente de la chapita sin nombre (`faceSrc`) |
| `named/<id>.png` | La versión para chapita con nombre | 704×768 | Frente de la chapita con nombre |
| `thumbs/<id>.png` | Miniatura recortada al dibujo | 256 px | Selector de animalitos del estudio |
| `generic-v2/<nombre>.png` | Los genéricos (perrito, gatito, patita…) | 768×768 | Sirven a la vez de dibujo, carita y miniatura |
| `vector/…/<mismo nombre>.svg` | La versión en vector de los PNG de arriba | — | **Lo que se imprime** |
| `vector/tap-phone-bold.svg` | El celularito de “acercá el celu” | — | Dorso de la chapita |

El catálogo es `TAG_CHARACTERS` en
[`app/admin/chapitas/[id]/imprimir/tag-face.tsx`](../app/admin/chapitas/[id]/imprimir/tag-face.tsx).
Cada entrada lleva `id`, `label`, `src` y `faceSrc`, y opcionalmente:

- `family` y `coat`: variantes de color de una misma raza (ej. los tres caniches).
- `custom: true`: un personalizado hecho para un cliente (aparece en “Personalizados”).
- `generic: "dog" | "cat" | "symbol"`: los genéricos.

## Por qué en vector

En pantalla se ven los PNG. Al imprimir, el estudio cambia solo cada PNG por su SVG: la función
`vector()` de `tag-face.tsx` transforma `/pet-tags/faces/golden.png` en
`/pet-tags/vector/faces/golden.svg`. **No hay que tocar código**: alcanza con que el SVG exista
con el mismo nombre en la carpeta espejo dentro de `vector/`.

Así el PDF sale nítido a cualquier tamaño, y la imprenta recibe trazos y no píxeles. El QR ya se
dibuja en vector desde el código.

## Cómo vectorizar: vectorizer.com

Usamos **[vectorizer.com/es](https://vectorizer.com/es/)**. Es gratis, deja subir **hasta 20
imágenes por tanda** y saca resultados muchísimo mejores que los vectorizadores gratuitos que
corren en la compu.

> Probamos primero `@neplex/vectorizer` (motor VTracer) localmente: andaba, pero al agrandar se
> perdían líneas y sombras. Quedó descartado.

Pasos:

1. Juntar los PNG a vectorizar, **de a 20 como máximo**. Conviene una tanda por carpeta
   (`named`, `faces`, `generic-v2`) para no mezclar nombres.
2. Entrar a vectorizer.com/es, tocar **SUBIR** y elegir los PNG.
3. Esperar a que terminen todos y **descargar el ZIP** con los SVG.
4. Descomprimir el ZIP en una carpeta aparte (no adentro del proyecto) y revisar:
   - que estén todos;
   - que cada SVG tenga **exactamente el mismo nombre que su PNG** (solo cambia `.png` por `.svg`);
   - abrir algunos y mirar que no falten partes.
5. Copiar los SVG a la carpeta que corresponde:
   - `named/*.png` → `public/pet-tags/vector/named/`
   - `faces/*.png` → `public/pet-tags/vector/faces/`
   - `generic-v2/*.png` → `public/pet-tags/vector/generic-v2/`
6. Abrir el estudio de impresión en DEV (`/admin/chapitas/<lote>/imprimir`), poner el animalito
   en una chapita y descargar el PDF para verlo de cerca.

**Ojo con las descargas:** si se bajan varios ZIP seguidos, Chrome puede bloquear las descargas
automáticas de la página. Hay que permitirlas (ícono en la barra de direcciones) y volver a
bajar el ZIP.

Hoy hay 110 SVG: 50 en `named`, 50 en `faces`, 9 en `generic-v2` y el celularito. Se usan
`named` y `faces`. `characters` y `thumbs` no se imprimen, así que no necesitan vector.

## Sumar una raza nueva o un personalizado

1. **El dibujo.** Generarlo con IA en el mismo estilo que los actuales, pasando uno existente
   como referencia: misma pose, mismo encuadre, contorno blanco y fondo transparente. Para un
   personalizado, partir de 2 o 3 fotos del cliente (cara de frente con buena luz y cuerpo entero
   para ver los colores). **No vectorizar la foto directo**: queda como un dibujo raro con
   manchas y no combina con el resto.
2. **Los PNG.** Elegir un `id` en minúsculas y con guiones (ej. `border-collie`) y armar los
   cuatro archivos con ese nombre: `characters/`, `faces/`, `named/` y `thumbs/`, con los tamaños
   de la tabla de arriba y fondo transparente.
3. **Vectorizar** `named/<id>.png` y `faces/<id>.png` en vectorizer.com (ver arriba) y copiar
   los SVG.
4. **Registrarlo** en `TAG_CHARACTERS`, junto a los de su especie:
   ```ts
   { id: "border-collie", label: "Border collie", src: "/pet-tags/characters/border-collie.png", faceSrc: "/pet-tags/faces/border-collie.png" },
   ```
   Si es un personalizado, sumarle `custom: true`.
5. **Probar** en el estudio (pantalla y PDF) y correr `npm test`.

Para un personalizado, mandarle al cliente la vista previa de la chapita armada en el estudio
antes de imprimir.
