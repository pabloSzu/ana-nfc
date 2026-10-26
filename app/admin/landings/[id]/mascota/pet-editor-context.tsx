"use client";

// Lo que comparten las piezas del editor de la chapita (pet-editor.tsx y sus pantallas): qué
// pantalla se muestra y el estado del editor (los datos, la foto, guardar).
import { createContext, useContext } from "react";
import type { PetData, PetFamily, PetSaveResult } from "@/lib/pet";

export type Panel = "pet" | "family" | "ficha" | "look" | "lost";
// Pasos opcionales después de publicar por primera vez.
// Solo cosas para completar: qué hacer si se pierde se muestra en Mis chapitas, junto al botón.
export type AfterStep = "ready" | "look" | "about" | "family" | "done";
export const AFTER_STEPS: AfterStep[] = ["look", "about", "family"];

// Qué pantalla se ve. Una sola variable: no hay combinaciones posibles entre pantallas.
//  · setup: los 3 pasos de la primera vez (foto, nombre, WhatsApp y publicar).
//  · after: "¡Ya funciona!", los pasos opcionales y el final con Compartir.
//  · spread: "Ahora, difundilo", al activar el modo perdido.
//  · menu: la miniatura y la lista de opciones.
//  · panel: la pantalla de una opción, con "Cancelar · Guardar".
export type Screen =
  | { name: "setup"; step: 0 | 1 | 2 }
  | { name: "after"; step: AfterStep }
  | { name: "spread" }
  | { name: "menu" }
  | { name: "panel"; panel: Panel };

export const TITLES: Record<Panel, { label: string; icon: string }> = {
  pet: { label: "Nombre y foto", icon: "🐶" },
  family: { label: "Contactos", icon: "📞" },
  ficha: { label: "Datos importantes", icon: "📋" },
  look: { label: "Diseño", icon: "🎨" },
  lost: { label: "Aviso de perdido", icon: "🚨" },
};
export const PANELS = Object.keys(TITLES) as Panel[];

export type EditorLanding = { id: string; slug: string; name: string; photoUrl: string; published: boolean; blocked?: boolean };

export type Editor = {
  landing: EditorLanding;
  isOwner: boolean;
  // Lo último guardado (con eso se compara, y "Cancelar" vuelve a eso).
  savedPet: PetData;
  pet: PetData;
  name: string;
  // El nombre para usar en textos ("tu mascota" si todavía no tiene).
  petName: string;
  photoUrl: string;
  dirty: boolean;
  saving: boolean;
  screen: Screen;
  go: (screen: Screen) => void;
  change: (patch: Partial<PetData>) => void;
  setName: (name: string) => void;
  about: (patch: Partial<PetData["about"]>) => void;
  health: (patch: Partial<PetData["health"]>) => void;
  setMember: (index: number, patch: Partial<PetFamily>) => void;
  photo: { preparing: boolean; error: string; pick: () => void; adjust: () => void; remove: () => void };
  // Guarda todo. quiet: sin el aviso de arriba (los pasos opcionales); pet: guarda estos datos en
  // vez de los actuales (y quedan como actuales). Devuelve la respuesta, o null si ya estaba
  // guardando.
  save: (options?: { quiet?: boolean; pet?: PetData }) => Promise<PetSaveResult | null>;
  // Primera publicación (el último paso, o "Publicar mi chapita" si quedó sin publicar).
  publish: () => Promise<void>;
  // La pantalla de una opción: "Guardar" guarda y vuelve al menú (o a "Ahora, difundilo" si se
  // activó el modo perdido); "Cancelar" vuelve sin guardar y, con cambios, pregunta antes.
  // patch: guarda con esto cambiado (lo usan "Activar aviso" y "Desactivar aviso").
  savePanel: (patch?: Partial<PetData>) => Promise<void>;
  cancelPanel: () => void;
  openBig: () => void;
  startTour: () => void;
};

const EditorContext = createContext<Editor | null>(null);
export const EditorProvider = EditorContext.Provider;

export function useEditor(): Editor {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("useEditor fuera del editor de la chapita");
  return editor;
}
