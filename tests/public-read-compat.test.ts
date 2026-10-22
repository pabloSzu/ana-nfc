import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readWithLegacyFallback } from "../lib/public-read-compat.ts";

describe("lectura compatible durante la migración", () => {
  it("usa el RPC nuevo sin consultar el esquema anterior", async () => {
    let legacyCalls = 0;
    const result = await readWithLegacyFallback(
      async () => ({ data: "nuevo", error: null }),
      async () => { legacyCalls += 1; return { data: "viejo", error: null }; },
    );
    assert.equal(result.data, "nuevo");
    assert.equal(legacyCalls, 0);
  });

  it("un null válido del RPC no intenta la lectura directa", async () => {
    let legacyCalls = 0;
    const result = await readWithLegacyFallback<string>(
      async () => ({ data: null, error: null }),
      async () => { legacyCalls += 1; return { data: "privado", error: null }; },
    );
    assert.equal(result.data, null);
    assert.equal(legacyCalls, 0);
  });

  it("usa el esquema anterior mientras el RPC todavía no existe", async () => {
    const result = await readWithLegacyFallback(
      async () => ({ data: null, error: { message: "función inexistente" } }),
      async () => ({ data: "viejo", error: null }),
    );
    assert.equal(result.data, "viejo");
    assert.equal(result.rpcError?.message, "función inexistente");
    assert.equal(result.legacyError, null);
  });

  it("conserva ambos errores para poder diagnosticarlos", async () => {
    const result = await readWithLegacyFallback<string>(
      async () => ({ data: null, error: { message: "falló RPC" } }),
      async () => ({ data: null, error: { message: "falló lectura anterior" } }),
    );
    assert.equal(result.data, null);
    assert.equal(result.rpcError?.message, "falló RPC");
    assert.equal(result.legacyError?.message, "falló lectura anterior");
  });
});
