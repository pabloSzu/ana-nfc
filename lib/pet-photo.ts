import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_PATH = "/storage/v1/object/public/landing-assets/";

// El nombre que manda el editor después de subir la foto (ver lib/pet-photo-upload.ts): tiene
// que estar en la carpeta de quien guarda y ser de esta chapita.
export function validPetPhotoPath(path: string, userId: string, landingId: string): boolean {
  return path.startsWith(`${userId}/${landingId}/`) && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/logo-\d+\.(jpg|png|webp)$/.test(path);
}

// Al cambiar o sacar la foto, la anterior se borra del storage (si no, quedaban todas para
// siempre). Solo si es una foto de esta chapita y ninguna otra página la usa. Con la clave
// secreta: quien guarda puede no ser quien la subió (otro de la familia, o el Admin).
export async function deleteReplacedPetPhoto(oldUrl: string | null, newUrl: string, landingId: string) {
  if (!oldUrl || oldUrl === newUrl) return;
  const index = oldUrl.indexOf(BUCKET_PATH);
  if (index < 0) return;
  const path = decodeURIComponent(oldUrl.slice(index + BUCKET_PATH.length).split("?")[0]);
  if (path.split("/")[1] !== landingId || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/logo-\d+\.(jpg|jpeg|png|webp)$/.test(path)) return;
  try {
    const admin = createAdminClient();
    const { count } = await admin.from("landings").select("id", { count: "exact", head: true }).eq("logo_url", oldUrl);
    if (count) return;
    const { error } = await admin.storage.from("landing-assets").remove([path]);
    if (error) console.error("No se pudo borrar la foto anterior", { path, message: error.message });
  } catch (error) {
    console.error("No se pudo borrar la foto anterior", { path, error });
  }
}
