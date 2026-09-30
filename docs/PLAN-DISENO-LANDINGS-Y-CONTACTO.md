# Plan de diseño: landings y tarjetas personales

Estado: propuesta en evolución. El 30/09/2026 se empezó una prueba del nuevo flujo de Contacto. La implementación se conserva en Git para seguir iterando; este plan no implica que ya esté publicada.

## Dirección actual para Tarjetas personales

La estructura de Contacto de las fases 1–2 de abajo se reemplaza por una prueba más simple: guía de cuatro pasos para tarjetas nuevas (`diseño → perfil → contacto → revisión`) y, después, solo dos entradas principales (`Contenido` y `Diseño`). La galería de diseños define el formato completo; no hay otro selector principal de Tarjeta visual/Ficha profesional. Colores y letra son retoques voluntarios; fotos y fondo se editan tocando la vista previa o desde opciones secundarias. Se reutilizan los datos, el guardado y la tarjeta publicada existentes. Falta probar el flujo con usuarios y revisar visualmente móvil/escritorio antes de considerar cerrado el diseño.

## Objetivo

Que una persona pueda elegir un diseño atractivo en segundos y luego cambiar lo necesario sin que un ajuste desarme otros. La vista previa y la página publicada deben coincidir en móvil y escritorio.

## Diagnóstico del editor actual

- Las landings tienen una colección de diseños predeterminados en `lib/design-presets.ts`. Se aplican como punto de partida y pueden editarse, pero falta una revisión visual sistemática de cada uno.
- La portada de muestra es `/editor/sample-cover.webp` y aparece **solo en el editor** cuando está activada la portada y no hay imagen propia. No se guarda ni se publica.
- Contacto tiene cuatro diseños (`Papel editorial`, `Lino cálido`, `Minimal oscuro`, `Portada fotográfica`) más el aspecto clásico. Actualmente, al elegir uno se modifican juntos tema, colores, tipografía, forma de foto y estructura `Tarjeta visual`/`Ficha profesional`; el diseño fotográfico también activa la portada. Esto explica cambios inesperados.
- Contacto reutiliza datos y renderer de landing, lo cual conviene conservar. Sin embargo, algunas reglas `.is-contact` y `.contact-layout-document` de `app/globals.css` imponen tamaños, alineación y colores con `!important`, por encima de valores ajustados en el editor. La foto de la ficha profesional está fijada a 96 px. Hay que resolver esas colisiones antes de ampliar controles.
- `Distribución` de landing no aparece como acceso en la vista previa de Contacto. Copiar todos sus controles a Contacto sumaría opciones irrelevantes; hace falta una versión breve y contextual.

## Decisiones de producto

1. **Diseños como puntos de partida editables.** Al elegir uno, se aplica una combinación curada; luego se pueden modificar colores, portada, estructura y tamaños. No se bloquean opciones por diseño.
2. **Separar cuatro decisiones:** `Diseño` (paleta, tipografía y acabado), `Estructura` (Tarjeta visual o Ficha profesional), `Portada` (sin foto, foto/encuadre y efecto), y `Distribución` (tamaños y espacios). La elección de un diseño puede proponer valores iniciales, pero los cambios posteriores de una sola categoría no deben reescribir las otras.
3. **Preservar contenido al cambiar diseño:** nombre, datos, enlaces, PDF, foto y portada cargada nunca se borran. Indicar antes de aplicar qué aspectos visuales cambian; conservar deshacer. Ofrecer un único `Restaurar diseño recomendado` claro, no varios botones contradictorios.
4. **Dos niveles de edición:** recorrido rápido (datos → diseño → publicar) y `Personalizar diseño` para quien quiera ajustar detalles. Evitar llenar la pantalla inicial con decenas de deslizadores.
5. **No agregar muchas plantillas todavía.** Primero lograr que las existentes funcionen bien en ambas estructuras. Después sumar 2–3 propuestas con identidad realmente distinta, no simples recolores.
6. **Guardar diseños propios para reutilizarlos:** funcionalidad valiosa, pero fase posterior. Primero estabilizar qué se guarda y qué se restaura; luego diseñar `Guardar como mi diseño` con nombre, miniatura, edición/duplicado y alcance de cuenta. Esto no debe mezclarse con guardar la landing actual.

## Trabajo propuesto, en orden

### 1. Base visual y corrección de Contacto

