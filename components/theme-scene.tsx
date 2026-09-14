"use client";

import { useEffect, useRef, useState } from "react";

// Shared across editor-v2 (behind the phone) and /admin (behind the whole page) — a personal
// viewing preference for the app's OWN chrome, never the published landing, so it lives in
// localStorage under one key both screens read/write, instead of two separate pickers that
// could drift out of sync with each other.
const STORAGE_KEY = "app-theme";

export const THEME_OPTIONS: { id: string; label: string; swatch: string }[] = [
  { id: "default", label: "Clásico", swatch: "linear-gradient(135deg,#fff,#e4e5ec)" },
  { id: "aurora", label: "Aurora", swatch: "radial-gradient(circle at 30% 30%,#6851ff,#070811 70%)" },
  { id: "orbital", label: "Orbital", swatch: "radial-gradient(circle at center,#2a2f5c,#060710 70%)" },
  { id: "mesh", label: "Mesh", swatch: "radial-gradient(circle at 30% 30%,#8c75ff,#faf9ff 65%)" },
  { id: "digital", label: "Digital", swatch: "linear-gradient(180deg,#04050a,#1b2160)" },
];

export function useSharedTheme(): [string, (theme: string) => void] {
  const [theme, setTheme] = useState("default");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTheme(stored);
    } catch {}
    // Two open tabs (e.g. /admin in one, the editor in another) can each change the theme —
    // this keeps both in sync without a page reload. The native "storage" event only fires in
    // OTHER windows though, never the one that made the write (by design) — /admin can mount
    // more than one useSharedTheme() instance on the same page at once (the header button and
    // the full-page backdrop), so `change` below also dispatches one manually, letting every
    // instance in THIS window catch its own write too.
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY && e.newValue) setTheme(e.newValue); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function change(next: string) {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: next }));
    } catch {}
  }
  return [theme, change];
}

// The decorative animated pieces for a given theme — a plain, inert div for "default" (the
// caller's own background stays visible), otherwise a self-contained layer carrying both its
// own background (via CSS, keyed off data-theme) and its moving pieces. Meant to be the first
// child of any positioned container: `position:absolute` picks up that container's own bounds
// (used inside editor-v2's already-`position:relative` stage); pass `fixed` to cover the full
// viewport instead (used for /admin, which has no single "stage" element to anchor to).
export function ThemeSceneLayer({ theme, fixed = false }: { theme: string; fixed?: boolean }) {
  if (theme === "default") return null;
  return (
    <div className={`theme-scene${fixed ? " is-fixed" : ""}`} data-theme={theme} aria-hidden="true">
      {theme === "aurora" && <>
        <div className="theme-scene-blob theme-scene-blob-1" />
        <div className="theme-scene-blob theme-scene-blob-2" />
        <div className="theme-scene-blob theme-scene-blob-3" />
        <div className="theme-scene-blob theme-scene-blob-4" />
      </>}
      {theme === "orbital" && <>
        <div className="theme-scene-core" />
        <div className="theme-scene-orbit theme-scene-orbit-1" />
        <div className="theme-scene-orbit theme-scene-orbit-2" />
        <div className="theme-scene-orbit theme-scene-orbit-3" />
      </>}
      {theme === "mesh" && <>
        <div className="theme-scene-mesh-blobs" />
        <div className="theme-scene-mesh-grid" />
      </>}
      {theme === "digital" && <>
        <div className="theme-scene-glow" />
        <div className="theme-scene-horizon" />
        <div className="theme-scene-grid-plane" />
      </>}
    </div>
  );
}

// A small icon button that opens a swatch popover — the one place either screen offers to
// change the theme now (used to live buried inside the editor's Ajustes panel).
export function ThemePickerButton({ theme, onChange, className = "" }: { theme: string; onChange: (theme: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  return (
    <div className={`theme-picker ${className}`} ref={ref}>
      <button type="button" className="theme-picker-trigger" title="Tema de fondo" aria-label="Tema de fondo" onClick={() => setOpen((v) => !v)}>🎨</button>
      {open && (
        <div className="theme-picker-pop">
          <p>Tema de fondo</p>
          <div className="theme-picker-grid">
            {THEME_OPTIONS.map((option) => (
              <button type="button" key={option.id} className={theme === option.id ? "active" : ""} onClick={() => { onChange(option.id); setOpen(false); }}>
                <span className="theme-picker-swatch" style={{ background: option.swatch }} />
                <b>{option.label}</b>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
