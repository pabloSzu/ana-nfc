"use client";

// /admin/page.tsx is a server component (fetches clients/landings straight from Supabase), so
// it can't call the useSharedTheme() hook itself. These two small client components each hold
// their own instance of it — the button in the header, the backdrop behind everything — kept in
// sync with each other (and with the editor) via the shared localStorage key + the manual
// same-window "storage" dispatch in theme-scene.tsx.
import { ThemePickerButton, ThemeSceneLayer, useSharedTheme } from "./theme-scene";

export function AdminThemeButton() {
  const [theme, setTheme] = useSharedTheme();
  return <ThemePickerButton theme={theme} onChange={setTheme} />;
}

export function AdminThemeBackdrop() {
  const [theme] = useSharedTheme();
  return <ThemeSceneLayer theme={theme} fixed />;
}
