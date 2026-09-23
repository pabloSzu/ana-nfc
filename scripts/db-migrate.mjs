// Aplica las migraciones de supabase/migrations a uno de los dos proyectos.
//
// Existe porque son DOS bases separadas (dev y prod son proyectos distintos de Supabase, no
// comparten nada) y el riesgo real no es equivocarse escribiendo SQL: es correr en prod lo que
// creías que corrías en dev. Por eso el entorno es un argumento obligatorio, sale impreso en
// pantalla antes de hacer nada, y sin --apply esto no escribe: solo muestra qué haría.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const ENV_FILE = ".env.db.local";
const [, , target, ...flags] = process.argv;
const apply = flags.includes("--apply");

if (!["dev", "prod"].includes(target)) {
  console.error("Uso: node scripts/db-migrate.mjs <dev|prod> [--apply]\n\nSin --apply hace un dry-run y no toca nada.");
  process.exit(1);
}

if (!existsSync(ENV_FILE)) {
  console.error(`Falta ${ENV_FILE}. Copiá .env.db.example y completá las cadenas de conexión.`);
  process.exit(1);
}

const vars = Object.fromEntries(
  readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => { const i = line.indexOf("="); return [line.slice(0, i).trim(), line.slice(i + 1).trim()]; })
);

const url = vars[target === "dev" ? "DEV_DB_URL" : "PROD_DB_URL"];
if (!url || url.includes("PEGAR-")) {
  console.error(`No hay cadena de conexión para "${target}" en ${ENV_FILE}.`);
  process.exit(1);
}

// El ref del proyecto se muestra para que se vea a ojo contra cuál se está corriendo. La
// contraseña nunca se imprime.
const ref = url.match(/postgres\.([a-z0-9]+):/)?.[1] || "desconocido";
console.log(`\n  entorno : ${target.toUpperCase()}`);
console.log(`  proyecto: ${ref}`);
console.log(`  modo    : ${apply ? "APLICAR (escribe en la base)" : "dry-run (no escribe nada)"}\n`);

const args = ["--yes", "supabase", "db", "push", "--db-url", url];
if (!apply) args.push("--dry-run");

const result = spawnSync("npx", args, { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
