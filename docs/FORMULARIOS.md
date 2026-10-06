# Formularios

Dos formularios en Tally. El A está armado; el B está diseñado y sin crear.

Por qué Tally y no un formulario propio: hoy el sistema casi no tiene nada que escriba desde
afuera, y un formulario público con subida de archivos abriría la base y el Storage a spam y
abuso. Además las preguntas todavía van a cambiar con los primeros clientes. Cuando dejen de
cambiar, conviene pasarlo al sistema para que cada pedido cree la landing como borrador.

---

## A · Alta de clientes (armado)

- Editar: https://tally.so/forms/zxaMZg/edit
- Link público (funciona recién al publicarlo): https://tally.so/r/zxaMZg
- Respaldo de la versión larga: https://tally.so/forms/jaOLNJ/edit

Lo completa cualquier cliente final. Nueve preguntas, una sola página, sin ramificaciones:

1. Nombre y apellido
2. WhatsApp
3. Nombre del negocio o marca (en una tarjeta personal, el nombre de la persona)
4. ¿Qué querés que pase cuando lo escaneen? Reseña / WhatsApp o un link / Página completa /
   Tarjeta personal / No sé, ayúdenme a elegir
5. ¿Qué producto y cuántos? (texto libre: "2 acrílicos y 20 llaveros")
6. Logo, fotos o lo que tengas (opcional, varios archivos)
7. Datos y links que van en la página (texto libre)
8. ¿Dónde lo recibís?
9. ¿Algo más? (opcional)

### Por qué es tan corto

Hubo una versión de 44 preguntas con ramificaciones, y era demasiado para alguien que lo
completa desde el celular. La regla que quedó: **se pregunta solo lo que únicamente el cliente
sabe.** Colores, estilo, eslogan y si lleva QR los decide BioNFC y los muestra en la vista
previa; el cliente aprueba o pide cambios por WhatsApp. Facturación y CUIT se piden al cobrar.

El costo: las preguntas 5 y 7 llegan como texto libre y hay que leerlas. Con pocos pedidos por
semana conviene; si el volumen crece, se vuelve a estructurar. La versión larga está en el
respaldo, por si sirve de base.

Las confirmaciones (derecho sobre el logo, vista previa antes de imprimir, uso de los datos)
están en el texto de bienvenida y no como pregunta.

### Saber qué taller trajo al cliente

El formulario tiene un campo oculto `taller` que se completa desde el link. Cada taller recibe
**su propio link** y se lo pasa a sus clientes:

```
https://tally.so/r/zxaMZg?taller=grabados-lopez
```

Cada respuesta llega con el taller que la originó. Usar siempre el mismo identificador por
taller, en minúsculas y con guiones: es lo que después se usa para facturarle.

Para los clientes de un taller, la pregunta 5 (producto y cantidades) no tiene sentido porque el
producto lo hace el taller. Cuando aparezca el primero, hacer una **copia** de este formulario
sin esa pregunta y darle ese link.

### Pendiente antes de publicarlo

- [ ] Probarlo en la vista previa, desde el celular.
- [ ] Probar el link con `?taller=prueba` y confirmar que el dato llega a la respuesta.
- [ ] Activar el aviso por email (Settings → Notifications). Hoy está apagado.
- [ ] Conectar Google Sheets (Integrations).
- [ ] Publicar.
- [ ] Borrar la clave de API que se usó para armarlo (Settings → API keys).

---

## B · Talleres que quieren sumarse (diseñado, sin crear)

Para fabricantes que quieren agregar NFC a sus productos: talleres de grabado láser,
impresión 3D, sublimación, cartelería, imprentas. **No es para armar páginas**, es para que un
taller pida entrar al programa.

Crearlo cuando aparezca el primer taller interesado, o cuando se decida salir a buscarlos.

| # | Pregunta | Tipo |
|---|---|---|
| 1 | Nombre del taller, nombre de contacto y WhatsApp | Respuestas cortas + teléfono |
| 2 | ¿Qué fabrican? Grabado láser / Impresión 3D / Sublimación / Cartelería / Imprenta / Otro | Casillas |
| 3 | ¿Dónde están? | Respuesta corta |
| 4 | ¿Ya trabajan con NFC? Sí / No / Lo estoy evaluando | Opción múltiple |
| 5 | ¿Cuántos productos personalizados venden por mes, aproximadamente? Menos de 50 / 50 a 200 / 200 a 1000 / Más de 1000 | Opción múltiple |
| 6 | ¿Qué te interesa? Que ustedes armen las páginas de mis clientes / Armarlas yo, con mi marca / Todavía no sé | Opción múltiple |

**La pregunta 6 es la que importa.** Contesta la duda grande del negocio antes de programar
nada: si los talleres quieren el **servicio** (que armes vos las páginas, cobrando por unidad o
por año) o la **plataforma** (armarlas ellos, con su marca, que exige usuarios, cobro y marca
blanca). Mirar cómo se reparten las respuestas antes de decidir qué construir.

A cada taller que entre se le da su link del formulario A con su `?taller=`.
