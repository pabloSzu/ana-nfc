"use client";

import { createClient } from "@/lib/supabase/client";

// La foto de la mascota se sube directo del celular al storage (sin pasar por el servidor de la
// página, que la recibía y la volvía a mandar). Va a la carpeta de quien guarda: es la única donde
// la base le deja subir y la única que acepta al guardar (save_my_pet). Devuelve el nombre del
// archivo, o null si no se pudo.
export async function uploadPetPhoto(file: File, landingId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${userId}/${landingId}/logo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("landing-assets").upload(path, file, { contentType: file.type, upsert: false });
  return error ? null : path;
}