- Registrar capturas de las tarjetas actuales en móvil y escritorio: cada diseño × cada estructura × con/sin portada y foto; incluir nombres largos, datos vacíos y varios enlaces.
- Identificar cada propiedad que el editor permite cambiar pero el CSS termina ignorando. Sustituir reglas rígidas y `!important` por variables/tokens de Contacto con valores por defecto seguros y límites responsivos.
- Arreglar superposiciones, desbordes, contraste, espaciados y consistencia entre editor, vista previa y página publicada. No añadir opciones para compensar bugs.

### 2. Editor simple de Tarjeta personal

- `Diseños`: mostrar miniaturas reales, nombre y diferencia visible. Al aplicar, cambiar solo el paquete visual de la tarjeta. La selección `Tarjeta visual`/`Ficha profesional` deja de depender del diseño elegido.
- `Estructura`: dos opciones visuales claras, con una frase de cuándo conviene cada una. Debe conservar colores, foto, portada y contenido al alternar.
- `Colores`: acento editable y, si es necesario, fondo/superficie/texto agrupados como paletas coordinadas. Mantener colores legibles automáticamente; exponer edición manual adicional solo donde sea útil.
- `Portada`: controles explícitos para mostrar/ocultar, subir/cambiar foto y encuadrar. Ningún diseño debería encender una portada de muestra sin explicarlo.
- `Distribución de tarjeta`: empezar con tres preajustes (`Compacta`, `Equilibrada`, `Amplia`) y solo 3–4 ajustes pertinentes: tamaño de foto, altura de portada, espacio entre encabezado y acciones, y separación de secciones. Mostrar únicamente los que funcionen en la estructura elegida; definir rangos mínimos/máximos para evitar roturas.
- `Restaurar diseño recomendado`: acción general y reversible que devuelve únicamente las decisiones visuales del diseño elegido; nunca borra datos o archivos.

### 3. Mejorar las plantillas de Landing

- Auditar todas las plantillas en móvil y escritorio con el mismo contenido de prueba: con/sin portada, pocos/muchos botones, íconos reales/minimalistas, fondo sólido/imagen.
- Priorizar las plantillas que hoy se sienten débiles o inconsistentes. Por cada una, definir una dirección visual breve: referencia, paleta, tipografía, botones, portada, imagen de ejemplo y criterio de contraste. Corregir el preset, no crear una variante duplicada para desktop.
- Mantener plantillas curadas y editables. Para pedir cambios no hace falta pasar valores CSS: sirven una captura/referencia y 2–3 adjetivos por plantilla (por ejemplo, “menos infantil, más editorial, menos sombra”).
- Más adelante, tras estabilizar presets, evaluar `Guardar mi diseño` como biblioteca personal separada de las plantillas oficiales.

### 4. Nueva portada de muestra

- Archivo recibido: `C:\Users\Pablo\Downloads\Imagen de ChatGPT 29 sept 2026, 17_37_50.png` (2172 × 724 px, aproximadamente 1,2 MB). Es una composición horizontal clara con el logo BioNFC repetido, no una foto con un único foco.
- Probarla en los dos modos de portada (`banner` y `difuminada`) y a 360, 390, 430 y 520 px. Con `background-size: cover`, un recorte estrecho puede cortar palabras/logos; elegir el encuadre o preparar una versión móvil **del mismo recurso de ejemplo** si hace falta. No convertirla en mosaico automático.
- Optimizar el recurso para web antes de integrarlo. Mantener la etiqueta `Portada de ejemplo · Subí la tuya` y el comportamiento de solo editor. Confirmar visualmente que la portada de ejemplo no aparezca en la página publicada.

### 5. Verificación y cierre

- Probar cada combinación importante en el editor, vista previa y URL publicada; verificar móvil Safari/iPhone y escritorio, textos largos, pantallas angostas y sin imágenes.
- Criterios de aceptación: no hay elementos que se pisen ni recortes inesperados; los controles producen cambios visibles; cambiar diseño no altera estructura ni contenido; la portada y foto se encuadran bien; texto/acciones son legibles y utilizables; no hay errores de consola; el guardado conserva lo que muestra la vista previa.
- Implementar en cambios pequeños, revisar juntos las capturas/resultados y **no commitear ni pushear** hasta aprobación explícita.

## Lo único que sería útil pedir al definir la dirección artística

- Qué 2–3 plantillas de Landing priorizar y una referencia visual o frase para cada una.
- Si para Contacto interesa primero una estética más `profesional/editorial`, `cálida/artesanal` o `audaz/creativa`. La arquitectura y las correcciones anteriores no dependen de esa elección.
