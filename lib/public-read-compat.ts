export type CompatibleReadError = { message: string };

type CompatibleRead<T> = {
  data: T | null;
  error: CompatibleReadError | null;
};

// Durante una migración de dos fases, el RPC nuevo puede no existir todavía. Solo en ese caso
// se consulta el esquema anterior. Un resultado null sin error es válido (página no publicada)
// y no debe caer al fallback, porque después del lockdown la lectura directa queda cerrada.
export async function readWithLegacyFallback<T>(
  readRpc: () => PromiseLike<CompatibleRead<T>>,
  readLegacy: () => PromiseLike<CompatibleRead<T>>,
) {
  const rpc = await readRpc();
  if (!rpc.error) return { data: rpc.data, rpcError: null, legacyError: null };

  const legacy = await readLegacy();
  return { data: legacy.data, rpcError: rpc.error, legacyError: legacy.error };
}
