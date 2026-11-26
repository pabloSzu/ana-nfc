// Fondos con mosaico (estrellas, patitas, huesitos de las tarjetitas) en vector para imprimir.
//
// Chrome imprime un fondo SVG que se repite como mosaico (background-repeat) como imagen de
// píxeles. Un SVG que se dibuja una sola vez, en cambio, queda en vector en el PDF. Justo antes de
// imprimir, cada capa con mosaico se reemplaza por un único SVG del tamaño del elemento con las
// copias del dibujito ya ubicadas (un <pattern> no sirve: Chrome también lo pasa a píxeles). Las
// demás capas (degradés, dibujos sin repetir) quedan tal cual. Devuelve la función que lo deshace.
// Medido: las tarjetitas pasan de 3-5 imágenes de píxeles cada una a ninguna, y se ven igual.

// Separa una lista CSS por las comas de primer nivel (las de adentro de url(...) o gradientes no).
function splitLayers(value: string) {
  const out: string[] = [];
  let depth = 0, current = "";
  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) { out.push(current.trim()); current = ""; } else current += char;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const SVG_URL = /^url\("?(data:image\/svg\+xml[^"]*)"?\)$/;

export function vectorizeBackgrounds(root: HTMLElement | null): () => void {
  if (!root) return () => {};
  const sheet = document.createElement("style");
  const marked: Element[] = [];
  const rules: string[] = [];
  const parser = new DOMParser();
  let count = 0;
  for (const element of root.querySelectorAll<HTMLElement>(".pc, .pc *")) {
    for (const pseudo of ["", "::before", "::after"]) {
      const style = getComputedStyle(element, pseudo || null);
      if (pseudo && (style.content === "none" || style.content === "normal")) continue;
      if (!style.backgroundImage.includes("data:image/svg+xml")) continue;
      const layers = splitLayers(style.backgroundImage);
      const sizes = splitLayers(style.backgroundSize), positions = splitLayers(style.backgroundPosition), repeats = splitLayers(style.backgroundRepeat);
      const pick = (list: string[], index: number, fallback: string) => list[index % list.length] || fallback;
      const width = pseudo ? parseFloat(style.width) : element.offsetWidth;
      const height = pseudo ? parseFloat(style.height) : element.offsetHeight;
      if (!width || !height) continue;
      let changed = false;
      const next = layers.map((layer, index) => {
        const match = layer.match(SVG_URL);
        const repeat = pick(repeats, index, "repeat");
        // Solo los mosaicos: lo que no se repite ya sale en vector.
        if (!match || repeat.includes("no-repeat")) return { image: layer, size: pick(sizes, index, "auto"), position: pick(positions, index, "0% 0%"), repeat };
        const tile = parser.parseFromString(decodeURIComponent(match[1].replace(/^data:image\/svg\+xml(;utf8)?,/, "")), "image/svg+xml").documentElement;
        const box = (tile.getAttribute("viewBox") || `0 0 ${tile.getAttribute("width")} ${tile.getAttribute("height")}`).split(/[\s,]+/).map(Number);
        const [sizeX, sizeY] = pick(sizes, index, "auto").split(" ").map((value) => parseFloat(value));
        const tileWidth = sizeX || box[2];
        const tileHeight = sizeY || tileWidth * box[3] / box[2];
        const [posX, posY] = pick(positions, index, "0px 0px").split(" ").map((value) => parseFloat(value) || 0);
        const color = tile.getAttribute("color") ? ` color="${tile.getAttribute("color")}"` : "";
        const copies: string[] = [];
        const startX = ((posX % tileWidth) + tileWidth) % tileWidth - tileWidth;
        const startY = ((posY % tileHeight) + tileHeight) % tileHeight - tileHeight;
        for (let y = startY; y < height; y += tileHeight) {
          for (let x = startX; x < width; x += tileWidth) copies.push(`<svg x="${x}" y="${y}" width="${tileWidth}" height="${tileHeight}" viewBox="${box.join(" ")}"${color} overflow="visible">${tile.innerHTML}</svg>`);
        }
        const whole = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${copies.join("")}</svg>`;
        changed = true;
        count++;
        return { image: `url("data:image/svg+xml,${encodeURIComponent(whole)}")`, size: "100% 100%", position: "0 0", repeat: "no-repeat" };
      });
      if (!changed) continue;
      const key = `data-vbg-${marked.length}`;
      element.setAttribute(key, "");
      marked.push(element);
      rules.push(`[${key}]${pseudo}{background-image:${next.map((layer) => layer.image).join(",")}!important;background-size:${next.map((layer) => layer.size).join(",")}!important;background-position:${next.map((layer) => layer.position).join(",")}!important;background-repeat:${next.map((layer) => layer.repeat).join(",")}!important}`);
    }
  }
  if (!count) return () => {};
  sheet.textContent = rules.join("\n");
  document.head.appendChild(sheet);
  return () => {
    sheet.remove();
    marked.forEach((element, index) => element.removeAttribute(`data-vbg-${index}`));
  };
}
